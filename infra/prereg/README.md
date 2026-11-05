# Preregistration operations

The current release integrates account/session security, partner administration,
permissions, driver/vehicle data models and private document storage. Truck
submission/approval and plant synchronization remain separate unfinished workflows.
OTP and email delivery are deferred. Production login supports provisioned bcrypt
accounts, but account creation and password reset return 503 before changing data
until credential delivery is implemented. Never present this release as a complete
operational AWB system.

## Development

Run the local databases, apply migrations, then run the development-only seed:

```sh
npm run db:up
npm run db:deploy
npm run db:seed -w @awb/prereg-api
npm run dev:prereg
```

The seed prints a randomly generated initial administrator password only when it
creates that account. Re-running the seed does not reset existing account passwords.
Do not forward console output containing development credentials. Existing legacy
SHA-256 accounts require an explicit temporary `ALLOW_LEGACY_PASSWORDS=true` setting;
a successful login replaces the old hash with bcrypt. Disable that flag after the
transition. Scrypt hashes from the unmerged integer-schema branch are not accepted.

## Migrations and existing data

Only the approved UUID account migration is the common baseline. The duplicate
integer account migrations from the second branch are intentionally superseded by
the integrated migrations. Never deploy both initial account schemas together.

Before applying this release to an existing database:

1. Back up the database and private upload volume and test restoring both in staging.
2. Inspect migration history. A database initialized with the integer branch needs
   a separately reviewed mapping/export into a fresh integrated database. Do not
   reset, drop or automatically reinterpret that database.
3. For a UUID baseline database, check that identifiers are valid UUIDs, usernames,
   emails and SAP codes have no case-insensitive duplicates, and each SAP code is
   assigned to at most one account. Resolve conflicts before migration.
4. Stop writers while converting TEXT UUID columns to native UUID. Conversion
   preserves identifier values but locks/rebuilds dependent structures. Measure
   duration and disk headroom against a representative copy before scheduling it.
5. Ensure the database migration role may enable `pg_trgm`. Run `db:deploy` once as
   a release job, not concurrently from every application instance. Preserve SQL
   expression and trigram indexes when reviewing future Prisma migrations.
6. Verify authentication, UUID references, upload ownership and query plans before
   reopening traffic. Old placeholder tokens cannot be reused; users sign in again.

Rollback after a data migration means restoring a verified backup together with
the matching application release. Do not run the old integer or TEXT-schema app
against the converted schema.

## Runtime configuration

- `NODE_ENV=production`; `APP_ORIGIN` must be the exact HTTPS browser origin.
- Serve the built frontend and `/api` under the same origin through a reverse proxy.
  Dev uses Vite's loopback proxy. Cookie credentials are not exposed to JavaScript.
- `HOST` defaults to loopback. In a production container, explicitly configure its
  listener and allow traffic only from the intended load balancer/proxy.
- `TRUST_PROXY_HOPS` defaults to zero. Configure the exact hop count only when direct
  application access is blocked; arbitrary proxy trust permits forged client IPs.
- `BCRYPT_ROUNDS` defaults to 12; values below 10 are rejected outside tests. Tune
  against measured login CPU and latency. Passwords over 72 UTF-8 bytes are rejected.
- `DATABASE_POOL_MAX` defaults to 10 per process; acquisition timeout is 5 seconds.
  Budget `instance count × pool maximum` plus migration/operations connections below
  the database connection allowance. Add instances only after checking that budget.
- `SESSION_HOURS=8`, `SESSION_REMEMBER_DAYS=14`, `SESSION_IDLE_MINUTES=60` are defaults.
  Sessions are shared in PostgreSQL, expire in the server and can be revoked.
  Expired-session/throttle cleanup runs in batches of at most 1,000 rows per table
  each minute, using row locks that allow multiple instances to cooperate.
- Login counters are shared in PostgreSQL, including all SAP aliases for one account.
  Add edge request limits for internet traffic as part of ingress configuration.
- Use the deployment secret mechanism for database/bootstrap credentials. Never
  commit production environment files or log passwords, session tokens or uploads.

For an empty database, `npm run db:bootstrap-admin -w @awb/prereg-api` uses
`BOOTSTRAP_ADMIN_USERNAME` and `BOOTSTRAP_ADMIN_PASSWORD` supplied through the secret
mechanism. It creates only the first active administrator, stores bcrypt and never
prints the password. Remove those bootstrap variables from the runtime afterwards.
The development seed refuses to run outside development.

## Storage and capacity

`UPLOAD_DIR` is private and outside the public web root. Uploads are streamed to a
temporary file, limited to one 5 MB file, checked for JPEG/PNG/PDF signatures, then
renamed under a date/UUID key. The database holds metadata, never file contents.
Downloads use an authenticated document UUID, owner/reviewer checks and attachment
headers; original filesystem paths are not returned.

Mount a durable shared private volume when running multiple instances. Ephemeral
container disks are unsuitable. An object-storage adapter is a later deployment
choice; no cloud upload is configured by this change. Monitor volume capacity,
inodes and `.incoming` files left by terminated uploads. Plan a retention policy
and an audited orphan-reconciliation job before enabling large-volume uploads;
never delete files solely because their age exceeds an arbitrary threshold.

Transactional request lists use `(created_at, id)` cursors and `limit + 1` queries,
with no full-table count. Status and owner filters have matching composite indexes.
Account lists are administrative, bounded to 100 records and 1,000 offset pages;
use filters beyond that range. SAP choices are capped at 50 per search. Trigram
indexes support contains searches. Native UUIDv7 IDs improve insert locality while
existing UUIDv4 identifiers remain valid.

Before a capacity claim, load-test realistic row counts, concurrent users, request
mix and upload sizes in staging. Inspect `EXPLAIN (ANALYZE, BUFFERS)` for list/search
queries, and monitor p95 latency, pool wait, locks, disk I/O and bcrypt CPU. Indexes
and bounded requests are foundations, not a measured throughput guarantee.

## Checks

```sh
npm run check
npm run build
npx playwright install chromium
npm run test:e2e
```

Browser tests use loopback ports 3001/5176 and the local `*_test` database; they
refuse non-local or non-test databases. They do not send real mail. The browser
server and its fixed fixtures are test-only. API tests verify permissions, CSRF,
forged headers, session revocation, account changes, native UUID relations and files.

Use `npm run format` and `npm run lint:fix` before committing. CI repeats formatting,
lint, type checks, architectural/document checks, API tests, builds and browser tests.
