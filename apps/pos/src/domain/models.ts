import type { DeliveryChannelKind } from "../../../../contracts/posConfiguration";

export type CurrencyCode = "SAR";

export type Money = Readonly<{
  halalas: number;
  currency: CurrencyCode;
}>;

export type ProductTone = "sand" | "mint" | "rose" | "sky" | "amber" | "stone";

export type Product = Readonly<{
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  price: Money;
  abbreviation: string;
  tone: ProductTone;
}>;

export type SalePage = Readonly<{
  id: string;
  name: string;
  isDefault: boolean;
  productSlots: readonly (string | null)[];
}>;

export type TicketLine = Readonly<{
  id: string;
  productId: string;
  name: string;
  unitPrice: Money;
  quantity: number;
  tone: ProductTone;
}>;

export type CustomerDetails = Readonly<{
  email: string;
  address: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  customerCode: string;
  taxNumber?: string;
  note: string;
}>;

export type CustomerReference = Readonly<{
  id: string;
  name: string;
  mobile: string;
  details: CustomerDetails;
}>;

/**
 * Durable sale context for the currently executable delivery/COD path.
 * It answers both "where did this order come from?" and "how did the merchant
 * receive the money?" so cash/bank reporting never erases the sales channel.
 */
export type DeliveryCollectionContext = Readonly<{
  channelId: string;
  channelName: string;
  channelKind: DeliveryChannelKind;
  paymentMode: "cash-on-delivery";
  settlement: "courier-pays-merchant";
  merchantCollection: "cash" | "card";
}>;

export type Ticket = Readonly<{
  id: string;
  sequence: number;
  lines: readonly TicketLine[];
  customer: CustomerReference | null;
  deliveryCollection?: DeliveryCollectionContext | null;
  subtotal: Money;
  loyaltyRedemption: Money;
  taxIncluded: Money;
  total: Money;
  updatedAt: string;
}>;

export type Customer = Readonly<{
  id: string;
  name: string;
  mobile: string;
  details: CustomerDetails;
  debt: Money;
}>;

export type DebtLedgerEntry = Readonly<{
  id: string;
  customerId: string;
  kind: "opening" | "credit-sale" | "payment";
  direction: "debit" | "credit";
  amount: Money;
  createdAt: string;
  ticketSequence: number | null;
}>;

export type EmployeeSession = Readonly<{
  employeeId: string;
  employeeName: string;
  roleName: string;
}>;

export type DeviceSession = Readonly<{
  deviceId: string;
  deviceName: string;
  branchId: string;
  branchName: string;
  linkedEmail: string;
}>;

export type ReceiptItem = Readonly<{
  productId: string;
  name: string;
  quantity: number;
  unitPrice: Money;
  lineTotal: Money;
}>;

export type Receipt = Readonly<{
  id: string;
  number: string;
  paymentMethod: "cash" | "card" | "credit";
  items: readonly ReceiptItem[];
  subtotal: Money;
  loyaltyRedemption: Money;
  taxIncluded: Money;
  total: Money;
  tendered: Money;
  change: Money;
  loyaltyEarned: Money;
  completedAt: string;
  employeeName: string;
  branchName: string;
  customer: CustomerReference | null;
  deliveryCollection?: DeliveryCollectionContext | null;
}>;

export type PrintDeliveryStatus = "idle" | "queued" | "printed" | "failed" | "delivery-unknown";

export type RestoredPosState = Readonly<{
  device: DeviceSession | null;
  employee: EmployeeSession | null;
  ticket: Ticket | null;
  receipt: Receipt | null;
}>;
