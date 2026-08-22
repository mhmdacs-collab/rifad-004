# Rifad POS UI Naming and Field Register

Last updated: 2026-08-21

Status: **CURRENT — MAP-01 closeout and Front Office ownership checkpoint reconciled**

This register is the canonical traceability index between visible POS/Back Office concepts and durable Rifad-owned meanings. It prevents UI-first work from silently creating unnamed database/business facts.

It must be read with:

- `docs/ui/UI_EXECUTION_MANIFEST.json`
- `docs/architecture/PAYMENT_AND_DELIVERY_COLLECTION_DECISION.md`
- `docs/implementation/CURRENT_EXECUTION_STATUS.md`

## 1. Classification

| Class | Meaning |
| --- | --- |
| `CURRENT` | durable/business meaning exists in a current Rifad contract/model/adapter |
| `CURRENT-MOCK` | meaning exists and is exercised, but current transport/provider/runtime is staging/mock |
| `REQUIRED-GAP` | visible/product-required durable fact still needs its owning contract/lifecycle |
| `RESERVED-INTEGRATION` | identity/field is reserved for a later external provider/hardware integration |
| `DERIVED` | calculated from authoritative fields; should not become competing source-of-truth state |
| `UI-ONLY` | presentation state only; must not create a business/database field |

## 2. Device and employee session

| Visible/business concept | Canonical meaning | Class | Notes |
| --- | --- | --- | --- |
| Device ID | stable POS node identity | `CURRENT-MOCK` | current device-link runtime is staging |
| Device name | cashier-facing POS device label | `CURRENT-MOCK` | projected/store-linked meaning exists |
| Branch/store ID | store scope for the POS node | `CURRENT-MOCK` | effective configuration is branch/device scoped |
| Branch/store name | cashier-facing branch label | `CURRENT-MOCK` | presentation from bound context |
| Linked account/email | current device-link credential context | `CURRENT-MOCK` | not final merchant account/security model |
| Employee ID | stable acting employee identity | `CURRENT-MOCK` | local authorization evaluates this ID |
| Employee name | cashier-facing employee name | `CURRENT-MOCK` | not authorization authority by itself |
| Role ID | stable role identity | `CURRENT-MOCK` | role name is never permission authority |
| Role name | display label | `CURRENT-MOCK` | explicit capability list owns authorization |
| Four-digit PIN | employee/manager local credential input | `CURRENT-MOCK` | raw PIN must not be persisted in public config/audit; production verifier/lockout remains later security work |

## 3. Effective POS configuration and authorization

Current local namespace: `pos.effective-configuration`.

| Field / concept | Canonical meaning | Class | Notes |
| --- | --- | --- | --- |
| contract version | Rifad configuration contract version | `CURRENT` | provider-independent |
| schema version | local effective-snapshot schema | `CURRENT-MOCK` | current browser persistence transport is staging |
| revision | merchant-policy revision projected to POS | `CURRENT-MOCK` | used by authorization/audit evidence |
| effective timestamp | time snapshot became effective | `CURRENT-MOCK` | local projection evidence |
| branch ID | exact target branch | `CURRENT-MOCK` | projection rejects unavailable/mismatched branch |
| device ID | exact target POS device | `CURRENT-MOCK` | projection rejects unavailable/mismatched device |
| features | owner-managed operational switches | `CURRENT-MOCK` | feature switch does not imply owning MAP feature is implemented |
| role permissions | explicit locally enforceable POS capabilities | `CURRENT-MOCK` | Back Office-only permissions stripped from POS projection |
| employee branch scope | branches employee may act in | `CURRENT-MOCK` | evaluated locally |
| employee active state | whether employee can act | `CURRENT-MOCK` | evaluated locally |

Current authorization namespace: `pos.authorization-audit`.

Current event family:

- `authorization.manager-override-approved.v1`

Manager override fields are CURRENT-MOCK: actor employee, approver employee, capability, branch, command, target, timestamp and config revision. Raw manager PIN is never an audit/configuration field.

## 4. Catalog and sale layout

| Concept | Canonical meaning | Class | Notes |
| --- | --- | --- | --- |
| Item ID/name | stable sellable catalog identity | `CURRENT-MOCK` | current browser catalog adapter is staging |
| Category ID/name | catalog grouping | `CURRENT-MOCK` | current Back Office management exists |
| SKU | merchant item stock-keeping identity | `CURRENT-MOCK` | searchable in Back Office |
| Barcode | merchant scan/search identity | `CURRENT-MOCK` | current POS hardware scanning is not claimed |
| Available for sale | whether item may appear in sellable POS catalog | `CURRENT-MOCK` | Back Office unavailable item remains manageable |
| Base price | exact SAR Money in halalas | `CURRENT-MOCK` | no floating-point authority |
| Pricing mode | fixed / reusable option group / item-private choices | `CURRENT-MOCK` | cashier option selection remains MAP-03 gap |
| Add-on groups | reusable/private add-on configuration | `CURRENT-MOCK` | POS selection/rules remain MAP-03 gap |
| Item appearance | merchant POS color/shape/image staging meaning | `CURRENT-MOCK` | not sale truth |
| Sale page ID/name | stable tablet sale-page identity | `CURRENT-MOCK` | current local layout contract |
| Product slot | desired product assigned to stable sale-page slot | `CURRENT-MOCK` | layout persists locally |

## 5. Ticket / sale-money truth

| Concept | Canonical meaning | Class | Notes |
| --- | --- | --- | --- |
| Ticket ID | stable working sale identity | `CURRENT-MOCK` | current runtime/local journal |
| Ticket sequence | cashier-facing sequence | `CURRENT-MOCK` | current mock sequencing |
| Ticket line ID | stable current line identity | `CURRENT-MOCK` | quantity mutations target it |
| Product snapshot name/price | current sold-line base facts | `CURRENT-MOCK` | exact option/add-on/tax/discount sold snapshot remains MAP-03 |
| Quantity | exact desired line quantity | `CURRENT-MOCK` | set semantics, not replayed increment authority |
| Customer reference | attached customer identity/details | `CURRENT-MOCK` | current customer-credit model |
| Subtotal | exact Money | `DERIVED` | from authoritative current lines |
| Loyalty redemption | exact applied redemption Money | `CURRENT-MOCK` | existing local behavior |
| Tax included | current mock derived tax amount | `CURRENT-MOCK` | final tax assignment/sold snapshot remains MAP-03 |
| Total | exact Money payable for current implemented sale facts | `DERIVED` | self-delivery fee is NOT included until its sale-money contract is implemented |

### Required later sold-line fields

`REQUIRED-GAP` for MAP-03 includes resolved pricing-option identity/value, selected add-ons and exact added amounts, discount snapshot, tax snapshot and any other sale-line choice that changes durable sold truth.

### Front Office regression meanings — `CURRENT-MOCK`

| Field / concept | Canonical meaning | Class | Notes |
| --- | --- | --- | --- |
| inline customer workspace state | presentation mode replacing the cart content while the catalog stays visible | `UI-ONLY` | never a modal and never an auto-save authority |
| selected normal-ticket customer | candidate shown in the retained result list before explicit attachment | `UI-ONLY` | attachment is owned by `SalesContract.setCustomer` |
| selected Credit customer summary | collapsed payment-customer selection after an explicit choice | `UI-ONLY` | Change Customer restores search/results |
| ticket-line kitchen ownership | `pending` or `sent` on the current local/mock `TicketLine` | `CURRENT-MOCK` | ordinary cart tools may mutate only `pending`; a missing legacy marker normalizes through the compatibility rules |
| kitchen dispatch batch ID | immutable identity of one sent local/mock kitchen revision | `CURRENT-MOCK` | prevents a later same-product addition from rewriting sent history |
| kitchen delta kind | `add`, `reduce` or `cancel` | `CURRENT-MOCK` / `INTERNAL-CHARACTERIZATION` | ordinary cashier Send emits pending `add`; `reduce`/`cancel` helpers are retained only for adapter/domain characterization and never expose a cashier correction action or rewrite prior batches |
| pending kitchen batch | editable/clearable additions that have not crossed the kitchen boundary | `CURRENT-MOCK` | same-product lines aggregate only inside the same pending batch, never into a sent line |
| sent quantity snapshot | active quantity represented by immutable kitchen batches and any already-recorded internal characterization deltas | `CURRENT-MOCK` | current cashier SENT history is read-only and remains durable when pending changes are cleared or the order is reopened |
| deferred sent-correction intent | internal/test-only command shape for future `reduce`/`cancel` characterization | `INTERNAL-CHARACTERIZATION` | not a current cashier authorization; `allowSentCorrections` is not exposed by Front Office interaction paths; UX, authorization, reason, audit, kitchen notification and financial consequences are deferred to Open Order lifecycle work |
| last local-order mutation command ID | most recently accepted update, including metadata-only updates | `CURRENT-MOCK` | supports deterministic retry without changing the stable creation command identity |
| local-order mutation command IDs | bounded memory of accepted update command identities | `CURRENT-MOCK` | prevents an older retry from creating a duplicate kitchen revision after later mutations |
| debt collection method | merchant collection rail selected for settlement (`cash` or `network`) | `CURRENT-MOCK` | required before settlement; separate from sale Payment Type configuration |
| debt collection receipt ID / number | stable identity and cashier-facing number for one idempotent settlement | `CURRENT-MOCK` | does not create a completed-sale receipt |
| debt receipt customer mobile | mobile snapshot printed on the collection receipt | `CURRENT-MOCK` | collection-receipt presentation fact |
| debt before / paid / remaining | exact Money snapshots around the accepted settlement | `CURRENT-MOCK` | overpayment and zero payment are rejected |
| `PrintingContract.submitDebtCollection` | dedicated collection-receipt print boundary | `CURRENT-MOCK` | separate from sale `submit`/reprint paths; hardware delivery remains unverified |

## 6. Payment methods — current MAP-01 meaning

A Payment Type identifies **how the merchant's right is collected/held**, not merely a button label.

### 6.1 Stable starter methods

A new merchant configuration begins with:

| Stable method | Operational kind | Direct impact | Class |
| --- | --- | --- | --- |
| نقدي | `cash` | `cash` | `CURRENT-MOCK` |
| شبكة / مدى | `card` | `bank` | `CURRENT-MOCK` |
| آجل | `customer-credit` | `customer-receivable` | `CURRENT-MOCK` |

The merchant may hide/re-show and reorder these methods without deleting their stable meaning. Additional merchant methods can be added.

### 6.2 Payment Type fields

| Field | Canonical meaning | Class | Notes |
| --- | --- | --- | --- |
| payment method ID | stable method identity | `CURRENT-MOCK` | default or merchant-defined |
| name | cashier-facing method label | `CURRENT-MOCK` | may be merchant-defined |
| operational kind | cash/card/customer-credit/custom | `CURRENT-MOCK` | controls currently available completion adapter |
| enabled | whether method appears as a payment choice | `CURRENT-MOCK` | hidden is not deleted |
| sort order | merchant-defined display order | `CURRENT-MOCK` | projected to POS |
| availability | offline-capable / online-required | `CURRENT-MOCK` | final provider connectivity policy may specialize this |
| store IDs | optional branch scope | `CURRENT-MOCK` | empty = all stores in current admin semantics |
| direct impact | `cash | bank | customer-receivable | external-platform` | `CURRENT-MOCK` | product meaning; not final accounting ledger implementation |
| system default | `cash | network | credit | null` | `CURRENT-MOCK` | stable starter identity/migration meaning |

### 6.3 Payment surface behavior

| UI behavior | Class | Notes |
| --- | --- | --- |
| payment choices come from effective config | `CURRENT` | no hard-coded two-button payment rail |
| one-column small method set | `UI-ONLY` | touch layout behavior |
| two-column layout when visible choices exceed five | `UI-ONLY` | tablet/desktop presentation |
| phone returns to one column | `UI-ONLY` | avoids shrinking touch targets |
| Credit opens customer selection/credit charge | `CURRENT-MOCK` | reuses existing customer-credit contract |
| unsupported custom financial lifecycle shown disabled | `CURRENT` | must never silently map to Cash/Card |

### 6.4 Split payment

`POS-SCREEN-010` remains `REQUIRED-GAP` / MAP-05.

Future split payment must allocate one sale across **any enabled Payment Types**, not a fixed Cash/Network pair. Required later durable facts include allocation/payment-record ID, payment-method ID, exact amount, lifecycle/status, provider/reference when applicable, idempotent completion and refund/reversal linkage.

## 7. Delivery channel and merchant collection

Delivery channel is deliberately separate from Payment Type.

A sale may therefore be simultaneously:

- `channel = HungerStation`;
- `merchant collection = cash`;
- `direct impact = cash`.

### 7.1 Delivery configuration fields

| Field / concept | Canonical meaning | Class | Notes |
| --- | --- | --- | --- |
| delivery enabled | merchant enables delivery family | `CURRENT-MOCK` | disabled by default |
| channel ID | stable delivery/source identity | `CURRENT-MOCK` | known or custom |
| channel name | merchant-facing channel label | `CURRENT-MOCK` | examples: HungerStation, Keeta, Jahez |
| channel kind | `platform | self-delivery | custom` | `CURRENT-MOCK` | source/operational classification |
| brand key | known visual brand identity key | `CURRENT-MOCK` | visual mapping, not money authority |
| channel enabled | whether channel is available to effective config | `CURRENT-MOCK` | branch scope also applies |
| electronic payment enabled | platform/customer may be prepaid electronically | `CURRENT-MOCK` policy | settlement execution remains later |
| COD enabled | channel supports payment at delivery | `CURRENT-MOCK` policy | execution additionally depends on settlement mode |
| COD settlement | `courier-pays-merchant | platform-settlement` | `CURRENT-MOCK` | only courier-pays-merchant is executable now |
| store IDs | optional delivery-channel branch scope | `CURRENT-MOCK` | projected locally |

Known starter definitions are provisioned for HungerStation, Keeta, Jahez and self-delivery, plus custom channel creation. Starter delivery channels are hidden/disabled until enabled by the merchant.

### 7.2 Current executable Delivery COD fields

Current local namespace: `pos.delivery-collection`.

Current event families:

- `delivery.collection-set.v1`
- `delivery.collection-cleared.v1`
- `delivery.collection-receipt-attached.v1`

| Field | Canonical meaning | Class |
| --- | --- | --- |
| ticket ID | sale being collected through delivery channel | `CURRENT-MOCK` |
| receipt ID | completed receipt association, nullable before completion | `CURRENT-MOCK` |
| channel ID/name/kind | durable source/channel context | `CURRENT-MOCK` |
| payment mode | current executable value `cash-on-delivery` | `CURRENT-MOCK` |
| settlement | current executable value `courier-pays-merchant` | `CURRENT-MOCK` |
| merchant collection | `cash | card` | `CURRENT-MOCK` |
| created/updated timestamps | local collection-context lifecycle evidence | `CURRENT-MOCK` |

Current safe POS path:

`توصيل → القناة → عند الاستلام → كيف استلم المحل المبلغ؟ → نقدي | شبكة`

Cash/Network remains payment authority; `DeliveryCollectionContract` preserves the channel so the source is not lost when the receipt is paid.

### 7.3 Platform electronic settlement

`external-platform` direct impact and `platform-settlement` policy are `CURRENT-MOCK` configuration meanings, but the following are `REQUIRED-GAP` until the payment/settlement lifecycle owns them:

- settlement batch/reference;
- gross platform receivable;
- commission/fees;
- adjustments;
- net amount received;
- settlement date/status;
- reconciliation difference.

POS must not complete a platform-settlement sale as Cash or Network merely because those adapters exist.

## 8. Self-delivery

Current Back Office policy fields:

| Field | Meaning | Class |
| --- | --- | --- |
| self-delivery channel enabled | merchant uses own delivery | `CURRENT-MOCK` |
| fee mode | current value `manual` | `CURRENT-MOCK` policy |
| default delivery fee | exact intended delivery fee in halalas | `CURRENT-MOCK` policy only |
| allow POS fee override | whether cashier may change configured fee later | `CURRENT-MOCK` policy only |
| fee beneficiary | `merchant | courier` | `CURRENT-MOCK` policy |

The following remain `REQUIRED-GAP` before self-delivery can be executable in POS:

- exact ticket/invoice delivery-fee mutation contract;
- durable fee amount actually charged on the sale;
- fee beneficiary snapshot on completed sale;
- if courier is beneficiary, courier/payable or custody meaning;
- zone/distance/location price resolution;
- delivery address/zone fields required by the eventual delivery workflow.

A textbox that visually shows a delivery fee without changing authoritative ticket money is prohibited.

## 9. Customer credit / آجل

| Concept | Meaning | Class |
| --- | --- | --- |
| customer ID/name/mobile/details | customer identity/profile | `CURRENT-MOCK` |
| customer attached to ticket | current sale customer | `CURRENT-MOCK` |
| Credit/آجل payment choice | creates customer-credit sale through existing flow | `CURRENT-MOCK` |
| debt ledger entry | opening / credit sale / settlement | `CURRENT-MOCK` |
| debt balance | derived/current local customer balance | `CURRENT-MOCK` |
| settlement amount | exact Money applied against debt | `CURRENT-MOCK` |

Production credit permissions/limits/aging/accounting remain later product gates; their absence does not remove Credit as a default quick-sale payment choice.

## 10. Receipt and completed-sale fields

| Concept | Meaning | Class | Notes |
| --- | --- | --- | --- |
| receipt ID/number | stable completed-sale receipt identity | `CURRENT-MOCK` | current runtime |
| payment method | current cash/card/credit receipt classification | `CURRENT-MOCK` | normalized multi-payment records remain MAP-05 |
| items | completed current line snapshots | `CURRENT-MOCK` | MAP-03 expands sold truth |
| subtotal/redemption/tax/total | exact Money facts in current model | `CURRENT-MOCK` | tax finality later |
| tendered/change | current cash/card/credit completion facts | `CURRENT-MOCK` | payment normalization later |
| completed timestamp | completion time | `CURRENT-MOCK` |
| employee/branch | cashier and branch display snapshot | `CURRENT-MOCK` |
| delivery collection association | lookup through `DeliveryCollectionContract` | `CURRENT-MOCK` | separate puzzle capability, deliberately not overloaded into receipt.paymentMethod |

Receipt detail/refund normalized lifecycle remains MAP-05.

## 11. Restaurant/local-service staging

Current restaurant service/place/open-order proof remains `CURRENT-MOCK`. It is not the owner of payment/direct-impact or delivery-channel meanings.

Real KDS/printer transport, multi-device synchronization, production open-ticket lifecycle and production Back Office ownership remain separate gates.

## 12. Local persistence / outbox

Current known Rifad namespaces include:

- `pos.runtime`
- `pos.effective-configuration`
- `pos.authorization-audit`
- `pos.delivery-collection`

Current browser persistence is `CURRENT-MOCK` transport behind `LocalPersistenceContract`.

It is **not**:

- the MAP-06 production local database;
- MAP-10 synchronization;
- LAN/Branch Hub;
- fiscal/ZATCA authority.

`Local Persistence != Sync != LAN/Branch Hub != Fiscal/ZATCA`

## 13. Hardware/provider reserved fields

The following remain `RESERVED-INTEGRATION` until their owning capability is approved:

- real integrated card/Mada terminal provider/device/reference/status fields;
- printer hardware identity/delivery acknowledgement;
- real KDS/CDS pairing/transport identity;
- delivery-platform API order IDs/webhook/provider references;
- fiscal/ZATCA UUID/hash/clearance/reporting fields.

Current mock Card/Mada behavior must not be interpreted as production terminal support.

## 14. Immediate roadmap implications

- **MAP-01 PASS:** effective configuration, authorization, payment direct impact, N-method selection and bounded delivery COD collection context.
- **MAP-02 next only after the Front Office owner-acceptance gate:** Shift + Cash Drawer Ledger + Time Clock. Cash-drawer expected balance must consume `directImpact = cash`; it must not infer cash from payment labels.
- **MAP-03:** sold tax/discount/pricing-option/add-on truth.
- **MAP-04:** open-ticket lifecycle.
- **MAP-05:** normalized payment records, split payment across any enabled methods, receipt detail/refunds and later payment/settlement lifecycle.
- **MAP-06:** production local persistence selection.
- **MAP-10:** synchronization provider.
- **MAP-11:** real Back Office ↔ POS transport.

MAP-02 has not started. Do not start it before explicit owner acceptance of the current
Front Office checkpoint.
