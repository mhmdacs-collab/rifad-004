import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import App from "./App";
import { getBackOfficeCatalogAdmin } from "./runtime/backOfficeCatalog";

describe("Back Office composition root stability", () => {
  it("keeps one catalog adapter while navigating between catalog pages", async () => {
    const user = userEvent.setup();
    const catalog = getBackOfficeCatalogAdmin();

    expect(getBackOfficeCatalogAdmin()).toBe(catalog);

    render(<App catalog={catalog} />);
    await screen.findByText("قهوة سعودية");

    await user.click(screen.getByRole("button", { name: "الفئات" }));
    expect(screen.getByRole("heading", { name: "الفئات" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "الإضافات" }));
    expect(screen.getByRole("heading", { name: "الإضافات" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "قائمة الأصناف" }));
    expect(await screen.findByText("قهوة سعودية")).toBeInTheDocument();
  });
});
