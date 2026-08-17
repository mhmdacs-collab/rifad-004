import type {
  OpenLocalOrder,
  PlaceGroup,
  RestaurantServiceConfig,
} from "../domain/restaurantService";
import type { Ticket } from "../domain/models";

export const RESTAURANT_SERVICE_CONTRACT_VERSION = 1 as const;

export type RestaurantServiceAdapterInfo = Readonly<{
  adapterId: string;
  contractVersion: typeof RESTAURANT_SERVICE_CONTRACT_VERSION;
  transport: "mock" | "local" | "remote" | "embedded";
}>;

/**
 * Stable Rifad boundary for local/restaurant place service.
 * External schemas, IDs, SDK types, errors and lifecycle details must be translated
 * by the adapter before crossing this interface.
 */
export interface RestaurantServiceContract {
  readonly adapterInfo: RestaurantServiceAdapterInfo;
  getConfig(): Promise<RestaurantServiceConfig>;
  updateConfig(input: { config: RestaurantServiceConfig }): Promise<RestaurantServiceConfig>;
  listPlaceGroups(): Promise<readonly PlaceGroup[]>;
  listOpenOrders(): Promise<readonly OpenLocalOrder[]>;
  createOpenOrder(input: {
    commandId: string;
    ticket: Ticket;
    servicePlaceId: string;
  }): Promise<OpenLocalOrder>;
  getOpenOrder(input: { openOrderId: string }): Promise<OpenLocalOrder>;
  updateOpenOrder(input: {
    commandId: string;
    openOrderId: string;
    ticket: Ticket;
  }): Promise<OpenLocalOrder>;
  closeOpenOrder(input: { openOrderId: string }): Promise<void>;
}
