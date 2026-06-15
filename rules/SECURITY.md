# SECURITY — 보안 베이스라인

> Hub Rules v1.0 · 보안 표준
> § ID = lint rule ID (1:1)
> 게이트: #2 lint / #7 sbom-sca / #8 gitleaks / #9 audit-conf

---

## s-role-guard-required — 모든 controller 에 `@Roles()` 강제

- **lint rule**: `ohc/s-role-guard-required`
- **게이트**: #2 lint (존재 검사) + #9 audit-conf (보조)
- **REVIEWER 책임**: role 매핑의 적절성 (존재 ≠ 의미)

### 규칙

- 모든 controller method 에 `@Roles('USER' | 'SUBMITTER' | 'REVIEWER' | 'OPERATOR')` 데코레이터
- 공개 (인증 불요) endpoint 는 `@Public()` 명시 (기본 deny)
- guard 적용은 boilerplate 의 `OidcGuard + RoleGuard` 글로벌

### 좋은 예

```typescript
@Controller('patients')
@UseGuards(OidcGuard, RoleGuard)
export class PatientController {
  @Get(':id')
  @Roles('USER', 'REVIEWER', 'OPERATOR')
  async findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }
}
```

### 나쁜 예

```typescript
@Get(':id')                            // @Roles 누락
async findOne(@Param('id') id: string) {
  return this.svc.findOne(id);
}
```

---

## s-no-hardcoded-secret — 비밀 하드코딩 금지

- **lint rule**: `ohc/s-no-hardcoded-secret`
- **게이트**: #2 lint + #8 gitleaks (히스토리 전체)

### 규칙

- API 키 / 비밀번호 / 토큰 / 인증서 = 절대 코드에 박지 않음
- 모두 `@nestjs/config` 의 env 로 (`.env` 는 `.gitignore` 강제)
- `.env.example` 에는 키 이름만, 값은 더미

### 좋은 예

```typescript
@Injectable()
export class ExternalApiClient {
  constructor(private readonly config: ConfigService) {}
  
  async call() {
    const key = this.config.get<string>('EXTERNAL_API_KEY');
    if (!key) throw new InternalServerErrorException({ code: 'CONFIG_MISSING_EXTERNAL_API_KEY' });
    // ...
  }
}
```

### 나쁜 예

```typescript
const apiKey = 'sk-proj-abc123';                  // 하드코딩
const dbUrl = 'mongodb://admin:pass@host:27017';  // 자격증명 포함
```

---

## s-no-eval — eval / new Function 금지

- **lint rule**: `ohc/s-no-eval`
- **게이트**: #2 lint

### 규칙

- `eval()`, `new Function()`, `setTimeout(string, ...)` 모두 금지
- 동적 코드 실행이 필요하면 사전 정의된 함수 맵으로

---

## s-no-mongo-injection — Mongo 쿼리 안전성

- **lint rule**: `ohc/s-no-mongo-injection`
- **게이트**: #2 lint

### 규칙

- 사용자 입력을 Mongoose 쿼리 객체에 직접 전달 금지
- `$where`, `$function`, JavaScript 표현 쿼리 금지
- 모든 쿼리 입력은 zod 로 parse → primitive 타입 강제 후 사용

### 좋은 예

```typescript
const filter = QueryFilterSchema.parse(req.query);  // typed primitives
await this.model.find({ status: filter.status }).lean();
```

### 나쁜 예

```typescript
await this.model.find(req.query);                   // 객체 직접 전달
await this.model.find({ $where: req.query.expr });  // $where
```

---

## s-helmet-required — helmet 미들웨어 등록 강제

- **lint rule**: `ohc/s-helmet-required`
- **게이트**: #2 lint

### 규칙

- NestJS bootstrap 에서 `helmet()` 미들웨어 적용
- CSP / HSTS / X-Frame-Options 기본 적용

### 좋은 예

```typescript
// main.ts
const app = await NestFactory.create(AppModule);
app.use(helmet());
```

---

## s-cors-allowlist — CORS 와일드카드 금지

- **lint rule**: `ohc/s-cors-allowlist`
- **게이트**: #2 lint

### 규칙

- `app.enableCors({ origin: '*' })` 금지
- 마운트된 서비스는 Hub 게이트웨이 경유로만 접근되므로 origin = `https://hub.openhealthcare.com` 한정 권장
- env 로 allowlist 관리

---

## s-rate-limit — 모든 controller 에 rate limit

- **lint rule**: `ohc/s-rate-limit`
- **게이트**: #2 lint

### 규칙

- `@nestjs/throttler` 의 `@Throttle()` 데코레이터 강제
- 기본값: 분당 60 (조회) / 분당 10 (변경)
- 게이트웨이 (Phase 5c) 가 추가 layer

---

## s-input-validation — 입력 검증 zod 강제 (c-zod-validation 과 결합)

- **lint rule**: `ohc/s-input-validation`
- **게이트**: #2 lint

### 규칙

- 모든 controller 입력 (body/query/param) 은 zod 통과
- `c-zod-validation` 과 같은 검사를 보안 측면에서 강제
- raw input 사용 시 fail

---

## s-no-prototype-pollution — Object prototype 조작 금지

- **lint rule**: `ohc/s-no-prototype-pollution`
- **게이트**: #2 lint

### 규칙

- `__proto__` / `constructor.prototype` / `Object.assign(target, untrusted)` 패턴 금지
- 외부 객체 머지 시 `structuredClone` 또는 명시 필드 복사

---

## s-error-no-leak — 에러 응답에 내부 정보 누출 금지

- **lint rule**: `ohc/s-error-no-leak`
- **게이트**: #2 lint + REVIEWER

### 규칙

- production 에러 응답에 stack trace / 내부 경로 / DB 쿼리 노출 금지
- `c-error-handling` 의 `code` 만 외부 노출, 상세는 audit_events 로

### 좋은 예

```typescript
throw new InternalServerErrorException({
  message: '내부 오류가 발생했습니다',
  code: 'PATIENT_LOOKUP_FAILED',
});
// 내부 상세는 logger.error 로
```

---

## s-sbom-clean — sbom-sca high+ 0 (#7 게이트 강제)

- **lint rule**: 없음 (게이트 #7 만)
- **게이트**: #7 sbom-sca

### 규칙

- `syft` + `grype` 로 SBOM 생성 + 취약점 스캔
- high / critical 0개 강제 (medium 은 경고)

---

## s-gitleaks-clean — secret 검출 0 (#8 게이트 강제)

- **lint rule**: 없음 (게이트 #8 만)
- **게이트**: #8 gitleaks (**히스토리 전체 스캔**)

### 규칙

- `.git` 디렉토리 전체 히스토리에 secret 패턴 0개
- 과거 commit 에 비밀이 있으면 fail → 제출자가 history rewrite + force push 필요
- 발견 즉시 비밀 폐기 + 재발급 의무 (REVIEWER 가 절차 안내)

---

## s-package-quarantine — 신규 패키지는 격리 큐 통과 필수

- **lint rule**: 없음 (게이트 #1 fetch 단계)
- **게이트**: #1 fetch

### 규칙

- `package.json` 의 의존성 중 **사내 첫 사용** 인 패키지는 정보지원본부 검토 → 미러 등재 후 사용
- 검토 자동화 (Phase 6):
  - typosquat 검출 (이름 유사도)
  - 다운로드 수 < 임계
  - 게시 후 7일 미만 (악성 신규 위험)
  - 메인테이너 ≤ 1명

### 검토 SLA

- ≤ 2 영업일 (기획서 §14 측정)
- 긴급 시 OPERATOR 수동 승인 + 사후 보고

---

## REVIEWER 책임 영역 (정적 검사 한계)

- `@Roles()` 의 role 매핑이 실제 의도와 맞는가
- 에러 코드가 적절히 분류되어 있는가
- 외부 호출 라이브러리 선택의 적절성 (Hub broker 우회 시도 등)
- 도메인 PII 흐름이 SECURITY 와 DOMAIN-HEALTHCARE 양쪽을 만족하는가

---

## 변경 이력

| 버전 | 일자 | 변경 |
|---|---|---|
| v1.0 | 2026-06-12 | 12 룰 초기 정의 |
