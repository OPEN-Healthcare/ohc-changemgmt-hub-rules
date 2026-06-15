# Hub Rules Changelog

## v1.0.0 — 2026-06-15

**Initial release** — moved from `ohc-changemgmt-hub-api/docs/RULES/` + `ohc-changemgmt-hub-api/packages/eslint-plugin-rules/` to a dedicated repo (`OPEN-Healthcare/ohc-changemgmt-hub-rules`) so rule changes go through their own gate-regression check (v0.5 §11 self-referential governance).

- 57 rules registered across 5 categories: coding (12), security (12+gate-level), page-def (11), ai-usage (12), domain-healthcare (13).
- 3 rules implemented as runnable ESLint rules (PoC): `ohc/c-error-handling`, `ohc/s-no-hardcoded-secret`, `ohc/a-broker-only`.
- 54 rules registered in `rules/manifest.json` with `implemented: false` — to be implemented incrementally; manifest enforces 1:1 with `.md` anchors regardless.
- `scripts/validate-manifest.js` checks every manifest entry's `doc` anchor exists in the referenced `.md`.
- `.github/workflows/rules-regression.yml` runs the 9-gate regression against the boilerplate sample on every rules PR.
- Loaded by Hub API `RulesLoaderService` (see `ohc-changemgmt-hub-api/src/lib/rules-loader/`) — a 5-minute SWR cache + admin endpoint for force refresh.

### Migration notes

- Hub API repo no longer contains `docs/RULES/` or `packages/eslint-plugin-rules/`. Both are now under this repo.
- The Hub API's `gates.service.ts` lint gate loads this plugin via `OHC_RULES_PLUGIN_PATH` env var (the loader resolves it from the cached clone).
- Phase 3.5k completed.
