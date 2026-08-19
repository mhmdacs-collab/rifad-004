# Payment and Delivery Collection Decision

Status: OWNER-APPROVED PRODUCT DECISION — MAP-01 closeout  
Date: 2026-08-20

This record captures the payment/delivery semantics approved during MAP-01 product review. It narrows current implementation and later payment/settlement work; it does not authorize split payment, platform settlement accounting, self-delivery fee posting or production terminal integration ahead of their owning map items.

## 1. Default payment methods

A newly initialized merchant configuration starts with three stable payment-method identities:

1. **نقدي** — direct impact `cash`;
2. **شبكة / مدى** — direct impact `bank`;
3. **آجل** — direct impact `customer-receivable`.

The merchant may hide and re-show any default method. Hiding does not delete its identity or rewrite historical sales.

Additional methods such as bank transfer, cheque or merchant-defined methods may be added and ordered by the merchant.

## 2. Payment method and direct financial impact are separate meanings

A cashier-facing payment-method name does not itself define accounting destination. Every merchant payment type carries a direct-impact classification:

- `cash` — affects cash collection / later cash-drawer work;
- `bank` — affects bank/electronic collection;
- `customer-receivable` — creates/uses customer credit semantics;
- `external-platform` — value is due from an external platform until later settlement.

This classification is a product meaning, not a final accounting-ledger implementation.

## 3. Payment selection is N-method and configuration-driven

`POS-SCREEN-007` must not assume only Cash and Card.

The effective POS configuration supplies the enabled merchant-ordered list. The current touch surface uses one comfortable column for a small set and changes to a compact two-column layout when the visible choice count exceeds five; constrained phone layouts return to one column before shrinking touch targets.

Methods whose financial completion lifecycle is not yet implemented may be configured and shown as unavailable, but must never silently complete as another payment type.

## 4. Split payment is later payment-lifecycle work

A future split payment may allocate one sale across any enabled payment methods. It is not limited to Cash and Network.

Durable multi-payment allocation records, partial completion, cancellation/recovery, reconciliation and refund behavior remain owned by MAP-05. MAP-01 only ensures the method model and selection surface do not block that future shape.

## 5. Delivery channel is not the payment method

Rifad keeps these meanings separate:

- sales/delivery channel: HungerStation, Keeta, Jahez, self-delivery, custom/future channels;
- how the merchant receives money: Cash, Network, customer credit or later external-platform settlement;
- direct financial impact: cash, bank, customer receivable or external platform.

The POS exposes one **توصيل** entry when at least one currently executable delivery collection path is enabled, rather than filling the primary payment rail with every platform name.

## 6. External delivery — COD where courier pays merchant

For a configured delivery platform with:

- cash-on-delivery enabled; and
- settlement mode `courier-pays-merchant`;

POS may execute:

`توصيل → القناة → عند الاستلام → كيف استلم المحل المبلغ؟ → نقدي | شبكة`

The existing Cash/Network payment engine owns the direct money effect. A separate `DeliveryCollectionContract` preserves the channel/source context and links it from ticket to completed receipt, so a HungerStation cash order remains reportable as both:

- payment/collection = cash;
- channel = HungerStation.

Changing between Cash and Network must update the collection method without losing the channel. Returning to an ordinary direct sale clears delivery context.

## 7. External platform electronic settlement

When the platform has collected the customer payment and the merchant is paid later, direct impact is `external-platform`.

The configuration may represent this policy now, but POS must not claim executable platform-settlement accounting until durable settlement/reconciliation lifecycle exists.

## 8. Self-delivery

Back Office may configure self-delivery with:

- enabled/hidden state;
- manual default delivery fee;
- whether POS may override the fee;
- fee beneficiary: merchant or courier/delivery party.

The fee is part of what the customer is charged, but who economically earns that fee is a separate durable meaning.

Self-delivery must not become an executable POS path until its delivery fee actually changes the ticket/invoice total through a correct money contract. A decorative textbox that does not affect sale truth is prohibited.

Later location/zone/distance pricing may replace manual fee entry without changing the meaning of the delivery-fee field.

## 9. Current MAP-01 boundary

Implemented/allowed in this closeout:

- three default methods Cash / Network / Credit;
- merchant hide/show, add/edit and ordering;
- direct-impact classification;
- N-method responsive payment selection;
- Credit entry from payment selection through the existing customer-credit flow;
- delivery channel configuration for known/custom channels;
- COD courier-pays-merchant path through Cash/Network;
- durable local delivery-channel collection context linked to receipt.

Explicitly later:

- split payment allocations and normalized payment records — MAP-05;
- real integrated Mada/card terminal — dedicated payment integration gate;
- platform electronic settlement/reconciliation — payment/settlement lifecycle;
- self-delivery fee posting into ticket/invoice totals — requires a correct sale-money mutation contract before POS execution;
- production Back Office ↔ POS transport — MAP-11;
- production local database — MAP-06.

`Local Persistence != Sync != LAN/Branch Hub != Fiscal/ZATCA` remains binding.
