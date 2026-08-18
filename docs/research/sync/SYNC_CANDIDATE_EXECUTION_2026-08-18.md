# Rifad Sync Candidate Execution — 2026-08-18

Status: **RUNTIME EVIDENCE — POWERSYNC LEADS DEEPER PROOF, NO FINAL PRODUCTION SELECTION YET**

This document records executable evidence required by `PROJECT_RULES.md`, `docs/adoption/CAPABILITY_ADOPTION_WORKFLOW.md`, D-032 and `docs/architecture/SYNC_CAPABILITY_BOUNDARY.md`.

The rule remains: do not select synchronization from README claims. Run the candidate, force failure/restart/schema/security cases, preserve exact limitations, then adopt behind a Rifad-owned boundary only after the remaining gates are acceptable.

---

# 1. Product behavior being proved

The common Rifad-shaped target is:

1. Back Office changes propagate automatically to relevant POS clients.
2. permitted POS changes propagate back to cloud/Back Office/relevant clients.
3. ordinary POS selling remains local-first when disconnected.
4. reconnect/restart replays pending facts without duplicate finalized sales.
5. normal additive product growth does not require rewriting the synchronization engine.
6. merchant/branch boundaries and mutation permissions are enforced from signed/server-verifiable authority, not client claims.
7. Windows and browser/PWA-class client paths actually execute.

Proof code lives under:

- `tests/sync-candidates/couchdb/`
- `tests/sync-candidates/powersync/`
- `tests/sync-candidates/powersync-web/`
- `tests/sync-candidates/powersync-windows/`

CI workflows:

- `.github/workflows/sync-candidate-couchdb.yml`
- `.github/workflows/sync-candidate-powersync.yml`
- `.github/workflows/sync-candidate-powersync-web.yml`
- `.github/workflows/sync-candidate-powersync-windows.yml`

---

# 2. Candidate A — Apache CouchDB 3.5.2 + PouchDB 9.0.0

## Runtime evidence

Representative environment:

- Ubuntu 24.04 GitHub Actions runner;
- Node 22;
- CouchDB `3.5.2`;
- PouchDB `9.0.0`.

Observed CouchDB image digest during proof:

`sha256:b80216f643e99d31df318c740dbc556ac08b56444030ed1d5e6d7b0d4e625213`

Successful runs include `32182718984`, `32183113102` and current-line run `32184498304`.

Proved behavior:

- Back Office item -> POS: PASS;
- permitted POS mutation -> Back Office: PASS;
- server outage while POS continues local write: PASS;
- local database close/reopen before reconnect: PASS;
- reconnect/resume: PASS;
- repeated synchronization leaves one stable sale document: PASS;
- additive fields and a new option-group entity replicate without changing the replication algorithm: PASS.

Representative observed timings from one run were ~101 ms connected propagation and ~305 ms reconnect replay. These are CI observations, not product SLAs.

## Concern discovered

The current PouchDB 9 Node proof dependency graph reports multiple deprecated Level ecosystem packages and two moderate npm-audit findings.

This does **not** invalidate CouchDB's mature replication protocol. It does mean PouchDB 9 is not automatically accepted as Rifad's production Windows/PWA client merely because the protocol baseline passed.

## Disposition

**PASS as the open replication-protocol control/baseline. HOLD as a production client stack pending a cleaner modern Windows/browser client path.**

Still unproved for this candidate:

- production Windows packaged client;
- production browser/PWA client;
- signed tenant/branch isolation in the actual chosen client topology;
- Rifad server/domain mutation authorization;
- realistic storage/compaction/upgrade behavior.

---

# 3. Candidate B — PowerSync

PowerSync has now passed substantially more Rifad-specific gates than the initial baseline.

## Runtime components exercised

- PowerSync Service `1.24.0` Open Edition;
- observed service image digest:
  `journeyapps/powersync-service@sha256:0fc9f65e693c07f1206007acddb87141402c09ef20589e29a0dfe20d57ce80b6`;
- `@powersync/node 0.20.0`;
- `@powersync/web 2.2.0`;
- SQLite via the PowerSync client path;
- PostgreSQL 18 source/storage containers from the current official self-host example;
- Chromium browser runtime;
- Windows Server 2025 GitHub Actions runtime.

The proof dependency sets reported zero npm-audit vulnerabilities at the recorded executions. `better-sqlite3` currently brings a deprecated `prebuild-install` warning, which remains dependency-maintenance evidence to watch.

---

## 3.1 Connected + offline + ambiguous retry — PASS

Successful PowerSync baseline runs include `32183112863` and current-line run `32184498353`.

The proof executes:

`local client -> Rifad upload adapter/API -> PostgreSQL source -> PowerSync -> other local client`

Proved:

- Back Office item -> POS: PASS;
- permitted POS mutation -> Back Office: PASS;
- POS disconnect -> local sale write: PASS;
- close/reopen local SQLite before reconnect: PASS;
- queued operation survives restart: PASS;
- backend intentionally applies a sale and then returns HTTP 503 before acknowledgement;
- PowerSync retries the pending operation;
- Rifad idempotency/dedupe leaves exactly one source sale row: PASS.

On run `32184498353`, representative connected observations were ~708 ms BO->POS and ~303 ms POS->BO; ambiguous reconnect replay was ~102 ms after the reconnect phase. These are proof observations, not SLAs.

### Important architecture fact

PowerSync does not remove Rifad's write/domain API. The client `uploadData()` path still needs a Rifad-owned server boundary that authenticates, authorizes, validates business commands/facts and applies idempotent writes.

That is compatible with the existing Rifad architecture: PowerSync can own replication mechanics while Rifad continues to own accepted business mutation semantics.

---

## 3.2 Additive old/new client schema growth — PASS

File: `tests/sync-candidates/powersync/schema-evolution.mjs`

Run `32184121476` passed; the same gate also passed in run `32184498353`.

The proof runs two clients simultaneously:

- an old client that does not know the new `kitchen_label` field;
- a new client that does know it.

The source adds/updates the new field.

Result:

- old client continues receiving compatible known fields;
- old client does not break because it does not expose the unknown additive field;
- new client receives the additive field;
- subsequent updates continue reaching both according to their schema;
- synchronization engine code is unchanged.

Recorded result:

`sync_engine_rewrite=false old_client_survives=true new_client_field=true`

This directly satisfies the owner's requirement that normal future fields should evolve through ordinary schema/configuration work rather than a new synchronization engine per feature.

---

## 3.3 Browser / PWA-class client path — PASS baseline

Files under `tests/sync-candidates/powersync-web/` run the actual `@powersync/web` client inside Chromium, not a Node-only substitute.

Successful run: `32183763273`.

Proved:

- PostgreSQL/PowerSync source -> browser local database: PASS;
- browser local write -> Rifad upload API -> source: PASS;
- browser client disconnect -> local offline sale: PASS;
- browser page close/reopen while preserving its local durable database: PASS;
- backend intentionally applies the offline sale then returns 503;
- browser client retries;
- exactly one source sale remains: PASS;
- observed retry-attempt count for the intentional ambiguous case: 2.

Representative run observations:

- source -> browser ~112 ms;
- browser -> source ~731 ms;
- reconnect/retry assertion observed one source row.

This is a real **browser/PWA-class synchronization proof**, but it is not yet a full installable-service-worker cold-offline-launch proof and is not an iOS/Safari certification.

---

## 3.4 Windows local SQLite/restart path — PASS baseline

Files under `tests/sync-candidates/powersync-windows/` execute on `windows-latest` / Windows Server 2025.

Successful runs include `32183976254` and current-line run `32184498445`.

Proved on `win32 x64`:

- PowerSync Node/SQLite client initializes on Windows;
- offline local sale creates a pending CRUD/upload operation;
- database closes and reopens;
- sale row survives;
- pending upload queue survives;
- queued client operation identity remains stable across restart.

Representative recorded identity before and after restart was the same `client_op_id=1`.

Limitation: this Windows job does **not yet** connect live to a remote PowerSync Service. Live online service behavior is proved with the same Node client on Linux and the web client in Chromium; Windows currently proves the native local SQLite/restart half only.

---

## 3.5 Signed merchant/branch isolation + server mutation authorization — PASS baseline

File: `tests/sync-candidates/powersync/security-isolation.mjs`

Run: `32184498353`.

The PowerSync Sync Streams were switched at runtime from an unrestricted proof stream to signed-claim scoped queries using:

- `merchant_id = auth.parameter('merchant_id')`;
- `branch_id = auth.parameter('branch_id')`.

Three independently authenticated clients were created across:

- merchant A / branch 1;
- merchant A / branch 2;
- merchant B / branch 1.

Result:

- every client received its own scoped source row;
- merchant A/branch 1 did not receive merchant A/branch 2 or merchant B data;
- branch and merchant isolation both passed.

Recorded result:

`CHECK signed_claim_download_isolation:pass merchant=true branch=true`

A separate Rifad proof write boundary then verified signed JWT claims and Rifad role policy before catalog mutation.

Proved:

- manager in the matching merchant/branch scope: allowed;
- same signed manager trying another merchant: denied;
- same signed manager trying another branch: denied;
- cashier without catalog-management permission: denied;
- denied attempts created zero source rows.

Recorded result:

`CHECK server_mutation_authorization:pass signed_scope=true role_permission=true denied_writes=0`

This is the intended separation: replication can be bidirectional, while signed scope + Rifad permissions/domain authorization decide what the actor may actually mutate.

---

# 4. Licensing / reuse gate

This is still a real selection gate and must not be hand-waved.

Current upstream licensing evidence:

- PowerSync JavaScript/client SDK repository: Apache-2.0;
- PowerSync Service Open Edition: FSL-1.1-ALv2 (source-available), with Apache-2.0 future license after the defined two-year period for each version;
- PowerSync's official licensing page describes the Open Edition as free/self-hosted and the client SDKs as Apache-2.0;
- upstream public explanation says FSL commercial use is allowed except competing use, but Rifad still needs to record the exact production topology and distribution/hosting interpretation before adoption.

Primary sources:

- https://github.com/powersync-ja/powersync-js/blob/main/LICENSE
- https://github.com/powersync-ja/powersync-service/blob/main/LICENSE
- https://powersync.com/legal/licensing-terms
- https://powersync.com/legal/fsl

Do not describe the PowerSync Service itself as OSI open source. The client SDKs are open source; the current server Open Edition is source-available under FSL.

---

# 5. Current comparison

| Gate | CouchDB + PouchDB | PowerSync |
| --- | --- | --- |
| BO -> POS connected propagation | PASS | PASS |
| permitted POS -> BO propagation | PASS | PASS |
| local offline durable write | PASS | PASS |
| local close/reopen before reconnect | PASS | PASS |
| reconnect replay | PASS | PASS |
| duplicate-sale / ambiguous retry protection | PASS by stable document identity | PASS with explicit Rifad upload idempotency |
| additive data growth | PASS document baseline | PASS old/new client schema proof |
| browser/PWA-class runtime | pending modern production client path | PASS Chromium baseline |
| Windows local runtime/restart | pending production client path | PASS win32 x64 baseline |
| live Windows -> remote sync service | pending | pending |
| signed merchant/branch download isolation | pending | PASS baseline |
| server mutation scope/role authorization | pending | PASS Rifad proof boundary |
| current dependency concern | PouchDB graph deprecations + 2 moderate audit findings | 0 audit findings in pinned proof sets; one deprecated prebuild helper warning |
| server licensing | Apache CouchDB is Apache-2.0 | PowerSync Service is FSL source-available; client SDKs Apache-2.0 |
| current disposition | open protocol control / hold | **leading candidate, conditional on remaining operational/license gates** |

Latency observations are not an apples-to-apples performance benchmark and are not product SLAs.

---

# 6. Remaining gates before final adoption

PowerSync is now the **leading candidate**, but production selection is intentionally not declared yet.

Remaining high-value gates:

1. live Windows client -> actual PowerSync Service -> source -> second client, rather than Windows-local-only proof;
2. installable PWA/service-worker cold-offline-launch behavior if Rifad depends on cold launch without network;
3. iPad/Safari path only if practical/required for the selected tablet target;
4. exact production license/topology record for Rifad's commercial deployment;
5. service operations: backup/restore, upgrade/rollback, observability and realistic volume;
6. production authentication/token lifecycle and secret management beyond proof keys;
7. domain-specific conflict cases only where Rifad permits legitimate concurrent edits;
8. final donor/adoption/provenance record after selection.

CouchDB remains the open-protocol control. It does not need equal implementation investment unless a remaining PowerSync gate fails or licensing/operations make PowerSync unattractive.

No Branch Hub/LAN implementation is authorized by these results.
