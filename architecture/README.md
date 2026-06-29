# `architecture/`

System and infrastructure **diagrams** for FWorld, per the Engineering Handbook
(Part 2 — Folder Ownership).

Contains:

- Architecture diagrams
- Sequence diagrams
- Infrastructure diagrams
- C4 diagrams (System Context, Container, Component)
- System context
- Deployment diagrams

## Conventions

- Prefer **diagram-as-code** (Mermaid `.mmd`, or `.puml`) so diagrams are
  diffable and version-controlled; commit exported `.svg`/`.png` alongside the
  source when an image is needed.
- Name files by subject and view, e.g. `c4-container.mmd`,
  `checkout-sequence.mmd`, `deployment-prod.mmd`.

## Relationship to other docs

| Concern                        | Source of truth                       |
| ------------------------------ | ------------------------------------- |
| **Why** a decision was made    | [`docs/adr/`](../docs/adr/)           |
| **What** the system looks like | this folder (diagrams)                |
| **How** it is built/configured | [`docs/`](../docs/) (TRD, deployment) |

> ADRs remain in [`docs/adr/`](../docs/adr/) as Markdown decision records; this
> folder holds the visual architecture they describe.
