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

The executable POS is a Rifad-owned React/TypeScript/Vite UI using Rifad contracts with a mock/local runtime. Production database, synchronization, fiscal transport, printer transport and real payment-terminal integration are not implied by the visual prototype.

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
- when a dedicated numeric-entry surface has room, use an embedded POS keypad for touch while retaining hardware-keyboard support;
- live validation/result text near repeated keys must reserve stable geometry so the keypad/action does not jump while the cashier types.

See `DESIGN_AUTHORITY.md` and architecture decision D-021.

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
- **دفع** is visually stronger than **حفظ**;
- density never increases at the cost of reliable finger targeting.

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

# 3. Ticket, quantity and order type

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
- mobile follows the same action-reachability rule.

## Quantity editor

Status: ✅ 👁

- whole basket row opens editor;
- large `+ / −` targets;
- direct numeric entry;
- embedded keypad `1–9`, `0`, `00`, backspace;
- no system soft keyboard required for touch use;
- hardware keyboard remains supported;
- destructive **حذف** separated from confirmation;
- one **حفظ** performs the write after editing;
- automated evidence covers quantity **1000** through the embedded keypad.

Keypad/focus/pressed state is UI-only; durable business truth remains TicketLine `quantity`.

## Order type

Status: ✅ ⚠️ 🟡

Values: **محلي / سفري / توصيل**.

- zero enabled → selector hidden;
- one enabled → selected automatically;
- multiple enabled → must choose before Save/Pay.

⚠️ Selected order type is still UI-local and is not durable through ticket → checkout → receipt.

---

# 4. Inline checkout

Status: ✅ 👁

Accepted progression:

> `basket → payment methods → cash/card → success`

The basket rail transforms while the catalog remains visible as frozen spatial context. The catalog is intentionally non-interactive during checkout.

---

# 5. Payment-method selection

Status: ✅ 👁

Current cards: **نقدًا** and **شبكة / مدى**.

Each is a large touch surface using text plus method-specific visual recognition. The current شبكة/مدى path is a **mock UX/payment path**, not real terminal evidence.

⚠️ Production Mada requires provider/terminal adapter evidence, durable normalized payment data, failures/recovery, reconciliation/refund scope and security/compliance review.

---

# 6. Cash payment

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

# 7. Card / network mock payment

Status: ✅ mock behavior-tested / ⚠️ production terminal absent

The branch can select **شبكة / مدى**, complete the mock transaction and persist `paymentMethod: "card"`.

No claim exists for real terminal discovery, acquiring provider connectivity, authorization/decline transport, RRN/approval references, settlement, reconciliation, refunds or production payment-security scope.

Manifest reconciliation is still required before any production integrated-payment claim.

---

# 8. Sale success and printing preference

Status: ✅ 👁

Accepted sale-success direction:

- stays in basket-rail spatial context;
- success result and receipt facts are readable at cashier distance;
- cash change is the hero fact when applicable;
- **بيع جديد** is dominant over print;
- print preference is a quickly scannable row with printer icon, **طباعة الإيصال دائمًا** + secondary **في العمليات القادمة**, larger checkbox and whole-row target;
- active preference gets a restrained green cue.

---

# 9. Receipts and printing

Status: ✅ 🟡 ⚠️

Implemented receipt history, mock-local receipt list, newest-first display, print/reprint action, explicit confirmation before retrying `delivery-unknown`, and device-local always-print preference.

⚠️ Historical print delivery is not persisted as durable per-receipt print-job history.

---

# 10. Customer system

Status: ✅ 🟡

Current behavior/model supports:

- attach/remove one customer on ticket;
- live search by name/mobile;
- whole-row touch results;
- create/edit customer;
- Saudi mobile format enforced in create/edit as exactly **10 local digits starting with 05**;
- quick-create fields now prioritize:
  - customer name;
  - mobile;
  - **optional address**;
- additional information on wider screens uses **two columns** and collapses to one column on narrow screens;
- optional customer data includes email, address, city, region, postal code, country, customer code, note and **tax number**;
- tax number is now preserved by the current model/mock persistence for future invoice/fiscal use;
- tax-number presence does not itself mean ZATCA invoice compliance is finished;
- customer profile/purchase-history/email-receipt directions remain available.

Customer creation actions use a footer-like stable action row within the form so optional fields can scroll without losing the creation action.

---

# 11. Credit / debt

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
- account history scrolls while the settlement region remains anchored below it.

Latest requested refinement implemented, pending final owner visual review:

- **remaining balance + validation now live inside one stable feedback card** while editing a partial payment;
- the feedback card keeps a fixed geometry across ready/error states so the keypad and **سداد** do not move between digit presses;
- entering zero keeps the same card and shows the validation message without adding/removing another block;
- valid input shows the projected remaining debt in the same card;
- after successful settlement the dialog no longer disappears after a tiny transient message;
- success now shows a cashier-readable summary: **الرصيد قبل السداد / المبلغ المسدد / المتبقي على العميل**;
- a clear **تم** state/result is visible;
- success waits for explicit **تم**, allowing the cashier to tell the customer the remaining balance;
- the final **تم** action occupies a stable footer band.

Unscoped and not to be invented silently: settlement payment method, due dates/aging, credit limits, debt permissions and statement export.

---

# 12. Loyalty

Status: ✅ contract/model direction / 🟡 visual completeness

Current concepts include program mode/name/configuration, balance/status, redemption quote, applied ticket redemption, earned value and purchase-history support.

Production persistence should use durable loyalty transaction evidence instead of mutable balance snapshots alone.

---

# 13. Device-local preferences

Current preferences:

- sale screen mode;
- visible order types;
- print receipt always.

When production local persistence is introduced, migrate these to a structured device-preference model rather than scattered browser keys.

---

# 14. Data gaps exposed by UI work

Highest-priority open gaps:

1. persist `orderType` through ticket → checkout → receipt;
2. add real SKU/barcode identity/search to Product/Catalog contracts;
3. normalize open-ticket lifecycle for Save;
4. add durable checkout/payment records and idempotency evidence;
5. persist stable employee/branch/device IDs on completed receipts;
6. persist print-job history/status;
7. migrate device preferences into structured local persistence;
8. reserve legitimate Mada/card transaction references without storing prohibited sensitive card data.

The new `taxNumber` customer field is now represented in the executable customer model/mock persistence and therefore is no longer an undocumented UI-only field. Fiscal semantics still require the future fiscal contract.

---

# 15. Automated evidence

Current branch behavior coverage includes:

- normal cash sale;
- sale-page editing;
- order-type gate;
- always-print/receipt recovery;
- customer attachment and receipt carry-through;
- optional customer details persistence;
- exact 10-digit local mobile input constraint;
- tax-number persistence;
- Quick Sale focus behavior;
- debt settlement and duplicate-submit protection;
- stable partial-settlement feedback containing both remaining balance and invalid-state messaging;
- readable settlement success retained until explicit **تم**;
- credit sale reuse of attached customer;
- corrected quick-cash suggestions;
- mock شبكة/مدى completion recording a card receipt;
- direct large quantity entry and embedded quantity-keypad entry of **1000**.

Every new branch head must pass TypeScript, Vitest, production build and UI-manifest integrity before being called technically clean. CI proves code/document integrity, not visual correctness.

---

# 16. Naming / structural state

Completed:

- cashier-facing **شاشة أساسية** → **البيع السريع**;
- obsolete **بالضبط** removed;
- separate cash **مسح** action removed because keypad deletion owns that function.

Binding terms:

- **دفع** = general checkout entry;
- **سداد** = cash completion / debt settlement;
- payment methods = **نقدًا / شبكة / مدى** according to current product direction.

---

# 17. Manifest reconciliation required

`POS-FLOW-001` remains cash-only in the binding manifest while the current branch includes an owner-directed mock card UX extension.

Before a production integrated-payment claim, either add an explicitly bounded mock/integrated-payment manifest scope and later promote it through terminal evidence, or keep the card experience categorized as product validation outside the original production authorization.

---

# 18. Other Rifad surfaces

Current executable focus remains POS.

- Back Office: ⬜
- Dashboard: ⬜
- KDS: ⬜
- CDS: ⬜

Their evidence remains in research/manifest scope; this branch is stabilizing the POS interaction language first.

---

# Exact current checkpoint

Rifad is **not UI-complete** and not production-backend-complete.

Current checkpoint:

> **A substantial touch-first POS prototype with Rifad-owned contracts and mock-local persistence, owner-reviewed sales/basket/cash/Quick-Sale interaction language, stable action-footer rules, large-quantity numeric editing, readable customer/credit/debt workflows, a stable partial-debt feedback card, explicit debt-settlement result summary, and testable mock card UX — all tracked with UI-to-data traceability.**

Immediate work after owner review of this debt/customer refinement is a **cross-screen responsive/footer consistency audit**: verify the stable primary-action rule and human-scale readability on 1920×1080, 1366×768, short-height POS, tablet landscape and narrow/mobile compositions before calling the core POS visual language locked.