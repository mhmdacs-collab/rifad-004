import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import App from "./App";
import { RESTAURANT_SERVICE_STORAGE_KEY } from "./adapters/mockRestaurantService";

const STORAGE_KEY = "rifad.pos.mock.v1";
const SALE_SCREEN_MODE_KEY = "rifad.pos.sale-screen-mode.v1";
const LEGACY_ORDER_TYPES_KEY = "rifad.pos.visible-order-types.v1";

const setRestaurantConfig = (restaurantServiceEnabled: boolean, placeManagementEnabled: boolean) => {
  window.localStorage.setItem(RESTAURANT_SERVICE_STORAGE_KEY, JSON.stringify({
    config: { restaurantServiceEnabled, placeManagementEnabled },
    openOrders: [],
  }));
};

const unlockPos = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("button", { name: "تسجيل الدخول" }));
  await screen.findByRole("heading", { name: "أدخل الرقم السري" });
  for (const digit of ["1", "2", "3", "4"]) {
    await user.click(screen.getByRole("button", { name: `رقم ${digit}` }));
  }
  await screen.findByRole("button", { name: /قهوة سعودية/ });
};

afterEach(() => {
  window.localStorage.removeItem(RESTAURANT_SERVICE_STORAGE_KEY);
  window.localStorage.removeItem(STORAGE_KEY);
  window.localStorage.removeItem(SALE_SCREEN_MODE_KEY);
  window.localStorage.removeItem(LEGACY_ORDER_TYPES_KEY);
});

describe("POS-FLOW-002 local restaurant service", () => {
  it("keeps restaurant settings in React state until an explicit save", async () => {
    setRestaurantConfig(false, false);
    const user = userEvent.setup();
    render(<App />);
    await unlockPos(user);

    await user.click(screen.getByRole("button", { name: "فتح القائمة" }));
    await user.click(screen.getByRole("button", { name: /الإعدادات/ }));
    await user.click(screen.getByRole("button", { name: /تفعيل خدمة المطعم/ }));
    await user.click(screen.getByRole("button", { name: "إلغاء" }));
    expect(JSON.parse(window.localStorage.getItem(RESTAURANT_SERVICE_STORAGE_KEY) ?? "{}").config).toEqual({
      restaurantServiceEnabled: false,
      placeManagementEnabled: false,
    });

    await user.click(screen.getByRole("button", { name: "فتح القائمة" }));
    await user.click(screen.getByRole("button", { name: /الإعدادات/ }));
    await user.click(screen.getByRole("button", { name: /تفعيل خدمة المطعم/ }));
    await user.click(screen.getByRole("button", { name: "حفظ" }));
    await waitFor(() => expect(JSON.parse(window.localStorage.getItem(RESTAURANT_SERVICE_STORAGE_KEY) ?? "{}").config).toEqual({
      restaurantServiceEnabled: true,
      placeManagementEnabled: false,
    }));
  });

  it("uses one-touch simple Local checkout without asking for a table", async () => {
    setRestaurantConfig(true, false);
    const user = userEvent.setup();
    render(<App />);
    await unlockPos(user);

    await user.click(screen.getByRole("button", { name: /قهوة سعودية/ }));
    const localButton = await screen.findByRole("button", { name: "محلي" });
    expect(localButton).toBeEnabled();

    await user.click(localButton);

    expect(await screen.findByText("اختيار طريقة الدفع")).toBeInTheDocument();
    expect(document.querySelector(".local-checkout-context")).toHaveTextContent("محلي");
    expect(screen.queryByRole("heading", { name: "اختر المكان" })).not.toBeInTheDocument();
  });

  it("starts advanced local service with one Tables group and exactly six default tables", async () => {
    setRestaurantConfig(true, true);
    const user = userEvent.setup();
    render(<App />);
    await unlockPos(user);

    await user.click(screen.getByRole("button", { name: /قهوة سعودية/ }));
    await user.click(await screen.findByRole("button", { name: "محلي، اختيار مكان" }));

    const dialog = await screen.findByRole("dialog", { name: "اختر المكان" });
    const groups = within(dialog).getByRole("navigation", { name: "مجموعات الأماكن" });
    expect(within(groups).getAllByRole("button")).toHaveLength(1);
    expect(within(groups).getByRole("button", { name: "الطاولات" })).toBeInTheDocument();
    expect(within(groups).queryByRole("button", { name: "الغرف" })).not.toBeInTheDocument();
    expect(within(groups).queryByRole("button", { name: "الجلسات" })).not.toBeInTheDocument();

    for (let index = 1; index <= 6; index += 1) {
      expect(within(dialog).getByRole("button", { name: `طاولة ${index}، الحالة: متاحة` })).toBeInTheDocument();
    }
    expect(within(dialog).queryByRole("button", { name: /غرفة/ })).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: /جلسة/ })).not.toBeInTheDocument();
  });

  it("assigns an advanced local order, reopens it, and frees the place after payment", async () => {
    setRestaurantConfig(true, true);
    const user = userEvent.setup();
    render(<App />);
    await unlockPos(user);

    await user.click(screen.getByRole("button", { name: /قهوة سعودية/ }));
    await user.click(await screen.findByRole("button", { name: "محلي، اختيار مكان" }));

    expect(await screen.findByRole("heading", { name: "اختر المكان" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "طاولة 1، الحالة: متاحة" }));

    expect(await screen.findByText("التذكرة فارغة")).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "الطلبات المفتوحة، 1" })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "الطلبات المفتوحة، 1" }));
    expect(await screen.findByRole("heading", { name: "الطلبات المفتوحة" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "طاولة 1، الحالة: محجوزة" }));

    expect(await screen.findByText("محلي · طاولة 1")).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "لا توجد تغييرات غير مرسلة في طاولة 1" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "دفع وإغلاق طاولة 1" })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "دفع وإغلاق طاولة 1" }));
    await user.click(await screen.findByRole("button", { name: /نقدًا/ }));
    await screen.findByRole("heading", { name: /ريال سعودي/ });
    await user.click(screen.getByRole("button", { name: "سداد" }));
    await screen.findByRole("heading", { name: "تمت عملية البيع بنجاح" });

    await waitFor(() => {
      const snapshot = JSON.parse(window.localStorage.getItem(RESTAURANT_SERVICE_STORAGE_KEY) ?? "{}") as { openOrders?: unknown[] };
      expect(snapshot.openOrders).toEqual([]);
    });
  });

  it("keeps an open place while sending additions and increments the kitchen revision", async () => {
    setRestaurantConfig(true, true);
    const user = userEvent.setup();
    render(<App />);
    await unlockPos(user);

    await user.click(screen.getByRole("button", { name: /قهوة سعودية/ }));
    await user.click(await screen.findByRole("button", { name: "محلي، اختيار مكان" }));
    await user.click(await screen.findByRole("button", { name: "طاولة 2، الحالة: متاحة" }));
    await screen.findByText("التذكرة فارغة");

    await user.click(await screen.findByRole("button", { name: "الطلبات المفتوحة، 1" }));
    await user.click(await screen.findByRole("button", { name: "طاولة 2، الحالة: محجوزة" }));
    await user.click(screen.getByRole("button", { name: /لاتيه/ }));
    expect(screen.getByRole("button", { name: "إرسال تغييرات طاولة 2 للمطبخ" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "الدفع غير متاح حتى إرسال تغييرات المطبخ" })).toBeDisabled();
    await user.dblClick(screen.getByRole("button", { name: "إرسال تغييرات طاولة 2 للمطبخ" }));

    expect(await screen.findByText("محلي · طاولة 2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "لا توجد تغييرات غير مرسلة في طاولة 2" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "دفع وإغلاق طاولة 2" })).toBeEnabled();
    await waitFor(() => {
      const snapshot = JSON.parse(window.localStorage.getItem(RESTAURANT_SERVICE_STORAGE_KEY) ?? "{}") as { openOrders?: { kitchenRevision?: number; ticket?: { lines?: unknown[] }; kitchenBatches?: { lines?: { productId?: string; quantity?: number; kind?: string }[] }[] }[] };
      expect(snapshot.openOrders).toHaveLength(1);
      expect(snapshot.openOrders?.[0]?.kitchenRevision).toBe(2);
      expect(snapshot.openOrders?.[0]?.ticket?.lines).toHaveLength(2);
      expect(snapshot.openOrders?.[0]?.kitchenBatches).toHaveLength(2);
      expect(snapshot.openOrders?.[0]?.kitchenBatches?.[1]?.lines).toEqual([
        expect.objectContaining({ name: "لاتيه", quantity: 1, kind: "add" }),
      ]);
    });

    await user.click(screen.getByRole("button", { name: "الرجوع لشاشة البيع مع إبقاء الطاولة مفتوحة" }));
    await user.click(await screen.findByRole("button", { name: "الطلبات المفتوحة، 1" }));
    const occupiedTable = await screen.findByRole("button", { name: "طاولة 2، الحالة: محجوزة" });
    expect(occupiedTable).toHaveTextContent("40.00");
    await user.click(occupiedTable);
    expect(await screen.findByTestId("checkout-ticket-totals")).toHaveTextContent("40.00");
  });

  it("separates the sent quantity from a pending same-product addition", async () => {
    setRestaurantConfig(true, true);
    const user = userEvent.setup();
    render(<App />);
    await unlockPos(user);

    await user.click(screen.getByRole("button", { name: /قهوة سعودية/ }));
    await user.click(await screen.findByRole("button", { name: "محلي، اختيار مكان" }));
    await user.click(await screen.findByRole("button", { name: "طاولة 3، الحالة: متاحة" }));
    await user.click(await screen.findByRole("button", { name: "الطلبات المفتوحة، 1" }));
    await user.click(await screen.findByRole("button", { name: "طاولة 3، الحالة: محجوزة" }));

    const sent = await screen.findByRole("region", { name: "الأصناف المرسلة للمطبخ" });
    expect(within(sent).getByText("قهوة سعودية")).toBeInTheDocument();
    expect(within(sent).getByText("1", { selector: "b" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /قهوة سعودية/ }));
    const pending = screen.getByRole("region", { name: "التغييرات غير المرسلة" });
    expect(within(pending).getByText("قهوة سعودية")).toBeInTheDocument();
    expect(within(pending).getByText("1", { selector: "b" })).toBeInTheDocument();
    expect(within(pending).getByText("إضافة")).toBeInTheDocument();
  });

  it("shows reduce and cancel as explicit pending kitchen corrections", async () => {
    setRestaurantConfig(true, true);
    const user = userEvent.setup();
    render(<App />);
    await unlockPos(user);

    const coffeeProduct = screen.getByRole("button", { name: /قهوة سعودية/ });
    await user.click(coffeeProduct);
    await user.click(coffeeProduct);
    await user.click(await screen.findByRole("button", { name: "محلي، اختيار مكان" }));
    await user.click(await screen.findByRole("button", { name: "طاولة 4، الحالة: متاحة" }));
    await user.click(await screen.findByRole("button", { name: "الطلبات المفتوحة، 1" }));
    await user.click(await screen.findByRole("button", { name: "طاولة 4، الحالة: محجوزة" }));

    const corrections = await screen.findByRole("region", { name: "تصحيح الطلب المرسل" });
    await user.click(within(corrections).getByRole("button", { name: "تعديل الكمية" }));
    const quantity = screen.getByRole("textbox", { name: "الكمية" });
    await user.clear(quantity);
    await user.type(quantity, "1");
    await user.click(screen.getByRole("button", { name: "حفظ" }));
    expect(within(screen.getByRole("region", { name: "التغييرات غير المرسلة" })).getByText("إنقاص")).toBeInTheDocument();

    await user.click(within(corrections).getByRole("button", { name: "إلغاء الصنف" }));
    expect(within(screen.getByRole("region", { name: "التغييرات غير المرسلة" })).getByText("إلغاء")).toBeInTheDocument();
  });

  it("hides restaurant language in retail/direct mode", async () => {
    setRestaurantConfig(false, false);
    const user = userEvent.setup();
    render(<App />);
    await unlockPos(user);

    await user.click(screen.getByRole("button", { name: /قهوة سعودية/ }));
    await waitFor(() => expect(screen.queryByRole("button", { name: "محلي" })).not.toBeInTheDocument());
    expect(screen.getByRole("button", { name: "دفع" })).toBeEnabled();
  });
});
