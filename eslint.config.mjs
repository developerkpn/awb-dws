import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import prettier from 'eslint-config-prettier'
import globals from 'globals'

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/src/generated/**',
      '**/.turbo/**',
      '**/.data/**',
      '**/test-results/**',
      '**/playwright-report/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
    rules: {
      'no-alert': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "CallExpression[callee.property.name=/^(uuid|email|url|datetime|date|time|duration|ipv4|ipv6|base64|cuid2|ulid)$/][callee.object.callee.object.name='z'][callee.object.callee.property.name='string']",
          message:
            'Use the Zod 4 top-level validator (z.uuid(), z.email(), z.url(), z.iso.*, etc.).',
        },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
    },
  },
  {
    files: ['**/*.tsx'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  {
    files: ['apps/*/web/src/pages/**/*.{ts,tsx}', 'apps/site/kiosk/src/pages/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'axios', message: 'Use a typed domain hook from @/hooks.' },
            { name: '@/lib/axios', message: 'Use a typed domain hook from @/hooks.' },
            { name: '@/utils/api', message: 'Keep API requests in @/hooks; pages render the UI.' },
          ],
        },
      ],
    },
  },
  { files: ['**/*.cjs'], languageOptions: { sourceType: 'commonjs' } },
  prettier,
)
