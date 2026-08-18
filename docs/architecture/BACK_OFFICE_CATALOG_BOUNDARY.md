# Back Office Catalog Boundary

Last updated: 2026-08-18

## Purpose

Rifad is intentionally completing product/UI meaning before production database freeze. Back Office is the management surface used to discover how durable catalog facts are created, edited and consumed by POS.

The executable discovery slice is `BO-FLOW-002`.

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

The public meaning belongs to Rifad contracts. Transport and persistence are replaceable. A donor, ERP, local service or cloud catalog may sit behind an adapter, but its schema, IDs and SDK types stop at that adapter.

## Current executable product model

`BO-FLOW-002` now covers a practical catalog-management workspace rather than a static item proof.

### Item list and editor

Current executable behavior includes:

- item list;
- search by item/variant name, SKU or barcode;
- filter by category;
- add and edit item;
- name and description;
- category selection;
- fixed base price represented in exact halalas;
- base SKU and barcode;
- available-for-sale state;
- full-page editor with explicit save/cancel actions.

Turning `availableForSale` off keeps the item manageable in Back Office while excluding it from the current sellable POS catalog.

New POS ticket lines resolve the current catalog name and base price when the item is added. Completed receipt snapshots remain historical sale evidence and must not be silently rewritten by later catalog edits.

### Categories

Back Office can currently:

- list categories;
- create a category;
- rename a category;
- use stable category identity while propagating the renamed display name to current catalog items.

Delete/reorder/color/layout behavior is not frozen yet.

### Variants

Variants are Rifad catalog facts, not a Back Office-only presentation trick.

The current staging model supports:

- up to three option dimensions such as **الحجم** or **اللون**;
- named values under each option;
- generated Cartesian combinations;
- a maximum of 200 generated combinations in the current discovery rule;
- stable variant identity;
- variant-specific selling price;
- variant-specific SKU;
- variant-specific barcode;
- uniqueness checks across base items and variants.

The base item remains the product family identity. A generated variant is one sellable choice under that item rather than a separate unrelated item.

The current POS does **not** yet expose the variant chooser. Back Office variant administration is therefore CURRENT-MOCK product-field evidence, while cashier variant-selection behavior remains a separate POS UI gap that must be authorized before implementation.

### Modifiers / add-ons

Modifiers are intentionally separate from variants.

A modifier group is a reusable catalog entity with:

- stable group identity;
- group name;
- one or more modifier options;
- stable option identity;
- modifier option name;
- additional price in exact halalas.

Back Office can create/edit modifier groups and assign one or more groups to an item. A group can be reused by multiple items.

The current POS does **not** yet apply or price modifiers during a sale. Back Office modifier administration therefore discovers and persists the catalog meaning only; cashier modifier selection, minimum/maximum selection rules, kitchen presentation and receipt snapshots remain future product/UI work.

## Deliberate non-goals

This slice still does not freeze or implement:

- category delete/reorder/color semantics;
- variant inventory or per-store variant overrides;
- modifier minimum/maximum/required-selection policies;
- POS variant/modifier chooser behavior;
- open price;
- weight/volume selling;
- cost;
- inventory/stock;
- low-stock thresholds;
- taxes;
- composite items;
- images/shape/color administration;
- branch/store-specific price or availability;
- delete item;
- import/export;
- permissions;
- LAN synchronization;
- cloud synchronization;
- production database schema.

Those capabilities must expose their UI/product meaning before their durable model is frozen.

## Current staging transport

`BrowserCatalogAdapter` schema version 2 is current executable staging evidence. It provides one Rifad catalog semantics implementation for tests and same-origin/local evaluation and migrates the previous staging item-only shape forward.

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

This rule is especially important for variants and modifiers: the UI has now proven that option dimensions, option values, generated variants, modifier groups and modifier options are distinct meanings. Their eventual normalized storage design remains unfrozen.

`docs/ui/POS_UI_NAMING_AND_FIELD_REGISTER.md` is updated with every newly exposed durable catalog field.

## Synchronization direction

The current slice proves shared identity and behavior, not network synchronization.

When Sync is authorized later:

- stable item/category/variant/modifier identities are preserved;
- updates are versioned/replay-safe;
- branch/store overrides are modeled explicitly rather than overwriting global product facts;
- POS does not read Back Office private tables;
- Back Office does not write POS private tables;
- conflict policy is domain-specific;
- transport failure must not corrupt the local sellable catalog.

LAN and cloud Sync remain separate Rifad capabilities under the existing architecture decisions.

## Production freeze gate

Do not select/freeze the production catalog database schema merely because `BO-FLOW-002` is executable.

Before freeze, continue product/UI discovery for the remaining catalog extensions, POS variant/modifier behavior, restaurant/place administration, branch/store configuration, delivery/channel pricing and other approved Back Office domains that materially change product data shape.
