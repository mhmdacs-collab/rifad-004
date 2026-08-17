import type {
  OpenLocalOrder,
  RestaurantServiceConfig,
  ServiceArea,
} from "../domain/restaurantService";
import type { Ticket } from "../domain/models";

export interface RestaurantServiceContract {
  getConfig(): Promise<RestaurantServiceConfig>;
  updateConfig(input: { config: RestaurantServiceConfig }): Promise<RestaurantServiceConfig>;
  listAreas(): Promise<readonly ServiceArea[]>;
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
