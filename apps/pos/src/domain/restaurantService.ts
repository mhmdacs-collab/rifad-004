import type { Ticket } from "./models";

export type RestaurantServiceConfig = Readonly<{
  restaurantServiceEnabled: boolean;
  placeManagementEnabled: boolean;
}>;

/**
 * A service place is intentionally generic.
 * The cashier-facing identity comes from its group + name, not a hard-coded
 * table/room/session enum. Back Office can therefore model any venue language.
 */
export type ServicePlace = Readonly<{
  id: string;
  serviceAreaId: string;
  name: string;
}>;

/**
 * ServiceArea is the current contract name for a cashier-facing place group.
 * Examples: الطاولات، الغرف، الجلسات، VIP, or any owner-defined grouping.
 */
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
