# Forth Urban AI Property Advisor

AI-assisted, account-gated real estate consultation funnel for Abuja land sales.

Start here: **[AGENTS.md](AGENTS.md)** — orientation for any human or AI agent working in this repo.

Then read, in order:

1. [docs/PRODUCT_SPEC.md](docs/PRODUCT_SPEC.md) — what we're building
2. [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — how it's built
3. [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md) — in what order

## Quick start (once Phase 0 is complete)

```bash
pnpm install
pnpm dev      # runs client + server dev servers via Turborepo
pnpm build    # builds all apps/packages
pnpm lint     # lints all apps/packages
pnpm typecheck
pnpm test
```

Copy `.env.example` → `.env` in `apps/client` and `apps/server` before running `dev`.
