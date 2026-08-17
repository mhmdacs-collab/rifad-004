import type { LocalDomainEventDraft, LocalPersistenceContract } from "../contracts/localPersistence";
import type { RestaurantServiceContract } from "../contracts/restaurantService";
import type { LegacySnapshotBridge } from "./legacySnapshotBridge";

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
 * Persists restaurant/open-order state independently from its implementation.
 *
 * With the legacy mock bridge, each durable mutation mirrors the complete
 * restaurant snapshot into its private LocalPersistence namespace. Open-order
 * lifecycle events are committed with that snapshot so future LAN/cloud/kitchen
 * consumers can replay without becoming restaurant-state authority.
 */
export const withRestaurantPersistenceJournal = (
  base: RestaurantServiceContract,
  persistence: LocalPersistenceContract,
  snapshotBridge?: LegacySnapshotBridge,
): RestaurantServiceContract => {
  const ready = snapshotBridge?.ready ?? Promise.resolve();

  const commit = async (events: readonly LocalDomainEventDraft[] = []) => {
    await ready;
    if (!snapshotBridge) {
      if (events.length > 0) await persistence.appendEvents(events);
      return;
    }
    const value = snapshotBridge.readCurrentSnapshot();
    if (value === null) {
      throw new Error(`Missing durable restaurant snapshot after mutation (${snapshotBridge.namespace}).`);
    }
    await persistence.commitSnapshot({
      namespace: snapshotBridge.namespace,
      schemaVersion: snapshotBridge.schemaVersion,
      value,
      events,
    });
  };

  return {
    ...base,
    updateConfig: async (input) => {
      await ready;
      const config = await base.updateConfig(input);
      await commit();
      return config;
    },
    createOpenOrder: async (input) => {
      await ready;
      const order = await base.createOpenOrder(input);
      await commit([
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
      await ready;
      const order = await base.updateOpenOrder(input);
      await commit([
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
      await ready;
      const order = await base.getOpenOrder(input);
      await base.closeOpenOrder(input);
      await commit([
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
  };
};
