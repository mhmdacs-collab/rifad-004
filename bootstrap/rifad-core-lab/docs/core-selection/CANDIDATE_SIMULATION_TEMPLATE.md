# Primary Core Candidate Simulation Template

Candidate: `<name>`

Repository/source: `<url>`

Pinned version/commit: `<exact version/sha>`

Simulation date: `<date>`

Evaluator: `<session/agent>`

Status: `LONG-LIST | SHORTLIST | DEEP-TRIAL | REJECTED | SELECTED`

## 1. Candidate summary

- Project purpose:
- Main language/runtime:
- Database/storage:
- License:
- Maintenance/activity:
- Build/run result:
- Why this candidate is serious:

## 2. Hard blockers

| Blocker | Status | Evidence |
| --- | --- | --- |
| License/control | PASS / FAIL / UNKNOWN | |
| Money/transaction safety | PASS / FAIL / UNKNOWN | |
| Local/offline viability | PASS / FAIL / UNKNOWN | |
| Build/maintenance viability | PASS / FAIL / UNKNOWN | |
| Extensibility/grafting viability | PASS / FAIL / UNKNOWN | |
| Critical data/topology dead end | PASS / FAIL / UNKNOWN | |

If any blocker is FAIL, state whether it is repairable and why the candidate remains or is rejected.

## 3. Core architecture observed

- Domain/business module structure:
- Transaction boundaries:
- Money representation/rounding:
- Persistence/data ownership:
- Migration strategy:
- Extension/plugin/API model:
- Background jobs/events:
- Concurrency model:
- Authentication/authorization model:
- Offline/local assumptions:

## 4. Rifad parity coverage map

For every major family choose `KEEP | MODIFY | REPLACE | GRAFT | N/A` and cite evidence.

| Capability | Disposition | Native maturity | Rifad gap | Planned path |
| --- | --- | --- | --- | --- |
| POS sale core | | | | |
| Catalog/categories | | | | |
| Options/variants/modifiers/add-ons | | | | |
| Discounts/taxes | | | | |
| Customers | | | | |
| Loyalty | | | | |
| Credit/debt | | | | |
| Payments | | | | |
| Split/partial payments | | | | |
| Receipts/refunds | | | | |
| Shifts | | | | |
| Cash drawer ledger | | | | |
| Time clock | | | | |
| Inventory | | | | |
| Restaurant/open orders | | | | |
| Tables/places | | | | |
| Kitchen dispatch/KDS | | | | |
| Customer Display | | | | |
| Dashboard/reports | | | | |
| Back Office management | | | | |
| Permissions/manager controls | | | | |
| Stores/devices/branches | | | | |
| Printing | | | | |
| Hardware/device integration | | | | |
| Delivery/channel behavior | | | | |
| Accounting | | | | |

## 5. Topology simulation

### Local/offline

- Can an ordinary sale complete without cloud?
- What durable state is local?
- What happens after clean restart?
- What happens after crash/interrupted write?
- How are duplicate commands/payments prevented?

### LAN

- Native LAN support:
- Discovery/pairing:
- Reconnect:
- Sequence/replay/dedup:
- Multi-device order/table coordination:
- If weak/missing, likely graft path:

### Restaurant/tables/KDS

- Open-order ownership:
- Table/place locking:
- Concurrent edits:
- Kitchen revision/delta model:
- Restart behavior:
- Move/merge/split/correction lifecycle:
- KDS integration path:

### API/extensibility

- Public/internal API:
- Plugin/module mechanism:
- Direct modification cost:
- Is a thin Rifad facade useful?
- Where adapters are actually needed:

### Database and migrations

- Schema ownership:
- Transaction support:
- Migration tooling:
- Large data evolution:
- Can Rifad add durable fields/entities cleanly?

### Branch/device/sync

- Branch/store identity:
- Device identity:
- Tenant isolation implications:
- Future sync attachment:
- Conflict/replay implications:

### Printing/hardware/payments

- ESC/POS/A4 paths:
- Windows/device support:
- Payment-terminal seams:
- Scanner/cash drawer support:
- Missing grafts:

### ZATCA

- Where fiscal document generation would attach:
- Sale truth source:
- Stable document identity possibility:
- Retry/status/audit storage:
- Risk of duplicate sale/fiscal authority:

## 6. Source/test evidence

List exact paths/tests/issues inspected.

### Strong evidence

- 

### Weak/unknown areas

- 

### Failure cases reproduced

- 

## 7. Runtime trials

| Trial | Result | Evidence |
| --- | --- | --- |
| Install/build | | |
| Basic sale | | |
| Money edge cases | | |
| Restart | | |
| Offline path | | |
| Transaction rollback/failure | | |
| Concurrent/multi-device case | | |
| Table/open-order case | | |
| Migration/schema case | | |
| Performance sample | | |

## 8. License/dependency review

- Main license:
- Relevant file headers:
- Dependency obligations:
- Modification rights:
- Redistribution/SaaS implications:
- Required notices:
- Unresolved legal questions:

## 9. Rifad adaptation estimate

- Native capabilities retained:
- Major modifications:
- Major grafts:
- Expected Rifad-owned code:
- Operational complexity introduced:
- Upgrade/upstream strategy:
- Highest long-term maintenance risks:

## 10. Scorecard

Complete `CORE_SCORECARD.md` dimensions with score + confidence + evidence.

Total: `<0-100>`

Confidence summary: `LOW | MEDIUM | HIGH`

## 11. Recommendation

Disposition:

`ADOPT-PRIMARY-CORE | KEEP-CURRENT-CORE | CONTINUE-RESEARCH | REJECT`

Why:

- 

What must be proven next:

- 

If selected, initial graft plan:

- 
