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

  it("suggests only higher practical tender amounts and never repeats the exact total", () => {
    expect(suggestedCashHalalas(10800)).toEqual([11000, 12000, 15000, 20000, 50000]);
    expect(suggestedCashHalalas(10800)).not.toContain(10800);
  });

  it("deduplicates tender targets when several denomination steps land on the same amount", () => {
    expect(suggestedCashHalalas(11500)).toEqual([12000, 15000, 20000, 50000]);
  });
});
