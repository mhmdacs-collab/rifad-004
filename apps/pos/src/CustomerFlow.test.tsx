import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import App from "./App";

const KEYS = [
  "rifad.pos.mock.v1",
  "rifad.pos.sale-screen-mode.v1",
  "rifad.pos.visible-order-types.v1",
  "rifad.pos.print-receipt-always.v1",
  "rifad.backoffice.loyalty-program.v1",
  "rifad.pos.mock-loyalty-accounts.v1",
  "rifad.pos.mock-loyalty-completions.v1",
];

afterEach(() => KEYS.forEach((key) => window.localStorage.removeItem(key)));

async function openSales(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "تسجيل الدخول" }));
  await screen.findByRole("heading", { name: "أدخل الرقم السري" });
  for (const digit of ["1", "2", "3", "4"]) await user.click(screen.getByRole("button", { name: `رقم ${digit}` }));
  await screen.findByRole("button", { name: /قهوة سعودية/ });
}

async function attachAhmad(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "إضافة عميل إلى التذكرة" }));
  const heading = await screen.findByRole("heading", { name: "إضافة عميل إلى التذكرة" });
  const workspace = heading.closest<HTMLElement>("[data-ticket-workspace='customer']")!;
  await user.click(await within(workspace).findByRole("button", { name: /أحمد محمد/ }));
  await user.click(within(workspace).getByRole("button", { name: "إضافة إلى التذكرة" }));
  return screen.findByRole("button", { name: "العميل أحمد محمد" });
}

describe("customer profile and loyalty", () => {
  it("keeps debt out of the attached-customer profile", async () => {
    const user = userEvent.setup();
    render(<App />);
    await openSales(user);
    await user.click(await attachAhmad(user));
    const profile = await screen.findByRole("dialog", { name: "الملف الشخصي للعميل" });
    expect(await within(profile).findByText("رصيد الولاء")).toBeInTheDocument();
    expect(within(profile).getByText("الزيارات")).toBeInTheDocument();
    expect(within(profile).queryByText("الدين الحالي")).not.toBeInTheDocument();
    expect(within(profile).getByRole("button", { name: "استبدال النقاط" })).toBeInTheDocument();
    expect(within(profile).getByRole("button", { name: "عرض المشتريات" })).toBeInTheDocument();
  });

  it("redeems 5 SAR, earns 5% on the net sale, emails receipt, then lists that purchase", async () => {
    const user = userEvent.setup();
    render(<App />);
    await openSales(user);
    await attachAhmad(user);
    await user.click(screen.getByRole("button", { name: /قهوة سعودية/ }));

    await user.click(screen.getByRole("button", { name: "العميل أحمد محمد" }));
    const profile = await screen.findByRole("dialog", { name: "الملف الشخصي للعميل" });
    await user.click(await within(profile).findByRole("button", { name: "استبدال النقاط" }));
    const redeem = await screen.findByRole("dialog", { name: "استبدال النقاط" });
    await waitFor(() => expect(within(redeem).getByText(/18\.00/)).toBeInTheDocument());
    await user.click(within(redeem).getByRole("button", { name: "5" }));
    await user.click(within(redeem).getByRole("button", { name: "0" }));
    await user.click(within(redeem).getByRole("button", { name: "0" }));
    await user.click(within(redeem).getByRole("button", { name: "استبدال 5.00 ر.س" }));

    await waitFor(() => expect(screen.queryByRole("dialog", { name: "استبدال النقاط" })).not.toBeInTheDocument());
    expect(within(screen.getByLabelText("التذكرة الحالية")).getByText("استبدال نقاط")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "دفع" }));
    await user.click(await screen.findByRole("button", { name: /نقدًا/ }));
    await screen.findByRole("heading", { name: /ريال سعودي/ });
    await user.click(screen.getByRole("button", { name: "سداد" }));
    await screen.findByRole("heading", { name: "تمت عملية البيع بنجاح" });
    expect(screen.getByText(/النقاط المكتسبة:/)).toHaveTextContent("0.65");

    await user.click(screen.getByRole("button", { name: "إرسال الإيصال" }));
    expect(await screen.findByText("تم إرسال الإيصال إلى البريد الإلكتروني.")).toBeInTheDocument();

    const accounts = JSON.parse(window.localStorage.getItem("rifad.pos.mock-loyalty-accounts.v1") ?? "[]") as Array<{ customerId: string; balanceHalalas: number }>;
    expect(accounts.find((item) => item.customerId === "customer-001")?.balanceHalalas).toBe(2065);

    await user.click(screen.getByRole("button", { name: "بيع جديد" }));
    await screen.findByRole("button", { name: /قهوة سعودية/ });
    await user.click(await attachAhmad(user));
    const nextProfile = await screen.findByRole("dialog", { name: "الملف الشخصي للعميل" });
    await user.click(await within(nextProfile).findByRole("button", { name: "عرض المشتريات" }));
    const history = await screen.findByRole("dialog", { name: "تاريخ الشراء" });
    expect(within(history).getByText("R-00001")).toBeInTheDocument();
    expect(within(history).getByText(/1 × قهوة سعودية/)).toBeInTheDocument();
  });
});
