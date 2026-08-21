# Primary Core Selection Method

Status: **ACTIVE LAB METHOD**

## 1. Goal

Select the strongest practical Primary Core for Rifad by evidence, not by familiarity, feature-list size, sunk cost or architectural fashion.

The Core must be evaluated against the **full adopted Rifad/Loyverse-parity horizon**, not only the next feature.

## 2. Stage A — Workload definition

Before naming repositories, derive the workload from:

- `docs/product/RIFAD_PRODUCT_TARGET.md`;
- `docs/product/LOYVERSE_FUNCTIONAL_PARITY_TARGET.md`;
- imported Rifad product decisions;
- Saudi/ZATCA requirements.

The workload includes product capabilities and non-functional requirements such as exact money, transaction integrity, offline/restart, concurrency, LAN, extensibility, migrations, hardware and performance.

## 3. Stage B — Longlist

Search broadly across:

- open-source POS systems;
- ERP systems with strong POS/business engines;
- accounting/business engines;
- restaurant POS systems;
- adjacent engines that could plausibly carry a large share of Rifad.

Do not filter by frontend beauty or programming language.

For every candidate record:

- repository/project identity;
- license;
- maintenance/activity;
- stack;
- database;
- build/install path;
- broad capability coverage;
- obvious hard blockers.

## 4. Stage C — Hard-blocker prefilter

Reject or hold a candidate before expensive trial if evidence shows an unresolved hard blocker such as:

- license/distribution/modification incompatibility;
- project cannot be built or maintained realistically;
- money/transaction model is fundamentally unsafe for Rifad and impractical to repair;
- architecture makes required local/offline operation impractical;
- no plausible path to required extensibility/grafting;
- data model or operational topology creates an obvious future dead end;
- dependency/operational burden is disproportionate to value.

A hard blocker must be evidence-backed, not assumed.

## 5. Stage D — Source and test inspection

For serious survivors inspect:

- real business code;
- money representation/rounding;
- transaction boundaries and rollback;
- schema/migrations;
- inventory movement logic;
- order/payment/refund state;
- shift/cash behavior;
- restaurant/open-order/table state;
- offline/restart mechanisms;
- concurrency/multi-device assumptions;
- API/plugin/extension seams;
- tests and failure cases;
- open issues and maintenance history;
- dependency/license obligations.

README/demo claims are discovery hints, not proof.

## 6. Stage E — Runtime execution

Build/run leading candidates where practical.

Prefer tests that expose real engine behavior rather than UI impressions.

Exercise at least the high-value paths the candidate claims to support, including representative failures/restart where practical.

Record exact candidate version/commit and environment.

## 7. Stage F — Rifad architecture simulation

Use `CANDIDATE_SIMULATION_TEMPLATE.md`.

For every major capability classify:

- `KEEP` — native core capability is strong enough;
- `MODIFY` — native capability is usable but requires controlled changes;
- `REPLACE` — native capability should not be product authority;
- `GRAFT` — keep the core but source a stronger implementation elsewhere;
- `N/A` — genuinely outside the Rifad horizon.

Simulation must explain how the candidate would support:

- full Loyverse parity target;
- LAN;
- restaurant/tables/KDS;
- local/offline operation;
- API/extensibility;
- DB/schema evolution;
- branch/device identity;
- sync;
- printing/hardware;
- payments;
- ZATCA;
- performance and maintenance.

The goal is to expose dead ends before adoption.

## 8. Stage G — Score

Score serious candidates using `CORE_SCORECARD.md`.

Scores organize evidence; they do not override a hard blocker.

Do not manufacture precision where evidence is missing. Mark unknowns and lower confidence.

## 9. Stage H — Deep trial

Only the strongest survivors receive expensive deep trials.

Deep trials should target the highest-risk unknowns, not repeat easy happy paths.

Examples:

- crash/restart transaction survival;
- offline-day behavior;
- concurrent order changes;
- table/open-order locking;
- money/tax edge cases;
- migration evolution;
- extension/graft proof;
- realistic volume;
- Windows/local packaging path;
- branch/sync attachment proof.

## 10. Stage I — Decision

Possible outcomes:

- `ADOPT-PRIMARY-CORE`;
- `KEEP-CURRENT-CORE`;
- `CONTINUE-RESEARCH`;
- `REJECT`.

The selected core decision must include:

- exact source/version;
- why it beats alternatives;
- major retained capabilities;
- required modifications;
- planned grafts;
- database implications;
- offline/LAN/sync/ZATCA path;
- licensing/maintenance obligations;
- known risks;
- evidence still required before production.

## 11. After Core selection

Do not re-litigate the whole Core for every missing feature.

For a bounded weakness, use Capability Grafting:

1. define the gap;
2. search multiple mature implementations;
3. inspect source/tests/failures/licenses;
4. compare against the core's native behavior;
5. choose reuse/port/reimplementation/reference/service/keep-core;
6. prove the Rifad behavior.

A later whole-core replacement review is justified only by material evidence that the selected foundation is a serious limitation or a clearly superior alternative exists.
