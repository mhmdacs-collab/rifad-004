export type CurrencyCode = "SAR";

export type Money = Readonly<{
  halalas: number;
  currency: CurrencyCode;
}>;

export type ProductTone = "sand" | "mint" | "rose" | "sky" | "amber" | "stone";

/**
 * Ownership of a line while a local/restaurant ticket is being dispatched.
 *
 * Retail tickets only use the default `pending` state. Restaurant adapters
 * promote a line to `sent` once it has crossed the kitchen boundary. Keeping
 * the marker on the line lets the sales contract prevent an ordinary cashier
 * edit from mutating an immutable kitchen dispatch.
 */
export type TicketLineKitchenState = "pending" | "sent";

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
  /** Missing on pre-ownership snapshots; those lines are treated as pending. */
  kitchenState?: TicketLineKitchenState;
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

export type Ticket = Readonly<{
  id: string;
  sequence: number;
  lines: readonly TicketLine[];
  customer: CustomerReference | null;
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

export type DebtCollectionMethod = "cash" | "card";

export type DebtCollectionReceipt = Readonly<{
  id: string;
  number: string;
  customerId: string;
  customerName: string;
  customerMobile: string;
  amount: Money;
  collectionMethod: DebtCollectionMethod;
  previousDebt: Money;
  remainingDebt: Money;
  collectedAt: string;
  employeeId: string | null;
  employeeName: string;
  branchName: string;
}>;

/**
 * Deliberately remains structurally compatible with Customer so legacy callers
 * can consume the updated customer while the Rifad debt flow also receives the
 * independent collection receipt.
 */
export type DebtSettlementResult = Readonly<Customer & {
  receipt: DebtCollectionReceipt;
}>;

export type DebtLedgerEntry = Readonly<{
  id: string;
  customerId: string;
  kind: "opening" | "credit-sale" | "payment";
  direction: "debit" | "credit";
  amount: Money;
  createdAt: string;
  ticketSequence: number | null;
  collectionMethod?: DebtCollectionMethod;
  collectionReceiptId?: string;
  collectionReceiptNumber?: string;
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
}>;

export type PrintDeliveryStatus = "idle" | "queued" | "printed" | "failed" | "delivery-unknown";

export type RestoredPosState = Readonly<{
  device: DeviceSession | null;
  employee: EmployeeSession | null;
  ticket: Ticket | null;
  receipt: Receipt | null;
}>;
