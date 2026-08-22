import type { Ticket } from "./models";
import type { KitchenDispatchBatch } from "./kitchenDelta";

export type RestaurantServiceConfig = Readonly<{
  restaurantServiceEnabled: boolean;
  placeManagementEnabled: boolean;
}>;

/**
 * Rifad-owned generic place identity. External systems may call this a table,
 * room, seat, section item, booth, or something else; adapters normalize it.
 */
export type ServicePlace = Readonly<{
  id: string;
  placeGroupId: string;
  name: string;
}>;

/**
 * Cashier-facing configurable grouping layer owned by Rifad.
 * Donor/API terms such as floor, zone, section, room group, etc. stop at the adapter.
 */
export type PlaceGroup = Readonly<{
  id: string;
  name: string;
  places: readonly ServicePlace[];
}>;

export type OpenLocalOrder = Readonly<{
  id: string;
  commandId: string;
  ticket: Ticket;
  placeGroupId: string;
  placeGroupName: string;
  servicePlaceId: string;
  servicePlaceName: string;
  openedAt: string;
  updatedAt: string;
  kitchenRevision: number;
  kitchenBatches: readonly KitchenDispatchBatch[];
  /** Last accepted update command, including metadata-only updates. */
  lastMutationCommandId?: string;
  /** Bounded idempotency memory for retries after later mutations. */
  mutationCommandIds?: readonly string[];
}>;

export type RestaurantServiceSnapshot = Readonly<{
  config: RestaurantServiceConfig;
  openOrders: readonly OpenLocalOrder[];
}>;
