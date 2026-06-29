# Security Policy

## Supported Versions

FWorld is under active development. Security fixes are applied to the `main`
branch and the current production release.

| Version | Supported |
| ------- | --------- |
| `main`  | ✅        |
| `0.1.x` | ✅        |

## Reporting a Vulnerability

**Please do not open a public issue for security vulnerabilities.**

Report privately via one of:

- GitHub **Security Advisories** → "Report a vulnerability", or
- email **security@fworld.example**

Include where possible:

- A description of the vulnerability and its impact
- Steps to reproduce or a proof of concept
- Affected component(s), version, or commit SHA
- Any suggested remediation

### Our commitment

- We acknowledge reports within **3 business days**.
- We provide a remediation timeline after triage.
- We credit reporters in the release notes unless anonymity is requested.

## Scope & Handling

- Secrets are never committed; they are injected via the platform vaults
  (Vercel / Railway). The repository ships only `.env.example` templates.
- Dependencies are monitored via Dependabot and scanned via CodeQL.
- Backend enforces Helmet, CORS, rate limiting, input validation, and
  parameterized queries (Prisma) per [`docs/003_TRD.md`](./docs/003_TRD.md) §14.

Thank you for helping keep FWorld and its customers safe.
