import { afterEach, describe, expect, it } from "vitest";
import { BROWSER_LOCAL_PERSISTENCE_KEY, createBrowserLocalPersistence } from "./adapters/browserLocalPersistence";
import { MOCK_POS_STORAGE_KEY } from "./adapters/mockPos";
import { createPosRuntimeAdapter } from "./runtime/posRuntimeAdapter";

afterEach(() => {
  window.localStorage.removeItem(BROWSER_LOCAL_PERSISTENCE_KEY);
  window.localStorage.removeItem(MOCK_POS_STORAGE_KEY);
});

describe("MAP-01 restored device effective configuration", () => {
  it("repairs LocalPersistence binding on restart so default Cash/Network/Credit remain available", async () => {
    const firstRuntime = createPosRuntimeAdapter();
    await firstRuntime.deviceSession.linkWithCredentials({
      commandId: "device-link-regression",
      email: "cashier@rifad.test",
      password: "1234",
    });

    expect(firstRuntime.restore().device).toMatchObject({
      deviceId: "device-pos-01",
      branchId: "branch-olaya",
    });

    // Reproduce a real upgrade/restart case: the legacy POS device survives,
    // while the newer MAP-01 LocalPersistence root is absent.
    window.localStorage.removeItem(BROWSER_LOCAL_PERSISTENCE_KEY);

    const restartedRuntime = createPosRuntimeAdapter();
    const effective = await restartedRuntime.effectiveConfiguration.read();

    expect(effective.paymentMethods.map((method) => [method.id, method.kind, method.enabled, method.directImpact])).toEqual([
      ["payment-cash", "cash", true, "cash"],
      ["payment-mada-mock", "card", true, "bank"],
      ["payment-credit", "customer-credit", true, "customer-receivable"],
    ]);

    const persistence = createBrowserLocalPersistence();
    await expect(persistence.getNodeContext()).resolves.toMatchObject({
      deviceId: "device-pos-01",
      branchId: "branch-olaya",
    });
  });
});
