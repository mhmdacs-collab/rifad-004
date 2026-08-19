# Rifad UI / Product Progress

Last updated: 2026-08-20

Status: **MAP-01 PASS — effective configuration/authorization vertical slice implemented**

Use with:

- `PROJECT_RULES.md`;
- `docs/architecture/CURRENT_DECISIONS.md`;
- `docs/RIFAD_FINAL_IMPLEMENTATION_MAP.md`;
- `docs/implementation/CURRENT_EXECUTION_STATUS.md`;
- `docs/implementation/MAP_01_IMPLEMENTATION_PLAN.md`;
- `UI_EXECUTION_MANIFEST.json`;
- `POS_UI_NAMING_AND_FIELD_REGISTER.md`.

This file reports current executable reality. It does not turn staging storage/transports into production claims.

---

## Status legend

- ✅ **Implemented/executable** — code exists in the current branch and the applicable current tests/build pass.
- 🟡 **Executable proof/staging** — behavior exists and is testable but production persistence/transport/security/hardware remains incomplete.
- 🧩 **Mapped/discovered** — product meaning exists but is not yet executable.
- ⛔ **Not claimed** — explicitly outside current production evidence.

---

# 1. Current map checkpoint

- `MAP-00` — ✅ PASS.
- `MAP-01` — ✅ PASS.
- `MAP-02` — next dependency; **not started by MAP-01 closeout**.

Current dependency order remains:

`MAP-02 shift/cash/time clock → MAP-03 sold-line truth → MAP-04 open orders → MAP-05 payments/receipts/refunds → MAP-06 production local persistence → MAP-07/08/09 host/hardware → MAP-10 sync re-entry → MAP-11 real Back Office ↔ POS transport`.

---

# 2. Product surfaces

| Surface | Current state |
|---|---|
| POS | ✅ substantial executable cashier application + MAP-01 local configuration/authorization enforcement |
| Back Office | ✅ locked management shell + catalog family (`BO-FLOW-002`) + operational configuration/access family (`BO-FLOW-003`) |
| Dashboard | 🧩 mapped/researched only |
| KDS | 🧩 mapped/researched; current kitchen revision/dispatch is mock only |
| CDS | 🧩 mapped/researched only |

Rifad is one product with distinct role contexts. Owner/management configures merchant policy in Back Office; cashier POS consumes the relevant effective local projection instead of duplicating administration screens.

---

# 3. POS — current executable reality

## 3.1 Device / employee entry

✅ Account/device-link entry exists (`POS-SCREEN-001`).

✅ Device session carries device and branch identity.

✅ Four-digit employee PIN unlock exists (`POS-SCREEN-002`).

✅ MAP-01 adds capability-based authorization outside the legacy `EmployeeSession`; role display name is not authority.

✅ Branch scope and employee active state are evaluated locally from the effective configuration.

🟡 Current base employee unlock and manager-PIN verifier still use staging credential fixtures. Production credential storage, brute-force/lockout and host security are later requirements.

🧩 Time clock operation itself remains MAP-02.

## 3.2 Sales workspace

✅ Arabic RTL/touch-first sales workspace.

✅ Tablet/wide catalog + ticket composition; constrained layouts adapt rather than shrink important targets.

✅ Quick Sale/search mode, catalog/category search and product-card addition.

✅ Quantity edit/keypad, line removal and Clear Cart.

✅ Editable sale pages: create/rename/delete/move/place/remove.

✅ Stable transaction operation geometry across sale/payment/success.

✅ **دفع** now evaluates MAP-01 `accept-payment` locally before checkout.

✅ If the cashier lacks `accept-payment`, checkout is visibly blocked and the manager one-action PIN overlay is shown.

✅ A successful manager approval allows only that checkout command; a later checkout requires a fresh approval.

🧩 Open-value/weighed-item entry remains unimplemented.

🧩 Option-priced items stay hidden until MAP-03 cashier chooser/sold snapshot work.

🧩 Add-ons, discount/tax and fulfillment sold-line snapshots remain MAP-03.

## 3.3 Effective POS configuration — MAP-01

✅ `EffectivePosConfigurationContract` exists.

✅ Effective snapshot carries:

- branch/device identity;
- configuration revision/effective time;
- feature flags;
- enabled payment methods/order/connectivity requirement;
- branch-relevant employee snapshots;
- POS capability snapshots.

✅ Pure merchant-policy projection validates store/device relationship and strips Back Office-only rights.

✅ Effective configuration is reconstructed from current local staging persistence after restart.

✅ Payment-method selection renders enabled methods in merchant-defined order rather than a hard-coded display list.

✅ No-enabled-payment state is safe and visible.

🟡 Browser local persistence remains staging; production engine is MAP-06.

🟡 Real Back Office → POS transport remains MAP-11. Current tests explicitly assemble the projection locally without calling it synchronization.

## 3.4 Authorization / manager override — MAP-01

✅ `AuthorizationContract` evaluates concrete capability, employee activity, branch scope and role/capability relationship.

✅ `ManagerOverrideContract` approves one blocked command only.

✅ Approval audit fact carries actor/approver/capability/branch/command/target/revision without raw PIN.

✅ Receipt reprint is protected by `reprint-resend-receipts`.

✅ Checkout is protected by `accept-payment`.

✅ Visible manager overlay collects four digits without switching the active employee.

✅ Restart/integration tests prove the effective permission state persists while override does not create lasting elevation.

## 3.5 Customers / credit / loyalty

✅ Customer search/create/edit/attach/profile/purchase history.

✅ Customer credit sale, debt ledger and settlement proof.

✅ Loyalty status/redemption/earning/purchase linkage proof.

🟡 These still use current mock/staging runtime and are not claims of production cloud persistence, final permissions, aging/limits or accounting integration.

## 3.6 Checkout / payments

✅ Cash payment, exact/over tender and change.

✅ Rifad Money/halala semantics in current flow.

✅ Payment method display/order comes from MAP-01 effective config.

🟡 Card/Mada remains mock UX only.

⛔ No real terminal/provider/reconciliation/refund claim.

🧩 Split-ready durable payment records remain MAP-05.

## 3.7 Receipts / printing

✅ Sale success.

✅ Receipt list/history (`POS-SCREEN-016`).

✅ Reprint + delivery-unknown confirmation.

✅ MAP-01 reprint authorization/manager override.

✅ Current email receipt behavior.

🟡 Printing transport is mock/staging.

🧩 Receipt detail/refund lifecycle remains MAP-05.

## 3.8 Restaurant local-service proof

✅ `POS-FLOW-002` still proves service OFF/simple/advanced place modes.

✅ Generic `PlaceGroup → ServicePlace` and local open-order create/reopen/update/send/close proof.

🟡 Restaurant configuration and kitchen revision remain staging/mock. MAP-01 introduced owner feature-policy authority but does not falsely migrate the full restaurant configuration/lifecycle ahead of its later map work.

⛔ No production multi-device locking, real KDS/printer dispatch or delivery connector claim.

---

# 4. Back Office — current executable reality

The broad visual shell remains locked for the current cycle. MAP-01 extended capabilities inside it without reopening a redesign.

## 4.1 Catalog — `BO-FLOW-002`

✅ Item list/search/filter.

✅ Add/edit item, category, SKU/barcode, available-for-sale.

✅ Fixed pricing.

✅ Reusable pricing option groups, inherited prices and sparse item overrides.

✅ Item-private multiple price choices.

✅ Reusable/private add-ons.

✅ Merchant colors/item appearance staging.

🟡 `BrowserCatalogAdapter` schema v4 and `imageDataUrl` remain staging transports.

## 4.2 Operational configuration/access — `BO-FLOW-003` / MAP-01

✅ **Employees (`BO-SCREEN-021`)** — list/create/edit, role, allowed stores, active state, staging PIN setup.

✅ **Access Rights (`BO-SCREEN-022`)** — explicit POS + Back Office capabilities; Owner authority immutable.

✅ **Features (`BO-SCREEN-026`)** — merchant feature switches.

✅ **Stores (`BO-SCREEN-027`)** — list/create/edit/active state.

✅ **POS Devices (`BO-SCREEN-028`)** — list/create/edit/store assignment/link status.

✅ **Payment Types (`BO-SCREEN-029`)** — list/create/edit, kind, enabled, availability, store scope and ordering.

✅ All mutations cross `PosConfigurationAdminContract` with stable command identity.

✅ Staging PIN uniqueness/non-leakage and payment ordering are covered by tests.

🟡 `BrowserPosConfigurationAdmin` is staging storage. It defines product meaning but is not production Back Office/cloud topology.

## 4.3 Other Back Office families

🧩 Reports / inventory / customers administration.

🧩 Timecards/total hours — MAP-02 dependency.

🧩 Taxes and Discounts — MAP-03 business semantics.

🧩 Receipt settings / refund-related policy — later MAP-05 work.

🧩 Open-ticket settings — MAP-04.

🧩 Kitchen printers/displays, Dining Options configuration, billing and later verticals remain separately gated.

---

# 5. Rifad-owned architecture evidence

## POS runtime

✅ `PosRuntimeContract` remains injected through composition.

✅ MAP-01 adds `effectiveConfiguration`, `authorization`, `managerOverride` as Rifad-owned capabilities outside the legacy mock runtime.

## Merchant configuration

✅ `PosConfigurationAdminContract` owns merchant operational policy.

✅ `projectEffectivePosConfiguration()` is provider/storage/sync-independent pure domain logic.

## Local persistence/outbox

✅ `LocalPersistenceContract` remains separate from Sync/LAN/Fiscal.

✅ Stable installation/branch/device identity, private versioned snapshots, atomic snapshot+event semantics, retry bookkeeping and acknowledgement.

✅ MAP-01 adds current staging namespaces:

- `pos.effective-configuration`;
- `pos.authorization-audit`.

✅ MAP-01 adds event proof:

- `authorization.manager-override-approved.v1`.

🟡 Physical browser storage is still staging; production crash/volume/migration/host proof belongs to MAP-06/07/09.

---

# 6. MAP-01 verification evidence

Final MAP-01 behavior is covered by tests including:

- `effective-pos-configuration.test.ts`;
- `configured-payment-method-rail.test.tsx`;
- `manager-override-dialog.test.tsx`;
- `map01-owner-policy-integration.test.ts`;
- `accept-payment-authorization.test.tsx`;
- `pos-configuration-admin.test.ts`;
- `pos-configuration-projection.test.ts`;
- `pos-operational-config-flow.test.tsx`.

Verified CI after the final visible checkout authorization slice:

- ✅ UI Manifest Integrity;
- ✅ POS typecheck/tests/build;
- ✅ Back Office typecheck/tests/build.

Automatic sync-candidate workflows may also run on pushes. Their success/failure does not change current sequencing and does not select a synchronization provider.

---

# 7. Explicit non-claims after MAP-01

Do not claim production readiness for:

- production credential verifier/security;
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

MAP-01 PASS means the **product ownership and local authorization boundary is proven**, not that later transports/infrastructure are already production-ready.

---

# 8. Next dependency-safe product work

**MAP-02 — Shift + Cash Drawer Ledger + Time Clock.**

It must build on the MAP-01 feature flags and permission model, including at least `shifts`, `time-clock`, `view-shift-report` and `open-cash-drawer-without-sale`, rather than introducing an independent role/authorization mechanism.

MAP-02 has not been started by this closeout.
