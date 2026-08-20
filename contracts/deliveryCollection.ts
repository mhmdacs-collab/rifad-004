import type { DeliveryChannelKind } from "./posConfiguration";

export const DELIVERY_COLLECTION_CONTRACT_VERSION = 1 as const;

export type DeliveryMerchantCollection = "cash" | "card";

export type DeliveryCollectionRecord = Readonly<{
  contractVersion: typeof DELIVERY_COLLECTION_CONTRACT_VERSION;
  ticketId: string;
  receiptId: string | null;
  channelId: string;
  channelName: string;
  channelKind: DeliveryChannelKind;
  paymentMode: "cash-on-delivery";
  settlement: "courier-pays-merchant";
  merchantCollection: DeliveryMerchantCollection;
  createdAt: string;
  updatedAt: string;
}>;

/**
 * Delivery/order-source context is deliberately independent from Payment and
 * Sales. Cash/Network still own the merchant money effect, while this contract
 * preserves where a delivered order came from and how the courier settled it.
 */
export interface DeliveryCollectionContract {
  setForTicket(input: {
    commandId: string;
    ticketId: string;
    channelId: string;
    channelName: string;
    channelKind: DeliveryChannelKind;
    merchantCollection: DeliveryMerchantCollection;
  }): Promise<DeliveryCollectionRecord>;
  clearForTicket(input: { commandId: string; ticketId: string }): Promise<void>;
  attachReceipt(input: { commandId: string; ticketId: string; receiptId: string }): Promise<DeliveryCollectionRecord | null>;
  readForTicket(input: { ticketId: string }): Promise<DeliveryCollectionRecord | null>;
  readForReceipt(input: { receiptId: string }): Promise<DeliveryCollectionRecord | null>;
}
