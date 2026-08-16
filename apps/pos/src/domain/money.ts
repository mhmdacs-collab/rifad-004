import type { Money } from "./models";

const numberFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  useGrouping: true,
});

export const money = (halalas: number): Money => {
  if (!Number.isSafeInteger(halalas)) {
    throw new Error("Money must be represented as safe integer halalas.");
  }
  return Object.freeze({ halalas, currency: "SAR" });
};

export const addMoney = (...values: readonly Money[]): Money =>
  money(values.reduce((total, value) => total + value.halalas, 0));

export const multiplyMoney = (value: Money, quantity: number): Money => {
  if (!Number.isSafeInteger(quantity) || quantity < 0) {
    throw new Error("Quantity must be a non-negative integer.");
  }
  return money(value.halalas * quantity);
};

export const formatMoneyAmount = (value: Money): string => numberFormatter.format(value.halalas / 100);
export const formatMoney = (value: Money): string => `${formatMoneyAmount(value)} SAR`;

export const parseRiyalsToHalalas = (value: string): number | null => {
  const normalized = value.replace(/[^0-9.]/g, "");
  if (!/^\d+(\.\d{0,2})?$/.test(normalized)) return null;
  const [riyals = "0", fraction = ""] = normalized.split(".");
  const halalas = Number(riyals) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(halalas) ? halalas : null;
};

const roundStrictlyUp = (value: number, increment: number): number => {
  const rounded = Math.ceil(value / increment) * increment;
  return rounded > value ? rounded : rounded + increment;
};

export const suggestedCashHalalas = (totalHalalas: number): readonly number[] => {
  if (!Number.isSafeInteger(totalHalalas) || totalHalalas < 0) {
    throw new Error("Cash total must be a non-negative safe integer halala amount.");
  }

  // Suggested tender amounts must be higher than the ticket total. Exact payment is
  // already the default input, so repeating it as a shortcut wastes a cashier tap.
  // These increments produce practical cashier targets such as:
  // 108.00 -> 110, 120, 150, 200, 500.
  const increments = [1000, 2000, 5000, 10000, 50000];
  const suggestions = new Set<number>();

  for (const increment of increments) {
    suggestions.add(roundStrictlyUp(totalHalalas, increment));
  }

  return [...suggestions].sort((a, b) => a - b);
};
