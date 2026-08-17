import { createMockRestaurantService } from "../adapters/mockRestaurantService";
import type { RestaurantServiceContract } from "../contracts/restaurantService";

/**
 * POS composition root for restaurant/local service.
 * Replace only this factory when selecting a production adapter.
 * UI/state modules must never import a concrete restaurant adapter directly.
 */
export const createRestaurantServiceAdapter = (): RestaurantServiceContract => {
  return createMockRestaurantService();
};
