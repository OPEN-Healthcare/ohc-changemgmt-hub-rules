# Hub Rules v1.0

> OHC ChangeMgmt Hub 의 사내 표준 룰북. **`.md` (인간/AI 가 읽음) + `@ohc/eslint-plugin-rules` (게이트가 강제)** 의 1:1 동기 패키지.

- 버전: **v1.0 (2026-06-12 초안)**
- 위치 (계획): `OPEN-Healthcare/ohc-changemgmt-hub-rules` repo
- 현재 위치 (PoC): `ohc-changemgmt-hub-api/docs/RULES/`
- 기획서 참조: [`OHC-ChangeMgmt-Hub_V0.5.md`](../OHC-ChangeMgmt-Hub_V0.5.md) §11

---

## 룰북 구조

| 파일 | 영역 | rule ID prefix | 게이트 매핑 |
|---|---|---|---|
| [CODING.md](./CODING.md) | 코딩 표준 | `ohc/c-*` | #2 lint, #3 test |
| [SECURITY.md](./SECURITY.md) | 보안 베이스라인 | `ohc/s-*` | #2 lint, #7 sbom-sca, #8 gitleaks, #9 audit-conf |
| [PAGE-DEF.md](./PAGE-DEF.md) | page-def.json 작성법 | `ohc/p-*` | #5 openapi, #9 audit-conf |
| [AI-USAGE.md](./AI-USAGE.md) | AI 사용 정책 | `ohc/a-*` | #9 audit-conf |
| [DOMAIN-HEALTHCARE.md](./DOMAIN-HEALTHCARE.md) | 헬스케어 도메인 | `ohc/h-*` | #9 audit-conf, REVIEWER 6 영역 |
| [SCOPE.md](./SCOPE.md) | 권한 / 공개 범위 (SeeLink 앱) | `ohc/x-*` | #2 lint, #9 audit-conf |
| [INTAKE.md](./INTAKE.md) | (Phase 7 비전) 요구 명세 보조 | — | — |

---

## 룰 형식 (모든 .md 공통)

각 룰은 다음 형식을 따른다:

```markdown
## <rule-id> — <짧은 제목>

- **lint rule**: `ohc/<rule-id>` (커스텀 eslint plugin)
- **게이트**: #2 lint (자동) [+ 보조 게이트]
- **REVIEWER 책임**: (정적 검사 한계가 있는 경우만 명시)
- **위반 시**: <설명>

### 규칙
<룰 본문>

### 좋은 예 / 나쁜 예
<code>
```

### § ID = lint rule ID 매핑 (결정적)

- `RULES/CODING.md#c-error-handling` ↔ `ohc/c-error-handling` (eslint rule)
- 거절 피드백 (Tier 1) 의 `rule` 필드에 § ID 가 그대로 박힘 → 제출자가 룰북 § 직시
- 매핑이 깨지면 게이트 자체 회귀 fail (룰북 변경 거버넌스 §11)

---

## 룰북 변경 거버넌스

### PR 머지 조건

1. `.md` 와 lint plugin 코드 **동기 변경** (한쪽만 바뀐 PR 거부)
2. CI: 샘플 서비스 (`hub-staging` 의 `my-todo` 등) 에 변경된 룰북 적용 → 9 게이트 회귀 통과
3. 정보지원본부 승인 (PR 리뷰어로 등록)
4. semver 태그 (breaking = major, 보강 = minor, 오타 = patch)

### 룰 추가·삭제·변경 절차

- **추가**: 새 § + lint rule + 게이트 회귀 통과
- **삭제**: deprecated 로 1 minor 거친 후 다음 major 에서 제거
- **변경**: 의미 변경 = major / 메시지·예 변경 = patch

### 자기참조 원칙

> 룰북도 자기 시스템의 게이트를 통과해야 한다.

룰북 자체의 코드 (lint plugin) 도 본 룰북 (CODING / SECURITY) 을 따른다.

---

## 룰 ID 명명 규칙

| prefix | 의미 |
|---|---|
| `c-` | coding (코딩 표준) |
| `s-` | security (보안) |
| `p-` | page-def (마운트 명세) |
| `a-` | ai-usage (AI 사용) |
| `h-` | healthcare (도메인) |
| `x-` | scope (권한 / 공개 범위) |

전부 kebab-case, 단어 ≤ 4개.

예: `c-error-handling`, `s-no-hardcoded-secret`, `a-broker-only`

---

## 사용 측면

### 제출자 측면

- boilerplate 의 `devDependencies` 에 `@ohc/eslint-plugin-rules` 자동 포함
- `eslintrc.json` 에 `extends: ["@ohc/recommended"]` (모든 룰 활성화)
- 본인 AI 도구에 본 룰북 .md 파일들을 컨텍스트로 제공 (룰북 1.x 기준 코드 생성)

### Hub 측면

- 게이트 #2 lint = 룰북 강제 (rule fail = 게이트 fail, rule ID 가 거절 피드백 Tier 1 의 `rule` 필드로 노출)
- 게이트 #9 audit-conf = 정적 검사로 못 잡는 일부 룰 (예: aiUsage 필드 존재) 보조 검증
- REVIEWER 6 영역 체크리스트 = "존재 ≠ 의미" 영역 (예: RoleGuard 가 있긴 한데 적절한 role 매핑인가)

### AI 도구 측면 (사용자 모델)

- 제출자가 본인 환경 (Claude Code / ChatGPT / Cursor) 에서 사용
- 룰북 .md 를 컨텍스트로 로드하여 사내 표준에 맞는 코드 생성
- 게이트 fail 시 거절 피드백 (Tier 1 결정적 rule ID 포함) 을 AI 도구에 입력 → 수정

> Phase 7 호스팅 에이전트 도입 시: 룰북이 자동 로드되어 직원 개입 없이 코드 생성. 진입 조건 E1~E5 충족 시점에 별도 기획서 (`OHC-AgentHost_V1.0`) 로 분리 기안. ([기획서 v0.5 §13](../OHC-ChangeMgmt-Hub_V0.5.md))

---

## 변경 이력

| 버전 | 일자 | 변경 |
|---|---|---|
| v1.0 (초안) | 2026-06-12 | 5 영역 (CODING / SECURITY / PAGE-DEF / AI-USAGE / DOMAIN-HEALTHCARE) 초기 룰 정의. INTAKE.md 는 Phase 7 도입 시 작성. |
| v1.1 | 2026-09-21 | SCOPE.md (권한 / 공개 범위, SeeLink 앱) 6 룰 추가 — `ohc/x-*`. |

---

**Maintainer**: 정보지원본부 (inqsong@openhealthcare.com)
**License**: Internal — OPEN-Healthcare
