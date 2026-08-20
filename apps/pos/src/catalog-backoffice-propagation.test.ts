import { describe, expect, it } from "vitest";
import { createBrowserCatalogAdmin } from "../../../adapters/catalog/browserCatalog";
import { createMockPosRuntime } from "./adapters/mockPos";

describe("BO-FLOW-002 catalog propagation into POS", () => {
  it("makes a Back Office item searchable and sellable in POS, then applies edits and availability", async () => {
    const admin = createBrowserCatalogAdmin();
    const created = await admin.createItem({
      commandId: "bo-create-matcha",
      item: {
        name: "ماتشا لاتيه",
        description: "",
        categoryId: "hot",
        price: { halalas: 2450, currency: "SAR" },
        sku: "HOT-099",
        barcode: "628100009999",
        availableForSale: true,
      },
    });

    const pos = createMockPosRuntime();
    const bySku = await pos.catalog.search({ query: "HOT-099", categoryId: "all" });
    expect(bySku).toHaveLength(1);
    expect(bySku[0]).toMatchObject({ id: created.id, name: "ماتشا لاتيه" });

    let ticket = await pos.sales.startTicket({ commandId: "catalog-ticket-1" });
    ticket = await pos.sales.addItem({ commandId: "catalog-add-1", ticketId: ticket.id, productId: created.id });
    expect(ticket.lines[0]?.unitPrice.halalas).toBe(2450);

    await admin.updateItem({
      commandId: "bo-update-matcha-price",
      itemId: created.id,
      item: {
        name: "ماتشا لاتيه كبير",
        description: "",
        categoryId: "hot",
        price: { halalas: 2700, currency: "SAR" },
        sku: "HOT-099",
        barcode: "628100009999",
        availableForSale: true,
      },
    });

    const updatedSearch = await pos.catalog.search({ query: "628100009999", categoryId: "all" });
    expect(updatedSearch[0]).toMatchObject({ name: "ماتشا لاتيه كبير" });
    expect(updatedSearch[0]?.price.halalas).toBe(2700);

    const freshPos = createMockPosRuntime();
    let freshTicket = await freshPos.sales.startTicket({ commandId: "catalog-ticket-2" });
    freshTicket = await freshPos.sales.addItem({ commandId: "catalog-add-2", ticketId: freshTicket.id, productId: created.id });
    expect(freshTicket.lines[0]?.unitPrice.halalas).toBe(2700);

    await admin.updateItem({
      commandId: "bo-disable-matcha",
      itemId: created.id,
      item: {
        name: "ماتشا لاتيه كبير",
        description: "",
        categoryId: "hot",
        price: { halalas: 2700, currency: "SAR" },
        sku: "HOT-099",
        barcode: "628100009999",
        availableForSale: false,
      },
    });

    expect(await freshPos.catalog.search({ query: "HOT-099", categoryId: "all" })).toHaveLength(0);
    await expect(freshPos.sales.addItem({ commandId: "catalog-add-disabled", ticketId: freshTicket.id, productId: created.id }))
      .rejects.toMatchObject({ code: "PRODUCT_NOT_FOUND" });
  });
});
