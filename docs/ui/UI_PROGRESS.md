# Rifad UI Progress Record

Last updated: 2026-08-17

This is the living execution record for the current Rifad interface phase. It answers:

1. What is actually implemented now?
2. What visual/product direction has been accepted?
3. What remains mock, incomplete, or structurally inconsistent?
4. What data gaps have already been exposed by the UI?

For canonical cashier-facing terminology and data-field traceability, see `POS_UI_NAMING_AND_FIELD_REGISTER.md`.

## Status legend

- ✅ **Implemented and behavior-tested**
- 👁 **Owner visually reviewed/accepted for the stated point**
- 🟡 **Implemented; final visual review still open**
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

The executable POS is still a Rifad-owned React/TypeScript/Vite UI using Rifad contracts with a mock/local runtime. Production database, synchronization, fiscal transport, printer transport and real payment-terminal integration are not implied by the visual prototype.

---

# Current binding UX principle

The owner-approved priority is:

> **Touch first, then human visual clarity, then beauty.**

This has become an implementation rule, not merely a style preference.

Current touch audit rules:

- frequent controls target roughly 48 px+ when space permits;
- short displays retain approximately 44–48 px important targets instead of collapsing to desktop controls;
- change layout before shrinking touch targets;
- icons may stay visually small while their hit area grows;
- primary cashier actions receive more weight than secondary actions;
- money and next-action hierarchy are judged from real cashier viewing distance;
- responsive QA considers large POS, 1366×768, tablet landscape, short-height POS and narrow/mobile layouts.

See `DESIGN_AUTHORITY.md` for the binding interaction rule.

---

# 1. Entry and employee session

Status: ✅

Implemented:

- device/account sign-in shell;
- employee PIN unlock;
- transition to POS sales session;
- restoration of mock-local device/employee/ticket/receipt state where currently supported.

No production identity backend is claimed by this mock.

---

# 2. Sales workspace

Status: ✅ 👁 🟡

Implemented and iterated:

- RTL-first tablet/desktop sales shell;
- product grid and configurable sale pages;
- current ticket/basket rail;
- Saudi-riyal presentation;
- Cairo typography for the selected Arabic header/tab treatment;
- whole product cards as touch targets;
- responsive product-grid behavior;
- editable ticket lines;
- sale-page create/place/remove plus current rename/reorder/delete UI work;
- responsive/mobile ticket surface;
- touch-audit pass for header controls, product cards, tabs, ticket rows and primary sale actions.

Current owner-reviewed direction:

- product card carries product identity/name plus unit-price footer;
- basket emphasizes `quantity × product name` and row total rather than repeating unit price as competing information;
- repeated product addition emphasizes quantity feedback rather than moving/animating the whole row;
- **دفع** is visually stronger than **حفظ** because it is the primary frequent completion action;
- product density must not increase at the expense of finger targeting.

## Sales modes

Two device-local modes exist:

- **شاشة لمس** — touch/page grid;
- **البيع السريع** — search/barcode-first retail mode.

The legacy cashier-facing label **شاشة أساسية** has now been removed from the semantic `SalesScreen.tsx` UI. The internal persisted mode value remains `basic` for compatibility with existing device preferences; that internal value is not cashier-facing terminology.

## Quick Sale focus

Status: ✅

- product search owns focus by default;
- focus returns after item operations/dialog closure;
- scanner-first keyboard behavior is preserved.

⚠️ **Catalog data gap:** the UI promises barcode/SKU search, but the current Product model lacks `sku` and barcode fields and the mock catalog search matches name only. This is formally recorded in `POS_UI_NAMING_AND_FIELD_REGISTER.md`.

---

# 3. Ticket and order type

## Ticket

Status: ✅ 👁 🟡

Current ticket presentation includes:

- product name;
- quantity × product relationship;
- row total;
- included tax;
- grand total;
- linked customer indicator;
- last-touched line behavior;
- whole-row touch target for editing.

The earlier line-visibility/clipping problem was visually verified fixed.

## Order type

Status: ✅ ⚠️ 🟡

Visible values:

- **محلي** → `dine-in`
- **سفري** → `takeaway`
- **توصيل** → `delivery`

Behavior:

- zero enabled → selector hidden;
- one enabled → automatically selected;
- multiple enabled → cashier must choose before Save/Pay.

⚠️ **High-priority persistence gap:** selected order type remains UI-local. It is not yet a durable Ticket field carried through saved ticket → checkout → receipt.

This must be closed before order type can be called data-complete.

---

# 4. Inline checkout direction

Status: ✅ 👁

The accepted checkout interaction no longer replaces the entire sales page.

The **basket rail itself transforms** while the product catalog remains visible as frozen spatial context:

> `basket → payment methods → cash/card → success`

This preserves cashier orientation and avoids visual jumps between separate pages.

The product catalog is intentionally non-interactive while checkout is active.

---

# 5. Payment-method selection

Status: ✅ 👁

Current payment cards:

- **نقدًا**
- **شبكة / مدى**

The owner explicitly approved the stronger visual-card direction after the latest pass.

Current visual behavior:

- each payment method is a large touch card;
- recognition uses text plus strong method-specific artwork/visual container;
- card background treatment supports recognition without reducing text contrast;
- one full-width row per method while the method count is small; layout may move to multiple columns only when needed;
- payment art is presentation state, not database truth.

## شبكة / مدى status

Status: ✅ mock UX / ⚠️ production integration

`شبكة / مدى` is no longer shown as `قريبًا` or `غير متاح` in the current UX prototype.

The branch contains a testable **mock card payment path** so product interaction can be validated end-to-end and the receipt can record `paymentMethod: "card"`.

However:

> **This is not a production Mada/payment-terminal integration claim.**

Real terminal/provider support still requires a proven adapter, provider-specific result handling, reconciliation/refund requirements, durable payment records and security/compliance review.

The original `POS-FLOW-001` remains the cash-sale slice. The current card path is an owner-directed UX/mock extension and must be reconciled with the binding UI manifest before it is promoted as a production-approved integrated-payment flow.

---

# 6. Cash payment

Status: ✅ 👁 🟡

Implemented:

- ticket total prefilled as received amount;
- manual amount entry;
- four large predictable quick-cash touch targets;
- 3×4 POS-style keypad;
- under-tender blocked;
- large change result;
- dominant **سداد** action;
- completed cash receipt persisted in mock runtime.

## Final touch pass — implemented, owner visual review pending

The latest cash pass applies the touch-first hierarchy directly to the tender screen:

1. **المبلغ المستلم** is now the largest editable number on the screen and visually outranks the already-known ticket total;
2. the ticket total remains prominent but uses less vertical/typographic weight than the cashier input;
3. the four quick amounts are full touch targets rather than small chips;
4. keypad keys are larger, more separated and provide stronger press feedback;
5. **الباقي للعميل** is treated as the cashier's result and becomes a strong green result card once the received amount is valid;
6. **سداد** remains directly after the result as the dominant completion target;
7. tall screens receive more finger room, while 1366×768/short screens reduce spacing before reducing important target size;
8. mobile/narrow layouts preserve large quick amounts and keypad targets.

This final cash presentation is implemented but still requires owner visual review before being called visually frozen.

## Current quick-cash rule

The old special-case rule that injected **120** near totals around 100–120 was removed.

Current predictable ladder:

> nearest higher 5 → higher 10 → higher 50 → higher 100/500 as needed, de-duplicated.

Examples:

- **102 → 105 / 110 / 150 / 200**
- **108 → 110 / 150 / 200 / 500**
- **126 → 130 / 150 / 200 / 500**
- **54 → 55 / 60 / 100 / 500**

The exact total is already prefilled.

The obsolete **بالضبط** shortcut has been removed from the component markup; it is no longer retained as a hidden control.

---

# 7. Card / network mock payment

Status: ✅ mock behavior-tested / ⚠️ production terminal absent

The mock path supports:

1. choose **شبكة / مدى**;
2. enter a card-payment confirmation surface;
3. complete the mock transaction;
4. persist a receipt with `paymentMethod: "card"`;
5. show sale success.

This exists to validate the POS experience and data shape before choosing/implementing a real terminal adapter.

No claim is made yet for:

- real Mada terminal discovery/pairing;
- acquiring bank/provider connectivity;
- authorization/decline transport;
- real terminal references/RRN/approval codes;
- settlement/reconciliation;
- card refund;
- production PCI/payment security scope.

Those fields are reserved in the UI field register so the production data model does not forget them.

---

# 8. Success rail

Status: ✅ 🟡

Current direction:

- success stays in the same basket rail spatial location;
- success mark/title are larger;
- receipt facts use clearer rows;
- money is larger and more scannable;
- **الباقي** is the hero result for cash sales;
- print preference is a large touch row;
- **بيع جديد** is visually/touch-wise dominant over **طباعة** because it is the common next action;
- vertical space is used rather than leaving a tiny desktop summary floating at the top of a large rail.

The latest enlarged/touch-audited success layout should still receive one final owner screenshot review before design freeze.

---

# 9. Receipts and printing

Status: ✅ 🟡 ⚠️

Implemented:

- receipt history entry;
- mock-local persisted receipt list;
- newest-first display;
- print/reprint action;
- explicit confirmation before retrying `delivery-unknown`;
- device-local **طباعة الإيصال دائمًا** preference;
- auto-print flow starts a new sale without relying on an effect that might double-submit under React StrictMode.

⚠️ Known gap:

Historical print-delivery state is not yet persisted as durable print-job history per receipt.

This is listed as a required production data field family in `POS_UI_NAMING_AND_FIELD_REGISTER.md`.

---

# 10. Customer system

Status: ✅ / 🟡 depending on surface

Current model and UI support:

- attach/remove one customer on ticket;
- live search by name/mobile;
- create customer;
- Saudi mobile normalization;
- optional customer fields:
  - email;
  - address;
  - city;
  - region;
  - postal code;
  - country;
  - customer code;
  - note;
- customer profile direction;
- purchase history direction;
- customer email receipt path.

The field register makes these fields explicit so future DB work cannot drop optional customer information merely because it is not visible on every transaction.

---

# 11. Credit/debt

Status: ✅ 🟡

Quick Sale behavior:

- cart has items → **آجل**;
- cart empty → **سداد** for debt settlement.

Credit sale:

- requires customer;
- can reuse attached customer;
- creates completed credit receipt;
- debt ledger receives debit entry;
- customer debt changes by exact money amount.

Debt settlement:

- customer search;
- debt balance/history;
- full settlement default;
- partial amount edit;
- exact halala parsing;
- over/zero/invalid blocking;
- duplicate-submit protection.

Unscoped and not to be invented silently:

- settlement payment method;
- due dates/aging;
- credit limit;
- debt permissions;
- statement export.

---

# 12. Loyalty

Status: ✅ contract/model direction / 🟡 visual completeness

Current Rifad loyalty concepts include:

- program enabled/mode/name;
- cashback earn percentage;
- purchase-count program shape;
- customer balance/status;
- redemption quote;
- ticket redemption;
- earned value on receipt;
- purchase-history support.

Production storage should eventually use durable loyalty transaction evidence rather than only mutable balance snapshots. Exact schema is not frozen in this UI phase.

---

# 13. Device-local preferences

Current local preferences include:

- sale screen mode;
- visible order types;
- print receipt always.

These are real product settings even though the prototype currently stores them in localStorage.

⚠️ When production local persistence is introduced, migrate them into a structured device-preference model rather than scattered browser keys.

---

# 14. Data gaps discovered by UI work

The dedicated register is `POS_UI_NAMING_AND_FIELD_REGISTER.md`.

Highest-priority gaps already exposed by the executable UI:

1. persist `orderType` through ticket → checkout → receipt;
2. add real SKU and barcode identity/search to Product/Catalog contracts;
3. normalize open-ticket lifecycle for the existing Save action;
4. add durable checkout/payment records and idempotency evidence;
5. persist stable employee/branch/device IDs on completed receipts;
6. persist print-job history/status;
7. migrate device preferences into structured local persistence;
8. reserve legitimate Mada/card transaction references without storing prohibited sensitive card data.

These must be addressed or explicitly deferred before production data-model freeze.

---

# 15. Automated evidence

The current branch has behavior coverage for major implemented slices including:

- normal cash sale;
- sale-page editing;
- order-type gate;
- always-print/receipt recovery;
- customer attachment and receipt carry-through;
- optional customer details persistence;
- Quick Sale focus behavior;
- debt settlement and duplicate-submit protection;
- credit sale reuse of attached customer;
- quick-cash suggestion logic including the corrected 102/108 behavior;
- mock **شبكة / مدى** completion path recording a card receipt.

Every new branch head must pass TypeScript, Vitest, production build and UI-manifest integrity before it is called technically clean. CI proves code/document integrity, not visual correctness.

---

# 16. Naming / structural state

Completed before visual freeze:

- cashier-facing **شاشة أساسية** has been normalized to **البيع السريع** in `SalesScreen.tsx`;
- the obsolete hidden **بالضبط** quick-cash control has been removed from the component markup.

Terminology that remains binding:

- **دفع** = general sales checkout entry;
- **سداد** = cash completion and debt-settlement contexts;
- payment-method labels = **نقدًا** and **شبكة / مدى** in the current product direction.

---

# 17. Manifest reconciliation required

The binding manifest still defines `POS-FLOW-001` as cash-only and maps integrated payment as not production-authorized.

The current owner-directed branch includes a **mock card UX extension** for validation.

Therefore one explicit documentation/product task remains before any production claim for integrated payments:

- either add a bounded manifest flow/action scope for the mock integrated-payment UX and later promote it through real-terminal evidence;
- or keep it explicitly categorized as a branch-level product experiment outside the original cash-flow authorization.

Until reconciled, do not reinterpret the mock card button as certified/production payment-terminal support.

---

# 18. Other Rifad surfaces

Current executable focus remains POS.

- Back Office: ⬜ not UI-phase complete
- Dashboard: ⬜ not UI-phase complete
- KDS: ⬜ not UI-phase complete
- CDS: ⬜ not UI-phase complete

Their evidence remains in research/manifest scope; the current branch is intentionally stabilizing the POS interaction language first.

---

# Exact current checkpoint

Rifad is **not UI-complete** and not production-backend-complete.

Current checkpoint:

> **A substantial touch-first POS product prototype with Rifad-owned contracts and mock-local persistence, an owner-reviewed sales/payment interaction language, inline basket checkout, corrected cash shortcuts, a final cash-tender touch pass pending owner visual review, and a testable mock Mada/card path — documented with explicit UI-to-data traceability before further feature expansion.**

Immediate next step is owner visual review of the final cash-tender pass. If accepted, continue to the quantity editor/ticket-line interaction audit without weakening the field register or naming rules.
