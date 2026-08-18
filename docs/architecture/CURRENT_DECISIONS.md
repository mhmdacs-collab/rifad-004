# Current Rifad Decisions

Last updated: 2026-08-18

These decisions supersede earlier architecture proposals under `docs/research/historical-proposals/` when they conflict. Detailed capability documents remain authoritative for the implementation boundary of their respective capability.

## D-001 — Rifad owns the core

Rifad is not a branded shell over a donor POS/ERP. External systems may supply modules, algorithms or adapters but do not define Rifad contracts or product ownership.

## D-002 — UI-first

Build the interactive product shell through Rifad-owned contracts and replaceable adapters while exposing the durable data/contract requirements production will need.

UI-first does not mean infrastructure must wait until every screen is complete; reusable infrastructure may be proved earlier when it is required to validate a real vertical product flow and does not freeze unfinished domain meanings.

## D-003 — Primary UI stack

Use React + TypeScript + Vite. Windows hosts the same product UI in an application shell; supported tablet/mobile uses an installable PWA-class path unless a later proven host is adopted behind the same Rifad contracts.

## D-004 — Loyverse as primary functional baseline

Loyverse is the primary workflow/ergonomic reference for screen inventory, interaction meaning, states, prerequisites and operational flows. Rifad independently owns its implementation, data, branding and contracts.

For synchronization, Loyverse is a **behavioral baseline** only: connected changes are expected to propagate quickly, offline sales remain durable locally and replay after reconnect, and permissions determine allowed mutations. Its proprietary internal sync technology is not known and must not be invented from observation.

## D-005 — Puzzle modules

Capabilities are replaceable modules behind stable Rifad-owned contracts. Donor language/framework does not determine Rifad architecture.

## D-006 — Donor projects are not repaired for their own sake

If extracting one capability requires broad donor repair, evaluate another donor or reimplement characterized behavior.

## D-007 — Local-first

Offline-capable POS operation, durable local state, idempotency and synchronization are core product requirements. Exact implementation remains behind Rifad-owned boundaries.

## D-008 — ZATCA is core

Saudi fiscal compliance is first-class Rifad domain work behind a Rifad fiscal contract/state model.

## D-009 — Accounting is replaceable

Odoo, ERPNext or another accounting engine may connect through adapters. None owns finalized Rifad sale truth by default.

## D-010 — Historical research stays available

Older Odoo/hybrid/open-source proposals remain research evidence, not binding architecture.

## D-011 — Donor composition happens inside Rifad

Multiple proven donor capabilities may be composed behind Rifad contracts. The first donor never becomes the hidden integration base.

## D-012 — Existing code is an accelerator, not authority

Adopt proven implementations/tests/protocols where practical only after execution, source/test inspection, failure characterization, license verification and Rifad conformance review.

## D-013 — Support is a tested capability matrix

Do not claim generic device/integration support without evidence. Publish supported protocol/model/capability combinations and distinguish standards from certified/tested devices.

## D-014 — UI implementation is manifest-gated

Every screen/action/state/flow receives stable IDs. Implement only ready screens/flows or explicitly bounded subsets and update the manifest when behavior changes.

## D-015 — Rifad owns visual authority

Rifad owns final visual tokens/assets/component styling. External interfaces may be direct execution references for approved hierarchy/interaction decisions without becoming source-code or brand dependencies.

## D-016 — Build vertical flows, not disconnected screen museums

Milestones prove end-to-end outcomes through Rifad contracts/adapters.

Current executable ready flows include:

- `POS-FLOW-001` — retail cash sale slice;
- `POS-FLOW-002` — restaurant local-service prototype;
- `POS-FLOW-006` — tablet sale-page layout;
- `BO-FLOW-002` — bounded Back Office catalog list + add/edit slice.

## D-017 — POS is touch-first and human-scaled

> **Touch first, then human visual clarity, then beauty.**

Constrained screens change layout/density/wrapping/scrolling/columns before shrinking important targets.

## D-018 — Every visible durable field must be traceable

`docs/ui/POS_UI_NAMING_AND_FIELD_REGISTER.md` records canonical terminology, current fields, gaps, reserved integration facts, derived values and UI-only state. Update it whenever product/UI work exposes new durable meaning.

## D-019 — Checkout preserves cashier spatial context

Accepted progression is `basket → payment methods → cash/card → success`. The catalog remains visible as frozen context while the transaction rail changes state.

## D-020 — Mock payment UX is not production terminal support

Mock **شبكة / مدى** validates UX/data shape only. Production support requires a proven provider/terminal adapter, durable payment records, decline/recovery, reconciliation/refund scope, security review and capability evidence.

## D-021 — Frequent primary actions stay outside scrolling content

Completion actions such as **دفع / سداد / طباعة / بيع جديد** occupy stable action/footer regions whenever practical. Repeatable content absorbs scrolling first.

## D-022 — Transaction operation card keeps one stable two-slot geometry

Rifad keeps the same two physical transaction slots, width, padding, gap, touch height and bottom placement across adjacent sale/payment/success states. Ordinary RTL meaning keeps secondary/state action on the right and active completion on the left unless an approved visual decision says otherwise.

Current examples include restaurant `محلي | دفع`, reopened local order `إرسال | دفع`, cash `إلغاء الفاتورة | سداد`, and success `طباعة | بيع جديد`.

## D-023 — Fulfillment, sales channel and payment/collection are separate durable meanings

Do not overload one field with restaurant fulfillment, delivery platform and payment state.

- fulfillment: takeaway / dine-in / delivery;
- sales channel: direct POS / Keeta / HungerStation / Jahez / Ninja / future channels;
- payment/collection/settlement: cash/Mada/customer credit/platform prepaid/due on delivery/platform settlement.

Fast UI may combine defaults while durable reporting/accounting retains the distinctions.

## D-024 — Restaurant service classification and place management are separate configuration layers

Restaurant semantics are optional and must not leak into retail/direct workflows.

- restaurant service OFF: ordinary direct sale;
- restaurant service ON + place management OFF: `محلي` can complete dine-in without exact place;
- restaurant service ON + place management ON: choose `PlaceGroup → ServicePlace`, keep/reopen an open local order, send preparation state and release the place after successful payment.

Current `POS-FLOW-002` is a local/mock UI proof only. Persistent configuration belongs primarily in Back Office. It does not claim final multi-device table sync, real KDS/printer transport or production persistence.

## D-025 — Product pricing can vary by sales channel without making channel only a payment method

Support base price plus authorized branch/channel/pricelist overrides. Manual channel choice must show recalculated total before completion. API-originated orders preserve actual sold-price snapshots. Platform commission/settlement fee is separate from customer-facing price.

## D-026 — Kitchen dispatch is order state, not a universal payment side effect

Preparation dispatch follows fulfillment/order lifecycle and later requires durable dispatch identity, delta/revision semantics, idempotency/outbox and real printer/KDS transport evidence. Current restaurant behavior proves only mock state transitions.

## D-027 — Delivery integrations are capability-based adapters; direct and aggregator modes are both valid

Delivery provider schemas never become Rifad public contracts. Direct adapters and aggregator adapters are both valid according to proven capabilities/onboarding economics.

API-originated orders should arrive with channel, fulfillment, sold prices and payment/collection state already normalized. The preferred cashier concept is one online-orders queue with many adapters behind it.

See `docs/research/restaurant-pos/DELIVERY_PLATFORM_INTEGRATION_BENCHMARK_2026-08-17.md`.

## D-028 — General POS runtime is dependency-injected behind a Rifad-owned contract

`PosRuntimeContract` is the aggregate runtime boundary. The composition root selects an implementation and injects it into POS flows. Donor/mock/runtime details stop at the adapter boundary and replacement runtimes must pass reusable conformance probes.

See `docs/architecture/POS_RUNTIME_ADAPTER_BOUNDARY.md`.

## D-029 — Local persistence and transactional outbox are Rifad-owned and separate from LAN, Sync and fiscal

`LocalPersistenceContract` owns stable installation identity, branch/device context, module-private versioned snapshots, revision metadata, transactional outbox semantics, stable event identity/deduplication, retry/failure bookkeeping and acknowledgement.

A completed offline-capable sale becomes a durable Rifad fact before downstream work. Retry must never create a second sale.

`BrowserLocalPersistence` and historical localStorage compatibility are staging evidence, not production database selection. LAN, cloud Sync and ZATCA/Fatoora remain separate capabilities.

See `docs/architecture/LOCAL_PERSISTENCE_AND_OUTBOX_BOUNDARY.md`.

## D-030 — Product/UI field discovery precedes final production data-model freeze, not all infrastructure proof

Rifad does not freeze its final production SQL/database model merely because adapter/local-persistence foundations exist.

Current UI/product work must continue discovering durable meanings through bounded vertical slices and tracing them in `docs/ui/POS_UI_NAMING_AND_FIELD_REGISTER.md`.

However, the previous wording that **all deeper infrastructure must wait until major product-field discovery is complete was too broad**.

Reusable infrastructure may and sometimes must be selected/proved before full feature completion when all of the following are true:

1. it enables a real end-to-end product flow that otherwise cannot be evaluated;
2. it is replaceable behind a Rifad-owned contract;
3. it tolerates future schema/field growth through normal schema/configuration evolution;
4. it does not force unfinished provider/database shapes to become Rifad domain truth.

Synchronization now meets that condition because Back Office cannot fulfill its management purpose while POS remains a disconnected browser snapshot.

Final **business/data-model freeze** still follows sufficient product-field discovery. Synchronization selection/proof does not freeze catalog, restaurant, inventory, tax, branch or other unfinished schemas.

See `docs/architecture/BACK_OFFICE_CATALOG_BOUNDARY.md` and `docs/architecture/SYNC_CAPABILITY_BOUNDARY.md`.

## D-031 — Merchant pricing uses reusable option groups with sparse item overrides; add-ons support reusable and item-private scope

The merchant-facing concept is **مجموعات الخيارات**, not repeated technical Cartesian variant construction.

Example: `أحجام البيتزا → صغير 10 | وسط 20 | كبير 25`.

One reusable group may serve many items. Item pricing is one of:

1. fixed price;
2. reusable option group with inherited prices;
3. reusable option group with sparse per-item overrides;
4. item-private option prices.

Unchanged values continue inheriting the shared group. Add-ons remain separate: reusable general add-ons vs item-private add-ons.

Legacy generated `CatalogVariant*` structures are staging migration compatibility only. Until POS has an approved option/add-on chooser, option-priced items remain hidden from the default POS reader rather than being sold at a fallback/minimum price.

See `docs/ui/flows/BO-FLOW-002.md` and `docs/architecture/BACK_OFFICE_CATALOG_BOUNDARY.md`.

## D-032 — Synchronization is an early cross-surface infrastructure gate, not a per-feature rewrite

Once the current POS/Back Office reference UI is locked enough to stop visual churn, **synchronization candidate selection and runtime proof precede completing the full Back Office/POS feature set**.

The target is one durable, replaceable synchronization capability that carries current and future authorized Rifad facts.

Binding rules:

- connected synchronization is automatic/continuous by default;
- Back Office changes reach relevant POS clients quickly;
- permitted POS changes and operational facts reach Back Office/cloud and relevant clients quickly;
- permissions/domain authority decide what each actor may mutate; replication direction is not the permission system;
- offline-capable commands remain durable locally and replay automatically after reconnect with stable identity/idempotency;
- a manual Sync affordance is fallback/status/diagnostic, not the normal path;
- ordinary additive fields/entities require normal schema/configuration evolution, **not synchronization-engine rewrites**;
- LAN/future Branch Hub remains a separate capability and is not authorized merely by selecting cloud sync;
- no vendor/technology is selected from README/documentation claims alone.

Synchronization is a high-risk adoption lane. Before selection, Rifad must execute and characterize at least two credible candidates, inspect source/tests/failure behavior where available, verify licensing/dependencies, and prove Windows + tablet/PWA offline/reconnect/restart/schema-evolution/security behavior.

Current research shortlist and exact proof matrix are recorded in:

- `docs/research/sync/RIFAD_SYNC_BENCHMARK_2026-08-18.md`;
- `docs/architecture/SYNC_CAPABILITY_BOUNDARY.md`.
