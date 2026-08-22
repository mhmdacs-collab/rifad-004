import type { Money, Ticket, TicketLine, TicketLineKitchenState } from "./models";

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

export const kitchenStateOf = (line: TicketLine): TicketLineKitchenState => line.kitchenState ?? "pending";

export const isPendingKitchenLine = (line: TicketLine): boolean => kitchenStateOf(line) === "pending";

export const isSentKitchenLine = (line: TicketLine): boolean => kitchenStateOf(line) === "sent";

/** Return the working lines which have not crossed the kitchen boundary. */
export const pendingKitchenTicketLines = (ticket: Ticket): readonly TicketLine[] =>
  ticket.lines.filter(isPendingKitchenLine);

/** Promote a ticket snapshot to the immutable, last-sent representation. */
export const markTicketLinesSent = (ticket: Ticket): Ticket => ({
  ...ticket,
  lines: ticket.lines.map((line) => ({ ...line, kitchenState: "sent" as const })),
});

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

const aggregateLineList = (lines: readonly TicketLine[]) => {
  const result = new Map<string, ProductQuantity>();
  for (const line of lines) {
    const current = result.get(line.productId);
    result.set(line.productId, {
      line,
      quantity: (current?.quantity ?? 0) + line.quantity,
    });
  }
  return result;
};

const deltaLine = (line: TicketLine, quantity: number, kind: KitchenDeltaKind, identity = line.productId): KitchenDeltaLine => ({
  id: `${kind}:${identity}`,
  productId: line.productId,
  name: line.name,
  unitPrice: line.unitPrice,
  quantity,
  kind,
});

export const ticketToKitchenAdditions = (ticket: Ticket): readonly KitchenDeltaLine[] =>
  Array.from(aggregateLines(ticket).values()).map(({ line, quantity }) => deltaLine(line, quantity, "add"));

/**
 * Build one pending kitchen delta from the current working batch only.
 * Same-product additions aggregate here, but never with a sent line.
 */
export const pendingTicketToKitchenAdditions = (ticket: Ticket): readonly KitchenDeltaLine[] =>
  Array.from(aggregateLineList(pendingKitchenTicketLines(ticket)).values())
    .map(({ line, quantity }) => deltaLine(line, quantity, "add"));

/**
 * Build characterization corrections against already-sent line ownership. A
 * correction is intentionally separate from pending additions: changing a
 * sent line never rewrites its historical batch, it appends a reduce/cancel
 * delta for the quantity that the kitchen already accepted. This helper is not
 * a cashier-facing correction or authorization flow.
 *
 * New snapshots preserve line IDs, so the primary path compares each sent
 * line by ID.  The product aggregate fallback keeps older persisted callers
 * compatible when they did not carry ownership markers.
 */
export const sentTicketToKitchenCorrections = (previous: Ticket, proposed: Ticket): readonly KitchenDeltaLine[] => {
  const hasOwnershipMarkers = proposed.lines.some((line) => line.kitchenState !== undefined);
  if (!hasOwnershipMarkers) {
    return diffKitchenTickets(previous, proposed).filter((line) => line.kind !== "add");
  }

  const proposedById = new Map(proposed.lines.map((line) => [line.id, line]));
  const corrections: KitchenDeltaLine[] = [];
  for (const previousLine of previous.lines.filter(isSentKitchenLine)) {
    const next = proposedById.get(previousLine.id);
    if (!next) {
      corrections.push(deltaLine(previousLine, previousLine.quantity, "cancel", previousLine.id));
      continue;
    }
    if (next.quantity > previousLine.quantity) continue;
    if (next.quantity < previousLine.quantity) {
      corrections.push(deltaLine(
        previousLine,
        previousLine.quantity - next.quantity,
        next.quantity === 0 ? "cancel" : "reduce",
        previousLine.id,
      ));
    }
  }
  return corrections;
};

/**
 * Fold immutable dispatch history into the net quantity already accepted by
 * the kitchen. This is also used when validating/migrating older snapshots.
 */
export const aggregateSentQuantities = (batches: readonly KitchenDispatchBatch[]): ReadonlyMap<string, number> => {
  const quantities = new Map<string, number>();
  for (const batch of batches) {
    for (const line of batch.lines) {
      const current = quantities.get(line.productId) ?? 0;
      quantities.set(line.productId, current + (line.kind === "add" ? line.quantity : -line.quantity));
    }
  }
  for (const [productId, quantity] of quantities) quantities.set(productId, Math.max(0, quantity));
  return quantities;
};

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
