# Rifad Product Target

Status: **OWNER-APPROVED PRODUCT DIRECTION**

## 1. Product objective

Rifad is a Saudi POS/business platform intended to be simple at the front, strong underneath, reliable offline where required, mathematically correct, extensible and affordable.

The customer should experience one coherent Rifad product regardless of whether the implementation underneath comes from a selected Primary Core, Rifad code, or capability grafts from other proven sources.

## 2. First horizon

The first product horizon is **100% functional/workflow parity with the adopted observable Loyverse baseline** before the baseline is declared complete.

The purpose is not to imitate proprietary internals. The purpose is to use a mature known product horizon so engineering decisions are made with the future visible now.

After parity, Rifad systematically differentiates with Saudi-market requirements, ZATCA, pricing/business choices and product improvements.

## 3. Product surfaces

The parity horizon must account for the adopted observable behavior of:

- POS / cashier operations;
- Back Office / owner-management operations;
- Dashboard;
- KDS;
- Customer Display;
- restaurant/local-service/table/open-order behavior;
- customers, loyalty and credit where applicable;
- catalog, pricing, options/modifiers/add-ons;
- payments, receipts, refunds and operational settlement concepts;
- shifts, cash drawer and employee/time-clock behavior;
- inventory and stock operations;
- taxes/discounts;
- permissions and manager control;
- device/store/branch behavior;
- offline/restart/recovery behavior that is observable or documented;
- reports/settings and other baseline management families.

## 4. Saudi additions and deliberate differences

Rifad may intentionally differ from the baseline for explicit reasons, including:

- ZATCA/Fatoora requirements;
- Saudi tax/fiscal rules;
- Mada/local payment and hardware realities;
- Saudi delivery/platform practices;
- Arabic-first/RTL experience;
- lower operating cost;
- stronger offline/reliability behavior;
- security/performance;
- an owner-approved UX improvement.

A deliberate omission from the adopted baseline must be recorded. Missing behavior must not disappear merely because a candidate Core lacks it.

## 5. UX ownership

Rifad owns its visual identity. Loyverse is the primary functional/workflow/ergonomic baseline, not the visual brand and not the code source.

The product owner is the authority on customer needs and visible workflow decisions.

## 6. Technical implementation freedom

The product target does not prescribe:

- programming language;
- framework;
- database;
- ERP/POS engine;
- adapter count;
- local/cloud topology;
- source project lineage.

Those are engineering decisions selected for stability, correctness, capability, maintainability, cost and future fit.

A mature open-source system may become the Primary Core. Its weak capabilities may be replaced or grafted from stronger sources.

## 7. Quality bar

A feature is not complete because its screen exists.

Applicable quality evidence includes:

- exact business calculations;
- transaction integrity;
- restart/offline durability;
- duplicate prevention;
- failure/recovery behavior;
- permissions/security;
- migration/data evolution;
- hardware behavior;
- performance/volume;
- fiscal/regulatory evidence.

The selected implementation must support the product horizon without creating obvious architectural dead ends.
