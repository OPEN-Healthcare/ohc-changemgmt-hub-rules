# AI HUB (powered by ohc-changemgmt-hub stack)

> Hub Rules v1.x — the **.md rulebook** + **runnable ESLint plugin** for the OHC Change Management Hub (`ohc-changemgmt-hub`). Self-referential governance: any change to a rule must pass the 9-gate regression of the sample boilerplate service.

## Layout

```
rules/                 # .md rulebook (5 categories, 57 rule entries)
  README.md
  CODING.md            # c-* rules
  SECURITY.md          # s-* rules
  PAGE-DEF.md          # p-* rules
  AI-USAGE.md          # a-* rules
  DOMAIN-HEALTHCARE.md # h-* rules
  manifest.json        # rule ID ↔ .md anchor map (single source for the loader)
eslint-plugin/         # @ohc/eslint-plugin-rules (npm workspace)
  src/
    index.ts           # plugin entry, exports the rule registry
    rules/             # one file per implemented rule
    configs/           # recommended config
  dist/                # build output (gitignored)
scripts/
  validate-manifest.js # 1:1 check: manifest entry ↔ .md anchor ↔ plugin rule ID
.github/workflows/
  rules-regression.yml # PR gate: run the 9-gate regression on the boilerplate
```

## Rule ID convention

`ohc/<category-letter>-<kebab-name>` — e.g. `ohc/c-error-handling`, `ohc/s-no-hardcoded-secret`.

The `<category-letter>` must match:

| Category | Letter | Doc |
|---|---|---|
| coding | `c` | `rules/CODING.md` |
| security | `s` | `rules/SECURITY.md` |
| page-def | `p` | `rules/PAGE-DEF.md` |
| ai-usage | `a` | `rules/AI-USAGE.md` |
| domain-healthcare | `h` | `rules/DOMAIN-HEALTHCARE.md` |
| scope | `x` | `rules/SCOPE.md` |

Each rule MUST have:
- A `## <id-without-prefix> — <korean title>` heading in the matching `.md`.
- An entry in `rules/manifest.json` with the rule ID and the doc anchor.
- (If `implemented: true`) An exported rule in `eslint-plugin/src/index.ts`.

`scripts/validate-manifest.js` enforces this.

## Loading from Hub API

Hub API's `RulesLoaderService` clones this repo (cache at `~/.ohc-changemgmt-hub/rules-cache/`), checks out the latest tag, parses `rules/manifest.json`, and `require`s `eslint-plugin/dist/index.js`. The `gates.service.ts` lint gate passes `OHC_RULES_PLUGIN_PATH=<cache>/eslint-plugin/dist/index.js` to the spawned linter.

## Releasing a new rules version

1. Bump `version` in this repo's root `package.json` + `rules/manifest.json`.
2. Add a `CHANGELOG.md` entry.
3. Open a PR — `.github/workflows/rules-regression.yml` will run the 9-gate regression on the boilerplate sample.
4. Merge → tag `vX.Y.Z` → Hub API picks it up on next loader cycle (5-min SWR).

## Status

Phase 3.5k — Initial migration (v1.0.0). 3 rules implemented, 54 registered placeholders.

**EXPIRES_AT: 2026-09-14** (84일, Phase 5 마운트 엔진 v1 안정화 목표)

See `D:\Workspace\ohc-changemgmt-hub-api\docs\OHC-ChangeMgmt-Hub_V0.5.md` §11 for the governance specification.
