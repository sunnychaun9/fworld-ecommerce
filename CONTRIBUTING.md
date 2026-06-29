# Contributing to FWorld

Thanks for contributing! This guide keeps the codebase consistent and the
delivery pipeline green.

## Prerequisites

- Node.js ≥ 20 (use `nvm use` — see [`.nvmrc`](./.nvmrc))
- pnpm ≥ 9 (`corepack enable`)
- Docker (for local backing services)

```bash
pnpm install            # installs the whole workspace + sets up Husky
cp .env.example .env
docker compose up -d
pnpm dev
```

## Branching

Per the [Engineering Handbook](./docs/000_MASTER_INSTRUCTIONS.md) (Part 2 — Git
Branch Strategy).

**Protected branches** (no direct pushes; PR + green CI + review required):

| Branch    | Purpose                                   |
| --------- | ----------------------------------------- |
| `main`    | Always releasable production line.        |
| `develop` | Integration branch for upcoming releases. |

**Working branches** (branch from `develop`, PR back into `develop`; `hotfix/`
branches from and back into `main`):

| Pattern             | Purpose                       |
| ------------------- | ----------------------------- |
| `feature/<name>`    | New feature                   |
| `bugfix/<name>`     | Bug fix                       |
| `hotfix/<name>`     | Urgent production fix         |
| `release/<version>` | Release stabilization         |
| `docs/<topic>`      | Documentation                 |
| `refactor/<module>` | Refactor (no behavior change) |

## Commit messages — Conventional Commits

Format: `type(scope): subject` (enforced by Commitlint via the `commit-msg` hook).

```
feat(cart): add quantity stepper to mini-cart
fix(backend): handle empty Razorpay webhook payload
docs(readme): document local setup
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`,
`build`, `ci`, `chore`, `revert`.
**Scopes:** `frontend`, `backend`, `packages`, `docker`, `ci`, `docs`,
`deps`, `config`, `release`.

## Quality gates

The pre-commit hook runs `lint-staged` (Prettier). Before pushing, make sure:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
pnpm test
```

CI (GitHub Actions) runs the same gates on every PR. PRs must be green and
reviewed by a CODEOWNER before merge.

## Coding standards

Follow [`docs/009_CODING_STANDARDS.md`](./docs/009_CODING_STANDARDS.md):

- **Strict TypeScript** — no `any`.
- **SOLID**, **DRY**, **KISS**, **YAGNI**, Clean Architecture.
- Feature-based structure; reusable components, hooks, and services.
- Validate everything with **Zod** (frontend) / **class-validator** (backend);
  never trust the client.

## Pull requests

- Keep them focused and small where possible.
- Fill in the PR template and link the issue.
- Update documentation and tests alongside code.
