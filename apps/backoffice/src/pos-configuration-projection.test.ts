import { describe, expect, it } from "vitest";
import type { MerchantPosConfiguration } from "../../../contracts/posConfigurationAdmin";
import { projectEffectivePosConfiguration } from "../../../core/posConfiguration/projectEffectivePosConfiguration";

const source: MerchantPosConfiguration = {
  contractVersion: 1,
  revision: 7,
  updatedAt: "2026-08-19T18:30:00.000Z",
  features: {
    shifts: true,
    "time-clock": true,
    "open-tickets": true,
    "restaurant-service": false,
    "place-management": false,
    "dining-options": false,
    "kitchen-routing": false,
    "customer-display": false,
  },
  stores: [
    { id: "store-a", name: "فرع أ", address: "", phone: "", taxRegistrationNumber: "", description: "", active: true },
    { id: "store-b", name: "فرع ب", address: "", phone: "", taxRegistrationNumber: "", description: "", active: true },
  ],
  devices: [
    { id: "device-a", name: "كاشير أ", storeId: "store-a", status: "linked" },
    { id: "device-b", name: "كاشير ب", storeId: "store-b", status: "linked" },
  ],
  roles: [
    { id: "cashier", name: "كاشير", permissions: ["accept-payment", "manage-employees"], ownerRole: false },
    { id: "manager", name: "مدير", permissions: ["accept-payment", "perform-returns", "access-back-office"], ownerRole: false },
  ],
  employees: [
    { id: "employee-a", name: "موظف أ", email: "", phone: "", roleId: "cashier", storeIds: ["store-a"], active: true, pinConfigured: true },
    { id: "employee-b", name: "موظف ب", email: "", phone: "", roleId: "manager", storeIds: ["store-b"], active: true, pinConfigured: true },
  ],
  paymentTypes: [
    { id: "cash", name: "نقدًا", kind: "cash", enabled: true, sortOrder: 20, availability: "offline-capable", storeIds: [] },
    { id: "mada-a", name: "مدى أ", kind: "card", enabled: true, sortOrder: 10, availability: "online-required", storeIds: ["store-a"] },
    { id: "mada-b", name: "مدى ب", kind: "card", enabled: true, sortOrder: 5, availability: "online-required", storeIds: ["store-b"] },
  ],
};

describe("MAP-01 owner configuration projection", () => {
  it("projects only branch/device-relevant facts and strips Back Office-only permissions from the POS role snapshot", () => {
    const effective = projectEffectivePosConfiguration({ source, branchId: "store-a", deviceId: "device-a" });

    expect(effective.revision).toBe(7);
    expect(effective.employees.map((employee) => employee.employeeId)).toEqual(["employee-a"]);
    expect(effective.roles.map((role) => role.roleId)).toEqual(["cashier"]);
    expect(effective.roles[0]?.permissions).toEqual(["accept-payment"]);
    expect(effective.paymentMethods.map((method) => method.id)).toEqual(["mada-a", "cash"]);
    expect(effective.paymentMethods.map((method) => method.sortOrder)).toEqual([10, 20]);
  });

  it("rejects projecting a device into a different branch", () => {
    expect(() => projectEffectivePosConfiguration({ source, branchId: "store-a", deviceId: "device-b" }))
      .toThrowError(/غير مرتبط بالفرع/);
  });
});
