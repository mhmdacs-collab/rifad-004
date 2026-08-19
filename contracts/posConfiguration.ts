export const POS_CONFIGURATION_CONTRACT_VERSION = 1 as const;

export const POS_FEATURE_KEYS = [
  "shifts",
  "time-clock",
  "open-tickets",
  "restaurant-service",
  "place-management",
  "dining-options",
  "kitchen-routing",
  "customer-display",
] as const;

export type PosFeatureKey = (typeof POS_FEATURE_KEYS)[number];

export const POS_PERMISSION_KEYS = [
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
  "manage-pos-items",
  "view-item-cost",
  "change-device-settings",
] as const;

export type PosPermissionKey = (typeof POS_PERMISSION_KEYS)[number];

export type PosPaymentMethodKind = "cash" | "card" | "customer-credit" | "custom";

export type PosPaymentAvailability = "offline-capable" | "online-required";

/**
 * Financial destination immediately affected by a single payment method.
 *
 * This is intentionally independent from the payment method display name. For
 * example STC Pay, Visa and a bank transfer can all affect `bank`, while a
 * delivery platform can affect `external-platform` until its later settlement.
 */
export const POS_PAYMENT_DIRECT_IMPACTS = [
  "cash",
  "bank",
  "customer-receivable",
  "external-platform",
] as const;

export type PosPaymentDirectImpact = (typeof POS_PAYMENT_DIRECT_IMPACTS)[number];

export type PosSystemDefaultPayment = "cash" | "network" | "credit";

export type EffectivePosPaymentMethod = Readonly<{
  id: string;
  name: string;
  kind: PosPaymentMethodKind;
  enabled: boolean;
  sortOrder: number;
  availability: PosPaymentAvailability;
  /**
   * Optional for backwards compatibility with pre-extension local snapshots.
   * Current projections/adapters fill it for all active methods.
   */
  directImpact?: PosPaymentDirectImpact;
  /** Stable identity for the three starter methods. Hiding is not deletion. */
  systemDefault?: PosSystemDefaultPayment | null;
}>;

export type DeliveryChannelKind = "platform" | "self-delivery" | "custom";
export type DeliveryCodSettlement = "courier-pays-merchant" | "platform-settlement";
export type SelfDeliveryFeeBeneficiary = "merchant" | "courier";

export type EffectiveDeliveryChannel = Readonly<{
  id: string;
  name: string;
  kind: DeliveryChannelKind;
  brandKey: string;
  enabled: boolean;
  electronicPaymentEnabled: boolean;
  cashOnDeliveryEnabled: boolean;
  codSettlement: DeliveryCodSettlement;
  /** Empty means all branches; projection strips channels outside this branch. */
  storeIds: readonly string[];
  selfDelivery: Readonly<{
    feeMode: "manual";
    defaultFeeHalalas: number;
    allowPosFeeOverride: boolean;
    feeBeneficiary: SelfDeliveryFeeBeneficiary;
  }> | null;
}>;

export type EffectiveDeliveryConfiguration = Readonly<{
  enabled: boolean;
  channels: readonly EffectiveDeliveryChannel[];
}>;

export type PosRoleAuthorizationSnapshot = Readonly<{
  roleId: string;
  roleName: string;
  permissions: readonly PosPermissionKey[];
}>;

export type PosEmployeeAuthorizationSnapshot = Readonly<{
  employeeId: string;
  employeeName: string;
  roleId: string;
  roleName: string;
  branchIds: readonly string[];
  active: boolean;
}>;

export type EffectivePosConfiguration = Readonly<{
  contractVersion: typeof POS_CONFIGURATION_CONTRACT_VERSION;
  schemaVersion: 1;
  revision: number;
  effectiveAt: string;
  branchId: string;
  deviceId: string;
  features: Readonly<Record<PosFeatureKey, boolean>>;
  paymentMethods: readonly EffectivePosPaymentMethod[];
  /** Optional only for pre-extension local snapshots. */
  delivery?: EffectiveDeliveryConfiguration;
  roles: readonly PosRoleAuthorizationSnapshot[];
  employees: readonly PosEmployeeAuthorizationSnapshot[];
}>;

export interface EffectivePosConfigurationContract {
  read(): Promise<EffectivePosConfiguration>;
}

export type AuthorizationDenyReason =
  | "employee-not-found"
  | "employee-inactive"
  | "branch-out-of-scope"
  | "role-not-found"
  | "permission-missing";

export type AuthorizationDecision = Readonly<{
  allowed: boolean;
  employeeId: string;
  capability: PosPermissionKey;
  branchId: string;
  configurationRevision: number;
  denyReason: AuthorizationDenyReason | null;
}>;

export interface AuthorizationContract {
  evaluate(input: {
    employeeId: string;
    capability: PosPermissionKey;
    branchId: string;
  }): Promise<AuthorizationDecision>;
}

export type ManagerOverrideApproval = Readonly<{
  approvalId: string;
  actorEmployeeId: string;
  approverEmployeeId: string;
  approverEmployeeName: string;
  capability: PosPermissionKey;
  branchId: string;
  commandId: string;
  targetType: string | null;
  targetId: string | null;
  approvedAt: string;
  configurationRevision: number;
}>;

/**
 * Verifies a manager/eligible employee locally for one blocked action.
 *
 * The returned approval is audit evidence for the current action only. It is not
 * a session elevation token and must never contain the raw PIN.
 */
export interface ManagerOverrideContract {
  approveOnce(input: {
    actorEmployeeId: string;
    approverPin: string;
    capability: PosPermissionKey;
    branchId: string;
    commandId: string;
    targetType?: string | null;
    targetId?: string | null;
  }): Promise<ManagerOverrideApproval>;
}
