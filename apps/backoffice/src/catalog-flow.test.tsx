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

    await user.type(screen.getByLabelText(/اسم الصنف/), "ماتشا لاتيه");
    await user.selectOptions(screen.getByLabelText("فئة الصنف"), "hot");
    const price = screen.getByLabelText("السعر الأساسي") as HTMLInputElement;
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
    const editPrice = screen.getByLabelText("السعر الأساسي") as HTMLInputElement;
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

  it("blocks duplicate SKU and keeps the editor open with a visible error", async () => {
    const user = userEvent.setup();
    render(<App catalog={createBrowserCatalogAdmin()} />);
    await screen.findByText("قهوة سعودية");
    await user.click(screen.getByRole("button", { name: /إضافة صنف/ }));
    await user.type(screen.getByLabelText(/اسم الصنف/), "صنف مكرر");
    await user.type(screen.getByLabelText("SKU"), "HOT-001");
    await user.click(screen.getByRole("button", { name: "حفظ" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("SKU مستخدم لصنف آخر");
  });
});
