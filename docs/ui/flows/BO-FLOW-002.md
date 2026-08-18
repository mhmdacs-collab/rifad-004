# BO-FLOW-002 — Manage Catalog Items

Status: **implemented / product-discovery staging**

## Objective

Provide a real Back Office catalog-management workflow that discovers Rifad-owned durable product meanings before production database freeze.

The workflow is structurally informed by the documented Loyverse Back Office catalog concepts, but the final interaction, styling, contracts and data ownership belong to Rifad.

## Entry point

Back Office → **الأصناف**.

Current active destinations inside this bounded catalog family:

- **قائمة الأصناف**;
- **الفئات**;
- **الإضافات**.

Other Back Office families remain outside this flow.

## Executable scope

### Item list

- list current items;
- search by item/variant name, SKU or barcode;
- filter by category;
- open full item editor;
- show available-for-sale, variant count and modifier-group count.

### Item editor

- name;
- description;
- category;
- exact base selling price;
- base SKU;
- base barcode;
- available-for-sale;
- variant administration;
- modifier-group assignment.

### Variants

- create up to three option dimensions;
- add/remove named values;
- generate combinations;
- cap the current discovery rule at 200 combinations;
- edit per-variant selling price, SKU and barcode;
- preserve stable variant IDs when a combination remains unchanged;
- reject duplicate SKU/barcode across item and variant identities.

The current POS does not yet expose a variant chooser. This flow discovers Back Office/catalog meaning only.

### Categories

- list categories;
- create category;
- rename category;
- preserve category identity when renamed.

Delete/reorder/color are non-goals for this slice.

### Modifiers / add-ons

- list reusable modifier groups;
- create/edit a modifier group;
- add/remove named modifier options;
- set an additional price per modifier option;
- assign reusable groups to items.

The current POS does not yet expose modifier selection/pricing. Required/optional rules, min/max selection and kitchen/receipt presentation remain future POS/product work.

## Contract boundary

All mutations go through Rifad-owned `CatalogAdminContract`. Reads consumed by POS remain behind `CatalogReadContract`.

Current staging implementation is `BrowserCatalogAdapter` schema v2. Browser storage is not the product contract and is not a LAN/cloud synchronization claim.

Future local/LAN/cloud/external catalog implementations must translate into these Rifad meanings without leaking provider schema or IDs into the UI.

## Non-goals

- cost;
- stock/inventory;
- low-stock thresholds;
- tax assignment;
- product image/POS appearance;
- open price;
- weight/volume selling;
- composite items;
- branch/store overrides;
- item/category deletion;
- import/export;
- permissions;
- production POS variant/modifier chooser;
- LAN sync;
- cloud sync;
- production database freeze.

## Acceptance evidence

- Back Office TypeScript/tests/build pass.
- POS TypeScript/tests/build remain green after the shared catalog contract extension.
- Tests prove item create/edit, generated variants, modifier-group creation/assignment and category create/rename.
- Existing item-only staging snapshots migrate to the v2 catalog shape without making browser storage authoritative production persistence.
