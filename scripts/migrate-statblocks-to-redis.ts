/**
 * One-off: load JSON files from data/statblocks/*.json into Upstash Redis.
 * Requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN (e.g. from .env.local).
 *
 * Usage:
 *   tsx scripts/migrate-statblocks-to-redis.ts            # additive upload
 *   tsx scripts/migrate-statblocks-to-redis.ts --prune    # also delete Redis entries missing from data/
 *   tsx scripts/migrate-statblocks-to-redis.ts --dry-run  # report only
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadDotenvLocal, requireUpstashEnv } from './_env.ts';
import { getRedis } from '../src/lib/redis.ts';
import {
  keyStatblock,
  keyStatblockIndex,
  slugifyStatblockId,
  redisPrefix,
} from '../src/lib/statblockKeys.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

type DiskRecord = { id: string; payload: Record<string, unknown> & { id: string } };

async function main(): Promise<void> {
  loadDotenvLocal(root);
  requireUpstashEnv();

  const args = new Set(process.argv.slice(2));
  const PRUNE = args.has('--prune');
  const DRY = args.has('--dry-run');

  const redis = getRedis();
  const modernDir = path.join(root, 'data', 'seed', 'statblocks');
  const legacyDir = path.join(root, 'data', 'statblocks');
  const dir = fs.existsSync(modernDir)
    ? modernDir
    : fs.existsSync(legacyDir)
      ? legacyDir
      : null;
  if (!dir) {
    console.error('No seed directory found at', modernDir, 'or', legacyDir);
    process.exit(1);
  }

  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
  const diskRecords: DiskRecord[] = [];
  for (const f of files) {
    const raw = fs.readFileSync(path.join(dir, f), 'utf8');
    if (!raw.trim()) continue;
    const data = JSON.parse(raw) as { id?: string };
    const id = slugifyStatblockId(data.id || path.basename(f, '.json'));
    diskRecords.push({ id, payload: { ...data, id } as DiskRecord['payload'] });
  }

  const seen = new Set<string>();
  const deduped = diskRecords.filter((r) => {
    if (seen.has(r.id)) {
      console.warn(`Duplicate slug '${r.id}' - keeping first occurrence`);
      return false;
    }
    seen.add(r.id);
    return true;
  });

  const prefix = redisPrefix() || '(none)';
  console.log(`Prefix: ${prefix}`);
  console.log(`Found ${deduped.length} stat block${deduped.length === 1 ? '' : 's'} in ${dir}`);

  if (!DRY) {
    const writes = deduped.map(async (r) => {
      const pipeline = redis.pipeline();
      pipeline.set(keyStatblock(r.id), JSON.stringify(r.payload));
      pipeline.sadd(keyStatblockIndex(), r.id);
      await pipeline.exec();
    });
    await Promise.all(writes);
    console.log(`Uploaded ${deduped.length} stat blocks.`);
  } else {
    console.log(`[dry-run] would upload ${deduped.length} stat blocks.`);
  }

  if (PRUNE) {
    const indexed = await redis.smembers(keyStatblockIndex());
    const toRemove = indexed.filter((id) => !seen.has(id));
    if (toRemove.length === 0) {
      console.log('Prune: no stale entries.');
    } else {
      console.log(`Prune: ${toRemove.length} stale id(s): ${toRemove.join(', ')}`);
      if (!DRY) {
        const pipeline = redis.pipeline();
        toRemove.forEach((id) => {
          pipeline.del(keyStatblock(id));
          pipeline.srem(keyStatblockIndex(), id);
        });
        await pipeline.exec();
        console.log(`Removed ${toRemove.length} stale stat block(s).`);
      }
    }
  }

  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
