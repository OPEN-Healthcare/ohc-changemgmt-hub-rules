import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  (name) =>
    `https://github.com/OPEN-Healthcare/ohc-changemgmt-hub-rules/blob/main/RULES/AI-USAGE.md#${name}`,
);

const FORBIDDEN_LLM_PACKAGES = [
  '@anthropic-ai/sdk',
  'anthropic',
  'openai',
  '@google/generative-ai',
  '@google-cloud/vertexai',
  'cohere-ai',
  'replicate',
  'groq-sdk',
];

const FORBIDDEN_LLM_CONSTRUCTORS = ['Anthropic', 'OpenAI', 'GoogleGenerativeAI', 'Cohere'];

/**
 * a-broker-only — ai-key-broker 경유 강제
 *
 * Hub Rules: RULES/AI-USAGE.md#a-broker-only
 * 게이트: #2 lint + #9 audit-conf
 *
 * 외부 LLM SDK 직접 import 또는 new 호출 검출. broker 경유만 허용.
 */
export const aBrokerOnly = createRule({
  name: 'a-broker-only',
  meta: {
    type: 'problem',
    docs: {
      description:
        '모든 LLM 호출은 Hub ai-key-broker 모듈 경유. 외부 LLM SDK 직접 사용 금지. (RULES/AI-USAGE.md#a-broker-only)',
    },
    schema: [],
    messages: {
      forbiddenImport:
        '외부 LLM SDK "{{pkg}}" 직접 import 금지. @ohc/ai-broker-client 사용. (RULES/AI-USAGE.md#a-broker-only)',
      forbiddenConstructor:
        '외부 LLM client "{{name}}" 직접 인스턴스 금지. BrokerClient 의존성 주입 사용. (RULES/AI-USAGE.md#a-broker-only)',
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      ImportDeclaration(node: TSESTree.ImportDeclaration) {
        const source = node.source.value;
        if (typeof source === 'string' && FORBIDDEN_LLM_PACKAGES.includes(source)) {
          context.report({
            node,
            messageId: 'forbiddenImport',
            data: { pkg: source },
          });
        }
      },

      // CommonJS require('openai')
      CallExpression(node: TSESTree.CallExpression) {
        if (
          node.callee.type === 'Identifier' &&
          node.callee.name === 'require' &&
          node.arguments.length === 1 &&
          node.arguments[0]?.type === 'Literal'
        ) {
          const arg = node.arguments[0].value;
          if (typeof arg === 'string' && FORBIDDEN_LLM_PACKAGES.includes(arg)) {
            context.report({
              node,
              messageId: 'forbiddenImport',
              data: { pkg: arg },
            });
          }
        }
      },

      // new Anthropic() / new OpenAI() 등
      NewExpression(node: TSESTree.NewExpression) {
        if (node.callee.type === 'Identifier' && FORBIDDEN_LLM_CONSTRUCTORS.includes(node.callee.name)) {
          context.report({
            node,
            messageId: 'forbiddenConstructor',
            data: { name: node.callee.name },
          });
        }
      },
    };
  },
});
