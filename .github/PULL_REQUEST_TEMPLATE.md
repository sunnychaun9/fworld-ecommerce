<!--
PR sections below are mandated by the Engineering Handbook (Part 2 — Pull
Request Rules). Do not remove sections; write "N/A" where one does not apply.
-->

## Purpose

<!-- Why is this change needed? The problem or goal it addresses. -->

## Summary

<!-- What does this PR do, at a high level? -->

## Files Changed

<!-- Notable files/modules touched and why. -->

## Testing Performed

<!-- How was this verified? Commands run, cases covered, manual steps. -->

## Screenshots (UI changes)

<!-- Before/after for any user-facing change, else "N/A". -->

## Documentation Updated

<!-- Which docs/ADRs were updated, or "N/A". Docs are part of the deliverable. -->

## Linked Issue

Closes #<!-- issue number, or "N/A" -->

## Checklist

- [ ] Follows the [Engineering Handbook](../docs/000_MASTER_INSTRUCTIONS.md) and [Coding Standards](../docs/009_CODING_STANDARDS.md)
- [ ] Complies with all relevant [ADRs](../docs/adr/ADR-0000-INDEX.md)
- [ ] Conventional Commit messages (kebab-case scope)
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm format:check` pass
- [ ] `pnpm build` succeeds
- [ ] Tests added/updated and `pnpm test` passes
- [ ] No secrets, keys, or PII committed
- [ ] Documentation updated where behavior changed
- [ ] Reviewed for correctness, security, performance, accessibility, maintainability, and architecture compliance
