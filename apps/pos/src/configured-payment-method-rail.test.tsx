import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { EffectivePosPaymentMethod } from "../../../contracts/posConfiguration";
import { ConfiguredPaymentMethodRail } from "./components/ConfiguredPaymentMethodRail";
import { money } from "./domain/money";
import type { Customer, Ticket } from "./domain/models";

const ticket: Ticket = {
  id: "ticket-map01",
  sequence: 17,
  lines: [],
  customer: null,
  subtotal: money(1500),
  loyaltyRedemption: money(0),
  taxIncluded: money(196),
  total: money(1500),
  updatedAt: "2026-08-19T18:00:00.000Z",
};

const methods: readonly EffectivePosPaymentMethod[] = [
  { id: "mada", name: "شبكة / مدى", kind: "card", enabled: true, sortOrder: 20, availability: "online-required", directImpact: "bank" },
  { id: "disabled", name: "طريقة متوقفة", kind: "custom", enabled: false, sortOrder: 1, availability: "offline-capable", directImpact: "bank" },
  { id: "cash", name: "نقدًا", kind: "cash", enabled: true, sortOrder: 10, availability: "offline-capable", directImpact: "cash" },
  { id: "credit", name: "آجل", kind: "customer-credit", enabled: true, sortOrder: 30, availability: "offline-capable", directImpact: "customer-receivable" },
];

const noDelivery = () => undefined;
const emptyCustomerSearch = async (): Promise<readonly Customer[]> => [];
const noCreateCustomer = async (): Promise<Customer | null> => null;
const noChargeCredit = async (): Promise<Customer | null> => null;

describe("POS-SCREEN-007 configured payment methods", () => {
  it("keeps direct tenders above and pins Credit + Delivery as separate special flows", async () => {
    const user = userEvent.setup();
    const onCash = vi.fn();
    const onCard = vi.fn();

    render(
      <ConfiguredPaymentMethodRail
        ticket={ticket}
        paymentMethods={methods}
        configurationLoading={false}
        configurationError={null}
        busy={null}
        errorMessage={null}
        onDismissError={() => undefined}
        onBackToSales={() => undefined}
        onCash={onCash}
        onCard={onCard}
        onSearchCustomers={emptyCustomerSearch}
        onCreateCustomer={noCreateCustomer}
        onChargeCredit={noChargeCredit}
        onDeliveryCollect={noDelivery}
      />,
    );

    const directButtons = screen.getAllByRole("button").filter((button) => button.hasAttribute("data-payment-method-id"));
    expect(directButtons.map((button) => button.getAttribute("data-payment-method-id"))).toEqual(["cash", "mada"]);
    expect(screen.queryByText("طريقة متوقفة")).not.toBeInTheDocument();
    expect(screen.getByText("Cash")).toBeInTheDocument();
    expect(screen.getByText("Card")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /آجل — Credit/ })).toHaveAttribute("data-special-payment-flow", "credit");
    expect(screen.getByRole("button", { name: /توصيل — Delivery/ })).toHaveAttribute("data-special-payment-flow", "delivery");
    expect(screen.getByRole("button", { name: /توصيل — Delivery/ })).toHaveAttribute("data-delivery-ready", "false");

    await user.click(screen.getByRole("button", { name: /نقدًا — Cash/ }));
    expect(onCash).toHaveBeenCalledTimes(1);
    expect(onCard).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /آجل — Credit/ }));
    expect(screen.getByText("بيع آجل")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "بحث العميل للبيع الآجل" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /توصيل — Delivery/ })).not.toBeInTheDocument();
  });

  it("keeps one full-width scroll column for many direct methods", () => {
    const sixMethods: EffectivePosPaymentMethod[] = Array.from({ length: 6 }, (_, index) => ({
      id: `method-${index + 1}`,
      name: index === 2 ? "تحويل" : `طريقة ${index + 1}`,
      kind: index === 0 ? "cash" : index === 1 ? "card" : "custom",
      enabled: true,
      sortOrder: (index + 1) * 10,
      availability: "offline-capable",
      directImpact: index === 0 ? "cash" : "bank",
    }));

    const { container } = render(
      <ConfiguredPaymentMethodRail
        ticket={ticket}
        paymentMethods={sixMethods}
        configurationLoading={false}
        configurationError={null}
        busy={null}
        errorMessage={null}
        onDismissError={() => undefined}
        onBackToSales={() => undefined}
        onCash={() => undefined}
        onCard={() => undefined}
        onSearchCustomers={emptyCustomerSearch}
        onCreateCustomer={noCreateCustomer}
        onChargeCredit={noChargeCredit}
        onDeliveryCollect={noDelivery}
      />,
    );

    const list = container.querySelector(".inline-payment-methods");
    expect(list).not.toHaveClass("inline-payment-methods--two-columns");
    expect(list).toHaveAttribute("data-payment-method-count", "6");
    expect(list).toHaveAttribute("data-payment-layout", "scroll-list");
    expect(screen.getByText("Transfer")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /تحويل — Transfer/ })).toBeDisabled();
    expect(screen.queryByRole("button", { name: /آجل — Credit/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /توصيل — Delivery/ })).toBeInTheDocument();
  });

  it("shows a safe direct-method empty state while keeping Delivery visible", () => {
    render(
      <ConfiguredPaymentMethodRail
        ticket={ticket}
        paymentMethods={[]}
        configurationLoading={false}
        configurationError={null}
        busy={null}
        errorMessage={null}
        onDismissError={() => undefined}
        onBackToSales={() => undefined}
        onCash={() => undefined}
        onCard={() => undefined}
        onSearchCustomers={emptyCustomerSearch}
        onCreateCustomer={noCreateCustomer}
        onChargeCredit={noChargeCredit}
        onDeliveryCollect={noDelivery}
      />,
    );

    expect(screen.getByText("لا توجد طريقة تحصيل مباشرة مفعّلة لهذا الجهاز.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /توصيل — Delivery/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /آجل — Credit/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /نقدًا/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /شبكة/ })).not.toBeInTheDocument();
  });
});
