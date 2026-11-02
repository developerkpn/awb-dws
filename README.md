# AWB-DWS

AWB Downstream in one repository: Customer Pre-Registration (AWS) and the plant system that replaces WB.NET and runs TCS (on-prem, one per plant). Requirements are in `docs/` (BRD v0.7, PRD v0.4).

**[BLUEPRINT.md](BLUEPRINT.md)** (Indonesian) is the living map of what exists, how far each part has got, the technical decisions and the full change history. Management reads it as a PDF: `npm run blueprint:pdf` writes `docs/documents/Blueprint-AWB-DWS-v<date>.pdf` (first time: `npm run docs:setup`).

- Update it in the same change whenever you add or change an app, module, endpoint, model, migration, contract, screen, device or integration. `npm run check` fails if the code has something the blueprint doesn't list.
- History is never overwritten. Its "Riwayat perubahan" table is append-only and records *before → after → why*; a changed decision gets a new row and the old one is marked "digantikan oleh K-xx". `npm run check` fails if an old history row is edited, a decision is deleted or overwritten, or the blueprint changes without a new history row (compared with the last commit, or with `BLUEPRINT_BASE`, e.g. `origin/main`, in CI).

## Layout

```
apps/
  prereg/        Customer Pre-Registration — AWS ECS, public
    api/         Express   @awb/prereg-api   :3000
    web/         Vite      @awb/prereg-web   :5173  customer portal, HO approval, HO-staff registration
  site/          Plant system — on-prem, one per plant
    api/         Express   @awb/site-api     :4000  WB + TCS + kiosk backend + controller sockets
    web/         Vite      @awb/site-web     :5174  staff console: WB screens, TCS stations, dashboard, admin
    kiosk/       Vite      @awb/site-kiosk   :5175  touchscreen display: registration, WB tap 1/2, exit
packages/
  contracts/     zod schemas shared across apps (sync events, kiosk lane events)
  server-core/   errors, success(), env loading for the Express apps
  ui/            shared React components
docs/            BRD/PRD and the source that builds them
infra/           deployment (ECS for prereg, on-prem compose for site)
```

`site/api` is one backend for the whole plant. WB.NET and TCS are domains inside it because they share one plant database and one truck journey, and steps such as "save weight + advance stage + queue sync" must commit together:

```
apps/site/api/src/
  domains/
    journey/        journey, card binding, audit
    registration/   Reg IN/OUT, prereg cache, QR fallback, registration without prereg
    weighbridge/    WB.NET replacement: tap 1/2, weighing, OCR, AI checks, tolerance, ticket
    tcs/            flow, stages, station submissions, QC decisions
    sync/           outbox/inbox with HO, reconciliation, prereg client
    erp/            SAP posting
  devices/          TCP sockets to the weighbridge controllers (2 per weighbridge): RFID taps, sensors/radar, commands
  realtime/         lane state pushed to the kiosk screens (to add)
  config/ routes/ middlewares/ helpers/ lib/ constants/ types/ jobs/
```

## Shared packages

Apps never import each other (rule 1), so anything two apps need goes in `packages/`:

| Package | Holds | Used by |
|---|---|---|
| `@awb/contracts` | The **shape** of data that travels between apps: zod schemas, no logic | all apps |
| `@awb/server-core` | Shared **behaviour** for the Express APIs: errors, `success()`, env loading | `prereg/api`, `site/api` |
| `@awb/ui` | Shared **React components** | `prereg/web`, `site/web`, `site/kiosk` |

### `@awb/contracts`

`prereg` and `site` are separate apps running in different places (AWS and each plant), but they still exchange messages. If each side wrote its own version of a message, the two would drift apart: rename `approvedAt` on one side and sync silently breaks at the plant. Contracts give both sides one definition. A zod schema provides the TypeScript type (checked at compile time) and a validator (checked at runtime, when a message arrives over the network):

```ts
// apps/prereg/api: sender
import { preregApprovedEvent } from '@awb/contracts'
const event = preregApprovedEvent.parse({ eventType: 'prereg.approved', ... })

// apps/site/api: receiver
import { preregApprovedEvent } from '@awb/contracts'
const event = preregApprovedEvent.parse(req.body)   // malformed data is rejected (422)
```

Change a contract and every app that uses it fails `npm run typecheck` until it is updated, so a sender and receiver can't ship out of step.

| File | Boundary it crosses |
|---|---|
| `src/sync/envelope.ts` | prereg ↔ site sync: the wrapper every sync event uses (`eventId`, `aggregateVersion`, `siteId`, ...) |
| `src/sync/prereg-approved.ts` | prereg → site: an approved Customer Pre-Registration |
| `src/realtime/lane-event.ts` | `site/api` → kiosk screen: what a weighbridge lane should show (`TAP1_VERIFIED`, `COMMITTED`, ...) |
| `src/common/transaction.ts` | Values every app shares: `BEL/JUL/LSK/LSM` and the four registration origins (also stands in for enums, which SQL Server lacks) |

**What goes in:** anything sent over HTTP, a sync event or a socket from one app to another. **What stays out:** anything used inside a single app, such as a route's request schema (`journey.schema.ts`) or a database model; those live in the app.

To add one: create the schema under `src/<area>/`, export it from `src/index.ts`, then import it from `@awb/contracts` on both the sending and receiving side.

A full explanation in Indonesian, covering the weighbridge steps (`wbSessionPhase`), the sync envelope (`syncEnvelope`), the planned sync flow and the rules for changing a contract safely, is in [packages/contracts/README.md](packages/contracts/README.md).

## Databases

| App | Database | Runs on | Prisma adapter |
|---|---|---|---|
| `prereg/api` | PostgreSQL | AWS | `@prisma/adapter-pg` |
| `site/api` | SQL Server | on-prem, one per plant | `@prisma/adapter-mssql` |

Each API has its own Prisma setup: `prisma/schema/` (one `.prisma` file per domain/module), `prisma/migrations/`, `prisma.config.ts`, and the single client in `src/config/prisma.ts`. Only `*.repository.ts` files use the client (enforced by the boundary check). The generated client lives in `src/generated/` and is not committed; Turborepo regenerates it before dev, typecheck, test and build.

SQL Server has no enum type, so enum-like columns are strings validated in the app with the schemas in `@awb/contracts`.

Local development databases run in Docker (`infra/dev/compose.yaml`): Postgres on host port **5450** (5432–5445 are taken by other local project databases) and SQL Server on 1433. Tests use separate `*_test` databases from `.env.test` and refuse to run against anything else.

## Commands

```
npm install
cp apps/site/api/.env.example apps/site/api/.env            (and .env.test.example → .env.test;
cp apps/prereg/api/.env.example apps/prereg/api/.env         same for prereg)
npm run db:up                 start local Postgres + SQL Server
npm run db:deploy             apply migrations to the dev databases
npm run dev:site              site api + web + kiosk
npm run dev:prereg            prereg api + web
npm run dev -w @awb/site-api  one app only
npm run check                 typecheck + boundary rules + blueprint coverage + tests (needs db:up)
npm run build
npm run db:down               stop the local databases (data is kept in Docker volumes)

npm run db:migrate -w @awb/site-api -- --name <change>   create a migration after editing a schema

npm run docs:setup            once: Python environment for the PDF documents (docs/.venv)
npm run blueprint:pdf         BLUEPRINT.md → docs/documents/Blueprint-AWB-DWS-v<date>.pdf
```

## Rules

Enforced by `npm run check:boundaries` (dependency-cruiser, `.dependency-cruiser.cjs`):

1. An app never imports another app. Shared code goes in `packages/`.
2. In `site/api`, files inside one domain import each other freely. Another domain is used only through its `index.ts`.
3. `site` and `prereg` talk over HTTP and sync events defined in `@awb/contracts`, never through code imports. The plant must keep working when the link to HO is down, so routine data (approved pre-registrations, HO-staff registrations) arrives by sync into the plant database.
4. `site/api/src/devices` never imports a domain; domains use devices.
5. Only `*.repository.ts` files use the Prisma client. Services and routes may import Prisma types, not the client.

## Backend module convention

One folder per module, one file per layer.

```
<module>/<module>.routes.ts       wiring only: parse input → call service → success()
<module>/<module>.service.ts      business flow; no req/res, no direct data access
<module>/<module>.repository.ts   data access only
<module>/<module>.schema.ts       zod schemas + inferred types
```

`site/api` keeps modules under `domains/<domain>/<module>/`; `prereg/api` uses `modules/<module>/`. Express 5 forwards rejected promises to the error handler, so route handlers don't need try/catch.

## Comments

- Write a comment only when the code can't explain itself: a non-obvious reason, a workaround or a business rule.
- **At most 2 lines per comment**, and keep them few. Don't restate what the code already says.
- Longer explanations go in a README next to the code (for example `packages/contracts/README.md`) or in `BLUEPRINT.md`.

## Tooling notes

- npm workspaces (`packages/*`, `apps/*/*`) with Turborepo for running tasks across apps.
- TypeScript is pinned to 6.0: dependency-cruiser and typescript-eslint don't support TypeScript 7 (the native compiler) yet.
- Workspace packages export TypeScript source; `tsup` bundles them into each API's `dist/`, and Vite compiles them for the web apps.

## Not decided yet

The full list, in Indonesian, is section 6 of `BLUEPRINT.md`.

- **Which tables to copy.** Both apps get new databases, with table structures copied selectively from the old systems (customer_prereg, VCF, WB.NET) and changed where needed (BLUEPRINT K-13). `Journey` and `PreRegistration` are placeholders until then. Draft list for review (Indonesian): `docs/design/inventaris-tabel.md`.
- **Old data and cutover:** later (PRD O-06).
- **Backup server if a plant server fails:** later (PRD O-09). Until then `site/api` runs as exactly one instance per plant, because it holds the controller sockets.
- **Controller relays:** what each relay (`OPEN1`, `OPEN4`, ...) does is checked during the site survey. The message format comes from VCF (`WbGateListenerService`); the Priscolin controllers are assumed to be the same type (K-14). The exact format is in `docs/design/protokol-controller.md`; `controller.protocol.ts` passes raw data through until it is implemented.
