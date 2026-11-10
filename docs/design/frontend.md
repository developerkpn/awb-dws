# Frontend conventions

These conventions apply to `prereg/web`, `site/web` and `site/kiosk`. Frontends stay
separate applications. Shared data contracts belong in `packages/contracts` and UI
primitives shared by applications belong in `packages/ui`. A frontend may keep small
visual primitives in `src/ui` while they are only used in that application; move them
to `packages/ui` when another application needs them.

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
  ui/                             app-specific visual primitives
    Button.tsx
    Card.tsx
    Field.tsx
    Table.tsx
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

- Domain folders use singular camelCase: `user`, `role`, `driverRequest`, `jul`.
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

Every type and interface lives in `types/<domain>.ts`: API models, response shapes,
filters, mutation inputs, form values and component props. ESLint rejects top-level
type declarations elsewhere in `src/`. Reuse/infer shared contract types instead of
redefining API models. Use interfaces for object inputs/props and type aliases for
unions, inference and compositions. Keep unrelated domain types out of a central
catch-all file; layout and UI primitives use `types/layout.ts` and `types/ui.ts`.

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

## Visual conventions

Build page content from the shared atomic UI in `packages/ui`; its folder boundaries,
theme tokens, providers, dialogs and pagination contract are documented in
`packages/ui/README.md`. Application `ui` files may re-export these controls, but
must not duplicate their implementation. All three frontends support light, dark,
and system themes. New page styling uses semantic `--ui-*` tokens.

Tables always use server pagination with a visible footer and 20 rows by default.
User, role and permission searches/filtering run before pagination in the API.
Role permission drafts survive catalogue page/search changes. Select-page actions
affect visible entries only. Use `useConfirm` for destructive actions and unsaved
form navigation; never use native browser prompts.

Data headers are sortable buttons with direction icons and aria-sort. Actions and
selection checkboxes remain controls. `useSorting` stores sortBy/sortDirection in
the URL, preserves search/filters/size, and resets page to 1. APIs validate sort
fields and direction and order the full filtered dataset before pagination. SAP
sorting uses the partner username, plant/access sorting uses assignment counts,
and permission sorting keeps module groups with name/action ordering inside them.
Permission drafts survive sorting. Account options keep previous results during
SAP lookup so roles, plant selection and preview labels stay visible while typing.
Switching account type or partner role resets username value/error/touched state
without validating the newly empty field. Preserve unrelated profile values and
errors; required username validation still runs on submission.

Account forms use numbered sections, responsive paired fields, a live account
summary, and a persistent save/cancel bar. Business partners enter their SAP code
as the username manually. Account type and role identify the business-partner login
in mst_user; no separate SAP master, connection picker or lookup is required.
Account options load once independently of username typing. Plant access uses checkboxes.
SAP codes in lists use plain text. Preserve entered profile data while switching
account type. Editing keeps account type and username immutable. Field helpers own
input-label associations and connect errors with aria attributes.

Keep the split sign-in layout and display the bundled weighbridge image behind the
left panel. Use a neutral shell with an inset white content surface, restrained
red accents, subtle borders, and a clear typography hierarchy. Use MUI outlined icons
through `ui/icons.ts`; do not mix icon families. Keep tables neutral, with emphasis
on content and row actions rather than large blocks of brand color.

Sidebar branding uses the full logo when expanded and its emblem when collapsed,
without extra product text. Its toggle belongs in the header beside the breadcrumb.
Keep the avatar, account name, direct sign-out action and icon-only theme control in
the sidebar footer. Sign-in also has a theme icon; the navbar does not. Dark surfaces
use charcoal grays without a blue tint. Search fields use the shared Input leadingIcon slot.
Collapsed navigation and sign-out retain accessible names and tooltips.
The sidebar profile uses a neutral circular MUI person icon instead of a dark
initials tile; its loading placeholder has the same circular shape.

Roles have a searchable overview at `/roles` and a dedicated permissions page at
`/roles/:id/permissions`. Group permissions by module with explicit checkboxes,
group selection, selected counts, search, and save/discard actions. ADMIN remains
read-only with full access. Changes use the existing replacement API and real session.

Account lists use search plus Roles and Plants multi-select dropdowns. Each dropdown
supports search, checkboxes, selection counts, clearing and Escape/outside dismissal.
Selections apply immediately: OR within roles/plants, AND across both groups. Empty
selection means unrestricted. Store repeated roles/plantIds parameters in the URL;
send repeated keys to the API, reset page to 1 on changes, and preserve sorting and
page size. The advanced rule builder is removed from the UI; legacy filter parameters
are not applied invisibly by the page. Legacy API filters remain supported.
Never filter only the current page. Preserve regular bounded pagination.
Keep tables horizontally scrollable inside their container.

All frontends use locally bundled Inter Variable through the shared font token.
Body/control text is 14px and secondary text 12–13px; reserve semibold for headings.
Avoid 10px labels, decorative monospace and widely tracked uppercase navigation.
The HTML entry must not override the shared font family. Fonts load from app assets,
with a system fallback and swap, without third-party runtime requests.

Loading content uses shared Skeleton/PageSkeleton placeholders. Tables keep their
column layout with skeleton rows; session, route, options and detail loading use a
page skeleton. Busy buttons retain their size and accessible label under a skeleton.
Respect reduced motion and expose aria-busy/status without announcing placeholder
shapes. Avoid spinner-based loading. Role lists and permission editors omit
decorative icons; retain functional sorting indicators in table headers.

Skeleton layout follows the current route. Account forms keep the identity/contact
sections and summary sidebar; role permissions keep their search, access checkboxes,
module table and save bar; sign-in keeps its image/form split. Table skeleton cells
use the same widths and definitions as loaded cells in `ui/loadingLayouts.tsx`.
Keep the existing application shell during lazy page loading. Manage permissions
is an icon-only action with a tooltip and accessible label.

Account tables use User, Role, Contact, Plant access, Status and Actions. Put the SAP
username under the account name and account type under the friendly role name.
Contact text stays within two truncated lines. Plant access shows a count and one
short preview, with the complete searchable list in a scrollable popover. List
responses contain `plantCount` and at most two `plantPreview` entries; fetch the full
account only when opening access details. Do not render one badge per assigned plant.
Show the username itself without an extra SAP prefix. Active/inactive statuses use
plain text in both account and role lists, with matching text skeletons.
List page headers omit redundant account totals and role-page introductory copy;
pagination retains result counts. Skeleton headers omit the same content.

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
