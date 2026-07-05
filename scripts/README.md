# scripts/

Seed data, database migrations, and maintenance scripts.

First script (Phase 3): `seed-properties.ts` — seeds sample Abuja properties for local development. See [docs/IMPLEMENTATION_PLAN.md](../docs/IMPLEMENTATION_PLAN.md#phase-3--property-inventory--recommendationmatching-engine).

Run it with:

```
pnpm --filter server run seed:properties
```

(Imports `apps/server/src` modules by relative path so it reuses the same Mongoose models, Mongo connection, and env config as the server — run via `tsx` from `apps/server` so those files' own dependencies resolve from `apps/server/node_modules`.)
