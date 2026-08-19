export const POS_CONFIGURATION_CONTRACT_VERSION = 1 as const;

export type PosFeatureKey =
  | "shifts"
  | "time-clock"
  | "open-tickets"
  | "restaurant-service"
  | "place-management"
  | "dining-options"
  | "kitchen-routing"
  | "customer-display";

export type PosPermissionKey =
  | "accept-payment"
  | "view-all-receipts"
  | "reprint-resend-receipts"
  | "apply-restricted-discounts"
  | "change-sale-tax"
  | "perform-returns"
  | "manage-all-open-tickets"
  | "void-saved-items"
  | "view-shift-report"
  | "open-cash-drawer-without-sale"
  | "manage-pos-items"
  | "view-item-cost"
  | "change-device-settings";

export type PosPaymentMethodKind = "cash" | "card" | "customer-credit" | "custom";

export type PosPaymentAvailability = "offline-capable" | "online-required";

export type EffectivePosPaymentMethod = Readonly<{
  id: string;
  name: string;
  kind: PosPaymentMethodKind;
  enabled: boolean;
  sortOrder: number;
  availability: PosPaymentAvailability;
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
