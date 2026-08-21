# Rifad Core and Capability Adoption Workflow

## Purpose

Rifad should not re-invent solved engineering problems.

The sourcing strategy has two valid levels:

1. **Primary Core selection** — adopt and control a mature engine that can carry a large share of Rifad when that is the strongest practical foundation.
2. **Capability grafting** — retain the selected core where it is strong, then reuse, port or reimplement stronger proven solutions for gaps such as LAN, tables, KDS, printing, sync, payments or other capabilities.

This is not a requirement to build every engine from zero, and it is not a requirement to wrap every internal component in adapters.

Rifad owns the product, customer experience, quality bar, sourcing decisions and Saudi-specific behavior. Implementation authorship may come from Rifad, a selected Primary Core, capability sources, or a combination.

Read this with:

- `docs/architecture/PRIMARY_CORE_AND_CAPABILITY_GRAFTING.md`
- `docs/architecture/RIFAD_BUILD_METHOD.md`
- `PROJECT_RULES.md`

## Core rule

> **Find the strongest practical foundation first. Keep what is mature. Replace or graft only what is weak. Build from zero only when the evidence says that is the better engineering choice.**

## Relationship to G0–G8

The owner-approved capability promotion gates remain binding.

G4/G5 have two sourcing modes:

### Mode A — Primary Core evaluation

Use when:

- no Primary Core has been explicitly selected yet;
- the existing foundation is still prototype/staging;
- the next work would commit Rifad to a large business-engine direction;
- evidence shows the current core may be a material architectural limitation.

### Mode B — Capability graft evaluation

Use after a Primary Core is selected when one bounded capability is missing, weak, risky or inferior to proven alternatives.

A map item being next does not waive sourcing/simulation when its implementation is substantial.

# Part I — Primary Core Selection

## 1. Define the Rifad workload

Do not begin with repository names. Begin with what the core must carry.

As applicable, define requirements for:

- money/rounding correctness;
- sales/orders;
- catalog/pricing/options;
- inventory;
- shifts/cash drawer/time clock;
- customers/credit/loyalty;
- payments/refunds;
- tax;
- restaurant/open-order/tables;
- persistence/restart/crash behavior;
- concurrency/multi-device operation;
- LAN;
- APIs/extensibility;
- database/migrations;
- offline operation;
- synchronization attachment;
- printing/hardware seams;
- permissions/security;
- multi-branch/tenant model;
- accounting where useful;
- ZATCA attachment feasibility;
- performance/volume;
- licensing/redistribution/modification rights.

The UI appearance of a core candidate is not a deciding factor. Rifad owns the customer-facing interface.

## 2. Search serious whole-core candidates

Search mature open-source POS, ERP, accounting and adjacent engines that can plausibly carry a large portion of the workload.

The candidate set may include:

- Odoo;
- ERPNext;
- mature open-source POS engines;
- the current Rifad implementation;
- other credible systems discovered during research.

Names are examples, not approved choices.

Compare multiple serious candidates. Do not select the first project with a broad feature list.

## 3. Execute and inspect

For each leading candidate:

- install/build/run the real project or the relevant engine path;
- inspect source, tests and failure paths;
- inspect actual data model and transaction boundaries;
- characterize money and rounding behavior;
- characterize restart/crash/offline behavior where supported;
- inspect extension/API mechanisms;
- inspect concurrency and multi-device assumptions;
- inspect schema/migration model;
- inspect maintenance/issues/dependency health;
- verify license and dependency obligations.

README claims are not evidence.

## 4. Run architecture simulation

Before adopting a core, simulate Rifad on top of it.

Record for each serious candidate:

- capabilities retained unchanged;
- capabilities requiring modification;
- capabilities requiring grafts/replacement;
- database fit;
- direct-modification versus facade/adapter strategy;
- LAN path;
- table/open-order path;
- offline/local persistence path;
- branch/device identity path;
- future sync path;
- ZATCA path;
- hardware/printing path;
- migration/evolution path;
- major operational/licensing risks;
- estimated Rifad-owned code after adoption;
- likely long-term maintenance burden.

Reject candidates that create obvious architectural dead ends even if their demo is attractive.

## 5. Choose the core disposition

The decision may be:

- `ADOPT-PRIMARY-CORE` — candidate becomes the main executable business foundation;
- `KEEP-CURRENT-CORE` — evidence supports the current Rifad foundation as the strongest path;
- `CONTINUE-RESEARCH` — no candidate has enough evidence yet;
- `REJECT` — candidate is inferior, unsafe, legally unsuitable or too expensive to adapt.

Primary Core adoption is stronger than ordinary donor reuse. Record the exact version/commit and the reasons it beats alternatives.

## 6. Integration style is evidence-driven

If a Primary Core is adopted, choose the simplest safe integration style:

- direct modification inside the controlled core;
- thin Rifad facade for UI/product isolation;
- adapter for replaceable/external capability;
- sidecar/service when a process boundary is genuinely useful.

Do not create abstraction layers merely to hide the fact that Rifad uses an adopted core.

# Part II — Capability Grafting

## 7. Define the bounded gap

Once the core exists, describe the specific weakness or missing capability and its invariants.

Examples:

- LAN discovery/pairing/reconnect;
- restaurant table lifecycle;
- KDS dispatch;
- ESC/POS printing;
- synchronization;
- payment provider state;
- fiscal/ZATCA behavior.

Keep the unit small enough to evaluate independently.

## 8. Search multiple proven implementations

Shortlist at least two credible implementations when the capability is substantial.

Search across languages and project types. A capability source does not need to use the same stack as the Primary Core.

Include:

- native capability in the selected core;
- current Rifad implementation where relevant;
- external open-source implementations;
- standards/protocol references where relevant.

## 9. Execute and characterize the slice

Inspect the real implementation, tests, issues and failure cases.

Extract useful evidence such as:

- state transitions;
- invariants;
- protocol behavior;
- retry/reconnect rules;
- stable identities;
- conflict handling;
- persistence assumptions;
- performance behavior;
- test vectors.

Compare the selected core's native behavior under the same important cases.

## 10. Verify legal fit

Check repository license, relevant file headers, dependency licenses and distribution obligations.

Public source is not automatically reusable source.

## 11. Choose one disposition per useful slice

- `DIRECT-REUSE` — use a compatible isolated implementation/library directly.
- `PORT-REIMPLEMENT` — reimplement proven algorithms/state machine/protocol/test vectors in the runtime that best fits Rifad/Primary Core.
- `BEHAVIORAL-REFERENCE` — independently implement proven behavior where code reuse is unsuitable.
- `KEEP-CORE` — selected Primary Core's native implementation wins the comparison.
- `KEEP-RIFAD` — an existing Rifad implementation wins the comparison.
- `EXTERNAL-SERVICE` — a sidecar/service is the stronger topology for the bounded capability.
- `REJECT` — candidate is inferior, coupled, unsafe, unmaintained or legally unsuitable.

Past effort is not a selection criterion.

## 12. Integrate in the simplest maintainable way

Integration does not always mean a new adapter.

Choose between:

- direct core modification;
- native core extension/plugin mechanism;
- thin facade;
- adapter;
- internal module;
- external process/service.

Use an adapter/facade when it creates real isolation or translation value. Avoid ceremonial layers.

The customer must experience one cohesive Rifad product regardless of where implementation ideas originated.

## 13. Prove Rifad behavior

Tests must prove the behavior Rifad depends on, not merely that source code compiles.

Applicable evidence may include:

- domain/invariant tests;
- integration tests;
- restart/offline/retry tests;
- ambiguous-result and duplicate-prevention tests;
- migration tests;
- concurrency/conflict tests;
- hardware tests;
- security/isolation tests;
- fiscal official-spec vectors.

For replaceable or externally integrated capabilities, keep conformance tests implementation-independent where practical.

## 14. Record provenance and the decision

For every adopted/ported/retained capability record:

- candidate/project;
- exact version/commit;
- paths/modules inspected;
- tests/failure cases inspected;
- license/dependency obligations;
- comparison candidates;
- chosen disposition;
- why it won;
- integration location;
- remaining limitations;
- evidence required before production.

When `KEEP-CORE` or `KEEP-RIFAD` wins, record the rejected alternatives too. This prevents sunk-cost memory from replacing evidence later.

# Risk lanes

| Lane | Examples | Additional evidence |
| --- | --- | --- |
| Low | formatting, barcode helpers | unit evidence + legal fit |
| Medium | printing, local persistence, LAN discovery | restart/reconnect/error/hardware matrix |
| High | sync, payments, migrations, multi-device state | idempotency, recovery, conflicts, security, destructive-failure tests |
| Regulated | ZATCA/fiscal | official-spec vectors, certificate/state/retry/audit evidence |

High risk means stronger proof, not automatic green-field implementation.

# Anti-patterns

- Build a mature capability from zero without first checking proven implementations.
- Reject a strong whole-core candidate because Rifad did not author it.
- Force every capability into a separate adapter even when direct modification is simpler and safer.
- Make an external project the Primary Core merely because it was examined first.
- Keep weak Rifad code only because replacing it feels wasteful.
- Replace a strong Primary Core because one bounded capability is weak; search for a graft first.
- Copy a donor schema/API blindly into Rifad product behavior.
- Patch unrelated applications together and expose that fragmentation to the customer.
- Trust README/demo claims without source/test/failure evidence.
- Track moving upstream code without pinning the version that was evaluated.

# Production rule

A selected core or graft is not production-proven merely because it runs.

Production status requires the applicable G7/G8 evidence from `docs/architecture/RIFAD_BUILD_METHOD.md`.
