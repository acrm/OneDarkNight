# Copilot Instructions — One Dark Night

**Chat language: Russian. File content language: English.**

## Rules
- Always bump version after tracked changes: `npm run bump:build -- --desc "description"`
- Sync docs after source changes
- Temp files only in `tmp/`, remove after commit, keep `tmp/.gitkeep`
- Architecture: presentation → application → domain; infrastructure via interfaces
- No business logic in presentation layer
