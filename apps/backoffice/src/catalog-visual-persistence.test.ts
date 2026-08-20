import { beforeEach, describe, expect, it } from "vitest";
import { BROWSER_CATALOG_STORAGE_KEY, createBrowserCatalogAdmin } from "../../../adapters/catalog/browserCatalog";

describe("BO-FLOW-002 catalog visual identity", () => {
  beforeEach(() => {
    window.localStorage.removeItem(BROWSER_CATALOG_STORAGE_KEY);
  });

  it("persists category/group colors and item image appearance across adapter restart", async () => {
    const first = createBrowserCatalogAdmin();

    const category = await first.createCategory({
      commandId: "visual-category-1",
      name: "البيتزا",
      color: "#EB5757",
    });

    const optionGroup = await first.createOptionGroup({
      commandId: "visual-option-1",
      group: {
        name: "أحجام البيتزا المرئية",
        color: "#2D8CFF",
        values: [
          { name: "صغير", price: { halalas: 1000, currency: "SAR" } },
          { name: "كبير", price: { halalas: 2000, currency: "SAR" } },
        ],
      },
    });

    const modifier = await first.createModifierGroup({
      commandId: "visual-modifier-1",
      modifier: {
        name: "إضافات البيتزا المرئية",
        color: "#9B51E0",
        options: [{ name: "جبن", price: { halalas: 300, currency: "SAR" } }],
      },
    });

    const imageDataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB";
    const item = await first.createItem({
      commandId: "visual-item-1",
      item: {
        name: "بيتزا مرئية",
        description: "",
        categoryId: category.id,
        price: { halalas: 1500, currency: "SAR" },
        pricing: { mode: "fixed" },
        sku: "VISUAL-PIZZA",
        barcode: "",
        availableForSale: true,
        appearance: {
          mode: "image",
          color: "#F2994A",
          shape: "circle",
          imageDataUrl,
        },
        modifierGroupIds: [modifier.id],
        privateModifierGroups: [],
        variantOptions: [],
        variants: [],
      },
    });

    expect(item.appearance).toEqual({
      mode: "image",
      color: "#F2994A",
      shape: "circle",
      imageDataUrl,
    });

    const restarted = createBrowserCatalogAdmin();
    const [reloadedItem, categories, optionGroups, modifiers] = await Promise.all([
      restarted.getItem({ itemId: item.id }),
      restarted.listCategories(),
      restarted.listOptionGroups(),
      restarted.listModifierGroups(),
    ]);

    expect(reloadedItem.appearance).toEqual(item.appearance);
    expect(categories.find((candidate) => candidate.id === category.id)?.color).toBe("#EB5757");
    expect(optionGroups.find((candidate) => candidate.id === optionGroup.id)?.color).toBe("#2D8CFF");
    expect(modifiers.find((candidate) => candidate.id === modifier.id)?.color).toBe("#9B51E0");
  });
});
