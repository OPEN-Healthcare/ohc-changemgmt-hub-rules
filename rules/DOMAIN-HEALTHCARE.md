# DOMAIN-HEALTHCARE — 헬스케어 도메인 표준

> Hub Rules v1.0 · 헬스케어 도메인 (PII / PHI / 컴플라이언스)
> § ID = lint rule ID (1:1)
> 게이트: #9 audit-conf (자동 일부) / REVIEWER 6 영역 (도메인 의미 영역)
>
> ⚠️ 본 룰북은 정보지원본부 + 법무 검토 대기 중 (기획서 §15 D4). 컴플라이언스 결과에 따라 v1.1 에서 보강.

---

## h-pii-classification — PII / PHI 정의

- **lint rule**: 없음 (REVIEWER 책임)
- **게이트**: REVIEWER + #9 audit-conf 보조

### 규칙

본 시스템에서 사용하는 데이터 분류:

| 등급 | 정의 | 예 |
|---|---|---|
| **PHI** (Protected Health Information) | 환자의 의료 정보 + 식별자 결합 | 환자 ID + 진단명, 처방 내역 |
| **PII** (Personally Identifiable Information) | 개인 식별 정보 | 이름, 전화, 이메일, 주소, 주민번호 |
| **Internal** | 사내 운영 정보 | 직원 부서, 사번 |
| **Public** | 공개 가능 | 일반 의료 가이드 |

PHI 처리 서비스 = `DOMAIN-HEALTHCARE` 룰 전부 적용 강제.

---

## h-patient-id-mask — 환자 식별자 마스킹

- **lint rule**: `ohc/h-patient-id-mask`
- **게이트**: #2 lint + #9 audit-conf

### 규칙

- 환자 ID 는 page-def 의 list/detail 표시 시 `pii: { kind: 'patient-id', mask: 'partial' }` 선언 필수
- 로그에 환자 ID 평문 출력 금지 (NestJS Logger 필터 강제)
- audit_events 에는 hash (SHA-256) 저장 + lookup 가능한 별도 보호 테이블

### 좋은 예

```typescript
// FieldDef 에 pii 선언
{
  name: 'patientId',
  type: 'string',
  pii: { kind: 'patient-id', mask: 'partial' }
}
```

```typescript
// Logger 출력
this.logger.log(`patient lookup hash=${hashPatientId(id)}`);  // hash only
```

### 나쁜 예

```typescript
this.logger.log(`patient ${patientId} accessed`);  // 평문
```

---

## h-phi-encryption-at-rest — PHI 저장 시 암호화

- **lint rule**: `ohc/h-phi-encryption-at-rest`
- **게이트**: #2 lint + REVIEWER

### 규칙

- PHI 컬렉션은 Mongoose schema 레벨 암호화 (예: `mongoose-encryption` 또는 application 측 AES-256-GCM)
- 키는 KMS (Phase 5c) 또는 env (PoC 단계)
- 키 롤테이션 = 분기

---

## h-phi-tls-only — PHI 전송 시 TLS

- **lint rule**: `ohc/h-phi-tls-only`
- **게이트**: #2 lint

### 규칙

- PHI 데이터 송수신은 HTTPS / TLS 1.2+
- 내부 통신 (Hub API → 마운트 서비스) 도 mTLS 권장 (Phase 5c)
- HTTP fallback 코드 패턴 fail

---

## h-audit-required — PHI 접근 audit 필수

- **lint rule**: `ohc/h-audit-required`
- **게이트**: #2 lint + #9 audit-conf

### 규칙

- PHI 컬렉션의 read/write/delete 모든 호출은 `audit_events` 기록
- audit 누락 패턴 (raw `model.find()` without audit wrapper) = fail
- boilerplate 에 `@AuditPHI()` 데코레이터 또는 interceptor 제공

### 좋은 예

```typescript
@AuditPHI('patient-record-read')
async findPatient(id: string, actor: Principal) {
  return this.model.findById(id).lean();
}
```

---

## h-no-export-without-approval — PHI 외부 전송 금지

- **lint rule**: `ohc/h-no-export-without-approval`
- **게이트**: #2 lint + REVIEWER

### 규칙

- PHI 를 외부 시스템 / 외부 API 로 전송하는 코드 = `@ExternalExport()` 데코레이터 + 정보지원본부 승인 필요
- 미선언 외부 호출 (axios/fetch 직접 호출) = fail
- ai-key-broker 경유 호출은 자동 ZDR 라우팅 (a-zdr-routing 결합)

---

## h-retention-policy — 보관 기간 정책 (D4 컴플라이언스 결과 대기)

- **lint rule**: 없음 (운영 정책)
- **게이트**: 운영 모니터링
- **현재**: 임시 90일 audit / PHI 보관 기간 미정

### 규칙 (잠정)

- audit_events: **임시 90일** (헬스케어 컴플라이언스 결과 후 확정)
- PHI 컬렉션: 사용 종료 후 정책 보관 기간 (의료법 검토 중)
- 삭제 = soft delete (논리적 deletion flag) + 보관 기간 후 hard purge
- 환자 요구 시 즉시 hard delete (개인정보보호법)

---

## h-cross-tenant-isolation — 부서/병원 간 데이터 격리

- **lint rule**: `ohc/h-cross-tenant-isolation`
- **게이트**: #2 lint + REVIEWER

### 규칙

- 마운트 서비스는 자신의 tenant 데이터만 접근 (Phase 5a 의 별도 DB + 전용 계정으로 강제)
- 코드 레벨: 모든 PHI 쿼리에 `tenantId` 필터 필수
- 누락 패턴 검출 (`model.find({})` without tenantId) = fail

### 좋은 예

```typescript
async findAll(tenantId: string) {
  return this.model.find({ tenantId }).lean();
}
```

### 나쁜 예

```typescript
async findAll() {
  return this.model.find({}).lean();  // tenantId 누락
}
```

---

## h-minor-consent — 미성년자 동의 확인

- **lint rule**: 없음 (REVIEWER 책임)
- **게이트**: REVIEWER

### 규칙

- 미성년 환자 PHI 처리 = 보호자 consent 기록 필수
- consent 컬렉션 별도 + 만료 기간 추적
- REVIEWER 가 use case 별 확인

---

## h-ai-output-medical-disclaimer — LLM 의료 출력 = 사람 confirm 필수

- **lint rule**: 없음 (REVIEWER + AI-USAGE 결합)
- **게이트**: REVIEWER + #9 audit-conf
- **결합**: AI-USAGE `a-no-self-generation-eval`

### 규칙

- LLM 이 생성한 의료 정보 (진단 / 처방 / 치료 권고) = **반드시 사람 의료진 confirm** 후 표시
- 자동 머지 / 자동 노출 = 금지
- UI 에 "AI 생성 — 의료진 검토 대기" 배지 강제

---

## h-emergency-access — 응급 시 권한 우회 + audit 강제

- **lint rule**: `ohc/h-emergency-access`
- **게이트**: #2 lint

### 규칙

- 응급 상황에 일반 권한 체크 우회가 필요한 경우 (예: 응급실 의사가 새 환자 즉시 조회)
- `@EmergencyAccess('reason-code')` 데코레이터로만 우회
- 우회 시 audit_events 에 `actor: emergency:<sub>`, reason 자동 기록
- REVIEWER 가 분기 1회 응급 우회 로그 감사

---

## h-pseudo-anonymization-for-research — 연구 용도 = 가명화 필수

- **lint rule**: 없음 (REVIEWER 책임)
- **게이트**: REVIEWER

### 규칙

- 연구 목적 PHI 사용 = 가명화 (식별자 제거 + lookup 테이블 분리 보관)
- 가명화된 데이터셋 export 시 별도 페이지 (REVIEWER 6 영역에서 명시 검토)

---

## h-pii-mask-profile-strict — 헬스케어 서비스는 piiMaskingProfile=strict 기본

- **lint rule**: `ohc/h-pii-mask-profile-strict`
- **게이트**: #9 audit-conf
- **결합**: AI-USAGE `a-pii-masking-profile`

### 규칙

- DOMAIN-HEALTHCARE 룰북을 적용하는 서비스 = `aiUsage.piiMaskingProfile = "strict"` 강제
- `moderate` / `none` 선언 시 REVIEWER 의 명시 승인 필요 (예외 사유 page-def 코멘트)

---

## REVIEWER 책임 영역 (강한 사람 게이트)

- PHI 정의의 적절성 (어떤 필드가 PHI 인지 도메인 판단)
- consent / retention / 응급 우회 흐름의 의료 절차 정합성
- LLM 출력의 의료 안전성 (자동화 가능 범위 결정)
- 가명화의 충분성 (재식별 가능성 평가)

---

## 컴플라이언스 참조 (D4 결과 대기)

- 개인정보보호법 (한국)
- 의료법 / 의료서비스법
- 의료기기법 (LLM 의료 출력 분류)
- 헬스케어 도메인 보관 기간 (분기 법무 검토)
- HIPAA / GDPR (해외 협력 시)

---

## 변경 이력

| 버전 | 일자 | 변경 |
|---|---|---|
| v1.0 | 2026-06-12 | 12 룰 초기 정의 (D4 컴플라이언스 결과 후 v1.1 보강 예정) |
