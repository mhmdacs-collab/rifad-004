import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { createBrowserPosConfigurationAdmin } from "../../../adapters/posConfiguration/browserPosConfigurationAdmin";
import App from "./App";
import { getBackOfficeCatalogAdmin } from "./runtime/backOfficeCatalog";

const AREA_KEY = "rifad.backoffice.active-area.v1";

afterEach(() => {
  window.localStorage.removeItem(AREA_KEY);
});

describe("Back Office payment and delivery workspace", () => {
  it("shows starter methods, saves a bank-impact method and persists delivery policy", async () => {
    const user = userEvent.setup();
    const admin = createBrowserPosConfigurationAdmin(window.localStorage, `payment-delivery-ui-${crypto.randomUUID()}`);

    render(<App catalog={getBackOfficeCatalogAdmin()} posConfiguration={admin} />);
    await user.click(screen.getByRole("button", { name: "الدفع والتوصيل" }));

    const paymentTable = await screen.findByRole("table");
    expect(within(paymentTable).getByText("نقدًا")).toBeInTheDocument();
    expect(within(paymentTable).getByText("شبكة / مدى")).toBeInTheDocument();
    expect(within(paymentTable).getAllByText("آجل").length).toBeGreaterThan(0);
    expect(within(paymentTable).getByText("ذمة العميل")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "إضافة طريقة دفع" }));
    await user.type(screen.getByLabelText("اسم طريقة الدفع"), "تحويل بنكي");
    await user.selectOptions(screen.getByLabelText("نوع طريقة الدفع"), "custom");
    await user.selectOptions(screen.getByLabelText("الأثر المباشر"), "bank");
    await user.click(within(screen.getByRole("dialog", { name: "تحرير طريقة الدفع" })).getByRole("button", { name: "حفظ" }));

    expect(await screen.findByText("تحويل بنكي")).toBeInTheDocument();
    expect((await admin.read()).paymentTypes.find((payment) => payment.name === "تحويل بنكي")).toMatchObject({ directImpact: "bank", enabled: true });

    const deliveryMaster = screen.getByText("قنوات التوصيل").closest("section")!;
    const masterCheckbox = within(deliveryMaster).getAllByRole("checkbox")[0]!;
    await user.click(masterCheckbox);

    const hungerCard = screen.getByText("HungerStation").closest("article")!;
    await user.click(within(hungerCard).getByRole("checkbox", { name: /مخفي|مفعل/ }));

    const selfCard = screen.getByText("التوصيل الذاتي").closest("article")!;
    await user.click(within(selfCard).getByRole("checkbox", { name: /مخفي|مفعل/ }));
    await user.selectOptions(within(selfCard).getByText("رسوم التوصيل محسوبة لـ").closest("label")!.querySelector("select")!, "courier");

    const stored = await admin.read();
    expect(stored.delivery?.enabled).toBe(true);
    expect(stored.delivery?.channels.find((channel) => channel.id === "delivery-hungerstation")?.enabled).toBe(true);
    expect(stored.delivery?.channels.find((channel) => channel.id === "delivery-self")?.selfDelivery?.feeBeneficiary).toBe("courier");
  });
});
