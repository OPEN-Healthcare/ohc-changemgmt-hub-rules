# @ohc/eslint-plugin-rules

> Hub Rules v1.0 의 실행 가능한 정책 형태 (ESLint 커스텀 룰).
> `.md` 룰북과 rule ID 가 1:1 매핑되어 거절 피드백 Tier 1 의 `rule` 필드에 그대로 박힘.

## 매핑 규칙

| 룰북 § ID | ESLint rule ID |
|---|---|
| `RULES/CODING.md#c-error-handling` | `ohc/c-error-handling` |
| `RULES/SECURITY.md#s-no-hardcoded-secret` | `ohc/s-no-hardcoded-secret` |
| `RULES/AI-USAGE.md#a-broker-only` | `ohc/a-broker-only` |
| ... | ... |

매핑이 깨지면 룰북 변경 게이트 (CI: 샘플 서비스 회귀) 자동 fail.

## 사용 (boilerplate 측)

```json
// .eslintrc.json
{
  "plugins": ["@ohc/rules"],
  "extends": ["plugin:@ohc/rules/recommended"]
}
```

`recommended` 프로필 = 모든 룰 활성화 (룰북 v1.0 의 57 룰).

## 구현 상태 (v0.1, 2026-06-12 초기)

| 룰 영역 | .md 룰 수 | 구현 룰 수 |
|---|---|---|
| CODING | 12 | **1** (c-error-handling) |
| SECURITY | 12 | **1** (s-no-hardcoded-secret) |
| AI-USAGE | 11 | **1** (a-broker-only) |
| PAGE-DEF | 10 | 0 (JSON 파일이라 eslint 적용 어려움 → 별도 zod 검증으로 대체) |
| DOMAIN-HEALTHCARE | 12 | 0 (REVIEWER 강한 의존) |
| **합계** | **57** | **3 (PoC 스캐폴드)** |

> 본 패키지 = Phase 3.5k 의 일부. 나머지 룰은 Phase 3.5 ~ 4 에서 구현.

## 빌드

```bash
npm install
npm run build
```

dist/ 가 생성되며 boilerplate `devDependencies` 에 npm link 또는 workspace 참조로 사용.

## 변경 거버넌스 (룰북 v1.0 README 참조)

1. .md ↔ plugin 동기 변경 (한쪽만 바뀐 PR 거부)
2. CI: 샘플 서비스 (boilerplate `my-todo`) 에 9 게이트 회귀 통과
3. 정보지원본부 승인
4. semver 태그

자기참조 원칙: 본 plugin 코드도 본 룰북 (CODING / SECURITY) 을 따른다.
