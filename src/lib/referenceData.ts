import fs from 'fs';
import path from 'path';
import { DATA_DIR, listTemplateFilenames, slugifyForFilename, templateDir } from './dataFiles';

function loadJsonArray(...segments: string[]): unknown[] {
  const p = path.join(DATA_DIR, ...segments);
  const raw = fs.readFileSync(p, 'utf8');
  const data = JSON.parse(raw);
  return Array.isArray(data) ? data : [];
}

function loadJson<T>(defaultValue: T, ...segments: string[]): T {
  const p = path.join(DATA_DIR, ...segments);
  if (!fs.existsSync(p)) return defaultValue;
  const raw = fs.readFileSync(p, 'utf8');
  return JSON.parse(raw) as T;
}

export function getSkills() {
  return loadJsonArray('skills.json');
}

export function getTraits() {
  return loadJsonArray('traits.json');
}

export function getWeaponsBundle() {
  return {
    qualitiesAndFlaws: loadJsonArray('weapons', 'qualities-and-flaws.json'),
    melee: loadJson({ categories: [] }, 'weapons', 'melee-weapons.json'),
    ranged: loadJson({ categories: [] }, 'weapons', 'ranged-weapons.json'),
    ammunition: loadJson({ categories: [] }, 'weapons', 'ammunition.json'),
  };
}

export function getArmourBundle() {
  return {
    qualitiesAndFlaws: loadJsonArray('armour', 'qualities-and-flaws.json'),
    armour: loadJson({ categories: [] }, 'armour', 'armour.json'),
  };
}

export function getCareers() {
  return loadJson({ classes: [] }, 'careers.json');
}

export function listTemplates() {
  const files = listTemplateFilenames();
  return files.map((f) => {
    const raw = fs.readFileSync(path.join(templateDir(), f), 'utf8');
    const data = JSON.parse(raw) as Record<string, unknown>;
    return { id: data.id || path.basename(f, '.json'), name: data.name || 'Template', ...data };
  });
}

export function getTemplateById(id: string): Record<string, unknown> | null {
  if (!fs.existsSync(templateDir())) return null;
  const filename = slugifyForFilename(id);
  const filepath = path.join(templateDir(), filename);
  if (fs.existsSync(filepath)) {
    const raw = fs.readFileSync(filepath, 'utf8');
    const data = JSON.parse(raw) as Record<string, unknown>;
    return { id: data.id || path.basename(filename, '.json'), ...data };
  }
  const files = listTemplateFilenames();
  const byId = files.find((f) => {
    try {
      const raw = fs.readFileSync(path.join(templateDir(), f), 'utf8');
      const data = JSON.parse(raw) as { id?: string };
      return (data.id || path.basename(f, '.json')) === id;
    } catch {
      return false;
    }
  });
  if (!byId) return null;
  const raw = fs.readFileSync(path.join(templateDir(), byId), 'utf8');
  const data = JSON.parse(raw) as Record<string, unknown>;
  return { id: data.id || path.basename(byId, '.json'), ...data };
}
