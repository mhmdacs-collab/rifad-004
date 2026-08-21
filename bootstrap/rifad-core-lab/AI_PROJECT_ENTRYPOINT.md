# Rifad Core Lab — AI Project Entrypoint

Status: **CANONICAL SESSION ENTRYPOINT**

Last updated: 2026-08-21

> **Mandatory:** Every fresh ChatGPT, Codex, AI-agent or human technical session must read this file completely before architecture, implementation, Core selection, capability research, refactors or repository writes.
>
> Do not ask the product owner to repeat project history that can be recovered from this file and its linked authority documents.

---

## 1. What Rifad is

Rifad is a Saudi POS/business product. The customer-facing product, workflows, UI/UX direction, Saudi requirements and commercial priorities are owned by Rifad.

Implementation authorship is not the product identity. Rifad does not require every engine or capability to be written from zero.

The engineering goal is the strongest practical product: stable, fast, mathematically correct, capable, maintainable, extensible and affordable.

---

## 2. Responsibility split

### Product owner

The product owner defines:

- what customers need;
- which features exist;
- cashier/owner workflows;
- the Rifad UI/UX direction;
- Saudi-market priorities;
- product behavior decisions.

The product owner is **not** expected to choose frameworks, databases, engines, protocols, adapters or implementation sources merely because several technical options exist.

### AI / technical lead

The technical role must:

- search for the strongest mature engines and implementations before inventing substantial code;
- inspect real source, tests, failures, databases, maintenance and licenses;
- execute/build serious candidates where practical;
- simulate each candidate against the future product horizon before adoption;
- select the strongest Primary Core on evidence;
- find stronger capability implementations for gaps in the selected core;
- decide whether to retain, modify, reuse, port, reimplement, graft, isolate or reject technical implementations;
- identify dead ends before the project commits months of work.

Do not push pure implementation-selection responsibility back to the product owner.

---

## 3. Product north star — 100% Loyverse parity first

The approved first product horizon is **100% functional/workflow parity with the adopted observable Loyverse baseline before the baseline is declared complete and Rifad systematically moves beyond it**.

This is a product-planning rule, not a source-code copying rule.

It means:

- do not intentionally stop at 70% or 80% of the adopted baseline and call the foundation complete;
- evaluate Core candidates against the product we know Rifad will need, not only the next feature;
- track unsupported baseline behavior explicitly rather than letting it disappear because a chosen Core lacks it;
- include adopted observable behavior across POS, Back Office, Dashboard, KDS and Customer Display;
- include relevant restaurant/table/open-order, permissions, errors, offline and recovery workflows;
- any deliberate baseline omission requires an explicit product-owner decision;
- Rifad may add Saudi requirements, ZATCA and owner-approved improvements where required;
- Rifad owns its visual identity and implementation;
- do not infer proprietary Loyverse internals that are not observable or documented.

Canonical detail: `docs/product/LOYVERSE_FUNCTIONAL_PARITY_TARGET.md`.

---

## 4. Primary Core strategy

No Primary Core is selected yet.

Before building a substantial business engine from zero:

1. Search mature whole-core candidates capable of carrying a large share of Rifad.
2. Inspect and execute serious candidates.
3. Simulate each candidate against the full Rifad/Loyverse-parity horizon.
4. Record what can be kept, modified, replaced or grafted.
5. Compare long-term reliability, correctness, adaptation cost, licensing and maintenance.
6. Select only after evidence.

A candidate may be an ERP, POS, accounting engine, current Rifad implementation or another system. Names such as Odoo or ERPNext are candidates, not predetermined choices.

After a Primary Core is selected, weaknesses can be filled by proven capability sources. Example: keep a strong Core but port/reimplement LAN discovery/pairing/reconnect from another mature POS instead of replacing the entire core or inventing LAN from zero.

Canonical strategy: `docs/architecture/PRIMARY_CORE_AND_CAPABILITY_GRAFTING.md`.

---

## 5. Adapters are tools, not doctrine

A contract/facade/adapter is used only when it provides concrete value such as provider isolation, protocol translation, UI insulation, conformance testing or replacement risk reduction.

If Rifad controls and modifies a selected Primary Core directly, direct core modification is valid when it is the simpler and safer implementation.

Do not create a second shadow business engine or ceremonial adapter layers merely to claim architectural purity.

---

## 6. Capability maturity gates

Substantial work follows G0–G8:

- G0 — Authority & Scope
- G1 — Product Discovery
- G2 — Boundary Draft
- G3 — Mock Ceiling
- G4 — Frontier/Core/Source Search + Simulation
- G5 — Selection Decision
- G6 — Integration + Boundary Refinement
- G7 — Conformance / Failure Evidence
- G8 — Production Evidence

A working UI, broad feature list, clean restart or green tests do not automatically mean production-ready.

Canonical method: `docs/architecture/RIFAD_BUILD_METHOD.md`.

---

## 7. Current strategic task

The current task is:

> **Primary Core Candidate Discovery & Architecture Simulation against the full Rifad/Loyverse-parity horizon.**

Current sequence:

1. Build a serious longlist.
2. Apply hard blockers: licensing/control, maintenance, buildability, obvious architecture dead ends.
3. Inspect source/tests/database/transaction model of the strongest candidates.
4. Build/run leading candidates where practical.
5. Simulate Rifad on each candidate.
6. Score candidates using `docs/core-selection/CORE_SCORECARD.md`.
7. Deep-test only the strongest survivors.
8. Record `KEEP / MODIFY / REPLACE / GRAFT` per major capability.
9. Make no Primary Core adoption decision until evidence is sufficient.

Simulation must include at least:

- coverage toward full adopted Loyverse parity;
- money precision and rounding;
- transaction integrity;
- sales/orders;
- pricing/options/modifiers;
- inventory;
- shifts/cash drawer/time clock;
- payments/refunds;
- taxes;
- customers/credit/loyalty;
- restaurant/tables/open orders;
- KDS/CDS implications;
- local persistence/restart/crash;
- concurrency/multi-device;
- LAN;
- API/extensibility;
- database/schema evolution;
- offline behavior;
- branch/device identity;
- future sync;
- printing/hardware;
- permissions/security;
- multi-branch/tenant implications;
- accounting where useful;
- ZATCA feasibility;
- performance/volume;
- maintenance/tests/failure evidence;
- licensing/modification/redistribution rights.

Do not select the first candidate that runs.

---

## 8. Historical repository role

Historical source: `mhmdacs-collab/rifad-004`.

Use it as evidence for:

- Loyverse research;
- product/UX decisions;
- Front Office behavior;
- restaurant/table SENT/PENDING invariants;
- customer/credit/debt behavior;
- delivery/payment decisions;
- authorization/configuration discoveries;
- offline/idempotency test vectors;
- sync candidate research;
- useful implementation code that wins evidence-based comparison.

Do **not** require the selected Primary Core to reproduce accidental staging architecture from `rifad-004`.

The import rules are in `docs/REFERENCE_IMPORT_MANIFEST.md`.

---

## 9. Authority order

Unless a newer explicit product-owner decision overrides it:

1. explicit current product-owner decision;
2. this `AI_PROJECT_ENTRYPOINT.md`;
3. `PROJECT_RULES.md`;
4. `docs/product/RIFAD_PRODUCT_TARGET.md`;
5. `docs/product/LOYVERSE_FUNCTIONAL_PARITY_TARGET.md`;
6. `docs/architecture/PRIMARY_CORE_AND_CAPABILITY_GRAFTING.md`;
7. `docs/architecture/RIFAD_BUILD_METHOD.md`;
8. current Core-selection evidence/decision records;
9. imported research and historical material as evidence only.

Surface conflicts; do not silently change a higher-authority rule for local convenience.

---

## 10. Mandatory fresh-session protocol

A fresh session must:

1. read this file;
2. read `PROJECT_RULES.md`;
3. read the product target and Loyverse parity target;
4. read the Primary Core/Grafting strategy;
5. read the Build Method;
6. inspect only the current task evidence needed for the requested work;
7. verify live repository state before writes;
8. recover project context from repository authority instead of asking the owner to retell it.

Before substantive work, the session should be able to summarize:

- the product north star;
- owner vs technical responsibility;
- Primary Core + grafting strategy;
- current strategic task;
- current evidence state;
- any genuine blocker.

---

## 11. Continuity rule

Update this file in the same change whenever any of these materially changes:

- Primary Core selection/rejection;
- current strategic task;
- product parity target;
- owner/technical responsibility split;
- sourcing philosophy;
- authority order;
- the active lab/production repository role.

Do not update it for trivial implementation details.

Goal:

> **A new conversation must never require Mohammed to explain Rifad from the beginning again.**
