# Rifad Sync Candidate Scorecard — 2026-08-18

Status: **ACTIVE CANDIDATE PROMOTION GATE**

This scorecard implements the owner's rule:

> Simulate/score the candidates first. Only candidates scoring **90/100 or higher** are promoted to deeper runtime trial. Evaluate strongest to weakest.

The score is a Rifad product-fit filter, not a marketing score and not a substitute for runtime proof. A candidate may also be rejected by a hard blocker even if its weighted score reaches 90.

This document must be read with:

- `PROJECT_RULES.md`
- `docs/architecture/SYNC_CAPABILITY_BOUNDARY.md`
- `docs/research/sync/RIFAD_SYNC_BENCHMARK_2026-08-18.md`
- `docs/research/sync/SYNC_CANDIDATE_EXECUTION_2026-08-18.md`

---

## 1. Weighted simulation model

| Dimension | Weight | What Rifad needs |
| --- | ---: | --- |
| Offline durability, restart, replay and idempotency fit | 20 | POS keeps working locally; queued facts survive restart; reconnect cannot duplicate finalized sales |
| Near-live synchronization and write-path fit | 15 | BO -> POS and permitted POS -> cloud/BO automatically while online |
| Schema/entity evolution | 15 | normal new fields/entities must not require a new synchronization engine |
| Windows + tablet/PWA + practical iPad path | 15 | current Windows priority plus browser/tablet path without separate product architecture |
| Tenant/branch isolation and permissions fit | 10 | signed scope and Rifad authorization remain enforceable independently of replication direction |
| Self-hosting, cost and licensing fit | 10 | zero-cost/open/reusable first; no hidden production lock-in accepted silently |
| Maturity, maintenance and operational evidence | 10 | stable/recoverable operation, active maintenance, inspectable failures/dependencies |
| Rifad adapter fit and future replaceability | 5 | provider stays behind Rifad contracts and does not own Rifad business semantics |
| **Total** | **100** | |

### Hard blockers

Regardless of weighted score, do not promote a candidate if current evidence shows any of the following with no practical workaround:

- no durable offline/restart path for the target client;
- no viable Windows or tablet/PWA path;
- licensing/cost incompatible with Rifad's sourcing policy;
- provider requires Rifad business truth to move into provider-specific contracts;
- ordinary product-field growth requires repeated synchronization-engine redesign.

---

## 2. Simulation ranking — strongest to weakest

### 1. PowerSync — **92/100 — PROMOTE**

| Dimension | Score |
| --- | ---: |
| Offline/restart/idempotency fit | 20/20 |
| Near-live sync/write-path fit | 14/15 |
| Schema/entity evolution | 15/15 |
| Windows + PWA/tablet/iPad path | 13/15 |
| Tenant/branch/permissions fit | 9/10 |
| Self-host/cost/license fit | 7/10 |
| Maturity/operations | 9/10 |
| Rifad adapter fit | 5/5 |
| **Total** | **92/100** |

Why it clears 90:

- local SQLite model fits the local-first POS requirement;
- additive old/new client schema behavior is unusually strong for Rifad's expected product growth;
- stable web client path exists and Windows can use a JS/Node/Electron-class path without making Tauri mandatory;
- self-hosted Open Edition exists;
- Rifad can keep its own upload/domain API and idempotency rules instead of handing business authority to the sync provider.

Deductions:

- current self-hosted service is FSL source-available rather than permissively open source;
- current Tauri SDK is alpha, so it is not used as the basis of the Windows score;
- live Windows -> remote PowerSync service and iOS/Safari production behavior remain explicit trial gates;
- service operations/licensing topology still need final production review.

**Promotion decision: YES. Deep runtime trial is authorized first.**

---

### 2. Couchbase Lite + Sync Gateway — **87/100 — HOLD**

| Dimension | Score |
| --- | ---: |
| Offline/restart/idempotency fit | 20/20 |
| Near-live sync/write-path fit | 15/15 |
| Schema/entity evolution | 12/15 |
| Windows + PWA/tablet/iPad path | 12/15 |
| Tenant/branch/permissions fit | 10/10 |
| Self-host/cost/license fit | 5/10 |
| Maturity/operations | 9/10 |
| Rifad adapter fit | 4/5 |
| **Total** | **87/100** |

Main deductions:

- browser JavaScript and native SDK capabilities are not identical;
- browser client does not currently provide the native P2P path;
- adding collections requires coordinated replication/configuration work rather than being completely transparent;
- Community licensing/distribution is provider-specific and needs legal/product review.

**Promotion decision: NO at the 90 threshold.**

---

### 3. Apache CouchDB + PouchDB-style client — **86/100 — HOLD / OPEN CONTROL**

| Dimension | Score |
| --- | ---: |
| Offline/restart/idempotency fit | 19/20 |
| Near-live sync/write-path fit | 14/15 |
| Schema/entity evolution | 15/15 |
| Windows + PWA/tablet/iPad path | 9/15 |
| Tenant/branch/permissions fit | 7/10 |
| Self-host/cost/license fit | 10/10 |
| Maturity/operations | 8/10 |
| Rifad adapter fit | 4/5 |
| **Total** | **86/100** |

Strengths:

- exceptionally mature and inspectable replication protocol;
- restart/checkpoint/conflict model is strong;
- permissive Apache lineage and self-hosting are excellent controls against lock-in.

Main deductions:

- the currently exercised PouchDB 9 dependency graph showed deprecated Level ecosystem packages and moderate audit findings;
- a clean modern production Windows + browser/PWA client path is less convincing than PowerSync's current path;
- tenant/branch and Rifad mutation authorization need more custom topology/application work.

**Promotion decision: NO at the 90 threshold. Keep as the open replication control.**

Note: Rifad already executed this candidate as the mandatory second real implementation required by `PROJECT_RULES.md`; that baseline evidence remains useful and is not discarded.

---

### 4. RxDB — **81/100 — HOLD**

| Dimension | Score |
| --- | ---: |
| Offline/restart/idempotency fit | 17/20 |
| Near-live sync/write-path fit | 11/15 |
| Schema/entity evolution | 14/15 |
| Windows + PWA/tablet/iPad path | 13/15 |
| Tenant/branch/permissions fit | 6/10 |
| Self-host/cost/license fit | 7/10 |
| Maturity/operations | 8/10 |
| Rifad adapter fit | 5/5 |
| **Total** | **81/100** |

Main deductions:

- generic replication is flexible but leaves more server/auth/permission mechanics for Rifad to implement;
- production SQLite storage has premium/commercial implications;
- it does not reduce enough synchronization infrastructure work compared with the leader.

**Promotion decision: NO.**

---

### 5. Ditto — **78/100 — COMMERCIAL FALLBACK**

| Dimension | Score |
| --- | ---: |
| Offline/restart/idempotency fit | 15/20 |
| Near-live sync/write-path fit | 15/15 |
| Schema/entity evolution | 13/15 |
| Windows + PWA/tablet/iPad path | 11/15 |
| Tenant/branch/permissions fit | 9/10 |
| Self-host/cost/license fit | 3/10 |
| Maturity/operations | 8/10 |
| Rifad adapter fit | 4/5 |
| **Total** | **78/100** |

Main deductions:

- proprietary/commercial dependency conflicts with the zero-cost/open-first preference unless it solves a problem the open/self-hosted candidates cannot;
- browser transport/persistence/P2P capabilities differ materially from native clients;
- therefore it is valuable as a fallback, not the first Rifad infrastructure dependency.

**Promotion decision: NO.**

---

### 6. Electric Sync (current architecture) — **74/100 — NOT PRIMARY**

| Dimension | Score |
| --- | ---: |
| Offline/restart/idempotency fit | 12/20 |
| Near-live sync/write-path fit | 10/15 |
| Schema/entity evolution | 14/15 |
| Windows + PWA/tablet/iPad path | 13/15 |
| Tenant/branch/permissions fit | 9/10 |
| Self-host/cost/license fit | 8/10 |
| Maturity/operations | 6/10 |
| Rifad adapter fit | 2/5 |
| **Total** | **74/100** |

Main deduction: the current architecture is valuable for Postgres-to-client synchronization but is not a turnkey symmetric offline write-replication answer for Rifad; the application write path remains substantial infrastructure work.

**Promotion decision: NO.**

---

## 3. Promotion result

Using the owner's **90% gate**, exactly one candidate currently qualifies for deeper trial:

1. **PowerSync — 92/100 — trial first**
2. Couchbase Lite + Sync Gateway — 87 — hold
3. CouchDB + PouchDB — 86 — hold/open control
4. RxDB — 81 — hold
5. Ditto — 78 — commercial fallback
6. Electric Sync — 74 — not primary

Do not spend equal implementation time on lower-ranked candidates while the 92-point candidate is passing its gates. If PowerSync fails a remaining hard gate (license, production operations, live Windows, required tablet/iPad behavior, security or recovery), continue to the next strongest candidate and reconsider the threshold/gap explicitly rather than silently lowering standards.

---

## 4. Trial already executed for the promoted candidate

PowerSync has already moved beyond simulation into real Rifad-shaped runtime proof. Current evidence in `SYNC_CANDIDATE_EXECUTION_2026-08-18.md` includes:

- BO -> POS connected propagation: PASS;
- permitted POS -> source/BO path: PASS;
- offline write + close/reopen + reconnect: PASS;
- intentional apply-then-503 ambiguous retry with exactly one finalized source sale: PASS;
- additive old/new client schema evolution without sync-engine rewrite: PASS;
- actual Chromium browser/PWA-class client: PASS;
- actual Windows win32 x64 local SQLite/restart queue: PASS;
- signed merchant/branch download isolation: PASS;
- Rifad server role/scope mutation authorization: PASS.

Current CI on the promoted proof line is green for the PowerSync baseline, PowerSync web baseline and PowerSync Windows local baseline.

The next trial work is **not another candidate yet**. It is to close the highest-value remaining PowerSync gates, beginning with live Windows-to-service behavior and production deployment/license/operations constraints. Lower-ranked candidates remain available if the leader fails.

---

## 5. Primary provenance used by the simulation

PowerSync:

- https://docs.powersync.com/intro/powersync-overview
- https://docs.powersync.com/architecture/client-architecture
- https://docs.powersync.com/handling-writes/writing-client-changes
- https://docs.powersync.com/maintenance-ops/implementing-schema-changes
- https://docs.powersync.com/client-sdks/reference/tauri
- https://docs.powersync.com/intro/self-hosting
- https://github.com/powersync-ja/powersync-js
- https://github.com/powersync-ja/powersync-service

CouchDB:

- https://docs.couchdb.org/en/stable/replication/protocol.html
- https://docs.couchdb.org/en/stable/replication/conflicts.html

Couchbase:

- https://docs.couchbase.com/couchbase-lite-javascript/current/index.html
- https://docs.couchbase.com/couchbase-lite-javascript/current/replication.html
- https://docs.couchbase.com/couchbase-lite-javascript/current/known-limitations.html
- https://docs.couchbase.com/sync-gateway/current/introduction.html

RxDB:

- https://rxdb.info/replication.html
- https://rxdb.info/rx-storage-sqlite.html

Ditto:

- https://docs.ditto.live/

Electric:

- https://electric-sql.com/docs
