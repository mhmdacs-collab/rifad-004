import { describe, expect, it } from "vitest";
import { createBrowserLocalPersistence } from "./adapters/browserLocalPersistence";
import {
  createAuthorizationAdapter,
  createEffectivePosConfigurationAdapter,
  createManagerOverrideAdapter,
  PosConfigurationError,
  POS_AUTHORIZATION_AUDIT_NAMESPACE,
  POS_EFFECTIVE_CONFIGURATION_NAMESPACE,
} from "./runtime/effectivePosConfigurationAdapter";

const isolatedPersistence = () => {
  const key = `rifad-map01-test-${crypto.randomUUID()}`;
  return {
    key,
    persistence: createBrowserLocalPersistence(window.localStorage, key),
  };
};

describe("MAP-01 effective POS configuration + authorization", () => {
  it("requires branch/device binding and then persists a versioned effective configuration across adapter restart", async () => {
    const { key, persistence } = isolatedPersistence();
    const configuration = createEffectivePosConfigurationAdapter(persistence);

    await expect(configuration.read()).rejects.toMatchObject({
      code: "POS_CONFIGURATION_DEVICE_UNBOUND",
    } satisfies Partial<PosConfigurationError>);

    await persistence.bindDevice({ branchId: "branch-olaya", deviceId: "device-pos-01" });
    const first = await configuration.read();
    expect(first.branchId).toBe("branch-olaya");
    expect(first.deviceId).toBe("device-pos-01");
    expect(first.revision).toBe(1);
    expect(first.paymentMethods.filter((item) => item.enabled).map((item) => item.kind)).toEqual(["cash", "card"]);

    const stored = await persistence.readSnapshot(POS_EFFECTIVE_CONFIGURATION_NAMESPACE);
    expect(stored?.revision).toBe(1);

    const reopenedPersistence = createBrowserLocalPersistence(window.localStorage, key);
    const reopened = createEffectivePosConfigurationAdapter(reopenedPersistence);
    const second = await reopened.read();
    expect(second).toEqual(first);
  });

  it("authorizes by concrete permission and branch scope rather than role display name", async () => {
    const { persistence } = isolatedPersistence();
    await persistence.bindDevice({ branchId: "branch-olaya", deviceId: "device-pos-01" });
    const configuration = createEffectivePosConfigurationAdapter(persistence);
    const authorization = createAuthorizationAdapter(configuration);

    await expect(authorization.evaluate({
      employeeId: "employee-001",
      capability: "accept-payment",
      branchId: "branch-olaya",
    })).resolves.toMatchObject({ allowed: true, denyReason: null });

    await expect(authorization.evaluate({
      employeeId: "employee-001",
      capability: "reprint-resend-receipts",
      branchId: "branch-olaya",
    })).resolves.toMatchObject({ allowed: false, denyReason: "permission-missing" });

    await expect(authorization.evaluate({
      employeeId: "employee-manager-001",
      capability: "reprint-resend-receipts",
      branchId: "branch-olaya",
    })).resolves.toMatchObject({ allowed: true, denyReason: null });

    await expect(authorization.evaluate({
      employeeId: "employee-manager-001",
      capability: "reprint-resend-receipts",
      branchId: "branch-other",
    })).resolves.toMatchObject({ allowed: false, denyReason: "branch-out-of-scope" });
  });

  it("records one-action manager approval durably without elevating the cashier or leaking the PIN", async () => {
    const { key, persistence } = isolatedPersistence();
    await persistence.bindDevice({ branchId: "branch-olaya", deviceId: "device-pos-01" });
    const configuration = createEffectivePosConfigurationAdapter(persistence);
    const authorization = createAuthorizationAdapter(configuration);
    const override = createManagerOverrideAdapter(configuration, authorization, persistence);

    await expect(override.approveOnce({
      actorEmployeeId: "employee-001",
      approverPin: "1234",
      capability: "reprint-resend-receipts",
      branchId: "branch-olaya",
      commandId: "reprint-r-00001",
      targetType: "receipt",
      targetId: "receipt-001",
    })).rejects.toMatchObject({ code: "OVERRIDE_NOT_AUTHORIZED" });

    const first = await override.approveOnce({
      actorEmployeeId: "employee-001",
      approverPin: "4321",
      capability: "reprint-resend-receipts",
      branchId: "branch-olaya",
      commandId: "reprint-r-00001",
      targetType: "receipt",
      targetId: "receipt-001",
    });
    expect(first.actorEmployeeId).toBe("employee-001");
    expect(first.approverEmployeeId).toBe("employee-manager-001");
    expect(first.capability).toBe("reprint-resend-receipts");
    expect(JSON.stringify(first)).not.toContain("4321");

    const reopenedPersistence = createBrowserLocalPersistence(window.localStorage, key);
    const reopenedConfiguration = createEffectivePosConfigurationAdapter(reopenedPersistence);
    const reopenedAuthorization = createAuthorizationAdapter(reopenedConfiguration);
    const reopenedOverride = createManagerOverrideAdapter(reopenedConfiguration, reopenedAuthorization, reopenedPersistence);
    const duplicate = await reopenedOverride.approveOnce({
      actorEmployeeId: "employee-001",
      approverPin: "4321",
      capability: "reprint-resend-receipts",
      branchId: "branch-olaya",
      commandId: "reprint-r-00001",
      targetType: "receipt",
      targetId: "receipt-001",
    });
    expect(duplicate).toEqual(first);

    const audit = await reopenedPersistence.readSnapshot<{ approvals: readonly unknown[] }>(POS_AUTHORIZATION_AUDIT_NAMESPACE);
    expect(audit?.value.approvals).toHaveLength(1);
    const outbox = await reopenedPersistence.listPendingOutbox();
    const approvals = outbox.filter((event) => event.type === "authorization.manager-override-approved.v1");
    expect(approvals).toHaveLength(1);
    expect(JSON.stringify(approvals[0])).not.toContain("4321");
  });
});
