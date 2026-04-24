# Grim Dudes

An interactive editor for creating and viewing **Warhammer Fantasy Roleplay 4th Edition** stat blocks.

Built as a **Next.js 15** App Router app (TypeScript + Tailwind), deployable on **Vercel**, backed by **[Upstash Redis](https://upstash.com)** for stat block storage. Created with Cursor.ai.

## Requirements

- **Node.js 20+** ([nodejs.org](https://nodejs.org))
- **Upstash Redis** REST URL and token (for stat block CRUD - local and production)

Bundled reference data (skills, traits, weapons, armour, careers, templates) lives under `data/` at the repo root.

## Environment

Copy `.env.example` to `.env.local` and fill in:

| Variable | Required | Purpose |
|----------|----------|---------|
| `UPSTASH_REDIS_REST_URL` | yes | Upstash REST endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | yes | Upstash REST token |
| `REDIS_KEY_PREFIX` | no | e.g. `preview:` to isolate environments |
| `WRITE_TOKEN` | optional | Shared secret for create/update/delete. If unset, writes are open (dev default) |
| `RATE_LIMIT_WRITES_PER_MIN` | no | Override the 30/min default |

On Vercel, add the same vars in **Project -> Settings -> Environment Variables**, one set per environment (Production / Preview / Development).

When `WRITE_TOKEN` is set, the editor UI reads the token from browser `localStorage`. Open `/admin`, paste the token, and save. It is sent as `x-write-token` on write requests.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
```

Production build locally:

```bash
npm run build && npm start
```

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Next dev server |
| `npm run build` | Production build |
| `npm start` | Run production build |
| `npm run lint` | ESLint (`next lint`) |
| `npm test` | Vitest (lib + route handlers) |
| `npm run migrate:statblocks` | Seed Redis from `data/statblocks/*.json` |
| `npm run migrate:statblocks -- --prune` | Also delete Redis entries missing from disk |
| `npm run migrate:statblocks -- --dry-run` | Report only |
| `npm run cleanup:orphans` | Remove phantom index entries |

## API shape

- `GET /api/statblocks` - full list (array)
- `GET /api/statblocks?cursor=0&limit=100` - paginated (`{ items, nextCursor }`)
- `POST /api/statblocks` - create/overwrite (write-auth + rate-limited)
- `GET /api/statblocks/:id` - one by id (404 on miss; `?legacy=1` triggers a legacy fallback scan)
- `PUT /api/statblocks/:id` - update at canonical slug
- `DELETE /api/statblocks/:id` - delete (write-auth + rate-limited)
- `GET /api/skills | traits | weapons | armour | careers | templates[/:id]` - bundled reference data
- `POST /api/sharepacks` (body: `{ ids: string[] }`) - creates a short id so long selections can be shared via `/view?pack=<id>`
- `GET /api/sharepacks/:id` - resolve back to `{ ids }`
- `GET /api/healthz` - `{ ok, redis, writeAuth, region, env }` for uptime checks

## Migrating JSON to Redis

If you have files under `data/statblocks/*.json`, seed Upstash once:

```bash
npm run migrate:statblocks
```

To also delete stale Redis entries that are no longer on disk:

```bash
npm run migrate:statblocks -- --prune
```

## Troubleshooting

- **503 on list/save** with `Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN`: set them in `.env.local` (local) or Project Settings (Vercel).
- **Editor shows "Not authorised - set a write token in /admin"**: `WRITE_TOKEN` is set on the deploy. Open `/admin` and paste the token.
- **Bestiary shows a phantom entry**: run `npm run cleanup:orphans`.
- **Reset Redis completely**: from your Upstash dashboard use the "flush database" action, then `npm run migrate:statblocks`. Alternatively, target a prefix by running a small script that `SREM`s every member of `<prefix>statblock:index` and `DEL`s the matching `<prefix>statblock:<id>` keys.

## Project layout

```
app/                 Next.js App Router routes and route handlers
  api/*              JSON endpoints
  admin/             Token entry for write-auth
src/components/      Client UI (ported from the Vite app)
src/lib/             Redis access, Zod validation, domain types, motion helpers
data/                Bundled JSON reference + sample stat blocks
scripts/             Migration + cleanup helpers
```

## Stat block format

Each stat block in Redis (or a `.json` file under `data/statblocks/`) is a JSON object. Common fields:

- `id`, `name`
- `characteristics`: for plain NPCs, each of `WS`, `BS`, `S`, `T`, `I`, `Ag`, `Dex`, `Int`, `WP`, `Fel` is a **number**. For template-based PCs/creatures, each can instead be `{ "base": number, "advances": number, "addition": number }` plus optional `templateId` and `randomiseCharacteristics`.
- `size` - e.g. `Average`.
- `wounds`, `movement` - numbers; `wounds` is kept in sync with the trait-aware formula when saved from the editor.
- `skills`: `[{ "name": string, "advances": number }, ...]`
- `talents`: array of strings
- `traits`: array of trait names as strings, or `{ "name": string, "inputValue"?: string }` when a trait needs a value (see `data/traits.json`).
- `tags`: optional string array for bestiary search/filter (comma-separated in the editor).
- `careers`: optional `[{ "className", "careerName", "level" }, ...]`
- `weapons`: either a **string** (legacy free text) or `{ "melee": [...], "ranged": [...] }` with `{ "category", "name", "ammunition"? }` entries matching `data/weapons/`.
- `armour`: either a **string** (legacy) or an array of `{ "category", "name" }` matching `data/armour/`.

Reference data: `data/skills.json`, `data/traits.json`. Example stat blocks: `data/statblocks/human-thug.json`, `data/statblocks/dog.json`.

## Contributing

- Lint, tests, and build all run on PRs via `.github/workflows/ci.yml`.
- Keep components strict-TS - no `@ts-nocheck`.
- Validate new payloads with Zod at both ends (server via `validateStatblockPayload`, client via the schemas in `src/lib/apiSchemas.ts`).
- Rate limit and write-auth are additive: leave them disabled in dev (env unset) unless you are testing those paths.

_Migrated from the original Vite + Express prototype. See git history prior to the Next.js migration for the legacy stack._
