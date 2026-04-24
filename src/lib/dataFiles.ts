import fs from 'fs';
import path from 'path';

export const DATA_DIR = path.join(process.cwd(), 'data');

export function readJson<T>(...segments: string[]): T {
  const p = path.join(DATA_DIR, ...segments);
  const raw = fs.readFileSync(p, 'utf8');
  return JSON.parse(raw) as T;
}

export function templateDir(): string {
  return path.join(DATA_DIR, 'templates');
}

export function listTemplateFilenames(): string[] {
  const dir = templateDir();
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
}

export function slugifyForFilename(id: string): string {
  const safe = id.replace(/[^a-z0-9-_]/gi, '-').replace(/-+/g, '-').toLowerCase();
  return safe ? `${safe}.json` : 'statblock.json';
}
