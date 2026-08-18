# Rifad Sync Candidate Execution — 2026-08-18

Status: **RUNTIME EVIDENCE — BASELINE ONLY, NO PRODUCTION SELECTION YET**

This document records the first executable comparison required by `PROJECT_RULES.md`, `docs/adoption/CAPABILITY_ADOPTION_WORKFLOW.md`, D-032 and `docs/architecture/SYNC_CAPABILITY_BOUNDARY.md`.

The purpose is not to declare a winner from a README. It is to preserve exactly what was run, what passed, what failed, and what remains unproved before Rifad selects a production synchronization implementation.

---

## 1. Common proof scenario

Both candidates were exercised against the same Rifad-shaped behavior:

1. Back Office creates an item locally and POS receives it through the synchronization path.
2. POS performs a permitted mutation and Back Office receives it.
3. POS writes a sale while disconnected/offline, closes/reopens its local database, reconnects, and the sale propagates without becoming a second sale.
4. The proof records explicit remaining platform/security/schema limitations rather than converting a baseline pass into a production claim.

The proof harnesses live under:

- `tests/sync-candidates/couchdb/`
- `tests/sync-candidates/powersync/`

CI workflows:

- `.github/workflows/sync-candidate-couchdb.yml`
- `.github/workflows/sync-candidate-powersync.yml`

---

# 2. Candidate A — Apache CouchDB 3.5.2 + PouchDB 9.0.0

## Runtime used

- GitHub Actions runner: Ubuntu 24.04
- Node: 22.23.2
- CouchDB image: `couchdb:3.5.2`
- observed image digest: `sha256:b80216f643e99d31df318c740dbc556ac08b56444030ed1d5e6d7b0d4e625213`
- PouchDB: `9.0.0`

## Executed behavior

The harness creates separate durable local PouchDB databases representing Back Office and POS and uses continuous replication against CouchDB.

Observed representative successful run: GitHub Actions run `32182718984`.

Evidence from that run:

- Back Office item -> POS: PASS, observed ~101 ms.
- permitted POS mutation -> Back Office: PASS, observed ~101 ms.
- CouchDB server stopped to simulate outage.
- sale written to POS local database while server unavailable.
- local POS/Back Office database processes closed and reopened.
- server restarted and replication resumed.
- offline sale replay -> Back Office: PASS, observed ~305 ms after reconnect in that run.
- repeated synchronization left exactly one sale document: PASS.
- additive fields plus a new option-group entity replicated without changing the replication algorithm: PASS.

The same candidate workflow also passed again on branch head `96e4612a84ac0d0a4a962156a6dbcadccb5cbe32` in run `32183113102`.

## Important concerns discovered

The Node proof dependency installation reported:

- multiple deprecated Level ecosystem dependencies through the current PouchDB package graph;
- two moderate npm audit findings in the proof dependency tree.

This does not invalidate CouchDB's replication protocol. It does mean **PouchDB 9.0.0 must not automatically become Rifad's production client merely because the protocol baseline passed**. A modern browser/Windows client path and dependency/security review are still mandatory.

## Current disposition

**BASELINE PASS — strong replication-protocol reference; production client path not accepted yet.**

Still unproved:

- actual browser/PWA path;
- actual Windows packaged-client path;
- production authentication/authorization;
- tenant and branch isolation;
- Rifad domain conflict policies;
- realistic catalog/sales volume and compaction/storage behavior;
- production upgrade/migration procedure.

---

# 3. Candidate B — PowerSync Service 1.24.0 + Node SDK 0.20.0

## Runtime used

- GitHub Actions runner: Ubuntu 24.04
- Node: 22.23.2
- `@powersync/node`: `0.20.0`
- local SQLite binding in proof: `better-sqlite3 12.11.1`
- PowerSync Service observed at runtime: `1.24.0`, Open Edition
- service image digest: `journeyapps/powersync-service@sha256:0fc9f65e693c07f1206007acddb87141402c09ef20589e29a0dfe20d57ce80b6`
- source database: PostgreSQL 18 container from the current official self-host example
- bucket storage: PostgreSQL 18 container from the same current official example

The workflow clones the current official `powersync-ja/powersync-cli` self-hosted local Postgres example at runtime, then substitutes only the bounded Rifad proof schema/sync config.

## Rifad write-path proof

PowerSync intentionally leaves client uploads to the application backend through `uploadData()`.

The Rifad proof therefore includes a deliberately small generic write adapter/API that:

- receives normalized CRUD operations from the client SDK;
- allowlists proof tables/columns;
- uses parameterized SQL values;
- stores `(device_id, client_op_id)` upload identity;
- ignores a repeated client operation that was already applied.

This is a proof of replay-safe integration behavior, **not** the final Rifad authorization/domain API.

## First run failure and correction

Initial run `32182719003` failed because the proof harness serialized `batch.crud` directly.

Inspection of the current official PowerSync JS `CrudEntryImpl` showed that its JSON representation uses transport names such as `op_id`, `type` and `data`, whereas the proof backend expected `clientId`, `table` and `opData`.

The harness was corrected to explicitly translate the SDK object into the Rifad proof DTO before sending it to the backend. This was a **proof-harness adapter bug**, not a synchronization-service failure.

The correction is commit `96e4612a84ac0d0a4a962156a6dbcadccb5cbe32`.

## Successful runtime evidence

GitHub Actions run `32183112863`: PASS.

Observed evidence:

- Back Office item -> POS: PASS, ~607 ms in that run.
- permitted POS mutation -> Back Office: PASS, ~405 ms.
- POS explicitly disconnected.
- sale written to local SQLite while disconnected.
- POS SQLite client closed and reopened.
- backend intentionally applied the first sale upload and then returned HTTP 503 before acknowledging success.
- PowerSync retained/retried the pending upload.
- backend dedupe prevented a second business application of the same operation.
- Back Office received the sale after reconnect/retry: PASS.
- source PostgreSQL contained exactly one sale row: PASS.

The intentional 503 appears as an upload error in the runtime log; this is expected test stimulus, not a failed run.

The proof dependency installation reported zero npm audit findings for the pinned PowerSync proof package set at execution time.

## Important architecture fact exposed by execution

PowerSync provides local SQLite + download/stream synchronization + durable local CRUD queue/retry, but **Rifad still owns the upload API and its authorization/domain validation**.

That is compatible with Rifad's adapter rules, but it is real implementation work and must not be hidden by saying "PowerSync synchronizes everything automatically". The engine can carry future data generically; accepted mutations still require a secure Rifad server boundary.

## Current disposition

**BASELINE PASS — currently the stronger candidate for deeper Rifad platform proof, not yet selected for production.**

Reasons it advances to the next proof stage:

- local SQLite model fits the desired offline POS direction well;
- successful source Postgres -> local client propagation;
- successful local write -> Rifad backend -> source -> other client loop;
- local restart + queued write survived;
- an ambiguous apply/ack failure was replayed without duplicate sale when paired with Rifad idempotency;
- current proof dependency set was cleaner than the PouchDB Node dependency graph.

Still unproved:

- actual PWA/browser path;
- actual Windows packaged-client path;
- production tenant/branch authorization and mutation validation;
- schema-evolution proof across running old/new client versions;
- production media/attachment strategy;
- conflict/domain policy cases;
- service lifecycle, backup/restore, upgrades and operational cost;
- license/dependency distribution review for the exact production topology.

---

# 4. Current comparison

| Gate | CouchDB + PouchDB | PowerSync |
| --- | --- | --- |
| BO -> POS connected propagation | PASS | PASS |
| permitted POS -> BO propagation | PASS | PASS |
| local offline durable write | PASS | PASS |
| local close/reopen before reconnect | PASS | PASS |
| reconnect replay | PASS | PASS |
| duplicate-sale protection proof | PASS by stable document identity | PASS with explicit Rifad upload dedupe |
| additive data growth baseline | PASS in document model | pending dedicated old/new-client schema proof |
| production Windows path | pending | pending |
| production PWA/browser path | pending | pending |
| authz / tenant isolation | pending | pending |
| dependency/security concern discovered | PouchDB Node graph: deprecations + 2 moderate audit findings | pinned proof graph: 0 audit findings |
| current disposition | protocol baseline / hold for client-path proof | advance to deeper platform proof |

Latency numbers above are CI observations only. They are not product SLAs and should not be compared as a benchmark from one run.

---

# 5. Next mandatory proof

Do **not** select a production synchronization engine yet.

The next execution stage is:

1. prove the PowerSync browser/PWA client against the same Rifad-shaped source/write path;
2. prove the intended Windows client/runtime path, including local database restart/recovery;
3. run an old-client/new-client additive schema evolution case;
4. prove tenant/branch scoping plus server-side mutation authorization;
5. keep CouchDB as the open protocol control and execute its browser path if needed for a fair platform comparison;
6. only then record an adoption/rejection decision and donor/provenance record.

No Branch Hub/LAN implementation is authorized by these results.
