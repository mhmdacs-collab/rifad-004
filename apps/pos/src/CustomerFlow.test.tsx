import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import App from "./App";

const STORAGE_KEYS = [
  "rifad.pos.mock.v1",
  "rifad.pos.sale-screen-mode.v1",
  "rifad.pos.visible-order-types.v1",
  "rifad.pos.print-receipt-always.v1",
  "rifad.backoffice.loyalty-program.v1",
  "rifad.pos.mock-loyalty-accounts.v1",
  "rifad.pos.mock-loyalty-completions.v1",
];

afterEach(() => {
  for (const key of STORAGE_KEYS) window.localStorage.removeItem(key);
});

const unlockPos = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("button", { name: "تسجيل الدخول" }));
  await screen.findByRole("heading", { name: "أدخل الرقم السري" });
  for (const digit of ["1", "2", "3", "4"]) {
    await user.click(screen.getByRole("button", { name: `رقم ${digit}` }));
  }
  await screen.findByRole("button", { name: /قهوة سعودية/ });
};

const attachAhmad = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("button", { name: "إضافة عميل إلى التذكرة" }));
  const picker = await screen.findByRole("dialog", { name: "إضافة عميل إلى التذكرة" });
  await user.click(await within(picker).findByRole("button", { name: /أحمد محمد/ }));
  await user.click(within(picker).getByRole("button", { name: "إضافة إلى التذكرة" }));
  return await screen.findByRole("button", { name: "العميل أحمد محمد" });
};

describe("touch customer workflow", () => {
  it("opens the attached customer's loyalty profile without exposing debt", async () => {
    const user = userEvent.setup();
    render(<App />);
    await unlockPos(user);

    const customerButton = await attachAhmad(user);
    await user.click(customerButton);

    const profile = await screen.findByRole("dialog", { name: "الملف الشخصي للعميل" });
    expect(await within(profile).findByText("رصيد الولاء")).toBeInTheDocument();
    expect(within(profile).getByText("الزيارات")).toBeInTheDocument();
    expect(within(profile).getByText("آخر زيارة")).toBeInTheDocument();
    expect(within(profile).queryByText("الدين الحالي")).not.toBeInTheDocument();
    expect(within(profile).getByRole("button", { name: "تعديل الملف الشخصي" })).toBeEnabled();
    expect(within(profile).getByRole("button", { name: "عرض المشتريات" })).toBeEnabled();
  });

  it("redeems loyalty on the ticket, earns on the net sale, emails the receipt, and records purchase history", async () => {
    const user = userEvent.setup();
    render(<App />);
    await unlockPos(user);

    await attachAhmad(user);
    await user.click(screen.getByRole("button", { name: /قهوة سعودية/ }));

    await user.click(screen.getByRole("button", { name: "العميل أحمد محمد" }));
    const profile = await screen.findByRole("dialog", { name: "الملف الشخصي للعميل" });
    await user.click(await within(profile).findByRole("button", { name: "استبدال النقاط" }));

    const redeem = await screen.findByRole("dialog", { name: "استبدال النقاط" });
    await waitFor(() => expect(within(redeem).getByText(/الحد الأقصى لهذه التذكرة: 18\.00/)).toBeInTheDocument());
    const keypad = within(redeem).getByRole("group", { name: "لوحة استبدال النقاط" });
    await user.click(within(keypad).getByRole("button", { name: "5" }));
    await user.click(within(keypad).getByRole("button", { name: "0" }));
    await user.click(within(keypad).getByRole("button", { name: "0" }));
    await user.click(within(redeem).getByRole("button", { name: "استبدال 5.00 ر.س" }));

    await waitFor(() => expect(screen.queryByRole("dialog", { name: "استبدال النقاط" })).not.toBeInTheDocument());
    const ticket = screen.getByLabelText("التذكرة الحالية");
    expect(within(ticket).getByText("استبدال نقاط")).toBeInTheDocument();
    expect(within(ticket).getByText("المجموع قبل الخصم")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "دفع" }));
    await screen.findByText("اختيار طريقة الدفع");
    await user.click(screen.getByRole("button", { name: /نقدًا/ }));
    await screen.findByRole("heading", { name: /ريال سعودي/ });
    await user.click(screen.getByRole("button", { name: "سداد" }));

    await screen.findByRole("heading", { name: "تمت عملية البيع بنجاح" });
    expect(await screen.findByText(/النقاط المكتسبة:/)).toHaveTextContent("0.65");
    expect(screen.getByDisplayValue("ahmad@example.com")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "إرسال الإيصال" }));
    expect(await screen.findByText("تم إرسال الإيصال إلى البريد الإلكتروني.")).toBeInTheDocument();

    const loyaltyAccounts = JSON.parse(window.localStorage.getItem("rifad.pos.mock-loyalty-accounts.v1") ?? "[]") as Array<{ customerId: string; balanceHalalas: number }>;
    expect(loyaltyAccounts.find((account) => account.customerId === "customer-001")?.balanceHalalas).toBe(2065);

    await user.click(screen.getByRole("button", { name: "بيع جديد" }));
    await screen.findByRole("button", { name: /قهوة سعودية/ });
    const customerButton = await attachAhmad(user);
    await user.click(customerButton);
    const nextProfile = await screen.findByRole("dialog", { name: "الملف الشخصي للعميل" });
    await user.click(await within(nextProfile).findByRole("button", { name: "عرض المشتريات" }));

    const history = await screen.findByRole("dialog", { name: "تاريخ الشراء" });
    expect(within(history).getByText("R-00001")).toBeInTheDocument();
    expect(within(history).getByText(/1 × قهوة سعودية/)).toBeInTheDocument();
  });
});
