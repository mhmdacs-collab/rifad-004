# Rifad Synchronization Benchmark — 2026-08-18

Status: **RESEARCH / CANDIDATE GATE — PROMOTED LEADER UNDER RUNTIME TRIAL, NO FINAL PRODUCTION SELECTION YET**

## Purpose

Rifad now has two product surfaces that need to prove one product, not two disconnected demos:

- Back Office manages merchant configuration/master data;
- POS consumes that configuration and produces operational facts such as sales, receipts and open orders.

The next infrastructure question is therefore synchronization. This document records:

1. observable Loyverse behavior as the product baseline;
2. the Rifad acceptance criteria that follow from that behavior and the owner's clarified workflow;
3. current synchronization technologies worth executing and characterizing;
4. explicit reasons not to select a winner from documentation alone.

This research does **not** authorize copying proprietary Loyverse implementation details. Public Loyverse documentation exposes behavior, not its internal database or replication protocol.

---

# 1. Loyverse — observable synchronization behavior

Official Loyverse documentation currently establishes the following behavior.

## 1.1 Back Office and connected POS devices behave as one live system

Loyverse states that Back Office and POS work together in real time and that online changes appear on devices immediately.

It also documents that adding items/categories in POS syncs in real time so they appear on connected devices and in Back Office, while advanced item settings created in Back Office sync back to POS.

Sources:

- https://help.loyverse.com/help/setting-your-shop-loyverse-back
- https://help.loyverse.com/help/items-categories

## 1.2 Offline sales are durable locally and synchronize automatically after reconnect

Loyverse documents that offline sales receipts are stored locally, marked `Unsynced`, and automatically synchronized to Back Office after internet connectivity returns. A manual Sync action exists as a fallback. Loyverse also blocks sign-out while unsynchronized receipts remain.

Sources:

- https://help.loyverse.com/help/offline-work-of-pos
- https://help.loyverse.com/help/how-exit-loyverse-pos
- https://help.loyverse.com/help/receipts-list-pos

## 1.3 Multi-device operational synchronization is live when devices are online

Open tickets can be accessed, edited and closed from multiple POS devices in the same store in real time, with the explicit prerequisite that all devices are online. Offline open tickets remain local until connectivity returns.

Source:

- https://help.loyverse.com/help/tickets-synchronizations

## 1.4 Permissions determine what a user may change

Loyverse's access-right model controls POS permissions such as item management, discounts, taxes, refunds and receipt visibility. This is separate from the fact that the system synchronizes shared data.

Rifad inference: **replication direction and business authority must remain separate concerns.** A device may be technically capable of sending changes while the Rifad permission/domain layer rejects an unauthorized command.

Sources:

- https://help.loyverse.com/help/how-manage-access-rights-employees
- https://help.loyverse.com/help/receipts-list-pos

## 1.5 Public API/webhooks confirm change-oriented cloud integration, not the internal POS protocol

Loyverse's public API documents webhook events such as:

- `items.update`;
- `inventory_levels.update`;
- `customers.update`;
- `receipts.update`;
- `shifts.create`.

This supports the observable picture of a change-oriented near-real-time cloud system. It does **not** prove that the proprietary POS application itself uses the public API/webhook mechanism internally.

Source:

- https://developer.loyverse.com/docs/

## 1.6 Behavioral baseline Rifad should match before trying to improve it

The useful baseline is therefore:

- connected Back Office/POS changes propagate automatically and quickly;
- POS remains able to complete core local sales offline;
- local unsynchronized facts are visibly recoverable and automatically replayed after reconnect;
- multiple connected POS devices see shared operational state where the feature requires it;
- user/employee permissions decide allowed mutations;
- a manual sync/status affordance can exist as fallback/diagnostic, but should not be the normal data path.

---

# 2. Rifad synchronization acceptance criteria

A candidate is not acceptable merely because its demo moves rows between two databases.

## 2.1 One reusable sync capability

Rifad should adopt one durable synchronization capability that can carry current and future authorized business facts.

Ordinary product growth — adding a field, table/collection, restaurant-place setting, option group, add-on, tax configuration, branch setting, etc. — may require schema/configuration evolution, but **must not require rewriting the synchronization engine**.

A candidate that couples replication logic to every feature is rejected.

## 2.2 Continuous automatic synchronization by default

When online:

- Back Office changes should reach connected POS clients automatically;
- permitted POS changes should reach Back Office and other relevant clients automatically;
- sales/receipts/operational facts should reach cloud reporting with near-live behavior.

A manual Sync control is a fallback/status/recovery affordance, not the primary mechanism.

## 2.3 Local-first operation

POS reads/writes its local durable store for offline-capable workflows. Cloud availability must not be required to finalize an ordinary offline-capable local sale.

Reconnect must resume synchronization without duplicate sale/payment creation.

## 2.4 Authority and permissions are not the replication topology

Rifad permissions/domain rules decide who may create/update/delete a fact.

The sync engine transports accepted facts. It must not hard-code a simplistic permanent rule such as "Back Office only pushes, POS only pulls" when a POS user may legitimately receive permission to modify a particular entity.

## 2.5 Stable identity, replay safety and recovery

Must support or cleanly preserve Rifad requirements for:

- stable installation/device/branch identity;
- idempotent replay;
- durable queued writes while offline;
- resume/checkpoint behavior after connection loss/restart;
- observable sync status/errors;
- tenant/branch scoping;
- no duplicate finalized sale from retry.

## 2.6 Current platform gate

The first production targets remain:

- Windows POS/application host;
- tablet/PWA class client;
- iPad where the selected path is practical without disproportionate complexity.

A strong technology that has a weak/experimental Windows or browser client must prove the gap before adoption.

## 2.7 Future branch-local capability must remain possible

This benchmark does not authorize building Branch Hub/LAN synchronization now.

However, the chosen cloud synchronization path must not trap Rifad in a topology that makes future branch-local multi-device operation impractical. LAN remains a separate Rifad capability boundary.

---

# 3. Candidate landscape

The table is a research shortlist, not an adoption decision.

| Candidate | Strong fit | Important concern / proof needed | Current disposition |
| --- | --- | --- | --- |
| **PowerSync** | Local SQLite; real-time source→client sync; offline queue; strong additive schema evolution; web SDK; self-host option | Client writes still require a Rifad/backend `uploadData()` API; Tauri SDK is currently alpha; no built-in branch P2P model | **PROMOTED — 92/100; execute deeper proof first** |
| **CouchDB + compatible client replication (e.g. Pouch-style approach)** | Mature open replication protocol; continuous replication; checkpoints; restart recovery; conflict model; fully inspectable Apache lineage | Need a clean modern Windows + PWA integration proof and a Rifad data-model fit; document model may impose tradeoffs | **86/100 — hold/open control** |
| **Couchbase Lite + Sync Gateway** | Embedded offline DB; continuous bidirectional WebSocket replication; access control; native P2P capability exists on supported native SDKs; browser JS client exists | Community licensing/distribution needs legal review; browser JS currently has no P2P; actual Windows/Tauri packaging must be proved | **87/100 — hold below promotion threshold** |
| **RxDB** | Strong browser/local-first model; flexible replication against custom backends | Production SQLite storage is a commercial/premium concern; custom HTTP replication still requires server handlers; not a no-work final answer | **81/100 — hold** |
| **Electric Sync (current architecture)** | Modern Postgres→client read-path sync | Current model is not a turnkey symmetric write replication engine; writes remain application/API work | **74/100 — not primary** |
| **Ditto** | Strong offline/P2P/cloud product and multi-platform story | Proprietary/commercial; web/P2P capability boundaries differ by platform | **78/100 — commercial fallback** |

Full scoring model and evidence are in `docs/research/sync/SYNC_CANDIDATE_SCORECARD_2026-08-18.md`.

---

# 4. Candidate notes from primary documentation

## 4.1 PowerSync

Current official documentation states:

- clients read from local SQLite whether online or offline;
- source database changes can reflect in the local SQLite store in real time;
- local writes are queued;
- queued client writes are uploaded through an application-defined `uploadData()` backend path;
- its protocol is schemaless and additive fields/tables can be introduced without ordinary client SQLite migrations, although server Sync Streams/config and backwards compatibility still need management;
- Tauri support is currently marked **alpha**.

This makes PowerSync particularly attractive for the owner's requirement that future feature fields should not trigger sync-engine rewrites, but its Windows/Tauri maturity and write-path ownership must be proved rather than assumed.

Sources:

- https://docs.powersync.com/intro/powersync-overview
- https://docs.powersync.com/architecture/client-architecture
- https://docs.powersync.com/handling-writes/writing-client-changes
- https://docs.powersync.com/maintenance-ops/implementing-schema-changes
- https://docs.powersync.com/sync/advanced/multiple-client-versions
- https://docs.powersync.com/client-sdks/reference/tauri

Licensing note: the service is source-available under FSL-1.1-ALv2; supporting client-side components have different open-source licenses. License/dependency review is mandatory before adoption.

Source:

- https://github.com/powersync-ja/powersync-service

## 4.2 Apache CouchDB replication

Apache CouchDB 3.5 documents a mature incremental replication protocol with:

- source/target change feeds;
- continuous replication;
- checkpoints and resume after interruption;
- push and pull replication;
- two opposite replication jobs for two-way synchronization;
- explicit conflict detection and revision history;
- filtering/partial replication.

It is the strongest fully inspectable protocol baseline in this benchmark. The main question is not whether replication works; it is whether the client/runtime/data-model fit is clean enough for Rifad's Windows + PWA product.

Sources:

- https://docs.couchdb.org/en/stable/replication/protocol.html
- https://docs.couchdb.org/en/stable/replication/intro.html
- https://docs.couchdb.org/en/stable/replication/conflicts.html

## 4.3 Couchbase Lite + Sync Gateway

Current Couchbase documentation describes secure bidirectional synchronization between embedded/client databases and Sync Gateway, including continuous replication and access control.

Native Couchbase Lite SDKs also document peer-to-peer WebSocket synchronization without a central cloud endpoint. That makes the family technically interesting for future branch-local topology.

However, the current JavaScript browser SDK explicitly lists **no P2P sync** and uses IndexedDB locally, so browser/PWA behavior must not be confused with native Couchbase Lite capability. Community Edition also has Couchbase-specific license terms rather than a permissive Apache/MIT grant.

Sources:

- https://docs.couchbase.com/couchbase-lite-javascript/current/index.html
- https://docs.couchbase.com/couchbase-lite-javascript/current/replication.html
- https://docs.couchbase.com/couchbase-lite-javascript/current/known-limitations.html
- https://docs.couchbase.com/couchbase-lite/current/c/p2psync-websocket.html
- https://docs.couchbase.com/sync-gateway/current/introduction.html
- https://www.couchbase.com/community-license-agreement/

---

# 5. What this research changes in Rifad sequencing

The previous wording that deeper synchronization work must wait until major product-field discovery is complete was too broad.

The correct distinction is:

- **do not freeze Rifad's final business SQL/data model before product-field discovery is mature;**
- **do select/prove a schema-tolerant synchronization capability early enough that Back Office and POS can be validated as one product.**

Synchronization technology selection therefore becomes an early infrastructure gate after the current visual shell is locked enough for end-to-end testing. It does not freeze catalog/restaurant/inventory/tax/branch schemas.

---

# 6. Mandatory execution proof before adoption

Per `PROJECT_RULES.md` and `docs/adoption/CAPABILITY_ADOPTION_WORKFLOW.md`, documentation claims are insufficient.

At least two credible candidates must be run and characterized. The proof must include:

1. Back Office changes an item/category/price → connected POS receives it automatically within the measured target latency.
2. POS with permission changes an allowed entity → Back Office and a second relevant client receive it.
3. POS without permission is rejected by Rifad/domain/server authorization, not by pretending replication is one-way.
4. POS goes offline → completes an offline-capable sale → restarts if applicable → reconnects → sale appears exactly once in cloud/Back Office.
5. Connection breaks during upload/download → synchronization resumes from durable state/checkpoint without duplicate business facts.
6. Add a representative field and a representative new entity/table/collection → deploy schema/config change → prove no synchronization-engine rewrite.
7. Run the actual Windows host path and the actual tablet/PWA path, not only a Node demo.
8. Prove authentication, tenant isolation and branch scoping.
9. Record conflict behavior for an entity where concurrent writes are intentionally allowed.
10. Inspect source/tests/failure cases and complete license/dependency/provenance review.

The result of that proof — not this benchmark — selects the implementation behind the Rifad-owned synchronization contract.

---

# 7. Owner promotion rule — 90% before deeper trial

On 2026-08-18 the owner set an explicit candidate-selection order:

1. simulate/score candidates against Rifad requirements;
2. only a candidate scoring **90/100 or higher** is promoted to deeper runtime trial;
3. test strongest to weakest rather than spending equal implementation effort on all candidates;
4. if the leader fails a hard production gate, move to the next strongest credible candidate rather than silently lowering requirements.

The current scorecard yields:

1. **PowerSync — 92/100 — PROMOTED**;
2. Couchbase Lite + Sync Gateway — 87/100 — hold;
3. CouchDB + PouchDB — 86/100 — hold/open replication control;
4. RxDB — 81/100 — hold;
5. Ditto — 78/100 — commercial fallback;
6. Electric Sync — 74/100 — not primary.

PowerSync has already passed multiple runtime slices documented in `SYNC_CANDIDATE_EXECUTION_2026-08-18.md`, so deeper proof continues there first. CouchDB's already-executed runtime baseline remains the mandatory second credible implementation/control required by project rules; it does not need equal further investment while the promoted leader is still passing.

---

# 8. Current conclusion

No synchronization technology is finally production-selected yet.

The evidence now supports this priority:

> **PowerSync cleared the owner's 90% promotion gate → close its remaining hard runtime/license/operations gates first → if it passes, adopt it behind the Rifad synchronization boundary → if it fails, continue strongest-to-weakest.**

This preserves D-030's prohibition on premature final data-model freeze while fixing the previous sequencing mistake of postponing synchronization until after most product surfaces were complete.