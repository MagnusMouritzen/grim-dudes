import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const STATBLOCKS_DIR = path.join(DATA_DIR, 'statblocks');
const TEMPLATES_DIR = path.join(DATA_DIR, 'templates');
const WEAPONS_DIR = path.join(DATA_DIR, 'weapons');
const ARMOUR_DIR = path.join(DATA_DIR, 'armour');
const SKILLS_FILE = path.join(DATA_DIR, 'skills.json');
const TRAITS_FILE = path.join(DATA_DIR, 'traits.json');
const CAREERS_FILE = path.join(DATA_DIR, 'careers.json');

const app = express();
app.use(cors());
app.use(express.json({ limit: '256kb' }));

// Serve built React app in production
const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
}

// Ensure data directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(STATBLOCKS_DIR)) {
  fs.mkdirSync(STATBLOCKS_DIR, { recursive: true });
}
if (!fs.existsSync(TEMPLATES_DIR)) {
  fs.mkdirSync(TEMPLATES_DIR, { recursive: true });
}

// One-time migration: move legacy stat block JSONs from DATA_DIR into STATBLOCKS_DIR
try {
  const legacyFiles = fs
    .readdirSync(DATA_DIR)
    .filter(
      (f) =>
        f.endsWith('.json') &&
        f !== path.basename(SKILLS_FILE) &&
        f !== path.basename(TRAITS_FILE) &&
        f !== path.basename(CAREERS_FILE)
    );
  legacyFiles.forEach((f) => {
    const from = path.join(DATA_DIR, f);
    const to = path.join(STATBLOCKS_DIR, f);
    if (!fs.existsSync(to)) {
      try {
        fs.renameSync(from, to);
      } catch (err) {
        // If rename fails for any reason, log and continue without crashing
        console.error('Failed to migrate statblock file', from, err);
      }
    }
  });
} catch (err) {
  console.error('Failed migrating legacy statblock files', err);
}

function listStatBlockFiles() {
  if (!fs.existsSync(STATBLOCKS_DIR)) return [];
  return fs.readdirSync(STATBLOCKS_DIR).filter((f) => f.endsWith('.json'));
}

function idToFilename(id) {
  const safe = id.replace(/[^a-z0-9-_]/gi, '-').replace(/-+/g, '-').toLowerCase();
  return safe ? `${safe}.json` : 'statblock.json';
}

// GET /api/statblocks — list all
app.get('/api/statblocks', (req, res) => {
  try {
    const files = listStatBlockFiles();
    const blocks = [];
    for (const f of files) {
      try {
        const raw = fs.readFileSync(path.join(STATBLOCKS_DIR, f), 'utf8');
        if (!raw.trim()) continue;
        const data = JSON.parse(raw);
        blocks.push({ id: data.id || path.basename(f, '.json'), name: data.name || 'Unnamed', ...data });
      } catch (err) {
        console.error(`Skipping invalid statblock ${f}:`, err.message);
      }
    }
    res.json(Array.isArray(blocks) ? blocks : []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to list stat blocks' });
  }
});

// GET /api/statblocks/:id — get one
app.get('/api/statblocks/:id', (req, res) => {
  try {
    const files = listStatBlockFiles();
    const id = req.params.id;
    const byId = files.find((f) => path.basename(f, '.json') === id);
    const byName = files.find((f) => {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(STATBLOCKS_DIR, f), 'utf8'));
        return (data.id || path.basename(f, '.json')) === id;
      } catch { return false; }
    });
    const file = byId || byName;
    if (!file) return res.status(404).json({ error: 'Not found' });
    const raw = fs.readFileSync(path.join(STATBLOCKS_DIR, file), 'utf8');
    const data = JSON.parse(raw);
    res.json({ id: data.id || path.basename(file, '.json'), ...data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load stat block' });
  }
});

// POST /api/statblocks — create or overwrite
app.post('/api/statblocks', (req, res) => {
  try {
    const body = req.body;
    const baseId = body.id || body.name || 'statblock';
    const id =
      baseId.replace(/[^a-z0-9-_]/gi, '-').replace(/-+/g, '-').toLowerCase() || 'statblock';
    const filename = idToFilename(id);
    const filepath = path.join(STATBLOCKS_DIR, filename);
    const payload = { id, ...body };
    fs.writeFileSync(filepath, JSON.stringify(payload, null, 2), 'utf8');
    res.status(201).json(payload);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save stat block' });
  }
});

// DELETE /api/statblocks/:id — delete one
app.delete('/api/statblocks/:id', (req, res) => {
  try {
    const id = req.params.id;
    const filename = idToFilename(id);
    const filepath = path.join(STATBLOCKS_DIR, filename);
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: 'Not found' });
    }
    fs.unlinkSync(filepath);
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete stat block' });
  }
});

function loadJsonArray(filePath) {
  try {
    if (!fs.existsSync(filePath)) return [];
    const raw = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error(`Failed to load JSON from ${filePath}`, err);
    return [];
  }
}

function loadJson(filePath, defaultValue = null) {
  try {
    if (!fs.existsSync(filePath)) return defaultValue;
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Failed to load JSON from ${filePath}`, err);
    return defaultValue;
  }
}

// Reference data: skills
app.get('/api/skills', (req, res) => {
  const skills = loadJsonArray(SKILLS_FILE);
  res.json(skills);
});

// Reference data: traits
app.get('/api/traits', (req, res) => {
  const traits = loadJsonArray(TRAITS_FILE);
  res.json(traits);
});

// Weapons reference (qualities, melee, ranged, ammunition)
app.get('/api/weapons', (req, res) => {
  try {
    const qualitiesAndFlaws = loadJsonArray(path.join(WEAPONS_DIR, 'qualities-and-flaws.json'));
    const melee = loadJson(path.join(WEAPONS_DIR, 'melee-weapons.json'), { categories: [] });
    const ranged = loadJson(path.join(WEAPONS_DIR, 'ranged-weapons.json'), { categories: [] });
    const ammunition = loadJson(path.join(WEAPONS_DIR, 'ammunition.json'), { categories: [] });
    res.json({ qualitiesAndFlaws, melee, ranged, ammunition });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load weapons' });
  }
});

// Armour reference (qualities, armour by category)
app.get('/api/armour', (req, res) => {
  try {
    const qualitiesAndFlaws = loadJsonArray(path.join(ARMOUR_DIR, 'qualities-and-flaws.json'));
    const armour = loadJson(path.join(ARMOUR_DIR, 'armour.json'), { categories: [] });
    res.json({ qualitiesAndFlaws, armour });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load armour' });
  }
});

// Careers reference (classes, careers, levels)
app.get('/api/careers', (req, res) => {
  try {
    const careers = loadJson(CAREERS_FILE, { classes: [] });
    res.json(careers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load careers' });
  }
});

// Templates
app.get('/api/templates', (req, res) => {
  try {
    if (!fs.existsSync(TEMPLATES_DIR)) return res.json([]);
    const files = fs.readdirSync(TEMPLATES_DIR).filter((f) => f.endsWith('.json'));
    const templates = files.map((f) => {
      const raw = fs.readFileSync(path.join(TEMPLATES_DIR, f), 'utf8');
      const data = JSON.parse(raw);
      return { id: data.id || path.basename(f, '.json'), name: data.name || 'Template', ...data };
    });
    res.json(templates);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load templates' });
  }
});

// GET /api/templates/:id — get one template
app.get('/api/templates/:id', (req, res) => {
  try {
    if (!fs.existsSync(TEMPLATES_DIR)) return res.status(404).json({ error: 'Not found' });
    const id = req.params.id;
    const filename = idToFilename(id);
    const filepath = path.join(TEMPLATES_DIR, filename);
    if (!fs.existsSync(filepath)) {
      const files = fs.readdirSync(TEMPLATES_DIR).filter((f) => f.endsWith('.json'));
      const byId = files.find((f) => {
        try {
          const data = JSON.parse(fs.readFileSync(path.join(TEMPLATES_DIR, f), 'utf8'));
          return (data.id || path.basename(f, '.json')) === id;
        } catch { return false; }
      });
      if (!byId) return res.status(404).json({ error: 'Not found' });
      const raw = fs.readFileSync(path.join(TEMPLATES_DIR, byId), 'utf8');
      const data = JSON.parse(raw);
      return res.json({ id: data.id || path.basename(byId, '.json'), ...data });
    }
    const raw = fs.readFileSync(filepath, 'utf8');
    const data = JSON.parse(raw);
    res.json({ id: data.id || path.basename(filename, '.json'), ...data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load template' });
  }
});

// SPA fallback
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  const index = path.join(clientDist, 'index.html');
  if (fs.existsSync(index)) res.sendFile(index);
  else next();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Grim Dudes server on http://localhost:${PORT}`));
