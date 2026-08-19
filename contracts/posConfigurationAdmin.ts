import {
  POS_PERMISSION_KEYS,
  type DeliveryChannelKind,
  type DeliveryCodSettlement,
  type PosFeatureKey,
  type PosPaymentAvailability,
  type PosPaymentDirectImpact,
  type PosPaymentMethodKind,
  type PosPermissionKey,
  type PosSystemDefaultPayment,
  type SelfDeliveryFeeBeneficiary,
} from "./posConfiguration";

export const POS_CONFIGURATION_ADMIN_CONTRACT_VERSION = 1 as const;

export const BACK_OFFICE_PERMISSION_KEYS = [
  "access-back-office",
  "view-sales-reports",
  "cancel-receipts",
  "manage-items",
  "manage-inventory",
  "view-item-cost",
  "manage-employees",
  "manage-customers",
  "edit-general-settings",
  "manage-stores",
  "manage-pos-devices",
  "manage-payment-types",
  "manage-loyalty",
  "manage-taxes",
  "manage-kitchen-routing",
  "manage-dining-options",
  "manage-billing",
] as const;

export type BackOfficePermissionKey = (typeof BACK_OFFICE_PERMISSION_KEYS)[number];

export const MERCHANT_PERMISSION_KEYS = [
  ...POS_PERMISSION_KEYS,
  ...BACK_OFFICE_PERMISSION_KEYS,
] as const;

export type MerchantPermissionKey = PosPermissionKey | BackOfficePermissionKey;

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
  permissions: readonly MerchantPermissionKey[];
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
  /** Optional only for persisted MAP-01 staging records created before this field existed. */
  directImpact?: PosPaymentDirectImpact;
  /** Stable starter identity; the merchant may hide it without deleting historical meaning. */
  systemDefault?: PosSystemDefaultPayment | null;
}>;

export type MerchantDeliveryChannel = Readonly<{
  id: string;
  name: string;
  kind: DeliveryChannelKind;
  brandKey: string;
  enabled: boolean;
  electronicPaymentEnabled: boolean;
  cashOnDeliveryEnabled: boolean;
  codSettlement: DeliveryCodSettlement;
  storeIds: readonly string[];
  selfDelivery: Readonly<{
    feeMode: "manual";
    defaultFeeHalalas: number;
    allowPosFeeOverride: boolean;
    feeBeneficiary: SelfDeliveryFeeBeneficiary;
  }> | null;
}>;

export type MerchantDeliveryConfiguration = Readonly<{
  enabled: boolean;
  channels: readonly MerchantDeliveryChannel[];
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
  /** Optional only for pre-extension staging snapshots. Browser adapter migrates it on read. */
  delivery?: MerchantDeliveryConfiguration;
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

/**
 * directImpact is optional in the draft so older Back Office editors keep
 * compiling; adapters derive a safe default from kind when it is omitted.
 */
export type MerchantPaymentTypeDraft = Omit<MerchantPaymentType, "id" | "sortOrder" | "directImpact"> & Readonly<{
  id?: string;
  sortOrder?: number;
  directImpact?: PosPaymentDirectImpact;
}>;

/**
 * Owner/Back Office administration boundary for POS-operational policy.
 *
 * The merchant role model intentionally contains both branch-POS permissions
 * and Back Office permissions because Loyverse's mature Access Rights baseline
 * administers one employee role across the product. The POS projection later
 * strips the Back Office-only permissions and carries only locally enforceable
 * POS capabilities to the branch device.
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
  /** Optional for compatibility with non-browser proof adapters created before delivery settings existed. */
  saveDeliveryConfiguration?(input: { commandId: string; delivery: MerchantDeliveryConfiguration }): Promise<MerchantPosConfiguration>;
}
