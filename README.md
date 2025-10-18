# Giochetto Carino

Progressive Web App built with Vite, React, and TypeScript for the door-based lobby game described in the brief.

## Tech Stack

- React 18 with TypeScript
- Zustand for state management
- React Router for routing
- Tailwind CSS for styling
- Vitest for unit tests
- Service worker & manifest for PWA support

## Getting Started

Install dependencies (pnpm recommended):

```bash
pnpm install
```

Start the development server (online runtime, no caching):

```bash
pnpm dev
```

Run unit tests:

```bash
pnpm test
```

Create a production build. Enable caching by exporting `ENABLE_CACHE=true`:

```bash
ENABLE_CACHE=true pnpm build
```

Preview the production build:

```bash
pnpm preview
```

## Project Structure

- `src/app.tsx` – router setup, bootstrap and online guard logic.
- `src/state/` – Zustand stores for game data and settings.
- `src/game/` – deterministic RNG, loot, battle, pool, and house logic.
- `src/data/` – loaders and normalization helpers for external JSON files.
- `src/save/` – localStorage persistence utilities and migration scaffolding.
- `src/components/` – UI building blocks (doors, panels, hitboxes, modals).
- `src/routes/` – screen implementations: menu, lobby, door, house, etc.
- `assets/` – default game data and hitbox polygons (loaded at runtime).
- `tests/` – Vitest suites for core logic.
- `src/pwa/sw.ts` – service worker (network-only in dev, caching in prod).
- `public/manifest.webmanifest` & `public/icons/` – PWA manifest and icons.

## Data Normalisation

External JSON assets keep their Italian keys/emojis. They are normalised in `src/data/normalize.ts` to canonical English slugs for doors, loot, weapons, and animals. All game logic and saves rely on the canonical shapes defined in `src/game/types.ts`.

## Saving & Migrations

Save slots live under the `gc:*` prefix in `localStorage`. The default schema is in `src/game/types.ts` and the persistence helpers in `src/save/saves.ts`. Migration scaffolding is provided in `src/save/migrations/`; add new files and register them in `index.ts` to evolve stored saves safely.

## PWA Caching Toggle

- `ENABLE_CACHE=false` (default) – development mode: service worker fetches everything from the network using `cache: "reload"`.
- `ENABLE_CACHE=true` – production mode: sw precaches the app shell and applies stale-while-revalidate for `/assets/**` images plus network-first JSON caching.

The build flag is read in `vite.config.ts` and injected into the service worker and application bundle as `__ENABLE_CACHE__`.

## Assets

The runtime loads data from `/assets`, starting with `file_structure.json`. Hitboxes are stored alongside assets (e.g. `/assets/lobby/pulsanti/baule.json`). Use the same structure when adding new files so the loader can fetch them.

## Testing

Core systems (loot rolls, conflict rules, door pool, and battle resolution) are covered by unit tests in `tests/*.test.ts`. Run them with `pnpm test`.

## Notes

- The lobby respects conflict rules and always offers the neutral door.
- Weapons and animals follow the battle flow described in the brief.
- The offline gate shows a toast when the network check fails, keeping gameplay online-only.
