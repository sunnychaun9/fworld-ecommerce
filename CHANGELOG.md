# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Nothing yet.

## [0.1.0] — 2026-06-29

### Added

- **Repository foundation** for the FWorld enterprise monorepo.
- pnpm + Turborepo workspace orchestrating `frontend`, `backend`, and
  `packages/*`.
- **Frontend** scaffold: Next.js 15 (App Router) + React 19 + TypeScript +
  Tailwind CSS v4 + shadcn/ui config + TanStack Query / Zustand / RHF / Zod
  dependencies.
- **Backend** scaffold: NestJS 11 + TypeScript + Prisma + PostgreSQL with
  config, validation, Helmet, CORS, and versioned `/api/v1` prefix.
- Shared **TypeScript base config** (`tsconfig.base.json`), Prettier, ESLint,
  EditorConfig, and `.gitignore`.
- **Git hooks**: Husky (`pre-commit` → lint-staged, `commit-msg` → Commitlint).
- **Docker**: local `docker-compose.yml` (PostgreSQL, Redis, Meilisearch) and
  production Dockerfiles for both apps.
- **CI/CD**: GitHub Actions (format, lint, typecheck, build, test) + CodeQL +
  Dependabot + issue/PR templates + CODEOWNERS.
- Project governance docs: `README`, `LICENSE`, `CONTRIBUTING`,
  `CODE_OF_CONDUCT`, `SECURITY`, and `.env.example`.

> No business features, UI, authentication, database models, or APIs are
> implemented in this release — this is the foundation only.

[Unreleased]: https://github.com/fworld/fworld/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/fworld/fworld/releases/tag/v0.1.0
