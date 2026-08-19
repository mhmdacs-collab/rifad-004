import { describe, expect, it } from "vitest";
import { createBrowserPosConfigurationAdmin } from "../../../adapters/posConfiguration/browserPosConfigurationAdmin";
import { projectEffectivePosConfiguration } from "../../../core/posConfiguration/projectEffectivePosConfiguration";
import { createBrowserLocalPersistence } from "./adapters/browserLocalPersistence";
import {
  createAuthorizationAdapter,
  createEffectivePosConfigurationAdapter,
  createManagerOverrideAdapter,
  POS_EFFECTIVE_CONFIGURATION_NAMESPACE,
  POS_EFFECTIVE_CONFIGURATION_SCHEMA_VERSION,
} from "./runtime/effectivePosConfigurationAdapter";

describe("MAP-01 owner policy → effective local POS enforcement", () => {
  it("projects restrictive merchant policy, survives restart, denies locally and permits one manager-approved action only", async () => {
    const adminKey = `rifad-map01-owner-${crypto.randomUUID()}`;
    const posKey = `rifad-map01-pos-${crypto.randomUUID()}`;
    const admin = createBrowserPosConfigurationAdmin(window.localStorage, adminKey);

    await admin.saveRole({
      commandId: "restrict-cashier-role",
      role: {
        id: "role-cashier",
        name: "أمين صندوق",
        permissions: ["accept-payment", "view-all-receipts"],
      },
    });
    await admin.saveEmployee({
      commandId: "configure-cashier",
      employee: {
        id: "employee-001",
        name: "محمد العتيبي",
        email: "cashier@example.com",
        phone: "",
        roleId: "role-cashier",
        storeIds: ["store-main"],
        active: true,
      },
    });
    await admin.setEmployeePin({ commandId: "cashier-pin", employeeId: "employee-001", pin: "1234" });
    await admin.saveEmployee({
      commandId: "configure-manager",
      employee: {
        id: "employee-manager-001",
        name: "مدير الفرع",
        email: "manager@example.com",
        phone: "",
        roleId: "role-manager",
        storeIds: ["store-main"],
        active: true,
      },
    });
    await admin.setEmployeePin({ commandId: "manager-pin", employeeId: "employee-manager-001", pin: "4321" });
    await admin.reorderPaymentTypes({
      commandId: "merchant-payment-order",
      orderedIds: ["payment-card", "payment-cash"],
    });

    const merchantPolicy = await admin.read();
    const projected = projectEffectivePosConfiguration({
      source: merchantPolicy,
      branchId: "store-main",
      deviceId: "pos-main",
    });

    expect(projected.revision).toBe(merchantPolicy.revision);
    expect(projected.paymentMethods.map((method) => method.id)).toEqual(["payment-card", "payment-cash"]);
    expect(projected.roles.flatMap((role) => role.permissions)).not.toContain("access-back-office");

    const persistence = createBrowserLocalPersistence(window.localStorage, posKey);
    await persistence.bindDevice({ branchId: "store-main", deviceId: "pos-main" });
    await persistence.commitSnapshot({
      namespace: POS_EFFECTIVE_CONFIGURATION_NAMESPACE,
      schemaVersion: POS_EFFECTIVE_CONFIGURATION_SCHEMA_VERSION,
      value: projected,
    });

    const configuration = createEffectivePosConfigurationAdapter(persistence);
    const authorization = createAuthorizationAdapter(configuration);
    const managerOverride = createManagerOverrideAdapter(configuration, authorization, persistence);

    await expect(authorization.evaluate({
      employeeId: "employee-001",
      capability: "accept-payment",
      branchId: "store-main",
    })).resolves.toMatchObject({ allowed: true, denyReason: null });

    await expect(authorization.evaluate({
      employeeId: "employee-001",
      capability: "reprint-resend-receipts",
      branchId: "store-main",
    })).resolves.toMatchObject({ allowed: false, denyReason: "permission-missing" });

    const approval = await managerOverride.approveOnce({
      actorEmployeeId: "employee-001",
      approverPin: "4321",
      capability: "reprint-resend-receipts",
      branchId: "store-main",
      commandId: "reprint-once-001",
      targetType: "receipt",
      targetId: "receipt-001",
    });
    expect(approval.actorEmployeeId).toBe("employee-001");
    expect(approval.approverEmployeeId).toBe("employee-manager-001");
    expect(JSON.stringify(approval)).not.toContain("4321");

    // One-action approval is audit evidence for the blocked command only. It
    // never mutates/elevates the active cashier's effective permissions.
    await expect(authorization.evaluate({
      employeeId: "employee-001",
      capability: "reprint-resend-receipts",
      branchId: "store-main",
    })).resolves.toMatchObject({ allowed: false, denyReason: "permission-missing" });

    await expect(authorization.evaluate({
      employeeId: "employee-001",
      capability: "accept-payment",
      branchId: "store-other",
    })).resolves.toMatchObject({ allowed: false, denyReason: "branch-out-of-scope" });

    const reopenedPersistence = createBrowserLocalPersistence(window.localStorage, posKey);
    const reopenedConfiguration = createEffectivePosConfigurationAdapter(reopenedPersistence);
    const afterRestart = await reopenedConfiguration.read();
    expect(afterRestart).toEqual(await configuration.read());
    expect(afterRestart.paymentMethods.map((method) => method.id)).toEqual(["payment-card", "payment-cash"]);
    expect(afterRestart.roles.find((role) => role.roleId === "role-cashier")?.permissions).toEqual(["accept-payment", "view-all-receipts"]);
  });
});
