# Grim Dudes

An interactive editor for creating and viewing **Warhammer Fantasy Roleplay 4th Edition** stat blocks. Lightweight Node.js + React app, suitable for running on a Raspberry Pi.
Created with Cursor.ai.

## What you need

- **Node.js** (v18 or v20 LTS recommended) — [nodejs.org](https://nodejs.org)
- **npm** (comes with Node)

No database: stat blocks are stored as JSON files in `server/data/`.

## Run the project

### Development (client + server with hot reload)

1. Install dependencies (once):

   ```bash
   npm install
   cd client && npm install && cd ..
   cd server && npm install && cd ..
   ```

2. Start both the API server and the React dev server:

   ```bash
   npm run dev
   ```

3. Open **http://localhost:5173** in your browser. The Vite dev server proxies `/api` to the backend on port 3000.

### Production (e.g. on a Raspberry Pi)

1. Build the React app and run only the Node server:

   ```bash
   npm install
   cd client && npm install && npm run build && cd ..
   cd server && npm install && cd ..
   npm run preview
   ```

2. Open **http://localhost:3000** (or your Pi’s IP). The server serves the built frontend and the API.

To use a different port:

```bash
PORT=8080 npm run preview
```

## Scripts

| Script      | Description |
|------------|-------------|
| `npm run dev` | Runs server (port 3000) and Vite dev server (port 5173). Use for development. |
| `npm run server` | Runs only the backend. |
| `npm run client` | Runs only the Vite dev server (from `client/`). |
| `npm run build` | Builds the React app into `client/dist/`. |
| `npm run preview` | Builds the client then starts the server (serves app on port 3000). |

## Project layout

- `server/` — Express API: serves JSON stat blocks from `server/data/`, saves new ones via POST.
- `client/` — React (Vite) + Tailwind; bestiary list, stat block view, and new stat block editor.
- `server/data/` — JSON files (e.g. `skeleton.json`, `rat-catcher.json`). Add or edit files here or via the “New Stat Block” form.

## Stat block format

Each JSON file in `server/data/` can have:

- `id`, `name`, `description`
- `characteristics`: `WS`, `BS`, `S`, `T`, `I`, `Ag`, `Dex`, `Int`, `WP`, `Fel` (numbers)
- `wounds`, `movement`
- `skills`: array of `{ \"name\": string, \"advances\": number }`
- `talents`: array of strings
- `traits`: array of strings (names that exist in `traits.json`)
- `armour`, `weapons`: strings

Reference data:

- `server/data/skills.json` — list of all skills and their associated characteristic.
- `server/data/traits.json` — list of all traits and their descriptions.

Example: see `server/data/skeleton.json` or `server/data/chaos-warrior.json`.
