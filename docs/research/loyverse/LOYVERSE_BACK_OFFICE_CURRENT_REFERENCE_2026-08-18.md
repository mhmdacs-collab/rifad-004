# Loyverse Back Office — Current Rifad Reference Notes

Date: 2026-08-18  
Status: **REFERENCE / EVIDENCE — NOT RIFAD IMPLEMENTATION AUTHORITY BY ITSELF**

## Why this document exists

This file captures the current Back Office observations that directly influenced Rifad's catalog-management work. It is intended to let a future ChatGPT/Codex session continue without re-discovering the same Loyverse behaviors or re-interpreting the owner's screenshots.

Use this together with:

- `docs/architecture/CURRENT_DECISIONS.md`;
- `docs/architecture/BACK_OFFICE_CATALOG_BOUNDARY.md`;
- `docs/ui/flows/BO-FLOW-002.md`;
- `docs/ui/visual-decisions/VISUAL-DECISION-007-BACK-OFFICE-LOYVERSE-HIERARCHY.md`;
- `docs/ui/VISUAL-DECISION-008-CATALOG-VISUAL-IDENTITY.md`;
- `docs/CURRENT_WORK_HANDOFF_2026-08-18.md`.

Rifad may adopt workflow ideas and interaction patterns from Loyverse, but Rifad owns its contracts, data meanings, adapters, persistence, code, branding and final UX.

---

# 1. Sources reviewed

## Official Loyverse documentation

Primary official pages reviewed during the current Back Office pass:

1. Items and categories:
   - https://help.loyverse.com/help/items-categories
   - https://help.loyverse.com/ar/help/items-categories
2. Add items in Back Office:
   - https://help.loyverse.com/help/how-add-items-loyverse-back-office
   - https://help.loyverse.com/ar/help/how-add-items-loyverse-back-office
3. Variants:
   - https://help.loyverse.com/help/how-use-variants-items
4. Modifiers:
   - https://help.loyverse.com/help/how-set-and-apply-modifiers
   - https://help.loyverse.com/ar/help/how-set-and-apply-modifiers
5. Multiple stores:
   - https://help.loyverse.com/help/how-create-and-manage-multiple
   - https://help.loyverse.com/ar/help/how-create-and-manage-multiple
6. Import/export:
   - https://help.loyverse.com/help/importing-and-exporting
   - https://help.loyverse.com/ar/help/importing-and-exporting
7. Composite items:
   - https://help.loyverse.com/help/how-create-composite-item
   - https://help.loyverse.com/ar/help/how-create-composite-item

The repository also contains earlier preserved research under `docs/research/loyverse/`.

## Owner-supplied runtime screenshots

The owner supplied current screenshots from Loyverse Back Office covering at least:

- item list;
- expanded/collapsed right navigation;
- categories;
- modifiers;
- discounts;
- item creation/editing;
- category creation;
- modifier creation;
- item representation on POS;
- current 2026 Loyverse item form at runtime.

Those screenshots are the **primary visual feel reference** for the current Rifad Back Office pass. They are not stored as proprietary assets in the repository; this document preserves the observations that matter.

---

# 2. High-confidence Loyverse product behaviors

These are observations supported by official Loyverse documentation and/or the supplied runtime screenshots.

## 2.1 Item basics

A Loyverse item can be managed with merchant-facing fields such as:

- name;
- category;
- description;
- price;
- cost;
- SKU;
- barcode;
- available-for-sale state;
- sold-by mode;
- inventory controls;
- variants;
- modifiers;
- taxes;
- POS visual representation.

Rifad must **not** copy this field list mechanically into one SQL table or one giant form. Each capability is discovered and authorized through Rifad's own UI/domain work.

## 2.2 Category visual identity

Loyverse lets a category have a name and color. The color supports visual grouping/scanning in the sales experience.

Rifad inference adopted for current catalog discovery:

- category color is useful merchant-owned catalog data, not merely CSS;
- color should stay behind the Rifad catalog contract so LAN/cloud/ERP adapters can translate it later.

## 2.3 Item representation on POS

Loyverse supports representing an item by:

- color and shape; or
- an uploaded image.

Official documentation notes that item images are square for item preview and non-square images are cropped to a square.

Rifad inference adopted:

- the durable meaning is an item's visual representation;
- the current browser `imageDataUrl` is staging transport only;
- production may store an asset/file/media reference without changing merchant semantics;
- image availability must never become a prerequisite for sale/accounting truth.

## 2.4 Inventory/cost

Loyverse exposes cost, stock tracking, low-stock configuration and composite-item behavior.

Rifad inference:

- these are real product capabilities, not cosmetic checkboxes;
- Rifad should not add them as dead controls inside `BO-FLOW-002`;
- inventory deserves its own domain/UI slice because stock movement, quantities, adjustments, branch scope and offline/sync behavior matter;
- cost should be modeled deliberately alongside purchasing/accounting/inventory requirements rather than copied blindly from one donor form.

## 2.5 Store-specific item configuration

Loyverse supports multiple stores and store-specific item values such as price, in-stock quantity and low-stock threshold/notification.

Rifad inference:

- global catalog identity and branch/store overrides should be separate meanings;
- Rifad should be able to keep one product identity while applying branch-specific availability/pricing/inventory settings later;
- this supports the future Rifad branch/LAN/cloud design without duplicating products per branch.

## 2.6 Variants

Loyverse variants allow multiple versions such as sizes/colors/materials. In import/export, variant combinations are represented as separately identifiable variant rows/SKUs under a shared item handle.

Rifad decision differs intentionally from directly copying this UX.

For the current merchant target, the owner found technical repeated variant construction too complex for common restaurant pricing such as pizza sizes.

Rifad therefore uses **reusable option groups** as the primary simple merchant model:

`أحجام البيتزا → صغير 10 | وسط 20 | كبير 25`

A reusable group can serve many items. One item can inherit the group prices, override only exceptional prices, or use private option prices.

Legacy/generated Cartesian variants remain migration compatibility only. If true independently identifiable multi-dimensional variants become necessary later, they must be explicitly rediscovered and authorized.

## 2.7 Modifiers / add-ons

Loyverse modifiers are reusable groups of selectable options. A modifier can contain option names and additional prices and can be assigned to multiple items.

Rifad adopted the useful reuse concept but changed merchant wording:

- **الإضافات العامة** — reusable across items;
- **إضافات خاصة بهذا الصنف** — one-off item-only groups.

Current Rifad gaps still include cashier selection UI, required/min/max rules, ordering, sold-line snapshots, kitchen text and reporting semantics.

## 2.8 Composite items

Loyverse can build a composite item from component items and quantities, with cost derived from components and component stock reduced on sale when relevant.

Rifad inference:

- composite/recipe/BOM capability materially affects inventory and cost models;
- it must not be added merely because it is visible in Loyverse;
- Rifad needs a dedicated UI/domain slice before production data-model freeze.

## 2.9 Import/export

Loyverse supports item import/export using CSV and includes complex handling for variants, composite items, stores and related master data.

Rifad inference:

- bulk import/export is valuable but should come after stable Rifad catalog semantics;
- a CSV layout must not become the domain model;
- import adapters should map into Rifad contracts with validation and stable IDs.

---

# 3. Visual/interaction observations from the owner's screenshots

This section is intentionally detailed because the visual lesson is easy to lose between sessions.

## 3.1 The important lesson is not the green color

The owner repeatedly preferred Loyverse because it feels current, calm and immediately understandable.

The strongest visual qualities are:

- one dominant task per screen;
- low visual noise;
- restrained typography;
- wide breathing room without oversized decorative gaps;
- thin dividers and light shadows;
- almost no decorative gradients;
- simple form sections stacked vertically;
- very limited border radius;
- compact but legible controls;
- icons used as orientation/help, not decoration;
- consistent line heights and alignment;
- obvious hierarchy without giant headings;
- white content cards against a soft gray workspace;
- right navigation that feels stable and predictable;
- one clear Save/Cancel completion area rather than repeated calls to action everywhere.

The design feels modern because it is **disciplined**, not because it has many effects.

## 3.2 Rifad visual mistakes already discovered

Do not repeat these mistakes:

1. Do not turn the Back Office into an oversized dashboard.
2. Do not use large hero headings inside ordinary admin forms.
3. Do not stack cards inside cards inside panels unless the hierarchy truly requires it.
4. Do not use gradients/shadows to manufacture a “2026” feel.
5. Do not create a giant product preview when a compact POS-representation control is sufficient.
6. Do not duplicate Save/Cancel at both top and bottom merely because a long form allows it; the owner's latest visual comparison prefers one calm completion area.
7. Do not let visual CSS modify shell geometry. `backoffice-layout-safety.css` exists because an earlier polish pass broke the topbar/sidebar layout.
8. Do not shrink Arabic text to mimic old enterprise software; readability at 1920×1080 matters.
9. Do not over-bold most labels. Weight contrast should be selective.
10. Do not confuse “creative” with “busy”.

## 3.3 Current Rifad target visual recipe

For the current Back Office catalog slice:

- Cairo-first typography;
- Rifad green `#0A714E` as the identity color;
- flat/quiet top bar;
- persistent RTL navigation on the right;
- light gray workspace;
- simple white cards;
- thin gray separators;
- restrained shadows only where separation needs help;
- item form width comparable to a focused management form rather than a full-screen dashboard;
- compact POS representation section;
- one clear completion action area;
- SVG line icons for navigation/actions;
- category/group colors as small semantic accents, not large decorative backgrounds.

Current runtime CSS layers include:

- `reference-overrides.css`;
- `rifad-polish.css`;
- `backoffice-2026.css`;
- `backoffice-layout-safety.css`;
- `catalog-visuals.css`;
- `loyverse-reference-pass.css` loaded last.

`loyverse-reference-pass.css` is the latest visual simplification pass. It must not own domain behavior.

---

# 4. Rifad decisions inspired by the reference but intentionally different

## 4.1 Reusable pricing option groups

Owner requirement:

- hundreds of products may share the same size names/prices;
- the merchant should define the group once;
- an exceptional item should override only the values that differ.

Example:

- Pepperoni: small 10 / medium 20 / large 25;
- Ranch: same shared group;
- Special Pizza: use same group and override only exceptional prices if needed.

Rifad data meaning:

- fixed price; or
- shared option group + inherited prices; or
- shared option group + sparse item overrides; or
- item-private option prices.

This is a Rifad-native product decision, not a claim that Loyverse implements the same model.

## 4.2 General and private add-ons

Rifad distinguishes:

- reusable general add-on groups;
- item-private add-on groups.

This is designed to keep the global list clean while still allowing one-off item customization.

## 4.3 POS safety for multi-price items

Until Rifad implements an approved cashier option chooser, option-priced items are hidden from the default POS catalog reader.

Rifad must never silently sell a multi-price item using a preview/minimum/fallback price.

---

# 5. Features observed in Loyverse that remain Rifad gaps

Do not infer these as implemented merely because they are documented here.

Current/known future product-discovery areas include:

- cost;
- stock tracking;
- low-stock threshold/notifications;
- stock quantities and adjustments;
- composite items / recipes / components;
- taxes;
- sold by weight/volume;
- discounts;
- store/branch-specific product price/availability/inventory;
- import/export;
- delete/reorder permissions and lifecycle;
- modifier required/min/max/selection rules;
- true independently identifiable variants if later needed;
- cashier option/add-on chooser;
- reporting for options/add-ons;
- production media storage/synchronization.

These capabilities require their own approved Rifad flows and field discovery before production database freeze.

---

# 6. Continuation rule for future ChatGPT/Codex sessions

When resuming Back Office work:

1. Read `docs/CURRENT_WORK_HANDOFF_2026-08-18.md` first.
2. Read `PROJECT_RULES.md` and `docs/README.md` authority order.
3. Read D-030/D-031 in `docs/architecture/CURRENT_DECISIONS.md`.
4. Read `BACK_OFFICE_CATALOG_BOUNDARY.md` and `BO-FLOW-002.md`.
5. Read visual decisions 007 and 008.
6. Treat this file and official Loyverse sources as evidence/reference only.
7. Fetch the actual PR/head before writing because the branch may have moved.
8. Keep PR #2 Draft and do not merge without explicit owner approval.
9. Do not start production DB/LAN/cloud/ZATCA merely because foundations exist; current priority remains product/UI completeness and durable-field discovery.
10. Do not add a Loyverse feature without deciding whether it belongs in Rifad and whether its UI/domain meaning is sufficiently understood.
