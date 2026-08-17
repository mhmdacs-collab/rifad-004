import type { Ticket } from "./models";

export type RestaurantServiceConfig = Readonly<{
  restaurantServiceEnabled: boolean;
  placeManagementEnabled: boolean;
}>;

export type ServicePlaceKind = "table" | "room" | "session";

export type ServicePlace = Readonly<{
  id: string;
  serviceAreaId: string;
  name: string;
  kind: ServicePlaceKind;
}>;

export type ServiceArea = Readonly<{
  id: string;
  name: string;
  places: readonly ServicePlace[];
}>;

export type OpenLocalOrder = Readonly<{
  id: string;
  commandId: string;
  ticket: Ticket;
  serviceAreaId: string;
  serviceAreaName: string;
  servicePlaceId: string;
  servicePlaceName: string;
  openedAt: string;
  updatedAt: string;
  kitchenRevision: number;
}>;

export type RestaurantServiceSnapshot = Readonly<{
  config: RestaurantServiceConfig;
  openOrders: readonly OpenLocalOrder[];
}>;
