import { describe, expect, it } from "vitest";
import { createMockRestaurantService } from "./adapters/mockRestaurantService";
import type { Ticket, TicketLine } from "./domain/models";
import { aggregateSentQuantities, diffKitchenTickets, ticketToKitchenAdditions } from "./domain/kitchenDelta";

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
    expect(created.kitchenBatches[0]?.lines[0]?.quantity).toBe(1);
  });

  it("models same-product additions as a new pending-owned line and never lowers sent truth", async () => {
    const service = createMockRestaurantService();
    const initial = ticket(line("coffee", "قهوة", 2, 1_800));
    const created = await service.createOpenOrder({
      commandId: "create-ownership-1",
      ticket: initial,
      servicePlaceId: "table-01",
    });

    expect(created.ticket.lines).toEqual([
      expect.objectContaining({ productId: "coffee", quantity: 2, kitchenState: "sent" }),
    ]);

    const pendingOne = line("coffee", "قهوة", 1, 1_800);
    const workingOne = ticket(
      { ...created.ticket.lines[0]!, kitchenState: "sent" },
      { ...pendingOne, id: "pending-coffee", kitchenState: "pending" },
    );
    const firstUpdate = await service.updateOpenOrder({
      commandId: "update-ownership-1",
      openOrderId: created.id,
      ticket: workingOne,
    });
    expect(firstUpdate.kitchenBatches.map((batch) => batch.lines.map((item) => item.quantity))).toEqual([[2], [1]]);
    expect(firstUpdate.kitchenBatches[0]?.lines[0]?.quantity).toBe(2);
    expect(firstUpdate.ticket.lines.filter((item) => item.productId === "coffee").every((item) => item.kitchenState === "sent")).toBe(true);

    const pendingTwo = { ...pendingOne, id: "pending-coffee-2", quantity: 2, kitchenState: "pending" as const };
    const workingTwo = ticket(
      // The committed ticket after the first send includes both the original
      // and the newly sent line. Reusing only the initial snapshot would
      // intentionally look like deleting a sent line, which the ownership
      // contract must reject.
      ...firstUpdate.ticket.lines,
      pendingTwo,
    );
    const secondUpdate = await service.updateOpenOrder({
      commandId: "update-ownership-2",
      openOrderId: created.id,
      ticket: workingTwo,
    });
    expect(secondUpdate.kitchenBatches.map((batch) => batch.lines.map((item) => item.quantity))).toEqual([[2], [1], [2]]);
    expect(secondUpdate.kitchenBatches[0]?.lines[0]?.quantity).toBe(2);
    expect(secondUpdate.kitchenBatches[1]?.lines[0]?.quantity).toBe(1);

    await expect(service.updateOpenOrder({
      commandId: "invalid-reduction",
      openOrderId: created.id,
      ticket: ticket({ ...created.ticket.lines[0]!, quantity: 1, kitchenState: "sent" }),
    })).rejects.toMatchObject({ code: "SENT_LINE_IMMUTABLE" });

    const replayedCreate = await service.createOpenOrder({
      commandId: "create-ownership-1",
      ticket: initial,
      servicePlaceId: "table-01",
    });
    expect(replayedCreate.id).toBe(created.id);
  });

  it("folds immutable kitchen history into a sent quantity floor", () => {
    const batches = [
      {
        id: "batch-1",
        commandId: "send-1",
        revision: 1,
        sentAt: "2026-08-21T00:00:00.000Z",
        lines: [{ id: "batch-1:coffee", productId: "coffee", name: "قهوة", unitPrice: { halalas: 1_800, currency: "SAR" as const }, quantity: 2, kind: "add" as const }],
      },
      {
        id: "batch-2",
        commandId: "send-2",
        revision: 2,
        sentAt: "2026-08-21T00:01:00.000Z",
        lines: [{ id: "batch-2:coffee", productId: "coffee", name: "قهوة", unitPrice: { halalas: 1_800, currency: "SAR" as const }, quantity: 1, kind: "add" as const }],
      },
    ];
    expect(aggregateSentQuantities(batches).get("coffee")).toBe(3);
  });

  it("keeps sent history immutable while explicit correction appends reduce/cancel deltas", async () => {
    const service = createMockRestaurantService();
    const initial = ticket(
      line("coffee", "قهوة", 3, 1_800),
      line("latte", "لاتيه", 1, 2_200),
    );
    const created = await service.createOpenOrder({
      commandId: "create-correction-1",
      ticket: initial,
      servicePlaceId: "table-01",
    });

    const ordinaryReduction = ticket(
      { ...created.ticket.lines[0]!, quantity: 1, kitchenState: "sent" },
    );
    await expect(service.updateOpenOrder({
      commandId: "ordinary-reduction",
      openOrderId: created.id,
      ticket: ordinaryReduction,
    })).rejects.toMatchObject({ code: "SENT_LINE_IMMUTABLE" });

    const corrected = await service.updateOpenOrder({
      commandId: "explicit-correction",
      openOrderId: created.id,
      ticket: ordinaryReduction,
      allowSentCorrections: true,
    });
    expect(corrected.kitchenBatches).toHaveLength(2);
    expect(corrected.kitchenBatches[0]).toEqual(created.kitchenBatches[0]);
    expect(corrected.kitchenBatches[1]?.lines).toEqual([
      expect.objectContaining({ productId: "coffee", quantity: 2, kind: "reduce" }),
      expect.objectContaining({ productId: "latte", quantity: 1, kind: "cancel" }),
    ]);
    expect(corrected.ticket.lines).toEqual([
      expect.objectContaining({ productId: "coffee", quantity: 1, kitchenState: "sent" }),
    ]);
  });

  it("rejects a new line marked sent without a committed kitchen ownership", async () => {
    const service = createMockRestaurantService();
    const created = await service.createOpenOrder({
      commandId: "create-unknown-sent-1",
      ticket: ticket(line("coffee", "قهوة", 1, 1_800)),
      servicePlaceId: "table-01",
    });

    const forged = ticket(
      ...created.ticket.lines,
      { ...line("latte", "لاتيه", 1, 2_200), id: "forged-sent-line", kitchenState: "sent" },
    );
    await expect(service.updateOpenOrder({
      commandId: "unknown-sent-line",
      openOrderId: created.id,
      ticket: forged,
    })).rejects.toMatchObject({ code: "SENT_LINE_IMMUTABLE" });
  });

  it("does not expose mutable references to sent ticket history", async () => {
    const service = createMockRestaurantService();
    const created = await service.createOpenOrder({
      commandId: "clone-order-1",
      ticket: ticket(line("coffee", "قهوة", 1, 1_800)),
      servicePlaceId: "table-01",
    });

    const exposed = created as any;
    exposed.ticket.lines[0].quantity = 99;
    exposed.kitchenBatches[0].lines[0].quantity = 99;

    const reread = await service.getOpenOrder({ openOrderId: created.id });
    expect(reread.ticket.lines[0]?.quantity).toBe(1);
    expect(reread.kitchenBatches[0]?.lines[0]?.quantity).toBe(1);
  });
});
