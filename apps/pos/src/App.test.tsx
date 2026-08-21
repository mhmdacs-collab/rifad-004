import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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
    const completeCashButton = screen.getByRole("button", { name: "سداد" });
    fireEvent.click(completeCashButton);
    fireEvent.click(completeCashButton);

    await screen.findByRole("heading", { name: "تمت عملية البيع بنجاح" });
    expect(screen.getByText("محفوظ محليًا")).toBeInTheDocument();
    expect(window.localStorage.getItem(STORAGE_KEY)).toContain('"receipt"');
    const persisted = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}") as { receipts?: unknown[] };
    expect(persisted.receipts).toHaveLength(1);
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

describe("unified ticket customer", () => {
  it("attaches one customer to the ticket and carries the same identity to the cash receipt", async () => {
    const user = userEvent.setup();
    render(<App />);
    await openSales(user);

    await user.click(screen.getByRole("button", { name: "إضافة عميل إلى التذكرة" }));
    expect(await screen.findByRole("heading", { name: "إضافة عميل إلى التذكرة" })).toBeInTheDocument();
    await user.click(await screen.findByRole("button", { name: /أحمد محمد/ }));
    await user.click(screen.getByRole("button", { name: "إضافة إلى التذكرة" }));

    expect(await screen.findByRole("button", { name: "العميل أحمد محمد" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /قهوة سعودية/ }));
    await user.click(screen.getByRole("button", { name: "دفع" }));
    await screen.findByText("اختيار طريقة الدفع");
    await user.click(screen.getByRole("button", { name: /نقدًا/ }));
    await screen.findByRole("heading", { name: /ريال سعودي/ });
    await user.click(screen.getByRole("button", { name: "سداد" }));
    await screen.findByRole("heading", { name: "تمت عملية البيع بنجاح" });

    const persisted = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}") as {
      receipt?: { customer?: { id: string; mobile: string } | null };
    };
    expect(persisted.receipt?.customer?.id).toBe("customer-001");
    expect(persisted.receipt?.customer?.mobile).toBe("0501234567");
  });

  it("keeps optional customer details in the same customer record", async () => {
    const user = userEvent.setup();
    render(<App />);
    await openSales(user);

    await user.click(screen.getByRole("button", { name: "إضافة عميل إلى التذكرة" }));
    const workspaceHeading = await screen.findByRole("heading", { name: "إضافة عميل إلى التذكرة" });
    const workspace = workspaceHeading.closest<HTMLElement>("[data-ticket-workspace='customer']")!;
    expect(screen.queryByRole("dialog", { name: "إضافة عميل إلى التذكرة" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /قهوة سعودية/ })).toBeInTheDocument();
    await user.click(within(workspace).getByRole("button", { name: "+ إضافة عميل جديد" }));

    await user.type(within(workspace).getByLabelText(/اسم العميل/), "ليان سعد");
    const mobileInput = within(workspace).getByLabelText(/^رقم الجوال/);
    await user.type(mobileInput, "05611122334");
    expect(mobileInput).toHaveValue("0561112233");
    await user.type(within(workspace).getByLabelText(/العنوان/), "طريق الملك فهد");
    await user.type(within(workspace).getByLabelText(/الرقم الضريبي/), "310123456700003");
    expect(within(workspace).queryByText("البريد الإلكتروني")).not.toBeInTheDocument();
    expect(within(workspace).queryByText("المدينة")).not.toBeInTheDocument();
    await user.click(within(workspace).getByRole("button", { name: "حفظ وإضافة إلى التذكرة" }));

    expect(await screen.findByRole("button", { name: "العميل ليان سعد" })).toBeInTheDocument();

    const persisted = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}") as {
      customers?: Array<{
        mobile: string;
        details: {
          email: string;
          address: string;
          city: string;
          region: string;
          postalCode: string;
          country: string;
          customerCode: string;
          taxNumber: string;
          note: string;
        };
      }>;
    };
    const customer = persisted.customers?.find((item) => item.mobile === "0561112233");
    expect(customer?.details).toMatchObject({
      email: "",
      address: "طريق الملك فهد",
      city: "",
      region: "",
      postalCode: "",
      country: "",
      customerCode: "",
      taxNumber: "310123456700003",
      note: "",
    });
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

  it("uses the settlement action as a debt book and records one partial payment on a double submit", async () => {
    const user = userEvent.setup();
    render(<App />);

    const productSearch = await openBasicSales(user);
    const settleButton = screen.getByRole("button", { name: "سداد" });
    expect(settleButton).toBeEnabled();
    await user.click(settleButton);

    const debtBook = await screen.findByRole("dialog", { name: "دفتر الديون" });
    expect(within(debtBook).getByRole("textbox", { name: "بحث دفتر الديون" })).toBeInTheDocument();
    expect(within(debtBook).getByRole("button", { name: /أحمد محمد/ })).toBeInTheDocument();
    expect(within(debtBook).getByRole("button", { name: /سارة خالد/ })).toBeInTheDocument();

    const debtSearch = within(debtBook).getByRole("textbox", { name: "بحث دفتر الديون" });
    await user.type(debtSearch, "0501");
    await user.click(await within(debtBook).findByRole("button", { name: /أحمد محمد/ }));

    expect(await within(debtBook).findByText("رصيد افتتاحي")).toBeInTheDocument();
    await user.click(within(debtBook).getByRole("button", { name: "تعديل المبلغ" }));
    const amountInput = within(debtBook).getByRole("textbox", { name: "مبلغ السداد" });
    await user.clear(amountInput);
    await user.type(amountInput, "0");

    const feedback = within(debtBook).getByRole("status");
    expect(within(feedback).getByText("المتبقي بعد السداد")).toBeInTheDocument();
    expect(within(feedback).getByText("أدخل مبلغًا أكبر من صفر ولا يتجاوز الدين الحالي.")).toBeInTheDocument();
    expect(within(feedback).getByLabelText("120.00 ريال سعودي")).toBeInTheDocument();

    await user.clear(amountInput);
    await user.type(amountInput, "50.00");
    expect(within(feedback).getByLabelText("70.00 ريال سعودي")).toBeInTheDocument();
    await user.click(within(debtBook).getByRole("button", { name: "نقدي" }));

    const confirmButton = within(debtBook).getByRole("button", { name: "تأكيد سداد 50.00 ر.س" });
    fireEvent.click(confirmButton);
    fireEvent.click(confirmButton);

    expect(await within(debtBook).findByText("تم تسجيل السداد")).toBeInTheDocument();
    expect(within(debtBook).getByText("الدين قبل السداد")).toBeInTheDocument();
    expect(within(debtBook).getByText("المبلغ المسدد")).toBeInTheDocument();
    expect(within(debtBook).getByText("الدين المتبقي")).toBeInTheDocument();
    expect(within(debtBook).getByLabelText("70.00 ريال سعودي")).toBeInTheDocument();
    expect(within(debtBook).getByText("0501234567")).toBeInTheDocument();

    await user.click(within(debtBook).getByRole("button", { name: "طباعة سند القبض" }));
    expect(await within(debtBook).findByText("أُرسلت مهمة طباعة سند القبض إلى الطابعة.")).toBeInTheDocument();

    const persisted = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}") as {
      customers?: { id: string; debt: { halalas: number } }[];
      debtPayments?: { amount: { halalas: number }; collectionMethod?: string; collectionReceiptId?: string }[];
      debtLedger?: { kind: string; customerId: string; amount: { halalas: number }; collectionMethod?: string; collectionReceiptId?: string; collectionReceiptNumber?: string }[];
    };
    expect(persisted.customers?.find((customer) => customer.id === "customer-001")?.debt.halalas).toBe(7000);
    expect(persisted.debtPayments).toHaveLength(1);
    expect(persisted.debtPayments?.[0]?.amount.halalas).toBe(5000);
    expect(persisted.debtPayments?.[0]?.collectionMethod).toBe("cash");
    expect(persisted.debtPayments?.[0]?.collectionReceiptId).toMatch(/^debt-collection:/);
    const paymentEntries = persisted.debtLedger?.filter((entry) => entry.kind === "payment" && entry.customerId === "customer-001") ?? [];
    expect(paymentEntries).toHaveLength(1);
    expect(paymentEntries[0]).toEqual(expect.objectContaining({
      collectionMethod: "cash",
      collectionReceiptId: expect.stringMatching(/^debt-collection:/),
      collectionReceiptNumber: expect.stringMatching(/^DC-/),
    }));

    await user.click(within(debtBook).getByRole("button", { name: "تم" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "دفتر الديون" })).not.toBeInTheDocument());
    await waitFor(() => expect(productSearch).toHaveFocus());
  });

  it("reuses the attached customer without reopening customer search, then shows receipt actions", async () => {
    const user = userEvent.setup();
    render(<App />);

    const search = await openBasicSales(user);
    await user.click(screen.getByRole("button", { name: "إضافة عميل إلى التذكرة" }));
    await user.click(await screen.findByRole("button", { name: /أحمد محمد/ }));
    await user.click(screen.getByRole("button", { name: "إضافة إلى التذكرة" }));
    expect(await screen.findByRole("button", { name: "العميل أحمد محمد" })).toBeInTheDocument();

    await user.type(search, "قهوة سعودية");
    await user.click(await screen.findByRole("button", { name: /قهوة سعودية/ }));
    await user.click(screen.getByRole("button", { name: "آجل" }));

    const creditDialog = await screen.findByRole("dialog", { name: "تأكيد البيع الآجل" });
    expect(within(creditDialog).queryByRole("textbox", { name: "بحث العميل" })).not.toBeInTheDocument();
    expect(await within(creditDialog).findByText("أحمد محمد")).toBeInTheDocument();
    expect(within(creditDialog).getByText("الدين الحالي")).toBeInTheDocument();
    expect(within(creditDialog).getByText("الدين بعد العملية")).toBeInTheDocument();
    expect(within(creditDialog).queryByRole("button", { name: "+ إضافة عميل جديد" })).not.toBeInTheDocument();
    await user.click(within(creditDialog).getByRole("button", { name: "تأكيد البيع الآجل" }));

    expect(await screen.findByRole("heading", { name: "تم تسجيل البيع الآجل بنجاح" })).toBeInTheDocument();
    expect(screen.getByText("طريقة الإنهاء")).toBeInTheDocument();
    expect(screen.getByText("آجل")).toBeInTheDocument();
    expect(screen.getByText("أحمد محمد")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "طباعة الإيصال" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "بيع جديد" })).toBeEnabled();

    const persisted = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}") as {
      customers?: { id: string; debt: { halalas: number } }[];
      creditSales?: { ticket: { customer?: { id: string } | null }; receiptId?: string }[];
      debtLedger?: { kind: string; customerId: string; amount: { halalas: number } }[];
      receipt?: { id: string; paymentMethod: string; customer?: { id: string } | null } | null;
      receipts?: { id: string; paymentMethod: string }[];
    };
    expect(persisted.customers?.find((customer) => customer.id === "customer-001")?.debt.halalas).toBe(13800);
    expect(persisted.creditSales).toHaveLength(1);
    expect(persisted.creditSales?.[0]?.ticket.customer?.id).toBe("customer-001");
    expect(persisted.debtLedger?.filter((entry) => entry.kind === "credit-sale" && entry.customerId === "customer-001")).toHaveLength(1);
    expect(persisted.receipt?.paymentMethod).toBe("credit");
    expect(persisted.receipt?.customer?.id).toBe("customer-001");
    expect(persisted.receipts?.some((item) => item.id === persisted.receipt?.id && item.paymentMethod === "credit")).toBe(true);

    await user.click(screen.getByRole("button", { name: "بيع جديد" }));
    const nextSearch = await screen.findByRole("textbox", { name: "البحث عن منتج" });
    await waitFor(() => expect(nextSearch).toHaveFocus());
    expect(screen.getByRole("button", { name: "سداد" })).toBeEnabled();
  });
});
