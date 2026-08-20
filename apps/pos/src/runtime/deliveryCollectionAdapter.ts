import {
  DELIVERY_COLLECTION_CONTRACT_VERSION,
  type DeliveryCollectionContract,
  type DeliveryCollectionRecord,
} from "../../../../contracts/deliveryCollection";
import type { LocalPersistenceContract } from "../contracts/localPersistence";

export const POS_DELIVERY_COLLECTION_NAMESPACE = "pos.delivery-collection";
export const POS_DELIVERY_COLLECTION_SCHEMA_VERSION = 1;

type DeliveryCollectionState = Readonly<{
  records: readonly DeliveryCollectionRecord[];
  completedCommandIds: readonly string[];
}>;

const emptyState = (): DeliveryCollectionState => ({ records: [], completedCommandIds: [] });

const readState = async (persistence: LocalPersistenceContract): Promise<DeliveryCollectionState> =>
  (await persistence.readSnapshot<DeliveryCollectionState>(POS_DELIVERY_COLLECTION_NAMESPACE))?.value ?? emptyState();

const withCommand = (state: DeliveryCollectionState, commandId: string): readonly string[] =>
  [...state.completedCommandIds, commandId].slice(-500);

export const createDeliveryCollectionAdapter = (
  persistence: LocalPersistenceContract,
): DeliveryCollectionContract => ({
  setForTicket: async (input) => {
    const state = await readState(persistence);
    const existing = state.records.find((record) => record.ticketId === input.ticketId);
    if (state.completedCommandIds.includes(input.commandId) && existing) return existing;

    const timestamp = new Date().toISOString();
    const record: DeliveryCollectionRecord = {
      contractVersion: DELIVERY_COLLECTION_CONTRACT_VERSION,
      ticketId: input.ticketId,
      receiptId: existing?.receiptId ?? null,
      channelId: input.channelId,
      channelName: input.channelName,
      channelKind: input.channelKind,
      paymentMode: "cash-on-delivery",
      settlement: "courier-pays-merchant",
      merchantCollection: input.merchantCollection,
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp,
    };
    const records = existing
      ? state.records.map((item) => item.ticketId === input.ticketId ? record : item)
      : [...state.records, record];

    await persistence.commitSnapshot({
      namespace: POS_DELIVERY_COLLECTION_NAMESPACE,
      schemaVersion: POS_DELIVERY_COLLECTION_SCHEMA_VERSION,
      value: { records, completedCommandIds: withCommand(state, input.commandId) },
      events: [{
        id: `delivery-collection-set:${input.commandId}`,
        type: "delivery.collection-set.v1",
        aggregateType: "ticket",
        aggregateId: input.ticketId,
        occurredAt: timestamp,
        payload: record,
      }],
    });
    return record;
  },

  clearForTicket: async (input) => {
    const state = await readState(persistence);
    if (state.completedCommandIds.includes(input.commandId)) return;
    const timestamp = new Date().toISOString();
    await persistence.commitSnapshot({
      namespace: POS_DELIVERY_COLLECTION_NAMESPACE,
      schemaVersion: POS_DELIVERY_COLLECTION_SCHEMA_VERSION,
      value: {
        records: state.records.filter((record) => record.ticketId !== input.ticketId),
        completedCommandIds: withCommand(state, input.commandId),
      },
      events: [{
        id: `delivery-collection-cleared:${input.commandId}`,
        type: "delivery.collection-cleared.v1",
        aggregateType: "ticket",
        aggregateId: input.ticketId,
        occurredAt: timestamp,
        payload: { ticketId: input.ticketId },
      }],
    });
  },

  attachReceipt: async (input) => {
    const state = await readState(persistence);
    const existing = state.records.find((record) => record.ticketId === input.ticketId);
    if (!existing) return null;
    if (state.completedCommandIds.includes(input.commandId) && existing.receiptId === input.receiptId) return existing;

    const timestamp = new Date().toISOString();
    const record: DeliveryCollectionRecord = {
      ...existing,
      receiptId: input.receiptId,
      updatedAt: timestamp,
    };
    await persistence.commitSnapshot({
      namespace: POS_DELIVERY_COLLECTION_NAMESPACE,
      schemaVersion: POS_DELIVERY_COLLECTION_SCHEMA_VERSION,
      value: {
        records: state.records.map((item) => item.ticketId === input.ticketId ? record : item),
        completedCommandIds: withCommand(state, input.commandId),
      },
      events: [{
        id: `delivery-collection-receipt:${input.commandId}`,
        type: "delivery.collection-receipt-attached.v1",
        aggregateType: "receipt",
        aggregateId: input.receiptId,
        occurredAt: timestamp,
        payload: record,
      }],
    });
    return record;
  },

  readForTicket: async ({ ticketId }) => {
    const state = await readState(persistence);
    return state.records.find((record) => record.ticketId === ticketId) ?? null;
  },

  readForReceipt: async ({ receiptId }) => {
    const state = await readState(persistence);
    return state.records.find((record) => record.receiptId === receiptId) ?? null;
  },
});
