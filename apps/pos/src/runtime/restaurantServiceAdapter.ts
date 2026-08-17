import {
  createMockRestaurantService,
  LEGACY_ORDER_TYPES_KEY,
  migrateLegacyOrderTypePreference,
  RESTAURANT_SERVICE_STORAGE_KEY,
} from "../adapters/mockRestaurantService";
import type { RestaurantServiceContract } from "../contracts/restaurantService";
import { withRestaurantPersistenceJournal } from "./journaledRestaurantService";
import { createLegacySnapshotBridge } from "./legacySnapshotBridge";
import { createLocalPersistenceAdapter } from "./localPersistenceAdapter";

export const RESTAURANT_SERVICE_SNAPSHOT_NAMESPACE = "restaurant.service";
export const RESTAURANT_SERVICE_SNAPSHOT_SCHEMA_VERSION = 1;

/**
 * POS composition root for restaurant/local service.
 * Replace only this factory when selecting a production adapter.
 * UI/state modules must never import a concrete restaurant adapter directly.
 */
export const createRestaurantServiceAdapter = (): RestaurantServiceContract => {
  const persistence = createLocalPersistenceAdapter();
  const snapshotBridge = createLegacySnapshotBridge({
    persistence,
    namespace: RESTAURANT_SERVICE_SNAPSHOT_NAMESPACE,
    schemaVersion: RESTAURANT_SERVICE_SNAPSHOT_SCHEMA_VERSION,
    legacyStorageKey: RESTAURANT_SERVICE_STORAGE_KEY,
  });
  const service = createMockRestaurantService();
  return withRestaurantPersistenceJournal(service, persistence, snapshotBridge);
};

/** Adapter-specific/legacy bootstrap also stops at the composition root. */
export const prepareRestaurantServiceCompatibility = () => {
  migrateLegacyOrderTypePreference();
};

/** Legacy test compatibility; ordinary product code must not depend on this key. */
export { LEGACY_ORDER_TYPES_KEY };
