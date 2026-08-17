# Rifad UI Progress Record

Last updated: 2026-08-17

This is the living execution record for the current Rifad interface phase. It records what is executable now, what the owner has visually accepted, what is still under visual review, and which production/data gaps remain.

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

The executable POS is Rifad-owned React/TypeScript/Vite with mock/local adapters. Current UI behavior does not imply a production database, sync engine, fiscal transport, real kitchen/KDS transport, real payment terminal, or delivery-platform connector.

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

Status: ✅ behavior-tested mock / 🟡 owner visual review open / ⚠️ production persistence + kitchen transport

The old visible **محلي / سفري / توصيل** selector is no longer the target interaction. Its legacy implementation remains only for compatibility tests and is hidden/migrated in the current local-service UI.

Rifad now has two independent restaurant configuration layers in the executable mock:

## Restaurant service OFF

- retail/direct POS;
- restaurant wording is hidden from the normal sale path;
- direct **دفع** remains usable.

## Restaurant service ON + place management OFF

Simple restaurant:

- non-empty basket: **محلي | دفع**;
- direct **دفع** is operationally **سفري** without an extra tap;
- **محلي** enters the existing checkout in one touch;
- no table/room/session selector.

## Restaurant service ON + place management ON

Advanced restaurant:

- non-empty basket: **محلي | دفع**;
- **محلي** opens a service-area/place selector;
- current demo areas: **الصالة / الغرف / الجلسات**;
- current demo places include tables, rooms and sessions;
- selecting a free place stores a mock local open order, records mock kitchen revision 1, shows kitchen-send feedback, and clears the working basket;
- payment may happen later by reopening the place.

## Open-order state

Empty basket + advanced open orders:

> **طلبات مفتوحة · N | دفع**

- Open Orders becomes green in the fixed right slot;
- Pay remains in the fixed left slot, neutral/disabled;
- footer geometry does not move.

Reopening an occupied place reconstructs its stored order into the current working ticket and exposes:

> **إرسال | دفع**

- **إرسال** updates the stored open order, increments the mock kitchen revision, and clears the working basket;
- **دفع** uses the existing checkout; successful payment releases the stored place.

Open local orders prevent disabling restaurant service/place management until those orders are closed.

### Explicit prototype boundary

The new `RestaurantServiceContract` / mock adapter currently owns staging configuration, demo places, open-order snapshots, and mock kitchen revision state. It is not real KDS/printer transport and is not the final production order/table persistence model.

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

Future structured Back Office configuration should own persistent restaurant areas/places, channels/pricelists, connector/store mapping, credentials, and online-order policies. Ordinary cashiers should not control sensitive production configuration.

---

# 13. Highest-priority production/data gaps

1. durable authoritative `fulfillmentMode` on sale/order/receipt;
2. production restaurant-service + place-management configuration persistence;
3. production service-area/place/open-order lifecycle and multi-device sync;
4. durable kitchen dispatch/revision/delta/idempotency/outbox semantics;
5. `salesChannelId` and channel configuration;
6. channel-aware pricelist/product overrides + effective sold-price evidence;
7. capability-based delivery adapter contract and connector onboarding;
8. external order IDs/mappings/payment-collection/webhook idempotency;
9. platform settlement/reconciliation separate from till payment;
10. real SKU/barcode identity/search;
11. durable checkout/payment records and idempotency;
12. stable employee/branch/device IDs on receipts;
13. print-job history;
14. structured business/device configuration;
15. legitimate Mada/card references without prohibited sensitive card data.

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
- **POS-FLOW-002 advanced local: place selection → open order → clear working basket**;
- **advanced Open Orders → reopen place → Send or Pay**;
- **sending additions increments mock kitchen revision while retaining one open place**;
- **successful payment releases the open place**;
- **retail/off mode hides restaurant language**.

Every new branch head must pass UI-manifest integrity, TypeScript, Vitest and production build before being called technically clean. CI does not prove visual correctness.

---

# 15. Manifest status

- `POS-FLOW-001` — original retail cash slice: implemented.
- `POS-FLOW-002` — Restaurant Local Service Prototype: **implemented mock/local; owner visual review pending**.
- `POS-FLOW-006` — tablet sale-page layout: implemented.

Still pending separate authorization/production proof:

1. real integrated-card/Mada capability;
2. production restaurant persistence/KDS/printer/multi-device semantics beyond POS-FLOW-002 mock scope;
3. incoming online-order/manual-delivery fallback flow and delivery connector contract.

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

> **A substantial touch-first POS prototype with owner-accepted sales/basket/payment spatial continuity, Clear Cart, customer/debt workflows and mock card validation, plus the first executable Restaurant Local Service prototype: retail/off, simple Local checkout, advanced area/place selection, Open Orders, reopen/send-update, and place release after payment. The local flow is behavior-tested but still awaiting owner visual evaluation; production restaurant persistence/kitchen transport and online-delivery integration remain separate gaps.**

Immediate work is owner evaluation/refinement of the new local-service UI, not final UI closeout.
