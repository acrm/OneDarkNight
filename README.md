# One Dark Night

A horror text-adventure PWA. Survive 5 nights in a house with hidden rules.

## Setup
```bash
npm install
npm run dev        # http://localhost:5173
```

## Commands
```bash
npm run build      # production build → dist/
npm run typecheck  # TypeScript check
npm run lint       # ESLint
npm run bump:build -- --desc "description"  # version bump
```

## Architecture
Clean/DDD: `domain → application → infrastructure + presentation`

- `src/domain/` — types, scene data (pure TS)
- `src/application/` — Zustand game store
- `src/infrastructure/` — localStorage adapter
- `src/presentation/` — React components/pages

## PWA
Installable from browser. Works offline after first load.

## Deploy
Push to `main` → GitHub Actions deploys to GitHub Pages automatically.
