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

  it("always includes the exact ticket total in cash suggestions", () => {
    expect(suggestedCashHalalas(2250)).toContain(2250);
  });
});
