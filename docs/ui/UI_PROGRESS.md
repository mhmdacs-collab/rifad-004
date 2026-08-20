# Rifad UI Progress

Last updated: 2026-08-20

Status: **MAP-01 PASS — payment/direct-impact/delivery-collection closeout included**

Active branch: `agent/pos-visual-pass-01`

## 1. Current executable POS truth

The current POS is a Rifad-owned touch-first RTL shell backed by Rifad contracts/adapters. Existing executable families include the retail sale slice, current local restaurant proof, customer/credit/loyalty behavior, receipt history/reprint, tablet sale-page layout and MAP-01 authorization/configuration behavior.

The payment surface is now configuration-driven rather than a hard-coded Cash/Card screen.

### Payment selection

Default merchant methods on first setup:

- **نقدي** — direct impact `cash`;
- **شبكة / مدى** — direct impact `bank`;
- **آجل** — direct impact `customer-receivable`.

The merchant may hide/re-show and reorder these stable identities. Additional payment methods can be added from Back Office.

`POS-SCREEN-007` renders enabled methods from `EffectivePosConfiguration.paymentMethods` in merchant order:

- small sets keep a comfortable single column;
- more than five visible choices use a compact two-column tablet layout;
- constrained phone layouts return to one column rather than shrinking touch targets;
- Credit opens the current customer-credit flow;
- a configured method whose completion lifecycle is not implemented stays visibly unavailable instead of silently completing as another method.

### Delivery collection

Delivery channel and merchant payment are separate meanings.

When an enabled delivery channel supports COD with `courier-pays-merchant`, POS exposes one **توصيل** tile. The executable current path is:

`توصيل → القناة → عند الاستلام → كيف استلم المحل المبلغ؟ → نقدي | شبكة`

The selected channel is persisted through `DeliveryCollectionContract` while the existing Cash/Network payment engine owns the direct money effect.

Current local namespace:

- `pos.delivery-collection`

Current local event families:

- `delivery.collection-set.v1`
- `delivery.collection-cleared.v1`
- `delivery.collection-receipt-attached.v1`

This preserves facts such as:

`channel = HungerStation` + `merchant collection = cash`

through completed-receipt association and local restart.

Self-delivery and external-platform electronic settlement may be configured in Back Office but are not exposed as fake executable POS payment paths until their correct money/settlement contracts exist.

## 2. Current executable Back Office truth

The current Back Office keeps the existing catalog family and adds bounded MAP-01 operational configuration.

Top-level current workspaces:

- **الأصناف والكتالوج**;
- **إدارة الموظفين والإعدادات**;
- **الدفع والتوصيل**.

### Operational configuration

Editable through `PosConfigurationAdminContract`:

- Employees;
- Access Rights / Roles;
- Features;
- Stores;
- POS Devices;
- Payment Types.

### Payment and Delivery workspace

Current editable payment policy:

- add/edit method;
- show/hide;
- merchant order;
- operational kind;
- direct impact: cash / bank / customer receivable / external platform;
- stable starter identity for Cash / Network / Credit.

Current editable delivery policy:

- global enable/disable;
- HungerStation, Keeta, Jahez and self-delivery starter channel definitions;
- custom delivery channel creation;
- per-channel enable/disable;
- electronic payment availability;
- COD availability;
- COD settlement: courier pays merchant or later platform settlement;
- self-delivery default fee policy;
- whether POS may override the fee;
- whether the fee belongs to the merchant or courier/delivery party.

Back Office currently persists this as local browser staging policy. Real Back Office → POS transport remains MAP-11.

## 3. Authorization truth

MAP-01 enforcement remains unchanged by the payment closeout:

- visible **دفع** evaluates `accept-payment`;
- missing permission visibly blocks checkout;
- an eligible manager may approve the one blocked action;
- approval never elevates cashier session identity;
- subsequent protected actions require their own decision/approval;
- archived receipt reprint uses the same capability/override boundary.

## 4. Current local data boundaries

Current Rifad-owned local namespaces relevant to MAP-01 include:

- `pos.runtime`
- `pos.effective-configuration`
- `pos.authorization-audit`
- `pos.delivery-collection`

Browser-backed adapters remain staging implementations behind Rifad contracts. They are not the MAP-06 production database and do not imply MAP-10 synchronization or MAP-11 Back Office transport.

## 5. Manifest state

Implemented current flows include:

- `POS-FLOW-001 — Retail Cash Sale Vertical Slice`
- `POS-FLOW-002 — Restaurant Local Service Prototype`
- `POS-FLOW-006 — Configure Tablet Sale Page`
- `POS-FLOW-007 — Delivery COD Merchant Collection`
- `BO-FLOW-002 — Manage Catalog Items`
- `BO-FLOW-003 — POS Operational Configuration and Access`

`BO-SCREEN-029` now records the bounded **Payment and Delivery Collection Settings** family.

The hard gate still prohibits implementing unrelated mapped screens merely because their eventual place in the product is known.

## 6. Deliberately not executable yet

- Split/partial payment — MAP-05; future allocations may use any enabled methods.
- External-platform electronic settlement/reconciliation.
- Self-delivery fee posting into ticket/invoice total; configuration exists, money mutation does not yet.
- Distance/zone delivery pricing.
- Real integrated Mada/card terminal.
- Shift/cash drawer/time clock — MAP-02.
- Tax/discount sold truth — MAP-03.
- Full open-ticket lifecycle — MAP-04.
- Production local database — MAP-06.
- Synchronization provider — MAP-10.
- Real Back Office ↔ POS transport — MAP-11.
- ZATCA/fiscal and final hardware integrations remain dedicated later capabilities.

## 7. Evidence

Payment/collection closeout coverage includes:

- `configured-payment-method-rail.test.tsx`
- `configured-delivery-collection.test.tsx`
- `delivery-collection-adapter.test.ts`
- `delivery-payment-integration.test.ts`
- `effective-pos-configuration.test.ts`
- `restored-device-effective-configuration.test.ts`
- `map01-owner-policy-integration.test.ts`
- `payment-delivery-model.test.ts`
- `payment-delivery-settings.test.tsx`
- `pos-operational-config-flow.test.tsx`

Canonical decision:

- `docs/architecture/PAYMENT_AND_DELIVERY_COLLECTION_DECISION.md`

Canonical execution status:

- `docs/implementation/CURRENT_EXECUTION_STATUS.md`

## 8. Next

MAP-01 remains **PASS** after this closeout.

Next dependency-safe map item is **MAP-02 — Shift + Cash Drawer Ledger + Time Clock**, which must consume MAP-01 direct-impact meanings instead of inventing separate cash/bank classifications.

Do not start MAP-02 automatically; stop for owner review.
