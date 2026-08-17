import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import App from "./App";

const SALE_SCREEN_MODE_KEY = "rifad.pos.sale-screen-mode.v1";
const STORAGE_KEY = "rifad.pos.mock.v1";

const unlockPos = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("button", { name: "تسجيل الدخول" }));
  await screen.findByRole("heading", { name: "أدخل الرقم السري" });
  for (const digit of ["1", "2", "3", "4"]) {
    await user.click(screen.getByRole("button", { name: `رقم ${digit}` }));
  }
};

afterEach(() => {
  window.localStorage.removeItem(SALE_SCREEN_MODE_KEY);
  window.localStorage.removeItem(STORAGE_KEY);
});

describe("transaction operation card", () => {
  it("cancels an unpaid invoice from the checkout action card and returns to an empty sale", async () => {
    const user = userEvent.setup();
    render(<App />);

    await unlockPos(user);
    await user.click(await screen.findByRole("button", { name: /قهوة سعودية/ }));
    await user.click(screen.getByRole("button", { name: "دفع" }));
    await screen.findByText("اختيار طريقة الدفع");
    await user.click(screen.getByRole("button", { name: /نقدًا/ }));

    expect(await screen.findByRole("button", { name: "إلغاء الفاتورة" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "سداد" })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "إلغاء الفاتورة" }));

    expect(await screen.findByText("التذكرة فارغة")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "تمت عملية البيع بنجاح" })).not.toBeInTheDocument();
    await waitFor(() => expect(window.localStorage.getItem(STORAGE_KEY)).not.toContain('"receipt"'));
  });

  it("keeps both debt settlement and Pay visible on an empty Quick Sale ticket", async () => {
    window.localStorage.setItem(SALE_SCREEN_MODE_KEY, "basic");
    const user = userEvent.setup();
    render(<App />);

    await unlockPos(user);
    await screen.findByRole("textbox", { name: "البحث عن منتج" });

    expect(screen.getByRole("button", { name: "سداد" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "دفع" })).toBeDisabled();
  });

  it("shows Clear Cart from the first item and clears multiple basket lines in one touch", async () => {
    const user = userEvent.setup();
    render(<App />);

    await unlockPos(user);
    await user.click(await screen.findByRole("button", { name: /قهوة سعودية/ }));
    expect(await screen.findByRole("button", { name: "مسح السلة" })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: /لاتيه/ }));
    await user.click(screen.getByRole("button", { name: /شاي كرك/ }));
    expect(screen.getByRole("button", { name: "دفع" })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "مسح السلة" }));

    expect(await screen.findByText("التذكرة فارغة")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "مسح السلة" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "دفع" })).toBeDisabled();
  });

  it("uses the same operation-card class and direct rail footer across sale and cash stages", async () => {
    const user = userEvent.setup();
    render(<App />);

    await unlockPos(user);
    await user.click(await screen.findByRole("button", { name: /قهوة سعودية/ }));

    await waitFor(() => expect(document.querySelector(".ticket-actions")).toHaveClass("transaction-operation-card"));
    await user.click(screen.getByRole("button", { name: "دفع" }));
    await user.click(await screen.findByRole("button", { name: /نقدًا/ }));

    await waitFor(() => {
      const checkoutCard = document.querySelector(".inline-operation-footer");
      expect(checkoutCard).toHaveClass("transaction-operation-card");
      expect(checkoutCard?.parentElement).toHaveClass("inline-checkout-rail--cash");
    });
  });
});
