# MAP-01 — Effective POS Configuration + Authorization

Status: **PASS — 2026-08-20**

Started: 2026-08-19

Completed: 2026-08-20

Repository: `mhmdacs-collab/rifad-004`

Branch: `agent/pos-visual-pass-01`

## Objective

Make owner-managed operational policy concrete and locally enforceable at the branch POS before shifts, refunds, protected ticket actions and production payment behavior are implemented.

The completed vertical slice is:

`Back Office merchant policy → Rifad-owned admin contract → pure branch/device projection → versioned local effective POS snapshot → local capability authorization → one-action manager override`

Loyverse remains the functional/workflow baseline for the ownership split. Rifad owns the contracts, data meanings, adapters and UI.

## Completed product scope

### Back Office-owned

MAP-01 implements the bounded administration family for:

1. **Employees**
   - stable employee identity;
   - name/contact staging fields;
   - role assignment;
   - allowed store scope;
   - active state;
   - four-digit staging PIN setup semantics.

2. **Access Rights / Roles**
   - immutable Owner authority;
   - editable non-owner/custom roles;
   - explicit POS and Back Office permission keys;
   - no authorization by role display name.

3. **Features**
   - shifts;
   - time clock;
   - open tickets;
   - restaurant service;
   - place management;
   - dining options;
   - kitchen routing;
   - customer display.

Feature switches are policy facts only. They do not mark their later operational map items complete.

4. **Stores**
   - stable store identity;
   - merchant-facing metadata;
   - active state.

5. **POS Devices**
   - stable device identity;
   - one store assignment;
   - pending-link / linked / disabled staging status.

6. **Payment Types**
   - stable identity;
   - name/kind;
   - enabled state;
   - merchant display order;
   - offline-capable / online-required requirement;
   - optional store scope.

Real terminal/provider setup is not MAP-01.

## Completed Rifad contract boundaries

### `PosConfigurationAdminContract`

Owns merchant intent for the bounded Back Office family. Every mutation uses a stable command identity.

### `projectEffectivePosConfiguration()`

Pure Rifad domain projection that:

- validates store/device relationship;
- selects employees relevant to the branch;
- carries explicit role/capability snapshots;
- strips Back Office-only permissions from the POS projection;
- filters enabled payment methods by branch scope;
- preserves merchant payment order;
- carries feature flags and source revision.

It performs no cloud, LAN, sync or database-provider work.

### `EffectivePosConfigurationContract`

Reads the versioned branch/device-local effective snapshot needed by the POS.

### `AuthorizationContract`

Evaluates concrete capability against:

- employee existence/activity;
- branch scope;
- role existence;
- explicit permission.

### `ManagerOverrideContract`

Allows one locally eligible employee to approve exactly one blocked command. Approval records actor/approver/capability/target/revision and never contains raw PIN. Approval does not change the active cashier session or permission set.

## Completed implementation slices

### MAP-01A — authority / manifest readiness — PASS

- Added `BO-FLOW-003 — POS Operational Configuration and Access`.
- Authorized only `BO-SCREEN-021`, `022`, `026`, `027`, `028`, `029` for this slice.
- Kept Taxes, Discounts, Receipt settings, Open Tickets, Kitchen/Dining, Timecards and later families gated.

### MAP-01B — contracts + local projection — PASS

- Added Rifad effective-configuration/authorization contracts.
- Added owner-admin contract.
- Added pure merchant-policy projection.
- Added current staging local effective-config adapter behind `LocalPersistenceContract`.

### MAP-01C — POS enforcement — PASS

- POS loads locally effective configuration.
- Payment rail follows enabled methods and merchant order.
- Empty payment list fails safe instead of inventing defaults.
- Receipt reprint uses `reprint-resend-receipts` authorization.
- Visible **دفع** now evaluates `accept-payment` before entering checkout.
- Missing permission blocks the action and opens the one-action manager PIN overlay.
- A second checkout attempt requires a fresh approval; no session elevation occurs.

### MAP-01D — Back Office management family — PASS

Inside the existing locked Back Office visual shell, the new **التشغيل والصلاحيات** area implements:

- Employees;
- Access Rights;
- Features;
- Stores;
- POS Devices;
- Payment Types.

Every merchant mutation crosses `PosConfigurationAdminContract`; component state remains draft/presentation state.

### MAP-01E — verification / closeout — PASS

The following exit behaviors are proven:

1. owner policy produces a versioned effective POS projection;
2. effective projection survives local POS restart;
3. allowed cashier capability succeeds;
4. denied capability is locally rejected;
5. checkout is visibly blocked when `accept-payment` is absent;
6. eligible manager PIN approves one blocked action only;
7. active cashier identity/permissions are not elevated by override;
8. payment methods shown by POS follow configured enabled/order policy;
9. branch/device scope is enforced;
10. admin commands are idempotent in current staging adapter;
11. raw PIN is absent from merchant configuration and override audit facts;
12. UI Manifest, POS and Back Office CI pass.

## Evidence

Key tests:

- `apps/pos/src/effective-pos-configuration.test.ts`
- `apps/pos/src/configured-payment-method-rail.test.tsx`
- `apps/pos/src/manager-override-dialog.test.tsx`
- `apps/pos/src/map01-owner-policy-integration.test.ts`
- `apps/pos/src/accept-payment-authorization.test.tsx`
- `apps/backoffice/src/pos-configuration-admin.test.ts`
- `apps/backoffice/src/pos-configuration-projection.test.ts`
- `apps/backoffice/src/pos-operational-config-flow.test.tsx`

Final MAP-01 authorization slice passed GitHub Actions for:

- UI Manifest Integrity;
- POS application: install/typecheck/tests/build;
- Back Office application: install/typecheck/tests/build.

## Staging boundaries deliberately retained

These are explicit later gates, not hidden MAP-01 claims:

- production-safe credential verifier, encrypted/host-secured credential material and brute-force/lockout policy;
- production local database (MAP-06);
- real Back Office ↔ POS transport (MAP-11);
- synchronization provider (MAP-10);
- LAN/Branch Hub;
- tax/discount calculation snapshots (MAP-03);
- shift/cash/time-clock operations (MAP-02);
- full open-ticket lifecycle (MAP-04);
- normalized payments/receipt detail/refunds (MAP-05);
- real payment terminal;
- ZATCA/fiscal;
- real printer/KDS/CDS transport.

The current browser admin/local-persistence implementations are staging transports behind Rifad-owned contracts. They do not freeze production database topology or synchronization design.

## Result

**MAP-01 PASS.**

The dependency unlocked by this map item is **MAP-02 — Shift + Cash Drawer Ledger + Time Clock**.

Stop after MAP-01 closeout for owner review. Do not begin MAP-02, production database selection or synchronization as part of this map item.
