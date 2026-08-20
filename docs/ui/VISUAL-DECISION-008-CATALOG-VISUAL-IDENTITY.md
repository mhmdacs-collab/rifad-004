# VISUAL-DECISION-008 — Catalog Visual Identity

Status: **APPROVED FOR CURRENT UI DISCOVERY SLICE**  
Date: 2026-08-18

## Decision

Rifad catalog administration must not reduce products and reusable groups to text-only rows.

The current Back Office catalog slice owns merchant-configurable visual identity through Rifad contracts:

- item representation mode: **color/shape** or **image**;
- item accent color;
- item shape: square, rounded square, or circle;
- optional item image with a square POS-oriented preview;
- category accent color;
- reusable pricing-option-group accent color;
- reusable add-on-group accent color.

These meanings are durable product semantics discovered through `BO-FLOW-002`. They are not component-local CSS state.

## Reference behavior

The owner requested the calm, visually scannable management feel demonstrated in the supplied Loyverse Back Office references. Rifad may learn from that hierarchy and capability while retaining independent implementation, contracts, names, data model, adapters, and visual identity.

The current Rifad treatment uses:

- Cairo-first Arabic typography;
- Rifad green as the application identity rather than donor colors;
- a restrained reusable palette for catalog accents;
- line icons and compact visual badges;
- product thumbnails/initial tiles in the item list;
- live item representation preview in the item editor.

## Image boundary

`CatalogItemAppearance.imageDataUrl` is **staging transport only** for the browser discovery adapter.

The durable product meaning is “this item has an image representation”. Production storage may replace the staging Data URL with a media/asset reference, local file identity, object-storage key, or another adapter-owned transport without changing the merchant-facing catalog contract semantics.

Therefore:

- do not freeze Data URLs into production SQL design;
- do not make a cloud media service mandatory for local sale;
- LAN/branch/cloud synchronization must transport or resolve the image through its own adapter boundary;
- ERP/external catalog adapters translate their media identity to/from Rifad visual identity;
- completed sale/accounting truth must never depend on image availability.

## Current image preparation

For the browser staging UI, an uploaded JPG/PNG/WebP is center-cropped to a square and resized to 512×512 before being stored in the staging catalog snapshot. This is a UI discovery convenience, not a production media-processing commitment.

## Scope boundary

Implemented in this decision:

- visual identity editing and preview in Back Office;
- item/category/option-group/add-on-group colors as Rifad catalog data;
- browser-adapter schema migration to catalog snapshot v4;
- restart/adapter-recreation persistence coverage for visual identity.

Not proven by this decision:

- production media store;
- LAN/cloud image synchronization;
- image CDN/optimization pipeline;
- external ERP media mapping;
- final cashier-side image rendering policy on every POS mode/device;
- cost, stock, tax, composite-item, supplier, or store-override workflows.

Those capabilities remain separate product/architecture work and must not be inferred from this visual slice.
