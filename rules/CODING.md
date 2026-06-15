# CODING — 코딩 표준

> Hub Rules v1.0 · 코딩 표준
> § ID = lint rule ID (1:1, `@ohc/eslint-plugin-rules`)
> 게이트: #2 lint (전부 자동), 일부는 #3 test 보조

---

## c-error-handling — 에러 처리는 HttpException 으로

- **lint rule**: `ohc/c-error-handling`
- **게이트**: #2 lint
- **위반 시**: raw `Error` 또는 `throw "string"` 검출

### 규칙

- 모든 service / controller 의 throw 는 `HttpException` 또는 그 서브클래스 (`BadRequestException`, `NotFoundException` 등)
- 메시지는 사용자 친화 한국어 + 내부 추적용 영문 코드 병행
- 원본 에러는 `cause` 로 전달

### 좋은 예

```typescript
throw new BadRequestException({
  message: '환자 ID 형식이 올바르지 않습니다',
  code: 'PATIENT_ID_INVALID_FORMAT',
});
```

### 나쁜 예

```typescript
throw new Error('invalid id');           // raw Error
throw 'bad request';                     // string throw
throw new Error(`bad: ${input}`);        // PII 누출 위험
```

---

## c-immutability — 객체 / 배열 직접 수정 금지

- **lint rule**: `ohc/c-immutability`
- **게이트**: #2 lint

### 규칙

- 함수 인자로 받은 객체/배열은 절대 mutate 하지 않음
- 새 객체 반환 (`{...old, x: y}`, `[...arr, item]`, `structuredClone`)
- Mongoose document 수정 시도 `lean()` + 신규 객체

### 좋은 예

```typescript
function updatePatient(p: Patient, name: string): Patient {
  return { ...p, name };
}
```

### 나쁜 예

```typescript
function updatePatient(p: Patient, name: string): Patient {
  p.name = name;       // mutate
  return p;
}
```

---

## c-naming — 명명 규칙

- **lint rule**: `ohc/c-naming`
- **게이트**: #2 lint

### 규칙

| 대상 | 형식 | 예 |
|---|---|---|
| 파일명 | kebab-case | `patient-records.service.ts` |
| 클래스 | PascalCase | `PatientRecordsService` |
| 함수/변수 | camelCase | `findPatientById` |
| 상수 (모듈 레벨) | SCREAMING_SNAKE | `MAX_RECORDS_PER_PAGE` |
| 인터페이스 | PascalCase + 명사 | `PatientRecord` (접두 `I` 금지) |
| 타입 alias | PascalCase + 명사 | `PatientId` |
| slug (page-def) | kebab-case | `patient-records` |

---

## c-file-size — 파일 크기 제한

- **lint rule**: `ohc/c-file-size`
- **게이트**: #2 lint

### 규칙

- 기본 ≤ 400 lines, hard limit 800 lines
- 800 line 초과 시 lint 에러 (예외 = `.eslintrc` 의 `overrides` 에 등록 + 사유 코멘트)

---

## c-no-console — console.log 금지

- **lint rule**: `ohc/c-no-console`
- **게이트**: #2 lint

### 규칙

- `console.log/info/debug/warn/error` 직접 사용 금지
- 로깅은 NestJS `Logger` 사용 (`@nestjs/common`)
- 예외: 테스트 파일 (`*.spec.ts`)

### 좋은 예

```typescript
private readonly logger = new Logger(PatientService.name);
this.logger.log('patient created');
```

---

## c-async-await — async/await 강제

- **lint rule**: `ohc/c-async-await`
- **게이트**: #2 lint

### 규칙

- 비동기 코드는 async/await 우선
- `.then().catch()` chain 금지 (rxjs operator 는 예외)
- 모든 async function 의 throw 는 그대로 caller 에 전파, swallow 금지

### 나쁜 예

```typescript
function load() {
  return db.find().then(r => r).catch(() => null);  // chain + swallow
}
```

---

## c-di — NestJS 의존성 주입 강제

- **lint rule**: `ohc/c-di`
- **게이트**: #2 lint

### 규칙

- service / controller 의 의존성은 생성자 주입만
- `new SomeService()` 직접 생성 금지
- `@Injectable()` 데코레이터 누락 = 에러

### 좋은 예

```typescript
@Injectable()
export class PatientService {
  constructor(
    @InjectModel('Patient') private readonly model: Model<Patient>,
    private readonly logger: LoggerService,
  ) {}
}
```

---

## c-no-any — `any` 타입 금지

- **lint rule**: `ohc/c-no-any`
- **게이트**: #2 lint

### 규칙

- `any` 사용 금지. 모호한 경우 `unknown` 후 narrowing
- 외부 라이브러리 응답은 zod 로 parse → 타입 확정

### 좋은 예

```typescript
const parsed = ExternalSchema.parse(response);  // typed
```

### 나쁜 예

```typescript
const data: any = response;  // any
```

---

## c-zod-validation — 입력 검증은 zod 로 강제

- **lint rule**: `ohc/c-zod-validation`
- **게이트**: #2 lint
- **위반 시**: controller 의 body/param/query 가 zod 미통과 검출

### 규칙

- 모든 controller 입력 (body, query, param) 은 zod schema 통과 후 service 진입
- `ZodValidationPipe` 등록 강제 (boilerplate 에 포함)
- raw `@Body() body: any` 금지 (c-no-any 와 결합)

### 좋은 예

```typescript
@Post()
async create(@Body(new ZodValidationPipe(CreatePatientDto)) dto: z.infer<typeof CreatePatientDto>) {
  return this.svc.create(dto);
}
```

---

## c-test-required — 모든 모듈에 unit test

- **lint rule**: `ohc/c-test-required`
- **게이트**: #3 test (coverage 측정)

### 규칙

- 모든 service / controller 에 대응 `*.spec.ts` 필수
- coverage 80%+ 권장 (게이트 #3 통과 조건은 60% — 점진 상향)
- DB 의존 테스트는 `mongodb-memory-server` (게이트 컨테이너에 포함)

---

## c-no-todo-merged — TODO 코멘트 merge 금지

- **lint rule**: `ohc/c-no-todo-merged`
- **게이트**: #2 lint

### 규칙

- `// TODO` / `// FIXME` 가 있는 코드는 게이트 fail
- 진짜 미완 작업은 issue tracker 로, 코드에는 issue 링크 + deadline

### 좋은 예

```typescript
// see issue #142 (deadline 2026-07-01)
// 회귀 fix 가 들어오면 이 분기 제거
if (legacyFlag) { ... }
```

---

## c-mongoose-schema-typed — Mongoose schema 강제 타입

- **lint rule**: `ohc/c-mongoose-schema-typed`
- **게이트**: #2 lint, #6 migration (breaking change 감지)

### 규칙

- Mongoose schema 는 `@Schema()` + `@Prop()` + 명시 타입
- `Document` extends + interface 분리
- `Schema.Types.Mixed` 금지 (불가피하면 zod 추가 검증 + 코멘트)

---

## REVIEWER 책임 영역 (정적 검사 한계)

다음은 lint 가 잡지 못한다. REVIEWER 6 영역 체크리스트:

- 함수가 단일 책임을 지키는가 (SRP)
- 변수명이 도메인 어휘를 잘 반영하는가
- 에러 메시지가 사용자에게 적절한가 (PII 누출 / 너무 기술적)
- 테스트가 실제 시나리오를 커버하는가 (커버리지 % ≠ 의미)

---

## 변경 이력

| 버전 | 일자 | 변경 |
|---|---|---|
| v1.0 | 2026-06-12 | 12 룰 초기 정의 |
