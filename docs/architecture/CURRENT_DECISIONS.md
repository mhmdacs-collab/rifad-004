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
- `POS-FLOW-006` — tablet sale-page layout.

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

Current limitation: the legacy POS mock and restaurant mock still keep their operational prototype snapshots in their existing localStorage keys. Migrating those private snapshots behind `LocalPersistenceContract`, adding schema migrations, and proving cold restart behavior are the next local-first implementation slice.

See `docs/architecture/LOCAL_PERSISTENCE_AND_OUTBOX_BOUNDARY.md`.
