import { afterEach, describe, expect, it } from "vitest";
import {
  BROWSER_LOCAL_PERSISTENCE_KEY,
  BrowserLocalPersistence,
  LocalPersistenceError,
} from "./adapters/browserLocalPersistence";

const event = (id: string) => ({
  id,
  type: "sale.completed.v1",
  aggregateType: "receipt",
  aggregateId: "receipt-1",
  occurredAt: "2026-08-18T00:00:00.000Z",
  payload: { totalHalalas: 2200 },
});

afterEach(() => {
  window.localStorage.removeItem(BROWSER_LOCAL_PERSISTENCE_KEY);
});

describe("Rifad local persistence boundary", () => {
  it("keeps one stable installation identity and binds branch/device separately", async () => {
    const first = new BrowserLocalPersistence();
    const initial = await first.getNodeContext();

    expect(initial.installationId).toMatch(/^installation-/);
    expect(initial.branchId).toBeNull();
    expect(initial.deviceId).toBeNull();

    const bound = await first.bindDevice({ branchId: "branch-olaya", deviceId: "device-pos-01" });
    const reopened = await new BrowserLocalPersistence().getNodeContext();

    expect(bound.installationId).toBe(initial.installationId);
    expect(reopened).toEqual(bound);
  });

  it("commits a module snapshot and its outbox event in the same local root", async () => {
    const persistence = new BrowserLocalPersistence();
    await persistence.bindDevice({ branchId: "branch-olaya", deviceId: "device-pos-01" });

    const committed = await persistence.commitSnapshot({
      namespace: "sales",
      schemaVersion: 1,
      value: { lastReceiptId: "receipt-1" },
      events: [event("sale.completed:command-1")],
    });

    expect(committed.revision).toBe(1);
    expect((await persistence.readSnapshot<{ lastReceiptId: string }>("sales"))?.value.lastReceiptId).toBe("receipt-1");

    const outbox = await persistence.listPendingOutbox();
    expect(outbox).toHaveLength(1);
    expect(outbox[0]).toMatchObject({
      id: "sale.completed:command-1",
      type: "sale.completed.v1",
      branchId: "branch-olaya",
      deviceId: "device-pos-01",
      attempts: 0,
    });
    expect(outbox[0]?.installationId).toMatch(/^installation-/);
  });

  it("deduplicates stable event ids and supports retry bookkeeping plus acknowledgement", async () => {
    const persistence = new BrowserLocalPersistence();
    const duplicate = event("sale.completed:command-1");

    await persistence.appendEvents([duplicate, duplicate]);
    expect(await persistence.listPendingOutbox()).toHaveLength(1);

    await persistence.recordOutboxFailure({ ids: [duplicate.id], error: "network unavailable" });
    expect((await persistence.listPendingOutbox())[0]).toMatchObject({
      attempts: 1,
      lastError: "network unavailable",
    });

    await persistence.acknowledgeOutbox({ ids: [duplicate.id] });
    expect(await persistence.listPendingOutbox()).toHaveLength(0);
  });

  it("fails closed instead of silently discarding a corrupt local root", async () => {
    window.localStorage.setItem(BROWSER_LOCAL_PERSISTENCE_KEY, "{not-json");
    const persistence = new BrowserLocalPersistence();

    await expect(persistence.getNodeContext()).rejects.toMatchObject<Partial<LocalPersistenceError>>({
      code: "LOCAL_STORE_READ_FAILED",
    });
  });
});
