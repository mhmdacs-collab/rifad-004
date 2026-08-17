import type { LocalDomainEventDraft, LocalPersistenceContract } from "../contracts/localPersistence";
import type { RestaurantServiceContract } from "../contracts/restaurantService";

const event = (
  id: string,
  type: string,
  aggregateId: string,
  payload: unknown,
  occurredAt = new Date().toISOString(),
): LocalDomainEventDraft => ({
  id,
  type,
  aggregateType: "local-order",
  aggregateId,
  payload,
  occurredAt,
});

/**
 * Journals restaurant/open-order facts independently from the restaurant
 * implementation. LAN, cloud sync and kitchen/fiscal consumers may later read
 * the same Rifad outbox without the restaurant adapter owning those transports.
 */
export const withRestaurantPersistenceJournal = (
  base: RestaurantServiceContract,
  persistence: LocalPersistenceContract,
): RestaurantServiceContract => ({
  ...base,
  createOpenOrder: async (input) => {
    const order = await base.createOpenOrder(input);
    await persistence.appendEvents([
      event(
        `local-order.opened:${input.commandId}`,
        "local-order.opened.v1",
        order.id,
        { order },
        order.openedAt,
      ),
    ]);
    return order;
  },
  updateOpenOrder: async (input) => {
    const order = await base.updateOpenOrder(input);
    await persistence.appendEvents([
      event(
        `local-order.updated:${input.commandId}`,
        "local-order.updated.v1",
        order.id,
        { order },
        order.updatedAt,
      ),
    ]);
    return order;
  },
  closeOpenOrder: async (input) => {
    const order = await base.getOpenOrder(input);
    await base.closeOpenOrder(input);
    await persistence.appendEvents([
      event(
        `local-order.closed:${input.openOrderId}`,
        "local-order.closed.v1",
        input.openOrderId,
        {
          openOrderId: input.openOrderId,
          placeGroupId: order.placeGroupId,
          servicePlaceId: order.servicePlaceId,
          kitchenRevision: order.kitchenRevision,
        },
      ),
    ]);
  },
});
