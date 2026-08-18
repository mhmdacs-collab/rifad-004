# Back Office Catalog Boundary

Last updated: 2026-08-18

## Purpose

Rifad is intentionally returning to UI/product completeness before production database freeze. Back Office is the first management surface used to discover how durable product data is created, edited and consumed by POS.

The first executable slice is `BO-FLOW-002`.

## Architecture rule

Back Office and POS do not exchange data by importing each other's application state or private storage schema.

The intended direction is:

```text
Back Office UI
      │
      ▼
CatalogAdminContract
      │
      ▼
Rifad catalog implementation / adapter
      │
      ├──────────► CatalogReadContract ──────────► POS catalog adapter
      │
      └──────────► future versioned catalog facts / sync publication
```

The public meaning belongs to Rifad contracts. Transport and persistence are replaceable.

## Current bounded product model

`BO-FLOW-002` currently allows only:

- item list;
- search by name, SKU or barcode;
- filter by an existing category;
- add item;
- edit item;
- name;
- description;
- existing category selection;
- fixed base price represented in halalas;
- SKU;
- barcode;
- available-for-sale state.

Turning `availableForSale` off keeps the item manageable in Back Office while excluding it from the current sellable POS catalog.

New POS ticket lines resolve the current catalog name and base price when the item is added. Completed receipt snapshots remain historical sale evidence and must not be silently rewritten by later catalog edits.

## Deliberate non-goals

This slice does not freeze or implement:

- category CRUD;
- variants;
- modifiers;
- open price;
- weight/volume selling;
- cost;
- inventory/stock;
- low-stock thresholds;
- taxes;
- composite items;
- images/shape/color administration;
- branch/store-specific price or availability;
- delete;
- import/export;
- permissions;
- LAN synchronization;
- cloud synchronization;
- production database schema.

Those capabilities must expose their UI/product meaning before their durable model is frozen.

## Current staging transport

`BrowserCatalogAdapter` is current executable staging evidence. It provides one Rifad catalog semantics implementation for tests and same-origin/local evaluation.

It is **not** a claim that separately hosted Back Office and POS browser origins already synchronize with each other. Browser local storage is origin-scoped.

Future transports may include:

- a shared local Windows host/service;
- a Rifad local database adapter;
- LAN propagation inside a branch;
- cloud Sync between branches;
- another proven implementation behind the same Rifad contract.

None of those transport choices may force the Back Office or POS UI to adopt provider-specific schemas or IDs.

## Field-discovery rule

Visible durable meaning is discovered from the product surface before SQL design.

A UI control does not automatically mean one database column. Derived state should stay derived when appropriate, while facts that must survive restart/reporting/synchronization receive explicit Rifad-owned model meaning.

`docs/ui/POS_UI_NAMING_AND_FIELD_REGISTER.md` is updated with every newly exposed durable catalog field.

## Synchronization direction

The current slice proves shared identity and behavior, not network synchronization.

When Sync is authorized later:

- stable item identity is preserved;
- updates are versioned/replay-safe;
- branch/store overrides are modeled explicitly rather than overwriting global product facts;
- POS does not read Back Office private tables;
- Back Office does not write POS private tables;
- conflict policy is domain-specific;
- transport failure must not corrupt the local sellable catalog.

LAN and cloud Sync remain separate Rifad capabilities under the existing architecture decisions.

## Production freeze gate

Do not select/freeze the production catalog database schema merely because `BO-FLOW-002` is executable.

Before freeze, continue product/UI discovery for at least the relevant catalog extensions, restaurant/place administration, branch/store configuration, delivery/channel pricing and other approved Back Office domains that materially change product data shape.
