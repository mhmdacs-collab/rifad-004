import type {
  PosFeatureKey,
  PosPaymentAvailability,
  PosPaymentMethodKind,
  PosPermissionKey,
} from "./posConfiguration";

export const POS_CONFIGURATION_ADMIN_CONTRACT_VERSION = 1 as const;

export type MerchantStore = Readonly<{
  id: string;
  name: string;
  address: string;
  phone: string;
  taxRegistrationNumber: string;
  description: string;
  active: boolean;
}>;

export type MerchantPosDeviceStatus = "pending-link" | "linked" | "disabled";

export type MerchantPosDevice = Readonly<{
  id: string;
  name: string;
  storeId: string;
  status: MerchantPosDeviceStatus;
}>;

export type MerchantRole = Readonly<{
  id: string;
  name: string;
  permissions: readonly PosPermissionKey[];
  ownerRole: boolean;
}>;

export type MerchantEmployee = Readonly<{
  id: string;
  name: string;
  email: string;
  phone: string;
  roleId: string;
  storeIds: readonly string[];
  active: boolean;
  pinConfigured: boolean;
}>;

export type MerchantPaymentType = Readonly<{
  id: string;
  name: string;
  kind: PosPaymentMethodKind;
  enabled: boolean;
  sortOrder: number;
  availability: PosPaymentAvailability;
  storeIds: readonly string[];
}>;

export type MerchantPosConfiguration = Readonly<{
  contractVersion: typeof POS_CONFIGURATION_ADMIN_CONTRACT_VERSION;
  revision: number;
  updatedAt: string;
  features: Readonly<Record<PosFeatureKey, boolean>>;
  stores: readonly MerchantStore[];
  devices: readonly MerchantPosDevice[];
  roles: readonly MerchantRole[];
  employees: readonly MerchantEmployee[];
  paymentTypes: readonly MerchantPaymentType[];
}>;

export type MerchantEmployeeDraft = Omit<MerchantEmployee, "id" | "pinConfigured"> & Readonly<{
  id?: string;
}>;

export type MerchantRoleDraft = Omit<MerchantRole, "id" | "ownerRole"> & Readonly<{
  id?: string;
}>;

export type MerchantStoreDraft = Omit<MerchantStore, "id"> & Readonly<{
  id?: string;
}>;

export type MerchantPosDeviceDraft = Omit<MerchantPosDevice, "id"> & Readonly<{
  id?: string;
}>;

export type MerchantPaymentTypeDraft = Omit<MerchantPaymentType, "id" | "sortOrder"> & Readonly<{
  id?: string;
  sortOrder?: number;
}>;

/**
 * Owner/Back Office administration boundary for POS-operational policy.
 *
 * This contract owns merchant intent. It is deliberately separate from the
 * device-specific EffectivePosConfigurationContract consumed by a branch POS.
 * Real cloud/sync transport is not implied by an implementation of this admin
 * contract; MAP-11 will connect the two through Rifad-owned transport.
 */
export interface PosConfigurationAdminContract {
  read(): Promise<MerchantPosConfiguration>;
  saveEmployee(input: { commandId: string; employee: MerchantEmployeeDraft }): Promise<MerchantPosConfiguration>;
  setEmployeePin(input: { commandId: string; employeeId: string; pin: string }): Promise<MerchantPosConfiguration>;
  saveRole(input: { commandId: string; role: MerchantRoleDraft }): Promise<MerchantPosConfiguration>;
  setFeature(input: { commandId: string; feature: PosFeatureKey; enabled: boolean }): Promise<MerchantPosConfiguration>;
  saveStore(input: { commandId: string; store: MerchantStoreDraft }): Promise<MerchantPosConfiguration>;
  saveDevice(input: { commandId: string; device: MerchantPosDeviceDraft }): Promise<MerchantPosConfiguration>;
  savePaymentType(input: { commandId: string; paymentType: MerchantPaymentTypeDraft }): Promise<MerchantPosConfiguration>;
  reorderPaymentTypes(input: { commandId: string; orderedIds: readonly string[] }): Promise<MerchantPosConfiguration>;
}
