# Grim Dudes

An interactive editor for creating and viewing **Warhammer Fantasy Roleplay 4th Edition** stat blocks.

Built as a **Next.js 15** App Router app (TypeScript + Tailwind), deployable on **Vercel**, backed by **[Upstash Redis](https://upstash.com)** for stat block storage. Created with Cursor.ai.

## Requirements

- **Node.js 20+** ([nodejs.org](https://nodejs.org))
- **Upstash Redis** — REST URL and token are required to **list, save, or delete** stat blocks (local and production). Reference data (skills, traits, etc.) is bundled under `data/` and does not need Redis to read.

## Quick start (local)

1. Clone the repo and install dependencies: `npm install`
2. Create a (free) **Upstash Redis** database and copy [.env.example](.env.example) to `.env.local`
3. Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in `.env.local` (never commit this file)
4. Optional: seed Redis from bundled JSON — `npm run migrate:statblocks` (see [Migrating JSON to Redis](#migrating-json-to-redis))
5. Start the app: `npm run dev` → [http://localhost:3000](http://localhost:3000)

Optional: run a production build locally — `npm run build && npm start`.

## Authentication

### What is public vs protected?

- **Public:** Home/bestiary, read-only stat block pages, bundled reference APIs, and **`GET`** statblock endpoints. Anyone can browse and read.
- **Protected when auth is “on”:**
  - **UI:** [`/login`](app/login/page.tsx) is the sign-in page. [`middleware.ts`](middleware.ts) requires a session for `/admin`, `/new`, and `/statblock/[id]/edit`.
  - **Writes:** `POST` / `PUT` / `DELETE` on [`/api/statblocks`](app/api/statblocks/route.ts) and server actions in [`src/app-actions/statblocks.ts`](src/app-actions/statblocks.ts) require a valid session cookie.

### When is auth enforced?

Auth is **on** only if **all** of the following hold:

- `AUTH_SECRET` is set
- **and** either `AUTH_PASSWORD` or `AUTH_PASSWORD_HASH` is set  
  (`AUTH_SECRET` alone does **not** enable login.)
- **and** `AUTH_DISABLED` is not `1` or `true`

Otherwise **writes are open** (useful for local dev), same spirit as the old optional write token.

Do not use **`AUTH_DISABLED=1` in production**; it is only for local convenience when you already have auth vars in `.env.local` but want to skip sign-in.

### Production, Upstash, and open writes

On **production** (`VERCEL_ENV` or `NODE_ENV` is `production`) with **Upstash** configured, if session auth is **not** fully configured (same rules as [When is auth enforced?](#when-is-auth-enforced)), **mutating** API routes and server actions return **503** until you set `AUTH_SECRET` and a password or hash. This prevents accidentally leaving the bestiary world-writable on Vercel.

To **opt out** (demos or internal only), set **`ALLOW_UNAUTHENTICATED_WRITES=1`** — documented as dangerous in [.env.example](.env.example).

### Threat model (single admin, public read)

- **Read:** All stat blocks are **world-readable** via the UI and `GET /api/statblocks` / `GET /api/statblocks/:id` — designed for a public bestiary.
- **Write:** With auth on, there is a **single** shared admin session (or fixed `AUTH_USER` + password). Any signed-in user can **create, update, or delete any** stat block **by id**; there is no per-entry ownership or multi-tenant isolation.

### Sign-in flow

1. Open `/login` and submit the password (and username if you configure `AUTH_USER`).
2. The app sets an **httpOnly** cookie `grim_session` (JWT). Sessions last **14 days** from last sign-in ([`SESSION_MAX_AGE_SEC`](src/lib/session.ts)); sign in again to refresh.
3. **Sign out:** use **Sign out** on [`/admin`](app/admin/page.tsx) or `POST /api/auth/logout`.

In **development**, the session cookie is often not `Secure`, so **http://localhost** works. **Production and Vercel** (including Preview when `VERCEL=1`) use `Secure` cookies over HTTPS.

### Generating secrets and passwords

- **`AUTH_SECRET`:** use a long random value, e.g. `openssl rand -base64 32`
- **Plain password (convenient for local):** set `AUTH_PASSWORD`
- **Bcrypt hash (recommended for production):** set `AUTH_PASSWORD_HASH` instead of `AUTH_PASSWORD`. After `npm install`, you can generate a hash with bcrypt cost `10`:

```bash
node -e "require('bcryptjs').hash(process.argv[1], 10).then(console.log)" 'your-password-here'
```

### Optional `AUTH_USER`

If set, the username field on `/login` must match exactly (in addition to the password).

### Rate limits

**Write** and **login** use Upstash for rate limiting when `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set. Without them, the app uses a **per-process in-memory** limiter (same env vars `RATE_LIMIT_WRITES_PER_MIN` / `RATE_LIMIT_LOGIN_PER_MIN` apply). In-memory limits do not share state across serverless instances but still cap abuse per instance.

### Previews and production

For **Vercel Preview** deployments, copy the same `AUTH_*` variables into the Preview environment if you need to edit from preview URLs.

### Health check

`GET /api/healthz` returns `{ ok, redis }` in **production** by default. To include `authConfigured`, `authDisabled`, `writesProtected`, `region`, and `env`, set **`HEALTHZ_TOKEN`** in the environment and call:

`GET /api/healthz?verbose=1` with `Authorization: Bearer <HEALTHZ_TOKEN>`

In **non-production**, the full object is returned without a token ([`app/api/healthz/route.ts`](app/api/healthz/route.ts)).

## Deploying to Vercel

1. Import the Git repo into Vercel and use the default Next.js settings.
2. In **Project → Settings → Environment Variables**, add the variables from the [table below](#environment-variables) for **Production**, **Preview**, and/or **Development** as needed.
3. **Isolate Redis data:** use a **separate Upstash database** or set **`REDIS_KEY_PREFIX`** (e.g. `preview:` vs `prod:`) so Preview and Production do not share stat blocks.
4. Optional: set **`NEXT_PUBLIC_SITE_URL`** to your canonical site URL (e.g. `https://example.com`) so [`app/robots.ts`](app/robots.ts) / sitemap use the right base.
5. **Scheduled cleanup:** [`vercel.json`](vercel.json) runs `GET /api/admin/cleanup-orphans` daily. Set **`CRON_SECRET`** in the project: Vercel sends **`Authorization: Bearer <CRON_SECRET>`** to the cron URL. The handler requires this Bearer in **production**; it does not rely on the `x-vercel-cron` header alone. See [Vercel: Cron jobs](https://vercel.com/docs/cron-jobs) for the latest auth behavior. Locally (non-production) without `CRON_SECRET`, the route accepts `x-vercel-cron: 1` for testing.

## Environment variables

Full reference for every supported key:

Copy [.env.example](.env.example) to `.env.local` for local development. On Vercel, set the same keys under **Project → Settings → Environment Variables**.

| Variable | Required | Purpose |
|----------|----------|---------|
| `UPSTASH_REDIS_REST_URL` | yes* | Upstash REST endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | yes* | Upstash REST token |
| `REDIS_KEY_PREFIX` | no | Prefix all Redis keys (isolate Preview vs Production) |
| `NEXT_PUBLIC_SITE_URL` | no | Canonical site URL for robots/sitemap ([`app/robots.ts`](app/robots.ts)) |
| `AUTH_SECRET` | optional | Secret for signing session cookies (long random string) |
| `AUTH_PASSWORD` | optional** | Plain password for the single admin user (dev / simple setups) |
| `AUTH_PASSWORD_HASH` | optional** | Bcrypt hash of the admin password (production) |
| `AUTH_USER` | no | If set, login username must match exactly |
| `AUTH_DISABLED` | no | `1` or `true` skips auth and keeps writes open (use **locally** only) |
| `ALLOW_UNAUTHENTICATED_WRITES` | no | In **production** with Upstash, allows open writes if auth is not configured — **dangerous**; demos only |
| `CRON_SECRET` | yes (prod) | **Production** cleanup route requires `Authorization: Bearer` matching this. Vercel injects the header for project crons. |
| `HEALTHZ_TOKEN` | no | **Production** only: with `?verbose=1` and this Bearer, `/api/healthz` returns detailed fields |
| `RATE_LIMIT_WRITES_PER_MIN` | no | Override default **30**/min for writes (Upstash or in-process fallback) |
| `RATE_LIMIT_LOGIN_PER_MIN` | no | Override default **15**/min for `/api/auth/login` (Upstash or in-process fallback) |

\*Required for stat block CRUD. \*\*Use **either** `AUTH_PASSWORD` **or** `AUTH_PASSWORD_HASH` together with `AUTH_SECRET` to require sign-in at `/login`. If that trio is incomplete, writes stay open **except** in **production with Upstash** (then configure auth or set `ALLOW_UNAUTHENTICATED_WRITES=1`); `AUTH_DISABLED=1` still forces open writes when auth vars exist (see [Authentication](#authentication)).

## Run and build

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start   # production build locally
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
| `npm run normalise:statblocks` | Rewrite string-shaped `weapons` / `armour` in Redis to structured forms ([`scripts/normalise-statblocks.ts`](scripts/normalise-statblocks.ts); requires Upstash env; use `--dry-run` to report only) |

## API shape

- `GET /api/statblocks` - full list (array)
- `GET /api/statblocks?cursor=0&limit=100` - paginated (`{ items, nextCursor }`)
- `POST /api/statblocks` - create/overwrite (session auth when configured + rate-limited)
- `GET /api/statblocks/:id` - one by **canonical slug** (404 on miss); the `:id` segment is normalised with the same rules as Redis keys ([`slugifyStatblockId`](src/lib/statblockKeys.ts))
- `PUT /api/statblocks/:id` - update at canonical slug (session auth + rate-limited)
- `DELETE /api/statblocks/:id` - delete (session auth + rate-limited)
- `GET /api/skills | traits | weapons | armour | careers | templates[/:id]` - bundled reference data
- `POST /api/sharepacks` (body: `{ ids: string[] }`) - creates a short id so long selections can be shared via `/view?pack=<id>`
- `GET /api/sharepacks/:id` - resolve back to `{ ids }`
- `GET /api/healthz` - `{ ok, redis }` in production; optional details with `?verbose=1` + `HEALTHZ_TOKEN` (see [Health check](#health-check))

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

- **503 on list/save** with missing Upstash env: set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in `.env.local` or Vercel.
- **“Not authorised — sign in at /login”** in the editor: configure `AUTH_SECRET` and a password (or hash), then open `/login`. For open writes locally, omit those vars or set `AUTH_DISABLED=1`.
- **503** on save/delete in production: Upstash is set but auth is not; configure `AUTH_SECRET` + password/hash, or set `ALLOW_UNAUTHENTICATED_WRITES=1` only if intentional.
- **Cron cleanup returns 401** in production: set **`CRON_SECRET`** in Vercel to match; scheduled invocations use `Authorization: Bearer` automatically when the var is set.
- **Bestiary shows a phantom entry:** run `npm run cleanup:orphans`.
- **Reset Redis completely:** from the Upstash dashboard use “flush database”, then `npm run migrate:statblocks`. Alternatively, delete keys under your `REDIS_KEY_PREFIX` if you use one.

## Project layout

```
app/                 Next.js App Router routes and route handlers
  api/*              JSON endpoints
  admin/             Admin dashboard; /login for session sign-in
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

- Lint, tests, and build run on PRs via `.github/workflows/ci.yml`. Before opening a PR, run `npm run lint` and `npm test` locally.
- Keep components strict-TS - no `@ts-nocheck`.
- Validate new payloads with Zod at both ends (server via `validateStatblockPayload`, client via the schemas in `src/lib/apiSchemas.ts`).
- Session auth is optional for local work: omit `AUTH_SECRET` / password for open writes, or set `AUTH_DISABLED=1` if you configure auth but want to bypass checks locally. In production with Redis, unconfigured auth returns 503 for writes unless `ALLOW_UNAUTHENTICATED_WRITES=1`.

_Migrated from the original Vite + Express prototype. See git history prior to the Next.js migration for the legacy stack._
