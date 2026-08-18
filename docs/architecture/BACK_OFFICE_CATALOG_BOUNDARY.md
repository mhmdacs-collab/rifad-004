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

`BO-FLOW-002` covers a practical catalog-management workspace rather than a static item proof.

### Item list and editor

Current executable behavior includes:

- item list;
- search by item name, SKU or barcode;
- filter by category;
- add and edit item;
- name and description;
- category selection;
- base SKU and barcode;
- available-for-sale state;
- fixed or multiple-price mode;
- reusable pricing-option groups;
- sparse per-item overrides of a shared group's prices;
- item-only pricing choices;
- reusable general add-ons;
- item-private add-ons;
- item visual representation by color/shape or image;
- category, reusable option-group and reusable add-on-group accent colors;
- explicit save/cancel completion.

Turning `availableForSale` off keeps the item manageable in Back Office while excluding it from the current sellable POS catalog.

Completed receipt snapshots remain historical sale evidence and must not be silently rewritten by later catalog edits.

### Categories

Back Office can currently:

- list categories;
- create a category;
- rename a category;
- select an accent color;
- use stable category identity while propagating the renamed display name to current catalog items.

Delete/reorder are not frozen yet.

## Reusable option groups and multiple prices

Rifad's merchant-facing model intentionally avoids requiring the owner to rebuild the same technical variant matrix on every product.

A reusable **option group** is an independently managed catalog entity. Example:

`أحجام البيتزا → صغير 10 | وسط 20 | كبير 25`

Its current discovered meanings are:

- stable option-group identity;
- group name;
- group accent color;
- stable option-value identity;
- option-value name;
- default exact price for that option value.

An item pricing policy is one of:

1. **fixed** — one direct price;
2. **option-group / inherit** — use all current prices from one reusable group;
3. **option-group / custom** — use the same group identity but override only the item prices that differ;
4. **custom-options** — item-private pricing choices when they should not be globally reusable.

Sparse override semantics are deliberate. If an item customizes only `صغير`, the other group values continue inheriting the group's current prices rather than copying all prices into the item.

The Back Office control **أسعار متعددة** disables the fixed-price field and makes option pricing the price authority for that item.

The current staging item keeps a convenience `price` equal to the minimum resolved effective option price for list/report preview. That convenience value is not permission for the cashier to sell without selecting the actual option.

### Legacy variant compatibility

Historical `CatalogVariant*` / generated-combination structures remain only for migration compatibility with previous staging snapshots.

They are not the target merchant-facing product model and new Back Office UI must not reintroduce Cartesian combination building merely because the compatibility types still exist.

If later product discovery proves a genuine multi-dimensional sellable identity need—such as independently scannable size + color combinations—it must be introduced deliberately as its own reviewed capability rather than leaking back from the old prototype.

## POS safety boundary

The current POS does **not** yet expose the approved option/size chooser.

`CatalogReadContract.listItems()` therefore excludes option-priced items by default. Back Office administration opts in with `includeOptionPriced: true`.

This prevents an item whose actual price depends on size/choice from being sold at a silent minimum/fallback price.

Before option-priced items become cashier-sellable, POS must explicitly discover and snapshot:

- selected option/group/value;
- resolved exact sold price;
- selected add-ons and their exact sold prices;
- ticket-line display text;
- kitchen/receipt presentation where applicable.

## Add-ons

Add-ons are intentionally separate from pricing option groups.

### General reusable add-ons

A reusable add-on group has:

- stable group identity;
- group name;
- group accent color;
- one or more stable add-on option identities;
- option name;
- additional exact price.

The same group may be assigned to many items.

### Item-private add-ons

An item may also carry private add-on groups that belong only to that item. This supports genuine one-off choices without creating dozens of globally reusable groups that are meaningful to only one product.

The current POS does **not** yet apply or price add-ons during a sale. Required/optional rules, minimum/maximum selection, ticket-line snapshots, kitchen presentation and receipt presentation remain future product/UI work.

## Catalog visual identity boundary

Visual catalog identity is now part of the current discovery slice.

### Item appearance

Current Rifad catalog meaning includes:

- representation mode: color/shape or image;
- item accent color;
- item shape: square / rounded square / circle;
- optional image representation.

The current browser discovery adapter stores a square staging image using `imageDataUrl`. This is not production media architecture.

Production may replace staging transport with:

- local asset/file identity;
- content-addressed media;
- object-storage key;
- external/ERP media reference;
- another adapter-owned media mechanism.

The merchant-facing meaning should remain stable while media transport changes behind the adapter.

Sale/accounting truth must not depend on image availability.

### Group accent colors

Current catalog semantics include accent colors for:

- category;
- reusable option group;
- reusable add-on group.

These are intended as small scanning/identity aids, not broad decorative theming of transaction truth.

See `docs/ui/VISUAL-DECISION-008-CATALOG-VISUAL-IDENTITY.md`.

## Deliberate non-goals

This slice still does not freeze or implement:

- category delete/reorder;
- option-level inventory or per-store option overrides;
- add-on minimum/maximum/required-selection policies;
- POS option/add-on chooser behavior;
- open price;
- weight/volume selling;
- cost;
- inventory/stock;
- low-stock thresholds;
- taxes;
- composite items;
- production media storage/synchronization;
- branch/store-specific price or availability;
- delete item;
- import/export;
- permissions;
- LAN synchronization;
- cloud synchronization;
- production database schema.

Those capabilities must expose their UI/product meaning before their durable model is frozen.

## Current staging transport

`BrowserCatalogAdapter` **schema version 4** is current executable staging evidence. It provides one Rifad catalog-semantics implementation for tests and local evaluation and migrates previous staging shapes forward.

Schema v4 includes the current catalog visual-identity meanings as well as the reusable pricing/add-on structures.

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

The current UI now distinguishes:

- fixed versus multiple-price policy;
- reusable option groups;
- option-group accent color;
- option values and default prices;
- per-item sparse price overrides;
- item-private pricing choices;
- reusable general add-ons;
- reusable add-on accent color;
- item-private add-ons;
- category accent color;
- item appearance mode/color/shape/image semantics.

Their eventual normalized storage design remains unfrozen.

`docs/ui/POS_UI_NAMING_AND_FIELD_REGISTER.md` remains the canonical durable-field traceability register and must reflect these meanings before production data-model freeze.

## Synchronization direction

The current slice proves shared identity and behavior, not network synchronization.

When Sync is authorized later:

- stable item/category/option-group/option-value/add-on identities are preserved;
- reusable group edits propagate through versioned/replay-safe catalog facts;
- item-specific overrides remain explicit rather than copying full groups;
- branch/store overrides are modeled explicitly rather than overwriting global product facts;
- visual identity/media references propagate through adapter-owned sync semantics rather than UI storage hacks;
- POS does not read Back Office private tables;
- Back Office does not write POS private tables;
- conflict policy is domain-specific;
- transport failure must not corrupt the local sellable catalog.

LAN and cloud Sync remain separate Rifad capabilities under the existing architecture decisions.

## Visual/product reference

Current detailed Loyverse comparison and the owner's runtime visual lessons are preserved in:

- `docs/research/loyverse/LOYVERSE_BACK_OFFICE_CURRENT_REFERENCE_2026-08-18.md`;
- `docs/ui/visual-decisions/VISUAL-DECISION-007-BACK-OFFICE-LOYVERSE-HIERARCHY.md`.

Rifad intentionally adopts the useful hierarchy/reuse ideas without allowing Loyverse's schema or terminology to become Rifad's architecture.

## Production freeze gate

Do not select/freeze the production catalog database schema merely because `BO-FLOW-002` is executable.

Before freeze, continue product/UI discovery for the remaining catalog extensions, POS option/add-on behavior, restaurant/place administration, branch/store configuration, delivery/channel pricing and other approved Back Office domains that materially change product data shape.
