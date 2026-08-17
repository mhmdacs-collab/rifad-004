# Rifad UI Progress Record

Last updated: 2026-08-17

This is the living execution record for the current Rifad interface phase. It answers:

1. What is actually implemented now?
2. What visual/product direction has been accepted?
3. What remains mock, incomplete, or structurally inconsistent?
4. What data gaps have already been exposed by the UI/product discussion?

For canonical cashier-facing terminology and data-field traceability, see `POS_UI_NAMING_AND_FIELD_REGISTER.md`.

## Status legend

- ✅ **Implemented and behavior-tested**
- 👁 **Owner visually reviewed/accepted for the stated point**
- 🟡 **Product/visual direction active; implementation or final visual review still open**
- ⚠️ **Known contract/data/integration gap**
- ⬜ **Not implemented in the current executable UI**

---

# Current working state

- Repository: `mhmdacs-collab/rifad-004`
- Active UI branch: `agent/pos-visual-pass-01`
- Active PR: **#2**
- PR state: **Open + Draft + not merged**
- Target: `main`
- `main` remains intentionally untouched while visual/product iteration continues.
- Do not merge PR #2 until the owner explicitly approves the branch for merge.

The executable POS is a Rifad-owned React/TypeScript/Vite UI using Rifad contracts with a mock/local runtime. Production database, synchronization, fiscal transport, printer/KDS transport and real payment-terminal/delivery-platform integration are not implied by the visual prototype.

---

# Current binding UX principle

The owner-approved priority is:

> **Touch first, then human visual clarity, then beauty.**

Current implementation rules:

- frequent controls target roughly 48 px+ when space permits;
- short displays retain approximately 44–48 px important targets instead of collapsing to desktop controls;
- change layout before shrinking touch targets;
- money and next-action hierarchy are judged from real cashier viewing distance;
- responsive QA considers large POS, 1366×768, tablet landscape, short-height POS and narrow/mobile layouts;
- frequent transaction-completion actions must not be hidden behind normal-path vertical scrolling;
- **primary actions use a stable footer/action band outside scrolling content whenever practical**;
- sale/payment/success use one stable two-slot transaction card and a shared desktop/tablet rail width;
- physical action slots stay fixed even if the green visual priority intentionally changes for a different state;
- when a dedicated numeric-entry surface has room, use an embedded POS keypad for touch while retaining hardware-keyboard support;
- live validation/result text near repeated keys must reserve stable geometry so the keypad/action does not jump while the cashier types.

See `DESIGN_AUTHORITY.md` and architecture decisions D-021/D-022.

---

# 1. Entry and employee session

Status: ✅

Implemented device/account sign-in shell, employee PIN unlock, transition to POS sales session, and restoration of currently supported mock-local state. No production identity backend is claimed.

---

# 2. Sales workspace

Status: ✅ 👁

Implemented and iterated:

- RTL-first tablet/desktop sales shell;
- product grid and configurable sale pages;
- current basket rail;
- Saudi-riyal presentation;
- Cairo treatment for selected Arabic headers/tabs;
- whole product cards as touch targets;
- responsive product-grid behavior;
- editable ticket lines;
- sale-page create/place/remove/rename/reorder/delete UI;
- responsive/mobile ticket surface;
- touch audit for header controls, cards, tabs, ticket rows and primary actions.

Accepted direction:

- product card carries identity/name plus unit-price footer;
- basket emphasizes `quantity × product name` and row total rather than repeating unit price;
- repeated product addition emphasizes quantity feedback;
- the active primary transaction action is visually obvious without moving the two-slot footer;
- density never increases at the cost of reliable finger targeting.

The current executable sale footer still contains a prototype generic **حفظ** action. New restaurant research/product direction says that when table/local service is enabled this is targeted to become **محلي**, not remain a generic Save command.

## Sales modes

- **شاشة لمس** — touch/page grid;
- **البيع السريع** — search/barcode-first retail mode.

Legacy cashier-facing **شاشة أساسية** is removed from semantic UI; internal persisted `basic` remains for compatibility.

## Quick Sale

Status: ✅ 👁

Latest owner-reviewed direction:

- search is the primary visual task;
- result rows are whole-row large touch targets;
- product name and price are faster to scan;
- names can wrap rather than shrink unreadably;
- result scrolling is isolated to results;
- scanner/keyboard focus is preserved and restored;
- 1366×768, short-height and mobile compositions rearrange/compact spacing before shrinking useful targets.

⚠️ Catalog data gap remains: Product has no real SKU/barcode identity and mock search matches name only. UI polish is not a barcode-backend claim.

---

# 3. Ticket, quantity, clear-cart and fulfillment prototype

## Basket

Status: ✅ 👁

Accepted:

- row reads `quantity × product → row total`;
- unit price is not repeated as competing information;
- large quantities such as `1000×` remain readable;
- long names may use a second line;
- **only the item list scrolls**;
- tax/totals, required order context and **دفع** remain outside the item-list scroll;
- short screens reduce spacing before important target size;
- mobile follows the same action-reachability rule;
- **مسح السلة** appears from the first item as a dedicated lighter-red row **inside the basket body after the ticket header and before product lines**;
- visible Clear Cart copy is only **مسح السلة** beside the delete icon; redundant explanation and `الكل` badge are removed;
- Clear Cart never changes the ticket header or transaction-footer geometry.

## Quantity editor

Status: ✅ 👁

- whole basket row opens editor;
- large `+ / −` targets;
- direct numeric entry;
- embedded keypad `1–9`, `0`, `00`, backspace;
- no system soft keyboard required for touch use;
- hardware keyboard remains supported;
- destructive **حذف** separated from confirmation;
- one **حفظ** performs the quantity write after editing;
- automated evidence covers quantity **1000** through the embedded keypad.

Keypad/focus/pressed state is UI-only; durable business truth remains TicketLine `quantity`.

## Current order-type prototype

Status: ✅ prototype / ⚠️ target model superseded / 🟡 replacement design pending implementation

Current executable UI can expose **محلي / سفري / توصيل** as an order-type selector and has a temporary device preference controlling visible types.

That is **not the target restaurant interaction anymore**.

Current owner-directed product interpretation:

- direct sale defaults to **سفري** for kitchen fulfillment without another cashier tap;
- **محلي** is an explicit action because it assigns an open order to a service place;
- **توصيل** is normally established from the delivery sales-channel/order path;
- durable target field is `fulfillmentMode`, separate from `salesChannelId` and payment/settlement.

⚠️ None of those durable restaurant/channel fields exist in the executable model yet.

---

# 4. Inline checkout

Status: ✅ 👁

Accepted progression:

> `basket → payment methods → cash/card → success`

The basket rail transforms while the catalog remains visible as frozen spatial context. The catalog is intentionally non-interactive during checkout.

The sale basket and checkout/success rail now share the same desktop/tablet width, removing the small horizontal action jump that was visible after **بيع جديد**.

---

# 5. Transaction operation card

Status: ✅ 👁

Current executable physical sequence:

- **حفظ | دفع**;
- cash: **إلغاء الفاتورة | سداد**;
- mock card: **إلغاء الفاتورة | تم الدفع**;
- success: **طباعة | بيع جديد**.

Quick Sale empty ticket keeps **سداد | دفع**, with disabled Pay still visible.

Owner visually accepted the requirement that these pairs reuse the same physical columns, width, padding, gap, touch height and bottom placement rather than being merely similar.

Restaurant extension, not implemented yet:

- non-empty restaurant basket with table service enabled: **محلي | دفع**;
- empty basket with open local orders: **طلبات مفتوحة · N | دفع**;
- in that empty/open-order state, **طلبات مفتوحة** becomes green/primary in the right slot and disabled **دفع** becomes neutral/silver in the left slot; geometry does not move.

---

# 6. Payment-method selection

Status: ✅ 👁

Current cards: **نقدًا** and **شبكة / مدى**.

Each is a large touch surface using text plus method-specific visual recognition. The current شبكة/مدى path is a **mock UX/payment path**, not real terminal evidence.

⚠️ Production Mada requires provider/terminal adapter evidence, durable normalized payment data, failures/recovery, reconciliation/refund scope and security/compliance review.

---

# 7. Cash payment

Status: ✅ 👁

Accepted cash direction:

- received amount is the largest editable value;
- known total remains readable but secondary;
- redundant helper sentence and separate clear button removed;
- four large predictable quick tender targets;
- POS-style keypad;
- `الباقي للعميل` is a calm read-only result with light/outlined treatment;
- **سداد** is the dominant filled action;
- normal path reaches **سداد** without downward scrolling;
- shorter screens reduce vertical spacing before touch size.

Current quick-cash ladder is predictable higher 5 → higher 10 → higher 50 → higher 100/500 as needed, deduplicated. Obsolete **بالضبط** is removed from component markup.

---

# 8. Card / network mock payment

Status: ✅ mock behavior-tested / ⚠️ production terminal absent

The branch can select **شبكة / مدى**, complete the mock transaction and persist `paymentMethod: "card"`.

No claim exists for real terminal discovery, acquiring provider connectivity, authorization/decline transport, RRN/approval references, settlement, reconciliation, refunds or production payment-security scope.

Manifest reconciliation is still required before any production integrated-payment claim.

---

# 9. Sale success and printing preference

Status: ✅ 👁

Accepted sale-success direction:

- stays in basket-rail spatial context;
- success result and receipt facts are readable at cashier distance;
- cash change is the hero fact when applicable;
- **بيع جديد** is dominant over print;
- **طباعة | بيع جديد** shares the exact operation-card geometry/rail width used by the sale footer;
- print preference is a quickly scannable row with printer icon, **طباعة الإيصال دائمًا** + secondary **في العمليات القادمة**, larger checkbox and whole-row target;
- active preference gets a restrained green cue.

---

# 10. Receipts and printing

Status: ✅ 🟡 ⚠️

Implemented receipt history, mock-local receipt list, newest-first display, print/reprint action, explicit confirmation before retrying `delivery-unknown`, and device-local always-print preference.

⚠️ Historical print delivery is not persisted as durable per-receipt print-job history.

---

# 11. Customer system

Status: ✅ 👁

Current behavior/model supports:

- attach/remove one customer on ticket;
- live search by name/mobile;
- whole-row touch results;
- create/edit customer;
- Saudi mobile format enforced in create/edit as exactly **10 local digits starting with 05** without consuming normal-path space with redundant helper copy;
- quick-create fields prioritize:
  - customer name;
  - mobile;
  - optional address;
- additional information on wider screens now uses **three real grid columns**, matching the quick-information density, and collapses to one column on narrow/mobile screens;
- optional customer data includes email, address, city, region, postal code, country, customer code, note and tax number;
- tax number is preserved by the current model/mock persistence for future invoice/fiscal use;
- tax-number presence does not itself mean ZATCA invoice compliance is finished;
- customer profile/purchase-history/email-receipt directions remain available.

Customer creation actions use a footer-like stable action row within the form so optional fields can scroll without losing the creation action.

---

# 12. Credit / debt

Status: ✅ 🟡

Quick Sale behavior:

- cart has items → **آجل**;
- cart empty → **سداد**.

Credit sale:

- requires/reuses customer;
- creates completed credit receipt;
- debt ledger receives debit entry;
- exact money amount updates customer debt.

## Debt settlement

Current behavior:

- customer search and debt history;
- full settlement is fastest default;
- partial settlement uses embedded numeric keypad plus hardware-keyboard support;
- exact halala parsing;
- zero/invalid/over-balance blocked;
- duplicate-submit protection;
- account history scrolls while the settlement region remains anchored below it;
- remaining balance + validation live inside one stable feedback card while editing partial payment;
- the feedback card keeps fixed geometry across ready/error states so keypad/**سداد** do not move;
- successful settlement remains visible with **الرصيد قبل السداد / المبلغ المسدد / المتبقي على العميل** until explicit **تم**.

Unscoped and not to be invented silently: settlement payment method, due dates/aging, credit limits, debt permissions and statement export.

---

# 13. Loyalty

Status: ✅ contract/model direction / 🟡 visual completeness

Current concepts include program mode/name/configuration, balance/status, redemption quote, applied ticket redemption, earned value and purchase-history support.

Production persistence should use durable loyalty transaction evidence instead of mutable balance snapshots alone.

---

# 14. Restaurant local/open-order/channel direction

Status: 🟡 owner-directed + market-researched / ⬜ not implemented / ⚠️ manifest and data gaps

Research reviewed official current behavior from Loyverse, Square for Restaurants, Lightspeed Restaurant K-Series, Odoo 19 Restaurant POS and Toast kitchen routing.

See:

- `docs/research/restaurant-pos/RESTAURANT_SERVICE_AND_CHANNEL_BENCHMARK_2026-08-17.md`;
- `visual-decisions/VISUAL-DECISION-006-RESTAURANT-SERVICE-OPEN-ORDERS.md`.

Current direction:

- table/local service is configurable on/off;
- direct POS sale defaults to kitchen fulfillment **سفري**;
- with local service enabled, **محلي** replaces generic **حفظ** for a basket with items;
- **محلي** opens service-area/place selection;
- service area examples: الصالة، الدور الأول، الغرف، الجلسات الخارجية;
- service place examples: طاولة 12، غرفة 3، جلسة 8;
- assigning the place creates an open local order, sends/prints kitchen output as local, then clears the main working basket;
- payment can happen before or after dining;
- later additions to the local order should generate only preparation deltas, not a blind duplicate full ticket;
- when the main basket is empty and open orders exist, **طلبات مفتوحة · N** becomes the useful green action while Pay remains disabled/neutral in its fixed slot;
- delivery platform identity is a **sales channel**, not merely a payment method;
- fulfillment, sales channel and payment/settlement remain separate durable meanings;
- channel-specific prices/pricelists are required, with the changed total visible before completion;
- platform commission is separate from customer-facing product price.

Recommended local selector direction is a semantic spatial view: area tabs + large place cards arranged approximately like the physical venue on wide screens, with list/card fallback on mobile. Do not sacrifice touch/readability for decorative furniture graphics.

No restaurant code is authorized by this discussion alone. A new bounded manifest flow is required first.

---

# 15. Device/configuration direction

Current executable preferences:

- sale screen mode;
- temporary visible order-type selector configuration;
- print receipt always.

Target restaurant/configuration additions:

- `tableServiceEnabled`;
- service areas/places;
- allowed sales channels;
- channel pricelist mapping.

Persistent business configuration is expected to move to structured Rifad config/Back Office. Temporary POS settings are acceptable during UI-first discovery only when clearly marked as staging.

---

# 16. Data gaps exposed by UI/product work

Highest-priority open gaps now include:

1. durable `fulfillmentMode` replacing the temporary order-type selector meaning;
2. `salesChannelId` and channel configuration;
3. table-service enablement, service-area/place identity and open-order lifecycle;
4. channel-aware prices/pricelists and effective-price evidence;
5. kitchen dispatch/revision/delta/idempotency evidence;
6. real SKU/barcode identity/search;
7. durable checkout/payment records and idempotency evidence;
8. stable employee/branch/device IDs on completed receipts;
9. receipt print-job history/status;
10. structured local/device/business configuration;
11. legitimate Mada/card transaction references without prohibited sensitive card data.

The customer `taxNumber` field is represented in the executable customer model/mock persistence; fiscal semantics still require the future fiscal contract.

---

# 17. Automated evidence

Current branch behavior coverage includes:

- normal cash sale;
- sale-page editing;
- current prototype order-type gate;
- always-print/receipt recovery;
- customer attachment and receipt carry-through;
- optional customer details persistence;
- exact 10-digit local mobile input constraint;
- tax-number persistence;
- Quick Sale focus behavior;
- debt settlement and duplicate-submit protection;
- stable partial-settlement feedback containing remaining balance and invalid-state messaging;
- readable settlement success retained until explicit **تم**;
- credit sale reuse of attached customer;
- corrected quick-cash suggestions;
- mock شبكة/مدى completion recording a card receipt;
- direct large quantity entry and embedded quantity-keypad entry of **1000**;
- Clear Cart inside the basket before product lines with minimal copy;
- Clear Cart outside the transaction operation card;
- unpaid checkout cancellation returns to a fresh sale without creating a receipt;
- stable operation-card class/geometry across sale and checkout stages.

The restaurant local/open-order/channel direction has **no executable behavior evidence yet**.

Every new branch head must pass TypeScript, Vitest, production build and UI-manifest integrity before being called technically clean. CI proves code/document integrity, not visual correctness.

---

# 18. Naming / structural state

Completed/current:

- cashier-facing **شاشة أساسية** → **البيع السريع**;
- obsolete cash **بالضبط** removed;
- separate cash **مسح** action removed because keypad deletion owns that function;
- basket bulk clear = **مسح السلة**;
- general checkout = **دفع**;
- cash/debt completion = **سداد**.

Restaurant target terminology:

- **محلي** = assign current basket to local service place/open order;
- **طلبات مفتوحة** = reopen local orders/places;
- **سفري** = default direct-sale kitchen fulfillment;
- **توصيل** = delivery fulfillment, normally associated with a delivery sales channel.

---

# 19. Manifest reconciliation required

`POS-FLOW-001` remains the original cash-only binding slice while the current branch includes additional owner-directed product experiments.

Two separate reconciliations remain:

1. mock/integrated card scope before any production payment claim;
2. a new restaurant local/open-order/channel flow before implementing the newly documented restaurant direction.

Do not silently edit current components into a table system without manifest/contract scope.

---

# 20. Other Rifad surfaces

Current executable focus remains POS.

- Back Office: ⬜ — will eventually own persistent service-area/place/channel/pricing configuration.
- Dashboard: ⬜
- KDS: ⬜ — future kitchen dispatch must carry fulfillment/place/channel context.
- CDS: ⬜

Their evidence remains in research/manifest scope; this branch is stabilizing the POS interaction language first.

---

# Exact current checkpoint

Rifad is **not UI-complete** and not production-backend-complete.

Current checkpoint:

> **A substantial touch-first POS prototype with owner-accepted sales/basket/payment spatial continuity, minimal one-touch Clear Cart, three-column desktop customer entry, stable customer/debt numeric workflows and mock card validation, plus a newly market-researched restaurant model that separates direct takeaway, optional local open orders, delivery sales channels, payment and channel pricing — with the restaurant model documented but not yet implemented or manifest-authorized.**

Immediate design work is **not** a final responsive closeout. The next important design problem is the local/open-order experience itself: service-area/place selector, empty-cart/open-order action state, reopening an occupied place, kitchen-send feedback, and the channel-pricing/payment presentation. Only after these major restaurant surfaces are settled should the branch enter a final cross-screen closing audit.
