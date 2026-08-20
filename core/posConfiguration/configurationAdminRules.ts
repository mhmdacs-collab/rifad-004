import {
  POS_FEATURE_KEYS,
  type PosFeatureKey,
  type PosPaymentDirectImpact,
  type PosPaymentMethodKind,
} from "../../contracts/posConfiguration";
import {
  MERCHANT_PERMISSION_KEYS,
  POS_CONFIGURATION_ADMIN_CONTRACT_VERSION,
  type MerchantEmployee,
  type MerchantEmployeeDraft,
  type MerchantPaymentType,
  type MerchantPaymentTypeDraft,
  type MerchantPosConfiguration,
  type MerchantPosDevice,
  type MerchantPosDeviceDraft,
  type MerchantRole,
  type MerchantRoleDraft,
  type MerchantStore,
  type MerchantStoreDraft,
} from "../../contracts/posConfigurationAdmin";
import { createDefaultDeliveryConfiguration } from "./defaultDeliveryConfiguration";

export class PosConfigurationAdminError extends Error {
  constructor(readonly code: string, message: string) {
    super(message);
    this.name = "PosConfigurationAdminError";
  }
}

const requiredName = (value: string, label: string) => {
  const normalized = value.trim();
  if (!normalized) throw new PosConfigurationAdminError("NAME_REQUIRED", `${label} مطلوب.`);
  return normalized;
};

const unique = <T extends string>(values: readonly T[]): T[] => [...new Set(values)];

const impactForKind = (kind: PosPaymentMethodKind): PosPaymentDirectImpact => {
  if (kind === "cash") return "cash";
  if (kind === "card") return "bank";
  if (kind === "customer-credit") return "customer-receivable";
  return "bank";
};

const next = (
  current: MerchantPosConfiguration,
  patch: Partial<MerchantPosConfiguration>,
  updatedAt: string,
): MerchantPosConfiguration => ({
  ...current,
  ...patch,
  contractVersion: POS_CONFIGURATION_ADMIN_CONTRACT_VERSION,
  revision: current.revision + 1,
  updatedAt,
});

const assertRole = (config: MerchantPosConfiguration, roleId: string) => {
  if (!config.roles.some((role) => role.id === roleId)) {
    throw new PosConfigurationAdminError("ROLE_NOT_FOUND", "الدور المحدد غير موجود.");
  }
};

const assertStores = (config: MerchantPosConfiguration, storeIds: readonly string[]) => {
  const known = new Set(config.stores.map((store) => store.id));
  if (storeIds.some((id) => !known.has(id))) {
    throw new PosConfigurationAdminError("STORE_NOT_FOUND", "أحد الفروع المحددة غير موجود.");
  }
};

export const createDefaultMerchantPosConfiguration = (
  updatedAt = new Date(0).toISOString(),
): MerchantPosConfiguration => ({
  contractVersion: POS_CONFIGURATION_ADMIN_CONTRACT_VERSION,
  revision: 1,
  updatedAt,
  features: {
    shifts: true,
    "time-clock": false,
    "open-tickets": true,
    "restaurant-service": true,
    "place-management": true,
    "dining-options": true,
    "kitchen-routing": false,
    "customer-display": false,
  },
  stores: [
    {
      id: "store-main",
      name: "الفرع الرئيسي",
      address: "",
      phone: "",
      taxRegistrationNumber: "",
      description: "",
      active: true,
    },
  ],
  devices: [
    {
      id: "pos-main",
      name: "نقطة البيع الرئيسية",
      storeId: "store-main",
      status: "linked",
    },
  ],
  roles: [
    {
      id: "role-owner",
      name: "المالك",
      permissions: [...MERCHANT_PERMISSION_KEYS],
      ownerRole: true,
    },
    {
      id: "role-manager",
      name: "مدير",
      permissions: [
        "accept-payment",
        "view-all-receipts",
        "reprint-resend-receipts",
        "apply-restricted-discounts",
        "change-sale-tax",
        "perform-returns",
        "manage-all-open-tickets",
        "void-saved-items",
        "view-shift-report",
        "open-cash-drawer-without-sale",
        "change-device-settings",
        "access-back-office",
        "view-sales-reports",
        "manage-items",
        "manage-employees",
        "manage-customers",
        "edit-general-settings",
        "manage-stores",
        "manage-pos-devices",
        "manage-payment-types",
      ],
      ownerRole: false,
    },
    {
      id: "role-cashier",
      name: "أمين صندوق",
      permissions: ["accept-payment", "view-all-receipts", "reprint-resend-receipts"],
      ownerRole: false,
    },
  ],
  employees: [
    {
      id: "employee-owner",
      name: "المالك",
      email: "",
      phone: "",
      roleId: "role-owner",
      storeIds: ["store-main"],
      active: true,
      pinConfigured: false,
    },
    {
      id: "employee-cashier",
      name: "أمين الصندوق",
      email: "",
      phone: "",
      roleId: "role-cashier",
      storeIds: ["store-main"],
      active: true,
      pinConfigured: false,
    },
  ],
  paymentTypes: [
    {
      id: "payment-cash",
      name: "نقدًا",
      kind: "cash",
      enabled: true,
      sortOrder: 10,
      availability: "offline-capable",
      storeIds: [],
      directImpact: "cash",
      systemDefault: "cash",
    },
    {
      id: "payment-card",
      name: "شبكة / مدى",
      kind: "card",
      enabled: true,
      sortOrder: 20,
      availability: "online-required",
      storeIds: [],
      directImpact: "bank",
      systemDefault: "network",
    },
    {
      id: "payment-credit",
      name: "آجل",
      kind: "customer-credit",
      enabled: true,
      sortOrder: 30,
      availability: "offline-capable",
      storeIds: [],
      directImpact: "customer-receivable",
      systemDefault: "credit",
    },
  ],
  delivery: createDefaultDeliveryConfiguration(),
});

export const saveMerchantEmployee = (input: {
  config: MerchantPosConfiguration;
  draft: MerchantEmployeeDraft;
  id: string;
  updatedAt: string;
}): MerchantPosConfiguration => {
  const { config, draft, id, updatedAt } = input;
  assertRole(config, draft.roleId);
  assertStores(config, draft.storeIds);
  if (draft.storeIds.length === 0) {
    throw new PosConfigurationAdminError("EMPLOYEE_STORE_REQUIRED", "حدد فرعًا واحدًا على الأقل للموظف.");
  }
  const previous = config.employees.find((employee) => employee.id === id);
  const employee: MerchantEmployee = {
    id,
    name: requiredName(draft.name, "اسم الموظف"),
    email: draft.email.trim(),
    phone: draft.phone.trim(),
    roleId: draft.roleId,
    storeIds: unique(draft.storeIds),
    active: draft.active,
    pinConfigured: previous?.pinConfigured ?? false,
  };
  return next(
    config,
    { employees: previous ? config.employees.map((item) => item.id === id ? employee : item) : [...config.employees, employee] },
    updatedAt,
  );
};

export const markMerchantEmployeePinConfigured = (input: {
  config: MerchantPosConfiguration;
  employeeId: string;
  pin: string;
  updatedAt: string;
}): MerchantPosConfiguration => {
  if (!/^\d{4}$/.test(input.pin)) {
    throw new PosConfigurationAdminError("INVALID_EMPLOYEE_PIN", "الرقم السري يجب أن يتكون من أربعة أرقام.");
  }
  const employee = input.config.employees.find((item) => item.id === input.employeeId);
  if (!employee) throw new PosConfigurationAdminError("EMPLOYEE_NOT_FOUND", "الموظف غير موجود.");
  // PIN uniqueness cannot be proven from the public merchant snapshot because
  // raw credentials are intentionally absent. The credential-owning adapter
  // enforces uniqueness before calling this pure state transition.
  return next(
    input.config,
    { employees: input.config.employees.map((item) => item.id === input.employeeId ? { ...item, pinConfigured: true } : item) },
    input.updatedAt,
  );
};

export const saveMerchantRole = (input: {
  config: MerchantPosConfiguration;
  draft: MerchantRoleDraft;
  id: string;
  updatedAt: string;
}): MerchantPosConfiguration => {
  const { config, draft, id, updatedAt } = input;
  const existing = config.roles.find((role) => role.id === id);
  if (existing?.ownerRole) {
    throw new PosConfigurationAdminError("OWNER_ROLE_IMMUTABLE", "صلاحيات دور المالك ثابتة ولا يمكن خفضها.");
  }
  const name = requiredName(draft.name, "اسم الدور");
  if (config.roles.some((role) => role.id !== id && role.name.trim().toLocaleLowerCase("ar") === name.toLocaleLowerCase("ar"))) {
    throw new PosConfigurationAdminError("ROLE_NAME_DUPLICATE", "اسم الدور مستخدم مسبقًا.");
  }
  const allowed = new Set<string>(MERCHANT_PERMISSION_KEYS);
  if (draft.permissions.some((permission) => !allowed.has(permission))) {
    throw new PosConfigurationAdminError("UNKNOWN_PERMISSION", "توجد صلاحية غير معروفة في الدور.");
  }
  const role: MerchantRole = { id, name, permissions: unique(draft.permissions), ownerRole: false };
  return next(
    config,
    { roles: existing ? config.roles.map((item) => item.id === id ? role : item) : [...config.roles, role] },
    updatedAt,
  );
};

export const setMerchantFeature = (input: {
  config: MerchantPosConfiguration;
  feature: PosFeatureKey;
  enabled: boolean;
  updatedAt: string;
}): MerchantPosConfiguration => {
  if (!(POS_FEATURE_KEYS as readonly string[]).includes(input.feature)) {
    throw new PosConfigurationAdminError("UNKNOWN_FEATURE", "ميزة غير معروفة.");
  }
  return next(
    input.config,
    { features: { ...input.config.features, [input.feature]: input.enabled } },
    input.updatedAt,
  );
};

export const saveMerchantStore = (input: {
  config: MerchantPosConfiguration;
  draft: MerchantStoreDraft;
  id: string;
  updatedAt: string;
}): MerchantPosConfiguration => {
  const { config, draft, id, updatedAt } = input;
  const existing = config.stores.find((store) => store.id === id);
  const store: MerchantStore = {
    id,
    name: requiredName(draft.name, "اسم الفرع"),
    address: draft.address.trim(),
    phone: draft.phone.trim(),
    taxRegistrationNumber: draft.taxRegistrationNumber.trim(),
    description: draft.description.trim(),
    active: draft.active,
  };
  return next(
    config,
    { stores: existing ? config.stores.map((item) => item.id === id ? store : item) : [...config.stores, store] },
    updatedAt,
  );
};

export const saveMerchantDevice = (input: {
  config: MerchantPosConfiguration;
  draft: MerchantPosDeviceDraft;
  id: string;
  updatedAt: string;
}): MerchantPosConfiguration => {
  const { config, draft, id, updatedAt } = input;
  assertStores(config, [draft.storeId]);
  const existing = config.devices.find((device) => device.id === id);
  const device: MerchantPosDevice = {
    id,
    name: requiredName(draft.name, "اسم جهاز نقطة البيع"),
    storeId: draft.storeId,
    status: draft.status,
  };
  return next(
    config,
    { devices: existing ? config.devices.map((item) => item.id === id ? device : item) : [...config.devices, device] },
    updatedAt,
  );
};

export const saveMerchantPaymentType = (input: {
  config: MerchantPosConfiguration;
  draft: MerchantPaymentTypeDraft;
  id: string;
  updatedAt: string;
}): MerchantPosConfiguration => {
  const { config, draft, id, updatedAt } = input;
  assertStores(config, draft.storeIds);
  const existing = config.paymentTypes.find((payment) => payment.id === id);
  const maxOrder = Math.max(0, ...config.paymentTypes.map((payment) => payment.sortOrder));
  const payment: MerchantPaymentType = {
    id,
    name: requiredName(draft.name, "اسم طريقة الدفع"),
    kind: draft.kind,
    enabled: draft.enabled,
    sortOrder: draft.sortOrder ?? existing?.sortOrder ?? maxOrder + 10,
    availability: draft.availability,
    storeIds: unique(draft.storeIds),
    directImpact: draft.directImpact ?? existing?.directImpact ?? impactForKind(draft.kind),
    systemDefault: draft.systemDefault ?? existing?.systemDefault ?? null,
  };
  return next(
    config,
    { paymentTypes: existing ? config.paymentTypes.map((item) => item.id === id ? payment : item) : [...config.paymentTypes, payment] },
    updatedAt,
  );
};

export const reorderMerchantPaymentTypes = (input: {
  config: MerchantPosConfiguration;
  orderedIds: readonly string[];
  updatedAt: string;
}): MerchantPosConfiguration => {
  const currentIds = input.config.paymentTypes.map((payment) => payment.id);
  if (input.orderedIds.length !== currentIds.length || new Set(input.orderedIds).size !== currentIds.length || currentIds.some((id) => !input.orderedIds.includes(id))) {
    throw new PosConfigurationAdminError("PAYMENT_ORDER_INVALID", "ترتيب طرق الدفع غير مكتمل.");
  }
  const orderById = new Map(input.orderedIds.map((id, index) => [id, (index + 1) * 10]));
  return next(
    input.config,
    { paymentTypes: input.config.paymentTypes.map((payment) => ({ ...payment, sortOrder: orderById.get(payment.id) ?? payment.sortOrder })) },
    input.updatedAt,
  );
};
