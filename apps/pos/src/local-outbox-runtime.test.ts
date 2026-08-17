import { afterEach, describe, expect, it } from "vitest";
import { BROWSER_LOCAL_PERSISTENCE_KEY, BrowserLocalPersistence } from "./adapters/browserLocalPersistence";
import { RESTAURANT_SERVICE_STORAGE_KEY } from "./adapters/mockRestaurantService";
import { createPosRuntimeAdapter } from "./runtime/posRuntimeAdapter";
import { createRestaurantServiceAdapter } from "./runtime/restaurantServiceAdapter";

const POS_STORAGE_KEY = "rifad.pos.mock.v1";

afterEach(() => {
  window.localStorage.removeItem(POS_STORAGE_KEY);
  window.localStorage.removeItem(RESTAURANT_SERVICE_STORAGE_KEY);
  window.localStorage.removeItem(BROWSER_LOCAL_PERSISTENCE_KEY);
});

const linkAndUnlock = async () => {
  const runtime = createPosRuntimeAdapter();
  await runtime.deviceSession.linkWithCredentials({
    commandId: "link-device-1",
    email: "cashier@example.com",
    password: "1234",
  });
  await runtime.employeeSession.unlock({ pin: "1234" });
  return runtime;
};

describe("local outbox runtime journal", () => {
  it("records one branch-scoped sale event even when the completion command is replayed", async () => {
    const runtime = await linkAndUnlock();
    const product = (await runtime.catalog.search({ query: "", categoryId: "all" }))[0]!;
    const ticket = await runtime.sales.startTicket({ commandId: "ticket-1" });
    const populated = await runtime.sales.addItem({
      commandId: "add-1",
      ticketId: ticket.id,
      productId: product.id,
    });
    const checkout = await runtime.checkout.begin({ commandId: "checkout-1", ticketId: populated.id });
    await runtime.checkout.selectPaymentMethod({ checkoutId: checkout.checkoutId, method: "cash" });

    const input = {
      commandId: "cash-complete-1",
      checkoutId: checkout.checkoutId,
      tendered: populated.total,
    };
    const first = await runtime.checkout.completeCashSale(input);
    const duplicate = await runtime.checkout.completeCashSale(input);

    expect(duplicate.id).toBe(first.id);

    const outbox = await new BrowserLocalPersistence().listPendingOutbox({ limit: 100 });
    const saleEvents = outbox.filter((item) => item.id === "sale.completed:cash-complete-1");

    expect(saleEvents).toHaveLength(1);
    expect(saleEvents[0]).toMatchObject({
      type: "sale.completed.v1",
      aggregateType: "receipt",
      aggregateId: first.id,
      branchId: "branch-olaya",
      deviceId: "device-pos-01",
    });
    expect(saleEvents[0]?.payload).toMatchObject({
      collection: "cash",
      employeeId: "employee-001",
      receipt: { id: first.id, number: first.number },
    });
  });

  it("records local-order lifecycle events on the same branch/device node identity", async () => {
    const runtime = await linkAndUnlock();
    const product = (await runtime.catalog.search({ query: "", categoryId: "all" }))[0]!;
    const ticket = await runtime.sales.startTicket({ commandId: "ticket-local-1" });
    const populated = await runtime.sales.addItem({
      commandId: "add-local-1",
      ticketId: ticket.id,
      productId: product.id,
    });

    const restaurant = createRestaurantServiceAdapter();
    const groups = await restaurant.listPlaceGroups();
    const servicePlaceId = groups[0]!.places[0]!.id;
    const opened = await restaurant.createOpenOrder({
      commandId: "local-open-1",
      ticket: populated,
      servicePlaceId,
    });
    await restaurant.closeOpenOrder({ openOrderId: opened.id });

    const outbox = await new BrowserLocalPersistence().listPendingOutbox({ limit: 100 });
    const openedEvent = outbox.find((item) => item.id === "local-order.opened:local-open-1");
    const closedEvent = outbox.find((item) => item.id === `local-order.closed:${opened.id}`);

    expect(openedEvent).toMatchObject({
      type: "local-order.opened.v1",
      branchId: "branch-olaya",
      deviceId: "device-pos-01",
    });
    expect(closedEvent).toMatchObject({
      type: "local-order.closed.v1",
      branchId: "branch-olaya",
      deviceId: "device-pos-01",
    });
  });
});
