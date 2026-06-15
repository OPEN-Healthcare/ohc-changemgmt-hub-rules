# PAGE-DEF — `page-def.json` 작성법

> Hub Rules v1.0 · 마운트 명세 표준
> § ID = lint rule ID (1:1)
> 게이트: #5 openapi (스키마 정합) / #9 audit-conf (필드 존재) / #2 lint (구조)

---

## 전체 스키마

```jsonc
{
  "slug": "<kebab-case, 글로벌 유니크>",
  "menu": { "label": { "ko": "...", "en": "..." }, "icon": "<lucide name>" },
  // apiBase 필드 없음 (Hub 가 internal 강제 주입)
  "resource": "<RESTful resource 이름>",
  "routes": [
    { "path": "/svc/<slug>", "title": "...", "component": "ListPage", "permission": ["USER", ...] }
  ],
  "schema": { "list": { "columns": [...] }, "form": { "fields": [...] }, ... },
  "aiUsage": { ... }  // AI 사용 시 필수
}
```

---

## p-slug-kebab — slug 는 kebab-case

- **lint rule**: `ohc/p-slug-kebab`
- **게이트**: #5 openapi + #9 audit-conf

### 규칙

- slug = `[a-z][a-z0-9-]{2,40}` (소문자 시작, 영문/숫자/하이픈)
- 글로벌 유니크 (registry 에 동일 slug 존재 시 등록 거부)
- 길이 3~40

### 예

- ✅ `contract-draft`, `patient-records`, `my-todo`
- ❌ `ContractDraft`, `contract_draft`, `cd`, `1contract`

---

## p-menu-required — menu 필드 필수

- **lint rule**: `ohc/p-menu-required`
- **게이트**: #9 audit-conf

### 규칙

- `menu.label` 에 최소 `ko` 필수, `en` 권장
- `menu.icon` = `lucide-react` 의 icon 이름 (string)
- 라벨 ≤ 20자

---

## p-no-api-base — apiBase 필드 작성 금지

- **lint rule**: `ohc/p-no-api-base`
- **게이트**: #9 audit-conf

### 규칙

- 제출자는 `apiBase` 필드를 작성하지 않는다
- Hub 가 운영자 컨테이너 배포 시 internal 주소 자동 주입 (SSRF 방지, 기획서 §06)
- 작성 시 게이트 fail + 거절 피드백

---

## p-routes-array — routes 배열 강제

- **lint rule**: `ohc/p-routes-array`
- **게이트**: #9 audit-conf

### 규칙

- 최소 1개, 최대 8개
- 각 route 는 다음 필드 전부:
  - `path` (반드시 `/svc/<slug>` 또는 `/svc/<slug>/...` 로 시작)
  - `title` (≤ 30자)
  - `component` (`p-component-enum` 의 허용 목록)
  - `permission` (`p-permission-array` 의 허용 role)

---

## p-component-enum — 4 컴포넌트 한정

- **lint rule**: `ohc/p-component-enum`
- **게이트**: #9 audit-conf

### 규칙

- `component` 는 다음 중 하나만:
  - `ListPage` — 테이블 + 페이지네이션
  - `DetailPage` — 단일 항목 표시
  - `FormPage` — 입력 폼
  - `DashboardPage` — KPI + 차트 (Phase 4)
- 그 외 값은 fail

> 커스텀 UI 가 필요한 경우 = REVIEWER 와 협의 → Phase 7 호스팅 에이전트 또는 별도 Hub Web 확장 (현재 범위 외)

---

## p-permission-array — permission 은 role 배열

- **lint rule**: `ohc/p-permission-array`
- **게이트**: #9 audit-conf

### 규칙

- 각 route 의 `permission` 은 string 배열
- 허용 값: `USER` / `SUBMITTER` / `REVIEWER` / `OPERATOR`
- 최소 1개, 빈 배열 fail
- 빈 권한 = 모두 차단 의도면 `[]` 대신 `null` 명시 (그러나 비공개 의도 = REVIEWER 협의 필요)

### 좋은 예

```json
{ "path": "/svc/contract-draft", "title": "초안 목록",
  "component": "ListPage",
  "permission": ["USER", "SUBMITTER", "REVIEWER", "OPERATOR"] }
```

---

## p-schema-required — schema 필수 (component 별)

- **lint rule**: `ohc/p-schema-required`
- **게이트**: #9 audit-conf

### 규칙

| component | 필수 schema 키 |
|---|---|
| `ListPage` | `list.columns` (string[]) |
| `DetailPage` | `detail.fields` (FieldDef[]) |
| `FormPage` | `form.fields` (FieldDef[]) |
| `DashboardPage` | `dashboard.widgets` (WidgetDef[]) |

`FieldDef` 형식:

```typescript
{
  name: string,           // resource 의 속성명
  type: 'string' | 'number' | 'boolean' | 'date' | 'enum',
  required?: boolean,
  enum?: string[],
  label?: { ko: string, en?: string },
  // PII 표시 시
  pii?: { kind: 'name' | 'phone' | 'email' | 'patient-id', mask?: 'full' | 'partial' }
}
```

---

## p-ai-usage-required — AI 호출 서비스는 aiUsage 명시

- **lint rule**: `ohc/p-ai-usage-required`
- **게이트**: #9 audit-conf
- **결합**: AI-USAGE 의 `a-broker-only`, `a-zdr-routing`

### 규칙

- 코드에 `ai-key-broker` 사용 흔적 있으면 page-def 의 `aiUsage` 필수
- 미작성 시 fail
- 필드:
  - `providers` (allowlist: `claude` / `openai` / `gemini`)
  - `models` (allowlist)
  - `zdr` (boolean) — true = ZDR 계약 엔드포인트로만 라우팅
  - `piiMaskingProfile` = `strict` | `moderate` | `none`
  - `expectedDailyCalls` (number) — capacity planning

### 좋은 예

```json
"aiUsage": {
  "providers": ["claude"],
  "models": ["claude-opus-4-7"],
  "zdr": true,
  "piiMaskingProfile": "strict",
  "expectedDailyCalls": 50
}
```

---

## p-no-deeplink-loop — route path 순환 금지

- **lint rule**: `ohc/p-no-deeplink-loop`
- **게이트**: #9 audit-conf

### 규칙

- 동일 component 가 동일 slug 의 다른 route 로 redirect 하는 명세 금지
- routes 간 path 충돌 검사 (matchPath 우선순위 명확화)

---

## p-resource-rest — resource 는 RESTful 이름

- **lint rule**: `ohc/p-resource-rest`
- **게이트**: #9 audit-conf

### 규칙

- 복수형 영문 소문자 (`patients`, `drafts`, `items`)
- 마운트 서비스의 controller 경로와 일치 (`@Controller('drafts')`)

---

## p-version-pinned — version 필드 (Phase 6 의무화)

- **lint rule**: `ohc/p-version-pinned` (Phase 6 부터 error)
- **게이트**: #9 audit-conf
- **현재 (v1.0)**: warning

### 규칙

- page-def 에 `version: "1.0.0"` (semver) 권장
- registry 의 같은 slug 신규 등록 시 version 비교 → breaking 감지

---

## REVIEWER 책임 영역

- 권한 매핑이 도메인 의도와 맞는가 (예: 환자 정보 = USER 노출 적절한가)
- AI 사용 의도가 aiUsage 와 일치하는가 (declared 모델만 호출하는가)
- PII 필드 표시·마스킹 정책이 DOMAIN-HEALTHCARE 와 정합한가

---

## 변경 이력

| 버전 | 일자 | 변경 |
|---|---|---|
| v1.0 | 2026-06-12 | 10 룰 초기 정의 |
