# Architecture — One Dark Night

## Layers

| Layer | Path | Responsibility |
|-------|------|----------------|
| Domain | `src/domain/` | Types, scene data, rules. Pure TS. |
| Application | `src/application/` | Zustand game store |
| Infrastructure | `src/infrastructure/` | localStorage adapter |
| Presentation | `src/presentation/` | React components/pages |

## Dependency Direction
presentation → application → domain
infrastructure ← application

## State
Persisted via Zustand persist middleware → localStorage.
