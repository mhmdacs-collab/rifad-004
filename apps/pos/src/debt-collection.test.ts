import { beforeEach, describe, expect, it } from "vitest";
import { money } from "./domain/money";
import { createPosRuntimeAdapter } from "./runtime/posRuntimeAdapter";

const CUSTOMER_ID = "customer-001";

describe("debt collection", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("persists the collection method and receipt identity for partial and exact settlements", async () => {
    const runtime = createPosRuntimeAdapter();
    await runtime.deviceSession.linkWithCredentials({ commandId: "debt-device", email: "owner@rifad.test", password: "1234" });
    await runtime.employeeSession.unlock({ pin: "1234" });

    const partial = await runtime.debtCollection.settle({
      commandId: "debt-partial",
      customerId: CUSTOMER_ID,
      amount: money(5_000),
      collectionMethod: "cash",
    });
    expect(partial.debt.halalas).toBe(7_000);
    expect(partial.receipt).toEqual(expect.objectContaining({
      customerId: CUSTOMER_ID,
      customerMobile: "0501234567",
      collectionMethod: "cash",
      previousDebt: expect.objectContaining({ halalas: 12_000 }),
      amount: expect.objectContaining({ halalas: 5_000 }),
      remainingDebt: expect.objectContaining({ halalas: 7_000 }),
    }));

    const partialEntry = (await runtime.customerCredit.ledger({ customerId: CUSTOMER_ID }))[0];
    expect(partialEntry).toEqual(expect.objectContaining({
      kind: "payment",
      collectionMethod: "cash",
      collectionReceiptId: partial.receipt.id,
      collectionReceiptNumber: partial.receipt.number,
    }));

    const exact = await runtime.debtCollection.settle({
      commandId: "debt-exact",
      customerId: CUSTOMER_ID,
      amount: money(7_000),
      collectionMethod: "card",
    });
    expect(exact.debt.halalas).toBe(0);
    expect(exact.receipt.collectionMethod).toBe("card");
    expect(exact.receipt.remainingDebt.halalas).toBe(0);
  });

  it("rejects zero and overpayment without creating a credit balance", async () => {
    const runtime = createPosRuntimeAdapter();

    await expect(runtime.debtCollection.settle({
      commandId: "debt-zero",
      customerId: CUSTOMER_ID,
      amount: money(0),
      collectionMethod: "cash",
    })).rejects.toMatchObject({ code: "INVALID_DEBT_PAYMENT" });

    await expect(runtime.debtCollection.settle({
      commandId: "debt-overpay",
      customerId: CUSTOMER_ID,
      amount: money(12_001),
      collectionMethod: "card",
    })).rejects.toMatchObject({ code: "DEBT_PAYMENT_EXCEEDS_BALANCE" });

    const customer = (await runtime.customerCredit.search({ query: "0501234567" }))[0];
    expect(customer?.debt.halalas).toBe(12_000);
    expect((await runtime.customerCredit.ledger({ customerId: CUSTOMER_ID })).filter((entry) => entry.kind === "payment")).toHaveLength(0);
  });

  it("makes repeated settlement commands atomic and idempotent", async () => {
    const runtime = createPosRuntimeAdapter();
    const input = {
      commandId: "debt-double-submit",
      customerId: CUSTOMER_ID,
      amount: money(5_000),
      collectionMethod: "cash" as const,
    };

    const [first, repeated] = await Promise.all([
      runtime.debtCollection.settle(input),
      runtime.debtCollection.settle(input),
    ]);

    expect(first.debt.halalas).toBe(7_000);
    expect(repeated.debt.halalas).toBe(7_000);
    expect(repeated.receipt.id).toBe(first.receipt.id);
    expect((await runtime.customerCredit.ledger({ customerId: CUSTOMER_ID })).filter((entry) => entry.kind === "payment")).toHaveLength(1);
  });
});
