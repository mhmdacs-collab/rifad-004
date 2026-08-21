# Rifad Primary Core and Capability Grafting Strategy

Status: **OWNER-APPROVED ARCHITECTURE SOURCING RULE**

Date: 2026-08-21

## 1. Owner intent

Rifad product ownership is separate from implementation authorship.

The product owner defines what customers need, the user-facing workflows, the Rifad experience and the business priorities. The implementation strategy must optimize for stability, correctness, capability, maintainability, cost and speed of delivery rather than for the percentage of code written from zero by Rifad.

Rifad therefore does **not** require its business engine to be green-field Rifad code.

A mature open-source POS, ERP, accounting engine or other system may become the **Primary Core** of Rifad when evidence shows that adopting and controlling it is the best practical path.

The selection is evidence-driven. Odoo, ERPNext, another POS, the current Rifad code or another implementation may win; none receives preference by name or by sunk cost.

## 2. Primary sourcing rule

Before building a substantial engine from zero, answer two questions in this order:

1. **Is there a mature primary engine that can carry a large share of Rifad safely?**
2. **For each weakness or missing capability, is there a stronger proven implementation elsewhere that can be grafted, ported or reimplemented?**

The preferred result may therefore be:

```text
Rifad Product / UX
        │
        ▼
Selected Primary Core
        │
        ├── capability retained from core
        ├── LAN graft from proven source B
        ├── Tables/Restaurant graft from proven source C
        ├── Printing graft from proven source D
        ├── Sync graft from proven source E
        └── ZATCA / Saudi-specific Rifad work
```

The final runtime must be cohesive. The source diversity belongs to engineering provenance, not to the customer's product experience.

## 3. Primary Core evaluation

A Primary Core candidate is evaluated as a system, not only as a list of screens.

The evaluation must simulate how it would serve current and expected Rifad needs, including as applicable:

- exact money and rounding behavior;
- transaction integrity and rollback behavior;
- sale/order lifecycle;
- products, pricing and modifiers/options;
- inventory and stock movements;
- shifts and cash drawer ledger;
- payments and refunds;
- taxes;
- customers, credit and loyalty;
- restaurant/open-order/table lifecycle;
- local persistence and crash/restart behavior;
- concurrency and multi-device behavior;
- LAN suitability;
- API/extensibility surface;
- database model and migration path;
- offline behavior;
- synchronization suitability;
- printing and hardware integration seams;
- security and permissions;
- multi-branch/tenant implications;
- accounting capability where useful;
- ZATCA integration feasibility;
- performance and realistic data volume;
- tests, failure-path coverage and project maintenance;
- licensing, redistribution and modification rights;
- the cost of adapting it versus replacing missing slices.

A visually weak project may still be an excellent Primary Core. Rifad owns the customer-facing UX.

## 4. Simulation before adoption

Do not choose a core because its feature list looks broad.

Before adoption, perform an architecture simulation against Rifad's expected topology.

For each serious candidate, record at minimum:

- what capabilities can be retained as-is;
- what requires modification;
- what must be replaced or grafted;
- whether the database can support Rifad's durable truth;
- whether a stable API or internal extension seam exists;
- whether direct modification is safer than wrapping;
- how LAN would work;
- how table/open-order state would work;
- how offline local operation would work;
- how branch/device identity would work;
- how future cloud synchronization would attach;
- how ZATCA would attach;
- whether future schema evolution is practical;
- which dependencies become operational or licensing risks;
- the expected amount of code Rifad would need to own after adoption.

The simulation must expose architectural dead ends before implementation effort is committed.

## 5. Capability grafting

A selected Primary Core does not need to be best at everything.

When the core is weak or missing a capability:

1. define the missing behavior and invariants;
2. search for mature implementations that solved that bounded problem;
3. inspect source, tests, failures and licenses;
4. compare the current core implementation and the external candidates;
5. choose the best engineering disposition;
6. integrate the result in the way that best fits the Primary Core and Rifad runtime.

A graft may be:

- direct permissive reuse;
- a port/reimplementation in the Primary Core's language/runtime;
- a clean reimplementation of proven behavior and test vectors;
- an external process/service when that is genuinely the stronger topology;
- a retained native capability from the Primary Core.

Example:

A Primary Core may have excellent sales, inventory and tables but weak LAN. Rifad may characterize a second open-source POS with mature LAN discovery/pairing/reconnect/sequence behavior, then port or reimplement that LAN design for the selected Primary Core rather than replacing the entire core or inventing LAN from zero.

The same approach applies to tables, KDS, printing, offline persistence, synchronization, payment integration and other capabilities.

## 6. Adapters are a tool, not a doctrine

Rifad does not require an adapter between every internal component.

Use a contract, facade or adapter when it provides concrete value, such as:

- insulating the Rifad UI from a replaceable engine;
- isolating an external provider or SDK;
- translating LAN/Sync/Hardware/ZATCA protocols;
- preventing provider-specific IDs or errors from spreading through the product;
- enabling conformance tests across multiple implementations;
- reducing the cost of replacing a risky dependency.

Do **not** introduce adapter layers merely to satisfy an architectural pattern when Rifad directly owns and modifies the selected Primary Core and the extra layer provides no meaningful isolation or replacement benefit.

A thin facade may be sufficient. In other cases direct core modification is acceptable.

The architecture must optimize for product reliability and maintainability, not maximum indirection.

## 7. What Rifad must still own

Even when a full external engine becomes the Primary Core, Rifad still owns:

- product behavior and customer experience;
- branding and UI;
- Saudi-specific product decisions;
- acceptance and regression evidence;
- the selected source/version and modification policy;
- release and rollback decisions;
- Rifad-specific extensions and grafts;
- ZATCA/fiscal integration responsibility;
- supported hardware/integration matrix;
- production quality standards.

Rifad does not need to invent a second shadow business engine merely to claim ownership.

## 8. Core selection is reversible but expensive

A Primary Core is allowed to become the main executable base after passing its adoption gate. This is intentionally stronger than an ordinary donor slice decision.

Because replacing a Primary Core later can be expensive, the selection gate must be stronger than a small-slice adoption gate.

The decision record must include:

- candidate comparison;
- simulation results;
- licensing review;
- benchmark/test evidence;
- major modifications expected;
- gaps and planned grafts;
- database and migration implications;
- offline/LAN/sync/ZATCA implications;
- reasons the selected core beats the alternatives and current Rifad engine path.

No project becomes the Primary Core merely because it was examined first or already has some Rifad modifications.

## 9. Relationship to Capability Gates

`docs/architecture/RIFAD_BUILD_METHOD.md` remains the maturity/promotion process.

This document changes the sourcing interpretation of G4/G5:

- G4 must consider both **whole-core candidates** and **bounded capability implementations** when the decision could materially affect the system foundation;
- G5 may select a Primary Core, retain the current core, or select per-capability grafts;
- after Primary Core selection, future G4 searches focus on gaps/weaknesses rather than re-litigating the whole core for every feature;
- a later core replacement review is triggered only by evidence of a material architectural limitation or a clearly superior alternative.

The Mock Ceiling remains binding. It prevents Rifad from accidentally growing a prototype into an unresearched production engine.

## 10. Decision principle

The governing question is not:

> "Did Rifad write this code?"

It is:

> **"Is this the strongest practical implementation we can legally control, test, maintain and evolve for Rifad?"**

Build from zero only when existing mature implementations cannot satisfy the requirement safely or when an independent Rifad implementation is demonstrably the better engineering choice.
