/**
 * Remove index entries whose statblock value is missing or unparsable.
 * Use after a partial failure if the index gets out of sync.
 *
 * Usage:
 *   tsx scripts/cleanup-orphan-statblocks.ts
 *   tsx scripts/cleanup-orphan-statblocks.ts --dry-run
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadDotenvLocal, requireUpstashEnv } from './_env.ts';
import { cleanupOrphans, listStatblocks } from '../src/lib/statblockRedis.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

async function main(): Promise<void> {
  loadDotenvLocal(root);
  requireUpstashEnv();

  const DRY = process.argv.slice(2).includes('--dry-run');
  if (DRY) {
    const blocks = await listStatblocks();
    console.log(`Alive records: ${blocks.length}`);
    console.log('[dry-run] skipping cleanup. Re-run without --dry-run to prune.');
    return;
  }
  const res = await cleanupOrphans();
  console.log(`Alive records: ${res.kept}`);
  console.log(
    `Removed ${res.removed.length} orphan${res.removed.length === 1 ? '' : 's'}${
      res.removed.length ? `: ${res.removed.join(', ')}` : ''
    }`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
