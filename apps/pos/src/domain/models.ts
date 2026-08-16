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

export type TicketLine = Readonly<{
  id: string;
  productId: string;
  name: string;
  unitPrice: Money;
  quantity: number;
  tone: ProductTone;
}>;

export type Ticket = Readonly<{
  id: string;
  sequence: number;
  lines: readonly TicketLine[];
  subtotal: Money;
  taxIncluded: Money;
  total: Money;
  updatedAt: string;
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

export type Receipt = Readonly<{
  id: string;
  number: string;
  total: Money;
  tendered: Money;
  change: Money;
  completedAt: string;
  employeeName: string;
  branchName: string;
}>;

export type PrintDeliveryStatus = "idle" | "queued" | "printed" | "failed" | "delivery-unknown";

export type RestoredPosState = Readonly<{
  device: DeviceSession | null;
  employee: EmployeeSession | null;
  ticket: Ticket | null;
  receipt: Receipt | null;
}>;
