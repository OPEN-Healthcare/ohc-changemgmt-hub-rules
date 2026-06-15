# AI-USAGE — AI 사용 정책

> Hub Rules v1.0 · AI 거버넌스
> § ID = lint rule ID (1:1)
> 게이트: #9 audit-conf (필드 존재) / #2 lint (코드 패턴)

---

## a-broker-only — ai-key-broker 경유 강제

- **lint rule**: `ohc/a-broker-only`
- **게이트**: #2 lint + #9 audit-conf
- **위반 시**: 외부 LLM SDK 직접 호출 검출 (예: `new Anthropic()`, `new OpenAI()`)

### 규칙

- 모든 LLM 호출은 Hub 의 `ai-key-broker` 모듈 경유
- 외부 LLM SDK 직접 사용 금지 (`@anthropic-ai/sdk`, `openai`, `@google/generative-ai`)
- broker 인터페이스: `BrokerClient.chat({ provider, model, messages, ... })`

### 좋은 예

```typescript
@Injectable()
export class DraftGenerator {
  constructor(private readonly broker: BrokerClient) {}
  
  async generate(prompt: string) {
    return this.broker.chat({
      provider: 'claude',
      model: 'claude-opus-4-7',
      messages: [{ role: 'user', content: prompt }],
    });
  }
}
```

### 나쁜 예

```typescript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_KEY });
// 키 직접 사용, broker 우회 = fail
```

---

## a-no-raw-key — LLM API 키 보유 금지

- **lint rule**: `ohc/a-no-raw-key`
- **게이트**: #2 lint + #8 gitleaks

### 규칙

- 환경변수에 LLM 키 (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY` 등) 등록 금지
- 마운트 서비스는 키를 모름. broker 가 마스터 키로 호출.
- gitleaks 가 secret 패턴 검출 시 fail

---

## a-ai-usage-declared — page-def 의 aiUsage 일치 강제

- **lint rule**: `ohc/a-ai-usage-declared`
- **게이트**: #9 audit-conf
- **결합**: PAGE-DEF 의 `p-ai-usage-required`

### 규칙

- 코드에서 broker 호출하는 모델은 page-def 의 `aiUsage.models` 안에 있어야 함
- 신규 모델 사용 시 page-def 갱신 + 재제출

### 좋은 예 (page-def 와 코드 동기)

```json
"aiUsage": { "providers": ["claude"], "models": ["claude-opus-4-7"], ... }
```

```typescript
this.broker.chat({ provider: 'claude', model: 'claude-opus-4-7', ... });
```

### 나쁜 예

```typescript
this.broker.chat({ model: 'claude-haiku-4-5' });  // page-def 미선언 모델
```

---

## a-zdr-routing — zdr 플래그는 라우팅 요구 선언

- **lint rule**: `ohc/a-zdr-routing` (broker side, audit-conf 보조)
- **게이트**: #9 audit-conf

### 규칙

- `aiUsage.zdr=true` = broker 가 **ZDR 계약 체결된 마스터 키/엔드포인트** 로만 라우팅
- ZDR 은 회사-벤더 간 계약 속성 (요청 플래그 아님)
- broker 가 ZDR 미체결 엔드포인트로 폴백 시도 = 즉시 차단
- 헬스케어 PII 처리 서비스 = `zdr: true` 강제 (DOMAIN-HEALTHCARE 와 결합)

---

## a-pii-masking-profile — PII 마스킹 프로파일 선언

- **lint rule**: `ohc/a-pii-masking-profile`
- **게이트**: #9 audit-conf

### 규칙

- `aiUsage.piiMaskingProfile` 필수 (`strict` | `moderate` | `none`)
- `strict` (헬스케어 default): broker 가 송신 전 NER 로 환자식별자/번호/주소 마스킹
- `moderate`: 명시 패턴만 (전화/이메일/주민번호)
- `none`: 마스킹 미적용 (사내 데이터 처리 안 하는 경우만 — REVIEWER 강제 확인)
- 마스킹 분류기 = **로컬 모델 또는 ZDR 전용 엔드포인트만** (LLM 분류 자기모순 회피, 기획서 §11)

---

## a-provider-allowlist — provider 화이트리스트

- **lint rule**: `ohc/a-provider-allowlist`
- **게이트**: #9 audit-conf

### 규칙

- 허용: `claude` / `openai` / `gemini` (분기 정보지원본부 검토)
- 그 외 provider 사용 시 fail
- 신모델 등재 = 룰북 갱신 PR + 정보지원본부 승인 (자기참조)

---

## a-model-allowlist — model 화이트리스트

- **lint rule**: `ohc/a-model-allowlist`
- **게이트**: #9 audit-conf

### 규칙

- 허용 모델 (v1.0 기준):
  - `claude-opus-4-7`, `claude-sonnet-4-6`, `claude-haiku-4-5`
  - `gpt-5`, `gpt-5-mini`
  - `gemini-3-pro`
- 모델 deprecated 시 룰북 minor 갱신 + 30일 마이그레이션 기간

---

## a-cost-meter — 비용 카운터 자동 (broker 책임)

- **lint rule**: 없음 (broker side 자동)
- **게이트**: 자동 (운영 모니터링)

### 규칙

- broker 가 호출마다 `slug` 별 cost meter 증가 (token 단위)
- 부서별 분기 쿼터 (Phase 6) 초과 시 호출 거부
- audit_events 에 비용 이벤트 기록

---

## a-prompt-template-versioned — 프롬프트 템플릿 버전 관리

- **lint rule**: `ohc/a-prompt-template-versioned`
- **게이트**: #2 lint

### 규칙

- 인라인 string 으로 프롬프트 박는 것 금지 (재현성 / 회귀 추적 불가)
- `prompts/<name>.<version>.txt` 파일로 분리 + buildHash audit
- broker 호출 시 promptId + buildHash 함께 기록

### 좋은 예

```typescript
const prompt = await this.prompts.load('draft-generator', 'v3');
return this.broker.chat({
  ...,
  messages: [{ role: 'system', content: prompt.template }, { role: 'user', content: input }],
  meta: { promptId: prompt.id, promptHash: prompt.hash },
});
```

---

## a-stream-allowed — stream 응답은 명시 선언

- **lint rule**: `ohc/a-stream-allowed`
- **게이트**: #9 audit-conf

### 규칙

- broker 의 stream 응답 사용 시 page-def 의 `aiUsage.stream: true` 명시
- 미선언 stream 호출 = fail (대용량 응답 추적성 보호)

---

## a-tool-use-policy — tool/function calling 제한

- **lint rule**: `ohc/a-tool-use-policy`
- **게이트**: #2 lint + #9 audit-conf

### 규칙

- LLM tool 호출은 사내 정의된 `@ohc/agent-tools` 패키지의 함수만
- 임의 함수 노출 금지 (RCE 등가)
- 각 tool 는 RoleGuard 와 같은 인가 체크 강제

---

## a-no-self-generation-eval — LLM 출력을 사람 검토 없이 머지 금지

- **lint rule**: 없음 (REVIEWER 책임)
- **게이트**: REVIEWER 6 영역 (도메인 적합성)

### 규칙

- LLM 이 생성한 데이터를 사람 검토 없이 production write 하는 흐름 = 금지
- 환자 진단 / 의료 권고 등 = 반드시 사람 confirm
- REVIEWER 가 use case 별로 자동 머지 가능 영역 명시 (예: 마케팅 카피 draft 는 자동 OK, 의료 추천은 사람 필수)

---

## REVIEWER 책임 영역

- AI 사용 의도가 declared 와 일치하는가
- ZDR 정책이 실제 데이터 흐름과 맞는가
- 자동 출력의 영향 범위 (사람 confirm 필요 여부)
- 비용 예측 (`expectedDailyCalls`) 의 현실성

---

## 변경 이력

| 버전 | 일자 | 변경 |
|---|---|---|
| v1.0 | 2026-06-12 | 11 룰 초기 정의 |
