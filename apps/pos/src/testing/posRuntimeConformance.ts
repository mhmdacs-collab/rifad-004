import type { PosRuntimeContract } from "../contracts/pos";

export type PosRuntimeConformanceResult = Readonly<{
  productId: string;
  ticketId: string;
  receiptId: string;
  receiptNumber: string;
  receiptCount: number;
}>;

type PosRuntimeConformanceOptions = Readonly<{
  prepare?: (runtime: PosRuntimeContract) => Promise<void>;
}>;

/**
 * Small reusable behavioral probe for any future PosRuntimeContract adapter.
 *
 * Adapter-specific authentication/setup may happen in `prepare`; the actual
 * sale path below stays Rifad-owned and identical for local, remote, donor,
 * or Rifad-native implementations.
 */
export async function exercisePosRuntimeContract(
  runtime: PosRuntimeContract,
  options: PosRuntimeConformanceOptions = {},
): Promise<PosRuntimeConformanceResult> {
  await options.prepare?.(runtime);

  const categories = await runtime.catalog.categories();
  const products = await runtime.catalog.search({ query: "", categoryId: "all" });
  const pages = await runtime.saleLayout.listPages();

  if (categories.length === 0) throw new Error("POS_RUNTIME_CONFORMANCE_NO_CATEGORIES");
  if (products.length === 0) throw new Error("POS_RUNTIME_CONFORMANCE_NO_PRODUCTS");
  if (pages.length === 0) throw new Error("POS_RUNTIME_CONFORMANCE_NO_SALE_PAGES");

  const product = products[0]!;
  const ticket = await runtime.sales.startTicket({ commandId: `conformance-ticket-${crypto.randomUUID()}` });
  const populated = await runtime.sales.addItem({
    commandId: `conformance-add-${crypto.randomUUID()}`,
    ticketId: ticket.id,
    productId: product.id,
  });
  const checkout = await runtime.checkout.begin({
    commandId: `conformance-checkout-${crypto.randomUUID()}`,
    ticketId: populated.id,
  });
  await runtime.checkout.selectPaymentMethod({ checkoutId: checkout.checkoutId, method: "cash" });

  const completionCommandId = `conformance-cash-${crypto.randomUUID()}`;
  const receipt = await runtime.checkout.completeCashSale({
    commandId: completionCommandId,
    checkoutId: checkout.checkoutId,
    tendered: populated.total,
  });
  const duplicate = await runtime.checkout.completeCashSale({
    commandId: completionCommandId,
    checkoutId: checkout.checkoutId,
    tendered: populated.total,
  });

  if (duplicate.id !== receipt.id) throw new Error("POS_RUNTIME_CONFORMANCE_NON_IDEMPOTENT_COMPLETION");

  const receipts = await runtime.receipts.list();
  if (!receipts.some((item) => item.id === receipt.id)) throw new Error("POS_RUNTIME_CONFORMANCE_RECEIPT_NOT_LISTED");

  return {
    productId: product.id,
    ticketId: populated.id,
    receiptId: receipt.id,
    receiptNumber: receipt.number,
    receiptCount: receipts.length,
  };
}
