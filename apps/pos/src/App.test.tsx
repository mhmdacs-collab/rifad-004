import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import App from "./App";

const openSales = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("button", { name: "تسجيل الدخول" }));
  await screen.findByRole("heading", { name: "أدخل الرقم السري" });
  for (const digit of ["1", "2", "3", "4"]) {
    await user.click(screen.getByRole("button", { name: `رقم ${digit}` }));
  }
  await screen.findByRole("combobox", { name: "تصفية حسب التصنيف" });
};

describe("POS-FLOW-001", () => {
  it("completes a local cash sale through the Rifad contracts", async () => {
    const user = userEvent.setup();
    render(<App />);

    await openSales(user);
    await user.click(await screen.findByRole("button", { name: /قهوة سعودية/ }));
    await waitFor(() => expect(screen.getByRole("heading", { name: /تذكرة/ })).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "السداد" }));
    await screen.findByText("اختيار طريقة الدفع");
    await user.click(screen.getByRole("button", { name: /نقدًا/ }));

    await screen.findByRole("heading", { name: /ر\.س/ });
    await user.click(screen.getByRole("button", { name: "تأكيد وإتمام البيع" }));

    await screen.findByRole("heading", { name: "تمت عملية البيع بنجاح" });
    expect(screen.getByText("محفوظ محليًا")).toBeInTheDocument();
    expect(window.localStorage.getItem("rifad.pos.mock.v1")).toContain('"receipt"');
  });

});

describe("POS-FLOW-006", () => {
  it("creates a custom sale page and places a product through the layout contract", async () => {
    const user = userEvent.setup();
    render(<App />);
    await openSales(user);

    await user.click(screen.getByRole("button", { name: "إضافة صفحة بيع" }));
    await user.type(screen.getByRole("textbox", { name: "اسم الصفحة" }), "المشاوي");
    await user.click(screen.getByRole("button", { name: "إنشاء الصفحة" }));

    await user.click(await screen.findByRole("button", { name: "إضافة منتج إلى الخانة 1" }));
    await user.click(screen.getByRole("button", { name: /قهوة سعودية/ }));
    await user.click(screen.getByRole("button", { name: "تم" }));

    expect(screen.getByRole("button", { name: /قهوة سعودية/ })).toBeInTheDocument();
    expect(window.localStorage.getItem("rifad.pos.mock.v1")).toContain("المشاوي");
  });
});
