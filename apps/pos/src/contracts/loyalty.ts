import type { Money } from "../domain/models";
import type { LoyaltyRedemptionQuote, LoyaltyStatus } from "../domain/loyalty";

export interface LoyaltyContract {
  status(input: { customerId: string }): Promise<LoyaltyStatus>;
  quoteRedemption(input: { customerId: string; ticketTotal: Money }): Promise<LoyaltyRedemptionQuote>;
}
