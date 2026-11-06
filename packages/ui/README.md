# Shared UI

Use `@awb/ui` in prereg, the plant console and the kiosk. The package owns component
behavior, visual styles and theme tokens; pages own business data and mutations.
Import through the public package entry, not another application's source.

```text
src/
  atoms/         Button, IconButton, Input, Textarea, Select, Skeleton
  molecules/     Field, Card, PageHeader, FormSection, Pagination, ThemeControl, MultiSelect, SkeletonCell, SummaryPopover
  organisms/     Table, ConfirmDialog
  providers/     ThemeProvider, ConfirmProvider and their hooks
  templates/     AppShell, AuthLayout, Screen, PageSkeleton
  hooks/         responsive media-query helpers
  styles/        tokens.css, components.css, forms.css, multiselect.css, skeleton.css
  index.ts       public exports
```

Atoms are individual controls. Molecules combine controls for a focused job.
Organisms combine those pieces into data views or interactions. Providers own
cross-page behavior; templates assemble application shells. Keep domain hooks,
API calls, role rules and form schemas in their applications.

## Providers and themes

Wrap each frontend in `ThemeProvider` and `ConfirmProvider`. `ThemeControl` selects
light, dark or system mode through an icon button and a popover;
`useTheme()` exposes the preference and resolved mode. In prereg, place the control
on sign-in and beside the sidebar profile. Dark surfaces use neutral charcoal grays.
System mode follows OS changes. Only this display preference is stored in
`localStorage` under `awb-ui-theme`; same-origin tabs synchronize it. Each origin
has its own browser storage. This never stores authentication or identity data.

Use `--ui-surface`, `--ui-text`, `--ui-muted`, `--ui-border`, `--ui-accent` and the
other semantic tokens for new UI. Shared components use plain scoped CSS and do
not require Tailwind in their consumer. App-specific styling should use these
tokens too. MUI icons can be passed through component icon slots.
Use `Input`'s `leadingIcon` slot for search icons; the shared control owns icon size
and text padding so consumer CSS layers cannot make the placeholder overlap it.

Typography uses locally bundled Inter Variable through `--ui-font-sans`. Keep body
and control text at 14px, secondary labels at 12–13px, and reserve semibold for
headings. Avoid separate HTML font definitions, tiny metadata and decorative
monospace in administration pages. The font license is in `LICENSE-Inter.txt`.

`MultiSelect` is a controlled, searchable checkbox dropdown. Its native popover
handles outside clicks and Escape; the search receives focus on opening. Selections
apply immediately and remain selected when searching. Clear affects that dropdown,
Done closes it. Supply stable values and a maximum of 100 selections. Pages own API
and URL state; the component does not fetch or filter table records.

Use `Skeleton` for loading shapes and `PageSkeleton` for session, route and detail
loading. Tables render skeleton cells inside the existing columns while loading;
buttons preserve their dimensions and accessible labels while showing a skeleton.
Use aria-busy/status for announcements, hide decorative placeholders from assistive
technology and respect reduced-motion preferences. Do not introduce spinners.

Skeletons must match the loaded view. Use column-specific `skeleton` content for
identity lines, contact lines, status text, checkboxes and action buttons. Keep
column widths and minimum table width identical while loading. Prereg owns the
shared loading definitions in `ui/loadingLayouts.tsx`. PageSkeleton supports table,
form/summary, authentication, recovery and overview layouts; the application chooses
the right variant and columns. Nested route Suspense preserves loaded navigation.

Use `SummaryPopover` for compact collection counts and previews. Load large
collections on demand, keep rows to a fixed text footprint and put search/scrolling
inside the popover. Opening it must not change row height.

## Tables and pagination

`Table<T>` requires a `ServerPagination` object. Its footer is always visible,
including empty lists, and defaults to 20 rows per page. The component renders the
records received from the server; it never slices, searches or sorts collections
in the browser. Page and size changes call the parent's callbacks, which update
URL/query state and request a new page. Reset page to 1 when search, filters or size
changes. Show loading/errors explicitly. Use stable server sort keys and bound
both page size and page depth. Group headers only act on their visible page.

Mark data columns with `sortKey` and pass controlled `ServerSorting` state. Header
buttons toggle ascending/descending, expose `aria-sort`, and support keyboard
activation. Actions and selection controls do not sort. The page owns URL/query
state and resets page to 1 on sort changes; the API validates allowed fields and
applies ordering before pagination, with an ID tie-breaker. Table never sorts rows
locally. Use `sortHint` for derived values such as assignment counts.

Role permission edits retain their complete selection set outside the paginated
catalogue. Changing pages or search must not discard draft selections; saving
replaces permissions with the complete set, including unseen pages.

## Confirmation

Use `const confirm = useConfirm()` then `await confirm({ title, description,
confirmLabel, variant })`. Cancellation returns false. The custom HTML dialog
keeps focus inside, initially focuses Cancel, supports Escape, and restores focus
to the trigger. Pending requests resolve false if the provider unmounts. Do not
use native `alert`, `confirm` or `prompt`; ESLint rejects them.
