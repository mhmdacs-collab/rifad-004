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
    expect(await screen.findByRole("button", { name: "إرسال تحديث طاولة 1 للمطبخ" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "دفع" })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "دفع" }));
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
    await user.click(await screen.findByRole("button", { name: "إرسال تحديث طاولة 2 للمطبخ" }));

    expect(await screen.findByText("التذكرة فارغة")).toBeInTheDocument();
    await waitFor(() => {
      const snapshot = JSON.parse(window.localStorage.getItem(RESTAURANT_SERVICE_STORAGE_KEY) ?? "{}") as { openOrders?: { kitchenRevision?: number; ticket?: { lines?: unknown[] } }[] };
      expect(snapshot.openOrders).toHaveLength(1);
      expect(snapshot.openOrders?.[0]?.kitchenRevision).toBe(2);
      expect(snapshot.openOrders?.[0]?.ticket?.lines).toHaveLength(2);
    });
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
