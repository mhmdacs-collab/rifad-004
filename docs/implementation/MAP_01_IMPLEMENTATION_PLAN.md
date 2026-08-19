# MAP-01 — Effective POS Configuration + Authorization

Status: **PASS — 2026-08-20**

Started: 2026-08-19  
Completed: 2026-08-20

Repository: `mhmdacs-collab/rifad-004`  
Branch: `agent/pos-visual-pass-01`

## Objective

Make owner-managed operational policy concrete and locally enforceable at branch POS before shifts, refunds, split payments, platform settlements and production payment integrations are implemented.

The completed vertical slice is:

`Back Office merchant policy → Rifad admin contracts → pure branch/device projection → versioned local effective POS snapshot → local authorization → configuration-driven payment/collection selection`

Loyverse remains the workflow/ergonomic reference. Rifad owns product meanings, contracts, adapters, data authority and UI.

The owner-approved payment/delivery decision is recorded in `docs/architecture/PAYMENT_AND_DELIVERY_COLLECTION_DECISION.md`.

## Completed product scope

### Back Office-owned configuration

1. **Employees** — identity, contact staging fields, role, store scope, active state and four-digit staging PIN semantics.
2. **Access Rights / Roles** — immutable Owner, editable non-owner roles and explicit POS/Back Office capabilities.
3. **Features** — shifts, time clock, open tickets, restaurant service, place management, dining options, kitchen routing and customer display. Feature switches are policy only; they do not complete later map items.
4. **Stores** — stable identity, merchant metadata and active state.
5. **POS Devices** — stable identity, one store assignment and staging link status.
6. **Payment Types / collection policy**
   - stable identity;
   - name and operational kind;
   - enabled/hidden state;
   - merchant order;
   - availability requirement;
   - optional store scope;
   - direct financial impact: `cash | bank | customer-receivable | external-platform`;
   - stable starter identity for Cash / Network / Credit.
7. **Delivery collection policy**
   - global enable/disable;
   - known/custom delivery channels;
   - electronic-payment and COD availability;
   - COD settlement mode;
   - self-delivery fee/default/override policy;
   - self-delivery fee beneficiary: merchant or courier/delivery party.

New merchant configuration starts with:

- **نقدي** → `cash`;
- **شبكة / مدى** → `bank`;
- **آجل** → `customer-receivable`.

The merchant may hide/re-show these methods. Additional methods can be added without redesigning the POS surface.

## Completed Rifad contract boundaries

### `PosConfigurationAdminContract`

Owns merchant intent and stable command identities for the bounded Back Office family, including payment/direct-impact and delivery policy.

### `projectEffectivePosConfiguration()`

Pure branch/device projection that:

- validates store/device relation;
- selects branch employees;
- carries explicit role/capability snapshots;
- strips Back Office-only permissions;
- filters enabled payment methods by store and preserves merchant order/direct impact;
- filters enabled delivery channels by store;
- carries feature flags and source revision.

It performs no cloud, LAN, sync or database-provider work.

### `EffectivePosConfigurationContract`

Reads the versioned branch/device-local configuration required while POS is offline.

### `AuthorizationContract` / `ManagerOverrideContract`

Authorization evaluates employee/activity/store/role/permission. Manager override approves one blocked command only, records auditable actor/approver/capability/target/revision facts, never stores raw PIN and never elevates the cashier session.

### `DeliveryCollectionContract`

A separate Rifad puzzle capability preserves delivery/source context without turning a delivery platform into the payment method. It records:

- ticket identity;
- completed receipt identity when available;
- channel identity/name/kind;
- COD settlement meaning;
- how the merchant received the courier payment (`cash | card`).

This keeps, for example, **HungerStation source + Cash collection** as two simultaneous facts.

## Completed implementation slices

### MAP-01A — authority / manifest readiness — PASS

- `BO-FLOW-003 — POS Operational Configuration and Access` is implemented.
- `POS-FLOW-007 — Delivery COD Merchant Collection` is implemented for the bounded courier-pays-merchant path.
- `POS-SCREEN-007` is reconciled as an N-method configured payment surface.
- Split payment, platform settlement, self-delivery fee posting, taxes, discounts, receipts, open tickets, shifts and later families remain separately gated.

### MAP-01B — contracts + local projection — PASS

- configuration/admin/authorization contracts implemented;
- payment direct-impact and stable default identity implemented;
- delivery policy implemented;
- independent local delivery collection contract implemented;
- pure effective projection implemented;
- local effective config behind `LocalPersistenceContract` implemented.

### MAP-01C — POS enforcement and payment surface — PASS

- effective config loads locally and survives restart;
- restored devices repair local binding before effective config read;
- visible **دفع** enforces `accept-payment`;
- missing permission opens one-action manager approval;
- Cash / Network / Credit are the three starter choices;
- payment surface renders any enabled merchant-ordered method list;
- more than five visible choices use a compact two-column tablet layout;
- constrained phone layouts return to one column;
- Credit launches existing customer-credit flow;
- unsupported custom financial lifecycles remain disabled rather than masquerading as Cash/Card.

### MAP-01D — delivery COD collection — PASS

Current executable safe flow:

`توصيل → القناة → عند الاستلام → كيف استلم المحل المبلغ؟ → نقدي | شبكة`

Only enabled non-self-delivery channels with `courier-pays-merchant` COD are exposed here.

- Cash branch uses existing Cash payment semantics.
- Network branch uses the existing mock Network path only; no production terminal claim.
- channel/source context persists independently in `pos.delivery-collection`;
- changing Cash/Network preserves channel and updates collection method;
- completed receipt receives the delivery association;
- direct ordinary Cash/Network/Credit clears stale delivery context;
- self-delivery and platform-settlement-only policies do not create fake executable buttons.

### MAP-01E — Back Office management — PASS

Current Back Office includes editable:

- Employees;
- Access Rights;
- Features;
- Stores;
- POS Devices;
- Payment Types;
- dedicated **الدفع والتوصيل** workspace with direct impact and delivery policy.

Every merchant mutation crosses `PosConfigurationAdminContract`.

### MAP-01F — verification / closeout — PASS

Exit evidence proves:

1. owner policy produces versioned effective projection;
2. projection survives POS restart;
3. allowed/denied capabilities behave locally;
4. manager approval is one-action only;
5. payment defaults are Cash / Network / Credit;
6. direct impacts are retained through Back Office, projection and local config;
7. payment order drives UI order;
8. N-method payment layout handles larger sets without a hard-coded Cash/Card UI;
9. Credit is selectable from payment surface;
10. delivery policy persists and projects;
11. COD channel selection records source separately from payment method;
12. receipt association survives local adapter restart;
13. no raw PIN leaks;
14. unrelated future payment/delivery lifecycles remain non-executable.

## Evidence

Key tests include:

- `apps/pos/src/effective-pos-configuration.test.ts`
- `apps/pos/src/restored-device-effective-configuration.test.ts`
- `apps/pos/src/configured-payment-method-rail.test.tsx`
- `apps/pos/src/configured-delivery-collection.test.tsx`
- `apps/pos/src/delivery-collection-adapter.test.ts`
- `apps/pos/src/delivery-payment-integration.test.ts`
- `apps/pos/src/map01-owner-policy-integration.test.ts`
- `apps/pos/src/accept-payment-authorization.test.tsx`
- `apps/pos/src/manager-override-dialog.test.tsx`
- `apps/backoffice/src/payment-delivery-model.test.ts`
- `apps/backoffice/src/payment-delivery-settings.test.tsx`
- `apps/backoffice/src/pos-configuration-admin.test.ts`
- `apps/backoffice/src/pos-configuration-projection.test.ts`
- `apps/backoffice/src/pos-operational-config-flow.test.tsx`

Required GitHub Actions remain:

- UI Manifest Integrity;
- POS application — install/typecheck/tests/build;
- Back Office application — install/typecheck/tests/build.

## Explicit later boundaries

These are not MAP-01 failures:

- **MAP-02:** Shift + Cash Drawer Ledger + Time Clock, reusing payment direct impact.
- **MAP-03:** tax/discount sold truth.
- **MAP-04:** full open-ticket lifecycle.
- **MAP-05:** normalized payment records, split/partial payment across any enabled methods, payment recovery, receipt detail/refund lifecycle and later settlement concerns.
- external-platform electronic settlement/reconciliation is not yet executable.
- self-delivery fee configuration exists, but fee posting into ticket/invoice totals remains gated until an exact sale-money mutation contract exists.
- real Mada/card terminal remains a separate integration gate.
- production credential security remains later host/security work.
- production local database remains MAP-06.
- sync provider remains MAP-10.
- real Back Office ↔ POS transport remains MAP-11.

Current browser configuration/local-persistence implementations are staging transports behind Rifad-owned contracts.

`Local Persistence != Sync != LAN/Branch Hub != Fiscal/ZATCA`

## Result

**MAP-01 PASS, including payment/direct-impact/delivery-collection closeout.**

Next dependency-safe capability: **MAP-02 — Shift + Cash Drawer Ledger + Time Clock**.

Stop for owner review. Do not begin MAP-02 automatically.
