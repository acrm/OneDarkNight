# AI Agent Instructions — One Dark Night

**Chat language: Russian. File content language: English.**

## Workflow
1. Make changes in correct DDD layer
2. Run `npm run typecheck && npm run lint && npm run build`
3. Bump: `npm run bump:build -- --desc "description"`
4. Update docs

## Architecture
- `domain/`: pure TS — types, scene data, world rules
- `application/`: Zustand store
- `infrastructure/`: localStorage adapter
- `presentation/`: React only

## Temp Files
Only in `tmp/`, remove after commit.

## Version Format
`<weekCode>-<minor>.<build>` e.g. `2026w15-0.2`
