import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import App from "./App";
import { PRINT_RECEIPT_ALWAYS_KEY } from "./domain/posPreferences";

const ORDER_TYPES_KEY = "rifad.pos.visible-order-types.v1";
const SALE_SCREEN_MODE_KEY = "rifad.pos.sale-screen-mode.v1";
const STORAGE_KEY = "rifad.pos.mock.v1";

afterEach(() => {
  window.localStorage.removeItem(ORDER_TYPES_KEY);
  window.localStorage.removeItem(SALE_SCREEN_MODE_KEY);
  window.localStorage.removeItem(PRINT_RECEIPT_ALWAYS_KEY);
  window.localStorage.removeItem(STORAGE_KEY);
});

const unlockPos = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("button", { name: "تسجيل الدخول" }));
  await screen.findByRole("heading", { name: "أدخل الرقم السري" });
  for (const digit of ["1", "2", "3", "4"]) {
    await user.click(screen.getByRole("button", { name: `رقم ${digit}` }));
  }
};

const openSales = async (user: ReturnType<typeof userEvent.setup>) => {
  await unlockPos(user);
  await screen.findByRole("button", { name: /قهوة سعودية/ });
};

const openBasicSales = async (user: ReturnType<typeof userEvent.setup>) => {
  window.localStorage.setItem(SALE_SCREEN_MODE_KEY, "basic");
  await unlockPos(user);
  return await screen.findByRole("textbox", { name: "البحث عن منتج" });
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
    expect(window.localStorage.getItem(STORAGE_KEY)).toContain('"receipt"');
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
    expect(window.localStorage.getItem(STORAGE_KEY)).toContain("المشاوي");
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

describe("always print receipt", () => {
  it("skips the success summary, starts a new sale, and keeps the receipt available for reprint", async () => {
    window.localStorage.setItem(PRINT_RECEIPT_ALWAYS_KEY, "1");
    const user = userEvent.setup();
    render(<App />);

    await openSales(user);
    await user.click(await screen.findByRole("button", { name: /قهوة سعودية/ }));
    await user.click(screen.getByRole("button", { name: "دفع" }));
    await screen.findByText("اختيار طريقة الدفع");
    await user.click(screen.getByRole("button", { name: /نقدًا/ }));
    await screen.findByRole("heading", { name: /ريال سعودي/ });
    await user.click(screen.getByRole("button", { name: "سداد" }));

    await screen.findByRole("button", { name: /قهوة سعودية/ });
    expect(screen.queryByRole("heading", { name: "تمت عملية البيع بنجاح" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "فتح القائمة" }));
    await user.click(screen.getByRole("button", { name: "الإيصالات" }));

    expect(await screen.findByText("R-00001")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "طباعة" }));
    expect(await screen.findByText("تم إرسال الإيصال للطابعة.")).toBeInTheDocument();
  });
});

describe("basic screen customer debt workflow", () => {
  it("keeps the product search focused and restores focus after adding an item", async () => {
    const user = userEvent.setup();
    render(<App />);

    const search = await openBasicSales(user);
    await waitFor(() => expect(search).toHaveFocus());

    await user.type(search, "قهوة سعودية");
    await user.click(await screen.findByRole("button", { name: /قهوة سعودية/ }));

    await waitFor(() => expect(search).toHaveFocus());
    expect(screen.getByRole("button", { name: "آجل" })).toBeEnabled();
  });

  it("shows settlement with an empty cart, displays customer debt, and settles it", async () => {
    const user = userEvent.setup();
    render(<App />);

    await openBasicSales(user);
    const settleButton = screen.getByRole("button", { name: "سداد" });
    expect(settleButton).toBeEnabled();
    await user.click(settleButton);

    expect(await screen.findByRole("heading", { name: "سداد دين عميل" })).toBeInTheDocument();
    await user.click(await screen.findByRole("button", { name: /أحمد محمد/ }));
    expect(screen.getByText("المبلغ المستحق")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "سداد كامل الدين" })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "سداد كامل الدين" }));
    expect(await screen.findByText("تم سداد الدين بالكامل.")).toBeInTheDocument();
    expect(screen.getByText("لا يوجد دين مستحق على هذا العميل.")).toBeInTheDocument();
  });

  it("records a sale as customer debt and starts a fresh ticket", async () => {
    const user = userEvent.setup();
    render(<App />);

    const search = await openBasicSales(user);
    await user.type(search, "قهوة سعودية");
    await user.click(await screen.findByRole("button", { name: /قهوة سعودية/ }));
    await user.click(screen.getByRole("button", { name: "آجل" }));

    expect(await screen.findByRole("heading", { name: "بيع آجل" })).toBeInTheDocument();
    await user.click(await screen.findByRole("button", { name: /أحمد محمد/ }));
    await user.click(screen.getByRole("button", { name: "تسجيل آجل" }));

    await waitFor(() => expect(screen.getByRole("button", { name: "سداد" })).toBeEnabled());
    await waitFor(() => expect(screen.getByRole("textbox", { name: "البحث عن منتج" })).toHaveFocus());

    const persisted = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}") as {
      customers?: { id: string; debt: { halalas: number } }[];
      creditSales?: unknown[];
    };
    expect(persisted.customers?.find((customer) => customer.id === "customer-001")?.debt.halalas).toBe(13800);
    expect(persisted.creditSales).toHaveLength(1);
  });
});
