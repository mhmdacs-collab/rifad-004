# Rifad Current Execution Status

Last updated: 2026-08-19

Branch: `agent/pos-visual-pass-01`

Current map item: **MAP-01 — Effective POS Configuration + Authorization**

Status: **IN PROGRESS**

## Why we are doing this now

MAP-00 reconciled repository truth. MAP-01 is next because shifts, cash operations, protected open-ticket actions, payment choices, receipts/reprints and future refunds all require locally enforceable owner-defined configuration and permissions before they can become production behavior.

Product baseline: start from the mature Loyverse split rather than inventing the ownership model again. Back Office administers merchant policy; POS consumes the effective result and enforces it locally. Rifad owns the contracts, data meanings and implementation boundaries.

Architecture constraints remain:

- local-first POS;
- no live cloud dependency for ordinary offline-capable cashier authorization;
- production DB remains unselected until MAP-06;
- sync-provider work remains paused until MAP-10;
- LAN/Branch Hub, fiscal/ZATCA and payment-terminal work remain separate capabilities.

## Completed in the current MAP-01 slice

1. Added `docs/implementation/MAP_01_IMPLEMENTATION_PLAN.md` with the Loyverse parity baseline, Rifad ownership boundary, dependency-safe slices, exit gate and continuity requirements.
2. Added Rifad-owned shared contract `contracts/posConfiguration.ts` covering:
   - feature keys;
   - concrete POS permission keys;
   - effective payment-method configuration/order/availability;
   - role and employee authorization snapshots;
   - versioned effective POS configuration;
   - authorization decisions;
   - one-action manager override approvals.
3. Added `apps/pos/src/runtime/effectivePosConfigurationAdapter.ts`:
   - local effective-configuration namespace behind `LocalPersistenceContract`;
   - branch/device-scoped staging projection;
   - permission evaluation by employee + role + branch scope, never by role display name alone;
   - one-action manager override;
   - durable idempotent override audit snapshot + outbox event;
   - raw PIN excluded from configuration and audit payloads.
4. Updated the POS runtime contract/composition so configuration, authorization and manager override are Rifad-owned capabilities composed outside the legacy mock runtime.
5. Added `apps/pos/src/effective-pos-configuration.test.ts` covering:
   - unbound-device rejection;
   - versioned effective configuration;
   - restart persistence;
   - concrete capability evaluation;
   - branch scope;
   - authorized vs unauthorized override PIN;
   - idempotent one-action approval/audit;
   - no raw manager PIN leakage in approval/outbox evidence.

## Important staging boundary

The current local employee PIN map used by the new override adapter is explicitly a **staging fixture**, not the final production credential-verifier design. It is isolated inside the adapter and is not stored in effective configuration or audit facts. Production-safe local employee credential material and brute-force/lockout behavior must be resolved before the production local-storage/host security gates.

## Verification state

- UI Manifest Integrity workflow: PASS on the first MAP-01 contract/test slice commit.
- Back Office application workflow: PASS on the same commit.
- POS application workflow: still running at the time of this update; do not mark this slice verified until it completes successfully.
- Sync-candidate workflows may still auto-run on pushes but are not the current implementation lane and do not change MAP-10 sequencing.

## Next dependency-safe step

1. Confirm POS application workflow result and fix any compile/test failure before adding visible behavior.
2. Make the bounded MAP-01 visible flows ready in `UI_EXECUTION_MANIFEST.json` before changing cashier/Back Office screens.
3. Make the POS consume the effective payment-method list/order and enforce current protected actions.
4. Add the visible one-action manager-PIN interaction without changing the active cashier session.
5. Activate the corresponding Back Office management family inside the existing locked shell: Employees → Access Rights → Features → Stores → POS Devices → Payment Types.
6. Reconcile Field Register/UI Progress/current handoff/final map only when the implemented facts actually change; mark MAP-01 PASS only after its complete exit gate is proven.

## Tool continuity

Direct repository tools are sufficient for the current slice. If a later step requires a broad multi-file transformation or test/debug loop that cannot be safely completed with the available repository tools, request Codex explicitly and provide a scoped prompt. Do not use Codex merely because credits are available.
