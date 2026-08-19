# MAP-01 — Effective POS Configuration + Authorization

Status: **IN PROGRESS**

Started: 2026-08-19

Repository: `mhmdacs-collab/rifad-004`

Branch: `agent/pos-visual-pass-01`

## Why this map item exists

MAP-01 is the first production-operational bridge between the merchant-facing Back Office and the branch POS.

Rifad is not discovering this product area from zero. Loyverse is the primary functional/workflow baseline: the merchant administers employees, roles/access rights, feature switches, stores/POS devices and payment types from Back Office; the POS consumes the effective result and enforces it during cashier work. Rifad keeps that proven product split unless there is a documented reason to improve it.

The architecture remains Rifad-owned. Loyverse behavior is the baseline; Loyverse code/schema is not a dependency. Storage, synchronization and LAN remain separate capabilities behind Rifad contracts.

MAP-01 must be complete before MAP-02 shifts/cash and before MAP-04/05 protected void/refund/payment behavior can become production-capable, because those operations need a concrete local authorization answer.

## Current repository truth at start

- `MAP-00` is PASS.
- Current POS already has device link + branch identity and four-digit PIN unlock.
- Current `EmployeeSession` carries employee ID/name/role name only; role name is not sufficient authorization authority.
- Current mock PIN implementation recognizes one fixed cashier PIN only.
- Current checkout surface hard-codes Cash and mock Card/Mada rather than consuming merchant-configured enabled payment methods/order.
- Current Back Office implements the catalog family only; Employees, Access Rights, Features, Stores, POS Devices and Payment Types are already reserved/mapped in the UI manifest but not executable.
- `LocalPersistenceContract` already provides Rifad-owned versioned snapshots/revisions and can host a staging effective-configuration projection without selecting the production database.
- Production sync selection remains paused until MAP-10. MAP-01 does not introduce a sync engine.

## Loyverse parity baseline used by MAP-01

### Back Office-owned

1. Employees
   - name/contact identity;
   - role;
   - unique PIN semantics;
   - allowed stores/branches;
   - account/back-office access where applicable later.

2. Access Rights
   - Owner has full authority;
   - non-owner roles are configurable;
   - custom roles are allowed;
   - store scope further limits where an employee can act;
   - role display name alone never authorizes an action.

3. Features
   - shifts;
   - time clock;
   - open tickets;
   - kitchen/customer-display/dining capabilities and other merchant feature switches as they enter approved Rifad scope.

4. Stores / branches
   - merchant-defined store identity and operational assignment.

5. POS devices
   - device identity and store assignment.

6. Payment types
   - merchant-defined enabled methods and display order;
   - device/provider setup remains a separate device/integration concern.

### POS-consumed / locally enforced

The POS must be able to answer concrete authorization questions from the last effective local snapshot without a cloud call during ordinary offline work.

Initial capability keys required by current/forthcoming Rifad flows include:

- accept payment;
- view all receipts;
- reprint/resend receipts;
- apply restricted discounts;
- change tax during sale;
- perform returns;
- manage all open tickets;
- void previously saved items;
- view sensitive shift report/totals;
- open cash drawer without sale;
- manage POS items where that surface is enabled;
- view item cost where relevant;
- change device settings.

Capabilities for future screens can exist as policy facts before the corresponding feature UI is implemented; they must not falsely mark the later feature itself complete.

### One-action manager override

When a cashier lacks a permission, a locally available eligible employee may authorize exactly the blocked action using PIN. The approval:

- does not change the active cashier session;
- does not elevate subsequent actions;
- records actor, approver, action/capability, time and target/command context where audit requires it;
- never stores the raw PIN in audit evidence.

## Rifad contract boundaries

MAP-01 will add small bounded contracts rather than hide authorization in components:

- effective POS configuration reader;
- authorization decision boundary;
- one-action manager override boundary;
- explicit revision/version identity for locally effective configuration.

The POS aggregate runtime may expose these contracts through composition, but UI/domain code must not reach into adapter storage directly.

## Effective configuration projection

The local projection is owner-managed configuration materialized for one branch/device. It is not the merchant-management source of truth.

Minimum MAP-01 projection:

- schema/version identity;
- configuration revision;
- effective timestamp;
- branch/store ID;
- POS device ID;
- enabled feature flags;
- enabled payment methods + stable IDs + order + availability requirements;
- local employee authorization snapshots relevant to the branch;
- role/capability set and branch scope.

Taxes, discounts, receipt configuration, dining/place configuration and other owner-managed facts remain part of the wider effective-configuration concept, but their executable business semantics are introduced in their dependency map items (`MAP-03`/`MAP-04`/`MAP-05`) rather than prematurely freezing incomplete sale/refund models here.

## Implementation slices

### MAP-01A — authority/manifest readiness

- reconcile the mapped Loyverse screens/actions into one bounded ready configuration/access flow;
- preserve stable existing screen IDs;
- authorize only the visible behaviors actually implemented by MAP-01.

### MAP-01B — contracts + local projection

- add Rifad configuration/authorization types and contracts;
- add a staging local adapter backed through the existing local-persistence boundary;
- create deterministic starter configuration for current test/demo branch without selecting production storage.

### MAP-01C — POS enforcement

- load the versioned effective configuration on POS startup;
- derive payment-method availability/order from configuration rather than hard-coded display policy;
- enforce current protected actions through authorization instead of role-name checks/component hacks;
- add one-action manager override behavior and audit evidence;
- preserve offline/restart behavior.

### MAP-01D — Back Office management slice

Activate, inside the existing locked Back Office shell and Loyverse interaction baseline:

- Employees;
- Access Rights;
- Features;
- Stores;
- POS Devices;
- Payment Types.

All mutations must cross Rifad-owned contracts. The current browser/local transport can remain staging until real Back Office ↔ POS transport in MAP-11.

### MAP-01E — verification + closeout

Required evidence:

1. owner-configured policy produces a versioned effective POS projection;
2. POS can cold/restart from the local projection without cloud dependency;
3. allowed cashier action succeeds;
4. denied action is visibly denied;
5. eligible manager PIN authorizes one blocked action only;
6. active cashier identity is unchanged after override;
7. payment methods shown by the POS follow enabled/order configuration;
8. branch/device scope is enforced;
9. tests cover contract behavior, restart/offline projection behavior and manager override;
10. manifest, field register, UI progress, final map/current handoff and this file are reconciled before MAP-01 is marked PASS.

## Explicit non-goals

MAP-01 does **not**:

- select the production local database;
- restart synchronization-provider selection;
- implement LAN/Branch Hub;
- implement complete tax/discount calculation snapshots;
- implement shift/cash/time-clock operation itself;
- implement refund lifecycle;
- implement real Mada/payment-terminal support;
- implement ZATCA;
- claim real cloud Back Office ↔ POS transport.

## Continuity rule for this work

After every meaningful implementation slice, update this file (or a linked current execution status record) with:

- what changed;
- why it changed;
- evidence/tests available;
- remaining gaps;
- next dependency-safe step.

When MAP-01 reaches PASS, reconcile all higher-authority/current-state documents so a new AI/tool/session can recover the same project state without relying on chat history.

## Current checkpoint

**MAP-01A review complete; implementation work has started.**

The first code slice is the Rifad-owned effective-configuration/authorization contract and local staging projection, followed by POS consumption/enforcement. No external coding agent is required for this slice; use Codex only if a later task cannot be safely completed through the available repository tools or needs a broader code transformation/test loop.
