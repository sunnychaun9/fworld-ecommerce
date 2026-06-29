# Architecture Decision Records (ADRs)

This directory is the durable record of **significant architectural decisions**
made on the FWorld platform — the "why" behind the system, captured at the
moment the decision was made.

Per the [Engineering Handbook](../000_MASTER_INSTRUCTIONS.md), ADRs are a
binding source of truth. AI coding agents and engineers must follow accepted
ADRs and must not silently contradict them.

---

## What is an ADR?

An Architecture Decision Record is a short, immutable document that captures a
single architecturally significant decision: the context that forced the
choice, the options weighed, the decision taken, and the consequences accepted.

ADRs are **append-only history**. An accepted ADR is never rewritten to reflect
a new reality — instead a _new_ ADR is written that supersedes it. This keeps an
honest audit trail of how and why the architecture evolved.

ADRs complement, but do not replace, the other documents in `docs/`:

| Document type        | Answers                                          |
| -------------------- | ------------------------------------------------ |
| Handbook / PRD / TRD | _What_ we are building and the standing rules    |
| **ADR**              | _Why_ a specific structural decision was made    |

---

## Why ADRs exist

- **Preserve intent.** Six months later, the reasoning behind a choice is as
  valuable as the choice itself. ADRs prevent re-litigating settled decisions.
- **Onboard faster.** New engineers (and AI agents) can read the decision trail
  instead of reverse-engineering it from code.
- **Force rigor.** Writing down alternatives and trade-offs surfaces weak
  decisions before they are committed.
- **Enable safe change.** When a decision is reversed, the superseding ADR makes
  the migration path and the reason for the reversal explicit.

---

## When to create a new ADR

Create an ADR when a decision is **costly to reverse** or **affects multiple
teams or modules**. Examples:

- Adopting, replacing, or removing a core framework, language, or runtime.
- Choosing a database, cache, queue, search, storage, or hosting provider.
- Establishing a cross-cutting pattern (auth strategy, API contract shape,
  error model, multi-tenancy, caching strategy).
- Introducing a new bounded context or major module boundary.
- Any change that contradicts or refines a previously accepted ADR.

**Do not** create an ADR for routine, easily reversible work: a bug fix, a
component implementation, a dependency patch bump, or a local refactor.

> Rule of thumb: if a future engineer would ask _"why was it done this way?"_
> and the answer is non-obvious, write an ADR.

---

## ADR lifecycle

```text
        ┌──────────┐      review &      ┌──────────┐
        │ Proposed │ ─────agreement────▶ │ Accepted │
        └──────────┘                     └────┬─────┘
              │                               │
        rejected /                     replaced by a
        withdrawn                      newer decision
              │                               │
              ▼                               ▼
         (discarded)                    ┌────────────┐
                                        │ Superseded │
                                        └────────────┘
                                              │
                                    no longer relevant
                                              ▼
                                        ┌────────────┐
                                        │ Deprecated │
                                        └────────────┘
```

1. **Draft** — copy `ADR_TEMPLATE.md` to the next number, fill it in, open a PR.
2. **Propose** — status `Proposed`; reviewers debate in the PR.
3. **Accept** — on approval, set status `Accepted` and merge. The ADR is now
   binding and immutable.
4. **Supersede / Deprecate** — to change an accepted decision, write a _new_
   ADR. Mark the old one `Superseded` (replaced) or `Deprecated` (no longer
   relevant) with a link to the successor. Never delete or silently edit it.

---

## Status values

| Status         | Meaning                                                                          |
| -------------- | -------------------------------------------------------------------------------- |
| **Proposed**   | Drafted and under review. Not yet binding.                                       |
| **Accepted**   | Approved and in force. Engineers and AI agents must comply.                      |
| **Superseded** | Replaced by a later ADR. Retained for history. Links to the replacement.         |
| **Deprecated** | No longer relevant (the context disappeared) but not directly replaced.          |

---

## Conventions

- **Filename:** `ADR-NNNN-Short-Title.md` (zero-padded, sequential, e.g.
  `ADR-0002-Authentication-Strategy.md`).
- **Numbers are never reused**, even if an ADR is rejected.
- Every new ADR must add a row to [`ADR-0000-INDEX.md`](./ADR-0000-INDEX.md).
- Keep ADRs concise — typically one to three pages. Link out to the TRD or
  external references rather than duplicating them.

---

## Creating an ADR

```bash
# pick the next free number, then:
cp docs/adr/ADR_TEMPLATE.md docs/adr/ADR-0002-Your-Decision-Title.md
# fill it in, add a row to ADR-0000-INDEX.md, open a PR with status: Proposed
```
