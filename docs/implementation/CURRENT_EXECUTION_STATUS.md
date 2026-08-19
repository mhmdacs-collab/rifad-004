# Rifad Current Execution Status

Last updated: 2026-08-20

Branch: `agent/pos-visual-pass-01`

Current completed map item: **MAP-01 — Effective POS Configuration + Authorization + Payment/Collection Configuration**

Status: **PASS — owner policy → effective local POS configuration → local authorization + configuration-driven payment/delivery collection semantics proven**

## Dependency position

`MAP-00 PASS → MAP-01 PASS → MAP-02 next`

Do **not** start MAP-03 or any later map item before its dependency gate. Do not resume synchronization adoption before MAP-10. Production local database selection remains MAP-06.

## What MAP-01 established

MAP-01 now proves this Rifad-owned boundary:

`Owner/Back Office policy → merchant configuration → pure branch/device projection → local POS effective snapshot → cashier authorization + configured collection choices while offline`

Rifad owns the contracts and meanings. No donor schema, cloud provider, synchronization engine, LAN service or production database is required for this boundary.

The owner-approved payment/delivery semantics are recorded in `docs/architecture/PAYMENT_AND_DELIVERY_COLLECTION_DECISION.md`.

## Completed MAP-01 slices

### 01A — authority / manifest gate

- `BO-FLOW-003 — POS Operational Configuration and Access` is implemented.
- `POS-FLOW-007 — Delivery COD Merchant Collection` is implemented for the explicitly bounded courier-pays-merchant COD path.
- Payment selection, credit entry and delivery collection behavior are reconciled in `docs/ui/UI_EXECUTION_MANIFEST.json`.
- Taxes, Discounts, Receipt settings, Open Tickets, Shift, platform settlement, self-delivery fee posting and split payment remain separately gated.

### 01B — Rifad configuration and authorization contracts

`contracts/posConfiguration.ts` and `contracts/posConfigurationAdmin.ts` now establish:

- explicit POS feature and capability keys;
- Stores, Devices, Employees and Roles;
- stable Payment Type identity, merchant order and availability;
- **direct financial impact**: `cash | bank | customer-receivable | external-platform`;
- stable starter-payment identity;
- delivery-channel policy, COD policy and self-delivery configuration;
- versioned `EffectivePosConfiguration`;
- `AuthorizationContract` and one-action `ManagerOverrideContract`.

New merchant configuration starts with exactly:

1. **نقدي** → `cash`;
2. **شبكة / مدى** → `bank`;
3. **آجل** → `customer-receivable`.

The merchant may hide/re-show these methods without deleting their stable meaning. Additional methods such as transfer or cheque may be added and ordered.

### 01C — projection, payment surface and local enforcement

- `projectEffectivePosConfiguration()` projects one exact branch/device snapshot and strips Back Office-only permissions.
- The local effective configuration survives restart and repairs an older restored-device binding before reading payment policy.
- The visible **دفع** action enforces `accept-payment`; manager approval is command-scoped and never elevates the cashier session.
- POS payment selection is **N-method and configuration-driven**, not a hard-coded Cash/Card list.
- Payment cards use one full-width touch column with Arabic primary + English secondary labels and no permanent explanatory description; larger configured sets scroll vertically instead of shrinking cards or switching to a dense multi-column payment grid.
- **آجل** is a first-class default payment choice and opens the existing customer-credit flow.
- Merchant-defined methods occupy the same surface. Methods whose completion lifecycle is not yet implemented are visible but disabled rather than silently completing as another payment type.

### 01D — delivery collection meaning

Delivery channel is intentionally separate from payment method.

Current executable safe path:

`توصيل → القناة → عند الاستلام → كيف استلم المحل المبلغ؟ → نقدي | شبكة`

This path is shown only when an enabled channel has COD policy `courier-pays-merchant`.

- Cash continues to own the direct `cash` effect.
- Network continues to own the direct `bank` effect.
- `DeliveryCollectionContract` independently preserves the selected channel and merchant collection method.
- `pos.delivery-collection` persists this context through `LocalPersistenceContract` and links it from ticket to completed receipt.
- Therefore a HungerStation COD order can remain both **HungerStation source** and **cash collection**; one fact no longer erases the other.
- Switching Cash/Network during checkout preserves the channel while updating merchant collection.
- Returning to an ordinary direct sale clears stale delivery context.

Known delivery definitions are provisioned for HungerStation, Keeta, Jahez and self-delivery, plus custom channels. They are disabled until the merchant enables them.

### 01E — Back Office operational configuration

The current Back Office exposes editable Rifad-owned configuration for:

- Employees and Access Rights;
- Features;
- Stores and POS Devices;
- Payment Types: add/edit, show/hide, order, type and **direct impact**;
- **الدفع والتوصيل** workspace;
- delivery global enable/disable;
- known/custom delivery channels;
- electronic-payment and COD availability;
- COD settlement policy;
- self-delivery default fee policy, POS override policy and fee beneficiary (`merchant | courier`).

All merchant mutations cross `PosConfigurationAdminContract`; React remains presentation/draft state.

Self-delivery configuration is intentionally policy-only at this point. POS will not expose a fake self-delivery flow until its fee actually changes ticket/invoice money through a correct sale-money contract.

### 01F — end-to-end evidence

Evidence now proves:

1. owner configuration is versioned/idempotent in current staging;
2. raw employee/manager PIN never becomes configuration or audit payload;
3. Owner authority is immutable;
4. branch/device projection and local restart work;
5. visible authorization deny/one-action override work;
6. Cash / Network / Credit are the three starter methods and preserve direct impact;
7. payment order survives projection/restart;
8. larger configured payment sets preserve one-column touch geometry and expose a scroll-list contract; default methods render concise Arabic + English labels without permanent descriptions;
9. Credit dispatches from the payment surface to the customer-credit flow;
10. delivery policy persists in Back Office staging;
11. only executable courier-pays-merchant COD channels produce the Delivery hub;
12. HungerStation COD may complete through Cash while `DeliveryCollectionContract` still reports HungerStation on the receipt context after restart;
13. self-delivery and platform-settlement-only configurations are not exposed as fake executable POS payment paths.

## Verification

Required workflows on the payment/delivery closeout are:

- **UI Manifest Integrity**;
- **POS application** — install, typecheck, tests, build;
- **Back Office application** — install, typecheck, tests, build.

Key evidence includes:

- `apps/pos/src/effective-pos-configuration.test.ts`;
- `apps/pos/src/restored-device-effective-configuration.test.ts`;
- `apps/pos/src/configured-payment-method-rail.test.tsx`;
- `apps/pos/src/configured-delivery-collection.test.tsx`;
- `apps/pos/src/delivery-collection-adapter.test.ts`;
- `apps/pos/src/delivery-payment-integration.test.ts`;
- `apps/pos/src/map01-owner-policy-integration.test.ts`;
- `apps/pos/src/accept-payment-authorization.test.tsx`;
- `apps/backoffice/src/payment-delivery-model.test.ts`;
- `apps/backoffice/src/payment-delivery-settings.test.tsx`;
- `apps/backoffice/src/pos-configuration-admin.test.ts`;
- `apps/backoffice/src/pos-configuration-projection.test.ts`;
- `apps/backoffice/src/pos-operational-config-flow.test.tsx`.

## Explicit later boundaries — not MAP-01 failures

- **Split payment:** future allocations may use any enabled payment methods; normalized multi-payment records, partial completion/recovery and refund lifecycle remain MAP-05.
- **External-platform electronic settlement:** configuration meaning exists, but settlement/reconciliation accounting is later payment lifecycle work.
- **Self-delivery:** fee/default/beneficiary policy exists, but adding the fee to ticket/invoice totals is not executable until a correct money mutation contract is approved.
- **Real Mada/card terminal:** still separate from the current mock Network path.
- Production credential security remains later host/security work.
- `BrowserPosConfigurationAdmin` is staging storage.
- `BrowserLocalPersistence` is staging persistence, not MAP-06 production DB.
- Real Back Office → POS transport remains MAP-11.
- Shift/cash/time-clock operations remain MAP-02.
- Tax/discount sold truth remains MAP-03.
- Open-ticket lifecycle remains MAP-04.

`Local Persistence != Sync != LAN/Branch Hub != Fiscal/ZATCA` remains binding.

## MAP-01 exit result

**PASS, including the owner-reviewed payment/delivery collection closeout.**

The product now has sufficient payment-impact meaning for MAP-02 to build cash-drawer/shift truth without treating every sale as cash or bank by accident.

## Next dependency-safe step

**MAP-02 — Shift + Cash Drawer Ledger + Time Clock.**

Do not start MAP-02 automatically. Start it only after owner review/continuation, reusing MAP-01 payment direct-impact and authorization semantics instead of inventing parallel classifications.
