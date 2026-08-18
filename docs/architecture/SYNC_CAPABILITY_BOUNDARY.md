# Rifad Synchronization Capability Boundary

Status: **BINDING ARCHITECTURE BOUNDARY — IMPLEMENTATION NOT YET SELECTED**

Last updated: 2026-08-18

## 1. Purpose

Synchronization makes Rifad Back Office, POS and future connected clients behave as one product while preserving local-first operation.

This document defines the boundary that any synchronization implementation must satisfy. It deliberately does **not** select a vendor, library, database or protocol.

Research and candidate evidence:

- `docs/research/sync/RIFAD_SYNC_BENCHMARK_2026-08-18.md`

Adoption workflow:

- `docs/adoption/CAPABILITY_ADOPTION_WORKFLOW.md`

---

## 2. Core rule

> **Synchronization is one replaceable Rifad capability. Business permissions and domain authority decide what may change; the synchronization engine transports accepted durable changes.**

A technology fails the Rifad boundary if adding an ordinary product field/entity requires rewriting its synchronization engine.

Schema/configuration evolution is expected. Rebuilding synchronization per feature is not.

---

## 3. Product behavior

### 3.1 Connected operation

When connectivity is available, synchronization is automatic and continuous enough to provide near-live product behavior:

- Back Office configuration changes propagate to relevant POS clients;
- permitted POS changes propagate to Back Office and relevant clients;
- finalized sales/receipts/operational facts propagate toward cloud reporting without requiring a cashier to press Sync after every transaction.

A manual Sync/status control may exist for diagnostics, user confidence or recovery. It is not the normal data path.

### 3.2 Offline operation

Offline-capable POS workflows continue against local durable state.

A finalized offline-capable sale must not depend on a live cloud connection.

When connectivity returns, queued durable changes replay automatically with stable identity and idempotency so retry cannot create a second sale/payment/order fact.

### 3.3 Permissions and authority

Replication topology is not permission policy.

Examples:

- a cashier without item-management permission cannot mutate catalog authority;
- a manager granted that permission may legitimately edit an item from POS;
- Back Office normally owns broader merchant configuration;
- sales are normally created at POS and observed in Back Office.

These differences are enforced by Rifad domain/permission/server authorization. The sync implementation must not achieve them by permanently hard-coding all POS data as pull-only or all Back Office data as push-only.

---

## 4. Rifad-owned contract boundary

Target dependency direction:

```text
Back Office / POS / other Rifad apps
               │
               ▼
        Rifad domain contracts
               │
        durable local/cloud facts
               │
               ▼
       Rifad Sync Contract
               │
               ▼
     replaceable sync adapter
               │
               ▼
external library/service/protocol
```

External synchronization technology must not leak its:

- document/row identifiers as Rifad public identity;
- SDK types;
- conflict types;
- provider-specific authorization claims;
- database schema conventions;
- retry/error model;
- deployment lifecycle

into unrelated Rifad product/domain code.

Exact Sync contract method names remain implementation-design work until the candidate proof exposes the smallest correct boundary.

---

## 5. Relationship to local persistence, LAN and cloud

Keep the capabilities distinct:

`Local Persistence != Synchronization != LAN/Branch-local coordination != Fiscal`

- **Local persistence** owns durable local/offline state and local recovery.
- **Synchronization** propagates durable accepted changes between local/edge/cloud replicas.
- **LAN / future Branch Hub** owns branch-local transport/coordination where required by offline multi-device operation, printers, KDS/CDS or similar branch capabilities.
- **Fiscal** owns the Saudi fiscal state machine and evidence.

A selected synchronization technology may later help implement more than one topology, but this does not merge the Rifad capability boundaries.

The current synchronization proof must not start building Branch Hub merely because one candidate supports peer-to-peer or edge listeners.

---

## 6. Schema evolution requirement

Rifad is still discovering durable product fields. Therefore synchronization must be intentionally tolerant of product growth.

Expected future changes include:

- new catalog fields;
- option/add-on entities;
- inventory/tax entities;
- restaurant place/group configuration;
- branch/store overrides;
- employee/permission facts;
- delivery/channel configuration;
- future approved domains.

For ordinary additive growth, the expected maintenance is limited to the candidate's normal schema/configuration/migration mechanism plus Rifad app/domain changes.

The synchronization core must not need a new per-feature transport algorithm.

Breaking schema migrations may still require versioning, compatibility windows, backfill or re-snapshot/re-replication according to the chosen technology. "No sync-engine rewrite" does not mean "no migration work ever".

---

## 7. Required synchronization facts

The implementation must preserve or provide a clean mapping for Rifad-owned facts such as:

- stable installation identity;
- device identity;
- tenant/merchant identity;
- branch/store routing context;
- durable entity/event identity;
- version/checkpoint/cursor information as needed by the implementation;
- pending/synchronized/error state for observability;
- retry bookkeeping;
- idempotency/deduplication evidence.

Provider-specific internal checkpoint or revision values remain adapter-private unless Rifad has a product/domain reason to expose a normalized equivalent.

---

## 8. Conflict policy

Rifad should avoid manufacturing conflicts where product authority makes them impossible or meaningless.

The candidate technology still must handle interrupted/repeated delivery correctly, but business conflict resolution is defined per domain.

Examples:

- employee permissions may prevent two actors from legitimately editing a protected price;
- append-like finalized sales should use stable identity/idempotency rather than "last writer wins";
- entities that intentionally permit concurrent edits must define a deterministic domain policy and test it.

Do not adopt a generic multi-master conflict strategy as universal Rifad business truth merely because the synchronization engine provides one.

---

## 9. Platform boundary

Current production targets for the synchronization proof:

- Windows POS/application host;
- tablet/PWA-class client;
- iPad when practical with the chosen supported path.

A candidate is not production-selected until its actual Rifad platform path is executed. A working backend demo or unsupported/alpha desktop SDK claim is not sufficient evidence.

---

## 10. Security boundary

Synchronization must prove:

- authenticated clients;
- tenant isolation;
- branch/store scoping where applicable;
- server/domain authorization for mutations;
- secure transport for production;
- safe credential/token lifecycle;
- no trust in client-supplied role/branch claims without server-verifiable authority.

Permission checks remain Rifad business/security policy even if the selected provider offers its own row/document filtering or RBAC features.

---

## 11. Adoption gate

Synchronization is a high-risk capability under `CAPABILITY_ADOPTION_WORKFLOW.md`.

Before selecting the implementation:

1. compare at least two credible candidates;
2. execute the real relevant client/server slices;
3. inspect source/tests and failure behavior where source is available;
4. verify license and dependency/distribution obligations;
5. prove offline/reconnect/restart/idempotency behavior;
6. prove a representative additive schema change without sync-engine rewrite;
7. prove Windows and tablet/PWA paths;
8. prove authentication/tenant/branch isolation;
9. record candidate acceptance/rejection and provenance.

The benchmark currently identifies PowerSync, Apache CouchDB replication and Couchbase Lite/Sync Gateway as the highest-value proof candidates, each with different unresolved risks. This list is research evidence, not architectural lock-in.

---

## 12. Sequencing rule

Product/UI field discovery still precedes **final production data-model freeze**.

It does **not** require Rifad to postpone all synchronization work until every Back Office/POS feature is designed.

The intended sequence is:

```text
lock current reference UI enough to stop visual churn
                    ↓
select + prove synchronization capability
                    ↓
connect Back Office ↔ POS through real sync path
                    ↓
continue product features and field discovery end-to-end
                    ↓
freeze mature production domain/data model later
```

This allows the Back Office to serve its actual product purpose while keeping future fields free to evolve.
