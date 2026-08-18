import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { createBrowserCatalogAdmin } from "../../../adapters/catalog/browserCatalog";
import App from "./App";

describe("BO-FLOW-002 catalog management", () => {
  it("creates and edits a fixed-price item through the Rifad catalog admin contract", async () => {
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
    await user.click(screen.getByRole("button", { name: "حفظ الصنف" }));

    await screen.findByText("ماتشا لاتيه");
    let stored = await catalog.listItems({ query: "HOT-099", includeUnavailable: true, includeOptionPriced: true });
    expect(stored).toHaveLength(1);
    expect(stored[0]?.price.halalas).toBe(2450);
    expect(stored[0]?.pricing).toEqual({ mode: "fixed" });

    await user.click(screen.getByText("ماتشا لاتيه"));
    const editPrice = screen.getByLabelText("السعر الأساسي");
    await user.clear(editPrice);
    await user.type(editPrice, "25.00");
    await user.click(screen.getByLabelText("متاح للبيع"));
    await user.click(screen.getByRole("button", { name: "حفظ الصنف" }));

    await waitFor(async () => {
      stored = await catalog.listItems({ query: "HOT-099", includeUnavailable: true, includeOptionPriced: true });
      expect(stored[0]?.price.halalas).toBe(2500);
      expect(stored[0]?.availableForSale).toBe(false);
    });
    expect(screen.getByText("غير متاح")).toBeInTheDocument();
  });

  it("reuses one option-price group across an item and supports a sparse item-specific override", async () => {
    const user = userEvent.setup();
    const catalog = createBrowserCatalogAdmin();
    render(<App catalog={catalog} />);

    await screen.findByText("قهوة سعودية");
    await user.click(screen.getByRole("button", { name: /إضافة صنف/ }));
    await user.type(screen.getByLabelText("اسم الصنف"), "بيتزا ببروني");
    await user.type(screen.getByLabelText("SKU"), "PIZZA-PEP");
    await user.click(screen.getByLabelText("أسعار متعددة"));

    expect(screen.getByLabelText("السعر الأساسي")).toBeDisabled();
    expect(screen.getByLabelText("مجموعة الخيارات")).toHaveValue("option-pizza-size");
    expect(screen.getByLabelText("سعر صغير")).toBeDisabled();
    expect(screen.getByLabelText("سعر وسط")).toBeDisabled();
    expect(screen.getByLabelText("سعر كبير")).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "حفظ الصنف" }));
    await screen.findByText("بيتزا ببروني");

    let stored = await catalog.listItems({ query: "PIZZA-PEP", includeUnavailable: true, includeOptionPriced: true });
    expect(stored).toHaveLength(1);
    expect(stored[0]?.pricing).toMatchObject({ mode: "option-group", groupId: "option-pizza-size", priceMode: "inherit" });
    expect(stored[0]?.price.halalas).toBe(1000);

    const cashierVisible = await catalog.listItems({ query: "PIZZA-PEP", includeUnavailable: true });
    expect(cashierVisible).toHaveLength(0);

    await user.click(screen.getByText("بيتزا ببروني"));
    await user.click(screen.getByLabelText("تخصيص الأسعار لهذا الصنف"));
    const small = screen.getByLabelText("سعر صغير");
    await user.clear(small);
    await user.type(small, "12.00");
    await user.click(screen.getByRole("button", { name: "حفظ الصنف" }));

    stored = await catalog.listItems({ query: "PIZZA-PEP", includeUnavailable: true, includeOptionPriced: true });
    expect(stored[0]?.pricing).toMatchObject({ mode: "option-group", groupId: "option-pizza-size", priceMode: "custom" });
    if (stored[0]?.pricing?.mode !== "option-group") throw new Error("expected option group pricing");
    expect(stored[0].pricing.overrides).toHaveLength(1);
    expect(stored[0].pricing.overrides[0]?.price.halalas).toBe(1200);
    expect(stored[0]?.price.halalas).toBe(1200);
  });

  it("creates a reusable option group once and exposes it for later item assignment", async () => {
    const user = userEvent.setup();
    const catalog = createBrowserCatalogAdmin();
    render(<App catalog={catalog} />);

    await screen.findByText("قهوة سعودية");
    await user.click(screen.getByRole("button", { name: "مجموعات الخيارات" }));
    await user.click(screen.getByRole("button", { name: /إضافة مجموعة/ }));
    await user.type(screen.getByLabelText("اسم مجموعة الخيارات"), "أحجام العصائر");

    const names = screen.getAllByLabelText(/اسم الخيار \d/);
    await user.type(names[0]!, "عادي");
    await user.type(names[1]!, "كبير");
    const prices = screen.getAllByLabelText(/سعر الخيار \d/);
    await user.clear(prices[0]!); await user.type(prices[0]!, "8.00");
    await user.clear(prices[1]!); await user.type(prices[1]!, "12.00");
    await user.click(screen.getByRole("button", { name: "حفظ المجموعة" }));

    expect(await screen.findByText("أحجام العصائر")).toBeInTheDocument();
    const groups = await catalog.listOptionGroups();
    const created = groups.find((group) => group.name === "أحجام العصائر");
    expect(created?.values.map((value) => [value.name, value.price.halalas])).toEqual([["عادي", 800], ["كبير", 1200]]);
  });

  it("supports item-only multiple prices without creating a reusable group", async () => {
    const user = userEvent.setup();
    const catalog = createBrowserCatalogAdmin();
    render(<App catalog={catalog} />);

    await screen.findByText("قهوة سعودية");
    await user.click(screen.getByRole("button", { name: /إضافة صنف/ }));
    await user.type(screen.getByLabelText("اسم الصنف"), "بيتزا خاصة");
    await user.click(screen.getByLabelText("أسعار متعددة"));
    await user.click(screen.getByRole("button", { name: "خيارات خاصة بهذا الصنف" }));

    const names = screen.getAllByLabelText("اسم الخيار الخاص");
    await user.type(names[0]!, "فردي");
    await user.type(names[1]!, "عائلي");
    const individual = screen.getByLabelText("سعر فردي");
    await user.clear(individual); await user.type(individual, "15.00");
    const family = screen.getByLabelText("سعر عائلي");
    await user.clear(family); await user.type(family, "30.00");
    await user.click(screen.getByRole("button", { name: "حفظ الصنف" }));

    const stored = await catalog.listItems({ query: "بيتزا خاصة", includeUnavailable: true, includeOptionPriced: true });
    expect(stored[0]?.pricing?.mode).toBe("custom-options");
    if (stored[0]?.pricing?.mode !== "custom-options") throw new Error("expected custom pricing");
    expect(stored[0].pricing.values.map((value) => [value.name, value.price.halalas])).toEqual([["فردي", 1500], ["عائلي", 3000]]);
  });

  it("uses reusable general add-ons and item-private add-ons in the same item", async () => {
    const user = userEvent.setup();
    const catalog = createBrowserCatalogAdmin();
    render(<App catalog={catalog} />);

    await screen.findByText("قهوة سعودية");
    await user.click(screen.getByRole("button", { name: "الإضافات" }));
    await user.click(screen.getByRole("button", { name: /إضافة مجموعة/ }));
    await user.type(screen.getByLabelText("اسم مجموعة الإضافات"), "إضافات البيتزا");
    await user.type(screen.getByLabelText("اسم الإضافة 1"), "جبن إضافي");
    const optionPrice = screen.getByLabelText("سعر الإضافة 1");
    await user.clear(optionPrice); await user.type(optionPrice, "3.00");
    await user.click(screen.getByRole("button", { name: "حفظ المجموعة" }));

    const modifiers = await catalog.listModifierGroups();
    const created = modifiers.find((modifier) => modifier.name === "إضافات البيتزا");
    expect(created?.options[0]?.price.halalas).toBe(300);

    await user.click(screen.getByRole("button", { name: "قائمة الأصناف" }));
    await user.click(screen.getByRole("button", { name: /إضافة صنف/ }));
    await user.type(screen.getByLabelText("اسم الصنف"), "بيتزا رانش");
    await user.click(screen.getByRole("checkbox", { name: "إضافات البيتزا" }));
    await user.click(screen.getByRole("button", { name: "إضافة خاصة" }));
    await user.type(screen.getByLabelText("اسم الإضافات الخاصة"), "خيارات خاصة بالرانش");
    await user.type(screen.getByLabelText("اسم الإضافة الخاصة"), "رانش إضافي");
    const privatePrice = screen.getByLabelText("سعر رانش إضافي");
    await user.clear(privatePrice); await user.type(privatePrice, "2.50");
    await user.click(screen.getByRole("button", { name: "حفظ الصنف" }));

    const stored = await catalog.listItems({ query: "بيتزا رانش", includeUnavailable: true, includeOptionPriced: true });
    expect(stored[0]?.modifierGroupIds).toEqual([created?.id]);
    expect(stored[0]?.privateModifierGroups?.[0]?.name).toBe("خيارات خاصة بالرانش");
    expect(stored[0]?.privateModifierGroups?.[0]?.options[0]?.price.halalas).toBe(250);
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

    const categoryRow = screen.getByText("الفطور").closest("tr");
    expect(categoryRow).not.toBeNull();
    await user.click(within(categoryRow!).getByText("الفطور"));
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
