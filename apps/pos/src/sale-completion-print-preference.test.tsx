import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import App from "./App";
import { PRINT_RECEIPT_ALWAYS_KEY } from "./domain/posPreferences";

const STORAGE_KEY = "rifad.pos.mock.v1";

const productGrid = () => within(document.querySelector(".product-grid") as HTMLElement);

const unlockPos = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("button", { name: "تسجيل الدخول" }));
  await screen.findByRole("heading", { name: "أدخل الرقم السري" });
  for (const digit of ["1", "2", "3", "4"]) {
    await user.click(screen.getByRole("button", { name: `رقم ${digit}` }));
  }
  await screen.findByRole("button", { name: /قهوة سعودية/ });
};

const completeCashSale = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(productGrid().getByRole("button", { name: /قهوة سعودية/ }));
  await user.click(screen.getByRole("button", { name: "دفع" }));
  await screen.findByText("اختيار طريقة الدفع");
  await user.click(screen.getByRole("button", { name: /نقدًا/ }));
  await screen.findByRole("heading", { name: /ريال سعودي/ });
  await user.click(screen.getByRole("button", { name: "سداد" }));
};

afterEach(() => {
  window.localStorage.removeItem(PRINT_RECEIPT_ALWAYS_KEY);
  window.localStorage.removeItem(STORAGE_KEY);
});

describe("sale completion print preference", () => {
  it("leaves the current receipt on screen and skips the summary starting with the next sale", async () => {
    const user = userEvent.setup();
    render(<App />);
    await unlockPos(user);

    await completeCashSale(user);
    expect(await screen.findByRole("heading", { name: "تمت عملية البيع بنجاح" })).toBeInTheDocument();

    const alwaysPrint = screen.getByRole("checkbox", { name: /طباعة الإيصال دائمًا/ });
    await user.click(alwaysPrint);

    expect(alwaysPrint).toBeChecked();
    expect(window.localStorage.getItem(PRINT_RECEIPT_ALWAYS_KEY)).toBe("1");
    expect(screen.getByRole("heading", { name: "تمت عملية البيع بنجاح" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "بيع جديد" }));
    await screen.findByRole("button", { name: /قهوة سعودية/ });

    await completeCashSale(user);

    await waitFor(() => expect(screen.queryByRole("heading", { name: "تمت عملية البيع بنجاح" })).not.toBeInTheDocument());
    expect(productGrid().getByRole("button", { name: /قهوة سعودية/ })).toBeInTheDocument();
  });
});
