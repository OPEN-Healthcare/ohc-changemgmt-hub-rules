import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  (name) =>
    `https://github.com/OPEN-Healthcare/ohc-changemgmt-hub-rules/blob/main/RULES/CODING.md#${name}`,
);

/**
 * c-error-handling — 에러 처리는 HttpException 으로
 *
 * Hub Rules: RULES/CODING.md#c-error-handling
 * 게이트: #2 lint
 *
 * raw Error 또는 string throw 검출. HttpException 또는 그 서브클래스만 허용.
 */
export const cErrorHandling = createRule({
  name: 'c-error-handling',
  meta: {
    type: 'problem',
    docs: {
      description:
        '에러는 HttpException 또는 그 서브클래스 (BadRequestException 등) 로 throw 해야 합니다. raw Error / string throw 금지.',
    },
    schema: [],
    messages: {
      rawError:
        'raw Error 사용 금지. BadRequestException / NotFoundException / InternalServerErrorException 등 HttpException 서브클래스 사용. (RULES/CODING.md#c-error-handling)',
      stringThrow:
        'string throw 금지. HttpException 객체 throw 필요. (RULES/CODING.md#c-error-handling)',
      genericException:
        'generic Exception throw 금지. 의미가 명확한 HttpException 서브클래스 사용. (RULES/CODING.md#c-error-handling)',
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      ThrowStatement(node: TSESTree.ThrowStatement) {
        const arg = node.argument;

        // throw 'string'
        if (arg.type === 'Literal' && typeof arg.value === 'string') {
          context.report({ node, messageId: 'stringThrow' });
          return;
        }

        // throw `template`
        if (arg.type === 'TemplateLiteral') {
          context.report({ node, messageId: 'stringThrow' });
          return;
        }

        // throw new Error(...) / throw new TypeError(...) / etc
        if (arg.type === 'NewExpression' && arg.callee.type === 'Identifier') {
          const className = arg.callee.name;
          const BANNED = [
            'Error',
            'TypeError',
            'RangeError',
            'SyntaxError',
            'ReferenceError',
            'EvalError',
            'URIError',
            'Exception',
          ];
          if (BANNED.includes(className)) {
            context.report({
              node,
              messageId: className === 'Exception' ? 'genericException' : 'rawError',
            });
          }
        }
      },
    };
  },
});
