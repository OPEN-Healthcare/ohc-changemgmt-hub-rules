# Hub Rules Changelog

## v1.1.0 — 2026-09-21

**SCOPE 영역 추가** — SeeLink 자식 앱의 권한 / 공개 범위(scope) 판정 표준화.

- `rules/SCOPE.md` 신규 — 6 룰 (`ohc/x-scope-use-module`, `ohc/x-scope-no-name-match`, `ohc/x-scope-fail-closed`, `ohc/x-scope-no-admin-default`, `ohc/x-scope-vendor-untouched`, `ohc/x-scope-menu-gate`). 카테고리 letter `x` 신규 등록.
- 근거: `@open-healthcare/seelink-scope` (`ohc-seelink-scope` repo) + hub-api `src/lib/org-scope/visibility.ts` — 5 종 공개 범위(`private`/`team`/`org`/`selected`/`all`), orgCd 기반 판정(부서 이름 비교 금지), fail-closed, 관리자 기본값 금지, 벤더 사본 불변, 메뉴·서버 이중 게이트.
- `rules/manifest.json`: 위 6 개 등록 (`implemented: false`, `x-scope-menu-gate` 만 `severity: warn`, 나머지 `error`), manifest `version` 1.1.0 로 상향.
- `known-anchors.json`: `SCOPE-1`~`SCOPE-6` 앵커 추가, `total_anchors` 22→27 로 정정(기존 카운트가 실제 배열 길이 21 과도 불일치했던 것을 함께 바로잡음).
- `scripts/validate-manifest.js`: rule id 정규식이 `[chspa]` 로 하드코딩되어 있어 신규 카테고리 `x` 를 막고 있었음 → `[chspax]` 로 확장.
- `README.md` / `rules/README.md`: 카테고리 표·prefix 표·영역 인덱스에 SCOPE 행 추가.

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
