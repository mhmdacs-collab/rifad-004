import type {
  AuthorizationContract,
  EffectivePosConfigurationContract,
  ManagerOverrideContract,
} from "../../../../contracts/posConfiguration";
import type { DeliveryCollectionContract } from "../../../../contracts/deliveryCollection";
import type { LoyaltyContract } from "./loyalty";
import type {
  Customer,
  CustomerDetails,
  DebtCollectionMethod,
  DebtLedgerEntry,
  DebtSettlementResult,
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
  setCustomer(input: { commandId: string; ticketId: string; customerId: string | null }): Promise<Ticket>;
  setLoyaltyRedemption(input: { commandId: string; ticketId: string; amount: Money }): Promise<Ticket>;
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
  create(input: {
    commandId: string;
    name: string;
    mobile: string;
    details: CustomerDetails;
  }): Promise<Customer>;
  update(input: {
    commandId: string;
    customerId: string;
    name: string;
    mobile: string;
    details: CustomerDetails;
  }): Promise<Customer>;
  ledger(input: { customerId: string }): Promise<readonly DebtLedgerEntry[]>;
  chargeTicket(input: {
    commandId: string;
    customerId: string;
    ticketId: string;
  }): Promise<{ customer: Customer; receipt: Receipt }>;
  settle(input: {
    commandId: string;
    customerId: string;
    amount: Money;
    collectionMethod?: DebtCollectionMethod;
    collectionReceiptId?: string;
    collectionReceiptNumber?: string;
    collectedAt?: string;
  }): Promise<Customer>;
}

export interface DebtCollectionContract {
  settle(input: {
    commandId: string;
    customerId: string;
    amount: Money;
    collectionMethod: DebtCollectionMethod;
  }): Promise<DebtSettlementResult>;
}

export interface CheckoutContract {
  begin(input: { commandId: string; ticketId: string }): Promise<{ checkoutId: string }>;
  selectPaymentMethod(input: { checkoutId: string; method: "cash" | "card" }): Promise<void>;
  completeCashSale(input: {
    commandId: string;
    checkoutId: string;
    tendered: Money;
  }): Promise<Receipt>;
  completeCardSale(input: {
    commandId: string;
    checkoutId: string;
  }): Promise<Receipt>;
}

export interface ReceiptsContract {
  list(): Promise<readonly Receipt[]>;
  listByCustomer(input: { customerId: string }): Promise<readonly Receipt[]>;
  setLoyaltyEarned(input: { receiptId: string; earned: Money }): Promise<Receipt>;
  emailReceipt(input: { commandId: string; receiptId: string; email: string }): Promise<void>;
}

export interface PrintingContract {
  submit(input: { commandId: string; receiptId: string }): Promise<PrintDeliveryStatus>;
}

/**
 * Rifad-owned POS runtime boundary.
 *
 * Concrete catalog/sales/customer/checkout/printing implementations may come
 * from local code, an external API, an embedded donor, or a future Rifad
 * backend. UI/state code depends only on this contract.
 */
export interface PosRuntimeContract {
  restore(): RestoredPosState;
  deviceSession: DeviceSessionContract;
  employeeSession: EmployeeSessionContract;
  effectiveConfiguration: EffectivePosConfigurationContract;
  authorization: AuthorizationContract;
  managerOverride: ManagerOverrideContract;
  deliveryCollection: DeliveryCollectionContract;
  debtCollection: DebtCollectionContract;
  catalog: CatalogContract;
  saleLayout: SaleLayoutContract;
  sales: SalesContract;
  customerCredit: CustomerCreditContract;
  loyalty: LoyaltyContract;
  checkout: CheckoutContract;
  receipts: ReceiptsContract;
  printing: PrintingContract;
}

/**
 * Temporary compatibility alias for the existing legacy/mock business runtime.
 * Configuration/authorization/delivery/debt collection are composed around it
 * at the Rifad composition root so the mock never becomes the owner of those policies.
 */
export type MockPosRuntime = Omit<
  PosRuntimeContract,
  "effectiveConfiguration" | "authorization" | "managerOverride" | "deliveryCollection" | "debtCollection"
>;
