import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  (name) =>
    `https://github.com/OPEN-Healthcare/ohc-changemgmt-hub-rules/blob/main/RULES/SECURITY.md#${name}`,
);

const SECRET_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /^sk-[a-zA-Z0-9-]{20,}$/, label: 'OpenAI / Stripe style API key' },
  { pattern: /^sk-proj-[a-zA-Z0-9_-]{20,}$/, label: 'OpenAI project key' },
  { pattern: /^sk-ant-[a-zA-Z0-9_-]{20,}$/, label: 'Anthropic key' },
  { pattern: /^gh[pous]_[A-Za-z0-9_]{20,}$/, label: 'GitHub token' },
  { pattern: /^AIza[0-9A-Za-z_-]{20,}$/, label: 'Google API key' },
  { pattern: /^AKIA[0-9A-Z]{16}$/, label: 'AWS access key id' },
  { pattern: /^xox[abprs]-[0-9a-zA-Z-]{10,}$/, label: 'Slack token' },
  { pattern: /^mongodb(\+srv)?:\/\/[^/\s]+:[^/\s@]+@/, label: 'Mongo URL with credentials' },
  { pattern: /^postgres(ql)?:\/\/[^/\s]+:[^/\s@]+@/, label: 'Postgres URL with credentials' },
];

const SUSPICIOUS_VAR_NAMES = [
  /api[_-]?key/i,
  /secret/i,
  /password/i,
  /passwd/i,
  /token/i,
  /private[_-]?key/i,
];

/**
 * s-no-hardcoded-secret — 비밀 하드코딩 금지
 *
 * Hub Rules: RULES/SECURITY.md#s-no-hardcoded-secret
 * 게이트: #2 lint + #8 gitleaks (히스토리 전체)
 *
 * 알려진 secret 패턴 검출 + 비밀스러운 변수명에 string literal 할당 검출.
 */
export const sNoHardcodedSecret = createRule({
  name: 's-no-hardcoded-secret',
  meta: {
    type: 'problem',
    docs: {
      description:
        'API 키 / 비밀번호 / 토큰 / 자격증명 URL 의 하드코딩 금지. env 사용 강제. (RULES/SECURITY.md#s-no-hardcoded-secret)',
    },
    schema: [],
    messages: {
      knownSecretPattern:
        '{{label}} 패턴 감지. .env 또는 비밀 관리 시스템 사용. (RULES/SECURITY.md#s-no-hardcoded-secret)',
      suspiciousVarAssign:
        '비밀스러운 변수명 "{{varName}}" 에 string literal 할당. ConfigService.get() 사용. (RULES/SECURITY.md#s-no-hardcoded-secret)',
    },
  },
  defaultOptions: [],
  create(context) {
    function checkLiteralValue(node: TSESTree.Node, value: string) {
      for (const { pattern, label } of SECRET_PATTERNS) {
        if (pattern.test(value)) {
          context.report({
            node,
            messageId: 'knownSecretPattern',
            data: { label },
          });
          return true;
        }
      }
      return false;
    }

    function isSuspiciousName(name: string) {
      return SUSPICIOUS_VAR_NAMES.some((re) => re.test(name));
    }

    return {
      // 모든 string literal 검사
      Literal(node: TSESTree.Literal) {
        if (typeof node.value === 'string' && node.value.length >= 20) {
          checkLiteralValue(node, node.value);
        }
      },

      // 비밀스러운 변수명에 string 할당
      VariableDeclarator(node: TSESTree.VariableDeclarator) {
        if (
          node.id.type === 'Identifier' &&
          isSuspiciousName(node.id.name) &&
          node.init?.type === 'Literal' &&
          typeof node.init.value === 'string' &&
          node.init.value.length >= 8
        ) {
          // 이미 known pattern 으로 보고됐으면 중복 보고 회피
          const alreadyReported = checkLiteralValue(node.init, node.init.value);
          if (!alreadyReported) {
            context.report({
              node: node.init,
              messageId: 'suspiciousVarAssign',
              data: { varName: node.id.name },
            });
          }
        }
      },
    };
  },
});
