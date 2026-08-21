import { describe, expect, it } from "vitest";
import { createMockRestaurantService } from "./adapters/mockRestaurantService";
import type { Ticket, TicketLine } from "./domain/models";
import { diffKitchenTickets, ticketToKitchenAdditions } from "./domain/kitchenDelta";

const line = (productId: string, name: string, quantity: number, halalas: number): TicketLine => ({
  id: `line-${productId}`,
  productId,
  name,
  quantity,
  unitPrice: { halalas, currency: "SAR" },
  tone: "sand",
});

const ticket = (...lines: TicketLine[]): Ticket => {
  const total = lines.reduce((sum, item) => sum + item.unitPrice.halalas * item.quantity, 0);
  return {
    id: "ticket-1",
    sequence: 1,
    lines,
    customer: null,
    subtotal: { halalas: total, currency: "SAR" },
    loyaltyRedemption: { halalas: 0, currency: "SAR" },
    taxIncluded: { halalas: 0, currency: "SAR" },
    total: { halalas: total, currency: "SAR" },
    updatedAt: "2026-08-21T00:00:00.000Z",
  };
};

describe("kitchen delta", () => {
  it("groups the initial ticket as additions", () => {
    expect(ticketToKitchenAdditions(ticket(
      line("coffee", "قهوة", 2, 1_800),
      line("latte", "لاتيه", 1, 2_200),
    ))).toEqual([
      expect.objectContaining({ productId: "coffee", name: "قهوة", quantity: 2, kind: "add" }),
      expect.objectContaining({ productId: "latte", name: "لاتيه", quantity: 1, kind: "add" }),
    ]);
  });

  it("returns only the new quantity when the same product is added after send", () => {
    const sent = ticket(line("coffee", "قهوة", 1, 1_800));
    const working = ticket(line("coffee", "قهوة", 2, 1_800));

    expect(diffKitchenTickets(sent, working)).toEqual([
      expect.objectContaining({ productId: "coffee", quantity: 1, kind: "add" }),
    ]);
  });

  it("returns explicit reduce and cancel corrections", () => {
    const sent = ticket(
      line("coffee", "قهوة", 3, 1_800),
      line("latte", "لاتيه", 1, 2_200),
    );
    const working = ticket(line("coffee", "قهوة", 1, 1_800));

    expect(diffKitchenTickets(sent, working)).toEqual([
      expect.objectContaining({ productId: "coffee", quantity: 2, kind: "reduce" }),
      expect.objectContaining({ productId: "latte", quantity: 1, kind: "cancel" }),
    ]);
  });

  it("returns no delta for unchanged content and keeps proposed ticket order", () => {
    const sent = ticket(
      line("coffee", "قهوة", 1, 1_800),
      line("latte", "لاتيه", 1, 2_200),
    );
    const reordered = ticket(
      line("latte", "لاتيه", 2, 2_200),
      line("coffee", "قهوة", 2, 1_800),
    );

    expect(diffKitchenTickets(sent, sent)).toEqual([]);
    expect(diffKitchenTickets(sent, reordered).map((item) => item.productId)).toEqual(["latte", "coffee"]);
  });

  it("preserves immutable dispatch batches and makes repeated commands idempotent", async () => {
    const service = createMockRestaurantService();
    const initial = ticket(line("coffee", "قهوة", 1, 1_800));
    const created = await service.createOpenOrder({
      commandId: "create-table-1",
      ticket: initial,
      servicePlaceId: "table-01",
    });

    expect(created.kitchenBatches).toHaveLength(1);
    expect(created.kitchenBatches[0]).toEqual(expect.objectContaining({
      commandId: "create-table-1",
      revision: 1,
      lines: [expect.objectContaining({ productId: "coffee", quantity: 1, kind: "add" })],
    }));

    const proposed = ticket(
      line("coffee", "قهوة", 1, 1_800),
      line("latte", "لاتيه", 1, 2_200),
    );
    const updated = await service.updateOpenOrder({
      commandId: "update-table-1",
      openOrderId: created.id,
      ticket: proposed,
    });

    expect(updated.kitchenRevision).toBe(2);
    expect(updated.kitchenBatches).toHaveLength(2);
    expect(updated.kitchenBatches[0]).toEqual(created.kitchenBatches[0]);
    expect(updated.kitchenBatches[1]?.lines).toEqual([
      expect.objectContaining({ productId: "latte", quantity: 1, kind: "add" }),
    ]);

    const repeated = await service.updateOpenOrder({
      commandId: "update-table-1",
      openOrderId: created.id,
      ticket: proposed,
    });
    expect(repeated.kitchenRevision).toBe(2);
    expect(repeated.kitchenBatches).toHaveLength(2);
  });
});
