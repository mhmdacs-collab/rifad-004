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
    await waitFor(() => {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      expect(raw).not.toBeNull();
      const persisted = JSON.parse(raw ?? "{}") as { receipt?: unknown; receipts?: unknown[] };
      expect(persisted.receipt).toBeNull();
      expect(persisted.receipts).toEqual([]);
    });
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

  it("shows Clear Cart inside the basket body without changing the header or operation footer", async () => {
    const user = userEvent.setup();
    render(<App />);

    await unlockPos(user);
    await user.click(await screen.findByRole("button", { name: /قهوة سعودية/ }));

    const clearCart = await screen.findByRole("button", { name: "مسح السلة" });
    expect(clearCart).toBeEnabled();

    const clearSlot = clearCart.closest(".ticket-clear-cart-slot");
    const ticketPanel = clearSlot?.parentElement;
    const actionCard = document.querySelector(".ticket-actions");
    expect(clearSlot).not.toBeNull();
    expect(ticketPanel).toHaveClass("ticket-panel");
    expect(clearSlot?.previousElementSibling).toHaveClass("ticket-header");
    expect(clearSlot?.nextElementSibling).toHaveClass("ticket-lines");
    expect(actionCard).not.toContainElement(clearCart);
    expect(actionCard?.children).toHaveLength(2);

    await user.click(screen.getByRole("button", { name: /لاتيه/ }));
    await user.click(screen.getByRole("button", { name: /شاي كرك/ }));
    expect(screen.getByRole("button", { name: "دفع" })).toBeEnabled();

    await user.click(clearCart);

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
