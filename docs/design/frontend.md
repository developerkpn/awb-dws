# Frontend conventions

These conventions apply to `prereg/web`, `site/web` and `site/kiosk`. Frontends stay
separate applications. Shared data contracts belong in `packages/contracts` and UI
primitives shared by applications belong in `packages/ui`.

## Structure

```text
src/
  App.tsx                         route definitions and lazy page imports
  main.tsx                        root providers and application entry
  components/                     reusable application components
    Navbar.tsx
    SideBar.tsx
    Pagination.tsx
    ErrorState.tsx
  layout/
    AuthLayout.tsx                 public authentication pages
    BaseLayout.tsx                 authenticated shell and navigation
    RBACLayout.tsx                 permission guard
  pages/
    auth/
      login/
        index.tsx                 page entry, default export
        schema.ts                 page-specific Zod form validation
        _components/
          LoginForm.tsx           presentation used only by this page
    user/
      listUser/
        index.tsx
        _components/
          UserFilters.tsx
          UsersTable.tsx
      addUser/
        index.tsx
      editUser/
        index.tsx
      _components/                pieces shared by pages within this domain
        UserForm.tsx
        schema.ts
    role/
      permissionOfRole/
        index.tsx
        _components/
          RolePermissionsTable.tsx
  hooks/
    auth.ts                       session queries and auth mutations
    user.ts                       user queries, mutations and query keys
    permission.ts
    useDebounce.ts
  types/
    api.ts                        response/error/pagination envelopes
    auth.ts
    user.ts
    permission.ts
  lib/
    axios.ts                      one HTTP-client instance
    queryClient.ts                query-client configuration
  utils/
    api.ts                        typed HTTP request wrapper
    errorHandler.ts
    permission.ts
    pagination.ts
  constant/
    PERMISSION.ts                 shared permission constants, re-exported
```

Create folders as they become necessary; do not add empty placeholders. The plant
console and kiosk are still skeletons and currently need only their `pages` folders.
They adopt the same hook/type/layout boundaries as their real features are built.
Do not reintroduce `features/<domain>` or duplicate `pages` and `features` trees.

## Naming and exports

- Domain folders use singular camelCase: `user`, `role`, `preRegistration`.
- Page folders describe the action: `listUser`, `addUser`, `editUser`.
- Every route page has `index.tsx` with a named PascalCase function as its default
  export. Route definitions lazy-load that folder.
- Component and layout filenames use PascalCase. Hooks and type files use the
  domain name in camelCase, such as `hooks/user.ts` and `types/user.ts`.
- Hooks use named exports: `useUsers`, `useUser`, `useCreateUser`.
- Use `import type` for types. Use `@/` for imports from the application source;
  short relative imports are appropriate within one page/domain folder.
- Another application's source must never be imported. Shared UI is imported from
  `@awb/ui`; contracts and permission constants from `@awb/contracts`.

## Types and validation

API models, response shapes, filters and mutation inputs live in `types/<domain>.ts`.
Reuse/infer shared contract types instead of redefining API models inside pages or
components. Small component-prop interfaces remain beside their component. Use
interfaces for object inputs/props and type aliases for unions, inference and
compositions. Keep unrelated domain types out of a central catch-all file.

Use strict TypeScript and explicit typed HTTP responses. Do not use `any`, unsafe
response casts to bypass validation, or non-null assertions to ignore missing data.
Validate external data at the API boundary with shared schemas where available.
Handle loading, missing-data, error and success states explicitly.

Forms use React Hook Form and Zod 4 schemas. A schema used by one page lives beside
that page; one used by multiple pages in a domain lives in its `_components` folder.
Use `z.uuid()`, `z.email()`, `z.url()`, `z.iso.*` and `z.int()` rather than deprecated
chained format validators. Client validation improves feedback; the server always
validates the input again. Server validation errors remain visible in the form.

## Data and state

Put HTTP calls in domain query/mutation hooks; pages and presentation components do
not call Axios or fetch directly. `lib/axios.ts` owns the client configuration and
`utils/api.ts` unwraps typed responses and normalizes errors. Requests use the
same-origin `/api` path, bounded timeouts and cancellation signals.

TanStack Query owns server state. Define query keys in each domain hook file and
include every filter/pagination value in list keys. After a mutation, invalidate or
update the affected lists, details and option queries. Permission changes invalidate
the current session so navigation follows the server's current permissions.

Keep only UI state locally: collapsed navigation, form drafts, search input and
temporary feedback. Put list filters and pagination in URL search parameters so
refresh and navigation retain them. Debounce text searches. Do not mirror entire
server collections into `useState` with hand-written fetch effects or use demo data
as a successful fallback when an API request fails.

## Routing and security

`App.tsx` defines routes and lazy imports. Layouts own the shell, session-loading
states and permission guards; they do not contain account forms or business lists.
Reusable navigation lives in `components`, not inside a large route file.

The current session comes from `/api/auth/me`. Do not store passwords, tokens, roles
or an authentication flag in localStorage/sessionStorage. Roles are never inferred
from usernames, URL parameters or a caller-supplied header. The HTTP-only session
cookie is managed by the browser, and the server checks authorization independently.
Clear protected query data after expiry, logout or switching accounts. Only one
session observer polls, preventing duplicated periodic requests from each layout.

Routes and menus use the same permission constants. Hiding a link is not an API
security control. Display a real access-denied page for unauthorized navigation.

## Formatting and checks

Prettier is the formatting authority: two spaces, single quotes, no semicolons,
trailing commas and a 100-character print width. Use normal multiline functions and
JSX; do not compress unrelated statements into one line. Prefer readable names and
small components over large page files containing requests, forms, tables and layout.

```sh
npm run format
npm run lint
npm run typecheck
npm run check
npm run test:e2e
```

ESLint rejects explicit `any`, unused variables, hook violations, deprecated Zod
format chains and direct HTTP imports in pages. TypeScript also checks unused
frontend locals/parameters. `check:blueprint` inventories route-page `index.tsx`
files so every screen must be documented in `TECHNICAL.md`.
