# Rifad UI / Product Progress

Last updated: 2026-08-19

Status: **MAP-00 reality-reconciled progress record**

Use with:

- `PROJECT_RULES.md`;
- `docs/architecture/CURRENT_DECISIONS.md`;
- `docs/RIFAD_FINAL_IMPLEMENTATION_MAP.md`;
- `docs/MAP_00_REALITY_AUTHORITY_RECONCILIATION.md`;
- `UI_EXECUTION_MANIFEST.json`;
- `POS_UI_NAMING_AND_FIELD_REGISTER.md`.

This file reports what exists. It does not authorize new behavior outside the manifest gate and it does not turn mock/staging behavior into a production claim.

---

## Status legend

- ✅ **Implemented/executable** — code exists in the current branch.
- 🟡 **Executable proof/staging** — code exists and is testable but production transport/domain lifecycle is still incomplete.
- 🧩 **Mapped/discovered** — product meaning exists in research/manifest but is not implemented.
- ⛔ **Not claimed** — explicitly outside current production evidence.

---

# 1. Product surfaces

| Surface | Current state |
|---|---|
| POS | ✅ substantial executable cashier application; operational core still has specific gaps before production local DB freeze |
| Back Office | ✅ locked management shell + executable catalog family (`BO-FLOW-002`); other management families remain mapped |
| Dashboard | 🧩 mapped/researched only |
| KDS | 🧩 mapped/researched; current POS kitchen behavior is mock revision/dispatch state only |
| CDS | 🧩 mapped/researched only |

Rifad remains one product with separate user roles/surfaces. The branch cashier uses POS; owner/management uses Back Office. The POS may consume owner-managed configuration locally without needing an equivalent cashier administration screen.

---

# 2. POS — executable reality

## 2.1 Device and employee entry

✅ Account/device-link screen exists (`POS-SCREEN-001`).

✅ Device session carries device and branch identity in the current runtime.

✅ Four-digit employee PIN unlock exists (`POS-SCREEN-002`).

🧩 Time clock is not implemented even though older naming grouped it with the PIN screen.

🧩 Effective permission/capability snapshots and one-action manager override are not implemented. Current `EmployeeSession` has employee identity/name/role name only.

## 2.2 Sales workspace

✅ Arabic RTL/touch-first sales workspace exists.

✅ Tablet/wide catalog + ticket composition exists; narrow behavior uses a different composition rather than shrinking every target.

✅ Touch pages and Quick Sale/search-first mode exist.

✅ Catalog category loading/search exists.

✅ Product-card addition exists.

✅ Ticket line quantity edit and embedded keypad exist, including high-quantity behavior.

✅ Line removal and one-touch Clear Cart behavior exist.

✅ Stable transaction-footer/rail geometry is implemented across adjacent sale/payment/success states.

✅ Sale-page editing currently includes create, rename, delete, move/reorder, product placement and removal.

🧩 Open-value/weighed-item entry is not implemented.

🧩 Option-priced items are intentionally hidden from the default cashier catalog until `POS-SCREEN-005` is authorized/implemented. This is a safety boundary, not a missing fallback.

🧩 Add-on selection/pricing and required/min/max rules are not implemented in POS.

🧩 Durable discount/tax/fulfillment sold-line snapshots are not complete.

## 2.3 Customer / credit / loyalty

✅ Customer search exists.

✅ Customer creation and editing exist in the current POS runtime/UI.

✅ Current Saudi local mobile validation exists for the customer proof.

✅ Attach/remove customer behavior exists.

✅ Customer profile exists.

✅ Purchase history exists.

✅ Customer credit sale exists as executable Rifad proof behavior.

✅ Debt ledger and debt settlement exist.

✅ Current duplicate-submit/idempotency behavior is exercised by tests where applicable.

✅ Loyalty status/balance, redemption quote/application, earning and purchase linkage exist as executable proof behavior.

🟡 Customer/credit/loyalty are still backed by the current mock/staging runtime and are not a claim of cloud production storage, final permissions, aging/limits or accounting integration.

## 2.4 Checkout and payments

✅ Checkout preserves cashier spatial context instead of navigating to a generic disconnected page.

✅ Payment-method selection exists.

✅ Cash payment exists with exact/over tender and visible change.

✅ Sale completion uses exact Rifad Money/halala semantics in the current contract.

🟡 Mock card/Mada UX and mock card completion are executable.

⛔ This is **not** real terminal/provider support. No production terminal, provider lifecycle, reconciliation, refund or PCI-sensitive data claim exists.

🧩 Split payment is not implemented. Current receipt shape still carries one payment-method value and therefore is not the final split-payment-ready model.

## 2.5 Sale success / receipts / printing

✅ Sale-success state exists.

✅ Email-receipt behavior exists in the current runtime.

✅ Receipt history/list exists and now uses stable manifest identity `POS-SCREEN-016`.

✅ Reprint exists.

✅ Reprint handles `delivery-unknown` by requiring explicit confirmation rather than blind duplicate printing.

🟡 Current printing transport is mock/staging; no real printer support claim.

🧩 Receipt detail lifecycle is not complete.

🧩 Refund lifecycle is not implemented.

## 2.6 Open tickets / restaurant local service

✅ Generic `SalesContract.saveOpenTicket` behavior exists for the current working ticket.

🧩 The full general Open Tickets family — list/reopen/move/merge/split/bill/void rules — is not complete.

✅ `POS-FLOW-002` implements restaurant service OFF, simple local service and advanced place management as a bounded local/mock proof.

✅ Generic `PlaceGroup → ServicePlace` model exists.

✅ Current default configuration has group `الطاولات` with six places.

✅ Advanced local flow can create an open local order, clear the working basket, reopen an occupied place, update/send additions, increment mock kitchen revision and release the place after successful payment.

🟡 Current restaurant config/open orders persist through current staging/local runtime evidence.

⛔ No production multi-device table locking, real KDS/printer transport, final restaurant persistence, advanced floor plan or delivery-platform integration is claimed.

---

# 3. Back Office — executable reality

The Back Office visual shell is locked for the current product cycle. Broad redesign is closed; future capabilities inherit the locked hierarchy and Rifad visual authority.

## 3.1 Executable catalog family (`BO-FLOW-002`)

✅ Item list.

✅ Search by name, SKU or barcode.

✅ Category filter.

✅ Add/edit item.

✅ Name, description, category, SKU, barcode and available-for-sale.

✅ Fixed pricing.

✅ Reusable **مجموعات الخيارات** with direct default option prices.

✅ Item inheritance from reusable option group.

✅ Sparse item-specific price overrides while retaining group identity.

✅ Item-private multiple-price choices.

✅ Reusable general add-on groups.

✅ Item-private add-on groups/options.

✅ Category create/rename.

✅ Merchant-selected category accent color.

✅ Reusable option-group accent color.

✅ Reusable add-on-group accent color.

✅ Item POS visual representation by color/shape or image staging.

✅ Explicit Save/Cancel workflow.

Current catalog staging implementation is `BrowserCatalogAdapter` **schema v4**.

🟡 Browser local storage is staging only. `imageDataUrl` is staging media transport only.

🟡 SKU/barcode identity now exists in the executable catalog slice and current POS staging search. Production scanner hardware, option-level barcode identity, production persistence and synchronization remain separate gaps.

🧩 Category delete/reorder, item delete/import/export, cost, stock, taxes, weight/volume, composites, branch/store overrides and permissions remain outside the current catalog slice.

## 3.2 Other Back Office families

🧩 Dashboard/reporting.

🧩 Advanced inventory.

🧩 Employees and access rights.

🧩 Timecards/total hours.

🧩 Customers management.

🧩 Feature settings.

🧩 Stores and POS-device administration.

🧩 Payment types.

🧩 Taxes.

🧩 Loyalty administration.

🧩 Receipt settings.

🧩 Open-ticket settings.

🧩 Kitchen printers/displays.

🧩 Dining options.

🧩 Billing/subscription.

These are not reasons to make POS wait for a complete Back Office. MAP-01 will first define the owner-managed configuration facts the operational POS actually needs.

---

# 4. Current Rifad-owned architecture evidence

## 4.1 POS runtime boundary

✅ `PosRuntimeContract` is injected through the composition root.

✅ Current aggregate runtime contains device session, employee session, catalog, sale layout, sales, customer credit, loyalty, checkout, receipts and printing boundaries.

✅ UI/state code is not supposed to import donor/provider internals directly.

✅ Runtime conformance/injection tests protect this boundary.

## 4.2 Restaurant boundary

✅ `RestaurantServiceContract` isolates current config/place/open-local-order behavior.

✅ `useLocalServiceFlow` receives the contract by dependency injection.

✅ Generic place terminology avoids freezing donor-specific table/floor models.

## 4.3 Local persistence/outbox boundary

✅ `LocalPersistenceContract` V1 exists.

✅ Stable installation identity exists.

✅ Branch and device binding are separate facts.

✅ Private versioned snapshots/revisions exist.

✅ Snapshot + outbox event commit semantics exist in the current staging implementation.

✅ Stable domain-event identity/deduplication exists.

✅ Retry/failure bookkeeping and acknowledgement exist.

✅ Current private namespaces include `pos.runtime` and `restaurant.service`.

✅ Current staging event families include sale completion, open ticket, customer changes/credit/debt, local-order lifecycle and print attempts.

✅ Clean cold reconstruction from Rifad namespace state is tested for current operational state.

🟡 Current `BrowserLocalPersistence` transport is explicitly staging.

🧩 Production local engine, real forward migrations, crash-write recovery, realistic volume, Windows installer/process behavior and supported PWA engine proof remain pending.

---

# 5. Current major product-model gaps driving the roadmap

These are the gaps that materially change durable local truth and therefore precede production local database/sync freeze:

1. **Effective configuration + authorization** — feature flags, payment availability/order, tax/discount policy, employee capabilities, branch/device scope and manager one-action override.
2. **Shift + cash + time clock** — opening cash, active shift, pay-in/pay-out, expected/actual cash, close summary/report and clock state where enabled.
3. **Complete sold-line truth** — selected pricing option, selected add-ons, exact resolved price, discounts, taxes, fulfillment and historical snapshots.
4. **Open ticket/order lifecycle** — durable status/revision/ownership plus list/reopen/void/move/merge/split/bill rules as approved.
5. **Payments/receipts/refunds** — normalized payment records, split-ready totals, receipt detail, refund/return facts and audit/authorization evidence.
6. **Production local persistence** — replace browser staging behind the existing contract after the operational facts above are sufficiently defined.

---

# 6. Offline / host / device status

✅ Current staging runtime proves clean restart reconstruction of key local POS/restaurant state.

⛔ No production Windows local database is selected.

⛔ No packaged Windows cold-start/crash-recovery claim yet.

⛔ No production tablet/PWA offline-engine claim yet.

⛔ No real scanner/printer/cash-drawer matrix yet.

⛔ No real integrated payment-terminal claim.

These are MAP-06..09, not reasons to restart synchronization now.

---

# 7. Synchronization status

Existing synchronization candidate evidence is preserved under `docs/research/sync/` and the existing test/workflow directories.

It proved useful technical behaviors such as offline/reconnect/retry/identity/security scenarios for candidate comparison.

However:

- no synchronization provider is production-selected;
- no provider schema is Rifad domain truth;
- candidate proof tables are not the production business model;
- additional synchronization adoption/debugging is paused until `MAP-10`;
- D-032's behavioral requirements remain, while D-033 supersedes the old immediate sync-first sequencing.

---

# 8. Current execution order

The single roadmap is `docs/RIFAD_FINAL_IMPLEMENTATION_MAP.md`.

Current checkpoint:

- **MAP-00:** reality + authority reconciliation — in progress in this change set.
- **Next after MAP-00 PASS:** `MAP-01 Effective POS Configuration + Authorization`.

Then:

`MAP-02 shift/cash/time clock → MAP-03 complete sale-line truth → MAP-04/05 open-order/payment/refund lifecycle → MAP-06 production local persistence → MAP-07/08/09 real hosts/devices → MAP-10 sync re-entry → MAP-11 real Back Office ↔ POS integration`.

Do not skip dependency gates merely because a later integration is technically interesting.

---

# 9. Do-not-claim list

Do not claim production readiness for:

- production local DB;
- synchronization provider selection;
- branch/cloud synchronization;
- LAN/Branch Hub;
- real Mada/card terminal;
- ZATCA/Fatoora production integration;
- real printer/KDS/CDS dispatch;
- restaurant multi-device locking;
- delivery-platform connectors;
- accounting integration;
- production media storage/sync;
- final business/database schema.

The Back Office visual shell is locked; this does not mean every future capability-specific screen is already designed or implemented.
