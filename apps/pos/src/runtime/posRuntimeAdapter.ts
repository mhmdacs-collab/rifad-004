import { createMockPosRuntime } from "../adapters/mockPos";
import type { PosRuntimeContract } from "../contracts/pos";
import {
  createAuthorizationAdapter,
  createEffectivePosConfigurationAdapter,
  createManagerOverrideAdapter,
} from "./effectivePosConfigurationAdapter";
import { withLocalPersistenceJournal } from "./journaledPosRuntime";
import { createLegacySnapshotBridge } from "./legacySnapshotBridge";
import { createLocalPersistenceAdapter } from "./localPersistenceAdapter";

export const POS_RUNTIME_SNAPSHOT_NAMESPACE = "pos.runtime";
export const POS_RUNTIME_SNAPSHOT_SCHEMA_VERSION = 1;
/** Compatibility only; new product code must not read this key. */
export const LEGACY_POS_RUNTIME_STORAGE_KEY = "rifad.pos.mock.v1";

export type PosRuntimeAdapterInfo = Readonly<{
  id: string;
  contractVersion: 1;
  transport: "local" | "remote-api" | "hybrid";
  implementation: "mock" | "external" | "rifad-native";
}>;

/**
 * Single composition point for the general POS runtime.
 *
 * The current mock still expects its historical localStorage key internally.
 * A temporary migration bridge hydrates that key from the Rifad-owned durable
 * namespace before construction, then journaled mutations mirror the current
 * snapshot back through LocalPersistenceContract. Replacing the mock removes
 * this bridge without changing UI/state contracts.
 *
 * MAP-01 configuration and authorization are composed here as independent
 * Rifad-owned capabilities. They do not live inside the legacy mock and they do
 * not select a synchronization provider or production local database.
 */
export const POS_RUNTIME_ADAPTER_INFO: PosRuntimeAdapterInfo = {
  id: "rifad-mock-pos",
  contractVersion: 1,
  transport: "local",
  implementation: "mock",
};

export const createPosRuntimeAdapter = (): PosRuntimeContract => {
  const persistence = createLocalPersistenceAdapter();
  const snapshotBridge = createLegacySnapshotBridge({
    persistence,
    namespace: POS_RUNTIME_SNAPSHOT_NAMESPACE,
    schemaVersion: POS_RUNTIME_SNAPSHOT_SCHEMA_VERSION,
    legacyStorageKey: LEGACY_POS_RUNTIME_STORAGE_KEY,
  });
  const legacyRuntime = createMockPosRuntime();
  const persistedEffectiveConfiguration = createEffectivePosConfigurationAdapter(persistence);

  // A previously linked browser can restore the legacy device before the newer
  // Rifad LocalPersistence root exists (for example after upgrading from the
  // pre-MAP-01 build or after local staging storage was cleared). Ensure the
  // local node binding is repaired at the exact configuration-read boundary so
  // a real restart cannot leave Payment Methods/permissions permanently empty.
  const effectiveConfiguration = {
    read: async () => {
      const restoredDevice = legacyRuntime.restore().device;
      if (restoredDevice) {
        const context = await persistence.getNodeContext();
        if (context.branchId !== restoredDevice.branchId || context.deviceId !== restoredDevice.deviceId) {
          await persistence.bindDevice({
            branchId: restoredDevice.branchId,
            deviceId: restoredDevice.deviceId,
          });
        }
      }
      return persistedEffectiveConfiguration.read();
    },
  };

  const authorization = createAuthorizationAdapter(effectiveConfiguration);
  const managerOverride = createManagerOverrideAdapter(effectiveConfiguration, authorization, persistence);
  const runtime: PosRuntimeContract = {
    ...legacyRuntime,
    effectiveConfiguration,
    authorization,
    managerOverride,
  };
  return withLocalPersistenceJournal(runtime, persistence, snapshotBridge);
};
