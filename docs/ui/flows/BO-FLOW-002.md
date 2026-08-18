# BO-FLOW-002 — Manage Catalog Items

Status: **implemented / product-discovery staging**

## Objective

Provide a real Back Office catalog-management workflow that discovers Rifad-owned durable product meanings before production database freeze.

The workflow remains structurally informed by the documented Loyverse Back Office catalog concepts, while the final interaction, styling, contracts and data ownership belong to Rifad.

## Entry point

Back Office → **الأصناف**.

Current active destinations inside this bounded catalog family:

- **قائمة الأصناف**;
- **الفئات**;
- **مجموعات الخيارات**;
- **الإضافات**.

Other Back Office families remain outside this flow.

## Executable scope

### Item list

- list current items;
- search by item name, SKU or barcode;
- filter by category;
- open the full item editor;
- show item visual identity/thumbnail;
- show availability, effective starting price, pricing mode and add-on group count.

### Item editor

- name;
- description;
- category;
- base SKU;
- base barcode;
- available-for-sale;
- fixed price or multiple-price mode;
- reusable option-group assignment;
- optional item-specific price overrides;
- optional item-only custom pricing choices;
- reusable general add-on assignment;
- item-private add-ons;
- POS visual representation by color/shape or image.

## Pricing and reusable option groups

The merchant-facing Back Office no longer exposes technical Cartesian variant construction as the primary product model.

The visible concept is **مجموعات الخيارات**.

Example:

`أحجام البيتزا → صغير 10 | وسط 20 | كبير 25`

A reusable option group is created once and can be assigned to many items. An item can then:

1. use one fixed base price;
2. enable **أسعار متعددة** and inherit all prices from one reusable option group;
3. use the reusable option group while overriding only the prices that differ for that item;
4. use item-only custom options/prices when the pricing choices should not be shared.

When **أسعار متعددة** is enabled, the fixed base-price input is disabled in the editor and direct option prices become the pricing authority.

The item still retains one stable product-family identity. Shared option-group identity and option-value identity are Rifad-owned durable meanings behind `CatalogAdminContract`.

Legacy `CatalogVariant*` structures remain temporarily available for staging snapshot migration only. They are not the merchant-facing target model and must not drive new Back Office UX.

## POS safety boundary for multiple prices

The current cashier POS does not yet have an approved option/size chooser.

Therefore `CatalogReadContract.listItems()` excludes option-priced items by default. Back Office explicitly opts in to them with `includeOptionPriced: true`.

This is intentional safety behavior: Rifad must not sell a multi-price item at a silent minimum/fallback price before the cashier selection flow is implemented and approved.

POS option/add-on selection and ticket-line snapshots remain a separate future product/UI slice.

## Categories

- list categories;
- create category;
- rename category;
- select an accent color;
- preserve category identity when renamed.

Delete/reorder remain non-goals for this slice.

## Catalog visual identity

The current flow includes merchant-managed visual identity as Rifad catalog data rather than component-only styling.

### Item representation

The item can use:

- **color/shape** representation; or
- **image** representation.

Current discovered item appearance meanings:

- accent color;
- shape: square / rounded square / circle;
- optional image representation.

The current browser UI accepts JPG/PNG/WebP and center-crops/resizes the staging image to 512×512 for a square POS-oriented preview.

`imageDataUrl` is staging transport only. Production media storage may use an asset/file/object reference behind an adapter without changing merchant semantics.

### Group colors

Current reusable visual accents include:

- category color;
- reusable option-group color;
- reusable add-on-group color.

These are small semantic scanning aids, not permission to use large decorative backgrounds throughout the Back Office.

See `docs/ui/VISUAL-DECISION-008-CATALOG-VISUAL-IDENTITY.md`.

## Add-ons

### General reusable add-ons

- list reusable add-on groups;
- create/edit a reusable group;
- choose a group accent color;
- add/remove named options;
- set an additional price per option;
- assign the same group to many items.

### Item-private add-ons

The item editor may also create one or more private add-on groups that belong only to that item. This covers genuine one-off product needs without polluting the reusable global add-on library.

General and private add-ons are intentionally separate from pricing option groups.

The current POS does not yet expose add-on selection/pricing. Required/optional rules, min/max selection, line snapshots, kitchen display and receipt presentation remain future POS/product work.

## Contract boundary

All mutations go through Rifad-owned `CatalogAdminContract`. Reads consumed by POS remain behind `CatalogReadContract`.

Current staging implementation is `BrowserCatalogAdapter` **schema v4**. Browser storage is not the product contract and is not a LAN/cloud synchronization claim.

Schema v4 includes migration support for earlier staging snapshots and the current catalog visual-identity meanings.

Future local/LAN/cloud/external catalog implementations must translate into these Rifad meanings without leaking provider schema or IDs into the UI.

## Non-goals

- cost;
- stock/inventory;
- low-stock thresholds;
- tax assignment;
- production media storage/synchronization;
- open price;
- weight/volume selling;
- composite items;
- branch/store overrides;
- item/category deletion;
- import/export;
- permissions;
- production POS option/add-on chooser;
- LAN sync;
- cloud sync;
- production database freeze.

## Visual reference boundary

The current Back Office hierarchy is owner-directed from supplied Loyverse runtime screenshots, but Rifad owns final styling and implementation.

Latest lessons are preserved in:

- `docs/ui/visual-decisions/VISUAL-DECISION-007-BACK-OFFICE-LOYVERSE-HIERARCHY.md`;
- `docs/research/loyverse/LOYVERSE_BACK_OFFICE_CURRENT_REFERENCE_2026-08-18.md`.

The latest runtime simplification pass intentionally favors flat white cards, thin separators, quiet Cairo typography, restrained shadows, one completion area and minimal decorative effects.

## Acceptance evidence

- Back Office TypeScript/tests/build pass.
- POS TypeScript/tests/build remain green after the shared catalog-contract extension.
- Tests prove fixed-price item create/edit.
- Tests prove reusable option-group creation and assignment.
- Tests prove inherited group prices and sparse per-item price overrides.
- Tests prove item-only custom multiple prices.
- Tests prove reusable general add-ons and item-private add-ons can coexist.
- Tests prove option-priced items remain hidden from the current cashier reader until the POS chooser is authorized.
- Tests prove category/group colors and item appearance survive adapter reconstruction.
- Existing staging snapshots migrate forward to catalog schema v4 without making browser storage authoritative production persistence.
