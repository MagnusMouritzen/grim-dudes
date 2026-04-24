/**
 * Migrate legacy string-shaped `weapons` / `armour` fields to the modern
 * structured shapes. A legacy string `weapons` is moved to a `notes` field
 * (appending, not replacing); legacy `armour` strings are dropped.
 *
 * Runs once per environment and is idempotent.
 *
 * Usage:
 *   tsx scripts/normalise-statblocks.ts            # write changes
 *   tsx scripts/normalise-statblocks.ts --dry-run  # report only
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadDotenvLocal, requireUpstashEnv } from './_env.ts';
import { listStatblocks, saveStatblock, type StatblockRecord } from '../src/lib/statblockRedis.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

type Legacy = StatblockRecord & {
  weapons?: unknown;
  armour?: unknown;
  notes?: string;
};

function needsUpdate(b: Legacy): boolean {
  return typeof b.weapons === 'string' || typeof b.armour === 'string';
}

async function main(): Promise<void> {
  loadDotenvLocal(root);
  requireUpstashEnv();

  const DRY = process.argv.slice(2).includes('--dry-run');
  const all = (await listStatblocks()) as Legacy[];
  const todo = all.filter(needsUpdate);

  console.log(`Total stat blocks:   ${all.length}`);
  console.log(`Need normalisation:  ${todo.length}`);

  for (const b of todo) {
    const updates: Partial<Legacy> = {};
    const noteParts: string[] = [];
    if (typeof b.notes === 'string' && b.notes.trim()) noteParts.push(b.notes.trim());
    if (typeof b.weapons === 'string' && b.weapons.trim()) {
      noteParts.push(`Weapons: ${b.weapons.trim()}`);
      updates.weapons = undefined;
    }
    if (typeof b.armour === 'string' && b.armour.trim()) {
      noteParts.push(`Armour: ${b.armour.trim()}`);
      updates.armour = undefined;
    }
    if (typeof b.weapons === 'string' && !b.weapons.trim()) updates.weapons = undefined;
    if (typeof b.armour === 'string' && !b.armour.trim()) updates.armour = undefined;
    if (noteParts.length) updates.notes = noteParts.join('\n');

    const next: Legacy = { ...b, ...updates };
    // Strip explicitly-undefined props so JSON.stringify drops them.
    for (const [k, v] of Object.entries(next)) {
      if (v === undefined) delete (next as Record<string, unknown>)[k];
    }

    console.log(`- ${b.id}: ${noteParts.join(' | ') || '(dropped empty legacy field)'}`);

    if (!DRY) {
      await saveStatblock(next as StatblockRecord);
    }
  }

  console.log(DRY ? '[dry-run] no writes performed.' : 'Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
