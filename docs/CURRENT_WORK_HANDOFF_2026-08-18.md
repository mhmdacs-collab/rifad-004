# Rifad Current Work Handoff — 2026-08-20 MAP-01 PASS

Status: **CONTINUATION CHECKPOINT — READ FIRST IN A NEW CHAT/CODEX SESSION**

Higher-authority product/architecture decisions remain in `PROJECT_RULES.md` and `docs/architecture/CURRENT_DECISIONS.md`.

---

# 0. Repository / workflow checkpoint

Repository: `mhmdacs-collab/rifad-004`

Active branch: `agent/pos-visual-pass-01`

Pull request: PR #2

Rules:

- keep PR #2 **Draft** and **unmerged** until explicit owner approval;
- before every future write, fetch PR #2 and actual head;
- edit the active branch directly;
- run/check applicable Manifest + POS + Back Office verification after implementation changes;
- do not resume synchronization adoption/debugging before MAP-10;
- do not select production local storage before MAP-06;
- do not start a later map item before its dependencies pass.

---

# 1. Read-first authority

Read in this order:

1. `PROJECT_RULES.md`;
2. `docs/architecture/CURRENT_DECISIONS.md` — especially D-029..D-033;
3. `docs/RIFAD_FINAL_IMPLEMENTATION_MAP.md`;
4. `docs/implementation/CURRENT_EXECUTION_STATUS.md`;
5. `docs/implementation/MAP_01_IMPLEMENTATION_PLAN.md`;
6. `docs/ui/UI_EXECUTION_MANIFEST.json`;
7. `docs/ui/POS_UI_NAMING_AND_FIELD_REGISTER.md`;
8. `docs/ui/UI_PROGRESS.md`;
9. current capability boundaries;
10. this handoff;
11. research as evidence only.

Rifad owns product meanings/contracts. External projects/libraries are donors or adapters, never hidden authority.

---

# 2. Current map state

- `MAP-00` — **PASS**.
- `MAP-01` — **PASS — 2026-08-20**.
- `MAP-02` — next dependency; **not started by this handoff**.

Current sequence remains:

`MAP-02 shift/cash/time clock → MAP-03 sold-line truth → MAP-04 open orders → MAP-05 payments/receipts/refunds → MAP-06 production local persistence → MAP-07/08/09 host/hardware → MAP-10 synchronization re-entry → MAP-11 real Back Office ↔ POS integration`.

---

# 3. Product role split now implemented by MAP-01

## Owner / Back Office

Owner policy now has Rifad-owned executable meanings for:

- Employees;
- Roles / Access Rights;
- Features;
- Stores;
- POS Devices;
- Payment Types and order.

This is implemented by `BO-FLOW-003 — POS Operational Configuration and Access` inside the existing locked Back Office shell.

## Cashier / branch POS

POS consumes a branch/device-specific effective projection containing the locally needed policy and can enforce it without a live cloud call.

Role display name is not authorization. The POS evaluates concrete capability + employee activity + branch scope + role/capability snapshot.

---

# 4. MAP-01 contracts / implementation

## Merchant administration

`contracts/posConfigurationAdmin.ts` and `PosConfigurationAdminContract` own merchant intent.

Current admin staging implementation: `BrowserPosConfigurationAdmin`.

It proves:

- stable command identity/idempotency;
- employee/role/store/device/payment-type mutations;
- immutable Owner role authority;
- PIN setup semantics without storing raw PIN in merchant configuration;
- staging PIN uniqueness fingerprints;
- explicit Payment Type ordering.

## Pure effective projection

`core/posConfiguration/projectEffectivePosConfiguration.ts` projects merchant policy to one branch/device snapshot and:

- validates store/device relationship;
- filters branch employee/payment scope;
- carries feature flags;
- carries configured payment order;
- strips Back Office-only permissions from the POS projection.

It has no database-provider, cloud, LAN or synchronization dependency.

## POS local effective configuration

`contracts/posConfiguration.ts` defines:

- feature keys;
- POS permission keys;
- effective payment methods/order/availability;
- role/employee snapshots;
- `EffectivePosConfigurationContract`;
- `AuthorizationContract`;
- `ManagerOverrideContract`.

Current POS local staging persistence stores the effective snapshot under `LocalPersistenceContract` and survives restart evidence.

## Visible enforcement

- **دفع** checks `accept-payment` before checkout.
- If missing, checkout remains blocked and the manager PIN overlay appears.
- A valid manager may approve exactly that checkout command.
- Returning and pressing **دفع** again requires a fresh approval; no session elevation occurs.
- Archived receipt reprint uses `reprint-resend-receipts` through the same permission/override boundary.
- Payment method list/order comes from effective configuration rather than hard-coded display policy.

---

# 5. Back Office current executable state

## Catalog — `BO-FLOW-002`

Still executable:

- Items;
- Categories;
- reusable pricing option groups;
- reusable/private add-ons;
- SKU/barcode staging identity;
- appearance/color/image staging.

## Operational configuration/access — `BO-FLOW-003`

Now executable:

- `BO-SCREEN-021` Employees;
- `BO-SCREEN-022` Access Rights;
- `BO-SCREEN-026` Features;
- `BO-SCREEN-027` Stores;
- `BO-SCREEN-028` POS Devices;
- `BO-SCREEN-029` Payment Types.

All mutations cross `PosConfigurationAdminContract`.

Unrelated Back Office families remain mapped/gated.

---

# 6. POS current executable state

Existing POS capabilities remain, including:

- device linking;
- employee PIN;
- Arabic RTL/touch sales;
- Quick Sale/search;
- editable sale pages;
- basket/keypad;
- cash checkout/change;
- mock Card/Mada;
- customer/credit/loyalty;
- receipt history/reprint/email;
- restaurant local-service/open-place staging flow;
- Rifad local persistence/outbox journaling.

MAP-01 adds real product-level configuration/authorization meaning on top of this staging runtime without making the legacy mock the owner of policy.

---

# 7. MAP-01 verification

Key tests:

- `apps/pos/src/effective-pos-configuration.test.ts`;
- `apps/pos/src/configured-payment-method-rail.test.tsx`;
- `apps/pos/src/manager-override-dialog.test.tsx`;
- `apps/pos/src/map01-owner-policy-integration.test.ts`;
- `apps/pos/src/accept-payment-authorization.test.tsx`;
- `apps/backoffice/src/pos-configuration-admin.test.ts`;
- `apps/backoffice/src/pos-configuration-projection.test.ts`;
- `apps/backoffice/src/pos-operational-config-flow.test.tsx`.

Verified before MAP-01 closeout:

- UI Manifest Integrity — PASS;
- POS application — typecheck/tests/build PASS;
- Back Office application — typecheck/tests/build PASS.

---

# 8. Staging boundaries that must not be over-claimed

MAP-01 PASS does **not** mean these are production-complete:

- production employee credential verifier / brute-force / lockout / host security;
- production local database;
- real Back Office ↔ POS transport;
- synchronization provider;
- LAN/Branch Hub;
- real payment terminal;
- tax/discount sold snapshots;
- shift/cash/time-clock operations;
- full open-ticket lifecycle;
- normalized payment/receipt/refund lifecycle;
- real printer/KDS/CDS;
- ZATCA/fiscal;
- final database schema.

Current browser admin/local-persistence transports are staging implementations behind Rifad-owned contracts.

---

# 9. Synchronization evidence — preserved, paused

Existing CouchDB/PowerSync candidate proofs under `tests/sync-candidates/` and `docs/research/sync/` remain evidence only.

No provider is production-selected. Automatic workflow runs do not change this.

Keep separate:

`Local Persistence != Sync != LAN/Branch Hub != Fiscal/ZATCA`

---

# 10. Next dependency-safe step

**MAP-02 — Shift + Cash Drawer Ledger + Time Clock.**

When MAP-02 is started, it must reuse MAP-01 configuration/authorization rather than inventing a parallel permission model. Relevant existing policy keys already include:

- feature `shifts`;
- feature `time-clock`;
- permission `view-shift-report`;
- permission `open-cash-drawer-without-sale`.

MAP-02 must define durable operational facts (shift, cash movements, time clock) and prove restart/offline behavior. It has **not** been started in this closeout.

Stop here for owner review/continuation.
