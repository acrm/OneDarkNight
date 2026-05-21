# Play My Story

Mobile-first platform for creating interactive stories. The default loaded demo story is **One Dark Night**.

## Current Mechanics Snapshot
- Platform shell with two modes: game and edit
- Global mobile header: story title + Play/Edit toggle + restart in game mode
- In edit mode story picker is in the top header under app title
- Next to picker: story list manager (add, delete, rename, download, import)
- Story library persisted in localStorage
- Built-in templates: `One Dark Night` and `Metro: Last Train`
- In edit mode you can create, rename, and delete user stories (based on a template)
- In edit mode you can edit full scene structure (scene title/location/text + choices + transitions)
- Scene editor supports drag-and-drop reorder, add scene, bulk delete mode, and scene ID editing
- During drag-and-drop the scene list collapses to one-line cards (scene ID + title)
- Scenes are displayed inside editable groups (e.g. `Day1. Morning`) with a group-name modal editor
- Scene ID (code) is edited inline by clicking the code chip in the scene header
- Play mode launches the active edited story version immediately
- Edit mode now has section switchers: `История` / `Иллюстрации` / `Мир`
- When active story changes, the opened editor section reloads for that story
- Mixed consequence model: instant fatal, deferred fatal, escalation, reversible branch
- TV night system with horror broadcasts and entity breach scenes
- Rule-driven nights: peephole, bathroom mirror window, TV lockout behavior
- Day resource loop (salt/food/random items) impacting night choices
- Room context UI (current room + nearby rooms)
- Built-in editor route (`#/edit`) currently powered by the Sprite Atlas tool

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
- Open `#/edit` in the app (legacy alias `#/devtools` still works).
- Top story panel in edit mode controls active story and user-story management.
- Story Structure Editor shows all scenes of the active story and lets you modify transitions before playing.
- Story list manager supports full import/export of stories and edited scene data.
- `Мир` section provides world notes and location overview for the active story.
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
