import { describe, expect, it } from "vitest";
import { createMockPosRuntime } from "./adapters/mockPos";
import { money } from "./domain/money";
import type { CustomerDetails } from "./domain/models";
import { createLegacySnapshotBridge } from "./runtime/legacySnapshotBridge";
import { createLocalPersistenceAdapter } from "./runtime/localPersistenceAdapter";
import {
  createPosRuntimeAdapter,
  LEGACY_POS_RUNTIME_STORAGE_KEY,
  POS_RUNTIME_SNAPSHOT_NAMESPACE,
  POS_RUNTIME_SNAPSHOT_SCHEMA_VERSION,
} from "./runtime/posRuntimeAdapter";
import {
  createRestaurantServiceAdapter,
  LEGACY_RESTAURANT_SERVICE_STORAGE_KEY,
  RESTAURANT_SERVICE_SNAPSHOT_NAMESPACE,
  RESTAURANT_SERVICE_SNAPSHOT_SCHEMA_VERSION,
} from "./runtime/restaurantServiceAdapter";

const CUSTOMER_DETAILS: CustomerDetails = {
  email: "restart@example.com",
  address: "",
  city: "الرياض",
  region: "الرياض",
  postalCode: "",
  country: "السعودية",
  customerCode: "RESTART-001",
  taxNumber: "",
  note: "اختبار استعادة محلية",
};

const linkAndUnlock = async () => {
  const runtime = createPosRuntimeAdapter();
  await runtime.deviceSession.linkWithCredentials({
    commandId: "restart-device-link",
    email: "owner@rifad.test",
    password: "1234",
  });
  await runtime.employeeSession.unlock({ pin: "1234" });
  return runtime;
};

describe("local-first cold restart persistence", () => {
  it("imports an existing legacy POS snapshot into the Rifad namespace before retiring the old key", async () => {
    const legacy = createMockPosRuntime();
    await legacy.deviceSession.linkWithCredentials({
      commandId: "legacy-device",
      email: "legacy@rifad.test",
      password: "1234",
    });
    await legacy.employeeSession.unlock({ pin: "1234" });
    let legacyTicket = await legacy.sales.startTicket({ commandId: "legacy-ticket" });
    legacyTicket = await legacy.sales.addItem({
      commandId: "legacy-add",
      ticketId: legacyTicket.id,
      productId: "p-002",
    });

    const persistence = createLocalPersistenceAdapter();
    expect(await persistence.readSnapshot(POS_RUNTIME_SNAPSHOT_NAMESPACE)).toBeNull();

    const bridge = createLegacySnapshotBridge({
      persistence,
      namespace: POS_RUNTIME_SNAPSHOT_NAMESPACE,
      schemaVersion: POS_RUNTIME_SNAPSHOT_SCHEMA_VERSION,
      legacyStorageKey: LEGACY_POS_RUNTIME_STORAGE_KEY,
    });
    await bridge.ready;

    const imported = await persistence.readSnapshot<unknown>(POS_RUNTIME_SNAPSHOT_NAMESPACE);
    expect(imported?.schemaVersion).toBe(POS_RUNTIME_SNAPSHOT_SCHEMA_VERSION);
    expect(imported?.revision).toBe(1);

    window.localStorage.removeItem(LEGACY_POS_RUNTIME_STORAGE_KEY);
    const reopened = createPosRuntimeAdapter();
    const restored = reopened.restore();
    expect(restored.ticket?.id).toBe(legacyTicket.id);
    expect(restored.ticket?.lines[0]?.productId).toBe("p-002");
  });

  it("restores the working sale, customer and completed receipt from the Rifad POS namespace", async () => {
    const first = await linkAndUnlock();
    let ticket = await first.sales.startTicket({ commandId: "restart-ticket" });
    const product = (await first.catalog.search({ query: "لاتيه", categoryId: "all" }))[0];
    expect(product).toBeDefined();

    ticket = await first.sales.addItem({
      commandId: "restart-add-item",
      ticketId: ticket.id,
      productId: product!.id,
    });
    const customer = await first.customerCredit.create({
      commandId: "restart-customer",
      name: "عميل الاستعادة",
      mobile: "0501234568",
      details: CUSTOMER_DETAILS,
    });
    ticket = await first.sales.setCustomer({
      commandId: "restart-set-customer",
      ticketId: ticket.id,
      customerId: customer.id,
    });

    const persistence = createLocalPersistenceAdapter();
    const firstSnapshot = await persistence.readSnapshot<unknown>(POS_RUNTIME_SNAPSHOT_NAMESPACE);
    expect(firstSnapshot?.schemaVersion).toBe(POS_RUNTIME_SNAPSHOT_SCHEMA_VERSION);
    expect(firstSnapshot?.revision).toBeGreaterThan(0);

    // Simulate retiring/losing the old mock key. The Rifad namespace must now
    // be sufficient to hydrate a fresh runtime instance.
    window.localStorage.removeItem(LEGACY_POS_RUNTIME_STORAGE_KEY);
    const second = createPosRuntimeAdapter();
    const restored = second.restore();

    expect(restored.device?.branchId).toBe("branch-olaya");
    expect(restored.employee?.employeeId).toBe("employee-001");
    expect(restored.ticket?.id).toBe(ticket.id);
    expect(restored.ticket?.lines).toHaveLength(1);
    expect(restored.ticket?.customer?.id).toBe(customer.id);

    const restoredCustomers = await second.customerCredit.search({ query: "0501234568" });
    expect(restoredCustomers.some((item) => item.id === customer.id)).toBe(true);

    const checkout = await second.checkout.begin({
      commandId: "restart-checkout",
      ticketId: restored.ticket!.id,
    });
    await second.checkout.selectPaymentMethod({ checkoutId: checkout.checkoutId, method: "cash" });
    const receipt = await second.checkout.completeCashSale({
      commandId: "restart-cash-sale",
      checkoutId: checkout.checkoutId,
      tendered: money(restored.ticket!.total.halalas),
    });

    window.localStorage.removeItem(LEGACY_POS_RUNTIME_STORAGE_KEY);
    const third = createPosRuntimeAdapter();
    const restoredAfterPayment = third.restore();
    const receipts = await third.receipts.list();

    expect(restoredAfterPayment.ticket).toBeNull();
    expect(restoredAfterPayment.receipt?.id).toBe(receipt.id);
    expect(receipts.some((item) => item.id === receipt.id)).toBe(true);
    expect(receipt.customer?.id).toBe(customer.id);
  });

  it("restores a reserved restaurant place and its open local order from the Rifad restaurant namespace", async () => {
    const pos = await linkAndUnlock();
    let ticket = await pos.sales.startTicket({ commandId: "restaurant-restart-ticket" });
    const product = (await pos.catalog.search({ query: "قهوة سعودية", categoryId: "all" }))[0];
    expect(product).toBeDefined();
    ticket = await pos.sales.addItem({
      commandId: "restaurant-restart-add",
      ticketId: ticket.id,
      productId: product!.id,
    });

    const firstService = createRestaurantServiceAdapter();
    const order = await firstService.createOpenOrder({
      commandId: "restaurant-restart-open",
      ticket,
      servicePlaceId: "table-01",
    });

    const persistence = createLocalPersistenceAdapter();
    const snapshot = await persistence.readSnapshot<unknown>(RESTAURANT_SERVICE_SNAPSHOT_NAMESPACE);
    expect(snapshot?.schemaVersion).toBe(RESTAURANT_SERVICE_SNAPSHOT_SCHEMA_VERSION);
    expect(snapshot?.revision).toBeGreaterThan(0);

    window.localStorage.removeItem(LEGACY_RESTAURANT_SERVICE_STORAGE_KEY);
    const secondService = createRestaurantServiceAdapter();
    const restoredOrders = await secondService.listOpenOrders();
    const restoredOrder = restoredOrders.find((item) => item.id === order.id);

    expect(restoredOrder).toBeDefined();
    expect(restoredOrder?.servicePlaceId).toBe("table-01");
    expect(restoredOrder?.servicePlaceName).toBe("طاولة 1");
    expect(restoredOrder?.ticket.lines).toHaveLength(1);
    expect(restoredOrder?.kitchenRevision).toBe(1);
  });
});
