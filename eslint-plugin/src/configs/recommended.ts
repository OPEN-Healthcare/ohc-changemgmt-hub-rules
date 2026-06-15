/**
 * recommended 프로필 — Hub Rules v1.0 의 모든 활성 룰
 *
 * boilerplate 의 .eslintrc.json 에서:
 *   { "extends": ["plugin:@ohc/rules/recommended"] }
 *
 * 현재 (v0.1 PoC) 는 3 룰만 구현. Phase 3.5 ~ 4 에서 57 룰 전체 도달.
 */
export const recommended = {
  plugins: ['@ohc/rules'],
  rules: {
    // CODING
    '@ohc/rules/c-error-handling': 'error',
    // SECURITY
    '@ohc/rules/s-no-hardcoded-secret': 'error',
    // AI-USAGE
    '@ohc/rules/a-broker-only': 'error',

    // 미구현 룰 (Phase 3.5 ~ 4) — 추가 시 여기에 등록
    // '@ohc/rules/c-immutability': 'error',
    // '@ohc/rules/c-no-any': 'error',
    // '@ohc/rules/c-zod-validation': 'error',
    // '@ohc/rules/c-no-console': 'error',
    // '@ohc/rules/s-role-guard-required': 'error',
    // '@ohc/rules/s-no-mongo-injection': 'error',
    // '@ohc/rules/s-no-eval': 'error',
    // '@ohc/rules/p-ai-usage-required': 'error',
    // '@ohc/rules/a-no-raw-key': 'error',
    // '@ohc/rules/a-zdr-routing': 'error',
    // '@ohc/rules/h-patient-id-mask': 'error',
    // '@ohc/rules/h-audit-required': 'error',
    // ...
  },
};
