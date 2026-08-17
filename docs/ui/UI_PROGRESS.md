# Rifad UI Progress Record

Last updated: 2026-08-17

This is the living execution record for the current Rifad interface phase. It records what is executable now, what the owner has visually accepted, what is still under visual review, and which production/data/integration gaps remain.

Use with:

- `UI_EXECUTION_MANIFEST.json` — implementation scope/gates;
- `POS_UI_NAMING_AND_FIELD_REGISTER.md` — canonical names and UI-to-data traceability;
- `DESIGN_AUTHORITY.md` — interaction/visual authority;
- `visual-decisions/` — accepted/current design decisions.

## Status legend

- ✅ implemented and behavior-tested
- 👁 owner visually reviewed/accepted for the stated point
- 🟡 implemented/directed but owner visual review still open
- ⚠️ known production/data/integration gap
- ⬜ not implemented

---

# Current working state

- Repository: `mhmdacs-collab/rifad-004`
- Branch: `agent/pos-visual-pass-01`
- PR: **#2 — Open + Draft + not merged**
- Base: `main`
- Do not merge until explicit owner approval.

The executable POS is Rifad-owned React/TypeScript/Vite with mock/local adapters selected behind Rifad-owned composition roots. Current UI behavior does not imply a production database, sync engine, fiscal transport, real kitchen/KDS transport, real payment terminal, or delivery-platform connector.

---

# Binding UX principle

> **Touch first, then human visual clarity, then beauty.**

Current rules include:

- frequent controls target about 48px+ where possible; short screens retain about 44–48px important targets;
- change layout/density/columns before shrinking important touch targets;
- money and the next action must read at normal cashier distance;
- large POS, 1366×768, tablet landscape, short-height, and mobile/narrow layouts matter;
- repeated content absorbs scrolling before transaction-completion actions;
- sale/payment/success share one stable two-slot operation card and one desktop/tablet rail width;
- physical action slots stay fixed even when state-specific green priority changes;
- repeated numeric touch entry prefers embedded POS keypads while preserving hardware keyboard support;
- dynamic validation reserves stable geometry.

---

# 1. Entry / employee session

Status: ✅

Implemented device/account sign-in shell, employee PIN unlock, transition to sales, and restoration of supported mock-local state. No production identity backend is claimed.

---

# 2. Sales workspace

Status: ✅ 👁

Implemented/iterated:

- RTL-first tablet/desktop shell;
- touch product grid and configurable sale pages;
- responsive/mobile ticket surface;
- Saudi-riyal presentation;
- whole product cards as touch targets;
- editable ticket lines;
- sale-page create/place/remove/rename/reorder/delete UI;
- responsive product-grid behavior;
- touch audit across header/cards/tabs/ticket/actions.

Accepted direction:

- product card carries identity/name and unit price;
- basket emphasizes `quantity × product name → row total`;
- repeated product addition emphasizes quantity feedback;
- active action is obvious without moving footer geometry;
- density never wins over finger reliability.

## Sales modes

- **شاشة لمس** — touch/page-grid sales;
- **البيع السريع** — search/barcode-first sales.

Legacy cashier-facing **شاشة أساسية** is removed; internal `basic` compatibility may remain.

## Quick Sale

Status: ✅ 👁 / barcode data ⚠️

Search is primary, whole rows are touch targets, long names wrap, result scrolling is isolated, and scanner/keyboard focus is preserved/restored.

⚠️ Product still lacks real SKU/barcode identity; mock search is not production scanner evidence.

---

# 3. Basket / quantity / Clear Cart

Status: ✅ 👁

Accepted:

- row = `quantity × product → row total`;
- large quantities such as `1000×` remain readable;
- long names may use a second line;
- only the item list scrolls;
- totals/required context/transaction footer remain reachable;
- **مسح السلة** appears from first item inside basket body after ticket header and before product lines;
- visible Clear Cart copy is delete icon + **مسح السلة** only;
- Clear Cart never changes header/footer geometry.

Quantity editor includes large `+ / −`, direct numeric entry, embedded `1–9 / 0 / 00 / backspace`, hardware keyboard support, separated destructive delete, and one confirmation write.

---

# 4. Restaurant local service — POS-FLOW-002

Status: ✅ behavior-tested mock / 🟡 iterative owner visual review / ⚠️ production persistence + kitchen transport

The old visible **محلي / سفري / توصيل** selector is no longer the target interaction. Its legacy implementation remains only for compatibility tests and is hidden/migrated in the current local-service UI.

Rifad has two independent restaurant configuration layers in the executable mock:

## Restaurant service OFF

- retail/direct POS;
- restaurant wording is hidden from the normal sale path;
- direct **دفع** remains usable.

## Restaurant service ON + place management OFF

Simple restaurant:

- non-empty basket: **محلي | دفع**;
- direct **دفع** is operationally **سفري** without an extra tap;
- **محلي** enters the existing checkout in one touch;
- no place selector.

## Restaurant service ON + place management ON

Advanced restaurant:

- non-empty basket: **محلي | دفع**;
- **محلي** opens **مجموعة → مكان**;
- default prototype has exactly one group: **الطاولات**;
- default places are **طاولة 1** through **طاولة 6**;
- **الغرف** and **الجلسات** are not seeded by default;
- future Back Office configuration may create arbitrary groups and place names;
- selecting an available place stores a mock local open order, records mock kitchen revision 1, shows kitchen-send feedback, and clears the working basket;
- payment may happen later by reopening the place.

The Rifad place domain is generic: `PlaceGroup → ServicePlace`. There is no required `table | room | session` enum.

## Open-order state

Empty basket + advanced open orders:

> **طلبات مفتوحة · N | دفع**

- Open Orders becomes green in the fixed right slot;
- Pay remains in the fixed left slot, neutral/disabled;
- footer geometry does not move.

Reopening a **محجوزة** place reconstructs its stored order into the current working ticket and exposes:

> **إرسال | دفع**

- **إرسال** updates the stored open order, increments the mock kitchen revision, and clears the working basket;
- **دفع** uses the existing checkout; successful payment releases the stored place.

Place cards now use cashier-facing states **متاحة / محجوزة**. A reserved card uses a very light warm-red treatment; the order total is large/bold/green, place name is clear, elapsed time is secondary, and item count is intentionally omitted.

Open local orders prevent disabling restaurant service/place management until those orders are closed.

### Restaurant adapter readiness

The local-service path now uses a replaceable Rifad-owned `RestaurantServiceContract` V1:

- `useLocalServiceFlow` receives the contract through dependency injection;
- concrete adapter selection is isolated in `apps/pos/src/runtime/restaurantServiceAdapter.ts`;
- components/state do not instantiate or import the concrete restaurant adapter;
- domain terminology is `PlaceGroup / ServicePlace / OpenLocalOrder` rather than donor schema names;
- mock-specific legacy preference migration is isolated at the composition root;
- payment completion no longer depends on reading mock POS/restaurant storage from the restaurant flow;
- earlier mock snapshots using `serviceAreaId/serviceAreaName` are normalized on read.

This means a future external restaurant/table implementation can be connected by writing an adapter that conforms to the Rifad contract instead of rewriting the local-service UI.

See `docs/architecture/RESTAURANT_SERVICE_ADAPTER_BOUNDARY.md`.

### Explicit prototype boundary

The current concrete restaurant adapter is still mock/local. This does not prove a production open-order database, multi-device synchronization, conflict resolution, real KDS/printer transport or an external donor/API integration.

Persistent restaurant/place configuration is expected to move to Back Office later.

---

# 5. Inline checkout / transaction continuity

Status: ✅ 👁

Accepted progression:

> `basket → payment methods → cash/card → success`

Catalog remains visible but frozen during checkout. Sale basket and checkout/success rail share one desktop/tablet width, removing the visual jump after **بيع جديد**.

Current operation geometry remains physically stable. Depending on current mode/state the sale-side pair may be:

- restaurant basket: **محلي | دفع**;
- advanced empty basket + open orders: **طلبات مفتوحة · N | دفع**;
- reopened advanced local order: **إرسال | دفع**;
- Quick Sale empty ticket: **سداد | دفع**;
- cash: **إلغاء الفاتورة | سداد**;
- mock card: **إلغاء الفاتورة | تم الدفع**;
- success: **طباعة | بيع جديد**.

The older generic **حفظ | دفع** remains legacy/prototype behavior outside the current restaurant local-service presentation; it is not the target restaurant meaning.

---

# 6. Payment methods

Status: ✅ cash / ✅ mock card UX / ⚠️ production terminal

Current methods: **نقدًا** and **شبكة / مدى** as large recognition surfaces.

Cash direction is owner-reviewed: received amount strongest, predictable quick tender values, embedded keypad, calm change result, and reachable **سداد**.

The card path completes a mock transaction and records `paymentMethod: "card"`. It does not prove terminal discovery, acquirer connectivity, approvals/RRN, reconciliation, refunds, or production payment security.

---

# 7. Sale success / receipts / printing

Status: ✅ 👁 / durable print history ⚠️

- success remains in transaction rail context;
- cash change is hero fact when applicable;
- **طباعة | بيع جديد** uses exact transaction geometry;
- always-print preference is a scannable printer row;
- receipt history is newest-first;
- mock print/reprint exists;
- `delivery-unknown` requires explicit confirmation before retry.

⚠️ Durable per-receipt print-job history is not implemented.

---

# 8. Customer system

Status: ✅ 👁

Implemented attach/remove, search, create/edit, Saudi 10-digit local mobile rule, optional address in quick create, and additional fields in **three real desktop columns / one mobile column**.

Current mock preserves email/address/city/region/postal/country/customer code/note/tax number. Tax-number presence does not itself prove ZATCA compliance.

---

# 9. Credit / debt

Status: ✅ behavior / 🟡 remaining scope

Quick Sale:

- items → **آجل**;
- empty → **سداد**.

Debt settlement includes full/default settlement, partial embedded keypad, hardware keyboard, exact halala parsing, invalid/over-balance prevention, duplicate-submit protection, stable feedback geometry, and a readable before/paid/remaining result retained until explicit **تم**.

Still unscoped: settlement payment method, due dates/aging, credit limits, permissions, statement export.

---

# 10. Loyalty

Status: ✅ contract/model direction / 🟡 visual completeness

Current concepts include program configuration, status/balance, redemption quote, applied redemption, earned value and purchase history. Production should eventually use durable loyalty transactions rather than mutable balance alone.

---

# 11. Delivery channels / APIs / online-order UX

Status: 🟡 researched direction / ⬜ no Rifad production connector

Research: `docs/research/restaurant-pos/DELIVERY_PLATFORM_INTEGRATION_BENCHMARK_2026-08-17.md`.

Current direction:

- support direct platform adapters and aggregator adapters behind one Rifad-owned capability contract;
- one cashier online-order experience regardless of adapter source;
- API-connected orders arrive with channel/reference/sold prices/payment-collection state where supplied;
- cashier does not reselect the platform or retype the order;
- branch may later support auto-accept + auto-send to kitchen;
- prepaid platform order must not trigger a second cash/Mada collection;
- cash/card on delivery/pickup stays unpaid until actual collection;
- manual platform tiles remain fallback/unconnected-entry tools;
- channel selling price remains separate from platform commission/settlement.

No production delivery connector is claimed.

---

# 12. Configuration ownership

Executable staging preferences/config now include:

- sale mode;
- restaurant service enabled/disabled;
- advanced place management enabled/disabled;
- print receipt always.

The old generic visible-order-type preference is superseded by the restaurant model and hidden in the normal current UI.

Future structured Back Office configuration should own persistent restaurant groups/places, channels/pricelists, connector/store mapping, credentials, and online-order policies. Ordinary cashiers should not control sensitive production configuration.

---

# 13. Adapter readiness and highest-priority production/data gaps

## A. General POS runtime adapter readiness

Status: ✅ architecture boundary implemented / ⚠️ production adapters not selected

The general POS now follows the same composition-root rule as restaurant local service:

- public aggregate type is `PosRuntimeContract`;
- `apps/pos/src/runtime/posRuntimeAdapter.ts` is the single current POS runtime composition point;
- `App.tsx` creates the selected runtime once and injects it into `usePosFlow(posRuntime)`;
- `usePosFlow` no longer imports or constructs `createMockPosRuntime()`;
- the old `MockPosRuntime` name remains compatibility-only for existing mock code;
- `apps/pos/src/testing/posRuntimeConformance.ts` provides a reusable Rifad-owned behavior probe;
- automated coverage proves that an injected runtime can replace catalog behavior observed by React state.

See `docs/architecture/POS_RUNTIME_ADAPTER_BOUNDARY.md` and D-028.

What remains is no longer “make the POS adapter-ready”; it is **select and prove production implementations behind the boundary**.

## B. Restaurant production gaps

1. choose/prove the first production restaurant-service implementation or donor adapter behind `RestaurantServiceContract` V1;
2. durable authoritative order model with `fulfillmentMode` and place snapshots;
3. production group/place/open-order persistence;
4. Back Office group/place CRUD and permissions;
5. multi-device reservation/open-order synchronization and conflict policy;
6. offline/restart behavior for open local orders;
7. durable kitchen dispatch/revision/delta/idempotency/outbox semantics;
8. real KDS/printer transport.

## C. General POS production adapter/data gaps

1. choose/prove the first production `PosRuntimeContract` implementation strategy: Rifad-native, donor-backed, external API, or hybrid composition;
2. durable local authoritative sales/order/customer/payment store;
3. offline/restart and sync semantics behind runtime capabilities;
4. stable employee/branch/device identity and permissions;
5. real SKU/barcode identity/search;
6. durable checkout/payment records and idempotency;
7. print-job persistence and real printer transport;
8. legitimate Mada/card references without prohibited sensitive card data;
9. production migration/rollback and adapter capability matrices.

## D. Delivery/channel production gaps

1. `salesChannelId` and channel configuration;
2. channel-aware pricelist/product overrides + effective sold-price evidence;
3. delivery adapter contract implementation + connector onboarding;
4. external order IDs/mappings/payment-collection/webhook idempotency;
5. platform settlement/reconciliation separate from till payment.

---

# 14. Automated evidence

Current branch coverage includes:

- normal cash sale;
- sale-page editing;
- legacy order-type compatibility gate;
- always-print/receipt recovery;
- customer details/tax persistence;
- Saudi mobile constraint;
- Quick Sale focus;
- debt settlement and duplicate-submit protection;
- mock card completion;
- quantity keypad entry of 1000;
- Clear Cart placement/minimal copy/footer isolation;
- unpaid checkout cancellation;
- stable transaction geometry;
- **POS-FLOW-002 simple local: one-touch Local checkout without place selection**;
- **POS-FLOW-002 advanced local: one default Tables group / six tables → place selection → open order → clear working basket**;
- **advanced Open Orders → reserved place → reopen → Send or Pay**;
- **sending additions increments mock kitchen revision while retaining one open place**;
- **successful payment releases the open place**;
- **retail/off mode hides restaurant language**;
- **restaurant flow compiles against injected `RestaurantServiceContract` rather than constructing its concrete adapter in state/UI code**;
- **general POS flow consumes injected `PosRuntimeContract` rather than constructing the concrete mock runtime**;
- **reusable POS runtime conformance probe exercises catalog → sale → checkout → cash completion → idempotent duplicate completion → receipt listing**;
- **React-state injection proof observes data supplied by an injected runtime catalog**.

Every new branch head must pass UI-manifest integrity, TypeScript, Vitest and production build before being called technically clean. CI does not prove visual correctness.

---

# 15. Manifest status

- `POS-FLOW-001` — original retail cash slice: implemented.
- `POS-FLOW-002` — Restaurant Local Service Prototype: **implemented mock/local; iterative owner review**.
- `POS-FLOW-006` — tablet sale-page layout: implemented.

Still pending separate authorization/production proof:

1. real integrated-card/Mada capability;
2. production restaurant persistence/KDS/printer/multi-device semantics beyond POS-FLOW-002 mock scope;
3. incoming online-order/manual-delivery fallback flow and delivery connector contract;
4. first production implementations behind `PosRuntimeContract` and `RestaurantServiceContract`.

---

# Other Rifad surfaces

- Back Office: ⬜ — future owner of restaurant/place/channel/pricing/connector configuration.
- Dashboard: ⬜ — future channel/settlement reporting.
- KDS: ⬜ — current POS-FLOW-002 only records mock preparation revision; no real KDS transport.
- CDS: ⬜

---

# Exact current checkpoint

Rifad is **not UI-complete** and not production-backend-complete.

Current checkpoint:

> **A substantial touch-first POS prototype with owner-accepted sales/basket/payment spatial continuity, Clear Cart, customer/debt workflows and mock card validation, plus an executable Restaurant Local Service prototype with retail/off, simple Local checkout, generic PlaceGroup → ServicePlace selection, six default tables, Open Orders, reserved-place reopen/send-update, and place release after payment. Both restaurant local service and the general POS runtime are now dependency-injected behind Rifad-owned contracts and isolated from concrete mock implementations. The next architecture/product step is no longer adapter separation; it is to select and prove the first production implementations behind those boundaries, beginning with the local-first sales/order persistence and restaurant-service engine.**
