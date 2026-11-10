/** Architecture rules. Run with `npm run check:boundaries` (part of `npm run check`). */
module.exports = {
  forbidden: [
    {
      name: 'no-cross-app-imports',
      comment:
        'An app never imports another app. Share code through packages/ (contracts, server-core, ui).',
      severity: 'error',
      from: { path: '^apps/([^/]+/[^/]+)/' },
      to: {
        path: '^apps/',
        pathNot: '^apps/$1/',
      },
    },
    {
      name: 'packages-do-not-import-apps',
      comment: 'packages/ is shared by every app, so it cannot depend on any of them.',
      severity: 'error',
      from: { path: '^packages/' },
      to: { path: '^apps/' },
    },
    {
      name: 'no-api-module-barrels',
      comment:
        'API modules use explicit routes, services, schemas and repositories without index.ts barrels.',
      severity: 'error',
      from: { path: '^apps/[^/]+/api/src/' },
      to: {
        path: '^apps/[^/]+/api/src/modules/.+/index\\.ts$',
      },
    },
    {
      name: 'devices-do-not-import-modules',
      comment:
        'Controller I/O stays below business logic: modules use devices/, never the reverse.',
      severity: 'error',
      from: { path: '^apps/site/api/src/devices/' },
      to: { path: '^apps/site/api/src/modules/' },
    },
    {
      name: 'database-only-in-repositories',
      comment:
        'Only *.repository.ts files use the Prisma client; services and routes go through repositories. Type-only imports are allowed.',
      severity: 'error',
      from: {
        path: '^apps/[^/]+/api/src/',
        pathNot: [
          '\\.repository\\.ts$',
          '^apps/[^/]+/api/src/(config|generated)/',
          '^apps/[^/]+/api/src/index\\.ts$',
        ],
      },
      to: {
        path: '^apps/[^/]+/api/src/(config/prisma\\.ts$|generated/)',
        dependencyTypesNot: ['type-only'],
      },
    },
    {
      name: 'no-circular',
      severity: 'warn',
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    doNotFollow: {
      path: ['node_modules', '/src/generated/'],
    },
    exclude: { path: '(^|/)(dist|node_modules)/' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types'],
      extensions: ['.ts', '.tsx', '.js', '.mjs', '.cjs', '.json'],
    },
  },
}
