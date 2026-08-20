import { describe, expect, it } from "vitest";
import { createBrowserLocalPersistence } from "./adapters/browserLocalPersistence";
import {
  createDeliveryCollectionAdapter,
  POS_DELIVERY_COLLECTION_NAMESPACE,
} from "./runtime/deliveryCollectionAdapter";

const isolatedPersistence = () => {
  const key = `rifad-delivery-collection-${crypto.randomUUID()}`;
  return { key, persistence: createBrowserLocalPersistence(window.localStorage, key) };
};

describe("Rifad delivery collection capability", () => {
  it("keeps delivery channel separate from Cash/Network and links it durably to the receipt", async () => {
    const { key, persistence } = isolatedPersistence();
    await persistence.bindDevice({ branchId: "branch-olaya", deviceId: "device-pos-01" });
    const delivery = createDeliveryCollectionAdapter(persistence);

    const first = await delivery.setForTicket({
      commandId: "delivery-set-001",
      ticketId: "ticket-001",
      channelId: "delivery-hungerstation",
      channelName: "HungerStation",
      channelKind: "platform",
      merchantCollection: "cash",
    });

    expect(first).toMatchObject({
      ticketId: "ticket-001",
      receiptId: null,
      channelId: "delivery-hungerstation",
      channelName: "HungerStation",
      paymentMode: "cash-on-delivery",
      settlement: "courier-pays-merchant",
      merchantCollection: "cash",
    });

    const switched = await delivery.setForTicket({
      commandId: "delivery-switch-001",
      ticketId: "ticket-001",
      channelId: "delivery-hungerstation",
      channelName: "HungerStation",
      channelKind: "platform",
      merchantCollection: "card",
    });
    expect(switched).toMatchObject({ channelId: "delivery-hungerstation", merchantCollection: "card" });

    const attached = await delivery.attachReceipt({
      commandId: "delivery-receipt-001",
      ticketId: "ticket-001",
      receiptId: "receipt-001",
    });
    expect(attached).toMatchObject({
      ticketId: "ticket-001",
      receiptId: "receipt-001",
      channelId: "delivery-hungerstation",
      merchantCollection: "card",
    });

    const reopened = createDeliveryCollectionAdapter(createBrowserLocalPersistence(window.localStorage, key));
    await expect(reopened.readForTicket({ ticketId: "ticket-001" })).resolves.toEqual(attached);
    await expect(reopened.readForReceipt({ receiptId: "receipt-001" })).resolves.toEqual(attached);

    const stored = await createBrowserLocalPersistence(window.localStorage, key).readSnapshot(POS_DELIVERY_COLLECTION_NAMESPACE);
    expect(stored?.revision).toBeGreaterThanOrEqual(3);
    const outbox = await createBrowserLocalPersistence(window.localStorage, key).listPendingOutbox();
    expect(outbox.map((event) => event.type)).toEqual(expect.arrayContaining([
      "delivery.collection-set.v1",
      "delivery.collection-receipt-attached.v1",
    ]));

    await reopened.clearForTicket({ commandId: "delivery-clear-001", ticketId: "ticket-001" });
    await expect(reopened.readForTicket({ ticketId: "ticket-001" })).resolves.toBeNull();
  });
});
