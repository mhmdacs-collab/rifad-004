import {
  POS_CONFIGURATION_CONTRACT_VERSION,
  POS_PERMISSION_KEYS,
  type EffectivePosConfiguration,
  type PosPaymentDirectImpact,
  type PosPaymentMethodKind,
  type PosPermissionKey,
} from "../../contracts/posConfiguration";
import type {
  MerchantPermissionKey,
  MerchantPosConfiguration,
} from "../../contracts/posConfigurationAdmin";

export class PosConfigurationProjectionError extends Error {
  constructor(readonly code: string, message: string) {
    super(message);
    this.name = "PosConfigurationProjectionError";
  }
}

const POS_PERMISSION_SET = new Set<string>(POS_PERMISSION_KEYS);
const isPosPermissionKey = (permission: MerchantPermissionKey): permission is PosPermissionKey =>
  POS_PERMISSION_SET.has(permission);

const impactForKind = (kind: PosPaymentMethodKind): PosPaymentDirectImpact => {
  if (kind === "cash") return "cash";
  if (kind === "card") return "bank";
  if (kind === "customer-credit") return "customer-receivable";
  return "bank";
};

/**
 * Projects owner-managed merchant policy into the exact branch/device-local
 * configuration a POS needs while offline.
 *
 * This is pure Rifad domain logic. It performs no cloud, LAN, database or sync
 * work and therefore remains valid regardless of the transport chosen later.
 */
export const projectEffectivePosConfiguration = (input: {
  source: MerchantPosConfiguration;
  branchId: string;
  deviceId: string;
}): EffectivePosConfiguration => {
  const { source, branchId, deviceId } = input;
  const store = source.stores.find((item) => item.id === branchId);
  if (!store || !store.active) {
    throw new PosConfigurationProjectionError(
      "EFFECTIVE_CONFIG_STORE_UNAVAILABLE",
      "لا يمكن إنشاء إعداد نقطة البيع لفرع غير موجود أو غير فعال.",
    );
  }

  const device = source.devices.find((item) => item.id === deviceId);
  if (!device || device.status === "disabled") {
    throw new PosConfigurationProjectionError(
      "EFFECTIVE_CONFIG_DEVICE_UNAVAILABLE",
      "لا يمكن إنشاء إعداد نقطة البيع لجهاز غير موجود أو معطل.",
    );
  }
  if (device.storeId !== branchId) {
    throw new PosConfigurationProjectionError(
      "EFFECTIVE_CONFIG_DEVICE_STORE_MISMATCH",
      "الجهاز غير مرتبط بالفرع المطلوب.",
    );
  }

  const employees = source.employees
    .filter((employee) => employee.active && employee.storeIds.includes(branchId))
    .map((employee) => {
      const role = source.roles.find((candidate) => candidate.id === employee.roleId);
      if (!role) {
        throw new PosConfigurationProjectionError(
          "EFFECTIVE_CONFIG_EMPLOYEE_ROLE_MISSING",
          `الموظف ${employee.name} مرتبط بدور غير موجود.`,
        );
      }
      return {
        employeeId: employee.id,
        employeeName: employee.name,
        roleId: role.id,
        roleName: role.name,
        branchIds: [...employee.storeIds],
        active: employee.active,
      };
    });

  const usedRoleIds = new Set(employees.map((employee) => employee.roleId));
  const roles = source.roles
    .filter((role) => usedRoleIds.has(role.id))
    .map((role) => ({
      roleId: role.id,
      roleName: role.name,
      // One merchant role spans the product, but a branch POS receives only
      // the locally enforceable POS capabilities. Back Office-only rights stay
      // in the owner source model.
      permissions: role.permissions.filter(isPosPermissionKey),
    }));

  const paymentMethods = source.paymentTypes
    .filter((method) => method.enabled && (method.storeIds.length === 0 || method.storeIds.includes(branchId)))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "ar"))
    .map((method) => ({
      id: method.id,
      name: method.name,
      kind: method.kind,
      enabled: true,
      sortOrder: method.sortOrder,
      availability: method.availability,
      directImpact: method.directImpact ?? impactForKind(method.kind),
      systemDefault: method.systemDefault ?? null,
    }));

  const delivery = source.delivery ? {
    enabled: source.delivery.enabled,
    channels: source.delivery.channels
      .filter((channel) => channel.enabled && (channel.storeIds.length === 0 || channel.storeIds.includes(branchId)))
      .map((channel) => ({ ...channel, storeIds: [...channel.storeIds] })),
  } : undefined;

  return {
    contractVersion: POS_CONFIGURATION_CONTRACT_VERSION,
    schemaVersion: 1,
    revision: source.revision,
    effectiveAt: source.updatedAt,
    branchId,
    deviceId,
    features: { ...source.features },
    paymentMethods,
    delivery,
    roles,
    employees,
  };
};
