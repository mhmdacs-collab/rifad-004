import type { Money, Ticket, TicketLine } from "./models";

export type KitchenDeltaKind = "add" | "reduce" | "cancel";

export type KitchenDeltaLine = Readonly<{
  id: string;
  productId: string;
  name: string;
  unitPrice: Money;
  quantity: number;
  kind: KitchenDeltaKind;
}>;

export type KitchenDispatchBatch = Readonly<{
  id: string;
  commandId: string;
  revision: number;
  sentAt: string;
  lines: readonly KitchenDeltaLine[];
}>;

type ProductQuantity = Readonly<{
  line: TicketLine;
  quantity: number;
}>;

const aggregateLines = (ticket: Ticket) => {
  const result = new Map<string, ProductQuantity>();
  for (const line of ticket.lines) {
    const current = result.get(line.productId);
    result.set(line.productId, {
      line,
      quantity: (current?.quantity ?? 0) + line.quantity,
    });
  }
  return result;
};

const deltaLine = (line: TicketLine, quantity: number, kind: KitchenDeltaKind): KitchenDeltaLine => ({
  id: `${kind}:${line.productId}`,
  productId: line.productId,
  name: line.name,
  unitPrice: line.unitPrice,
  quantity,
  kind,
});

export const ticketToKitchenAdditions = (ticket: Ticket): readonly KitchenDeltaLine[] =>
  Array.from(aggregateLines(ticket).values()).map(({ line, quantity }) => deltaLine(line, quantity, "add"));

export const diffKitchenTickets = (previous: Ticket, proposed: Ticket): readonly KitchenDeltaLine[] => {
  const before = aggregateLines(previous);
  const after = aggregateLines(proposed);
  const changes: KitchenDeltaLine[] = [];

  for (const { line, quantity } of after.values()) {
    const previousQuantity = before.get(line.productId)?.quantity ?? 0;
    if (quantity > previousQuantity) {
      changes.push(deltaLine(line, quantity - previousQuantity, "add"));
    } else if (quantity < previousQuantity) {
      changes.push(deltaLine(line, previousQuantity - quantity, quantity === 0 ? "cancel" : "reduce"));
    }
  }

  for (const [productId, { line, quantity }] of before) {
    if (!after.has(productId)) changes.push(deltaLine(line, quantity, "cancel"));
  }

  return changes;
};
