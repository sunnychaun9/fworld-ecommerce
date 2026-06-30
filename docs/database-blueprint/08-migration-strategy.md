# 08 · Migration Strategy

**Status:** Blueprint (no implementation — **no migrations generated**).
**Basis:** `004` Migration Rules ("never modify migrations; always create a new
migration"), TRD §20 (CI/CD), ADR-0001 (Prisma Migrate).

## 1. Forward-only migrations

- **Migrations are immutable once merged.** Never edit an applied migration; fix
  forward with a **new** migration (`004` rule). **Why:** a migration that has run
  in any shared/prod environment is part of history — editing it desyncs
  environments and breaks the migration ledger.
- Each migration is **small, reviewed, and reversible-by-design** (paired with a
  forward "undo" migration when needed — see rollback).
- Migrations are **version-controlled**, named meaningfully, and applied in CI
  before deploy.

## 2. Expand / Contract (zero-downtime)

Schema changes that could break a running app follow **expand → migrate →
contract**:

1. **Expand** — additive only (new nullable column/table/index `CONCURRENTLY`),
   safe for the old code.
2. **Backfill & dual-write** — populate/keep new and old in sync.
3. **Migrate reads/writes** — ship app code using the new shape.
4. **Contract** — a later migration removes the old column/constraint once nothing
   uses it.

**Why:** Vercel/Railway deploys are rolling; a single destructive migration would
break in-flight requests. This pattern keeps the DB compatible with both the old
and new app versions during a deploy.

## 3. Rollback policy

- **Roll forward, not down, in production.** Prefer a new corrective migration over
  `migrate down`. **Why:** down-migrations that drop columns destroy data; in prod
  the safe recovery is restore-from-backup + fix-forward.
- **Destructive steps gated:** dropping a column/table requires (a) prior contract
  step, (b) confirmed no readers, (c) a fresh backup.
- Non-prod (dev) may reset freely (`migrate reset`); **never** in prod.

## 4. Production migration process

```text
PR with migration
  → CI: lint + build + apply migration to ephemeral DB + run tests
  → Review (CODEOWNER) + CTO sign-off for destructive/contract steps
  → Pre-deploy backup snapshot (see §6)
  → Apply migration (expand) in a maintenance-safe window
  → Deploy app
  → Verify (health, key flows)
  → Schedule contract migration later
```

- Migrations run **before** the app boots the new version (deploy gate).
- **Index creation uses `CONCURRENTLY`** on large tables to avoid write locks.
- Long backfills run as **batched background jobs**, not inside the migration
  transaction.

## 5. Seeding strategy

- **Idempotent, environment-aware seeds** (re-runnable without duplications):
  - **Reference/essential (all envs):** roles, default `settings` (store/GST/
    shipping/payment groups, 012), the default **warehouse** (single-WH launch),
    and an initial **admin** user (credentials via env/secret, never committed).
  - **Catalog bootstrap (staging/dev):** launch **categories** (BRD §10) and
    sample products/variants for testing — **not** production.
  - **Demo data:** dev only.
- Seeds use **upserts keyed on business keys** (slug/code/key) so re-running is
  safe. **Why:** seeding must be deterministic across fresh clones and CI.
- Seed order respects FK dependencies (warehouse → categories → products →
  variants → inventory).

## 6. Backups & safety (`004` Backup)

- **Daily backup, 30-day retention; weekly full; monthly archive** (`004`).
- A **pre-migration snapshot** is mandatory before any production migration.
- Restores are periodically **test-restored** (a backup never tested is not a
  backup) — ops runbook item.

## 7. Notes

- Prisma Migrate is the chosen tool (ADR-0001); the **shadow database** in CI
  validates migrations against a clean schema.
- Enum value additions and new tables are forward-only migrations
  ([04](./04-enumerations.md)).
