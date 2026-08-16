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

export const formatMoney = (value: Money): string => `${numberFormatter.format(value.halalas / 100)} SAR`;

export const parseRiyalsToHalalas = (value: string): number | null => {
  const normalized = value.replace(/[^0-9.]/g, "");
  if (!/^\d+(\.\d{0,2})?$/.test(normalized)) return null;
  const [riyals = "0", fraction = ""] = normalized.split(".");
  const halalas = Number(riyals) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(halalas) ? halalas : null;
};

export const suggestedCashHalalas = (totalHalalas: number): readonly number[] => {
  const denominations = [500, 1000, 2000, 5000, 10000];
  const suggestions = new Set<number>([totalHalalas]);
  for (const denomination of denominations) {
    const rounded = Math.ceil(totalHalalas / denomination) * denomination;
    if (rounded >= totalHalalas) suggestions.add(rounded);
    if (suggestions.size >= 4) break;
  }
  return [...suggestions].sort((a, b) => a - b).slice(0, 4);
};
