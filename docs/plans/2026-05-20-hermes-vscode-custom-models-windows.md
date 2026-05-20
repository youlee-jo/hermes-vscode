# Hermes VS Code Custom Models + Windows Paths Execution Log

**Date:** 2026-05-20

## Goal

Make the forked Hermes VS Code extension better support this Windows Hermes install and allow GPT-5.5/custom model commands from the model picker.

## Changes Made

- Added `src/hermesPaths.ts` to resolve Hermes home candidates safely:
  - `HERMES_HOME`
  - Windows `%LOCALAPPDATA%/hermes`
  - Windows `~/AppData/Local/hermes`
  - legacy `~/.hermes`
- Updated `src/modelCatalog.ts`:
  - added an OpenAI group with `openai:gpt-5.5`
  - kept existing Anthropic and OpenAI Codex groups
  - reads `models_dev_cache.json` from the resolved Hermes home
  - exposes provider groups discovered in the model cache, including OpenRouter
  - supports user-configured `hermes.customModels`
- Updated `src/skillCatalog.ts` to load skills from the resolved Hermes home instead of hardcoded `~/.hermes`.
- Updated `src/extension.ts`:
  - reads `config.yaml` from the resolved Hermes home
  - checks common Windows Hermes binary locations when `hermes.path` is default
  - reads `hermes.customModels` setting and passes it to the chat panel
- Updated `src/chatPanel.ts` to accept custom model commands.
- Added focused behavior tests under `tests/behavior.test.js` and `scripts/run-tests.js`.
- Added `npm test` script.
- Built and packaged a local VSIX.

## Verification

Commands run:

```bash
npm test
npm run build
npm run package
```

Results:

- `npm test`: passed
- `npm run build`: passed
- `npm run package`: passed

Generated VSIX:

```text
C:\Users\noppy\Documents\projects\hermes-vscode\hermes-ai-agent-3.0.0.vsix
```

## Remaining Notes

- The generated VSIX keeps the upstream package identity/version (`hermes-ai-agent` `3.0.0`) for local testing.
- If publishing as a separate extension later, change publisher/name/displayName and bump the version.
- `npm install` reports pre-existing dependency audit warnings; no dependency changes were added for this feature.
