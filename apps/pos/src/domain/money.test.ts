import { describe, expect, it } from "vitest";
import { addMoney, money, multiplyMoney, parseRiyalsToHalalas, suggestedCashHalalas } from "./money";

describe("money authority", () => {
  it("keeps arithmetic in integer halalas", () => {
    expect(addMoney(money(105), money(210))).toEqual({ halalas: 315, currency: "SAR" });
    expect(multiplyMoney(money(1999), 3)).toEqual({ halalas: 5997, currency: "SAR" });
  });

  it("parses no more than two decimal places", () => {
    expect(parseRiyalsToHalalas("22.50")).toBe(2250);
    expect(parseRiyalsToHalalas("22.555")).toBeNull();
  });

  it("uses predictable 5, 10, 50 and 100 riyal checkpoints for a 102 riyal sale", () => {
    expect(suggestedCashHalalas(10200)).toEqual([10500, 11000, 15000, 20000, 50000]);
    expect(suggestedCashHalalas(10200)).not.toContain(12000);
  });

  it("keeps the same progression around 108 without a special 120 shortcut", () => {
    expect(suggestedCashHalalas(10800)).toEqual([11000, 15000, 20000, 50000]);
    expect(suggestedCashHalalas(10800)).not.toContain(12000);
  });

  it("offers close touch-friendly amounts for a 54 riyal sale", () => {
    expect(suggestedCashHalalas(5400)).toEqual([5500, 6000, 10000, 50000]);
  });

  it("keeps the progression intuitive for a 126 riyal sale", () => {
    expect(suggestedCashHalalas(12600)).toEqual([13000, 15000, 20000, 50000]);
  });

  it("continues upward predictably when the total is already on a round ten", () => {
    expect(suggestedCashHalalas(17000)).toEqual([17500, 18000, 20000, 50000]);
  });
});
