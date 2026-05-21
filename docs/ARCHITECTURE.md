# Architecture — Play My Story

Default bundled demo story: **One Dark Night**.

## Layers

| Layer | Path | Responsibility |
|-------|------|----------------|
| Domain | `src/domain/` | Types, scene data, structured rules, house map, item taxonomy, story templates. Pure TS. |
| Application | `src/application/` | Zustand game store + consequence engine + threat progression + story library |
| Infrastructure | `src/infrastructure/` | localStorage adapter |
| Presentation | `src/presentation/` | React components/pages (room context, threat feedback, header story picker, tabs: scenes/illustrations/world) |

## Story Layering

- `src/domain/storyTemplates.ts`: canonical templates (`one-dark-night`, `metro-last-train`), initial state and scene maps.
- `src/application/storyLibraryStore.ts`: persisted list of stories (built-in + user), active story selection, create/rename/delete/import operations, editable scene payloads, world notes.
- `src/application/gameStore.ts`: per-story runtime snapshots and scene progression based on active edited scene set.

## Developer Tooling Slice

- `src/application/devtoolsStore.ts`: isolated Zustand persist state for atlas tooling.
- `src/application/devtoolsTypes.ts`: data contracts for atlas config, sprites, and export schema.
- `src/application/spriteAtlasUtils.ts`: frame slicing, frame sequence parsing, background color-key removal, export mapping.
- `src/presentation/pages/DevtoolsPage.tsx`: separate hash-routed editor page (`#/edit`, legacy `#/devtools`) with switchable sections for scene editing, illustrations atlas, and world notes.

The tooling slice is isolated from the game state (`useGameStore`) and does not alter gameplay domain logic.

## Dependency Direction
presentation → application → domain
infrastructure ← application

## State
Persisted via Zustand persist middleware → localStorage.

## Runtime State Additions
- `threatLevel` / `threatStage`
- `doomCounter`
- `currentRoomId`
- `consequenceLog`

## Domain Additions
- `src/domain/rules.ts`: structured `RULES_CATALOG`
- `src/domain/house.ts`: room graph and labels
- `src/domain/items.ts`: item categories and metadata
