# Rifad Current Work Handoff — 2026-08-18

Status: **CONTINUATION CHECKPOINT — READ FIRST IN A NEW CHAT/CODEX SESSION**

This file captures the current Rifad state after the POS visual/product work, restaurant-service prototype, adapter/persistence foundations, and the first Back Office catalog-management slice.

It exists so a future ChatGPT/Codex session can continue without relying on prior chat history.

---

# 0. Repository / workflow checkpoint

Repository:

- `mhmdacs-collab/rifad-004`

Active branch:

- `agent/pos-visual-pass-01`

Pull request:

- PR #2
- must remain **Draft**;
- must remain **unmerged** until explicit owner approval.

Before any future write:

1. fetch PR #2 and the actual branch head;
2. do not assume the SHA in this handoff is still current;
3. inspect the latest CI/checks;
4. edit the active branch directly;
5. run/check Manifest + Back Office + POS verification after final changes;
6. avoid empty/no-op documentation commits.

Latest implementation direction at the time of this handoff includes the final-loaded Back Office visual simplification layer `loyverse-reference-pass.css`, plus the visual catalog identity work (item image/color/shape and group colors).

---

# 1. Authority and product posture

Read in this order when resuming:

1. `PROJECT_RULES.md`;
2. `docs/architecture/CURRENT_DECISIONS.md`;
3. `docs/architecture/RIFAD_ARCHITECTURE.md`;
4. `docs/ui/UI_EXECUTION_MANIFEST.json`;
5. `docs/ui/DESIGN_AUTHORITY.md`;
6. `docs/ui/POS_UI_NAMING_AND_FIELD_REGISTER.md`;
7. this handoff and current flow/visual-decision files;
8. research as evidence only.

Current strategic posture:

- **UI/Product Completeness + Durable Field Discovery comes before production database freeze.**
- Adapter/persistence/outbox work already completed remains foundation, not permission to rush production DB/LAN/cloud/fiscal implementation.
- Back Office is now the primary surface for discovering merchant-owned master data/configuration.
- Loyverse is the primary functional/interaction baseline, but Rifad independently owns final product meaning, contracts, data, code and branding.

Do not change Rifad's domain/schema simply to match Odoo, Loyverse or another donor/external system.

---

# 2. Core architecture already established

## 2.1 Rifad-owned adapter model

The rule is:

`Rifad UI / domain -> Rifad-owned contract -> adapter -> external/local implementation`

External schemas, IDs, SDK types, error types, credentials and lifecycle rules stop at the adapter boundary.

### General POS runtime

`PosRuntimeContract` is dependency-injected from the composition root.

`usePosFlow` must not construct the mock/donor runtime internally.

Replacement runtimes should pass reusable conformance probes.

See:

- `docs/architecture/POS_RUNTIME_ADAPTER_BOUNDARY.md`

### Restaurant/local service

Restaurant/place logic sits behind a Rifad-owned service contract.

Current generic model:

`PlaceGroup -> ServicePlace -> OpenLocalOrder`

Do not let an external table/floor/session schema leak into Rifad.

Potential external translations:

- floor/zone/section -> `PlaceGroup`;
- table/room/booth -> `ServicePlace`;
- table session/check/ticket -> Rifad open local order representation behind the adapter.

See:

- `docs/architecture/RESTAURANT_SERVICE_ADAPTER_BOUNDARY.md`

## 2.2 Local-first persistence foundation

`LocalPersistenceContract` V1 exists as a Rifad-owned boundary.

Current architectural meanings include:

- stable installation identity;
- branch/device binding context;
- versioned module-private snapshots;
- revision metadata;
- transactional outbox semantics;
- stable event identity/deduplication;
- retry/failure bookkeeping;
- explicit acknowledgement.

Current browser storage is **staging**, not production DB selection.

The production local engine is intentionally not frozen yet.

See:

- `docs/architecture/LOCAL_PERSISTENCE_AND_OUTBOX_BOUNDARY.md`

## 2.3 LAN, branch/cloud sync and Fatoora/ZATCA remain separate capabilities

Do not merge these concerns:

`Local Persistence != LAN != Branch/Cloud Sync != Fiscal/ZATCA`

Intended future separation:

- local persistence owns offline local truth;
- LAN handles branch-local device coordination such as KDS/CDS/printers/multi-device branch behavior where appropriate;
- branch/cloud sync propagates authoritative facts between branch/cloud nodes and resolves sync conflicts;
- Fatoora/ZATCA is a fiscal adapter/state machine consuming final local fiscal facts with stable identity/retry/audit behavior.

A failed external/fiscal retry must never create a second sale.

---

# 3. POS product state

Current POS is a working UI/product prototype with significant interaction polish.

Implemented/validated areas include:

- Arabic RTL sales screen;
- Cairo-based POS typography treatment;
- touch product grid and Quick Sale/search-first mode;
- sale-page tabs/layout editing;
- cart/ticket quantity editing with internal keypad;
- clear-cart action in basket body;
- checkout inline in the transaction rail;
- cash payment with quick amounts, keypad, change and `سداد`;
- mock `شبكة / مدى` path;
- print-receipt preference and success flow;
- customer selection/creation;
- customer debt/credit flow and debt ledger UI;
- stable two-slot transaction action geometry;
- restaurant local-service prototype;
- reusable Rifad catalog reader boundary shared with Back Office.

Important non-claims:

- mock card flow is not real terminal integration;
- current customer tax field is not proof of ZATCA validation;
- current restaurant send/kitchen revision is not real KDS/printer transport;
- current delivery/channel integration is not implemented;
- current browser persistence is not production storage.

---

# 4. Restaurant/local service state

Two independent product settings exist conceptually:

1. restaurant-service classification enabled/disabled;
2. advanced place management enabled/disabled.

## Retail/direct mode

Restaurant service OFF:

- no permanent local/takeaway question;
- normal sale -> Pay.

## Simple restaurant mode

Restaurant service ON, place management OFF:

- `محلي | دفع`;
- direct `دفع` is operationally takeaway;
- `محلي` is dine-in/local without required table assignment.

## Advanced restaurant mode

Restaurant service ON, place management ON:

- `محلي` opens group/place selection;
- default proof configuration is exactly one group `الطاولات`;
- default places are `طاولة 1` through `طاولة 6`;
- no default rooms/sessions groups;
- free place label: `متاحة`;
- occupied/open place label: `محجوزة`;
- open-order context still uses `طلبات مفتوحة`;
- reopening a place restores the open order;
- `إرسال` updates the mock kitchen revision and clears the working cart again;
- successful payment releases the place.

Back Office will later own persistent groups/places/settings.

Future heavy restaurant features are intentionally not added yet just because another system supports them. Examples:

- transfer table;
- merge tables;
- split bill;
- reservation;
- guest count;
- waiter assignment;
- floor-map coordinates.

Evaluate actual product need and external candidates first.

---

# 5. Delivery/channel product model already decided

Durable concepts must remain separate:

## Fulfillment

- takeaway;
- dine-in/local;
- delivery.

## Sales channel

Examples:

- direct POS;
- Keeta;
- HungerStation;
- Jahez;
- Ninja;
- future direct/aggregator channels.

## Collection/payment/settlement

Examples:

- cash in store;
- Mada in store;
- prepaid by platform;
- cash on delivery;
- card on delivery;
- platform receivable/settlement.

Important accounting/product rule:

A platform-prepaid order is one sale. Later bank settlement is settlement of a receivable, not a second sale. Platform commission/fees are separate from the customer-facing sale price.

Preferred future cashier experience:

- one `طلبات أونلاين` queue;
- direct and aggregator adapters behind one Rifad capability model;
- API-originated orders arrive already carrying channel/fulfillment/prices/payment state;
- cashier does not re-enter/reselect the platform.

Delivery remains research/product design until separately authorized.

---

# 6. Back Office — current priority

The Back Office was started intentionally before production DB freeze so Rifad can discover how merchant master data is actually created and maintained.

Current executable catalog destinations:

- `قائمة الأصناف`;
- `الفئات`;
- `مجموعات الخيارات`;
- `الإضافات`.

Other navigation areas may be visible as future placeholders but are not implemented claims.

The shared catalog boundary is Rifad-owned; current browser transport is staging only.

See:

- `docs/architecture/BACK_OFFICE_CATALOG_BOUNDARY.md`;
- `docs/ui/flows/BO-FLOW-002.md`.

---

# 7. Current catalog/item model

## 7.1 Item basics currently discovered

Current item editor/list work covers:

- name;
- description;
- category;
- fixed base price;
- SKU;
- barcode;
- available-for-sale state;
- visual representation;
- pricing policy;
- reusable/general add-on assignments;
- item-private add-ons.

Do not interpret this as frozen SQL.

## 7.2 Merchant pricing model — Rifad-native

The owner rejected forcing repeated technical variant construction for common restaurant cases.

Merchant-facing concept is **مجموعات الخيارات**.

Example reusable group:

`أحجام البيتزا -> صغير 10 | وسط 20 | كبير 25`

One group can serve 100–200+ items.

An item supports:

1. fixed price;
2. reusable option group with inherited prices;
3. reusable option group with sparse item-specific price overrides;
4. item-private direct option prices.

UI rule:

- default: one base price;
- enable **أسعار متعددة**;
- base-price input becomes non-authoritative/disabled;
- choose `مجموعة جاهزة` or `خيارات خاصة بهذا الصنف`;
- if using shared group, optionally `تخصيص الأسعار لهذا الصنف`;
- sparse override means only exceptional values are stored as item-specific price differences; the rest continue to inherit the shared group.

This is D-031.

## 7.3 Add-ons

Rifad currently distinguishes:

- **الإضافات العامة** — reusable group assignable to many items;
- **إضافات خاصة بهذا الصنف** — private group only for one item.

Current POS does not yet have the approved add-on chooser/rules.

## 7.4 POS safety for option-priced items

Until cashier option selection is implemented, option-priced items are hidden from the default POS catalog reader.

Never sell a multi-price item silently at a preview/minimum/fallback price.

---

# 8. Catalog visual identity now discovered

Current Rifad catalog contract includes merchant-controlled visual identity:

## Item

- visual mode: color/shape or image;
- accent color;
- shape: square / rounded square / circle;
- optional image.

Current browser discovery UI:

- accepts JPG/PNG/WebP;
- center-crops/resizes to a square 512x512 staging image;
- stores staging image data in the browser adapter snapshot.

Important boundary:

- `imageDataUrl` is not production media design;
- production may use asset ID, local file, object key, media service, etc.;
- image availability never owns sale/accounting truth.

## Category

- name + accent color.

## Reusable option group

- name + accent color + values/prices.

## Reusable add-on group

- name + accent color + options/prices.

The browser catalog snapshot is currently schema v4 with migration support.

See:

- `docs/ui/VISUAL-DECISION-008-CATALOG-VISUAL-IDENTITY.md`.

---

# 9. Back Office visual direction — critical continuation notes

## 9.1 Owner reference

The owner supplied multiple Loyverse Back Office screenshots and explicitly wants Rifad to be very close in **clarity, calmness, typography, spacing and interaction hierarchy**.

Do not misread this as “copy the green”.

The desired feeling is:

- immediately obvious task;
- quiet white cards;
- light gray workspace;
- thin separators;
- minimal shadows;
- restrained typography;
- stable right-side navigation;
- compact administrative density;
- simple line icons;
- very little decorative styling;
- one clear completion area;
- enough whitespace for reading, not decorative emptiness.

The owner's earlier evaluation of the Rifad Back Office was around 60–70% depending on the pass. **Current visual acceptance is still pending.**

## 9.2 What went wrong in previous Rifad passes

Avoid repeating these mistakes:

- giant headings;
- giant empty margins around a narrow form;
- nested card/panel/card structures;
- gradients to simulate modernity;
- heavy shadows;
- oversized product preview;
- too many bold labels;
- repeated Save/Cancel at both top and bottom;
- visual CSS changing layout geometry;
- adding complexity just to make the UI look “creative”.

An earlier `backoffice-2026.css` change broke shell geometry by moving fixed regions into normal flow. `backoffice-layout-safety.css` was added specifically to prevent polish from moving the topbar/sidebar/workspace.

## 9.3 Latest simplification pass

Latest runtime direction adds `loyverse-reference-pass.css` **last** in `apps/backoffice/src/main.tsx`.

Its purpose is to reduce over-design:

- flatten surfaces;
- remove gradients/heavy shadows;
- simplify top bar and sidebar;
- reduce nested-card feel;
- make item editor sections calmer;
- compact the item visual/appearance section;
- visually keep one Save/Cancel completion area;
- make pricing/add-on rows feel like direct admin rows rather than dashboard widgets.

This latest pass is not yet owner-accepted; it needs direct runtime screenshot review.

## 9.4 Typography

Cairo-first remains the target Arabic typography direction.

Do not introduce a mandatory remote font dependency that breaks offline/local use.

Evaluate at the owner's normal 1920x1080 screen distance, not only at browser zoom/screenshot magnification.

---

# 10. Loyverse reference knowledge preserved

Read:

- `docs/research/loyverse/LOYVERSE_BACK_OFFICE_CURRENT_REFERENCE_2026-08-18.md`

That document preserves:

- official Loyverse pages reviewed;
- observed item/category/image/modifier/variant/store/inventory/composite/import-export capabilities;
- owner's screenshot-derived visual lessons;
- the distinction between Loyverse facts and Rifad-native product decisions;
- current Rifad gaps discovered from comparison.

Older larger Loyverse research remains under `docs/research/loyverse/`.

---

# 11. Current known Back Office gaps / next likely product slices

Do not implement all of these at once. Continue section by section with owner review.

Known gaps include:

- final visual acceptance of item list/editor/categories/options/add-ons;
- delete/reorder lifecycle and permissions;
- cost;
- inventory/stock tracking;
- low-stock configuration;
- stock quantity/adjustment flows;
- taxes;
- sold by weight/volume;
- composite item / recipe / BOM behavior;
- branch/store-specific availability and pricing;
- import/export;
- cashier option chooser;
- cashier add-on chooser/rules;
- sold-line option/add-on snapshots;
- reporting for option/add-on selection;
- production media storage/sync;
- Back Office restaurant groups/places/settings;
- delivery channels and channel pricing management;
- employee/permission management;
- final production database model.

Recommended immediate continuation:

1. visually evaluate the latest simplified item editor/list on 1920x1080;
2. refine until owner accepts the catalog Back Office visual language;
3. finish current catalog surfaces before opening a large new domain;
4. then choose the next bounded Back Office slice (likely inventory/cost or branch/store catalog behavior based on owner priority);
5. continue field discovery in the canonical field register;
6. only after major product surfaces are known, perform production domain/data-model freeze;
7. then deepen Local DB -> LAN -> branch/cloud sync -> fiscal/external adapters.

---

# 12. Do-not-claim list

A future assistant/Codex must not claim the following as production-ready unless new evidence exists:

- real Mada/card terminal integration;
- production ZATCA/Fatoora integration;
- LAN synchronization;
- branch/cloud synchronization;
- production local database selection;
- real KDS/printer dispatch;
- real restaurant multi-device table locking;
- real delivery-platform connectors;
- production accounting integration;
- production media storage/synchronization;
- final Back Office visual acceptance;
- final database schema.

---

# 13. Communication/workflow preferences relevant to continuation

When working in this repository:

- edit the branch directly rather than dumping code snippets into chat;
- keep explanations concise and product-focused;
- after visible UI changes, request runtime screenshots for owner visual review;
- do not merge PR #2 without explicit approval;
- prefer complete vertical behavior over decorative screen museums;
- do not let infrastructure outrun product-field discovery;
- do not let a donor/external adapter own Rifad's domain.
