# Architecture — One Dark Night

## Layers

| Layer | Path | Responsibility |
|-------|------|----------------|
| Domain | `src/domain/` | Types, scene data, structured rules, house map, item taxonomy. Pure TS. |
| Application | `src/application/` | Zustand game store + consequence engine + threat progression |
| Infrastructure | `src/infrastructure/` | localStorage adapter |
| Presentation | `src/presentation/` | React components/pages (room context, threat feedback, TV panel) |

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
