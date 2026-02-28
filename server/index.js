import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const SKILLS_FILE = path.join(DATA_DIR, 'skills.json');
const TRAITS_FILE = path.join(DATA_DIR, 'traits.json');

const app = express();
app.use(cors());
app.use(express.json({ limit: '256kb' }));

// Serve built React app in production
const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
}

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function listStatBlockFiles() {
  if (!fs.existsSync(DATA_DIR)) return [];
  return fs
    .readdirSync(DATA_DIR)
    .filter(
      (f) =>
        f.endsWith('.json') &&
        f !== path.basename(SKILLS_FILE) &&
        f !== path.basename(TRAITS_FILE)
    );
}

function idToFilename(id) {
  const safe = id.replace(/[^a-z0-9-_]/gi, '-').replace(/-+/g, '-').toLowerCase();
  return safe ? `${safe}.json` : 'statblock.json';
}

// GET /api/statblocks — list all
app.get('/api/statblocks', (req, res) => {
  try {
    const files = listStatBlockFiles();
    const blocks = files.map((f) => {
      const raw = fs.readFileSync(path.join(DATA_DIR, f), 'utf8');
      const data = JSON.parse(raw);
      return { id: data.id || path.basename(f, '.json'), name: data.name || 'Unnamed', ...data };
    });
    res.json(blocks);
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
        const data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf8'));
        return (data.id || path.basename(f, '.json')) === id;
      } catch { return false; }
    });
    const file = byId || byName;
    if (!file) return res.status(404).json({ error: 'Not found' });
    const raw = fs.readFileSync(path.join(DATA_DIR, file), 'utf8');
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
    const id = (body.name || 'statblock').replace(/[^a-z0-9-_]/gi, '-').replace(/-+/g, '-').toLowerCase() || 'statblock';
    const filename = idToFilename(id);
    const filepath = path.join(DATA_DIR, filename);
    const payload = { id, ...body };
    fs.writeFileSync(filepath, JSON.stringify(payload, null, 2), 'utf8');
    res.status(201).json(payload);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save stat block' });
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

// SPA fallback
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  const index = path.join(clientDist, 'index.html');
  if (fs.existsSync(index)) res.sendFile(index);
  else next();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Grim Dudes server on http://localhost:${PORT}`));
