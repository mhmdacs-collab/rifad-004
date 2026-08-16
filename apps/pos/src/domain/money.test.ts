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

  it("keeps the requested low-total cashier pattern", () => {
    expect(suggestedCashHalalas(10800)).toEqual([11000, 12000, 15000, 20000, 50000]);
    expect(suggestedCashHalalas(10800)).not.toContain(10800);
  });

  it("does not suggest arbitrary intermediate tens for a 126 riyal sale", () => {
    expect(suggestedCashHalalas(12600)).toEqual([13000, 15000, 20000, 50000]);
    expect(suggestedCashHalalas(12600)).not.toContain(14000);
  });

  it("skips the next-ten shortcut when the total is already a round ten", () => {
    expect(suggestedCashHalalas(17000)).toEqual([20000, 50000]);
  });
});
