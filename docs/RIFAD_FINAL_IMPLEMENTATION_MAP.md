# Rifad Final Implementation Map

Status: **OWNER-APPROVED EXECUTION ROADMAP**

Date: 2026-08-19

Repository: `mhmdacs-collab/rifad-004`

Active branch: `agent/pos-visual-pass-01`

Pull request: PR #2 — keep **Draft** and **unmerged** until explicit owner approval.

---

## 1. Purpose

This document is the single execution map for the next Rifad product cycle.

It converts the current product/code review into one dependency-ordered plan so implementation does not drift between UI work, database work, synchronization work and infrastructure work.

It does **not** freeze the final production SQL/domain model. D-030 remains valid: durable product meanings must be discovered through real product flows before final schema freeze.

It also does **not** discard the synchronization evidence already produced. Existing CouchDB/PowerSync proofs remain valuable research/adoption evidence. The new execution order simply stops additional synchronization adoption work until the POS operational core and production local-persistence gate below are complete enough to test the real Rifad facts.

When this document conflicts with higher-authority files, `PROJECT_RULES.md` and `docs/architecture/CURRENT_DECISIONS.md` still win until the conflicting decision is explicitly reconciled. Therefore `MAP-00` includes the required authority reconciliation before new feature implementation.

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

The current POS is already beyond the first retail demo slice. The code contains device linking, employee PIN, catalog/search, touch sale pages, cart editing, quantity keypad, cash checkout/change, mock card flow, customer/credit/loyalty proofs, receipts/reprint, restaurant local-service flow, local persistence contracts and transactional outbox behavior.

However, the current binding UI manifest and some documentation lag behind the code. Example: `ReceiptsScreen.tsx` currently declares `data-screen-id="POS-SCREEN-012"`, while the manifest reserves `POS-SCREEN-012` for **Save Open Ticket** and `POS-SCREEN-016` for **Receipts List**. This must be corrected before expanding the execution surface.

The current local persistence implementation is also explicitly staging (`browser-storage`). The contract foundation is retained, but the production local database remains unselected.

The largest remaining product-model gaps are:

- shift lifecycle and cash drawer accounting;
- employee permissions and one-action manager override;
- owner/Back Office configuration projected into the POS;
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
| `MAP-00` | Reality + authority reconciliation | current branch | Documentation / product authority | Manifest, field register, progress and sequencing match current code reality |
| `MAP-01` | Effective POS configuration + authorization model | MAP-00 | Owner/Back Office defines; POS consumes locally | POS knows enabled features, methods, permissions and manager overrides without cloud dependency during work |
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

The rule is simple: **do not restart synchronization adoption before `MAP-10`.** Preserve all current sync proofs, but do not keep debugging or extending candidate infrastructure while the real POS facts are still being defined.

---

# 5. MAP-00 — Reality and authority reconciliation

## Objective

Make the repository describe the product that actually exists before adding behavior.

## Required work

- Audit implemented POS screens/actions/flows against `docs/ui/UI_EXECUTION_MANIFEST.json`.
- Correct stable screen/action IDs where code and manifest disagree, beginning with the Receipts screen mismatch.
- Update `docs/ui/UI_PROGRESS.md` to distinguish `implemented`, `partial`, `mock/proof`, `mapped` and `not started` accurately.
- Update `docs/ui/POS_UI_NAMING_AND_FIELD_REGISTER.md` with already-existing customer credit, loyalty, receipt, restaurant and local-persistence durable meanings that are currently under-recorded.
- Reconcile the execution wording in D-032 / documentation map / handoff so the owner-approved order is explicit: operational POS core → production local persistence → host/device proof → sync re-entry.
- Do **not** implement new product behavior in this map item.

## Exit gate

`MAP-00 PASS` only when a new session can read the manifest/progress/field register and reach the same current-state conclusion as the code review.

---

# 6. MAP-01 — Effective POS configuration and authorization

This capability must exist before shifts, refunds, voids and payment choices become production behavior.

## Product meanings

### Owner/Back Office-owned configuration

- feature flags: shifts, time clock, open tickets, restaurant/place management and later related features;
- enabled payment methods and their order;
- tax configuration relevant to sale calculation;
- discount definitions and restrictions;
- branch/store identity and operational settings;
- receipt configuration;
- dining/fulfillment options;
- employee roles/permissions;
- device assignment.

### POS-local effective projection

The POS stores the currently effective configuration needed to operate offline. It does **not** become the source of truth for global merchant administration.

## Required Rifad contracts

Create bounded contracts rather than extending one giant runtime object blindly. Expected boundaries include concepts equivalent to:

- `EffectivePosConfigurationContract`;
- `AuthorizationContract` / permission snapshot;
- `ManagerOverrideContract` for one-action approval;
- configuration version/revision identity.

Exact names may change during manifest/contract review, but the ownership boundary may not.

## Authorization behavior

A role name alone is insufficient. The local runtime must answer concrete capability questions such as:

- may accept payment;
- may refund;
- may manage all open tickets;
- may void previously saved items;
- may view sensitive shift totals;
- may open cash drawer without sale;
- may reprint/resend receipts;
- may change sale tax/discount where allowed;
- may change device settings.

Manager override grants the **single blocked action**, records the approving employee/authorization fact where audit requires it, and does not permanently elevate the cashier session.

## Exit gate

`MAP-01 PASS` when the POS can boot with a versioned effective configuration + permission snapshot, operate from it without cloud dependency, visibly block unauthorized actions and accept a one-action manager override through a Rifad-owned contract.

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

`MAP-00` must make these ready through bounded flows before implementation.

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

- `POS-SCREEN-016` — Receipts List;
- `POS-SCREEN-017` — Receipt Detail;
- `POS-SCREEN-018` — Refund;
- `POS-SCREEN-010` — Split Payment;
- `POS-SCREEN-009` — Integrated Payment.

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

Minimum hardware lanes:

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

Final adoption requires the remaining license/topology/auth/secret/backup/restore/upgrade/rollback/observability gates plus real Windows and tablet evidence. Existing PowerSync leadership in technical proofs is evidence, not automatic adoption.

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

The next implementation task is **`MAP-00 — Reality and authority reconciliation` only**.

Do not start Shift UI, new database code or synchronization work in the same change.

`MAP-00` should produce a clean, code-accurate manifest/progress/field register and reconcile the documented execution sequence. Then stop for owner review before `MAP-01` begins.
