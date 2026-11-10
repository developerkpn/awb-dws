import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import prettier from 'eslint-config-prettier'
import globals from 'globals'
import expandObjects from './scripts/eslint-rules/expand-objects.mjs'

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
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
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
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
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
            {
              name: 'axios',
              message: 'Use a typed domain hook from @/hooks.',
            },
            {
              name: '@/lib/axios',
              message: 'Use a typed domain hook from @/hooks.',
            },
            {
              name: '@/utils/api',
              message: 'Keep API requests in @/hooks; pages render the UI.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['apps/*/*/src/**/*.{ts,tsx}'],
    ignores: ['apps/*/*/src/types/**', '**/*.d.ts', '**/src/generated/**'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "CallExpression[callee.property.name=/^(uuid|email|url|datetime|date|time|duration|ipv4|ipv6|base64|cuid2|ulid)$/][callee.object.callee.object.name='z'][callee.object.callee.property.name='string']",
          message:
            'Use the Zod 4 top-level validator (z.uuid(), z.email(), z.url(), z.iso.*, etc.).',
        },
        {
          selector:
            ':matches(Program, Program > ExportNamedDeclaration) > :matches(TSInterfaceDeclaration, TSTypeAliasDeclaration)',
          message: 'Declare types and interfaces in src/types/<domain>.ts.',
        },
      ],
    },
  },
  {
    files: ['**/*.cjs'],
    languageOptions: { sourceType: 'commonjs' },
  },
  prettier,
  {
    plugins: {
      local: {
        rules: { 'expand-objects': expandObjects },
      },
    },
    rules: {
      'local/expand-objects': 'error',
      'padding-line-between-statements': [
        'error',
        {
          blankLine: 'always',
          prev: ['const', 'let', 'var'],
          next: '*',
        },
        {
          blankLine: 'any',
          prev: ['const', 'let', 'var'],
          next: ['const', 'let', 'var'],
        },
        {
          blankLine: 'always',
          prev: '*',
          next: 'return',
        },
        {
          blankLine: 'always',
          prev: 'if',
          next: '*',
        },
        {
          blankLine: 'always',
          prev: '*',
          next: 'if',
        },
        {
          blankLine: 'always',
          prev: '*',
          next: [
            'function',
            'class',
            'export',
            'block-like',
            'multiline-expression',
            'multiline-const',
            'multiline-let',
          ],
        },
        {
          blankLine: 'always',
          prev: [
            'import',
            'function',
            'class',
            'export',
            'block-like',
            'multiline-expression',
            'multiline-const',
            'multiline-let',
          ],
          next: '*',
        },
        {
          blankLine: 'any',
          prev: 'import',
          next: 'import',
        },
        {
          blankLine: 'any',
          prev: 'export',
          next: 'export',
        },
      ],
    },
  },
)
