# Exceptions (예외 조항)

이 문서는 룰북(pii-patterns.md, owasp-top10.md, chrome.md)의 예외를 관리합니다.

**관리 원칙:**
- 모든 예외는 REVIEWER 역할만 수정 가능
- 최대 유효기간: 90일
- **PII 5종 패턴 (pii-patterns.md)은 예외 불가** (절대 금지)
- 기타 룰은 명시적 허용 가능 (사유 필수)
- Layer E(사용자 리뷰)에서 거절 가능성 있음

---

## 예외 템플릿

```json
{
  "id": "EXC-001",
  "rule_file": "owasp-top10.md",
  "rule_section": "A01:2021 – Broken Access Control",
  "service_slug": "hello-clinic",
  "reason": "레거시 의료 기록 시스템과의 통합을 위해 임시로 권한 검증 우회 필요",
  "justification": "기존 PPCC API는 Bearer token 없이 Patient ID로만 인증. 새 아키텍처로 마이그레이션 중 (예상 3주)",
  "scope": "GET /api/patients/{patientId}/medical-records 엔드포인트만",
  "created_at": "2026-06-22",
  "expires_at": "2026-07-13",
  "status": "active",
  "reviewer": "reviewer@openhealthcare.com",
  "mitigation": [
    "엔드포인트는 내부 네트워크(.10.0.0.0/8)에서만 접근 가능",
    "접근 로그는 매시간 수집 및 검토"
  ]
}
```

---

## 활성 예외 목록

### 초기 상태

**현재 활성 예외: 0건**

---

## 예외 추가 방법

1. **사유 검증:**
   - PII 5종은 절대 불가
   - 기타 룰은 비즈니스 정당성 + 기술 근거 필수

2. **REVIEWER 승인:**
   - 이 문서를 업데이트하려면 리뷰어 권한 필요
   - PR/MR에서 리뷰어 명시 승인 필수

3. **유효기간 설정:**
   - 최대 90일 (90일 후 자동 거절)
   - 연장 필요 시 새 예외 신청

4. **완화 조치(Mitigation):**
   - 예외 기간 동안 위험을 최소화하는 조치 명시
   - 예: 접근 로깅, 내부 네트워크 제한, 정기 감시

---

## 예외 해제 (만료/조기 종료)

예외가 불필요해지면 즉시 해제:

```json
{
  "id": "EXC-001",
  "status": "closed",
  "closed_at": "2026-07-10",
  "reason_closed": "레거시 시스템 마이그레이션 완료"
}
```

---

## 금지 사항

**다음 조건은 예외 대상 불가:**

1. **PII 5종:**
   - 주민등록번호
   - 전화번호
   - 이메일
   - 환자명
   - 진료기록 ID

2. **A02:2021 암호화 실패:**
   - HTTPS 미사용
   - 약한 암호화(MD5, SHA1)
   - 평문 패스워드 저장

3. **A03:2021 주입 공격:**
   - SQL/NoSQL/OS 명령어 직접 주입
   - 사용자 입력 미검증

4. **A08:2021 데이터 무결성:**
   - 서명 없는 배포
   - 자동 업데이트 무한 허용

---

## 정기 검토

- **월 1회:** 만료 임박 예외 알림
- **분기 1회:** 활성 예외 효율성 검토
- **반기 1회:** 전체 예외 정책 재검토

---

## 질문/의견

예외 신청 또는 이의:
- OHC 내부 슬랙: #hub-rules-exceptions
- 깃허브 이슈: OPEN-Healthcare/ohc-changemgmt-hub-rules/issues
