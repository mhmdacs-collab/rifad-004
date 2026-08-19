# Rifad Current Execution Status

Last updated: 2026-08-20

Branch: `agent/pos-visual-pass-01`

Current completed map item: **MAP-01 — Effective POS Configuration + Authorization**

Status: **PASS — owner policy → effective local POS configuration → local authorization/one-action override proven**

## Dependency position

`MAP-00 PASS → MAP-01 PASS → MAP-02 next`

Do **not** start MAP-03 or any later map item before its dependency gate. Do not resume synchronization adoption before MAP-10. Production local database selection remains MAP-06.

## What MAP-01 established

MAP-01 turns the mature Loyverse ownership split into a Rifad-owned vertical slice:

`Owner/Back Office policy → Rifad merchant configuration → pure branch/device projection → local POS effective snapshot → cashier authorization while offline`

Rifad owns all contracts and meanings. No donor schema, cloud provider, synchronization engine, LAN service or production database is required for this product boundary.

## Completed MAP-01 slices

### 01A — authority / manifest gate

- Reconciled the Loyverse baseline for Employees, Access Rights, Features, Stores, POS Devices and Payment Types.
- Added and implemented `BO-FLOW-003 — POS Operational Configuration and Access` in `docs/ui/UI_EXECUTION_MANIFEST.json`.
- Only the bounded MAP-01 Back Office family was authorized; Taxes, Discounts, Receipt settings, Open Tickets, Kitchen/Dining, Shift and later families remain separately gated.

### 01B — Rifad contracts and merchant policy

- `contracts/posConfiguration.ts` defines:
  - explicit POS feature keys;
  - concrete POS capability/permission keys;
  - configured payment methods, order and connectivity requirement;
  - role/employee authorization snapshots;
  - versioned `EffectivePosConfiguration`;
  - `EffectivePosConfigurationContract`;
  - `AuthorizationContract`;
  - command-scoped `ManagerOverrideContract`.
- `contracts/posConfigurationAdmin.ts` defines the owner/Back Office merchant model for:
  - Employees;
  - Roles / Access Rights;
  - Features;
  - Stores;
  - POS Devices;
  - Payment Types.

### 01C — projection and local POS enforcement

- `core/posConfiguration/projectEffectivePosConfiguration.ts` deterministically projects merchant policy to one branch/device snapshot.
- Projection removes Back Office-only permissions from the POS snapshot, filters employee/payment scope and rejects invalid device/store relationships.
- `apps/pos/src/runtime/effectivePosConfigurationAdapter.ts` stores/reads the effective snapshot behind `LocalPersistenceContract` and survives adapter/process-style restart in current staging evidence.
- Authorization is capability-based, not role-name-based, and checks employee activity, branch scope, role existence and permission.
- Manager override records one command-scoped approval with actor, approver, capability, target and configuration revision; raw PIN is absent from configuration/audit facts.
- POS payment-method selection reads enabled methods and merchant order from effective configuration instead of a hard-coded display list.
- `accept-payment` is now enforced on the visible **دفع** action. A cashier lacking it is blocked before checkout and receives the local manager-override dialog.
- Archived receipt reprint is protected by `reprint-resend-receipts` using the same one-action approval boundary.

### 01D — Back Office operational configuration family

The existing locked Back Office shell now exposes a bounded **التشغيل والصلاحيات** family without reopening broad visual design:

- Employees — create/edit, role, store scope, active state, four-digit staging PIN setup;
- Access Rights — explicit POS + Back Office capabilities; Owner authority remains immutable;
- Features — merchant feature switches;
- Stores — create/edit/active state;
- POS Devices — create/edit/store assignment/link status;
- Payment Types — create/edit/enable, kind, offline/online availability, store scope and merchant order.

All merchant mutations cross `PosConfigurationAdminContract`; React state is draft/UI state only.

### 01E — end-to-end verification

Evidence now proves:

1. merchant policy is versioned and idempotent in the staging admin adapter;
2. raw employee PIN is not stored in the public merchant configuration snapshot;
3. duplicate staging PIN fingerprints are rejected;
4. Owner role authority cannot be reduced;
5. merchant policy projects to one exact branch/device effective snapshot;
6. POS-only permissions are separated from Back Office permissions;
7. configured payment order survives the projection;
8. the effective snapshot survives POS local restart;
9. allowed cashier capability succeeds locally;
10. missing capability is denied locally;
11. visible checkout is blocked when `accept-payment` is missing;
12. manager PIN approves only the blocked command and does not change/elevate cashier identity;
13. the next checkout attempt requires a fresh approval;
14. branch scope is enforced;
15. Back Office UI mutations use the Rifad admin contract.

## Verification

Verified on the MAP-01 branch through GitHub Actions after the final authorization slice:

- **UI Manifest Integrity:** PASS.
- **POS application:** PASS — install, typecheck, full tests, build.
- **Back Office application:** PASS — install, typecheck, full tests, build.

Key MAP-01 tests include:

- `apps/pos/src/effective-pos-configuration.test.ts`;
- `apps/pos/src/configured-payment-method-rail.test.tsx`;
- `apps/pos/src/manager-override-dialog.test.tsx`;
- `apps/pos/src/map01-owner-policy-integration.test.ts`;
- `apps/pos/src/accept-payment-authorization.test.tsx`;
- `apps/backoffice/src/pos-configuration-admin.test.ts`;
- `apps/backoffice/src/pos-configuration-projection.test.ts`;
- `apps/backoffice/src/pos-operational-config-flow.test.tsx`.

## Important staging boundaries — not MAP-01 failures

MAP-01 proves product meaning and local enforcement; it does not falsely claim later infrastructure is production-ready.

- `BrowserPosConfigurationAdmin` is staging storage, not real cloud Back Office persistence.
- `BrowserLocalPersistence` is staging transport, not the MAP-06 production local database.
- The current manager/POS PIN verifier still uses a bounded staging credential fixture/fingerprint approach. Production credential material, brute-force/lockout and host security remain required before the production local-storage/Windows security gates.
- Real Back Office → POS transport is still MAP-11. The MAP-01 integration test deliberately assembles merchant projection and POS local persistence without calling that staging assembly “sync”.
- Real card/Mada terminal integration remains separate.
- Tax/discount sold truth remains MAP-03.
- Shift/cash/time-clock operations remain MAP-02.
- Open-ticket lifecycle remains MAP-04.
- Payment/receipt/refund production lifecycle remains MAP-05.

## MAP-01 exit result

**PASS.**

The product now has a Rifad-owned, locally enforceable configuration/authorization model sufficient for the next dependency: cashier workday truth.

## Next dependency-safe step

**MAP-02 — Shift + Cash Drawer Ledger + Time Clock.**

Do not start MAP-02 automatically from this closeout. Start it only as the next bounded map item after owner review/continuation, using the MAP-01 effective feature/permission model rather than inventing shift authorization independently.
