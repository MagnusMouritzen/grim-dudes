import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const REPO_ROOT = resolve(__dirname, '../..');
const VERCEL_JSON = join(REPO_ROOT, 'vercel.json');
const APP_DIR = join(REPO_ROOT, 'app');

/** Walk directory for .ts / .tsx files (skip node_modules if any). */
function walkSourceFiles(dir: string): string[] {
  const out: string[] = [];
  let entries: ReturnType<typeof readdirSync>;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules') continue;
      out.push(...walkSourceFiles(p));
    } else if (e.isFile() && (e.name.endsWith('.ts') || e.name.endsWith('.tsx'))) {
      out.push(p);
    }
  }
  return out;
}

const MAX_DURATION_RE = /export\s+const\s+maxDuration\s*=\s*(\d+)/g;

describe('Vercel Hobby plan compatibility', () => {
  const vercel = JSON.parse(readFileSync(VERCEL_JSON, 'utf8')) as {
    regions?: string[];
    crons?: { path: string; schedule: string }[];
  };

  it('uses at most one region', () => {
    expect((vercel.regions ?? []).length).toBeLessThanOrEqual(1);
  });

  it('has at most 100 cron jobs per project', () => {
    expect((vercel.crons ?? []).length).toBeLessThanOrEqual(100);
  });

  it('all crons run at most once per day (Hobby daily minimum)', () => {
    for (const c of vercel.crons ?? []) {
      const parts = c.schedule.trim().split(/\s+/);
      expect(parts.length).toBe(5);
      const [m, h, dom, mon, dow] = parts;
      expect(/^\d+$/.test(m), `minute must be a literal number in "${c.schedule}"`).toBe(true);
      expect(/^\d+$/.test(h), `hour must be a literal number in "${c.schedule}"`).toBe(true);
      expect([dom, mon, dow].every((f) => f === '*'), `day-of-month, month, weekday must be * in "${c.schedule}"`).toBe(
        true
      );
    }
  });

  it('every maxDuration in app/ is <= 60 (Hobby legacy hard ceiling)', () => {
    const files = walkSourceFiles(APP_DIR);
    const violations: { file: string; value: number }[] = [];
    for (const file of files) {
      const src = readFileSync(file, 'utf8');
      MAX_DURATION_RE.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = MAX_DURATION_RE.exec(src)) !== null) {
        const value = Number(m[1]);
        if (value > 60) violations.push({ file, value });
      }
    }
    expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
  });
});
