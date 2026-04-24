/**
 * One-off: load JSON files from data/statblocks/*.json into Upstash Redis.
 * Requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN (e.g. from .env.local).
 *
 * Usage: node scripts/migrate-statblocks-to-redis.mjs
 */
import { Redis } from '@upstash/redis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

function loadDotenv() {
  const p = path.join(root, '.env.local');
  if (!fs.existsSync(p)) return;
  const raw = fs.readFileSync(p, 'utf8');
  for (const line of raw.split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    let val = m[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[m[1]]) process.env[m[1]] = val;
  }
}

loadDotenv();

function slugifyStatblockId(baseId) {
  return (
    String(baseId)
      .replace(/[^a-z0-9-_]/gi, '-')
      .replace(/-+/g, '-')
      .toLowerCase() || 'statblock'
  );
}

const prefix = process.env.REDIS_KEY_PREFIX || '';

function keyStatblock(id) {
  return `${prefix}statblock:${id}`;
}

function keyStatblockIndex() {
  return `${prefix}statblock:index`;
}

async function main() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.error('Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN');
    process.exit(1);
  }

  const redis = Redis.fromEnv();
  const dir = path.join(root, 'data', 'statblocks');
  if (!fs.existsSync(dir)) {
    console.error('No directory:', dir);
    process.exit(1);
  }

  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
  let n = 0;
  for (const f of files) {
    const raw = fs.readFileSync(path.join(dir, f), 'utf8');
    if (!raw.trim()) continue;
    const data = JSON.parse(raw);
    const id = slugifyStatblockId(data.id || path.basename(f, '.json'));
    const payload = { ...data, id };
    await redis.set(keyStatblock(id), JSON.stringify(payload));
    await redis.sadd(keyStatblockIndex(), id);
    console.log('Migrated', id);
    n++;
  }
  console.log('Done.', n, 'stat blocks.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
