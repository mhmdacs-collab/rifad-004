# Rifad Final Implementation Map

Status: **OWNER-APPROVED EXECUTION ROADMAP — MAP-01 PASS**

Date: 2026-08-20

Repository: `mhmdacs-collab/rifad-004`

Active branch: `agent/pos-visual-pass-01`

Pull request: PR #2 — keep **Draft** and **unmerged** until explicit owner approval.

---

## Supplemental Front Office regression lane — 2026-08-21

Branch `agent/frontoffice-regression-finalization` is a bounded correction lane based on
`agent/rifad-frontoffice-final-ui` at `4a30118f11b1072db71569cb73fd9aeae37e8309`.
It closes regressions in the already executable retail/customer, restaurant staging,
credit/debt and printing UI without changing the master dependency position below.

- Customer creation is an inline Ticket Workspace state; it is not a separate modal.
- Normal-ticket customer attachment and Credit customer selection intentionally use different selection states.
- Restaurant changes refine the existing local/mock `RestaurantServiceContract`: immutable kitchen dispatch batches and add/reduce/cancel deltas, preserved table totals, deterministic send/pay gates and table release only after payment.
- Debt collection persists the selected collection method and a dedicated collection-receipt identity; its printing path is separate from completed-sale receipts.
- This evidence is `CURRENT-MOCK`. It does **not** promote MAP-04, MAP-05, production KDS, production payment accounting, production persistence, hardware printing or synchronization.

The original MAP-01 status and dependency sequence remain authoritative.

---

## 1. Purpose

This document is the single execution map for the current Rifad product cycle.

It converts the product/code review into one dependency-ordered plan so implementation does not drift between UI work, database work, synchronization work and infrastructure work.

It does **not** freeze the final production SQL/domain model. D-030 remains valid: durable product meanings must be discovered through real product flows before final schema freeze.

It also does **not** discard the synchronization evidence already produced. Existing CouchDB/PowerSync proofs remain valuable research/adoption evidence. The execution order stops additional synchronization adoption work until the POS operational core and production local-persistence gate below are complete enough to test the real Rifad facts.

D-033 in `docs/architecture/CURRENT_DECISIONS.md` remains the binding dependency order.

---

## 2. Non-negotiable execution rules

1. Follow the map in dependency order. Do not jump to a later capability because its UI looks easier.
2. Every capability must satisfy the Puzzle Architecture rule: Rifad-owned contract, replaceable adapter/implementation, isolated tests, explicit data ownership and no hidden cross-module table access.
3. Every visible POS/Back Office action remains manifest-gated. New or corrected screens/actions/states/flows must be reflected in `docs/ui/UI_EXECUTION_MANIFEST.json` before implementation is considered accepted.
4. Every new durable field/meaning must be traced in `docs/ui/POS_UI_NAMING_AND_FIELD_REGISTER.md`.
5. Local-first is mandatory. A finalized offline-capable sale cannot depend on cloud availability.
6. Stable command/event identity and idempotent replay are mandatory for every durable business mutation.
7. Do not add synchronization, LAN, fiscal, payment-terminal or donor infrastructure merely to make a local product feature work.
8. Preserve the locked visual shell. Feature-specific UI may extend it, but broad visual churn is not reopened.
9. Keep `Local Persistence != Sync != LAN/Branch Hub != Fiscal/ZATCA`.
10. Do not claim production readiness until the relevant runtime, migration, restart, failure and hardware evidence exists.

---

## 3. Current truth baseline

The current POS is beyond the first retail demo slice. The code contains device linking, employee PIN, catalog/search, touch sale pages, cart editing, quantity keypad, cash checkout/change, mock card flow, customer/credit/loyalty behavior, receipts/reprint/email behavior, restaurant local-service flow, local persistence contracts and transactional outbox behavior.

`MAP-00` reconciled repository authority with executable reality.

`MAP-01` now adds a Rifad-owned owner→POS configuration/authorization vertical slice:

- Back Office administration for Employees, Access Rights, Features, Stores, POS Devices and Payment Types;
- pure merchant-policy → branch/device effective POS projection;
- local effective configuration persistence behind `LocalPersistenceContract`;
- capability-based authorization rather than role-name authority;
- command-scoped manager override;
- configuration-driven payment-method order;
- visible `accept-payment` checkout enforcement;
- protected archived-receipt reprint.

The current physical browser persistence remains staging (`browser-storage`). Production local database selection is still MAP-06. Real Back Office ↔ POS transport remains MAP-11.

The largest remaining product-model gaps are now:

- shift lifecycle and cash drawer accounting;
- time clock;
- complete sold-line truth for pricing options, add-ons, discounts, taxes and fulfillment;
- complete open-ticket/order lifecycle;
- durable payment records, split-payment-ready model, receipt detail and refund lifecycle;
- production local database, migrations and packaged offline startup;
- physical scanner/printer/cash-drawer proof;
- only after those gates, final synchronization adoption and real Back Office ↔ POS transport.

---

# 4. Master execution sequence

| Map ID | Capability / gate | Depends on | Main owner of truth | Outcome |
|---|---|---|---|---|
| `MAP-00` | Reality + authority reconciliation | current branch | Documentation / product authority | **PASS — 2026-08-19** |
| `MAP-01` | Effective POS configuration + authorization model | MAP-00 | Owner/Back Office defines; POS consumes locally | **PASS — 2026-08-20**; locally enforceable policy, payment ordering and one-action override proven |
| `MAP-02` | Shift, cash drawer ledger and time clock | MAP-01 | POS operational truth | Complete cashier workday and cash accountability exist locally |
| `MAP-03` | Complete sale-line truth | MAP-01 | POS sale/order truth | Options, add-ons, discounts, taxes, fulfillment and sold-price snapshots are durable |
| `MAP-04` | Open tickets / local orders lifecycle | MAP-02 + MAP-03 | POS operational truth | Save, list, reopen, edit, void, move/merge/split/bill rules are explicit and durable |
| `MAP-05` | Payments, receipt detail and refund lifecycle | MAP-02 + MAP-03 | POS payment/sale truth | Payments become durable records; receipts and refunds have a production-capable domain model |
| `MAP-06` | Production local persistence adoption | MAP-02..05 | Rifad local runtime | Staging browser storage is replaced behind `LocalPersistenceContract` with a production-grade local implementation |
| `MAP-07` | Windows standalone/cold-start/crash-recovery gate | MAP-06 | Rifad Windows host | POS starts and works offline after process/device restart with durable business state intact |
| `MAP-08` | Physical POS device baseline | MAP-07 | Local hardware adapters | Scanner, receipt printer and cash drawer are proven on real hardware; terminal integration stays separate |
| `MAP-09` | Tablet/PWA local-first gate | MAP-06 | Rifad tablet host | Supported tablet path proves installable/cold-offline behavior and touch flows |
| `MAP-10` | Synchronization re-entry and final adoption | MAP-07 + MAP-09 | Sync adapter only | Existing candidates are re-tested with real Rifad operational facts; one provider may be adopted if all gates pass |
| `MAP-11` | Real Back Office ↔ POS integration | MAP-10 | Rifad cloud/domain APIs | Owner configuration reaches POS; POS operational facts reach Back Office through Rifad-owned contracts |
| `MAP-12` | Post-core vertical capabilities | MAP-11, capability-specific | Domain-specific | Inventory, restaurant admin/KDS/CDS, delivery, fiscal, accounting and other product lanes continue on the real foundation |

The rule remains: **do not restart synchronization adoption before `MAP-10`.** Preserve current sync proofs, but do not keep extending candidate infrastructure while the real POS facts are still being defined.

---

# 5. MAP-00 — Reality and authority reconciliation

Status: **PASS — 2026-08-19**

## Objective

Make the repository describe the product that actually exists before adding behavior.

## Completed work

- audited implemented POS/Back Office code and current contracts against the UI manifest;
- corrected `ReceiptsScreen.tsx` from the reused `POS-SCREEN-012` ID to the reserved `POS-SCREEN-016` identity;
- reconciled already-existing customer/credit/loyalty, mock-card, receipts/reprint and sale-page rename/move/delete behavior into `UI_EXECUTION_MANIFEST.json` without authorizing unrelated future scope;
- reconciled Back Office catalog schema v4, catalog visual identity and category/option/add-on color behavior;
- updated `UI_PROGRESS.md` to reflect the real POS, Back Office, local-persistence and sync-evidence states;
- expanded `POS_UI_NAMING_AND_FIELD_REGISTER.md` to cover effective configuration/authorization, shift/cash/time-clock gaps, payment normalization, local persistence/outbox infrastructure facts and current event families;
- added `MAP_00_REALITY_AUTHORITY_RECONCILIATION.md` as the detailed product/code/docs audit;
- added D-033 and revised D-030/D-032 sequencing so operational POS core → production local persistence → host/device proof → sync re-entry is explicit;
- updated repository/documentation entry points and the current handoff;
- preserved all existing synchronization evidence without selecting a provider;
- introduced no new business feature in MAP-00.

## Verification

The GitHub **UI manifest integrity**, **POS application** and **Back Office application** workflows passed on the reconciled branch head after these changes.

## Exit gate

`MAP-00 PASS`: a new session reading the authority decisions, final map, manifest, progress and field register reaches the same current-state conclusion as the code review.

---

# 6. MAP-01 — Effective POS configuration and authorization

Status: **PASS — 2026-08-20**

This capability now exists before shifts, refunds, protected open-ticket actions and production payment behavior are implemented.

## Owner/Back Office-owned configuration implemented in this gate

- Employees;
- Roles / Access Rights;
- feature flags;
- Stores;
- POS Devices;
- Payment Types, enabled state, order, connectivity requirement and optional store scope.

Taxes, Discounts, receipt configuration and full restaurant/dining administration remain governed by their dependency map items; their future presence was not used to inflate MAP-01 scope.

## POS-local effective projection

The POS has a versioned branch/device-specific effective configuration boundary that carries the locally needed:

- feature flags;
- payment methods/order/availability;
- branch-relevant employee snapshots;
- POS role/capability snapshots;
- configuration revision/effective time.

The pure projection validates device/store relationship, filters scope and strips Back Office-only permissions. It does not choose or depend on a synchronization provider.

## Rifad contracts implemented

- `PosConfigurationAdminContract`;
- `EffectivePosConfigurationContract`;
- `AuthorizationContract`;
- `ManagerOverrideContract`;
- versioned merchant/effective configuration types and explicit permission keys.

## Authorization behavior proven

- role name alone is not authority;
- employee activity, branch scope, role existence and concrete capability are evaluated locally;
- **دفع** evaluates `accept-payment` before entering checkout;
- archived receipt reprint evaluates `reprint-resend-receipts`;
- a missing permission visibly blocks the action and can request a local manager PIN;
- manager approval grants the **single blocked command** only;
- approval records actor/approver/capability/target/revision without raw PIN;
- the active cashier session is not elevated, and a later protected action requires a new approval.

## Back Office UI gate

`BO-FLOW-003 — POS Operational Configuration and Access` is implemented for:

- `BO-SCREEN-021` Employees;
- `BO-SCREEN-022` Access Rights;
- `BO-SCREEN-026` Features;
- `BO-SCREEN-027` Stores;
- `BO-SCREEN-028` POS Devices;
- `BO-SCREEN-029` Payment Types.

All mutations cross `PosConfigurationAdminContract`; the existing locked Back Office shell is preserved.

## Verification

Tests prove:

- idempotent admin commands;
- raw-PIN non-leakage and staging PIN uniqueness;
- immutable Owner authority;
- deterministic owner policy → effective POS projection;
- branch/device scope;
- configured Payment Type order;
- local snapshot restart persistence;
- allowed/denied authorization;
- one-action manager approval without session elevation;
- visible checkout block/override and fresh approval on the next attempt;
- Back Office operational configuration interactions.

Applicable **UI Manifest Integrity**, **POS application** and **Back Office application** workflows pass.

## Explicit staging boundaries

MAP-01 does not claim:

- production credential verifier/brute-force/lockout/host security;
- production local database;
- real Back Office → POS transport;
- sync provider;
- LAN/Branch Hub;
- real payment terminal;
- taxes/discount sold snapshots;
- shift/cash/time-clock operation;
- full open-ticket lifecycle;
- normalized payment/receipt/refund lifecycle;
- ZATCA/fiscal.

Current browser admin/local-persistence adapters remain replaceable staging transports.

## Exit gate

**PASS.** The POS can operate from a versioned effective configuration/permission snapshot, visibly block unauthorized checkout, accept a one-action manager override, preserve policy across local restart and present merchant-configured payment ordering without a live cloud dependency.

---

# 7. MAP-02 — Shift, cash drawer ledger and time clock

Shift is not a cosmetic screen. It creates durable financial and workforce facts.

## Core durable entities / facts

### Shift session

Minimum meaning:

- stable shift ID;
- branch/device identity;
- opened by employee;
- opened at;
- opening cash;
- state: open/closing/closed;
- closed by employee;
- closed at;
- expected cash snapshot/calculation inputs;
- actual counted cash;
- difference;
- close command identity;
- report/audit revision facts where required.

### Cash movement

Every drawer-affecting movement is a separate durable fact:

- stable movement ID;
- shift ID;
- kind: opening / cash sale / cash refund / pay-in / pay-out / adjustment if later approved;
- amount using Rifad Money;
- employee;
- timestamp;
- reason/comment where applicable;
- originating sale/refund/payment reference where applicable;
- stable command identity.

Expected cash must be derived from authoritative movement facts; it must not be a freely editable balance.

### Time clock

Time clock is separate from shift. One employee may clock in/out independently of drawer ownership. Define a small workforce attendance boundary rather than overloading Shift.

## UI map

Existing manifest references already reserve:

- `POS-SCREEN-019` — Open Shift;
- `POS-SCREEN-020` — Current Shift;
- `POS-SCREEN-021` — Close Shift and Reports.

These remain mapped until the bounded MAP-02 manifest/flow is made ready after MAP-01.

## Offline rules

Opening, pay-in, pay-out, cash sales and shift close are local durable commands. Reconnect must never duplicate any cash movement.

## Exit gate

`MAP-02 PASS` requires a full offline workday test:

open shift → cash sales → pay-in/out → process restart → continue shift → close shift → expected vs actual difference → durable restart verification.

---

# 8. MAP-03 — Complete sale-line truth

The current `TicketLine` shape is too small for production sales. This map item discovers and implements the durable snapshot that represents what was actually sold.

## Required sold-line meaning

A finalized line must preserve enough historical truth that later product/config changes do not rewrite an old receipt.

At minimum evaluate and explicitly classify:

- product identity;
- product/line display name snapshot where required;
- selected pricing option/value identity and label;
- resolved unit price actually sold;
- selected reusable add-ons/modifiers;
- item-private add-ons;
- add-on prices actually sold;
- add-on required/min/max constraints where product scope requires them;
- line comment/note;
- quantity/weight/value semantics;
- line discount snapshots;
- ticket-level discount allocation/reporting meaning where needed;
- applied tax identity/rate/type snapshot;
- inclusive vs added tax meaning;
- fulfillment context where line-specific behavior is supported;
- sales channel/pricelist context where it changes the sold price;
- stable line identity.

## Required POS flows

Prioritize the flows that change durable sale truth:

1. option-priced product chooser;
2. add-on/modifier chooser;
3. line details editor;
4. discount/tax application according to permissions;
5. fulfillment/dining selection;
6. open price / weight only if confirmed inside the immediate launch scope.

Do not expose option-priced products at a fallback/minimum price. The existing safe hiding behavior remains until the chooser is ready.

## Contract rule

The UI may not calculate authoritative option/add-on/tax rules locally as ad-hoc component logic. Business resolution belongs in Rifad domain/contracts and must be testable without the UI.

## Exit gate

`MAP-03 PASS` when an offline sale containing representative options/add-ons/discount/tax/fulfillment survives restart and produces an immutable sold snapshot even after the source product configuration is changed later.

---

# 9. MAP-04 — Open tickets and local orders lifecycle

Current `saveOpenTicket()` evidence is not the full capability.

## Required lifecycle

The domain must explicitly support the approved subset of:

- save/name/comment;
- list/search/sort;
- reopen;
- edit unsaved vs previously saved lines;
- void saved item with permission/override;
- assign/reassign employee when allowed;
- merge;
- move to another predefined place/table;
- split ticket;
- preliminary bill;
- restaurant dispatch revisions/deltas where preparation dispatch is enabled;
- completion/payment;
- cancellation/deletion rules;
- durable local restart.

Manifest IDs already reserve:

- `POS-SCREEN-012` — Save Open Ticket;
- `POS-SCREEN-013` — Open Tickets List;
- `POS-SCREEN-014` — Split Ticket;
- `POS-SCREEN-015` — Merge Move and Bill.

Restaurant place/order semantics remain behind the existing restaurant-service boundary; retail open tickets must not be forced to become table orders.

## Exit gate

`MAP-04 PASS` when a saved ticket can be created offline, the process can be killed/restarted, the ticket can be listed/reopened/edited under correct permissions, and payment closes the same stable order identity without duplication.

---

# 10. MAP-05 — Payments, receipts and refunds

## Payment model correction

A production receipt cannot be limited to one enum field such as `cash | card | credit` if split payments, provider attempts, refunds and reconciliation are expected.

Move toward durable payment records linked to one sale/receipt.

Minimum payment fact meaning:

- stable payment ID;
- sale/receipt ID;
- method/config identity;
- collection type;
- amount;
- status;
- created/completed timestamps;
- employee/device;
- stable command identity;
- provider/terminal reference only behind Rifad-owned normalized fields when relevant;
- failure/unknown-delivery semantics for integrated methods;
- refund/reversal relationship where applicable.

Cash remains locally completable. Integrated terminal methods remain separate adapters and may require connectivity/provider availability.

## Receipt lifecycle

Manifest references:

- `POS-SCREEN-016` — Receipts List — CURRENT executable list/reprint;
- `POS-SCREEN-017` — Receipt Detail — mapped;
- `POS-SCREEN-018` — Refund — mapped;
- `POS-SCREEN-010` — Split Payment — mapped;
- `POS-SCREEN-009` — existing mock Card/Mada UX only; production terminal support remains separate.

Required core behavior before database adoption:

- immutable completed sale/receipt snapshot;
- list and detail;
- reprint/resend permission behavior;
- local unsynced state representation later through sync status without changing sale truth;
- refund command with stable identity;
- partial quantity/amount rules where approved;
- inventory effects remain through the future inventory contract, not direct table mutation;
- cash refund creates a cash-ledger movement under the relevant shift when applicable.

Integrated payment can remain a mock/protocol boundary until the dedicated terminal adoption lane, but the durable payment domain must already be capable of representing success/decline/unknown/reversal safely.

## Exit gate

`MAP-05 PASS` when cash, customer credit and a mocked/injected non-cash method all produce durable payment records; receipt detail is reconstructable from sold snapshots; refund retry cannot create duplicate refunds or duplicate cash movements.

---

# 11. MAP-06 — Production local persistence adoption

Only after the preceding operational facts are known do we select the production local storage implementation.

## Existing foundation to preserve

Keep the current Rifad-owned `LocalPersistenceContract` semantics:

- installation identity;
- branch/device context;
- versioned module-private snapshots;
- revision metadata;
- atomic snapshot + domain-event commit semantics;
- durable outbox;
- retry/failure bookkeeping;
- acknowledgement;
- stable event identity.

The production implementation may be SQLite, IndexedDB/OPFS, an embedded donor store or another candidate only after the capability adoption workflow proves it. The database engine does not become Rifad's domain contract.

## Mandatory persistence proof matrix

The selected implementation must prove:

- atomic durable commits for sale/payment/cash/shift facts;
- process kill during/around commits without duplicate or half-finalized business truth;
- clean restart while offline;
- schema migrations forward from representative older versions;
- failed migration rollback/recovery behavior;
- outbox persistence across restart;
- idempotent replay identity preserved;
- realistic ticket/receipt/catalog volume;
- safe file/path permissions for the Windows host;
- corruption/error behavior is visible and does not silently reset merchant data;
- replacement remains behind `LocalPersistenceContract`/module boundaries.

## Exit gate

`MAP-06 PASS` means browser/localStorage staging is no longer the production path for Windows POS and the full MAP-02..05 operational test suite passes against the selected local implementation.

---

# 12. MAP-07 — Windows standalone, cold start and crash recovery

The goal is a real cashier application, not a browser tab that happens to have local state.

Required proof:

- install/launch through the selected Windows host;
- previously configured device starts while network/cloud are unavailable;
- employee can unlock under the approved offline credential policy;
- catalog/config projection is available locally;
- shift/ticket/payment/receipt local operations work;
- app/process restart preserves state;
- machine restart preserves state;
- crash recovery does not duplicate finalized sale/payment/cash facts;
- local database migrations are exercised through packaged builds;
- application update/rollback strategy does not silently destroy local data.

`MAP-07 PASS` is the primary Windows local-first production foundation gate.

---

# 13. MAP-08 — Physical POS device baseline

Do not mix this with cloud sync.

### Barcode scanner

- HID scanner baseline;
- repeated scan increases desired quantity safely;
- unknown barcode behavior is explicit;
- barcode handling remains a catalog/sales interaction, not hidden keyboard hacks in business logic.

### Receipt printer

- real local printer transport;
- print job identity;
- queued/failed/delivery-unknown behavior;
- no blind duplicate printing after ambiguous delivery;
- receipt rendering separated from transport.

### Cash drawer

- opens from approved cash sale path;
- manual open is permission-protected;
- drawer transport does not own cash accounting;
- cash ledger remains the authoritative business fact.

### Payment terminal

Not required for the base hardware gate unless the owner chooses a concrete provider/model lane. Terminal integration remains its own adoption/protocol/security capability behind the payment contract.

---

# 14. MAP-09 — Tablet / PWA local-first gate

The supported tablet path must prove actual installable/cold-offline behavior rather than only responsive rendering.

Required proof:

- installable PWA-class path on the selected supported platform(s);
- cold launch after previous configuration while disconnected;
- local catalog/config access;
- ticket editing and allowed local payment behavior;
- restart durability;
- touch target/RTL/responsive acceptance;
- schema/local-store migration behavior;
- unsupported OS/browser combinations are documented rather than generically claimed.

This gate does not require the tablet to own every cashier capability if the product defines a reduced tablet mode, but the supported capability matrix must be explicit.

---

# 15. MAP-10 — Synchronization re-entry and final adoption

Existing candidate work is retained. Do **not** restart candidate debugging until MAP-07 and MAP-09 provide the real local runtime surfaces to synchronize.

At re-entry, test synchronization against the actual Rifad facts discovered above:

- effective configuration projection;
- catalog/options/add-ons;
- permissions snapshots/versioning;
- shifts and cash movements;
- tickets/open orders;
- completed sales and payment records;
- receipts/refunds;
- customers/loyalty where allowed;
- durable outbox identities;
- merchant/branch/device scoping.

The selected synchronization provider must remain transport/replication infrastructure only. Rifad owns:

- domain contracts;
- command identity/idempotency;
- server-side authorization;
- validation;
- conflict/domain policy;
- source-of-truth write API;
- local business state meaning.

Final adoption requires the remaining license/topology/auth/secret/backup/restore/upgrade/rollback/observability gates plus real Windows and tablet evidence. Existing PowerSync technical evidence is evidence, not automatic adoption.

`MAP-10 PASS` ends with one recorded adoption decision or an explicit rejection/next-candidate decision.

---

# 16. MAP-11 — Real Back Office ↔ POS integration

After sync adoption, connect the already-defined owner/cashier responsibilities through real Rifad contracts.

## Owner → POS

Examples:

- catalog and visual representation;
- pricing options/add-ons;
- payment methods;
- features;
- taxes/discounts;
- receipt settings;
- roles/permissions;
- branch/device assignment;
- dining/restaurant configuration.

## POS → Back Office

Examples:

- shift/open-close state;
- cash movements;
- open/closed order facts as authorized;
- completed sales;
- payment records;
- refunds;
- customer/loyalty/credit mutations when permitted;
- device/sync health facts that belong in administration.

Back Office does not read POS private database tables. POS does not read Back Office private tables. Both communicate through Rifad domain contracts/events/projections.

## Exit gate

A physical-device vertical test must prove:

owner changes a permitted configuration/catalog fact → relevant POS receives it → cashier works offline → creates operational facts → reconnects → facts arrive exactly once in Back Office/cloud → another authorized client sees the resulting state.

---

# 17. MAP-12 — Post-core vertical capabilities

These capabilities are important but must not block discovering and proving the cashier operational core above unless a specific launch scope promotes one earlier.

| Capability lane | Notes |
|---|---|
| Inventory | stock tracking, low-stock, negative-stock behavior, stock movements, purchase/transfer/count/production as separate bounded capabilities |
| Back Office restaurant administration | groups/places, kitchen routing, dining settings |
| KDS/CDS | real local transport, pairing, dispatch identity, recall/status behavior |
| Delivery / online orders | one normalized Rifad queue with direct/aggregator adapters |
| Fiscal / ZATCA | first-class Saudi domain; launch blocker when fiscal production scope begins |
| Accounting | replaceable adapter; never owns finalized POS truth |
| Production media | asset storage/sync behind catalog/media boundary |
| Reports / Dashboard | consume normalized facts; should not become hidden business authority |
| Advanced employee/admin | role management, timecards/history, administrative reporting |
| LAN / Branch Hub | separate future capability; not implied by cloud sync |

ZATCA and any legally/contractually required payment capability must of course pass before commercial production launch even though they are not prerequisites for selecting the local database or synchronization engine.

---

# 18. Durable ownership matrix

| Fact | Primary authority | Required locally on POS? | Must survive restart? | Sync direction later |
|---|---|---:|---:|---|
| installation/device identity | POS installation + owner assignment | yes | yes | POS ↔ cloud metadata |
| branch assignment | owner/config authority | yes | yes | owner → POS |
| employee permission snapshot | owner/roles | yes | yes | owner → POS |
| effective feature/payment/tax config | owner/Back Office | yes | yes | owner → POS |
| catalog/options/add-ons | owner/Back Office | yes | yes | owner → POS; limited authorized POS edits later |
| active shift | POS | yes | yes | POS → cloud/BO |
| cash movements | POS | yes | yes | POS → cloud/BO |
| time clock event | POS employee operation | yes | yes | POS → cloud/BO |
| working ticket | POS | yes | yes | usually local; open-order sync according to scope |
| open ticket/order | POS | yes | yes | bidirectional only where product permits |
| completed sale | POS | yes | yes | POS → cloud/BO |
| sold line snapshot | POS finalization | yes | yes | POS → cloud/BO |
| payment record | POS/payment adapter | yes | yes | POS → cloud/BO |
| receipt | POS finalization | yes | yes | POS → cloud/BO |
| refund | POS authorized operation | yes | yes | POS → cloud/BO |
| customer/loyalty/credit mutation | shared domain under permissions | relevant subset | yes | bidirectional by authority |
| print delivery attempt | local printing adapter + audit | when required | where retry/audit requires | optional/admin diagnostics |
| outbox event/retry state | POS local persistence | yes | yes | infrastructure only |
| global reports/billing/subscription | Back Office/cloud | no | no | not a POS operating authority |

---

# 19. Data model freeze guardrail

The roadmap intentionally separates **durable meaning discovery** from **final physical schema freeze**.

Before the production database schema is treated as mature, the following core facts must have stable Rifad meaning and restart tests:

- device/branch identity;
- employee authorization snapshot and override audit;
- effective POS configuration;
- shift and cash movement;
- ticket/order and sold-line snapshot;
- payment record;
- receipt/refund;
- customer/loyalty/credit facts in launch scope;
- local outbox/event identities and migration metadata.

The following do **not** need to be fully feature-complete before `MAP-06`/`MAP-10`:

- every Advanced Inventory workflow;
- every report/dashboard;
- delivery provider integrations;
- accounting providers;
- KDS/CDS transports;
- all restaurant administration;
- every future product attribute.

Normal additive schema evolution remains expected after adoption.

---

# 20. Capability definition of done

No map item is `PASS` merely because a screen exists.

Applicable evidence must include:

- manifest IDs and states;
- Rifad-owned contract;
- isolated domain/unit tests;
- adapter/conformance tests;
- durable-field register updates;
- restart/offline tests for durable local facts;
- idempotent retry tests for durable commands;
- migration tests for persisted schema changes;
- RTL/touch/responsive tests for UI;
- permission/override tests where applicable;
- hardware tests where applicable;
- failure/ambiguous-delivery tests for payment/printing/sync operations;
- license/provenance/adoption evidence for reused external capability code.

---

# 21. Immediate next action

`MAP-00` and `MAP-01` are complete and verified.

**Do not start MAP-03, production database selection or synchronization.**

The next dependency-safe product capability is:

**`MAP-02 — Shift + Cash Drawer Ledger + Time Clock`.**

MAP-02 must reuse the MAP-01 effective feature/permission model instead of creating a parallel authorization mechanism. Relevant existing policy keys include `shifts`, `time-clock`, `view-shift-report` and `open-cash-drawer-without-sale`.

Stop after MAP-01 closeout for owner review. MAP-02 is not started by this document update.
