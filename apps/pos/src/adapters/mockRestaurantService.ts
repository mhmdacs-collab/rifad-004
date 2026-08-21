import type { RestaurantServiceContract } from "../contracts/restaurantService";
import { RESTAURANT_SERVICE_CONTRACT_VERSION } from "../contracts/restaurantService";
import type {
  OpenLocalOrder,
  PlaceGroup,
  RestaurantServiceConfig,
  RestaurantServiceSnapshot,
  ServicePlace,
} from "../domain/restaurantService";
import type { Ticket } from "../domain/models";
import { PosContractError } from "../contracts/pos";
import {
  diffKitchenTickets,
  ticketToKitchenAdditions,
  type KitchenDispatchBatch,
  type KitchenDeltaLine,
} from "../domain/kitchenDelta";

export const RESTAURANT_SERVICE_STORAGE_KEY = "rifad.pos.restaurant-service.v1";
export const LEGACY_ORDER_TYPES_KEY = "rifad.pos.visible-order-types.v1";
const LEGACY_MIGRATION_KEY = "rifad.pos.restaurant-service.order-types-migrated.v1";
const WAIT_MS = import.meta.env.MODE === "test" ? 0 : 120;

const defaultConfig: RestaurantServiceConfig = {
  restaurantServiceEnabled: true,
  placeManagementEnabled: true,
};

const place = (placeGroupId: string, id: string, name: string): ServicePlace => ({
  id,
  placeGroupId,
  name,
});

/**
 * Owner-review default: one generic group named "الطاولات" with six places.
 * Rooms, sessions, VIP groups, extra tables, or any other labels are not seeded
 * by the POS. They will be created later from Back Office configuration.
 */
export const DEMO_PLACE_GROUPS: readonly PlaceGroup[] = [
  {
    id: "group-tables",
    name: "الطاولات",
    places: [
      place("group-tables", "table-01", "طاولة 1"),
      place("group-tables", "table-02", "طاولة 2"),
      place("group-tables", "table-03", "طاولة 3"),
      place("group-tables", "table-04", "طاولة 4"),
      place("group-tables", "table-05", "طاولة 5"),
      place("group-tables", "table-06", "طاولة 6"),
    ],
  },
];

const emptySnapshot = (): RestaurantServiceSnapshot => ({
  config: defaultConfig,
  openOrders: [],
});

const cloneTicket = (ticket: Ticket): Ticket => JSON.parse(JSON.stringify(ticket)) as Ticket;
const pause = () => new Promise<void>((resolve) => window.setTimeout(resolve, WAIT_MS));
const createId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;

const createKitchenBatch = (
  id: string,
  commandId: string,
  revision: number,
  sentAt: string,
  lines: readonly KitchenDeltaLine[],
): KitchenDispatchBatch => ({
  id,
  commandId,
  revision,
  sentAt,
  lines: lines.map((line) => ({ ...line, id: `${id}:${line.id}` })),
});

const findPlace = (servicePlaceId: string) => {
  for (const group of DEMO_PLACE_GROUPS) {
    const found = group.places.find((item) => item.id === servicePlaceId);
    if (found) return { group, place: found };
  }
  return null;
};

export const migrateLegacyOrderTypePreference = () => {
  if (typeof window === "undefined") return;
  try {
    if (window.localStorage.getItem(LEGACY_MIGRATION_KEY) === "1") return;
    window.localStorage.removeItem(LEGACY_ORDER_TYPES_KEY);
    window.localStorage.setItem(LEGACY_MIGRATION_KEY, "1");
  } catch {
    // Best-effort migration for the UI prototype.
  }
};

type StoredOpenLocalOrder = Partial<OpenLocalOrder> & {
  serviceAreaId?: string;
  serviceAreaName?: string;
};

const normalizeStoredOrder = (value: StoredOpenLocalOrder): OpenLocalOrder | null => {
  if (!value.id || !value.commandId || !value.ticket || !value.servicePlaceId || !value.servicePlaceName || !value.openedAt || !value.updatedAt) {
    return null;
  }
  const placeGroupId = value.placeGroupId ?? value.serviceAreaId;
  const placeGroupName = value.placeGroupName ?? value.serviceAreaName;
  if (!placeGroupId || !placeGroupName) return null;
  const kitchenRevision = value.kitchenRevision ?? 1;
  const legacyBatch = createKitchenBatch(
    `${value.id}:kitchen:1`,
    value.commandId,
    1,
    value.updatedAt,
    ticketToKitchenAdditions(value.ticket),
  );
  return {
    id: value.id,
    commandId: value.commandId,
    ticket: value.ticket,
    placeGroupId,
    placeGroupName,
    servicePlaceId: value.servicePlaceId,
    servicePlaceName: value.servicePlaceName,
    openedAt: value.openedAt,
    updatedAt: value.updatedAt,
    kitchenRevision,
    kitchenBatches: Array.isArray(value.kitchenBatches) && value.kitchenBatches.length > 0
      ? value.kitchenBatches
      : [legacyBatch],
  };
};

export const readRestaurantServiceSnapshot = (): RestaurantServiceSnapshot => {
  if (typeof window === "undefined") return emptySnapshot();
  try {
    const raw = window.localStorage.getItem(RESTAURANT_SERVICE_STORAGE_KEY);
    if (!raw) return emptySnapshot();
    const parsed = JSON.parse(raw) as Partial<RestaurantServiceSnapshot> & { openOrders?: StoredOpenLocalOrder[] };
    const config: RestaurantServiceConfig = {
      restaurantServiceEnabled: parsed.config?.restaurantServiceEnabled ?? true,
      placeManagementEnabled: (parsed.config?.restaurantServiceEnabled ?? true)
        ? (parsed.config?.placeManagementEnabled ?? true)
        : false,
    };
    const openOrders = Array.isArray(parsed.openOrders)
      ? parsed.openOrders.map(normalizeStoredOrder).filter((order): order is OpenLocalOrder => order !== null)
      : [];
    return { config, openOrders };
  } catch {
    return emptySnapshot();
  }
};

class MockRestaurantServiceStore {
  private snapshot = readRestaurantServiceSnapshot();

  private persist() {
    window.localStorage.setItem(RESTAURANT_SERVICE_STORAGE_KEY, JSON.stringify(this.snapshot));
  }

  async getConfig() {
    await pause();
    return this.snapshot.config;
  }

  async updateConfig(config: RestaurantServiceConfig) {
    await pause();
    const normalized: RestaurantServiceConfig = {
      restaurantServiceEnabled: config.restaurantServiceEnabled,
      placeManagementEnabled: config.restaurantServiceEnabled && config.placeManagementEnabled,
    };
    if (this.snapshot.openOrders.length > 0) {
      if (!normalized.restaurantServiceEnabled || !normalized.placeManagementEnabled) {
        throw new PosContractError(
          "OPEN_LOCAL_ORDERS_EXIST",
          "أغلق الطلبات المحلية المفتوحة قبل إيقاف خدمة المطعم أو إدارة الأماكن.",
        );
      }
    }
    this.snapshot = { ...this.snapshot, config: normalized };
    this.persist();
    return normalized;
  }

  async listPlaceGroups() {
    await pause();
    return DEMO_PLACE_GROUPS;
  }

  async listOpenOrders() {
    await pause();
    return [...this.snapshot.openOrders].sort((a, b) => a.openedAt.localeCompare(b.openedAt));
  }

  async createOpenOrder(commandId: string, ticket: Ticket, servicePlaceId: string) {
    await pause();
    if (ticket.lines.length === 0) throw new PosContractError("EMPTY_TICKET", "أضف صنفًا واحدًا على الأقل قبل اختيار المحلي.");
    const prior = this.snapshot.openOrders.find((order) => order.commandId === commandId);
    if (prior) return prior;
    const resolved = findPlace(servicePlaceId);
    if (!resolved) throw new PosContractError("SERVICE_PLACE_NOT_FOUND", "تعذر العثور على المكان المحدد.");
    if (this.snapshot.openOrders.some((order) => order.servicePlaceId === servicePlaceId)) {
      throw new PosContractError("SERVICE_PLACE_OCCUPIED", "هذا المكان مرتبط بطلب مفتوح بالفعل.");
    }
    const now = new Date().toISOString();
    const orderId = createId("local-order");
    const batchId = createId("kitchen-batch");
    const order: OpenLocalOrder = {
      id: orderId,
      commandId,
      ticket: cloneTicket(ticket),
      placeGroupId: resolved.group.id,
      placeGroupName: resolved.group.name,
      servicePlaceId: resolved.place.id,
      servicePlaceName: resolved.place.name,
      openedAt: now,
      updatedAt: now,
      kitchenRevision: 1,
      kitchenBatches: [createKitchenBatch(batchId, commandId, 1, now, ticketToKitchenAdditions(ticket))],
    };
    this.snapshot = { ...this.snapshot, openOrders: [...this.snapshot.openOrders, order] };
    this.persist();
    return order;
  }

  async getOpenOrder(openOrderId: string) {
    await pause();
    const order = this.snapshot.openOrders.find((item) => item.id === openOrderId);
    if (!order) throw new PosContractError("OPEN_LOCAL_ORDER_NOT_FOUND", "تعذر العثور على الطلب المحلي المفتوح.");
    return order;
  }

  async updateOpenOrder(commandId: string, openOrderId: string, ticket: Ticket) {
    await pause();
    const index = this.snapshot.openOrders.findIndex((item) => item.id === openOrderId);
    if (index < 0) throw new PosContractError("OPEN_LOCAL_ORDER_NOT_FOUND", "تعذر العثور على الطلب المحلي المفتوح.");
    const current = this.snapshot.openOrders[index]!;
    const repeated = current.kitchenBatches.find((batch) => batch.commandId === commandId);
    if (repeated) return current;
    const lines = diffKitchenTickets(current.ticket, ticket);
    if (lines.length === 0) {
      throw new PosContractError("EMPTY_KITCHEN_DELTA", "لا توجد تغييرات جديدة لإرسالها إلى المطبخ.");
    }
    const updatedAt = new Date().toISOString();
    const revision = current.kitchenRevision + 1;
    const batch = createKitchenBatch(createId("kitchen-batch"), commandId, revision, updatedAt, lines);
    const updated: OpenLocalOrder = {
      ...current,
      commandId,
      ticket: cloneTicket(ticket),
      updatedAt,
      kitchenRevision: revision,
      kitchenBatches: [...current.kitchenBatches, batch],
    };
    const openOrders = [...this.snapshot.openOrders];
    openOrders[index] = updated;
    this.snapshot = { ...this.snapshot, openOrders };
    this.persist();
    return updated;
  }

  async closeOpenOrder(openOrderId: string) {
    await pause();
    this.snapshot = { ...this.snapshot, openOrders: this.snapshot.openOrders.filter((order) => order.id !== openOrderId) };
    this.persist();
  }
}

export const createMockRestaurantService = (): RestaurantServiceContract => {
  const store = new MockRestaurantServiceStore();
  return {
    adapterInfo: {
      adapterId: "rifad.mock.restaurant-service",
      contractVersion: RESTAURANT_SERVICE_CONTRACT_VERSION,
      transport: "mock",
    },
    getConfig: () => store.getConfig(),
    updateConfig: ({ config }) => store.updateConfig(config),
    listPlaceGroups: () => store.listPlaceGroups(),
    listOpenOrders: () => store.listOpenOrders(),
    createOpenOrder: ({ commandId, ticket, servicePlaceId }) => store.createOpenOrder(commandId, ticket, servicePlaceId),
    getOpenOrder: ({ openOrderId }) => store.getOpenOrder(openOrderId),
    updateOpenOrder: ({ commandId, openOrderId, ticket }) => store.updateOpenOrder(commandId, openOrderId, ticket),
    closeOpenOrder: ({ openOrderId }) => store.closeOpenOrder(openOrderId),
  };
};
