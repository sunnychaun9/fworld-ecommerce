# FWorld Engineering Handbook

## 000_MASTER_INSTRUCTIONS.md

**Document Version:** 2.0.0

**Status:** Draft

**Classification:** Internal Engineering Documentation

**Project:** FWorld

**Project Type:** Premium D2C Fashion Ecommerce Platform

**Primary Market:** India

**Document Owner:** CTO Office

**Audience:**

- Product Team
- Engineering Team
- UI/UX Team
- QA Team
- DevOps Team
- AI Coding Agents (Claude Code, Codex, Cursor, Gemini CLI, GitHub Copilot)

---

# Purpose of this Document

This document is the **single source of truth** for the engineering standards, architectural principles, and implementation rules of the FWorld platform.

Every technical decision must be consistent with this handbook.

If any requirement in another document conflicts with this handbook, this handbook takes precedence unless a newer version explicitly supersedes it.

No engineer or AI coding agent may intentionally violate the standards defined here.

---

# About FWorld

FWorld is a premium Direct-to-Consumer (D2C) ecommerce platform focused initially on men's fashion in India.

The long-term vision is to evolve FWorld into a technology-first fashion brand with world-class user experience, scalable architecture, intelligent product discovery, and an operational platform capable of supporting future expansion into additional product categories and markets.

The first public release targets:

- Men's Jeans
- Shirts
- T-Shirts
- Cargo Pants
- Trousers
- Hoodies
- Jackets
- Shorts
- Accessories (future-ready)

Future expansion includes:

- Women's Fashion
- Kids Fashion
- Footwear
- Accessories
- Lifestyle Products
- Native Mobile Applications
- AI Shopping Assistant
- Loyalty Program
- Referral System

---

# Vision Statement

Build one of India's most trusted and premium online fashion destinations by combining exceptional customer experience, robust engineering, operational excellence, and long-term maintainability.

The platform must prioritize quality over speed and sustainability over shortcuts.

---

# Mission Statement

Deliver a fast, secure, elegant, and scalable ecommerce experience that customers enjoy using and engineers enjoy maintaining.

Every feature must contribute to at least one of the following:

- Better customer experience
- Higher conversion rate
- Improved operational efficiency
- Increased maintainability
- Stronger security
- Better performance
- Better accessibility

Features that do not create measurable value should not be implemented.

---

# Core Product Principles

Every feature introduced into FWorld must satisfy these principles.

## 1. Customer First

Customer experience is the highest priority.

Internal convenience must never outweigh customer usability.

---

## 2. Premium Experience

The website should feel modern, elegant, and refined.

Avoid visual clutter.

Avoid unnecessary animations.

Use whitespace intentionally.

Typography must improve readability.

Product photography must remain the primary visual focus.

---

## 3. Performance First

Performance is a feature.

Every unnecessary network request, dependency, animation, and JavaScript bundle negatively impacts the customer experience.

Optimization is mandatory—not optional.

---

## 4. Security by Default

Security is part of the architecture, not an afterthought.

Every feature must be designed assuming malicious input is possible.

Validation is required on both the client and server.

---

## 5. Accessibility by Design

Accessibility is not a compliance exercise.

The platform should be usable by the widest possible audience.

Keyboard navigation, semantic HTML, appropriate color contrast, focus management, and screen reader support are expected from the beginning.

---

## 6. SEO as Infrastructure

Search engine optimization must be built into the architecture rather than added later.

Every public page should be designed with discoverability in mind.

---

## 7. Scalability

The initial launch serves a single business, but the architecture should avoid assumptions that would prevent future growth.

The system should be capable of supporting:

- More product categories
- Multiple warehouses
- Multiple administrators
- Mobile applications
- Additional payment providers
- Future AI services

without major architectural rewrites.

---

# Business Objectives

The engineering team must understand the business objectives because technical decisions directly influence business outcomes.

Primary objectives:

- Build trust
- Increase conversions
- Encourage repeat purchases
- Reduce operational effort
- Improve SEO visibility
- Enable rapid feature delivery
- Maintain high reliability

Engineering work should contribute to these goals whenever possible.

---

# Engineering Philosophy

The FWorld engineering team follows these principles:

### Build once, reuse everywhere.

### Prefer clarity over cleverness.

### Simplicity beats unnecessary abstraction.

### Every dependency must justify its existence.

### Code should be understandable six months later.

### Small modules are easier to maintain than large ones.

### Documentation is part of the product.

### Automation is preferred over manual processes.

### Every change should improve the codebase.

---

# Quality Standards

No code is considered complete until it satisfies all of the following:

- Builds successfully
- Passes static analysis
- Passes tests
- Meets performance requirements
- Meets accessibility requirements
- Meets security requirements
- Includes documentation
- Receives code review approval

Partial completion is not considered completion.

---

# Definition of Production Quality

Production-ready software means:

- Stable
- Tested
- Secure
- Observable
- Maintainable
- Documented
- Scalable
- Recoverable

Software that merely "works" is not sufficient.

---

# Technology Philosophy

Technology choices are made according to the following priorities:

1. Long-term maintainability
2. Ecosystem maturity
3. Performance
4. Developer experience
5. Community support
6. Documentation quality
7. Upgrade path
8. Vendor stability

Popularity alone is not a valid reason for adoption.

---

# Repository Ownership

The repository is the company's intellectual property.

The repository should always remain in a deployable state.

Broken builds may not be merged into the default branch.

Every commit should improve the overall health of the project.

---

# Documentation Policy

Documentation is mandatory.

If implementation changes behavior, documentation must be updated in the same change.

Documentation should explain:

- Why a decision was made.
- What constraints exist.
- How future engineers should extend the implementation.

Documentation must never duplicate code unnecessarily.

---

# AI Coding Agent Policy

AI coding agents are implementation assistants—not architects.

AI agents must:

- Follow the engineering handbook.
- Follow the PRD.
- Follow the TRD.
- Follow Architecture Decision Records (ADRs).
- Ask for clarification when requirements conflict.
- Avoid introducing undocumented dependencies.
- Preserve existing architecture.
- Keep changes small and reviewable.
- Update documentation when behavior changes.

AI agents must not invent business rules or silently change architecture.

---

# Guiding Rule

When two implementation options are technically correct, choose the one that is:

- Easier to maintain
- Easier to understand
- Easier to test
- Easier to extend
- Less surprising for future engineers

Long-term maintainability is more valuable than short-term implementation speed.

---

# End of Part 1

---

## Part 2 — Repository Governance & Engineering Standards

---

# Repository Governance

The FWorld repository is the authoritative implementation of the FWorld platform.

Every file, folder, commit, pull request, and release must follow the standards defined in this handbook.

No contributor, whether human or AI, may intentionally bypass these rules.

The repository must remain in a releasable state at all times.

---

# Engineering Governance

Engineering decisions follow this hierarchy.

Priority Order:

1. Master Engineering Handbook
2. Architecture Decision Records (ADR)
3. Business Requirements (BRD)
4. Product Requirements (PRD)
5. Technical Requirements (TRD)
6. Approved Design Documents
7. Implementation

When two documents conflict, the document with the higher priority takes precedence.

No implementation may redefine business requirements.

---

# Repository Principles

The repository shall be:

- Modular
- Predictable
- Documented
- Testable
- Observable
- Secure
- Reproducible
- Maintainable

Every change must move the repository closer to these goals.

---

# Repository Structure

The top-level repository structure is considered stable.

New top-level folders require an Architecture Decision Record (ADR).

Approved top-level folders:

```text
frontend/
backend/
docs/
architecture/
branding/
assets/
research/
legal/
docker/
scripts/
packages/
prompts/
.github/
```

No additional top-level folders may be introduced without approval.

---

# Folder Ownership

Each folder has a clearly defined responsibility.

## frontend/

Contains only frontend application code.

Must never contain backend logic.

Must never contain SQL.

Must never contain secrets.

---

## backend/

Contains only backend application logic.

Responsible for:

- APIs
- Business logic
- Authentication
- Authorization
- Database access
- Background jobs

---

## docs/

Contains engineering documentation.

No executable source code.

Markdown only.

---

## architecture/

Contains:

- Architecture diagrams
- Sequence diagrams
- Infrastructure diagrams
- C4 diagrams
- System context
- Deployment diagrams

---

## branding/

Contains:

- Logos
- Brand guidelines
- Typography
- Color system
- Marketing assets

---

## research/

Contains:

- Competitor analysis
- UX research
- Technical investigations
- Proofs of concept
- Benchmark reports

---

## legal/

Contains:

- Privacy Policy
- Terms of Service
- Return Policy
- Shipping Policy
- Refund Policy
- GST documentation

---

## prompts/

Contains implementation prompts for AI coding agents.

Prompts are implementation guidance.

They are not architectural authority.

---

# Source of Truth

Every important decision must have exactly one source of truth.

Examples:

Database schema:

→ Database Design Document

API contract:

→ API Specification

Business rules:

→ PRD

Architecture:

→ ADR

Never duplicate authoritative information across documents.

---

# Git Branch Strategy

Protected Branches

- main
- develop

Working Branches

feature/<name>

bugfix/<name>

hotfix/<name>

release/<version>

docs/<topic>

refactor/<module>

---

# Commit Standards

Conventional Commits are mandatory.

Allowed prefixes:

feat:

fix:

refactor:

perf:

style:

docs:

test:

build:

ci:

chore:

revert:

Examples:

feat(auth): add OTP login

fix(cart): correct GST calculation

docs(api): update checkout endpoints

---

# Pull Request Rules

Every Pull Request must include:

Purpose

Summary

Files Changed

Testing Performed

Screenshots (UI changes)

Documentation Updated

Checklist Completed

Linked Issue (if applicable)

---

# Code Review Policy

Every change must be reviewed for:

Correctness

Security

Performance

Accessibility

Maintainability

Documentation

Test Coverage

Architecture Compliance

A feature is not complete until the review is approved.

---

# Naming Conventions

Directories

kebab-case

Files

kebab-case

React Components

PascalCase

Hooks

useSomething

Interfaces

PascalCase

Enums

PascalCase

Types

PascalCase

Variables

camelCase

Constants

UPPER_SNAKE_CASE

Environment Variables

UPPER_SNAKE_CASE

Database Tables

snake_case

Database Columns

snake_case

API Endpoints

kebab-case

URLs

lowercase

---

# Dependency Management

Every dependency must satisfy at least one business or technical requirement.

Before introducing a dependency, consider:

- Is the feature already available in the platform?
- Is the dependency actively maintained?
- Does it increase bundle size significantly?
- Is it compatible with the project license?
- Is there a lighter alternative?

Dependencies without clear justification must not be added.

---

# Third-Party Services

Every third-party service must have documented:

- Purpose
- Owner
- Configuration
- Authentication method
- Failure mode
- Backup strategy

No service may be integrated without documentation.

---

# Secrets Management

Secrets must never be:

- Committed to Git
- Logged
- Embedded in frontend code
- Shared in documentation

All secrets must originate from secure environment configuration.

---

# Documentation Standards

Engineering documentation must:

- Explain intent
- Explain constraints
- Explain trade-offs
- Reference related documents
- Remain version controlled

Documentation is considered part of the deliverable.

---

# Architecture Decision Rules

Major decisions require an ADR before implementation.

Examples include:

- Database technology
- Authentication provider
- Search engine
- Caching strategy
- Deployment platform
- API style
- Queue system
- Monitoring stack

Minor implementation details do not require ADRs.

---

# AI Coding Agent Rules

AI coding agents must:

- Read relevant documentation before coding.
- Avoid speculative implementations.
- Preserve repository consistency.
- Never silently change architecture.
- Prefer incremental pull requests.
- Keep generated code readable.
- Update documentation when implementation changes.

AI agents must stop and request clarification if requirements conflict.

---

# Definition of Ready

A task is ready for implementation only if:

- Business requirements exist.
- Acceptance criteria are defined.
- Dependencies are identified.
- Required ADRs exist.
- UI requirements are available (if applicable).

Incomplete requirements must not enter implementation.

---

# End of Part 2
