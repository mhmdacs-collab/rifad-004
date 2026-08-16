import { createContext, useContext, type ReactNode } from "react";
import type { LoyaltyRedemptionQuote, LoyaltyStatus } from "../domain/loyalty";
import type { Customer, CustomerDetails, Receipt, Ticket } from "../domain/models";

type CustomerFlowContextValue = {
  ticket: Ticket | null;
  updateCustomer: (customerId: string, name: string, mobile: string, details: CustomerDetails) => Promise<Customer | null>;
  applyLoyaltyRedemption: (amountHalalas: number) => Promise<boolean>;
  loadLoyaltyStatus: (customerId: string) => Promise<LoyaltyStatus | null>;
  quoteLoyaltyRedemption: (customerId: string, ticketTotalHalalas: number) => Promise<LoyaltyRedemptionQuote | null>;
  loadCustomerPurchases: (customerId: string) => Promise<readonly Receipt[]>;
};

const CustomerFlowContext = createContext<CustomerFlowContextValue | null>(null);

export function CustomerFlowProvider({ value, children }: { value: CustomerFlowContextValue; children: ReactNode }) {
  return <CustomerFlowContext.Provider value={value}>{children}</CustomerFlowContext.Provider>;
}

export function useCustomerFlowContext() {
  const value = useContext(CustomerFlowContext);
  if (!value) throw new Error("CustomerFlowProvider is required for customer workflows.");
  return value;
}
