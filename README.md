# Grim Dudes

An interactive editor for creating and viewing **Warhammer Fantasy Roleplay 4th Edition** stat blocks.

The **current app** is **Next.js 15** (App Router, TypeScript, Tailwind) and is intended to deploy on **[Vercel](https://vercel.com)** with **[Upstash Redis](https://upstash.com)** for stat block storage. The JSON API matches the legacy Express routes (`/api/statblocks`, reference data under `/api/skills`, etc.).

Created with Cursor.ai.

## What you need

- **Node.js** (v20 LTS recommended) — [nodejs.org](https://nodejs.org)
- **npm** (comes with Node)
- **Upstash Redis** — REST URL and token for stat block CRUD (local and production)

Bundled reference data (skills, traits, weapons, templates, …) lives under **`data/`** at the repo root (copied from the old `server/data` layout).

## Environment

Copy `.env.example` to `.env.local` and set:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

Optional:

- `REDIS_KEY_PREFIX` — e.g. `preview:` so Preview deployments do not share keys with Production.

On Vercel, add the same variables in **Project → Settings → Environment Variables** (use different Upstash databases or prefixes for Preview vs Production if you want isolated data).

## Run the project (Next.js)

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure `.env.local` (see above).

3. Development server:

   ```bash
   npm run dev
   ```

4. Open **http://localhost:3000**.

### Production build locally

```bash
npm run build
npm start
```

## Migrate JSON stat blocks into Redis

If you have files under `data/statblocks/*.json` (or legacy `server/data/statblocks/`), load them into Upstash once:

```bash
npm run migrate:statblocks
```

The script reads `.env.local` and writes each file with `SET` plus index membership, using the same slug rules as the API.

## Scripts (root)

| Script | Description |
|--------|-------------|
| `npm run dev` | Next.js dev server (port 3000). |
| `npm run build` | Production build. |
| `npm run start` | Run production server after `build`. |
| `npm test` | Vitest (stat block helpers). |
| `npm run migrate:statblocks` | One-off: JSON files → Redis. |

## Project layout

- **`app/`** — App Router pages and **`app/api/*`** route handlers.
- **`src/components/`** — Client UI (ported from the old Vite app).
- **`src/lib/`** — Redis access, validation (Zod), reference data readers, stat block utilities.
- **`data/`** — Bundled JSON (skills, traits, weapons, armour, careers, templates, sample stat blocks for migration).

## Legacy stack (`client/` + `server/`)

The original **Vite + Express** app is still in the repo for reference:

- **`server/`** — Express API and former file-based stat blocks under `server/data/`.
- **`client/`** — React (Vite); dev server on 5173 with `/api` proxy to port 3000.

Use the root **`npm`** scripts above for the Next.js app; the legacy app used separate `npm install` in `client/` and `server/` and different root scripts (see git history if you need them).

## Stat block format

Each stat block in Redis (or a `.json` file under `data/statblocks/`) is a JSON object. Common fields:

- `id`, `name`
- `characteristics`: for plain NPCs, each of `WS`, `BS`, `S`, `T`, `I`, `Ag`, `Dex`, `Int`, `WP`, `Fel` is a **number**. For template-based PCs/creatures, each can instead be `{ "base": number, "advances": number, "addition": number }` plus optional `templateId` and `randomiseCharacteristics`.
- `size` — e.g. `Average` (used with characteristics to derive wounds in the UI).
- `wounds`, `movement` — numbers; `wounds` is kept in sync with the trait-aware formula when saved from the editor.
- `skills`: `[{ "name": string, "advances": number }, ...]`
- `talents`: array of strings
- `traits`: array of trait names as strings, or `{ "name": string, "inputValue"?: string }` when a trait needs a value (see `data/traits.json`).
- `tags`: optional string array for bestiary search/filter (comma-separated in the editor).
- `careers`: optional `[{ "className", "careerName", "level" }, ...]`
- `weapons`: either a **string** (legacy free text) or `{ "melee": [...], "ranged": [...] }` with `{ "category", "name", "ammunition"? }` entries matching `data/weapons/`.
- `armour`: either a **string** (legacy) or an array of `{ "category", "name" }` matching `data/armour/`.

Reference data:

- `data/skills.json` — skills and their linked characteristic.
- `data/traits.json` — trait names, descriptions, and optional mechanical `effects`.

Example stat blocks: `data/statblocks/human-thug.json`, `data/statblocks/dog.json`.
