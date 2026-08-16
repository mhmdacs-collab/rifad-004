import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import App from "./App";

const ORDER_TYPES_KEY = "rifad.pos.visible-order-types.v1";

afterEach(() => {
  window.localStorage.removeItem(ORDER_TYPES_KEY);
});

const openSales = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("button", { name: "تسجيل الدخول" }));
  await screen.findByRole("heading", { name: "أدخل الرقم السري" });
  for (const digit of ["1", "2", "3", "4"]) {
    await user.click(screen.getByRole("button", { name: `رقم ${digit}` }));
  }
  await screen.findByRole("button", { name: /قهوة سعودية/ });
};

describe("POS-FLOW-001", () => {
  it("completes a local cash sale through the Rifad contracts", async () => {
    const user = userEvent.setup();
    render(<App />);

    await openSales(user);
    await user.click(await screen.findByRole("button", { name: /قهوة سعودية/ }));
    await waitFor(() => expect(screen.getByRole("heading", { name: /تذكرة/ })).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "دفع" }));
    await screen.findByText("اختيار طريقة الدفع");
    await user.click(screen.getByRole("button", { name: /نقدًا/ }));

    await screen.findByRole("heading", { name: /ريال سعودي/ });
    await user.click(screen.getByRole("button", { name: "سداد" }));

    await screen.findByRole("heading", { name: "تمت عملية البيع بنجاح" });
    expect(screen.getByText("محفوظ محليًا")).toBeInTheDocument();
    expect(window.localStorage.getItem("rifad.pos.mock.v1")).toContain('"receipt"');
  });
});

describe("POS-FLOW-006", () => {
  it("keeps page edit mode active across pages and exposes page actions", async () => {
    const user = userEvent.setup();
    render(<App />);
    await openSales(user);

    await user.click(screen.getByRole("button", { name: "إضافة صفحة بيع" }));
    await user.type(screen.getByRole("textbox", { name: "اسم الصفحة" }), "المشاوي");
    await user.click(screen.getByRole("button", { name: "إنشاء الصفحة" }));

    expect(await screen.findByRole("button", { name: "تم" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "أهم المنتجات" }));
    expect(screen.getByRole("button", { name: "تم" })).toBeInTheDocument();

    fireEvent.contextMenu(screen.getByRole("button", { name: "المشاوي" }));
    expect(await screen.findByRole("button", { name: "حذف الصفحة" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /إعادة تسمية/ })).toBeInTheDocument();
  });

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

describe("ticket order type gate", () => {
  it("requires one configured order type before save or pay when multiple types are enabled", async () => {
    window.localStorage.setItem(ORDER_TYPES_KEY, JSON.stringify(["dine-in", "takeaway"]));
    const user = userEvent.setup();
    render(<App />);

    await openSales(user);
    await user.click(await screen.findByRole("button", { name: /قهوة سعودية/ }));

    expect(screen.getByRole("button", { name: "حفظ" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "دفع" })).toBeDisabled();
    expect(screen.getByText("اختر للمتابعة")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "محلي" }));

    expect(screen.getByRole("button", { name: "حفظ" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "دفع" })).toBeEnabled();
  });

  it("auto-selects the only configured order type without blocking the sale", async () => {
    window.localStorage.setItem(ORDER_TYPES_KEY, JSON.stringify(["delivery"]));
    const user = userEvent.setup();
    render(<App />);

    await openSales(user);
    await user.click(await screen.findByRole("button", { name: /قهوة سعودية/ }));

    expect(screen.getByRole("button", { name: "توصيل" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("محدد تلقائيًا")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "حفظ" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "دفع" })).toBeEnabled();
  });
});
