import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { createBrowserCatalogAdmin } from "../../../adapters/catalog/browserCatalog";
import App from "./App";

describe("BO-FLOW-002 catalog management", () => {
  it("creates and edits an item through the Rifad catalog admin contract", async () => {
    const user = userEvent.setup();
    const catalog = createBrowserCatalogAdmin();
    render(<App catalog={catalog} />);

    await screen.findByText("قهوة سعودية");
    await user.click(screen.getByRole("button", { name: /إضافة صنف/ }));

    await user.type(screen.getByLabelText("اسم الصنف"), "ماتشا لاتيه");
    await user.selectOptions(screen.getByLabelText("فئة الصنف"), "hot");
    const price = screen.getByLabelText("السعر الأساسي");
    await user.clear(price);
    await user.type(price, "24.50");
    await user.type(screen.getByLabelText("SKU"), "HOT-099");
    await user.type(screen.getByLabelText("الباركود"), "628100009999");
    await user.click(screen.getByRole("button", { name: "حفظ" }));

    await screen.findByText("ماتشا لاتيه");
    let stored = await catalog.listItems({ query: "HOT-099", includeUnavailable: true });
    expect(stored).toHaveLength(1);
    expect(stored[0]?.price.halalas).toBe(2450);

    await user.click(screen.getByText("ماتشا لاتيه"));
    const editPrice = screen.getByLabelText("السعر الأساسي");
    await user.clear(editPrice);
    await user.type(editPrice, "25.00");
    await user.click(screen.getByLabelText("متاح للبيع"));
    await user.click(screen.getByRole("button", { name: "حفظ" }));

    await waitFor(async () => {
      stored = await catalog.listItems({ query: "HOT-099", includeUnavailable: true });
      expect(stored[0]?.price.halalas).toBe(2500);
      expect(stored[0]?.availableForSale).toBe(false);
    });
    expect(screen.getByText("غير متاح")).toBeInTheDocument();
  });

  it("creates variant options and persists generated combinations with independent identities", async () => {
    const user = userEvent.setup();
    const catalog = createBrowserCatalogAdmin();
    render(<App catalog={catalog} />);

    await screen.findByText("قهوة سعودية");
    await user.click(screen.getByRole("button", { name: /إضافة صنف/ }));
    await user.type(screen.getByLabelText("اسم الصنف"), "آيس لاتيه");
    const price = screen.getByLabelText("السعر الأساسي");
    await user.clear(price);
    await user.type(price, "20.00");

    await user.click(screen.getByRole("button", { name: /إضافة متغيرات/ }));
    await user.type(screen.getByLabelText("اسم خيار المتغير 1"), "الحجم");
    const valueInput = screen.getByLabelText("قيمة جديدة للخيار 1");
    await user.type(valueInput, "صغير");
    await user.click(screen.getByRole("button", { name: "إضافة" }));
    await user.type(screen.getByLabelText("قيمة جديدة للخيار 1"), "كبير");
    await user.click(screen.getByRole("button", { name: "إضافة" }));

    expect(screen.getByText("2 تركيبة")).toBeInTheDocument();
    await user.type(screen.getByLabelText("SKU صغير"), "ICE-S");
    await user.type(screen.getByLabelText("SKU كبير"), "ICE-L");
    await user.click(screen.getByRole("button", { name: "حفظ" }));

    const stored = await catalog.listItems({ query: "آيس لاتيه", includeUnavailable: true });
    expect(stored).toHaveLength(1);
    expect(stored[0]?.variantOptions).toHaveLength(1);
    expect(stored[0]?.variants).toHaveLength(2);
    expect(stored[0]?.variants?.map((variant) => variant.sku).sort()).toEqual(["ICE-L", "ICE-S"]);
  });

  it("creates a modifier group and assigns it to an item", async () => {
    const user = userEvent.setup();
    const catalog = createBrowserCatalogAdmin();
    render(<App catalog={catalog} />);

    await screen.findByText("قهوة سعودية");
    await user.click(screen.getByRole("button", { name: "الإضافات" }));
    await user.click(screen.getByRole("button", { name: /إضافة مجموعة/ }));
    await user.type(screen.getByLabelText("اسم مجموعة الإضافات"), "إضافات الساندويتش");
    await user.type(screen.getByLabelText("اسم الإضافة 1"), "جبن إضافي");
    const optionPrice = screen.getByLabelText("سعر الإضافة 1");
    await user.clear(optionPrice);
    await user.type(optionPrice, "2.00");
    await user.click(screen.getByRole("button", { name: "حفظ" }));

    await screen.findByText("إضافات الساندويتش");
    const modifiers = await catalog.listModifierGroups();
    const created = modifiers.find((modifier) => modifier.name === "إضافات الساندويتش");
    expect(created?.options[0]?.price.halalas).toBe(200);

    await user.click(screen.getByRole("button", { name: "قائمة الأصناف" }));
    await user.click(screen.getByRole("button", { name: /إضافة صنف/ }));
    await user.type(screen.getByLabelText("اسم الصنف"), "ساندويتش دجاج");
    await user.click(screen.getByRole("checkbox", { name: /إضافات الساندويتش/ }));
    await user.click(screen.getByRole("button", { name: "حفظ" }));

    const stored = await catalog.listItems({ query: "ساندويتش دجاج", includeUnavailable: true });
    expect(stored[0]?.modifierGroupIds).toEqual([created?.id]);
  });

  it("adds and edits categories from the Back Office navigation", async () => {
    const user = userEvent.setup();
    const catalog = createBrowserCatalogAdmin();
    render(<App catalog={catalog} />);

    await screen.findByText("قهوة سعودية");
    await user.click(screen.getByRole("button", { name: "الفئات" }));
    await user.click(screen.getByRole("button", { name: /إضافة فئة/ }));
    await user.type(screen.getByLabelText("اسم الفئة"), "الفطور");
    await user.click(screen.getByRole("button", { name: "حفظ" }));
    expect(await screen.findByText("الفطور")).toBeInTheDocument();

    await user.click(screen.getByText("الفطور"));
    const categoryName = screen.getByLabelText("اسم الفئة");
    await user.clear(categoryName);
    await user.type(categoryName, "وجبات الفطور");
    await user.click(screen.getByRole("button", { name: "حفظ" }));

    await waitFor(async () => {
      const categories = await catalog.listCategories();
      expect(categories.some((category) => category.name === "وجبات الفطور")).toBe(true);
    });
  });
});
