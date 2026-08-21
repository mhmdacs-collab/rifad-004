# Loyverse Functional Parity Target

Status: **OWNER-APPROVED FIRST-HORIZON PRODUCT TARGET**

## 1. Definition

For Rifad, “100% Loyverse parity” means:

> **100% coverage of the adopted observable/documented Loyverse functional and workflow baseline before Rifad declares that baseline complete.**

This is not a requirement to copy proprietary source code, reproduce unknown internals, or use the same technologies. Rifad independently implements or adopts the behavior using the strongest practical technical foundation.

## 2. Why this target exists

The target prevents short-horizon engineering.

If engineering only optimizes for the next screen, later capabilities repeatedly force changes to the Core, data model, offline architecture, LAN, permissions or transaction model.

Using the complete known baseline as the near-future horizon lets Core selection and capability grafting ask:

- Will this engine carry the future product we already know is coming?
- Where will it fail?
- Which capabilities will need grafting?
- Which architectural choices would create expensive dead ends?

## 3. Included product families

The parity inventory must cover the adopted observable behavior across at least:

### POS

- sign-in/device/employee entry behavior;
- sales workspace;
- item/category/search behavior;
- item variants/options/modifiers/add-ons where applicable;
- quantity/edit/remove behavior;
- customers/loyalty;
- taxes/discounts;
- open tickets/orders;
- restaurant/table/local-service workflows;
- kitchen dispatch-related cashier behavior;
- payment methods and split/partial behavior where present;
- receipts/history/reprint/refund behavior;
- shifts/cash drawer/time clock;
- settings available to POS roles;
- permissions/manager restrictions;
- offline/reconnect/restart-visible behavior.

### Back Office

- catalog/items/categories;
- modifiers/options/pricing structures;
- inventory/stock families;
- employees/access rights;
- stores/POS devices;
- payment types;
- taxes/discounts;
- customers/loyalty;
- restaurant configuration where applicable;
- reports/analytics;
- settings and operational configuration.

### Dashboard

All adopted observable dashboard views, summaries, navigation and state/error behavior.

### KDS

All adopted observable kitchen display flows, order lifecycle states, updates, completion behavior, reconnect/error behavior and configuration that belongs to the baseline.

### Customer Display

All adopted observable CDS pairing/display/order/total/payment-facing behavior and recovery/error states.

## 4. What parity tracks

Parity is not a checkbox that says “screen exists”.

For each baseline capability track as applicable:

- screen/flow;
- actions;
- states;
- errors/messages;
- permissions;
- durable business meanings;
- offline behavior;
- restart/recovery behavior;
- multi-device implications;
- hardware implications;
- relevant owner/cashier split;
- acceptance evidence.

A candidate Core that lacks a baseline feature does not remove the requirement. The gap becomes `MODIFY`, `REPLACE` or `GRAFT` in simulation.

## 5. Deliberate differences

A baseline behavior may differ only when there is an explicit Rifad reason, for example:

- Saudi regulation or ZATCA;
- local payment/hardware reality;
- Saudi delivery/platform behavior;
- Arabic-first/RTL requirement;
- security/reliability/performance improvement;
- lower operating cost;
- explicit owner-approved UX improvement.

Record the difference and reason. Do not silently omit a baseline flow.

## 6. Visual identity

Functional parity does not mean visual copying.

Rifad owns:

- branding;
- colors;
- typography;
- visual identity;
- product-specific UI refinements.

Loyverse remains the primary functional/workflow/ergonomic baseline.

## 7. Internal technology

Do not infer or claim unknown proprietary Loyverse internals.

Core/database/API/LAN/sync implementation choices are based on Rifad engineering evidence and open/controllable implementations.

Phase-2/Phase-3 historical Loyverse technical research may be used as research hypotheses/evidence only, never as proof of proprietary internals unless supported by public documentation or observable facts.

## 8. Parity completion rule

The baseline may be declared complete only when:

1. the adopted baseline inventory is explicit;
2. every item is either implemented/proven or has an explicit owner-approved deviation/omission;
3. critical flows have acceptance evidence;
4. no unsupported baseline family is hidden by the current Core choice;
5. Saudi-required differences are recorded;
6. the product owner accepts the baseline as complete.

Until then, parity remains open work.

## 9. Source evidence

The historical `rifad-004` Loyverse research is imported as product evidence according to `docs/REFERENCE_IMPORT_MANIFEST.md`.

Observable/current behavior should be refreshed against reliable public/current evidence when a parity decision depends on potentially changed Loyverse behavior.
