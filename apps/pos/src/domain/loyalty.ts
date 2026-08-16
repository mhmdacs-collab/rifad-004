import type { Money } from "./models";

export type LoyaltyProgram =
  | Readonly<{
      enabled: false;
      mode: "disabled";
      name: string;
    }>
  | Readonly<{
      enabled: true;
      mode: "cashback";
      name: string;
      earnPercent: number;
    }>
  | Readonly<{
      enabled: true;
      mode: "purchase-count";
      name: string;
      purchasesRequired: number;
      rewardLabel: string;
    }>;

export type LoyaltyStatus = Readonly<{
  customerId: string;
  program: LoyaltyProgram;
  balance: Money;
  qualifyingPurchases: number;
  rewardsAvailable: number;
}>;

export type LoyaltyRedemptionQuote = Readonly<{
  amount: Money;
  balanceAfter: Money;
}>;
