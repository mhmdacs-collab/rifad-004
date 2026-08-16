import type { LoyaltyContract } from "../contracts/loyalty";
import type { LoyaltyProgram, LoyaltyStatus } from "../domain/loyalty";
import { money } from "../domain/money";

const PROGRAM_KEY = "rifad.backoffice.loyalty-program.v1";
const ACCOUNTS_KEY = "rifad.pos.mock-loyalty-accounts.v1";
const COMPLETIONS_KEY = "rifad.pos.mock-loyalty-completions.v1";

const defaultProgram: LoyaltyProgram = {
  enabled: true,
  mode: "cashback",
  name: "نقاط المشتريات",
  earnPercent: 5,
};

type LoyaltyAccount = {
  customerId: string;
  balanceHalalas: number;
  qualifyingPurchases: number;
  rewardsAvailable: number;
};

type LoyaltyCompletion = {
  receiptId: string;
  commandId: string;
  customerId: string;
  earnedHalalas: number;
};

const defaultAccounts: readonly LoyaltyAccount[] = [
  { customerId: "customer-001", balanceHalalas: 2500, qualifyingPurchases: 3, rewardsAvailable: 0 },
  { customerId: "customer-002", balanceHalalas: 800, qualifyingPurchases: 1, rewardsAvailable: 0 },
];

const readProgram = (): LoyaltyProgram => {
  try {
    const raw = window.localStorage.getItem(PROGRAM_KEY);
    if (!raw) return defaultProgram;
    const parsed = JSON.parse(raw) as LoyaltyProgram;
    if (parsed.mode === "cashback" && parsed.enabled && parsed.earnPercent > 0) return parsed;
    if (parsed.mode === "purchase-count" && parsed.enabled && parsed.purchasesRequired > 0) return parsed;
    if (parsed.mode === "disabled" && !parsed.enabled) return parsed;
  } catch {
    // Back-office-fed mock setting falls back to the safe default.
  }
  return defaultProgram;
};

const readAccounts = (): LoyaltyAccount[] => {
  try {
    const raw = window.localStorage.getItem(ACCOUNTS_KEY);
    if (!raw) return defaultAccounts.map((account) => ({ ...account }));
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : defaultAccounts.map((account) => ({ ...account }));
  } catch {
    return defaultAccounts.map((account) => ({ ...account }));
  }
};

const writeAccounts = (accounts: readonly LoyaltyAccount[]) => {
  window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
};

const readCompletions = (): LoyaltyCompletion[] => {
  try {
    const raw = window.localStorage.getItem(COMPLETIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeCompletions = (items: readonly LoyaltyCompletion[]) => {
  window.localStorage.setItem(COMPLETIONS_KEY, JSON.stringify(items));
};

const accountFor = (customerId: string): LoyaltyAccount =>
  readAccounts().find((account) => account.customerId === customerId) ?? {
    customerId,
    balanceHalalas: 0,
    qualifyingPurchases: 0,
    rewardsAvailable: 0,
  };

const statusFor = (customerId: string): LoyaltyStatus => {
  const program = readProgram();
  const account = accountFor(customerId);
  return {
    customerId,
    program,
    balance: money(Math.max(0, account.balanceHalalas)),
    qualifyingPurchases: Math.max(0, account.qualifyingPurchases),
    rewardsAvailable: Math.max(0, account.rewardsAvailable),
  };
};

export const loyaltyContract: LoyaltyContract = {
  status: async ({ customerId }) => statusFor(customerId),

  quoteRedemption: async ({ customerId, ticketTotal }) => {
    const status = statusFor(customerId);
    const redeemable = status.program.enabled && status.program.mode === "cashback"
      ? Math.min(status.balance.halalas, Math.max(0, ticketTotal.halalas))
      : 0;
    return {
      amount: money(redeemable),
      balanceAfter: money(Math.max(0, status.balance.halalas - redeemable)),
    };
  },

  completeSale: async ({ commandId, receiptId, customerId, netTotal, redeemed }) => {
    const prior = readCompletions().find((item) => item.receiptId === receiptId || item.commandId === commandId);
    if (prior) {
      return { status: statusFor(prior.customerId), earned: money(prior.earnedHalalas) };
    }

    const program = readProgram();
    const accounts = readAccounts();
    const current = accounts.find((account) => account.customerId === customerId) ?? {
      customerId,
      balanceHalalas: 0,
      qualifyingPurchases: 0,
      rewardsAvailable: 0,
    };

    let earnedHalalas = 0;
    let next: LoyaltyAccount = { ...current };

    if (program.enabled && program.mode === "cashback") {
      const redeemedHalalas = Math.min(Math.max(0, redeemed.halalas), current.balanceHalalas);
      earnedHalalas = Math.round((Math.max(0, netTotal.halalas) * program.earnPercent) / 100);
      next = {
        ...current,
        balanceHalalas: Math.max(0, current.balanceHalalas - redeemedHalalas + earnedHalalas),
        qualifyingPurchases: current.qualifyingPurchases + 1,
      };
    } else if (program.enabled && program.mode === "purchase-count") {
      const progress = current.qualifyingPurchases + 1;
      const unlocked = progress >= program.purchasesRequired;
      next = {
        ...current,
        qualifyingPurchases: unlocked ? 0 : progress,
        rewardsAvailable: current.rewardsAvailable + (unlocked ? 1 : 0),
      };
    }

    const nextAccounts = accounts.some((account) => account.customerId === customerId)
      ? accounts.map((account) => account.customerId === customerId ? next : account)
      : [...accounts, next];
    writeAccounts(nextAccounts);

    writeCompletions([
      { receiptId, commandId, customerId, earnedHalalas },
      ...readCompletions(),
    ]);

    return { status: statusFor(customerId), earned: money(earnedHalalas) };
  },
};
