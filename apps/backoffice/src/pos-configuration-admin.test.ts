import { describe, expect, it } from "vitest";
import { createBrowserPosConfigurationAdmin } from "../../../adapters/posConfiguration/browserPosConfigurationAdmin";
import { PosConfigurationAdminError } from "../../../core/posConfiguration/configurationAdminRules";

describe("MAP-01 Back Office POS configuration admin adapter", () => {
  it("persists employee changes idempotently and never stores the raw PIN", async () => {
    const key = `rifad-map01-admin-${crypto.randomUUID()}`;
    const admin = createBrowserPosConfigurationAdmin(window.localStorage, key);

    const initial = await admin.read();
    const withEmployee = await admin.saveEmployee({
      commandId: "employee-create-001",
      employee: {
        name: "سارة",
        email: "sara@example.com",
        phone: "0500000000",
        roleId: "role-cashier",
        storeIds: ["store-main"],
        active: true,
      },
    });
    expect(withEmployee.revision).toBe(initial.revision + 1);
    const employee = withEmployee.employees.find((item) => item.name === "سارة");
    expect(employee).toBeDefined();

    const replay = await admin.saveEmployee({
      commandId: "employee-create-001",
      employee: {
        name: "اسم يجب ألا يطبق عند إعادة الأمر",
        email: "",
        phone: "",
        roleId: "role-cashier",
        storeIds: ["store-main"],
        active: true,
      },
    });
    expect(replay.revision).toBe(withEmployee.revision);
    expect(replay.employees.some((item) => item.name === "اسم يجب ألا يطبق عند إعادة الأمر")).toBe(false);

    const withPin = await admin.setEmployeePin({ commandId: "employee-pin-001", employeeId: employee!.id, pin: "2468" });
    expect(withPin.employees.find((item) => item.id === employee!.id)?.pinConfigured).toBe(true);
    expect(window.localStorage.getItem(key)).not.toContain("2468");
  });

  it("enforces unique staging PIN fingerprints and immutable owner-role authority", async () => {
    const key = `rifad-map01-admin-${crypto.randomUUID()}`;
    const admin = createBrowserPosConfigurationAdmin(window.localStorage, key);
    const first = await admin.saveEmployee({
      commandId: "employee-a",
      employee: { name: "أ", email: "", phone: "", roleId: "role-cashier", storeIds: ["store-main"], active: true },
    });
    const employeeA = first.employees.find((item) => item.name === "أ")!;
    const second = await admin.saveEmployee({
      commandId: "employee-b",
      employee: { name: "ب", email: "", phone: "", roleId: "role-cashier", storeIds: ["store-main"], active: true },
    });
    const employeeB = second.employees.find((item) => item.name === "ب")!;

    await admin.setEmployeePin({ commandId: "pin-a", employeeId: employeeA.id, pin: "1357" });
    await expect(admin.setEmployeePin({ commandId: "pin-b", employeeId: employeeB.id, pin: "1357" }))
      .rejects.toMatchObject({ code: "EMPLOYEE_PIN_CONFLICT" } satisfies Partial<PosConfigurationAdminError>);

    const owner = (await admin.read()).roles.find((role) => role.ownerRole)!;
    await expect(admin.saveRole({
      commandId: "owner-edit",
      role: { id: owner.id, name: owner.name, permissions: ["accept-payment"] },
    })).rejects.toMatchObject({ code: "OWNER_ROLE_IMMUTABLE" } satisfies Partial<PosConfigurationAdminError>);
  });

  it("keeps merchant payment ordering explicit and versioned", async () => {
    const key = `rifad-map01-admin-${crypto.randomUUID()}`;
    const admin = createBrowserPosConfigurationAdmin(window.localStorage, key);
    const initial = await admin.read();
    const ids = initial.paymentTypes.map((item) => item.id);
    const reversed = [...ids].reverse();

    const updated = await admin.reorderPaymentTypes({ commandId: "payment-order-001", orderedIds: reversed });
    expect([...updated.paymentTypes].sort((a, b) => a.sortOrder - b.sortOrder).map((item) => item.id)).toEqual(reversed);
    expect(updated.revision).toBe(initial.revision + 1);
  });
});
