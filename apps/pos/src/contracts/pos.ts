import type {
  Customer,
  DeviceSession,
  EmployeeSession,
  Money,
  PrintDeliveryStatus,
  Product,
  Receipt,
  RestoredPosState,
  SalePage,
  Ticket,
} from "../domain/models";

export class PosContractError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "PosContractError";
  }
}

export interface DeviceSessionContract {
  linkWithCredentials(input: {
    commandId: string;
    email: string;
    password: string;
  }): Promise<DeviceSession>;
}

export interface EmployeeSessionContract {
  unlock(input: { pin: string }): Promise<EmployeeSession>;
}

export interface CatalogContract {
  search(input: { query: string; categoryId: string | null }): Promise<readonly Product[]>;
  categories(): Promise<readonly { id: string; name: string }[]>;
}

export interface SalesContract {
  startTicket(input: { commandId: string }): Promise<Ticket>;
  addItem(input: { commandId: string; ticketId: string; productId: string }): Promise<Ticket>;
  setLineQuantity(input: { ticketId: string; lineId: string; quantity: number }): Promise<Ticket>;
  removeLine(input: { ticketId: string; lineId: string }): Promise<Ticket>;
  saveOpenTicket(input: { commandId: string; ticketId: string }): Promise<Ticket>;
}

export interface SaleLayoutContract {
  listPages(): Promise<readonly SalePage[]>;
  createPage(input: { commandId: string; name: string }): Promise<readonly SalePage[]>;
  renamePage(input: { commandId: string; pageId: string; name: string }): Promise<readonly SalePage[]>;
  deletePage(input: { commandId: string; pageId: string }): Promise<readonly SalePage[]>;
  movePage(input: {
    commandId: string;
    pageId: string;
    direction: "previous" | "next";
  }): Promise<readonly SalePage[]>;
  placeProduct(input: {
    commandId: string;
    pageId: string;
    slotIndex: number;
    productId: string;
  }): Promise<readonly SalePage[]>;
  removeProduct(input: {
    commandId: string;
    pageId: string;
    slotIndex: number;
  }): Promise<readonly SalePage[]>;
}

export interface CustomerCreditContract {
  search(input: { query: string }): Promise<readonly Customer[]>;
  create(input: { commandId: string; name: string; mobile: string }): Promise<Customer>;
  chargeTicket(input: {
    commandId: string;
    customerId: string;
    ticketId: string;
  }): Promise<{ customer: Customer; nextTicket: Ticket }>;
  settleFull(input: { commandId: string; customerId: string }): Promise<Customer>;
}

export interface CheckoutContract {
  begin(input: { commandId: string; ticketId: string }): Promise<{ checkoutId: string }>;
  selectPaymentMethod(input: { checkoutId: string; method: "cash" }): Promise<void>;
  completeCashSale(input: {
    commandId: string;
    checkoutId: string;
    tendered: Money;
  }): Promise<Receipt>;
}

export interface ReceiptsContract {
  list(): Promise<readonly Receipt[]>;
}

export interface PrintingContract {
  submit(input: { commandId: string; receiptId: string }): Promise<PrintDeliveryStatus>;
}

export interface MockPosRuntime {
  restore(): RestoredPosState;
  deviceSession: DeviceSessionContract;
  employeeSession: EmployeeSessionContract;
  catalog: CatalogContract;
  saleLayout: SaleLayoutContract;
  sales: SalesContract;
  customerCredit: CustomerCreditContract;
  checkout: CheckoutContract;
  receipts: ReceiptsContract;
  printing: PrintingContract;
}
