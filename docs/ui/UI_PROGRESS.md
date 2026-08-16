# Rifad UI Progress Record

Last updated: 2026-08-17

This file is the living execution record for the Rifad interface phase. It answers two questions:

1. What has actually been implemented?
2. What is still pending before the interface can be called accepted?

It complements `UI_FIRST_PLAN.md`; it does not replace the manifest, research evidence, or visual-decision records.

## Status legend

- ✅ **Implemented and behavior-tested** — code exists and automated behavior coverage exists.
- 👁 **Visually verified by owner** — the owner has actually seen the result and confirmed the specific problem is resolved.
- 🟡 **Implemented, visual approval pending** — code exists, but it must not be called visually approved yet.
- ⚠️ **Known gap / incomplete contract** — visible behavior exists but an architectural/product persistence gap remains.
- ⬜ **Not implemented in the current executable UI**.

## Current working state

- Repository: `mhmdacs-collab/rifad-004`
- Active UI branch: `agent/pos-visual-pass-01`
- Active PR: **#2**
- PR state: **Open + Draft + not merged**
- Target branch: `main`
- `main` remains intentionally untouched while visual iteration continues.
- Do not merge PR #2 until the owner explicitly approves the visual direction.

## Product authority currently in force

- **Loyverse** is the primary functional/workflow/ergonomics reference.
- **Rifad** owns the visual identity, code, contracts, data model and final product decisions.
- Openfront Restaurant / Toast and other interfaces may inspire polish only; they do not override Rifad workflows.
- The POS must feel like a tablet/touch application, not a generic responsive website.
- Arabic/RTL is primary; English/LTR remains required.
- Every visible business action must cross a Rifad-owned contract, even while the implementation is mocked.

---

# 1. POS shell and entry

## Sign in and employee unlock

Status: ✅

Implemented:

- device sign-in shell;
- employee PIN screen;
- transition into an active POS session;
- restoration of the current local session where applicable.

The first executable POS flow is no longer a static mock; it is routed through Rifad contracts and the current mock runtime.

---

# 2. Sales workspace

## Main tablet sales layout

Status: ✅ 🟡

Implemented:

- tablet-oriented sales workspace;
- product grid/pages;
- current ticket column;
- Rifad branding and Saudi-riyal presentation;
- Cairo typography direction in the current visual work;
- touch-oriented product cells;
- editable ticket lines;
- sale-page creation and product placement;
- sale-page rename/delete/reorder actions;
- long-press/context interaction for page management;
- responsive/mobile ticket surface.

Visual history:

- multiple visual passes were made to density, spacing, ticket hierarchy, checkout, cash and success screens;
- the work remains in PR #2 until explicit visual approval.

Important production note:

- any remote-loaded font dependency must become local/offline-safe before production distribution.

## Sales screen modes

Status: ✅ 🟡

Two device-local modes are implemented:

- **شاشة لمس** — product/page grid optimized for touch;
- **شاشة أساسية** — search/barcode-first workflow.

Settings path:

`القائمة → الإعدادات → نمط شاشة البيع`

Behavior implemented:

- switching to Basic keeps product search visible;
- switching back to Touch closes the permanent Basic search state;
- the preference is device-local, so devices in the same business may use different modes.

## Basic-screen search focus

Status: ✅

Behavior:

- product search owns focus by default in **شاشة أساسية**;
- focus is restored after adding/editing a product;
- dialogs temporarily own focus;
- after customer/debt/settings/menu dialogs close, focus returns to product search;
- this supports barcode-scanner workflows without requiring the cashier to click the box repeatedly.

---

# 3. Ticket and order type

## Current ticket

Status: ✅ 🟡

Implemented:

- item name;
- quantity × unit price metadata;
- line total;
- included tax;
- grand total;
- linked customer indicator;
- latest touched line scroll behavior;
- separate checkout rendering so sale-ticket CSS cannot clip checkout rows.

Visual verification:

- 👁 the earlier checkout bug where product names/items disappeared was verified fixed by the owner;
- 🟡 the final alignment/spacing of checkout rows still requires owner visual approval.

## Order type selector

Status: ✅ ⚠️ 🟡

Touch-mode behavior implemented:

- configured types: `محلي`, `سفري`, `توصيل`;
- selector appears after the first item;
- zero enabled types → hidden;
- one enabled type → auto-selected;
- multiple enabled types → cashier must choose before Save/Pay;
- action wording uses **دفع** rather than the old sales-screen **السداد**.

Known contract gap:

- ⚠️ selected order type is still UI-local in the current implementation;
- it is not yet a durable Rifad Ticket field carried through saved ticket → checkout → receipt.

Therefore order type must **not** be called complete until this persistence gap is closed.

---

# 4. Checkout, cash and sale completion

## Checkout ticket isolation

Status: ✅ 👁 🟡

Implemented:

- checkout has a dedicated non-button ticket-row layout;
- product name, quantity × unit price and line total have explicit zones;
- tax and total remain outside the scrolling item list;
- checkout no longer inherits the clipping geometry that caused blank/missing line content.

Owner verification:

- 👁 items and totals became visible after the root-cause fix;
- 🟡 final visual formatting still needs approval.

## Cash payment

Status: ✅

Implemented:

- exact ticket total is prefilled;
- arbitrary/manual cash amount entry remains available;
- quick-cash suggestions follow the approved contextual logic;
- under-tender is blocked by the contract;
- change is calculated and displayed;
- cash completion creates a persisted receipt in the mock runtime.

Examples reflected in the current quick-cash rules:

- 54 → 60 / 100 / 200 / 500
- 108 → 110 / 120 / 150 / 200 / 500
- 126 → 130 / 150 / 200 / 500
- 170 → 200 / 500

## Success screen

Status: ✅ 🟡

Implemented:

- completed-sale summary;
- cash tender/change presentation;
- credit-sale completion variant;
- receipt actions;
- new-sale action;
- print status messaging.

Newest customer/loyalty additions also provide receipt-side earned-loyalty information when applicable, but this newest presentation remains visually unapproved.

---

# 5. Receipts and printing

## Receipt history

Status: ✅ 🟡

Implemented:

- Receipts drawer entry;
- persisted completed receipt list in the current local mock runtime;
- newest-first receipt display;
- print/reprint action;
- explicit confirmation before retrying a `delivery-unknown` print result.

Known limitation:

- historical print-delivery status is not yet persisted per receipt.

## “طباعة الإيصال دائمًا”

Status: ✅ 🟡

Device-local setting implemented in POS settings and success summary.

Behavior:

1. sale is finalized and receipt persisted first;
2. if auto-print is OFF → success summary is shown;
3. if auto-print is ON → one print attempt is made;
4. regardless of print failure/unknown delivery, the completed sale remains recoverable in Receipts;
5. a new sale starts directly without showing the normal success summary;
6. no effect-driven automatic print is used, avoiding React StrictMode double-print behavior.

The cashier can always go to Receipts and print/reprint later.

---

# 6. Customer system

This area was expanded substantially after the original Basic-screen debt request.

## Customer attachment

Status: ✅ 🟡

Implemented:

- attach one customer to the current ticket;
- attached identity survives through normal cash receipt creation;
- remove customer from ticket;
- customer name is visible in the ticket header;
- clicking the attached customer reopens the customer workflow.

## Customer search

Status: ✅

Implemented:

- live search on every typed character;
- no Search button;
- search by customer name or mobile;
- stale async results are prevented from overwriting newer queries;
- Saudi mobile normalization is supported for normal complete mobile formats;
- mobile number is treated as the primary unique customer identifier.

Seed examples in the current mock state include أحمد محمد and سارة خالد for interaction testing.

## Create customer

Status: ✅ 🟡

Implemented:

- customer name;
- required unique Saudi mobile;
- optional information:
  - email;
  - address;
  - city;
  - region;
  - postal code;
  - country;
  - customer code;
  - notes.

The customer forms are intentionally forced into a single-column layout so older grid CSS cannot unexpectedly place fields side by side.

## Customer profile

Status: 🟡

Newest implementation adds a touch-first customer profile based on the supplied customer-reference screenshots.

Profile direction includes:

- customer identity/contact information;
- customer-account summary;
- loyalty status;
- purchase information/history entry;
- edit profile;
- remove from ticket;
- large touch actions instead of small desktop-form actions.

This newest profile is **implemented but not yet visually approved by the owner**.

---

# 7. Debt / credit workflow

## Basic-screen `آجل` / `سداد`

Status: ✅

Only **شاشة أساسية** changes its left ticket action dynamically:

- cart has items → **آجل**;
- cart empty → **سداد**.

Touch mode keeps its normal Save/Pay behavior.

## Credit sale (`آجل`)

Status: ✅ 🟡

Implemented:

- ticket must contain items;
- customer is required;
- if a customer is already attached, it is reused rather than making the cashier search again;
- current debt, sale value and debt after transaction are shown;
- confirmed credit sale creates a completed receipt;
- the sale is recorded in the debt ledger;
- customer debt increases by the exact ticket amount;
- a new ticket can be started normally.

## Debt book and settlement

Status: ✅ 🟡

Implemented:

- open settlement flow with an empty Basic cart;
- live customer search;
- customer debt display;
- debt ledger/history;
- full settlement by default;
- **تعديل المبلغ** for partial settlement;
- exact halala parsing at the contract boundary;
- blocks zero/negative/malformed/over-balance settlement;
- partial settlement updates the remaining balance exactly;
- double-submit guard prevents duplicate settlement records.

Example already covered by behavior tests:

- debt 120.00 SAR → settle 50.00 SAR → remaining debt 70.00 SAR.

Not yet added:

- settlement payment method (cash/card/etc.);
- customer statement export;
- due dates/aging;
- credit limits;
- debt-specific permissions.

These must not be invented until explicitly scoped.

---

# 8. Loyalty and customer purchases

Status: 🟡

A Rifad-owned `LoyaltyContract` now exists in the POS UI work rather than treating loyalty as mere decorative UI.

Newest implemented direction includes:

- loyalty status for attached customer;
- cashback-style loyalty balance;
- purchase-count program shape;
- redemption quote;
- redemption applied as a real ticket discount rather than a preview-only label;
- earned loyalty derived from the completed sale;
- receipt stores enough sale/customer information to support customer purchase history;
- customer profile includes purchase-history access;
- success screen can display earned loyalty after sale;
- customer email can be used for the receipt-contact flow where present.

Important status rule:

- this newest loyalty/profile/purchase-history work is **not visually approved yet**;
- before calling this slice closed, re-run the current branch CI after the final UI changes and perform owner visual verification against the supplied screenshots.

---

# 9. Automated evidence

Behavior tests currently cover major implemented slices including:

- cash sale flow;
- sale-page editing;
- order-type gate;
- always-print flow and receipt recovery;
- attaching one customer to ticket and carrying identity into the receipt;
- optional customer details persistence;
- Basic-screen search focus;
- partial debt settlement and duplicate-submit prevention;
- reuse of an already attached customer for credit sale.

During the customer/loyalty expansion, TypeScript, Vitest and production build were green at an intermediate checkpoint. Since additional profile/loyalty/presentation changes followed, the **current branch head must receive a fresh complete CI run before this newest slice is declared behavior-closed**.

CI passing proves code health; it does not prove visual correctness.

---

# 10. What has NOT been visually approved

Do not describe the following as owner-approved yet:

- final checkout row spacing/alignment;
- sales mode settings screen;
- order-type selector appearance;
- auto-print settings appearance;
- Receipts appearance;
- customer picker/create/profile appearance;
- debt-book appearance;
- loyalty redemption UI;
- customer purchase-history UI;
- earned-points success presentation.

The prior checkout **visibility/clipping fix** is the main item explicitly visually verified so far; later polish still remains open.

---

# 11. Remaining architectural/UI gaps before POS can be called complete

High-priority known gaps:

1. Persist `orderType` as a Rifad-owned ticket/checkout/receipt field.
2. Finish visual QA of the complete customer/profile/loyalty workflow against the supplied screenshots.
3. Re-run full CI on the final customer/profile/loyalty head and add specific end-to-end tests for redemption → sale → earned points → purchase history.
4. Continue the remaining manifest-approved POS families rather than inventing new screens.
5. Replace UI mock persistence/adapters later without changing visible workflows.

Still outside the currently completed POS executable slice:

- full modifiers/variants workflow;
- full open-ticket management;
- restaurant table/floor workflow;
- split/partial multi-method payment UI;
- refunds/returns;
- shift/cash-movement workflow;
- complete POS permissions;
- production hardware printing;
- production local database/sync;
- final offline/restart behavior for all POS features.

---

# 12. Other Rifad surfaces

Current executable focus is POS.

Status of the other primary UI surfaces:

- Back Office: ⬜ full executable surface not yet built to UI-phase completion;
- Dashboard: ⬜ not yet built to UI-phase completion;
- KDS: ⬜ not yet built to UI-phase completion;
- Customer Display (CDS): ⬜ not yet built to UI-phase completion.

Their workflows remain in the UI/research/manifest scope, but the active branch is intentionally concentrating on stabilizing the POS interaction language first.

---

# 13. Exact current checkpoint

We are **not** at “UI complete”.

We are at:

> **A substantial interactive POS prototype with real Rifad contract boundaries and mock local persistence, now deep enough to validate the sales, checkout, receipts, customer debt and customer/loyalty interaction model before continuing the rest of POS.**

The immediate checkpoint is:

1. stabilize the newest customer/profile/loyalty code;
2. run full CI;
3. visually compare it against the supplied customer screenshots;
4. fix only real differences;
5. close the order-type persistence gap;
6. then continue the next manifest-approved POS flow.

No merge to `main` occurs until the owner explicitly approves the visual branch.
