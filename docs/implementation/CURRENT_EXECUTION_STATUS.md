# Rifad Current Execution Status

Last updated: 2026-08-19

Branch: `agent/pos-visual-pass-01`

Current map item: **MAP-01 — Effective POS Configuration + Authorization**

Status: **IN PROGRESS — contract/projection/POS-consumption foundation verified**

## Why we are doing this now

MAP-00 reconciled repository truth. MAP-01 is next because shifts, cash operations, protected open-ticket actions, payment choices, receipts/reprints and future refunds all require locally enforceable owner-defined configuration and permissions before they can become production behavior.

Product baseline: start from the mature Loyverse split rather than inventing the ownership model again. Back Office administers merchant policy; POS consumes the effective result and enforces it locally. Rifad owns the contracts, data meanings and implementation boundaries.

Architecture constraints remain:

- local-first POS;
- no live cloud dependency for ordinary offline-capable cashier authorization;
- production DB remains unselected until MAP-06;
- sync-provider work remains paused until MAP-10;
- LAN/Branch Hub, fiscal/ZATCA and payment-terminal work remain separate capabilities.

## Completed in the current MAP-01 slices

1. Planning/authority
   - added `docs/implementation/MAP_01_IMPLEMENTATION_PLAN.md` with the Loyverse parity baseline, Rifad ownership boundary, dependency-safe slices, exit gate and continuity requirements;
   - strengthened `PROJECT_RULES.md` with the frontier-first rule, the Loyverse POS/Back Office ownership baseline, explicit reasons required for deviation, and repository execution-continuity requirements.

2. POS effective-configuration / authorization contracts
   - added `contracts/posConfiguration.ts` with feature keys, concrete POS permission keys, configured payment methods/order/availability, employee/role authorization snapshots, versioned effective configuration, authorization decisions and one-action manager approval facts;
   - POS aggregate runtime now exposes `effectiveConfiguration`, `authorization` and `managerOverride` as Rifad-owned capabilities composed outside the legacy mock runtime.

3. Local staging projection and authorization
   - added `apps/pos/src/runtime/effectivePosConfigurationAdapter.ts` behind `LocalPersistenceContract`;
   - configuration is bound to current branch/device and survives adapter restart;
   - authorization checks employee activity, branch scope, role identity and concrete capability rather than role display name;
   - manager override records durable idempotent audit/outbox evidence and never writes the raw PIN to configuration/audit facts.

4. POS consumption
   - added `useEffectivePosConfiguration`;
   - payment-method selection now renders enabled methods from the effective configuration in merchant-defined order instead of hard-coded Cash/Card display policy;
   - an empty configured list produces a safe “no enabled method” state rather than silently falling back to hard-coded methods;
   - existing Cash and current mock Card/Mada execution paths remain the only supported method handlers in this slice; this does not claim real terminal integration.

5. One-action manager override UI
   - added a reusable permission gate and four-digit manager-PIN overlay;
   - receipt reprint is routed through the permission gate; if the configured role lacks `reprint-resend-receipts`, a locally eligible approver can authorize that action once without changing the active cashier session;
   - the starter demo cashier currently retains reprint permission to preserve existing pre-MAP-01 demo behavior; merchant-managed roles may remove it. Product authority is configurable policy, not a hard-coded restrictive cashier role.

6. Owner-admin contract and projection semantics
   - added `contracts/posConfigurationAdmin.ts` for merchant Stores, POS Devices, Roles, Employees, Features and Payment Types;
   - added pure Rifad domain projection `core/posConfiguration/projectEffectivePosConfiguration.ts` to turn merchant policy into one branch/device-specific effective POS snapshot without coupling the meaning to cloud, LAN, database or sync technology;
   - projection filters employee/role/payment facts to the relevant branch and rejects device/store mismatch.

7. Tests added
   - `effective-pos-configuration.test.ts` — local binding/restart, capability authorization, branch scope, manager approval/idempotency/PIN non-leakage;
   - `configured-payment-method-rail.test.tsx` — enabled/order behavior and no hard-coded fallback;
   - `manager-override-dialog.test.tsx` — visible four-digit one-action approval interaction;
   - `pos-configuration-projection.test.ts` — owner policy → exact branch/device effective projection and device/store mismatch rejection.

## Important staging boundaries

The current local employee PIN map used by the POS override adapter is explicitly a **staging fixture**, not the final production credential-verifier design. It is isolated inside the adapter and is not stored in effective configuration or audit facts. Production-safe local employee credential material and brute-force/lockout behavior must be resolved before the production local-storage/host security gates.

The new owner-admin contract and pure projection define product meaning only. Real Back Office → POS transport is still MAP-11; no local browser adapter or shared localStorage trick is to be described as production synchronization.

The first attempt to make reprint visibly protected caused one existing regression test to fail because the starter cashier was arbitrarily made restrictive. That was corrected at the policy fixture, not by weakening authorization: the starter cashier retains previous reprint behavior while the configurable role model still supports denial + one-action override. This preserves old product behavior and keeps authorization under merchant policy.

## Verification state

Latest verified slice includes the owner-admin contract and pure projection test.

- **UI Manifest Integrity:** PASS.
- **POS application:** PASS.
- **Back Office application:** PASS.
- Existing sync-candidate workflows may auto-run on pushes; their results do not change the current MAP-10 sequencing and no sync provider is selected by this work.

## Remaining MAP-01 work

1. Reconcile the new visible authorization/configuration behavior into `docs/ui/UI_EXECUTION_MANIFEST.json` and make only the bounded MAP-01 flows ready/implemented that are actually supported.
2. Implement the Back Office staging administration family inside the existing locked shell:
   - Employees;
   - Access Rights;
   - Features;
   - Stores;
   - POS Devices;
   - Payment Types.
3. Keep every mutation behind `PosConfigurationAdminContract`; do not make React component state the business authority.
4. Add a staging admin adapter/tests with stable command identity and explicit source revision; PIN entry may prove the workflow but must not be promoted to production credential storage.
5. Add an integration/conformance test showing a restrictive merchant role projects to a POS snapshot that visibly blocks a protected action and accepts one manager approval without changing the cashier identity.
6. Update `POS_UI_NAMING_AND_FIELD_REGISTER.md`, `UI_PROGRESS.md`, MAP-01 plan/status and current handoff as each real fact becomes executable.
7. Mark MAP-01 PASS only after the full exit gate in `MAP_01_IMPLEMENTATION_PLAN.md` is proven; then reconcile the final map/current decisions/handoff and advance to MAP-02.

## Next dependency-safe step

The next implementation slice is the **Back Office management family + manifest reconciliation**. This is a broad edit across the large existing `BackOfficeApp.tsx`, the large JSON manifest, admin adapter/tests and documentation. It is a good candidate for a scoped Codex task because the available direct repository writer replaces whole large files rather than applying safe local patches. Codex must be tightly constrained by the prompt provided in the controlling chat; it must not continue into MAP-02, sync, production DB, ZATCA or unrelated visual redesign.

## Tool continuity

Use an external coding agent such as Codex only for a scoped task that cannot be safely or efficiently completed through the currently available repository tools. The agent must receive exact authority files, allowed files/capabilities, tests and stop conditions. After its work, review the diff and CI from this controlling session before accepting the slice.
