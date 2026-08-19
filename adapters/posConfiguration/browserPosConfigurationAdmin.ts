import type {
  MerchantPosConfiguration,
  PosConfigurationAdminContract,
} from "../../contracts/posConfigurationAdmin";
import {
  createDefaultMerchantPosConfiguration,
  markMerchantEmployeePinConfigured,
  reorderMerchantPaymentTypes,
  saveMerchantDevice,
  saveMerchantEmployee,
  saveMerchantPaymentType,
  saveMerchantRole,
  saveMerchantStore,
  setMerchantFeature,
  PosConfigurationAdminError,
} from "../../core/posConfiguration/configurationAdminRules";

export const BROWSER_POS_CONFIGURATION_ADMIN_STORAGE_KEY = "rifad.pos-configuration-admin.staging.v1";
export const BROWSER_POS_CONFIGURATION_ADMIN_SCHEMA_VERSION = 1 as const;

export type BrowserPosConfigurationAdminState = Readonly<{
  schemaVersion: typeof BROWSER_POS_CONFIGURATION_ADMIN_SCHEMA_VERSION;
  configuration: MerchantPosConfiguration;
  completedCommandIds: readonly string[];
  /**
   * Staging-only SHA-256 fingerprints used solely to prove unique PIN setup
   * semantics without persisting raw PINs. A four-digit PIN has low entropy, so
   * this is NOT a production credential verifier or security claim.
   */
  pinFingerprints: Readonly<Record<string, string>>;
}>;

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const now = () => new Date().toISOString();
const newId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;

const defaultState = (): BrowserPosConfigurationAdminState => ({
  schemaVersion: BROWSER_POS_CONFIGURATION_ADMIN_SCHEMA_VERSION,
  configuration: createDefaultMerchantPosConfiguration(),
  completedCommandIds: [],
  pinFingerprints: {},
});

const parseState = (raw: string | null): BrowserPosConfigurationAdminState => {
  if (!raw) return defaultState();
  try {
    const parsed = JSON.parse(raw) as Partial<BrowserPosConfigurationAdminState>;
    if (parsed.schemaVersion !== BROWSER_POS_CONFIGURATION_ADMIN_SCHEMA_VERSION || !parsed.configuration) return defaultState();
    return {
      schemaVersion: BROWSER_POS_CONFIGURATION_ADMIN_SCHEMA_VERSION,
      configuration: parsed.configuration,
      completedCommandIds: Array.isArray(parsed.completedCommandIds) ? parsed.completedCommandIds.filter((id): id is string => typeof id === "string") : [],
      pinFingerprints: parsed.pinFingerprints && typeof parsed.pinFingerprints === "object" ? parsed.pinFingerprints : {},
    };
  } catch {
    return defaultState();
  }
};

const pinFingerprint = async (pin: string) => {
  const bytes = new TextEncoder().encode(`rifad-map01-staging-pin:${pin}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
};

export const createBrowserPosConfigurationAdmin = (
  storage: Storage = window.localStorage,
  storageKey = BROWSER_POS_CONFIGURATION_ADMIN_STORAGE_KEY,
): PosConfigurationAdminContract => {
  let state = parseState(storage.getItem(storageKey));

  const persist = () => storage.setItem(storageKey, JSON.stringify(state));
  const read = () => clone(state.configuration);
  const completed = (commandId: string) => state.completedCommandIds.includes(commandId);

  const commit = (
    commandId: string,
    configuration: MerchantPosConfiguration,
    pinFingerprints = state.pinFingerprints,
  ) => {
    const commandIds = [...state.completedCommandIds, commandId].slice(-500);
    state = {
      schemaVersion: BROWSER_POS_CONFIGURATION_ADMIN_SCHEMA_VERSION,
      configuration,
      completedCommandIds: commandIds,
      pinFingerprints,
    };
    persist();
    return read();
  };

  return {
    read: async () => read(),
    saveEmployee: async ({ commandId, employee }) => {
      if (completed(commandId)) return read();
      const id = employee.id ?? newId("employee");
      return commit(commandId, saveMerchantEmployee({ config: state.configuration, draft: employee, id, updatedAt: now() }));
    },
    setEmployeePin: async ({ commandId, employeeId, pin }) => {
      if (completed(commandId)) return read();
      if (!/^\d{4}$/.test(pin)) {
        throw new PosConfigurationAdminError("INVALID_EMPLOYEE_PIN", "الرقم السري يجب أن يتكون من أربعة أرقام.");
      }
      const fingerprint = await pinFingerprint(pin);
      const conflict = Object.entries(state.pinFingerprints).find(([id, value]) => id !== employeeId && value === fingerprint);
      if (conflict) {
        throw new PosConfigurationAdminError("EMPLOYEE_PIN_CONFLICT", "الرقم السري مستخدم لموظف آخر.");
      }
      const configuration = markMerchantEmployeePinConfigured({ config: state.configuration, employeeId, pin, updatedAt: now() });
      return commit(commandId, configuration, { ...state.pinFingerprints, [employeeId]: fingerprint });
    },
    saveRole: async ({ commandId, role }) => {
      if (completed(commandId)) return read();
      const id = role.id ?? newId("role");
      return commit(commandId, saveMerchantRole({ config: state.configuration, draft: role, id, updatedAt: now() }));
    },
    setFeature: async ({ commandId, feature, enabled }) => {
      if (completed(commandId)) return read();
      return commit(commandId, setMerchantFeature({ config: state.configuration, feature, enabled, updatedAt: now() }));
    },
    saveStore: async ({ commandId, store }) => {
      if (completed(commandId)) return read();
      const id = store.id ?? newId("store");
      return commit(commandId, saveMerchantStore({ config: state.configuration, draft: store, id, updatedAt: now() }));
    },
    saveDevice: async ({ commandId, device }) => {
      if (completed(commandId)) return read();
      const id = device.id ?? newId("pos-device");
      return commit(commandId, saveMerchantDevice({ config: state.configuration, draft: device, id, updatedAt: now() }));
    },
    savePaymentType: async ({ commandId, paymentType }) => {
      if (completed(commandId)) return read();
      const id = paymentType.id ?? newId("payment-type");
      return commit(commandId, saveMerchantPaymentType({ config: state.configuration, draft: paymentType, id, updatedAt: now() }));
    },
    reorderPaymentTypes: async ({ commandId, orderedIds }) => {
      if (completed(commandId)) return read();
      return commit(commandId, reorderMerchantPaymentTypes({ config: state.configuration, orderedIds, updatedAt: now() }));
    },
  };
};
