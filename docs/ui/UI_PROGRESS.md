# Rifad UI Progress Record

Last updated: 2026-08-17

This is the living execution record for the current Rifad interface phase. It answers:

1. What is actually implemented now?
2. What visual/product direction has been accepted?
3. What remains mock, incomplete, or structurally inconsistent?
4. What data gaps have already been exposed by UI/product research?

See `POS_UI_NAMING_AND_FIELD_REGISTER.md` for canonical terminology and durable-field traceability.

## Status legend

- ✅ **Implemented and behavior-tested**
- 👁 **Owner visually reviewed/accepted for the stated point**
- 🟡 **Product/visual direction active; implementation/final visual review open**
- ⚠️ **Known contract/data/integration gap**
- ⬜ **Not implemented in current executable UI**

---

# Current working state

- Repository: `mhmdacs-collab/rifad-004`
- Active branch: `agent/pos-visual-pass-01`
- Active PR: **#2**
- PR: **Open + Draft + not merged**
- Target: `main`
- Do not merge until owner explicitly approves.

The executable POS is a Rifad-owned React/TypeScript/Vite UI using Rifad contracts with mock/local runtime. Production database, synchronization, fiscal transport, printer/KDS transport, real payment terminal and real delivery-platform integration are not implied by current visual behavior.

---

# Current binding UX principle

> **Touch first, then human visual clarity, then beauty.**

Current rules:

- frequent controls target roughly 48px+ when space permits;
- short displays retain about 44–48px important targets;
- change layout/density before shrinking important touch controls;
- money and next action must read at normal cashier viewing distance;
- large POS, 1366×768, tablet landscape, short-height and mobile/narrow layouts all matter;
- frequent completion actions stay outside normal-path scrolling when practical;
- sale/payment/success use one stable two-slot operation card and shared desktop/tablet rail width;
- physical action slots stay fixed even when state-specific green priority changes;
- embedded POS keypads are preferred for repeated numeric touch entry;
- dynamic keypad validation reserves stable geometry.

See `DESIGN_AUTHORITY.md` and D-021/D-022.

---

# 1. Entry and employee session

Status: ✅

Implemented device/account sign-in shell, employee PIN unlock, transition to sales session and restoration of currently supported mock-local state. No production identity backend is claimed.

---

# 2. Sales workspace

Status: ✅ 👁

Implemented/iterated:

- RTL-first tablet/desktop shell;
- product grid and configurable sale pages;
- basket rail;
- Saudi-riyal presentation;
- Cairo treatment for selected Arabic headers/tabs;
- whole product cards as touch targets;
- responsive product grid;
- editable ticket lines;
- sale-page create/place/remove/rename/reorder/delete UI;
- responsive/mobile ticket surface;
- touch audit across header/cards/tabs/ticket/actions.

Accepted direction:

- product card carries identity/name plus unit-price footer;
- basket emphasizes `quantity × product name → row total`;
- repeated product addition emphasizes quantity feedback;
- active transaction action is obvious without moving footer geometry;
- density never wins over finger reliability.

The executable sale footer still contains prototype **حفظ**. Restaurant-service direction replaces this meaning with **محلي** when restaurant service is enabled; implementation is pending.

## Sales modes

- **شاشة لمس** — touch/page grid;
- **البيع السريع** — search/barcode-first mode.

Legacy cashier-facing **شاشة أساسية** is removed; internal `basic` may remain.

## Quick Sale

Status: ✅ 👁

- search is primary;
- whole result rows are large touch targets;
- name/price scan quickly;
- long names wrap instead of shrinking;
- result scrolling is isolated;
- scanner/keyboard focus is preserved/restored;
- constrained layouts rearrange spacing before shrinking useful targets.

⚠️ Product still lacks real SKU/barcode identity; mock search currently matches name only.

---

# 3. Ticket, quantity and Clear Cart

## Basket

Status: ✅ 👁

Accepted:

- row = `quantity × product → row total`;
- unit price is not repeated as competing basket information;
- `1000×` remains readable;
- long names may use a second line;
- only item list scrolls;
- totals/required context/**دفع** stay outside item-list scroll;
- short screens reduce spacing before touch size;
- mobile follows same action-reachability rule;
- **مسح السلة** appears from first item inside basket body after ticket header and before product lines;
- visible Clear Cart copy = delete icon + **مسح السلة** only;
- Clear Cart never changes header/footer geometry.

## Quantity editor

Status: ✅ 👁

- whole row opens editor;
- large `+ / −`;
- direct numeric entry;
- embedded keypad `1–9`, `0`, `00`, backspace;
- hardware keyboard remains supported;
- destructive **حذف** separated from confirmation;
- one **حفظ** commits quantity;
- automated evidence covers quantity 1000.

---

# 4. Current order-type prototype versus target service model

Status: ✅ prototype / ⚠️ superseded product meaning / 🟡 replacement not implemented

Current executable UI can expose **محلي / سفري / توصيل** as a temporary selector controlled by a device preference.

This is **not** the target permanent workflow.

Current owner-directed target has two restaurant configuration layers:

### Restaurant service OFF

- retail/direct POS behavior;
- no forced restaurant **محلي / سفري** terminology;
- normal sale simply uses **دفع**.

### Restaurant service ON + place management OFF

Simple restaurant:

- non-empty basket shows target **محلي | دفع**;
- direct **دفع** = restaurant **سفري** preparation without extra tap;
- **محلي** marks dine-in/local and proceeds to checkout;
- no table/room/session selector.

### Restaurant service ON + place management ON

Advanced restaurant:

- non-empty basket target = **محلي | دفع**;
- **محلي** opens area/place selection;
- selecting place sends kitchen/local order, clears working basket and keeps an open local order;
- payment may happen before or after dining.

Target durable meaning is `fulfillmentMode`, separate from channel and payment/collection.

⚠️ None of these durable restaurant/configuration fields exist yet.

---

# 5. Inline checkout and operation-card continuity

Status: ✅ 👁

Accepted progression:

> `basket → payment methods → cash/card → success`

Catalog remains visible but frozen during checkout.

Sale basket and checkout/success rail share the same desktop/tablet width, eliminating the subtle horizontal jump after **بيع جديد**.

Current executable physical sequence:

- sale: **حفظ | دفع**;
- Quick Sale empty: **سداد | دفع**;
- cash: **إلغاء الفاتورة | سداد**;
- mock card: **إلغاء الفاتورة | تم الدفع**;
- success: **طباعة | بيع جديد**.

Owner accepted exact shared width/columns/padding/gap/button height/bottom placement.

Advanced restaurant target when basket empty + open local orders:

- **طلبات مفتوحة · N** in right slot becomes green/primary;
- disabled **دفع** stays in left slot but becomes neutral/silver;
- geometry does not move.

---

# 6. Payment-method selection

Status: ✅ 👁

Current cards: **نقدًا** and **شبكة / مدى**.

Large touch surfaces use text + strong visual recognition.

⚠️ Current card path is mock UX only. Real Mada requires provider/terminal adapter, durable normalized payments, failure/recovery, reconciliation/refund and security evidence.

---

# 7. Cash payment

Status: ✅ 👁

- received amount strongest editable value;
- total readable but secondary;
- redundant helper/clear removed;
- four predictable quick tender targets;
- POS keypad;
- `الباقي للعميل` calm read-only result;
- **سداد** dominant filled action;
- no normal-path scrolling required to reach completion;
- short screens reduce spacing before touch size.

---

# 8. Card/network mock

Status: ✅ mock behavior-tested / ⚠️ production terminal absent

Can select **شبكة / مدى**, complete mock transaction and store `paymentMethod: "card"`.

No claim for terminal discovery, acquiring connectivity, approvals/RRN, settlement, reconciliation, refunds or production payment security.

---

# 9. Sale success and printing

Status: ✅ 👁 / printing history ⚠️

Accepted:

- success remains in basket-rail context;
- receipt facts readable at cashier distance;
- cash change is hero fact when applicable;
- **بيع جديد** stronger than print;
- **طباعة | بيع جديد** shares exact operation geometry/rail width;
- always-print preference is a quickly scannable printer row.

Implemented receipt history, newest-first list, mock print/reprint, explicit confirmation before retrying `delivery-unknown`, and device-local always-print preference.

⚠️ Durable per-receipt print-job history not implemented.

---

# 10. Customer system

Status: ✅ 👁

Implemented:

- attach/remove customer;
- live name/mobile search;
- whole-row touch results;
- create/edit;
- Saudi mobile exactly 10 local digits starting 05;
- quick create: name + mobile + optional address;
- additional information = **three real columns** desktop/wide, one column narrow/mobile;
- email/address/city/region/postal/country/customer code/note/tax number;
- current mock preserves tax number;
- customer form completion action remains reachable while optional fields scroll.

Tax-number presence does not itself mean production ZATCA compliance.

---

# 11. Credit/debt

Status: ✅ 🟡

Quick Sale:

- cart with items → **آجل**;
- empty cart → **سداد**.

Debt settlement includes search/history, full/default settlement, partial keypad, hardware keyboard, exact halala parsing, invalid/over-balance prevention and duplicate-submit protection.

Stable feedback card prevents keypad/action movement while editing. Successful settlement remains visible with before/paid/remaining summary until explicit **تم**.

Still unscoped: settlement payment method, due dates/aging, credit limits, permissions, statement export.

---

# 12. Loyalty

Status: ✅ contract/model direction / 🟡 visual completeness

Current concepts include program configuration, balance/status, redemption quote, applied redemption, earned value and purchase history. Production should eventually use durable loyalty transactions rather than mutable balances alone.

---

# 13. Restaurant service/place/open-order direction

Status: 🟡 owner-directed + market-researched / ⬜ not implemented / ⚠️ manifest/data gaps

Research:

- `docs/research/restaurant-pos/RESTAURANT_SERVICE_AND_CHANNEL_BENCHMARK_2026-08-17.md`
- `visual-decisions/VISUAL-DECISION-006-RESTAURANT-SERVICE-OPEN-ORDERS.md`

Current direction:

- restaurant-service semantics can be enabled/disabled independently from advanced place management;
- retail/direct mode does not show restaurant concepts;
- simple restaurant can use **محلي** without selecting a table;
- direct restaurant **دفع** means **سفري** by default;
- advanced place mode uses Service Areas such as الصالة/الدور الأول/الغرف/الجلسات الخارجية and places such as طاولة/غرفة/جلسة;
- assigning an advanced local place creates an open order, sends kitchen work and clears working basket;
- payment timing is independent of dine-in fulfillment;
- later additions/voids require preparation deltas rather than duplicate full tickets;
- advanced open orders use **طلبات مفتوحة** shortcut;
- persistent service/place configuration should move to Back Office later.

No restaurant code is authorized from discussion alone. Manifest/contract scope is required first.

---

# 14. Delivery channels, APIs and online-order UX

Status: 🟡 researched product/architecture direction / ⬜ no Rifad production connector

New official research:

- `docs/research/restaurant-pos/DELIVERY_PLATFORM_INTEGRATION_BENCHMARK_2026-08-17.md`

Verified current evidence:

- HungerStation publishes Partner APIs for catalog/order operations and real-time webhooks, with partner credentials/onboarding required;
- Keeta publishes order, menu, store and webhook APIs with merchant/software authorization and menu pricing/availability capabilities;
- Jahez has integration portal/evidence of API integrations, but Rifad production access/specification still needs commercial verification;
- Ninja public partner integration specification was not verified in this research pass;
- Foodics supports direct platform integrations and also aggregator/order-management apps;
- systems such as Deliverect/UrbanPiper/Grubtech demonstrate one normalized multi-platform order/menu layer.

Target Rifad architecture:

- support direct platform adapters **and** aggregator adapters behind one Rifad-owned capability contract;
- adapters declare supported capabilities rather than forcing every platform into one identical API;
- one cashier online-order experience, many adapters behind it.

Target cashier behavior for API-connected orders:

- external order arrives automatically with channel, order reference, prices and payment/collection state;
- cashier does **not** select the platform again or retype the order;
- branch may configure auto-accept + auto-send to kitchen;
- prepaid platform order does not require cash/Mada collection again;
- cash/card on delivery/pickup stays unpaid until actual collection;
- manual `كيتا / هنقرستيشن / ...` tiles remain useful only for unconnected/fallback/manual-entry scenarios.

Target compact queue identity can read like:

- **كيتا · مدفوع**;
- **هنقرستيشن · نقد عند الاستلام**;
- **جاهز · مدفوع**.

Channel-specific pricing remains separate from commission/settlement. API-connected orders preserve actual external sold price snapshots; manually created platform sales use configured channel pricelist and must visibly show any total change before completion.

⚠️ No production delivery integration is currently claimed.

---

# 15. Configuration ownership

Current executable preferences:

- sale mode;
- temporary visible order-type selector;
- print receipt always.

Target structured configuration includes:

- `restaurantServiceEnabled`;
- `servicePlaceManagementEnabled`;
- service areas/places;
- allowed sales channels;
- channel pricelists;
- delivery connector/store mapping;
- online-order auto-accept/send-to-kitchen policy.

Temporary POS settings are acceptable for UI-first proof. Persistent business-sensitive configuration and credentials should move to Back Office and should not remain ordinary-cashier controls.

---

# 16. Highest-priority data/integration gaps

1. durable `fulfillmentMode` replacing temporary order-type meaning;
2. two-level restaurant configuration: service semantics + optional place management;
3. service areas/places + advanced open-order lifecycle;
4. `salesChannelId` and channel configuration;
5. channel-aware pricelist/product overrides + effective price evidence;
6. capability-based delivery adapter contract supporting direct/aggregator implementations;
7. external order IDs/mappings/payment-collection/webhook-idempotency evidence;
8. platform settlement/reconciliation evidence separate from till payment;
9. kitchen dispatch revision/delta/idempotency;
10. real SKU/barcode identity/search;
11. durable checkout/payment records and idempotency;
12. stable employee/branch/device IDs on receipts;
13. print-job history;
14. structured business/device configuration;
15. legitimate Mada/card references without prohibited sensitive card data.

---

# 17. Automated evidence

Current branch coverage includes:

- normal cash sale;
- sale-page editing;
- current prototype order-type gate;
- always-print/receipt recovery;
- customer attachment/details/tax persistence;
- exact 10-digit local mobile constraint;
- Quick Sale focus behavior;
- debt settlement + duplicate-submit protection;
- stable partial-settlement feedback and explicit success **تم**;
- credit sale customer reuse;
- quick-cash suggestions;
- mock card completion;
- quantity keypad entry of 1000;
- Clear Cart position/minimal copy/outside transaction footer;
- unpaid checkout cancellation to fresh sale without receipt;
- stable operation-card geometry across sale/checkout stages.

Restaurant service/place and delivery API directions have **no executable behavior evidence yet**.

Every new branch head must pass TypeScript, Vitest, production build and UI-manifest integrity before being called technically clean. CI does not prove visual correctness.

---

# 18. Naming state

Current:

- **شاشة أساسية** → **البيع السريع**;
- general checkout = **دفع**;
- cash/debt completion = **سداد**;
- basket bulk clear = **مسح السلة**;
- obsolete cash **بالضبط** removed.

Target restaurant terminology:

- **محلي** = local fulfillment; simple mode goes to checkout, advanced mode goes to place selection;
- **طلبات مفتوحة** = advanced local orders/places only;
- **سفري** = restaurant direct-sale fulfillment default;
- **توصيل** = delivery fulfillment, often carried by platform order/channel.

---

# 19. Manifest reconciliation required

`POS-FLOW-001` remains original cash-only binding slice while active branch includes owner-directed experiments.

Pending distinct authorizations:

1. card/integrated-payment scope before production terminal claim;
2. restaurant service/place/open-order flow;
3. incoming online-order/manual-delivery fallback flow and delivery adapter contract.

Do not silently implement these by editing current components without manifest/contract scope.

---

# 20. Other Rifad surfaces

- Back Office: ⬜ — future owner of service/place/channel/pricing/connector configuration.
- Dashboard: ⬜ — future channel/settlement reporting.
- KDS: ⬜ — future fulfillment/place/channel preparation context.
- CDS: ⬜

---

# Exact current checkpoint

Rifad is **not UI-complete** and not production-backend-complete.

Current checkpoint:

> **A substantial touch-first POS prototype with owner-accepted sales/basket/payment spatial continuity, minimal one-touch Clear Cart, three-column desktop customer entry, stable customer/debt numeric workflows and mock card validation; plus a now-documented restaurant model with optional service semantics, optional advanced place management, and a researched delivery-integration model where one online-order cashier experience can be backed by direct or aggregator adapters. These restaurant/delivery directions are not yet implemented or manifest-authorized.**

Immediate design/product work is not a final closeout. Major remaining surfaces include simple local checkout behavior, advanced area/place selection and open orders, and the unified online-order/payment/channel presentation. Only after these are settled should the branch enter final responsive closing audit.
