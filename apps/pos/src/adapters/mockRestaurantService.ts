import type { RestaurantServiceContract } from "../contracts/restaurantService";
import { RESTAURANT_SERVICE_CONTRACT_VERSION } from "../contracts/restaurantService";
import type {
  OpenLocalOrder,
  PlaceGroup,
  RestaurantServiceConfig,
  RestaurantServiceSnapshot,
  ServicePlace,
} from "../domain/restaurantService";
import type { Ticket, TicketLine } from "../domain/models";
import { PosContractError } from "../contracts/pos";
import {
  kitchenStateOf,
  markTicketLinesSent,
  pendingTicketToKitchenAdditions,
  sentTicketToKitchenCorrections,
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
const cloneOpenOrder = (order: OpenLocalOrder): OpenLocalOrder => JSON.parse(JSON.stringify(order)) as OpenLocalOrder;
const repairTicketTotals = (ticket: Ticket): Ticket => {
  const computedSubtotal = ticket.lines.reduce((sum, line) => sum + line.unitPrice.halalas * line.quantity, 0);
  const persistedSubtotal = ticket.subtotal?.halalas ?? 0;
  // Older open-order snapshots could carry a non-empty ticket with SAR 0.00.
  // Rebuild that impossible total from the immutable line price snapshots while
  // retaining valid discounts when they are present.
  const subtotalHalalas = ticket.lines.length > 0 && persistedSubtotal <= 0
    ? computedSubtotal
    : Math.max(0, persistedSubtotal);
  const redemptionHalalas = Math.min(Math.max(0, ticket.loyaltyRedemption?.halalas ?? 0), subtotalHalalas);
  const totalHalalas = Math.max(0, subtotalHalalas - redemptionHalalas);
  return {
    ...ticket,
    subtotal: { halalas: subtotalHalalas, currency: "SAR" },
    loyaltyRedemption: { halalas: redemptionHalalas, currency: "SAR" },
    taxIncluded: { halalas: Math.round((totalHalalas * 15) / 115), currency: "SAR" },
    total: { halalas: totalHalalas, currency: "SAR" },
  };
};
const committedTicket = (ticket: Ticket): Ticket => markTicketLinesSent(repairTicketTotals(cloneTicket(ticket)));
const pause = () => new Promise<void>((resolve) => window.setTimeout(resolve, WAIT_MS));
const createId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;

const quantitiesByProduct = (lines: readonly TicketLine[]) => {
  const quantities = new Map<string, number>();
  for (const line of lines) quantities.set(line.productId, (quantities.get(line.productId) ?? 0) + line.quantity);
  return quantities;
};

const sameMoney = (left: Ticket["total"], right: Ticket["total"]) =>
  left.halalas === right.halalas && left.currency === right.currency;

const sameTicketBusinessContent = (left: Ticket, right: Ticket) => {
  if (left.id !== right.id || left.sequence !== right.sequence) return false;
  if (JSON.stringify(left.customer) !== JSON.stringify(right.customer)) return false;
  if (!sameMoney(left.subtotal, right.subtotal)
    || !sameMoney(left.loyaltyRedemption, right.loyaltyRedemption)
    || !sameMoney(left.taxIncluded, right.taxIncluded)
    || !sameMoney(left.total, right.total)) return false;
  const normalizeLines = (lines: readonly TicketLine[]) => lines
    .map((line) => ({
      productId: line.productId,
      id: line.id,
      name: line.name,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      tone: line.tone,
      kitchenState: line.kitchenState,
    }))
    .sort((a, b) => `${a.productId}:${a.id}:${a.unitPrice.halalas}:${a.quantity}:${a.name}`.localeCompare(`${b.productId}:${b.id}:${b.unitPrice.halalas}:${b.quantity}:${b.name}`));
  return JSON.stringify(normalizeLines(left.lines)) === JSON.stringify(normalizeLines(right.lines));
};

/**
 * Convert a working ticket into the one pending batch represented by the
 * current ownership markers. Legacy callers without markers are supported by
 * deriving the positive quantity delta against the committed ticket.
 */
const pendingLinesForUpdate = (committed: Ticket, proposed: Ticket): readonly TicketLine[] => {
  const hasOwnershipMarkers = proposed.lines.some((line) => line.kitchenState !== undefined);
  const explicit = hasOwnershipMarkers
    ? proposed.lines.filter((line) => kitchenStateOf(line) === "pending")
    : [];
  if (explicit.length > 0) return explicit;

  const before = quantitiesByProduct(committed.lines);
  const after = quantitiesByProduct(proposed.lines);
  const result: TicketLine[] = [];
  for (const [productId, quantity] of after) {
    const delta = quantity - (before.get(productId) ?? 0);
    if (delta <= 0) continue;
    const representative = proposed.lines.find((line) => line.productId === productId);
    if (!representative) continue;
    result.push({ ...representative, id: createId("pending-line"), quantity: delta, kitchenState: "pending" });
  }
  return result;
};

const hasSentQuantityReduction = (committed: Ticket, proposed: Ticket) => {
  const before = quantitiesByProduct(committed.lines);
  const after = quantitiesByProduct(proposed.lines);
  for (const [productId, quantity] of before) {
    if ((after.get(productId) ?? 0) < quantity) return true;
  }
  return false;
};

const hasSentLineSnapshotMutation = (committed: Ticket, proposed: Ticket) => {
  const hasOwnershipMarkers = proposed.lines.some((line) => line.kitchenState !== undefined);
  if (hasOwnershipMarkers) {
    const proposedById = new Map(proposed.lines.map((line) => [line.id, line]));
    return committed.lines.some((line) => {
      const candidate = proposedById.get(line.id);
      // A missing sent line is a cancellation candidate, not a snapshot
      // mutation. The caller must still opt into the explicit correction path.
      if (!candidate) return false;
      return kitchenStateOf(candidate) !== "sent"
          || candidate.productId !== line.productId
          || candidate.name !== line.name
          || candidate.tone !== line.tone
          || candidate.unitPrice.halalas !== line.unitPrice.halalas
          || candidate.unitPrice.currency !== line.unitPrice.currency
          || candidate.quantity > line.quantity;
    });
  }

  // Legacy callers did not preserve line IDs. Compare the committed product
  // snapshot against a representative proposed line while quantity floors are
  // checked separately.
  return committed.lines.some((line) => {
    const candidate = proposed.lines.find((item) => item.productId === line.productId);
    if (!candidate) return false;
    return candidate.name !== line.name
      || candidate.tone !== line.tone
      || candidate.unitPrice.halalas !== line.unitPrice.halalas
      || candidate.unitPrice.currency !== line.unitPrice.currency
      || candidate.quantity > line.quantity;
  });
};

const hasSentLineQuantityReduction = (committed: Ticket, proposed: Ticket) => {
  if (!proposed.lines.some((line) => line.kitchenState !== undefined)) return false;
  const proposedById = new Map(proposed.lines.map((line) => [line.id, line]));
  return committed.lines.some((line) => {
    const candidate = proposedById.get(line.id);
    if (!candidate) return false;
    return candidate.quantity < line.quantity;
  });
};

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
  const storedBatches = Array.isArray(value.kitchenBatches) ? value.kitchenBatches : [];
  const legacyBatch = createKitchenBatch(
    `${value.id}:kitchen:1`,
    value.commandId,
    1,
    value.updatedAt,
    ticketToKitchenAdditions(value.ticket),
  );
  const kitchenBatches = storedBatches.length > 0 ? storedBatches : [legacyBatch];
  const maxBatchRevision = kitchenBatches.reduce((max, batch) => Math.max(max, batch.revision), 0);
  const kitchenRevision = Math.max(1, value.kitchenRevision ?? 0, maxBatchRevision, kitchenBatches.length);
  const mutationCommandIds = Array.isArray(value.mutationCommandIds)
    ? value.mutationCommandIds.filter((item): item is string => typeof item === "string").slice(-32)
    : (value.lastMutationCommandId ? [value.lastMutationCommandId] : []);
  return {
    id: value.id,
    commandId: value.commandId,
    // Legacy snapshots did not carry ownership markers. Their persisted
    // ticket is already the last committed table total, so promote it to the
    // immutable sent representation during hydration.
    ticket: committedTicket(value.ticket),
    placeGroupId,
    placeGroupName,
    servicePlaceId: value.servicePlaceId,
    servicePlaceName: value.servicePlaceName,
    openedAt: value.openedAt,
    updatedAt: value.updatedAt,
    kitchenRevision,
    kitchenBatches,
    lastMutationCommandId: value.lastMutationCommandId,
    mutationCommandIds,
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
    return [...this.snapshot.openOrders]
      .sort((a, b) => a.openedAt.localeCompare(b.openedAt))
      .map(cloneOpenOrder);
  }

  async createOpenOrder(commandId: string, ticket: Ticket, servicePlaceId: string) {
    await pause();
    const prior = this.snapshot.openOrders.find((order) => order.commandId === commandId);
    if (prior) return cloneOpenOrder(prior);
    if (ticket.lines.length === 0) throw new PosContractError("EMPTY_TICKET", "أضف صنفًا واحدًا على الأقل قبل اختيار المحلي.");
    if (ticket.lines.some((line) => kitchenStateOf(line) === "sent")) {
      throw new PosContractError("SENT_LINE_IMMUTABLE", "لا يمكن فتح طلب محلي جديد من تذكرة سبق إرسال أصنافها للمطبخ.");
    }
    const resolved = findPlace(servicePlaceId);
    if (!resolved) throw new PosContractError("SERVICE_PLACE_NOT_FOUND", "تعذر العثور على المكان المحدد.");
    if (this.snapshot.openOrders.some((order) => order.servicePlaceId === servicePlaceId)) {
      throw new PosContractError("SERVICE_PLACE_OCCUPIED", "هذا المكان مرتبط بطلب مفتوح بالفعل.");
    }
    const now = new Date().toISOString();
    const orderId = createId("local-order");
    const batchId = createId("kitchen-batch");
    const sentTicket = committedTicket(ticket);
    const order: OpenLocalOrder = {
      id: orderId,
      commandId,
      ticket: sentTicket,
      placeGroupId: resolved.group.id,
      placeGroupName: resolved.group.name,
      servicePlaceId: resolved.place.id,
      servicePlaceName: resolved.place.name,
      openedAt: now,
      updatedAt: now,
      kitchenRevision: 1,
      kitchenBatches: [createKitchenBatch(batchId, commandId, 1, now, ticketToKitchenAdditions(ticket))],
      mutationCommandIds: [],
    };
    this.snapshot = { ...this.snapshot, openOrders: [...this.snapshot.openOrders, order] };
    this.persist();
    return cloneOpenOrder(order);
  }

  async getOpenOrder(openOrderId: string) {
    await pause();
    const order = this.snapshot.openOrders.find((item) => item.id === openOrderId);
    if (!order) throw new PosContractError("OPEN_LOCAL_ORDER_NOT_FOUND", "تعذر العثور على الطلب المحلي المفتوح.");
    return cloneOpenOrder(order);
  }

  async updateOpenOrder(commandId: string, openOrderId: string, ticket: Ticket, allowSentCorrections = false) {
    await pause();
    const index = this.snapshot.openOrders.findIndex((item) => item.id === openOrderId);
    if (index < 0) throw new PosContractError("OPEN_LOCAL_ORDER_NOT_FOUND", "تعذر العثور على الطلب المحلي المفتوح.");
    const current = this.snapshot.openOrders[index]!;
    const committed = committedTicket(current.ticket);
    const repeated = current.lastMutationCommandId === commandId
      || current.mutationCommandIds?.includes(commandId) === true
      || current.kitchenBatches.some((batch) => batch.commandId === commandId);
    if (repeated) return cloneOpenOrder(current);

    if (ticket.id !== committed.id || ticket.sequence !== committed.sequence) {
      throw new PosContractError("OPEN_LOCAL_ORDER_TICKET_MISMATCH", "لا يمكن تغيير هوية التذكرة أثناء إبقاء الطاولة مفتوحة.");
    }

    const sentQuantityReduction = hasSentQuantityReduction(committed, ticket)
      || hasSentLineQuantityReduction(committed, ticket);
    if (sentQuantityReduction && !allowSentCorrections) {
      throw new PosContractError("SENT_LINE_IMMUTABLE", "لا يمكن إنقاص صنف أُرسل للمطبخ من السلة الحالية.");
    }
    if (hasSentLineSnapshotMutation(committed, ticket)) {
      throw new PosContractError("SENT_LINE_IMMUTABLE", "لا يمكن تغيير بيانات صنف أُرسل للمطبخ من السلة الحالية.");
    }
    const committedLineIds = new Set(committed.lines.map((line) => line.id));
    const hasUnknownSentLine = ticket.lines.some((line) =>
      kitchenStateOf(line) === "sent" && !committedLineIds.has(line.id));
    if (hasUnknownSentLine) {
      throw new PosContractError("SENT_LINE_IMMUTABLE", "لا يمكن اعتماد صنف مرسل جديد بلا إرسال سابق للمطبخ.");
    }
    const hasSentLineRemoval = (() => {
      if (!ticket.lines.some((line) => line.kitchenState !== undefined)) return false;
      const proposedIds = new Set(ticket.lines.map((line) => line.id));
      return committed.lines.some((line) => !proposedIds.has(line.id));
    })();
    if (hasSentLineRemoval && !allowSentCorrections) {
      throw new PosContractError("SENT_LINE_IMMUTABLE", "لا يمكن حذف صنف أُرسل للمطبخ من السلة الحالية.");
    }

    const pendingTicketLines = pendingLinesForUpdate(committed, ticket);
    const pendingTicket: Ticket = { ...ticket, lines: pendingTicketLines };
    const lines = [
      ...pendingTicketToKitchenAdditions(pendingTicket),
      ...(allowSentCorrections ? sentTicketToKitchenCorrections(committed, ticket) : []),
    ];
    const metadataChanged = !sameTicketBusinessContent(committed, ticket);
    if (lines.length === 0 && !metadataChanged) {
      throw new PosContractError("EMPTY_KITCHEN_DELTA", "لا توجد تغييرات جديدة لإرسالها إلى المطبخ.");
    }
    const updatedAt = new Date().toISOString();
    const revision = lines.length > 0 ? Math.max(current.kitchenRevision, current.kitchenBatches.length) + 1 : current.kitchenRevision;
    const batch = lines.length > 0
      ? createKitchenBatch(createId("kitchen-batch"), commandId, revision, updatedAt, lines)
      : null;
    const sentTicket = committedTicket({ ...ticket, updatedAt });
    const mutationCommandIds = [...(current.mutationCommandIds ?? []), commandId].slice(-32);
    const updated: OpenLocalOrder = {
      ...current,
      // `commandId` identifies creation and must remain stable for replay.
      ticket: sentTicket,
      updatedAt,
      kitchenRevision: revision,
      kitchenBatches: batch ? [...current.kitchenBatches, batch] : current.kitchenBatches,
      lastMutationCommandId: commandId,
      mutationCommandIds,
    };
    const openOrders = [...this.snapshot.openOrders];
    openOrders[index] = updated;
    this.snapshot = { ...this.snapshot, openOrders };
    this.persist();
    return cloneOpenOrder(updated);
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
    updateOpenOrder: ({ commandId, openOrderId, ticket, allowSentCorrections }) => store.updateOpenOrder(commandId, openOrderId, ticket, allowSentCorrections),
    closeOpenOrder: ({ openOrderId }) => store.closeOpenOrder(openOrderId),
  };
};
