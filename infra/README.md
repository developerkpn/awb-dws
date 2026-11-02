# infra

Deployment configuration goes here.

- `prereg/` — image for `@awb/prereg-api` (plus the built `@awb/prereg-web`) → AWS ECS, public.
- `site/` — docker compose per plant: `@awb/site-api` (exactly one instance, it owns the controller sockets), the built `site-web` and `site-kiosk`, and the plant database.

Slim images can be built from a pruned workspace: `npx turbo prune @awb/site-api --docker`.
