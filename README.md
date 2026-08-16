# Rifad

Rifad is an independent Saudi POS product. This repository is the new implementation foundation for Rifad itself — not a fork product, not an Odoo skin, and not a FloCafe continuation.

## Product direction

- **Functional/workflow reference:** Loyverse behavior, screen inventory and interaction patterns, independently implemented.
- **Visual authority:** Rifad's design system. Other visual references require an explicit, narrow approval and may not silently change workflows.
- **Desktop:** application experience for Windows.
- **Tablet/mobile:** installable PWA that must feel like an application, not a website.
- **Architecture:** modular puzzle architecture. Each business capability is isolated behind a Rifad-owned contract/adapter.
- **Local operation:** local-first/offline-capable operation is a first-class requirement.
- **Cloud:** synchronization and multi-branch services are Rifad-owned concerns.
- **Saudi fiscal:** ZATCA is a core product domain, not an optional plugin.

## Golden rule

> Rifad owns the product, contracts, data model, release process, UI and roadmap. External projects are donors only.

A donor implementation may be written in any language. We may reuse permissively licensed code where appropriate, or extract its behavior, algorithms, state machine and tests and reimplement them behind a Rifad contract. No donor project becomes the architecture owner.

Rifad composes donor capabilities **inside Rifad**, never by turning one donor into the base and merging other donors into it. If donor A has proven A4/80 mm printing and donor B has proven 58 mm layout logic, both slices enter through Rifad contracts/adapters. Donor A does not become the product shell.

See [Capability Adoption Workflow](docs/adoption/CAPABILITY_ADOPTION_WORKFLOW.md) and the [Printing Capability Example](docs/adoption/PRINTING_CAPABILITY_EXAMPLE.md).

## Build order

1. Map researched behavior into stable screen/action/state/flow IDs in the UI Execution Manifest.
2. Mark a bounded screen or vertical flow `ready`; implementation outside ready scope is forbidden.
3. Complete the authorized Rifad application surfaces interactively using mock adapters.
4. Freeze Rifad contracts for the actions proven by those surfaces.
5. For each capability, research multiple donor implementations and select the simplest proven logic.
6. Port/reimplement the selected logic behind its adapter.
7. Validate with contract, conformance, offline, visual and hardware tests.
8. Replace a module without changing the rest of the product whenever its contract remains stable.

## Product surfaces

- POS
- Back Office
- Dashboard
- KDS
- Customer Display

## Repository map

- `docs/` — current Rifad architecture, product plan, adoption workflow and donor policies.
- `docs/research/loyverse/` — preserved Loyverse product/technical research used as reference evidence.
- `docs/research/historical-proposals/` — preserved earlier donor/architecture proposals. These documents are **not binding**.
- `apps/` — product applications.
- `core/` — Rifad-owned domain modules.
- `contracts/` — stable module boundaries.
- `adapters/` — replaceable implementations/integrations.
- `tests/` — cross-module acceptance and conformance suites.

See `PROJECT_RULES.md` before changing implementation code.

## Current repository state

The repository now includes the binding [UI Execution Manifest](docs/ui/UI_EXECUTION_MANIFEST.json), [manifest gate/schema](docs/ui/UI_EXECUTION_MANIFEST_SCHEMA.md), [visual authority](docs/ui/DESIGN_AUTHORITY.md) and the first authorized vertical slice, [POS-FLOW-001](docs/ui/flows/POS-FLOW-001.md). Code must stay inside that ready scope until the manifest is expanded.
