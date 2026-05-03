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
- Upload atlas image (PNG/JPG/WebP), then use zoom and pan to position the view on desktop and mobile.
- Sprite list starts empty: add a sprite, set name, frame count, frame width and frame height, then confirm.
- After confirmation, atlas displays one anchor marker per frame for the sprite.
- Each frame is drawn as a rectangle centered on its anchor, using configured frame size.
- The last moved anchor also shows a crosshair marker at frame bottom-right corner.
- Dragging crosshair updates frame width/height for the sprite and applies instantly to all its frames.
- Anchor and crosshair guide lines are intentionally thick for visibility on mobile and desktop.
- Numeric controls provide `+` / `-` steppers for precise edits.
- Import/export JSON keeps sprite metadata and atlas configuration.

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
