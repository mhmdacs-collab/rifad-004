import type {
  DeviceSession,
  EmployeeSession,
  Money,
  PrintDeliveryStatus,
  Product,
  Receipt,
  RestoredPosState,
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

export interface PrintingContract {
  submit(input: { commandId: string; receiptId: string }): Promise<PrintDeliveryStatus>;
}

export interface MockPosRuntime {
  restore(): RestoredPosState;
  deviceSession: DeviceSessionContract;
  employeeSession: EmployeeSessionContract;
  catalog: CatalogContract;
  sales: SalesContract;
  checkout: CheckoutContract;
  printing: PrintingContract;
}
