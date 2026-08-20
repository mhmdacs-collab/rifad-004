import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { money } from "./domain/money";
import { createPosRuntimeAdapter } from "./runtime/posRuntimeAdapter";

beforeEach(() => window.localStorage.clear());
afterEach(() => window.localStorage.clear());

describe("delivery channel + merchant payment integration", () => {
  it("completes HungerStation COD as cash while preserving HungerStation on the receipt context", async () => {
    const runtime = createPosRuntimeAdapter();
    await runtime.deviceSession.linkWithCredentials({
      commandId: "delivery-device-link",
      email: "owner@rifad.test",
      password: "1234",
    });
    await runtime.employeeSession.unlock({ pin: "1234" });

    let ticket = await runtime.sales.startTicket({ commandId: "delivery-ticket" });
    const product = (await runtime.catalog.search({ query: "قهوة سعودية", categoryId: "all" }))[0]
      ?? (await runtime.catalog.search({ query: "", categoryId: "all" }))[0];
    expect(product).toBeDefined();
    ticket = await runtime.sales.addItem({
      commandId: "delivery-add-item",
      ticketId: ticket.id,
      productId: product!.id,
    });

    const checkout = await runtime.checkout.begin({
      commandId: "delivery-checkout",
      ticketId: ticket.id,
    });
    await runtime.deliveryCollection.setForTicket({
      commandId: "delivery-context",
      ticketId: ticket.id,
      channelId: "delivery-hungerstation",
      channelName: "HungerStation",
      channelKind: "platform",
      merchantCollection: "cash",
    });
    await runtime.checkout.selectPaymentMethod({ checkoutId: checkout.checkoutId, method: "cash" });
    const receipt = await runtime.checkout.completeCashSale({
      commandId: "delivery-cash-sale",
      checkoutId: checkout.checkoutId,
      tendered: money(ticket.total.halalas),
    });

    expect(receipt.paymentMethod).toBe("cash");
    await expect(runtime.deliveryCollection.readForReceipt({ receiptId: receipt.id })).resolves.toMatchObject({
      receiptId: receipt.id,
      ticketId: ticket.id,
      channelId: "delivery-hungerstation",
      channelName: "HungerStation",
      merchantCollection: "cash",
    });

    const reopened = createPosRuntimeAdapter();
    await expect(reopened.deliveryCollection.readForReceipt({ receiptId: receipt.id })).resolves.toMatchObject({
      channelId: "delivery-hungerstation",
      merchantCollection: "cash",
    });
  });
});
