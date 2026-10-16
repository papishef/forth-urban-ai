# scripts/

Seed data, database migrations, and maintenance scripts.

First script (Phase 3): `seed-properties.ts` — seeds sample Abuja properties for local development. See [docs/IMPLEMENTATION_PLAN.md](../docs/IMPLEMENTATION_PLAN.md#phase-3--property-inventory--recommendationmatching-engine).

Run it with:

```
pnpm --filter server run seed:properties
```

(Imports `apps/server/src` modules by relative path so it reuses the same Mongoose models, Mongo connection, and env config as the server — run via `tsx` from `apps/server` so those files' own dependencies resolve from `apps/server/node_modules`.)

## `cleanup-spam-users.ts`

Soft-deletes spam accounts created before registration required a completed Home-Readiness Quiz. Dry-run by default — it only logs the accounts it would remove:

```
pnpm --filter server run cleanup:spam-users                          # report never-verified accounts older than 24h
pnpm --filter server run cleanup:spam-users -- --include-without-quiz # also report accounts with no quiz result and no inspection booking
pnpm --filter server run cleanup:spam-users -- --include-without-quiz --apply
```

Options: `--older-than-hours=<n>` (default `24`). Admin accounts are never touched. Removed accounts are soft-deleted (email tombstoned, original kept in `deletedEmail`, sessions revoked, audit-logged as `user.spam_account_removed`). Never-verified accounts are also purged automatically every day by the server cron after `UNVERIFIED_ACCOUNT_RETENTION_DAYS`.
