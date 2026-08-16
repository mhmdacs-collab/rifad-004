# Rifad

Rifad is an independent Saudi POS product. This repository is the new implementation foundation for Rifad itself — not a fork product, not an Odoo skin, and not a FloCafe continuation.

## Product direction

- **UI/UX reference:** Loyverse behavior and interaction patterns, independently implemented with Rifad branding.
- **Desktop:** application experience for Windows.
- **Tablet/mobile:** installable PWA that must feel like an application, not a website.
- **Architecture:** modular puzzle architecture. Each business capability is isolated behind a Rifad-owned contract/adapter.
- **Local operation:** local-first/offline-capable operation is a first-class requirement.
- **Cloud:** synchronization and multi-branch services are Rifad-owned concerns.
- **Saudi fiscal:** ZATCA is a core product domain, not an optional plugin.

## Golden rule

> Rifad owns the product, contracts, data model, release process, UI and roadmap. External projects are donors only.

A donor implementation may be written in any language. We may reuse permissively licensed code where appropriate, or extract its behavior, algorithms, state machine and tests and reimplement them behind a Rifad contract. No donor project becomes the architecture owner.

## Build order

1. Complete the Rifad application surfaces visually and interactively using mock adapters.
2. Freeze Rifad contracts for the actions exposed by those surfaces.
3. For each capability, research multiple donor implementations and select the simplest proven logic.
4. Port/reimplement the selected logic behind its adapter.
5. Validate with contract, conformance, offline, visual and hardware tests.
6. Replace a module without changing the rest of the product whenever its contract remains stable.

## Product surfaces

- POS
- Back Office
- Dashboard
- KDS
- Customer Display

## Repository map

- `Loyverse_Info/` — preserved research/reference material.
- `open_source/` — preserved historical architecture research. Decisions in these documents are **not binding** on the new Rifad implementation.
- `docs/` — current Rifad architecture, UI and donor policies.
- `apps/` — product applications.
- `core/` — Rifad-owned domain modules.
- `contracts/` — stable module boundaries.
- `adapters/` — replaceable implementations/integrations.
- `tests/` — cross-module acceptance and conformance suites.

See `PROJECT_RULES.md` before changing implementation code.