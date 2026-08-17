import {
  createMockRestaurantService,
  LEGACY_ORDER_TYPES_KEY,
  migrateLegacyOrderTypePreference,
} from "../adapters/mockRestaurantService";
import type { RestaurantServiceContract } from "../contracts/restaurantService";
import { withRestaurantPersistenceJournal } from "./journaledRestaurantService";
import { createLocalPersistenceAdapter } from "./localPersistenceAdapter";

/**
 * POS composition root for restaurant/local service.
 * Replace only this factory when selecting a production adapter.
 * UI/state modules must never import a concrete restaurant adapter directly.
 */
export const createRestaurantServiceAdapter = (): RestaurantServiceContract => {
  const service = createMockRestaurantService();
  return withRestaurantPersistenceJournal(service, createLocalPersistenceAdapter());
};

/** Adapter-specific/legacy bootstrap also stops at the composition root. */
export const prepareRestaurantServiceCompatibility = () => {
  migrateLegacyOrderTypePreference();
};

/** Legacy test compatibility; ordinary product code must not depend on this key. */
export { LEGACY_ORDER_TYPES_KEY };
