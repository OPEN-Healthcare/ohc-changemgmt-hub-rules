import { cErrorHandling } from './rules/c-error-handling';
import { sNoHardcodedSecret } from './rules/s-no-hardcoded-secret';
import { aBrokerOnly } from './rules/a-broker-only';
import { recommended } from './configs/recommended';

export = {
  meta: {
    name: '@ohc/eslint-plugin-rules',
    version: '0.1.0',
  },
  rules: {
    'c-error-handling': cErrorHandling,
    's-no-hardcoded-secret': sNoHardcodedSecret,
    'a-broker-only': aBrokerOnly,
  },
  configs: {
    recommended,
  },
};
