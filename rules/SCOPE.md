# SCOPE — 권한 / 공개 범위 (Access Scope)

> Hub Rules v1.1 · SeeLink 자식 앱 권한/공개범위 표준
> § ID = lint rule ID (1:1)
> 게이트: #2 lint / #9 audit-conf
> 근거: `@open-healthcare/seelink-scope` (`ohc-seelink-scope` repo) · hub-api `src/lib/org-scope/visibility.ts`

---

## 배경

SeeLink 자식 앱은 5 종의 공개 범위 중 하나를 선언한다.

| Scope | 한글 라벨 | 누가 보나 |
|---|---|---|
| `private` | 비공개 | 본인만 (작성자 본인 + 관리자) |
| `team` | 팀 한정 | `scopeOrgCd` 산하 (팀 코드 기준) |
| `org` | 부서 한정 | `scopeOrgCd` 산하 (본부 코드 기준) |
| `selected` | 선택된 부서 | `allowedOrgCds` 중 하나라도 산하 |
| `all` | 전사 오픈 | 전체 |

판정은 조직코드(`orgCd`, HR 마스터 8자리)와 `isUnder(viewer.orgPath, scopeOrgCd)` 로만 한다. 부서 **이름**으로는 절대 판정하지 않는다 — 동명이 존재하고(`산업보건부` ×2 등), `deptPath[0]` 은 회사 전체 루트라 이름 비교는 사실상 "전사 오픈" 과 같아진다.

허브 게이트(`forward_auth`)는 앱 **진입**만 막는다. 앱은 자기 메뉴/데이터를 스스로 지켜야 하며, 신뢰 헤더 `X-Auth-User-Id / X-Auth-Email / X-Auth-Admin / X-Auth-Level / X-Auth-Roles / X-Auth-Dept / X-Auth-Division / X-Auth-Org-Cd / X-Auth-Org-Path` 로 신원을 받는다. 이 헤더는 게이트가 켜져 있을 때만 위조 불가능하다(Caddy 가 클라이언트 사본을 제거).

---

## x-scope-use-module — 공용 스코프 모듈 사용 강제

- **lint rule**: `ohc/x-scope-use-module` (커스텀 eslint plugin)
- **게이트**: #2 lint (자동) + #9 audit-conf (보조)
- **위반 시**: 앱마다 판정 로직이 갈라져 허브와 다른 결과를 낸다 ("허브에서는 보이는데 앱에서는 막힌다")

### 규칙

- 신원 파싱과 스코프 판정은 반드시 `@open-healthcare/seelink-scope` 의 `parseViewer` / `canAccess` / `menuFor` / `requireScope`(Express) / `ScopeGuard`(NestJS) 를 사용한다.
- `X-Auth-*` 헤더를 직접 읽어 자체 판정 함수를 새로 짜지 않는다.

### 좋은 예

```typescript
import { parseViewer, canAccess } from '@open-healthcare/seelink-scope';

const viewer = parseViewer(req.headers);
if (!canAccess(viewer, { scope: 'org', scopeOrgCd: '11510000' })) {
  return res.status(403).json({ code: 'SCOPE_FORBIDDEN' });
}
```

### 나쁜 예

```typescript
// 자체 파싱 + 자체 판정 — 허브와 술어가 어긋날 수 있다
const orgCd = req.headers['x-auth-org-cd'];
if (orgCd !== '11510000') {
  return res.status(403).json({ code: 'FORBIDDEN' });
}
```

---

## x-scope-no-name-match — 부서 이름 비교 금지

- **lint rule**: `ohc/x-scope-no-name-match`
- **게이트**: #2 lint (자동) + #9 audit-conf (간접 비교 패턴 보조 검토)
- **REVIEWER 책임**: 정적 패턴으로 못 잡는 간접 이름 비교(변수 경유, 문자열 조합 등)
- **위반 시**: 동명이인 부서(예: 제5센터/제7센터 산하 `산업보건부`)가 같이 뚫린다. `deptPath[0]` 비교는 사실상 전사 오픈과 동일해진다.

### 규칙

- `viewer.dept` / `viewer.division` / `deptPath` 는 화면 표시 전용이다. 접근 판정에 사용하지 않는다.
- 접근 판정은 오직 `orgCd` 기반 (`isUnder`, `isUnderAny`, `canAccess`) 으로만 한다.

### 좋은 예

```typescript
canAccess(viewer, { scope: 'org', scopeOrgCd: '11510000' });
```

### 나쁜 예

```typescript
if (viewer.dept === '산업보건부') {
  // 제5센터/제7센터 산하 두 개의 서로 다른 부서가 함께 통과됨
  return true;
}
```

---

## x-scope-fail-closed — scope 없는 정책은 fail-closed

- **lint rule**: `ohc/x-scope-fail-closed`
- **게이트**: #9 audit-conf (정적 검사 한계)
- **REVIEWER 책임**: `scope` 값 자체가 코드 전개 시점에 결정되는 동적 정책의 fail-closed 여부
- **위반 시**: 설정 누락이 "전체 공개" 로 해석되어 그대로 유출로 이어진다.

### 규칙

- `scope` 필드가 없거나 알 수 없는 값이면 거부한다 (`normalizeScope` 의 unknown 값은 `private` 로 취급하는 것과 동일한 방향).
- `team` / `org` 인데 `scopeOrgCd` 가 없는 정책·문서는 거부한다. "전체 허용" 으로 폴백하지 않는다.
- `selected` 인데 `allowedOrgCds` 가 비어있으면 거부한다.

### 좋은 예

```typescript
// scopeOrgCd 누락 → canAccess 가 자체적으로 거부한다. 별도 우회 로직을 얹지 않는다.
canAccess(viewer, { scope: 'org', scopeOrgCd: doc.scopeOrgCd });
```

### 나쁜 예

```typescript
if (!doc.scopeOrgCd) {
  return true; // 설정 누락을 전체 공개로 해석 — 유출
}
return isUnder(viewer.orgPath, doc.scopeOrgCd);
```

---

## x-scope-no-admin-default — 관리자 기본값 금지

- **lint rule**: `ohc/x-scope-no-admin-default`
- **게이트**: #2 lint (자동, `?? true` / `|| true` 패턴 매칭) + #9 audit-conf
- **REVIEWER 책임**: catch 절 등 정적 패턴으로 못 잡는 간접 기본값 부여
- **위반 시**: 헤더 파싱 실패나 게이트 우회 상황에서 모든 열람자가 관리자로 승격된다.

### 규칙

- `X-Auth-Admin` 등 신뢰 헤더가 없거나 파싱에 실패하면 `isAdmin` 은 항상 `false` 로 둔다.
- 헤더가 전혀 없는 요청은 `anonymousViewer()` (익명, `isAdmin: false`, 최저 레벨) 로 취급한다.

### 좋은 예

```typescript
import { parseViewer, anonymousViewer } from '@open-healthcare/seelink-scope';

const viewer = req.headers['x-auth-user-id'] ? parseViewer(req.headers) : anonymousViewer();
```

### 나쁜 예

```typescript
const isAdmin = req.headers['x-auth-admin'] ?? true; // 파싱 실패 시 관리자로 승격
```

---

## x-scope-vendor-untouched — 벤더 사본 수정 금지

- **lint rule**: `ohc/x-scope-vendor-untouched`
- **게이트**: #9 audit-conf (vendored 디렉터리 해시/diff 대조, 정적 lint 대상 아님)
- **위반 시**: 킷마다 판정 로직이 갈라져 허브 원본(`ohc-seelink-scope`)과 결과가 달라진다. 이후 원본에서 고친 버그가 갈라진 킷에는 반영되지 않는다.

### 규칙

- 킷에 벤더링된 `shell/seelink-scope/` 또는 `seelink-scope/` 디렉터리의 코드를 직접 수정하지 않는다.
- 버그·기능 요청은 `ohc-seelink-scope` 원본 repo 에 반영 후 버전 태그로 재벤더링한다.

### 좋은 예

원본 repo(`ohc-seelink-scope`)에 PR → 버전 태그 → 킷의 벤더 사본을 그 태그로 재동기화.

### 나쁜 예

```typescript
// kit 내부 shell/seelink-scope/access.ts 를 직접 열어 canAccess 로직을 패치
```

---

## x-scope-menu-gate — 메뉴/버튼 게이트 강제

- **lint rule**: `ohc/x-scope-menu-gate`
- **게이트**: #9 audit-conf (메뉴 정의 ↔ 대응 API 라우트 대조는 정적 lint 만으로 완결 불가)
- **REVIEWER 책임**: 메뉴/버튼을 숨긴 화면의 대응 API 엔드포인트에 동일 정책의 `requireScope`/`ScopeGuard` 가 실제로 걸려 있는지 확인 ("존재 ≠ 의미" 영역)
- **위반 시**: 메뉴만 숨고 API 는 열려 있어 URL 직접 호출로 데이터가 노출된다.

### 규칙

- 메뉴/버튼 노출 여부는 `menuFor` / `canAccess` 로 계산한다. 클라이언트에서 조건부 렌더링만으로 감추는 hide-only 로직을 최종 방어선으로 삼지 않는다.
- 메뉴가 숨는 화면에 대응하는 서버 엔드포인트는 반드시 `requireScope`(Express) 또는 `ScopeGuard`(NestJS) 등 서버 측 검증을 동반한다.

### 좋은 예

```typescript
// 메뉴: menuFor 로 계산
const visible = menuFor(viewer, MENU);

// 대응 API: 서버 측에도 동일 정책
app.get('/reports', requireScope({ scope: 'org', scopeOrgCd: '11510000' }), handler);
```

### 나쁜 예

```typescript
// 메뉴만 숨기고 API 는 무방비
const visible = MENU.filter((m) => viewer.dept === '경영지원팀'); // 이름 비교 + 서버 검증 없음
app.get('/reports', handler); // requireScope 없음 — URL 로 바로 접근 가능
```
