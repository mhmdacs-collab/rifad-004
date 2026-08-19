# Rifad

Rifad is an independent Saudi POS product. This repository is the implementation foundation for Rifad itself — not a fork product, not an Odoo skin, and not a FloCafe continuation.

## Product direction

- **Functional/workflow reference:** Loyverse behavior, screen inventory and interaction patterns, independently implemented.
- **Visual authority:** Rifad's design system. Other visual references require an explicit, narrow approval and may not silently change workflows.
- **Desktop:** application experience for Windows.
- **Tablet/mobile:** installable PWA-class path that must feel like an application, not a generic website.
- **Architecture:** modular puzzle architecture. Each business capability is isolated behind a Rifad-owned contract/adapter.
- **Local operation:** local-first/offline-capable POS operation is a first-class requirement.
- **Cloud:** synchronization and multi-branch services are Rifad-owned concerns behind replaceable boundaries.
- **Saudi fiscal:** ZATCA is a core product domain, not an optional plugin.

## Golden rule

> Rifad owns the product, contracts, data model, release process, UI and roadmap. External projects are donors only.

A donor implementation may be written in any language. Rifad may directly reuse a small permissively licensed slice where appropriate, or extract behavior, algorithms, state machines and tests and reimplement them behind a Rifad contract. No donor project becomes the architecture owner.

Rifad composes donor capabilities **inside Rifad**, never by turning one donor into the base and merging other donors into it. Managed infrastructure is allowed where operationally useful, but infrastructure/provider schemas do not become Rifad product contracts or business truth.

See [Capability Adoption Workflow](docs/adoption/CAPABILITY_ADOPTION_WORKFLOW.md) and the [Printing Capability Example](docs/adoption/PRINTING_CAPABILITY_EXAMPLE.md).

## Product roles

- **Cashier / branch worker:** uses POS for local operational work and must be able to continue designated offline-capable workflows without a live cloud connection.
- **Owner / management:** uses Back Office to administer merchant configuration and observe business results. Owner-managed settings may be projected locally to POS without giving the cashier an equivalent administration screen.

## Build discipline

1. Map researched behavior into stable screen/action/state/flow IDs in the UI Execution Manifest.
2. Mark a bounded screen or vertical flow `ready`; new implementation outside ready scope is forbidden.
3. Build user-facing surfaces through Rifad-owned contracts and mock/staging adapters where production implementations are not ready.
4. Discover and trace durable product meanings before final database freeze.
5. For substantial capabilities, research multiple credible implementations and inspect real source/tests/failure behavior/licensing.
6. Reuse/port/reimplement the smallest proven slice behind a replaceable Rifad adapter.
7. Validate with contract, conformance, offline, migration, visual and hardware tests as applicable.
8. Replace a module without changing unrelated product surfaces whenever its Rifad contract remains compatible.

## Current execution roadmap

The single dependency-ordered roadmap is:

- [`docs/RIFAD_FINAL_IMPLEMENTATION_MAP.md`](docs/RIFAD_FINAL_IMPLEMENTATION_MAP.md)
- [`docs/MAP_00_REALITY_AUTHORITY_RECONCILIATION.md`](docs/MAP_00_REALITY_AUTHORITY_RECONCILIATION.md)

Current order is:

`reality reconciliation → effective POS configuration/authorization → shift/cash/time clock → complete sold-line truth → open-order/payment/receipt/refund lifecycle → production local persistence → Windows/tablet/device proof → synchronization re-entry → real Back Office ↔ POS integration`.

Existing synchronization candidate evidence is preserved, but no synchronization provider is production-selected and additional adoption/debugging is paused until the real operational POS/local-persistence gates are complete enough to carry actual Rifad facts.

## Current product surfaces

- **POS:** substantial executable cashier application including device/PIN entry, touch/Quick Sale, sale-page editing, cash checkout, mock card UX, customer/credit/loyalty behavior, receipt history/reprint and restaurant local-service proof. Important remaining operational gaps are tracked in the Final Implementation Map.
- **Back Office:** locked visual shell plus executable catalog-management family for items, categories, reusable pricing option groups, add-ons and current catalog visual identity. Other management families remain mapped.
- **Dashboard:** mapped/researched.
- **KDS:** mapped/researched; current kitchen behavior in POS is mock state only.
- **Customer Display:** mapped/researched.

## Repository map

- `docs/` — current Rifad architecture, execution roadmap, product plan, adoption workflow and donor policies.
- `docs/research/loyverse/` — preserved Loyverse product/UI research used as functional evidence.
- `docs/research/sync/` — preserved synchronization research/execution evidence; not current production selection.
- `docs/research/historical-proposals/` — preserved earlier architecture proposals; not binding.
- `apps/` — product applications.
- `core/` — Rifad-owned domain modules.
- `contracts/` — stable module boundaries.
- `adapters/` — replaceable implementations/integrations.
- `tests/` — cross-module acceptance and conformance suites.

Read `PROJECT_RULES.md` before changing implementation code. For current continuation, then read `docs/architecture/CURRENT_DECISIONS.md`, `docs/RIFAD_FINAL_IMPLEMENTATION_MAP.md`, `docs/MAP_00_REALITY_AUTHORITY_RECONCILIATION.md` and `docs/CURRENT_WORK_HANDOFF_2026-08-18.md`.
