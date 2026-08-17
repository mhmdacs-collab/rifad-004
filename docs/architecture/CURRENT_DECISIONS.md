# Current Rifad Decisions

Last updated: 2026-08-17

These decisions supersede earlier architecture proposals stored under `docs/research/historical-proposals/` when they conflict.

## D-001 — Rifad owns the core

Rifad is not built as a branded shell over a donor POS/ERP. External systems may supply modules, algorithms or adapters, but they do not define Rifad's contracts or product ownership.

## D-002 — UI-first

The UI phase target is the complete interactive product shell: POS, Back Office, Dashboard, KDS and CDS. It is delivered through manifest-gated vertical flows. Missing backend capabilities are represented by mock adapters behind real Rifad contracts.

## D-003 — Primary UI stack

Use React + TypeScript + Vite for the primary interface. The same product UI is hosted in a desktop application shell on Windows and installed as a PWA on supported tablet/mobile platforms.

## D-004 — Loyverse as functional/workflow reference

Loyverse is the primary functional/workflow reference for screen inventory, interaction meaning, states, prerequisites and operational flows. Rifad independently implements the experience using Rifad branding and Rifad-owned code/contracts.

## D-005 — Puzzle modules

Capabilities are replaceable modules behind stable contracts. Donor language/framework does not determine Rifad architecture.

## D-006 — Donor projects are not repaired for their own sake

If extracting a useful capability requires broad donor repairs, evaluate another donor or reimplement the characterized behavior.

## D-007 — Local-first

Offline-capable POS operation, durable local state, idempotency and synchronization are core design requirements. Exact implementation is selected behind Rifad-owned contracts.

## D-008 — ZATCA is core

Saudi fiscal compliance is a first-class Rifad domain. It may use/adapt proven implementations and official specifications but remains behind a Rifad fiscal contract.

## D-009 — Accounting is replaceable

Odoo, ERPNext or other accounting/ERP engines may be connected through adapters. None is the owner of the finalized Rifad local sale contract by default.

## D-010 — Historical research stays available

Existing Loyverse and open-source material is retained under `docs/research/` as research evidence. Statements such as “Odoo is the fixed core” are historical proposals, not current binding architecture.

## D-011 — Donor composition happens inside Rifad

When multiple donors solve different parts of a capability, their selected logic is composed behind Rifad-owned contracts/core/adapters. One donor is never promoted to the integration base merely because it supplied the first implementation.

## D-012 — Existing code is an accelerator, not authority

Rifad starts from proven implementations, tests, protocols and failure evidence whenever practical. A donor slice is adopted only after execution, source/test inspection, license verification and Rifad conformance validation.

## D-013 — Support is a tested capability matrix

Rifad does not promise “any device” or “any integration” without evidence. Hardware and external-system support is published as explicit protocol/model/capability combinations backed by tests. Generic standards support and certified devices are reported separately.

## D-014 — UI implementation is manifest-gated

Every screen, action, state and end-to-end flow receives a stable ID linked to source evidence. Code may start only for a `ready` screen or the explicitly bounded subset of a ready flow. Missing behavior is resolved in the manifest before implementation.

## D-015 — Rifad owns visual authority

Rifad's design system owns final visual tokens, assets and component styling. Loyverse remains the functional/workflow and ergonomic baseline. Another interface may influence a narrow pattern only after an explicit visual decision; it cannot silently change logic or flows.

## D-016 — Build vertical flows, not disconnected screen museums

Implementation milestones prove an end-to-end user outcome through mocks. The first authorized milestone is `POS-FLOW-001`, a retail cash sale slice spanning entry, PIN, sales, cash payment, success and a new sale.

## D-017 — POS is touch-first and human-scaled

For cashier-facing POS work, the design priority is:

> **Touch first, then human visual clarity, then beauty.**

This means frequent controls retain practical touch targets across device sizes. When a screen becomes constrained, Rifad changes layout, density, wrapping, scrolling or column count before shrinking important targets into desktop-sized controls.

Visual scale is judged from real human viewing distance and cashier task frequency, not from screenshot symmetry or design-tool neatness.

Detailed rules live in `docs/ui/DESIGN_AUTHORITY.md`.

## D-018 — Every visible durable field must be traceable before database implementation

Rifad will not wait for database implementation to discover what the UI needs to persist.

`docs/ui/POS_UI_NAMING_AND_FIELD_REGISTER.md` is the current POS traceability register for:

- canonical cashier-facing terminology;
- fields already present in Rifad models/contracts;
- UI-required fields that are still missing from durable data;
- reserved integration fields;
- derived values;
- presentation-only state that should not become database truth.

When a new durable field, option, status or payment fact becomes visible, the register must be updated in the same product/implementation change.

## D-019 — Checkout preserves cashier spatial context

The accepted POS checkout direction keeps the product catalog visible and transforms the basket rail through checkout rather than navigating the cashier to unrelated full-page surfaces.

The conceptual progression is:

`basket → payment methods → cash/card → success`

The catalog remains visible as frozen context during checkout. This is an interaction decision; the business contracts still own sale/payment state.

## D-020 — Mock payment UX is not production terminal support

Rifad may implement a mock `card` / **شبكة / مدى** path to validate payment-method selection, touch layout, receipt shape and success behavior.

A working mock card flow does **not** mean Rifad supports a real Mada/payment terminal.

Production integrated-payment support requires a proven provider/terminal adapter, durable payment records, failure/decline/recovery behavior, reconciliation/refund requirements, security review and capability evidence.

The current card UX extension must remain distinguishable from certified production terminal support in documentation and product claims.

## D-021 — Frequent primary actions stay outside scrolling content

Cashier-facing completion actions should occupy a stable action/footer region within their operational surface rather than moving with long content.

Examples include **دفع**, **سداد**, **طباعة الإيصال**, **بيع جديد** and equivalent confirmation actions.

The intended composition is:

`scrollable/repeatable content → required summary/context → stable primary-action footer`

Consequences:

- item lists, history, optional form fields and other repeatable content absorb scrolling first;
- shorter screens change spacing, columns or content density before hiding the primary action behind a normal-path scroll;
- totals, tax, change or remaining balance may stay immediately adjacent to the footer when they are required to make the final decision;
- dynamic validation near a repeated keypad must reserve stable geometry so state changes do not move the keys or completion action;
- the footer is fixed within the relevant panel/dialog/rail, not blindly fixed to the browser viewport.

This is an interaction/layout decision and does not change the underlying business command or persistence semantics.

## D-022 — Transaction operation card keeps one stable two-slot geometry

A stable footer is not sufficient if the transaction controls are restyled or repositioned as the cashier advances.

Rifad therefore keeps the **same two-slot operation card** in the same lower transaction zone whenever practical.

For the current executable RTL sale/payment flow:

- the right slot normally holds the secondary / alternative / cancellation action;
- the left slot normally holds the active sale/payment completion action;
- the two-slot card remains spatially stable through sale, payment completion and sale success;
- the sale basket and checkout/success rail share one physical rail width so returning from **بيع جديد** does not create a horizontal target jump.

Current executable sequence:

- sale prototype: **حفظ | دفع**;
- Quick Sale with an empty ticket: **سداد | دفع**; Pay stays visible but disabled until there is a payable ticket;
- cash checkout: **إلغاء الفاتورة | سداد**;
- card/mock checkout: **إلغاء الفاتورة | تم الدفع**;
- success: **طباعة | بيع جديد**.

The current generic **حفظ** label is not a permanent restaurant-product decision. Under restaurant-service configuration, a non-empty basket is targeted to use **محلي | دفع** instead.

When advanced place management is enabled and the basket is empty with open local orders, physical geometry still does not move, but **visual priority may intentionally swap**:

- right slot: **طلبات مفتوحة · N** becomes green/primary;
- left slot: **دفع** remains in place but is neutral/disabled because there is no payable working basket.

This is not a violation of spatial continuity: the targets stay in the same physical slots; only state-appropriate visual emphasis changes.

The debt-book **سداد** action on the sale screen is not moved into the Pay slot merely because it is currently the only enabled action.

`إلغاء الفاتورة` before payment completion abandons the unpaid prototype transaction and starts a fresh sale without creating a receipt. Production cancellation/audit/fiscal semantics remain a separate domain requirement.

Detailed visual treatment is recorded in `docs/ui/visual-decisions/VISUAL-DECISION-005-PRIMARY-ACTION-SPATIAL-CONTINUITY.md` and the restaurant extension in `VISUAL-DECISION-006-RESTAURANT-SERVICE-OPEN-ORDERS.md`.

## D-023 — Fulfillment, sales channel and payment are separate durable meanings

Rifad will not store **محلي / سفري / توصيل**, delivery-platform identity and payment/collection state as one overloaded field even when the cashier sees them as one convenient completion choice.

Target separation:

### Kitchen/fulfillment mode

- `takeaway` → **سفري**;
- `dine_in` → **محلي**;
- `delivery` → **توصيل**.

This describes how the order is fulfilled/prepared and what the kitchen needs to know.

### Sales channel

Examples: direct POS, Keeta, HungerStation, Jahez, Ninja and future online/marketplace sources.

### Payment/collection/settlement

Examples: cash collected locally, card/Mada collected locally, customer credit, prepaid by platform, cash/card due on delivery/pickup, and later platform settlement.

The POS may display a delivery platform alongside payment choices for cashier speed, but durable records and reporting must retain channel, fulfillment and collection/settlement separately.

The normal restaurant direct-sale path may default operationally to **سفري** without forcing a separate cashier tap.

## D-024 — Restaurant service classification and place management are two different configuration layers

Rifad must not force restaurant terminology or table complexity onto retail/bakery/grocery workflows that only need direct selling.

### Layer A — restaurant service classification

A branch/POS configuration enables restaurant service semantics.

When **disabled**:

- the POS behaves as retail/direct sale;
- no permanent **محلي / سفري** workflow is forced into the cashier path;
- **دفع** is simply checkout.

When **enabled**:

- direct **دفع** means the restaurant's normal direct sale and is prepared as **سفري** by default;
- **محلي** becomes available as the alternative local-service action;
- delivery platforms may establish **توصيل** through their own channel/order flow.

### Layer B — advanced service-place management

Place management is an optional sub-capability for restaurants that need to identify exactly where the guest is seated.

When restaurant service is enabled but place management is **disabled**:

`build basket → محلي → checkout/complete as dine-in`

The kitchen receives **محلي**, but the cashier is not asked to choose a table/room/session.

When place management is **enabled**:

`build basket → محلي → choose service area/place → send kitchen order → clear working basket → keep open local order`

Service location is generalized as:

- **service area**: e.g. الصالة، الدور الأول، الغرف، الجلسات الخارجية;
- **service place**: e.g. طاولة 12، غرفة 3، جلسة 8.

Payment can happen before or after dining. Fulfillment does not decide payment timing.

When the main basket is empty and local orders are open, the normal cashier shortcut is **طلبات مفتوحة** rather than a generic Save list.

Persistent restaurant-service/place configuration is expected to become Back Office responsibility. POS-side configuration may temporarily exist during UI-first discovery but must not silently become the permanent ownership model or be exposed to ordinary cashiers in production.

Implementation is not authorized until the UI Execution Manifest defines the bounded restaurant/open-order flow.

## D-025 — Product pricing can vary by sales channel without making channel only a payment method

Rifad pricing must support a base product price plus optional channel/pricelist overrides.

Example intent:

- base Latte price;
- Keeta-specific effective price;
- HungerStation-specific effective price.

The production model may use normalized channel-price records or pricelists rather than hard-coded platform columns.

For a cashier-created/manual platform sale, if selecting a channel changes prices, the cashier must see the recalculated total before final completion.

For an API-connected incoming order, preserve the prices actually sold by the external platform as order snapshots and validate/map them; do not silently replace them with the current direct-POS base price.

Platform commission/settlement fee is a separate commercial fact from the customer-facing product price and should not be hidden inside the price override.

## D-026 — Kitchen dispatch is order state, not a universal payment side effect

Kitchen/preparation output follows order lifecycle and fulfillment context.

Target behavior:

- direct takeaway: preparation output occurs in the direct-sale completion path;
- simple local without place management: preparation output follows the local completion/send flow;
- advanced local: preparation output occurs when the order is assigned/sent to its service place, even if payment happens later;
- later advanced-local additions/voids produce preparation deltas/revisions rather than blind duplicate full orders;
- delivery: preparation output identifies **توصيل** and sales channel where useful;
- API-connected delivery orders may be auto-accepted and sent to kitchen when branch policy allows, without requiring manual cashier recreation.

Production implementation requires durable dispatch identity, revision/delta semantics and idempotency so offline/retry behavior cannot create duplicate kitchen work.

## D-027 — Delivery integrations are capability-based adapters; Rifad supports direct and aggregator modes

Rifad's cashier/product model must not depend on the API shape of Keeta, HungerStation, Jahez, Ninja or any aggregator.

External delivery integrations implement a Rifad-owned, capability-based adapter boundary. A connector may expose some or all of:

- merchant authorization;
- branch/store mapping;
- menu/channel-price synchronization;
- item availability/status synchronization;
- incoming-order webhook/polling;
- order accept/reject;
- prepare/ready/dispatch/delivered status;
- cancellation/refund;
- payment/collection detail;
- settlement/reconciliation detail.

Not every platform supports every capability, and production API access may require commercial onboarding, credentials or certification even when documentation is public.

Rifad may integrate in either of two ways:

1. **direct platform adapter** when official partner access is practical;
2. **aggregator adapter** such as a future Deliverect/UrbanPiper/Grubtech-class integration when it provides better platform coverage or onboarding economics.

The public Rifad contract remains the same in both cases.

Cashier consequence:

- an API-connected platform order arrives already carrying its channel, fulfillment, prices and payment/collection state;
- the cashier must not choose Keeta/HungerStation again or re-enter the sale;
- prepaid platform orders must not create a second cash/card collection at the till;
- cash/card-on-delivery remains unpaid until money is actually collected;
- a manual platform tile remains valid as fallback for an unconnected platform or authorized manual-entry scenario;
- the preferred cashier experience is **one online-orders queue, many adapters behind it**, with optional auto-accept/send-to-kitchen policy.

Research evidence is recorded in `docs/research/restaurant-pos/DELIVERY_PLATFORM_INTEGRATION_BENCHMARK_2026-08-17.md`.
