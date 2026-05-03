# One Dark Night

A horror text-adventure PWA. Survive 5 nights in a house with hidden rules.

## Current Mechanics Snapshot
- Mixed consequence model: instant fatal, deferred fatal, escalation, reversible branch
- TV night system with horror broadcasts and entity breach scenes
- Rule-driven nights: peephole, bathroom mirror window, TV lockout behavior
- Day resource loop (salt/food/random items) impacting night choices
- Room context UI (current room + nearby rooms)
- Built-in Sprite Atlas Devtool for animation prep (developer-facing)

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

## Sprite Atlas Devtool
- Open `#/devtools` in the app or use the `Devtool` badge from the game header.
- Upload an atlas image (PNG/JPG/WebP), then configure slicing: cell size, offsets, gaps, columns, rows.
- The loaded atlas is shown immediately with a live slicing grid overlay based on current parameters.
- Two draggable control points are available for mobile-friendly setup: top-left and bottom-right corners of the first sprite.
- Heavy frame extraction and background removal run only after explicit confirmation of slicing parameters.
- Background cleanup supports color-key removal sampled from each frame top-left pixel with adjustable tolerance.
- Numeric fields include `+`/`-` steppers for precise changes.
- Each extracted frame is auto-numbered; create named sprites and define frame sequences (`1-4,7,9-12`).
- Mark loop/fps and preview playback for any selected sprite animation.
- Export/import atlas metadata as JSON (grid settings, background removal settings, sprite definitions).

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
