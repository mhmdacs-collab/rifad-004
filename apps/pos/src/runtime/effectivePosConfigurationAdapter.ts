import type { LocalPersistenceContract } from "../contracts/localPersistence";
import {
  POS_CONFIGURATION_CONTRACT_VERSION,
  type AuthorizationContract,
  type AuthorizationDecision,
  type EffectivePosConfiguration,
  type EffectivePosConfigurationContract,
  type ManagerOverrideApproval,
  type ManagerOverrideContract,
  type PosPermissionKey,
} from "../../../../contracts/posConfiguration";

export const POS_EFFECTIVE_CONFIGURATION_NAMESPACE = "pos.effective-configuration";
export const POS_AUTHORIZATION_AUDIT_NAMESPACE = "pos.authorization-audit";
export const POS_EFFECTIVE_CONFIGURATION_SCHEMA_VERSION = 1;
export const POS_AUTHORIZATION_AUDIT_SCHEMA_VERSION = 1;

const ALL_POS_PERMISSIONS: readonly PosPermissionKey[] = [
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
];

/**
 * Staging-only PIN fixture until the employee-management projection owns a
 * production-safe local verifier. Raw PINs must not become configuration or
 * audit payloads.
 */
const STAGING_PIN_EMPLOYEE: Readonly<Record<string, string>> = {
  "1234": "employee-001",
  "4321": "employee-manager-001",
};

export class PosConfigurationError extends Error {
  constructor(readonly code: string, message: string) {
    super(message);
    this.name = "PosConfigurationError";
  }
}

type OverrideAuditState = Readonly<{
  approvals: readonly ManagerOverrideApproval[];
}>;

const starterConfiguration = (branchId: string, deviceId: string): EffectivePosConfiguration => ({
  contractVersion: POS_CONFIGURATION_CONTRACT_VERSION,
  schemaVersion: 1,
  revision: 0,
  effectiveAt: new Date(0).toISOString(),
  branchId,
  deviceId,
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
  paymentMethods: [
    {
      id: "payment-cash",
      name: "نقدًا",
      kind: "cash",
      enabled: true,
      sortOrder: 10,
      availability: "offline-capable",
    },
    {
      id: "payment-mada-mock",
      name: "شبكة / مدى",
      kind: "card",
      enabled: true,
      sortOrder: 20,
      availability: "online-required",
    },
  ],
  roles: [
    {
      roleId: "role-cashier",
      roleName: "أمين صندوق",
      permissions: ["accept-payment", "view-all-receipts"],
    },
    {
      roleId: "role-manager",
      roleName: "مدير",
      permissions: ALL_POS_PERMISSIONS,
    },
  ],
  employees: [
    {
      employeeId: "employee-001",
      employeeName: "محمد العتيبي",
      roleId: "role-cashier",
      roleName: "أمين صندوق",
      branchIds: [branchId],
      active: true,
    },
    {
      employeeId: "employee-manager-001",
      employeeName: "مدير الفرع",
      roleId: "role-manager",
      roleName: "مدير",
      branchIds: [branchId],
      active: true,
    },
  ],
});

const effectiveFromRecord = (
  value: EffectivePosConfiguration,
  revision: number,
  updatedAt: string,
): EffectivePosConfiguration => ({ ...value, revision, effectiveAt: updatedAt });

export const createEffectivePosConfigurationAdapter = (
  persistence: LocalPersistenceContract,
): EffectivePosConfigurationContract => ({
  read: async () => {
    const context = await persistence.getNodeContext();
    if (!context.branchId || !context.deviceId) {
      throw new PosConfigurationError(
        "POS_CONFIGURATION_DEVICE_UNBOUND",
        "يجب ربط جهاز نقطة البيع بفرع قبل تحميل إعداداته.",
      );
    }

    const current = await persistence.readSnapshot<EffectivePosConfiguration>(POS_EFFECTIVE_CONFIGURATION_NAMESPACE);
    if (current && current.value.branchId === context.branchId && current.value.deviceId === context.deviceId) {
      return effectiveFromRecord(current.value, current.revision, current.updatedAt);
    }

    const initial = starterConfiguration(context.branchId, context.deviceId);
    const committed = await persistence.commitSnapshot({
      namespace: POS_EFFECTIVE_CONFIGURATION_NAMESPACE,
      schemaVersion: POS_EFFECTIVE_CONFIGURATION_SCHEMA_VERSION,
      value: initial,
    });
    return effectiveFromRecord(committed.value, committed.revision, committed.updatedAt);
  },
});

export const createAuthorizationAdapter = (
  configuration: EffectivePosConfigurationContract,
): AuthorizationContract => ({
  evaluate: async ({ employeeId, capability, branchId }): Promise<AuthorizationDecision> => {
    const effective = await configuration.read();
    const employee = effective.employees.find((item) => item.employeeId === employeeId);
    if (!employee) {
      return { allowed: false, employeeId, capability, branchId, configurationRevision: effective.revision, denyReason: "employee-not-found" };
    }
    if (!employee.active) {
      return { allowed: false, employeeId, capability, branchId, configurationRevision: effective.revision, denyReason: "employee-inactive" };
    }
    if (!employee.branchIds.includes(branchId) || effective.branchId !== branchId) {
      return { allowed: false, employeeId, capability, branchId, configurationRevision: effective.revision, denyReason: "branch-out-of-scope" };
    }
    const role = effective.roles.find((item) => item.roleId === employee.roleId);
    if (!role) {
      return { allowed: false, employeeId, capability, branchId, configurationRevision: effective.revision, denyReason: "role-not-found" };
    }
    if (!role.permissions.includes(capability)) {
      return { allowed: false, employeeId, capability, branchId, configurationRevision: effective.revision, denyReason: "permission-missing" };
    }
    return { allowed: true, employeeId, capability, branchId, configurationRevision: effective.revision, denyReason: null };
  },
});

export const createManagerOverrideAdapter = (
  configuration: EffectivePosConfigurationContract,
  authorization: AuthorizationContract,
  persistence: LocalPersistenceContract,
): ManagerOverrideContract => ({
  approveOnce: async (input) => {
    const effective = await configuration.read();
    if (effective.branchId !== input.branchId) {
      throw new PosConfigurationError("OVERRIDE_BRANCH_MISMATCH", "لا يمكن اعتماد العملية من خارج الفرع الحالي.");
    }

    const approvalId = `manager-override:${input.commandId}:${input.capability}`;
    const existingState = await persistence.readSnapshot<OverrideAuditState>(POS_AUTHORIZATION_AUDIT_NAMESPACE);
    const existing = existingState?.value.approvals.find((item) => item.approvalId === approvalId);
    if (existing) return existing;

    const approverEmployeeId = STAGING_PIN_EMPLOYEE[input.approverPin];
    if (!approverEmployeeId) {
      throw new PosConfigurationError("INVALID_OVERRIDE_PIN", "الرقم السري غير صحيح.");
    }

    const approver = effective.employees.find((item) => item.employeeId === approverEmployeeId);
    if (!approver) {
      throw new PosConfigurationError("OVERRIDE_EMPLOYEE_NOT_FOUND", "تعذر العثور على الموظف المخول.");
    }

    const decision = await authorization.evaluate({
      employeeId: approver.employeeId,
      capability: input.capability,
      branchId: input.branchId,
    });
    if (!decision.allowed) {
      throw new PosConfigurationError("OVERRIDE_NOT_AUTHORIZED", "هذا الموظف غير مخول باعتماد العملية.");
    }

    const approvedAt = new Date().toISOString();
    const approval: ManagerOverrideApproval = {
      approvalId,
      actorEmployeeId: input.actorEmployeeId,
      approverEmployeeId: approver.employeeId,
      approverEmployeeName: approver.employeeName,
      capability: input.capability,
      branchId: input.branchId,
      commandId: input.commandId,
      targetType: input.targetType ?? null,
      targetId: input.targetId ?? null,
      approvedAt,
      configurationRevision: effective.revision,
    };

    const nextApprovals = [...(existingState?.value.approvals ?? []), approval];
    await persistence.commitSnapshot({
      namespace: POS_AUTHORIZATION_AUDIT_NAMESPACE,
      schemaVersion: POS_AUTHORIZATION_AUDIT_SCHEMA_VERSION,
      value: { approvals: nextApprovals },
      events: [{
        id: approvalId,
        type: "authorization.manager-override-approved.v1",
        aggregateType: "employee-authorization",
        aggregateId: input.actorEmployeeId,
        occurredAt: approvedAt,
        payload: approval,
      }],
    });

    return approval;
  },
});
