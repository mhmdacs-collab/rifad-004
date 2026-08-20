import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import App from "./App";

const STORAGE_KEY = "rifad.pos.mock.v1";

afterEach(() => {
  window.localStorage.clear();
});

const unlockPos = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("button", { name: "تسجيل الدخول" }));
  await screen.findByRole("heading", { name: "أدخل الرقم السري" });
  for (const digit of ["1", "2", "3", "4"]) {
    await user.click(screen.getByRole("button", { name: `رقم ${digit}` }));
  }
  await screen.findByRole("button", { name: /قهوة سعودية/ });
};

describe("mock card checkout", () => {
  it("completes a network/mada sale and persists a card receipt", async () => {
    const user = userEvent.setup();
    render(<App />);

    await unlockPos(user);
    await user.click(screen.getByRole("button", { name: /قهوة سعودية/ }));
    await user.click(screen.getByRole("button", { name: "دفع" }));
    await screen.findByText("اختيار طريقة الدفع");

    await user.click(screen.getByRole("button", { name: /شبكة \/ مدى/ }));
    await screen.findByRole("heading", { name: /مرّر البطاقة أو استخدم الدفع اللاتلامسي/ });
    await user.click(screen.getByRole("button", { name: "تم الدفع" }));

    await screen.findByRole("heading", { name: "تمت عملية البيع بنجاح" });
    expect(screen.getAllByText("شبكة / مدى").length).toBeGreaterThan(0);

    await waitFor(() => {
      const persisted = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}") as { receipt?: { paymentMethod?: string } };
      expect(persisted.receipt?.paymentMethod).toBe("card");
    });
  });
});
