# Delivery Platform Integration Benchmark

Date: 2026-08-17
Status: Research evidence for Rifad product/architecture discussion. This is not implementation authorization and does not claim commercial access to any platform.

## Questions

1. Can Rifad integrate directly with delivery platforms through APIs?
2. What should happen when a delivery order arrives automatically versus when a cashier enters one manually?
3. How do restaurant POS products reduce delivery-platform work for cashiers?
4. Should Rifad build one integration per platform, use an aggregator, or support both?

## Official platform API evidence

### HungerStation

Official developer documentation currently exposes a Partner API with catalog, order, promotion and reporting/reconciliation capabilities:

- https://developer.hungerstation.com/api-specifications
- https://developer.hungerstation.com/en/documentation/catalog-api-how-to-integrate

Relevant observed capabilities:

- OAuth/client-credential access;
- API keys/chain identity obtained through HungerStation account management / Partner Portal;
- catalog/product updates including price/status/quantity;
- order webhooks and order-detail retrieval;
- order status updates, cancellation/item changes where supported;
- POS integration explicitly named as a use case;
- order history/reconciliation data.

Important boundary: having public documentation does not mean every Rifad customer automatically has production API access. Partner/account approval and credentials remain a commercial onboarding requirement.

### Keeta

Keeta currently publishes broad developer APIs:

- Order API: https://api-docs.mykeeta.com/apis/standard/order
- Order integration guide: https://api-docs.mykeeta.com/apis/standard/docs/orderintegrationguide
- Menu API: https://api-docs.mykeeta.com/apis/standard/menu/openitemcode-based/menusync
- Menu guide: https://api-docs.mykeeta.com/apis/standard/docs/menuintegrationguide
- Store/webhook guides: https://api-docs.mykeeta.com/apis/standard/docs/webhook
- Open Delivery API: https://api-docs.mykeeta.com/apis/opendelivery/section

Relevant observed capabilities:

- merchant/software authorization and access tokens;
- order placement/status/cancellation/refund/delivery webhooks;
- order accept/confirm/prepare/cancel/refund operations;
- merchant self-delivery status operations;
- menu synchronization and product availability updates;
- stable third-party `openItemCode` mapping for products/options;
- delivery, pickup and dine-in price fields in menu entities;
- store operational-status management;
- settlement/fee detail in order data, with an explicit warning that some settlement components may arrive later and must not block order processing.

This strongly supports a Rifad adapter that treats order intake and later financial reconciliation as related but asynchronous capabilities.

### Jahez

Official/current evidence includes:

- Jahez Integration Developer Portal: https://integration-portal.jahez.net/
- Foodics' official Jahez integration guide: https://help.foodics.com/hc/en-us/articles/7530462943132-Jahez

Foodics' integration flow shows Jahez API integration, authorization to Foodics, branch mapping through an integration branch ID, menu sync and direct order delivery into Foodics Cashier.

Rifad should therefore treat Jahez as an integration-capable platform, but should not claim a production Jahez adapter until the actual partner specification, credentials, certification/onboarding and test environment available to Rifad are verified.

### Ninja and other platforms

No sufficiently authoritative public Ninja restaurant integration specification was found in this research pass.

Rifad must not infer that an undocumented/publicly unavailable API is impossible; many platform APIs are partner-only. The correct status is **commercial/technical access unverified** until Rifad obtains official partner documentation or an approved aggregator connection.

## How Foodics reduces cashier complexity

Official Foodics evidence inspected:

- Marketplace: https://www.foodics.com/marketplace/
- Receiving online orders: https://help.foodics.com/hc/en-us/articles/8225883704860-Receiving-Online-Orders-in-the-Branch
- Online-order configuration: https://help.foodics.com/hc/en-us/articles/6950759790492-Enabling-the-Settings-of-Receiving-Online-Orders-for-a-Branch-a-Cashier-Device
- Keeta integration: https://help.foodics.com/hc/en-us/articles/22368119899676-Keeta
- Jahez integration: https://help.foodics.com/hc/en-us/articles/7530462943132-Jahez
- Online payment mapping: https://help.foodics.com/hc/ar/articles/22798412416412-

Observed product pattern:

1. Online/API orders arrive in the POS rather than being retyped by the cashier.
2. A branch can nominate the cashier device responsible for online orders.
3. The business may enable **auto accept and send online orders to kitchen**.
4. Foodics distinguishes prepaid online payment from payment that is merely expected at delivery/pickup.
5. Foodics explicitly recommends leaving cash/card-on-delivery mappings unbound to a paid POS method so those orders do not appear paid before money is actually collected.
6. The cashier can therefore receive an order already carrying its source/payment state and does not need to recreate the channel choice manually.

This is a strong Rifad UX lesson: platform identity belongs on the incoming order, not as a repeated cashier question.

## Direct integrations versus aggregator hubs

Foodics supports both direct platform integrations and aggregator/order-management apps. Its Marketplace includes integrations such as Jahez and Keeta as well as ordering-platform managers such as FeedUs, Blend, Foodizone, Grubtech and UrbanPiper.

Official examples:

- FeedUs + Foodics: https://www.foodics.com/portfolio/feedus/
- Foodizone + Foodics: https://www.foodics.com/portfolio/foodizone/
- UrbanPiper: https://www.urbanpiper.com/en-sa
- Deliverect POS integration model: https://help.deliverect.com/en/articles/14998373-primary-pos-integration-overview
- Grubtech integrations: https://grubtech.com/ar/integrations

Common aggregator pattern:

- many delivery platforms -> one normalized order feed -> POS;
- one menu/catalog source -> many delivery platforms;
- availability/stock updates synchronized outward;
- order status synchronized back to the platform;
- one operational queue/device instead of one tablet per delivery app;
- channel-specific reporting/reconciliation.

## Rifad architecture conclusion

Rifad should support **both** integration modes behind Rifad-owned contracts:

### A. Direct platform adapter

Examples when commercially/technically available:

- `KeetaDeliveryAdapter`
- `HungerStationDeliveryAdapter`
- future `JahezDeliveryAdapter`

Direct integration can reduce dependency/cost and expose the richest platform-specific capabilities.

### B. Aggregator adapter

Examples of possible future partners/capability donors:

- Deliverect;
- UrbanPiper;
- Grubtech;
- another approved regional aggregator.

An aggregator can provide fast coverage of platforms whose direct API is unavailable, commercially difficult or expensive to certify individually.

Rifad should not make either mode the public product contract. Both should implement a capability-based Rifad integration boundary.

## Capability-based adapter contract direction

A delivery-channel adapter should declare capabilities instead of pretending every platform supports the same operations.

Potential capability groups:

- authorization / merchant connection;
- store/branch mapping;
- menu publish/sync;
- channel price publish;
- product availability/stock publish;
- incoming-order webhook/polling;
- accept/reject order;
- preparation/ready status;
- dispatch/delivery status when applicable;
- cancellation/refund operations;
- order/payment detail retrieval;
- settlement/reconciliation retrieval.

A platform may support only a subset. Rifad UI/business logic must query capabilities rather than contain `if platform == X` behavior everywhere.

## Normalized Rifad order boundary

External platform data should normalize into Rifad-owned concepts while preserving raw external references needed for reconciliation:

- `salesChannelId`;
- external merchant/store ID;
- external order ID/code;
- `fulfillmentMode = delivery` or pickup where applicable;
- authoritative external item/option mapping;
- product/customer-facing price snapshot;
- external discount/fee snapshot;
- payment collection state;
- external payment/reference facts when supplied;
- order lifecycle/status;
- kitchen/preparation state;
- settlement state and later settlement components;
- source webhook/event ID and idempotency evidence.

Never recreate a prepaid external order as a second local sale merely to make it visible in the POS.

## Recommended cashier experience

### Connected/API order

Preferred path:

`platform order arrives -> Rifad online-order queue -> accept automatically or one-tap accept -> kitchen -> ready/complete`

The order card should visibly identify the channel, for example:

- `كيتا · مدفوع`;
- `هنقرستيشن · نقد عند الاستلام`;
- `جاهز · مدفوع`.

If business settings allow auto-accept, the cashier should not need to touch the order at all before kitchen routing.

### Prepaid platform order

The external order already carries the collection state. The cashier does **not** choose cash/Mada again.

Internally the sale is recorded once, with platform collection/receivable/settlement semantics handled separately from till/card receipts.

### Cash/card on delivery or pickup

The order must remain unpaid until money is actually collected. Rifad must not map a future collection promise to a completed payment record.

### Manual/fallback platform entry

A visible `كيتا / هنقرستيشن / ...` choice remains useful when:

- the platform is not API-connected;
- integration is temporarily unavailable and policy allows manual fallback;
- staff are recording a platform order that arrived outside the normal connector path.

In this case the platform choice may behave like a cashier-facing payment/completion tile for speed, while internally setting channel + delivery fulfillment + pricing context + collection state separately.

## Pricing consequence

There are two different pricing cases:

### API-connected external order

The incoming order contains the prices actually sold to the customer. Rifad should preserve those external price snapshots and validate/match products; it must not silently overwrite the order with today's direct-POS base prices.

### Cashier-created/manual platform order

Selecting the platform applies Rifad's configured channel pricelist/overrides. If the total changes, the cashier must see the recalculated total before completion.

## Kitchen consequence

Kitchen output should use one normalized format regardless of connector:

- **توصيل** as fulfillment;
- channel identity such as **كيتا / هنقرستيشن / جاهز**;
- order number/code needed for rider handoff;
- paid/unpaid state only when operationally useful and safe;
- preparation deltas/revisions and idempotency to prevent duplicate kitchen work.

## Product recommendation

Rifad should aim for this simplicity:

> **One online-orders experience for the cashier, many adapters behind it.**

Do not create a separate cashier workflow for every platform.

The Back Office should eventually own platform connection, credentials/authorization, branch mapping, menu/channel pricing, automation policy and reconciliation configuration. Temporary POS-side settings are acceptable only while the UI-first product is being proven.

## Implementation boundary

Before production code is authorized:

1. define the Rifad delivery-channel capability contract;
2. define normalized external-order/payment/settlement records;
3. add webhook idempotency/retry rules and offline/LAN behavior;
4. decide which first adapter is practical with actual partner credentials/test access;
5. authorize a bounded manifest flow for incoming online orders and manual fallback;
6. verify fiscal/accounting handling separately before claiming production compliance.
