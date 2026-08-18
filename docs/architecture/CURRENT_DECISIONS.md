# Current Rifad Decisions

Last updated: 2026-08-18

These decisions supersede earlier architecture proposals under `docs/research/historical-proposals/` when they conflict.

## D-001 — Rifad owns the core

Rifad is not a branded shell over a donor POS/ERP. External systems may supply modules/algorithms/adapters but do not define Rifad contracts or product ownership.

## D-002 — UI-first

The UI phase builds the interactive product shell through Rifad-owned contracts and mock adapters while exposing the data/contract requirements production will need.

## D-003 — Primary UI stack

Use React + TypeScript + Vite. Windows hosts the same product UI in an application shell; supported tablet/mobile uses an installable PWA.

## D-004 — Loyverse as primary functional baseline

Loyverse is the primary workflow reference for screen inventory, interaction meaning, states, prerequisites and operational flows. Rifad independently implements the product under Rifad-owned identity/contracts.

## D-005 — Puzzle modules

Capabilities are replaceable modules behind stable Rifad-owned contracts. Donor language/framework does not determine Rifad architecture.

## D-006 — Donor projects are not repaired for their own sake

If extracting a useful capability requires broad donor repair, evaluate another donor or reimplement characterized behavior.

## D-007 — Local-first

Offline-capable POS operation, durable local state, idempotency and synchronization are core design requirements. Exact implementation remains behind Rifad-owned boundaries.

## D-008 — ZATCA is core

Saudi fiscal compliance is first-class Rifad domain work and remains behind a Rifad fiscal contract.

## D-009 — Accounting is replaceable

Odoo, ERPNext or other accounting engines may connect through adapters. None owns the finalized Rifad sale contract by default.

## D-010 — Historical research stays available

Older Odoo/hybrid/open-source proposals remain research evidence, not current binding architecture.

## D-011 — Donor composition happens inside Rifad

Multiple donor capabilities may be composed behind Rifad contracts. The first donor does not become the hidden integration base.

## D-012 — Existing code is an accelerator, not authority

Adopt proven implementations/tests/protocols where practical only after execution, source/test inspection, license verification and Rifad conformance review.

## D-013 — Support is a tested capability matrix

Do not claim generic device/integration support without evidence. Publish supported protocol/model/capability combinations and distinguish generic standards from certified devices.

## D-014 — UI implementation is manifest-gated

Every screen/action/state/flow receives stable IDs. Implement only ready screens/flows or their explicitly bounded subsets.

## D-015 — Rifad owns visual authority

Rifad's design system owns final visual tokens/assets/component styling. Donor interfaces may influence bounded patterns only through explicit evidence/decision records.

## D-016 — Build vertical flows, not disconnected screen museums

Implementation milestones prove end-to-end outcomes through Rifad mocks/contracts.

Current executable ready flows include:

- `POS-FLOW-001` — retail cash sale slice;
- `POS-FLOW-002` — restaurant local-service prototype;
- `POS-FLOW-006` — tablet sale-page layout;
- `BO-FLOW-002` — bounded Back Office catalog item list + add/edit slice.

## D-017 — POS is touch-first and human-scaled

> **Touch first, then human visual clarity, then beauty.**

Frequent controls retain practical touch targets. Constrained screens change layout/density/wrapping/scrolling/columns before shrinking important targets.

## D-018 — Every visible durable field must be traceable

`docs/ui/POS_UI_NAMING_AND_FIELD_REGISTER.md` records canonical terminology, current fields, mock-only fields, required gaps, reserved integration facts, derived values and UI-only state. Update it whenever product/UI work exposes new durable meaning.

## D-019 — Checkout preserves cashier spatial context

Accepted checkout progression:

`basket → payment methods → cash/card → success`

The catalog remains visible as frozen context while the transaction rail changes state.

## D-020 — Mock payment UX is not production terminal support

Mock **شبكة / مدى** validates product UX/data shape only. Production terminal support requires proven provider/terminal adapter, durable payment records, decline/recovery, reconciliation/refund scope, security review and capability evidence.

## D-021 — Frequent primary actions stay outside scrolling content

Completion actions such as **دفع / سداد / طباعة / بيع جديد** occupy stable action/footer regions whenever practical. Repeatable content absorbs scrolling first. Dynamic keypad validation reserves geometry so keys/actions do not jump.

## D-022 — Transaction operation card keeps one stable two-slot geometry

Rifad keeps the same two physical transaction slots, width, padding, gap, touch height and bottom placement across adjacent sale/payment/success states.

Current ordinary RTL meaning:

- right slot: secondary/alternative/cancel/state action;
- left slot: active completion action.

Current executable states can include:

- restaurant sale: **محلي | دفع**;
- advanced empty basket + open local orders: **طلبات مفتوحة · N | دفع**;
- reopened local order: **إرسال | دفع**;
- Quick Sale empty: **سداد | دفع**;
- cash: **إلغاء الفاتورة | سداد**;
- mock card: **إلغاء الفاتورة | تم الدفع**;
- success: **طباعة | بيع جديد**.

The older generic **حفظ | دفع** remains legacy/prototype behavior outside the current restaurant local-service presentation; it does not own restaurant semantics.

Visual priority may swap without moving geometry. In the advanced empty/open-order state, **طلبات مفتوحة · N** becomes green while disabled Pay stays neutral in its fixed slot.

The sale basket and inline checkout/success rail use one physical desktop/tablet width so **بيع جديد** does not introduce horizontal target jump.

## D-023 — Fulfillment, sales channel and payment/collection are separate durable meanings

Do not overload one field with restaurant fulfillment, delivery platform and payment state.

### Fulfillment

- `takeaway` → **سفري**
- `dine_in` → **محلي**
- `delivery` → **توصيل**

### Sales channel

Examples: direct POS, Keeta, HungerStation, Jahez, Ninja and future marketplace/online channels.

### Payment / collection / settlement

Examples: cash/Mada collected locally, customer credit, prepaid by platform, due on delivery/pickup, and later platform settlement.

The UI may combine defaults in one touch, but durable reporting/accounting must retain the separate meanings.

## D-024 — Restaurant service classification and place management are separate configuration layers

Rifad must not force restaurant wording/table complexity onto retail/direct workflows.

### Layer A — restaurant service semantics

When disabled:

- retail/direct behavior;
- no permanent **محلي / سفري** question;
- **دفع** is simply checkout.

When enabled:

- direct **دفع** is operationally **سفري** without an extra cashier tap;
- **محلي** becomes the local-service alternative;
- delivery channels may establish **توصيل** through their own flow.

### Layer B — advanced place management

When restaurant service is ON and place management is OFF:

`build basket → محلي → existing checkout as dine-in`

No place selection is required.

When place management is ON:

`build basket → محلي → PlaceGroup/ServicePlace → store open local order + mock kitchen revision → clear working basket`

The cashier-facing model is generic **مجموعة → أماكن**. Default prototype configuration is one **الطاولات** group with six tables; Back Office may later add arbitrary groups and names such as الغرف / الجلسات / الخارجية / VIP.

Payment can happen before or after dining. Empty basket + open local orders exposes **طلبات مفتوحة**.

### Current implementation status

`POS-FLOW-002` now authorizes and implements the **mock/local UI proof** of these behaviors:

- restaurant service ON/OFF;
- simple Local checkout;
- advanced group/place selection;
- open local order snapshots;
- reopen/update flow;
- place release after successful payment.

This does **not** authorize or claim final production restaurant persistence, multi-device table sync, real KDS/printer transport, or Back Office place editing.

Persistent business configuration is expected to move to Back Office; current POS controls are staging for product validation.

## D-025 — Product pricing can vary by sales channel without making channel only a payment method

Support base product price plus optional channel/pricelist overrides. Manual platform choice must show recalculated total before completion. API-connected orders preserve actual external sold-price snapshots rather than silently replacing them with direct-POS price.

Platform commission/settlement fee is separate from customer-facing product price.

## D-026 — Kitchen dispatch is order state, not a universal payment side effect

Target production behavior:

- direct restaurant Pay → takeaway preparation;
- simple local → local preparation without required place;
- advanced local → preparation when assigned/sent to place;
- later advanced-local additions/voids → preparation deltas/revisions;
- delivery → delivery + channel context where useful;
- API-connected delivery may auto-send according to branch policy.

`POS-FLOW-002` currently proves only a **mock kitchen revision/state transition**. Production requires durable dispatch identity, delta semantics, idempotency/outbox and real printer/KDS transport evidence.

## D-027 — Delivery integrations are capability-based adapters; direct and aggregator modes are both valid

Delivery-platform API shapes do not become Rifad's public contract.

A connector may expose capabilities such as merchant authorization, store mapping, menu/price sync, availability, incoming-order webhooks, accept/reject, preparation/ready/delivery statuses, cancellation/refund, payment/collection detail and settlement/reconciliation.

Rifad may use:

1. direct platform adapters when official partner access is practical;
2. aggregator adapters when they provide better platform coverage/onboarding economics.

Cashier consequence:

- API-connected orders arrive already carrying channel/fulfillment/prices/payment-collection state;
- cashier must not choose the platform again or re-enter the sale;
- prepaid orders do not create a second local collection;
- due-on-delivery stays unpaid until actual collection;
- manual platform tiles remain fallback/unconnected-entry tools;
- preferred cashier UX is one online-orders queue with many adapters behind it.

Research evidence: `docs/research/restaurant-pos/DELIVERY_PLATFORM_INTEGRATION_BENCHMARK_2026-08-17.md`.

## D-028 — General POS runtime is dependency-injected behind a Rifad-owned contract

The general POS flow must not instantiate a donor/mock/runtime implementation internally.

Current executable boundary:

- `PosRuntimeContract` is the Rifad-owned aggregate runtime contract;
- `apps/pos/src/runtime/posRuntimeAdapter.ts` is the concrete runtime composition point;
- `App.tsx` creates the selected runtime and injects it into `usePosFlow(posRuntime)`;
- `usePosFlow` no longer imports or constructs `createMockPosRuntime()`;
- the old `MockPosRuntime` name is compatibility-only and must not be used by new product/runtime code;
- `apps/pos/src/testing/posRuntimeConformance.ts` provides a reusable common sale probe for replacement runtimes.

A future POS may compose catalog, sales, customers, checkout, printing or other capabilities from different external/local implementations. External schemas, SDK types, IDs, credentials and errors stop at their adapters and do not become Rifad public product contracts.

See `docs/architecture/POS_RUNTIME_ADAPTER_BOUNDARY.md`.

## D-029 — Local persistence and transactional outbox are Rifad-owned and separate from LAN, Sync and fiscal

Local persistence is its own Rifad capability and is not an implementation detail of LAN, cloud synchronization, accounting or ZATCA/Fatoora.

The current Rifad boundary is `LocalPersistenceContract` V1 with:

- stable `installationId`;
- branch/device binding when available;
- module-private versioned snapshots;
- snapshot revision metadata;
- local snapshot + outbox-event commit semantics;
- stable event identity and deduplication;
- retry/failure bookkeeping and explicit acknowledgement.

A completed offline-capable local sale becomes a durable Rifad fact before downstream LAN/cloud/accounting/fiscal work. Downstream retry must reuse stable identity and must never create a second sale.

LAN remains a separate branch-local transport/capability for KDS/CDS/printers/multi-device coordination where applicable. Cloud Sync remains a separate capability for branch/cloud propagation and conflict resolution. ZATCA/Fatoora remains a separate fiscal adapter/state machine with its own retries and audit evidence.

No downstream adapter may integrate by directly reading or mutating another domain's private persistence namespace.

The current `BrowserLocalPersistence` transport is **staging evidence**, not the final Windows/PWA production database. The contract is asynchronous/replaceable so IndexedDB, OPFS, SQLite or another proven local store can replace it after restart/crash/migration/performance proof.

The current POS and restaurant mock operational snapshots are now mirrored behind private `LocalPersistenceContract` namespaces (`pos.runtime` and `restaurant.service`) with schema version 1. A temporary composition-root compatibility bridge imports the historical mock keys and hydrates fresh mock instances from the Rifad namespaces. Runtime tests prove a working ticket/customer, completed receipt/history, and an open local restaurant order survive reconstruction even when the historical mock keys are deliberately removed.

This is a **staging cold-restart PASS**, not a production storage freeze. The compatibility bridge remains temporary; packaged Windows cold start, crash/interrupted-write recovery, realistic volume/performance and selection of the production local engine remain required before production acceptance.

See `docs/architecture/LOCAL_PERSISTENCE_AND_OUTBOX_BOUNDARY.md`.

## D-030 — Complete product/UI field discovery before production data-model freeze

Rifad does not freeze its production SQL/database model merely because adapter and local-persistence foundations already exist.

Current priority is **product/UI completeness + durable-field discovery**. Relevant business surfaces are implemented in bounded vertical slices, and every newly exposed durable meaning is traced in `docs/ui/POS_UI_NAMING_AND_FIELD_REGISTER.md` before the production data model is frozen.

A visible control does not automatically imply one database column. Derived presentation state should remain derived where appropriate; facts that must survive restart, reporting, synchronization or integration receive explicit Rifad-owned domain meaning.

Back Office is the primary management surface for discovering merchant-owned configuration and master data. The first executable slice, `BO-FLOW-002`, establishes a shared Rifad catalog meaning for Back Office and POS while deliberately limiting fields to the currently approved UI scope.

The current browser catalog transport is staging evidence only. It does not claim LAN or cloud synchronization and does not select the final production database.

Before production data-model freeze, continue relevant UI/product discovery for catalog extensions, restaurant/place administration, branch/store configuration, delivery/channel pricing and other approved domains that materially change durable data shape.

Existing adapter, local-persistence and outbox boundaries remain foundations underneath this work; they are not discarded, but deeper production infrastructure work must not outrun product-field discovery.

See `docs/architecture/BACK_OFFICE_CATALOG_BOUNDARY.md`.

## D-031 — Merchant pricing uses reusable option groups with sparse item overrides; add-ons support reusable and item-private scope

Rifad must not force a merchant to rebuild the same size/price matrix separately on every item.

The merchant-facing Back Office concept is **مجموعات الخيارات**, not technical Cartesian variant construction.

Example:

`أحجام البيتزا → صغير 10 | وسط 20 | كبير 25`

One reusable option group may serve many items. An item pricing policy is explicitly one of:

1. fixed price;
2. reusable option group with inherited group prices;
3. reusable option group with sparse per-item overrides only where an item's price differs;
4. item-private option prices when the choices should not be globally reusable.

The Back Office exposes one clear **أسعار متعددة** control. Enabling it disables the fixed-price field and makes option pricing authoritative for that item.

Sparse override semantics are required: customizing one group value on one item must not copy/freeze every other group price into that item. Unchanged values continue inheriting the reusable group, which keeps later shared-price maintenance practical across large catalogs.

Add-ons are separate from pricing-option groups:

- **الإضافات العامة** are reusable groups that may be assigned to many items;
- **إضافات خاصة بهذا الصنف** belong only to one item when the choice is genuinely one-off.

Historical generated `CatalogVariant*` structures remain staging-migration compatibility only. They do not own new merchant UX. If a later requirement needs true independently identifiable multi-dimensional variants, that capability must be rediscovered and authorized explicitly rather than reappearing through legacy schema.

The current POS has no approved pricing-option/add-on chooser. Therefore option-priced items are hidden from the default cashier catalog reader until POS-SCREEN-005 is separately authorized. Rifad must never silently sell an option-priced item at a minimum/fallback preview price.

This decision remains behind Rifad-owned `CatalogAdminContract` / `CatalogReadContract` boundaries. Local/LAN/cloud/ERP adapters must translate into these meanings rather than imposing their own variant schema on Rifad.

See `docs/ui/flows/BO-FLOW-002.md` and `docs/architecture/BACK_OFFICE_CATALOG_BOUNDARY.md`.
