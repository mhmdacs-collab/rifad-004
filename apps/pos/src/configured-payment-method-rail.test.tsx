import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { EffectivePosPaymentMethod } from "../../../contracts/posConfiguration";
import { ConfiguredPaymentMethodRail } from "./components/ConfiguredPaymentMethodRail";
import { money } from "./domain/money";
import type { Ticket } from "./domain/models";

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

describe("POS-SCREEN-007 configured payment methods", () => {
  it("renders enabled methods in merchant order and dispatches cash/card/credit actions", async () => {
    const user = userEvent.setup();
    const onCash = vi.fn();
    const onCard = vi.fn();
    const onCredit = vi.fn();

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
        onCredit={onCredit}
      />,
    );

    const buttons = screen.getAllByRole("button").filter((button) => button.hasAttribute("data-payment-method-id"));
    expect(buttons.map((button) => button.getAttribute("data-payment-method-id"))).toEqual(["cash", "mada", "credit"]);
    expect(screen.queryByText("طريقة متوقفة")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /نقدًا/ }));
    await user.click(screen.getByRole("button", { name: /آجل/ }));
    expect(onCash).toHaveBeenCalledTimes(1);
    expect(onCredit).toHaveBeenCalledTimes(1);
    expect(onCard).not.toHaveBeenCalled();
  });

  it("switches to the compact two-column layout after five enabled methods", () => {
    const sixMethods: EffectivePosPaymentMethod[] = Array.from({ length: 6 }, (_, index) => ({
      id: `method-${index + 1}`,
      name: `طريقة ${index + 1}`,
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
        onCredit={() => undefined}
      />,
    );

    expect(container.querySelector(".inline-payment-methods")).toHaveClass("inline-payment-methods--two-columns");
    expect(container.querySelector(".inline-payment-methods")).toHaveAttribute("data-payment-method-count", "6");
  });

  it("shows a safe no-method state instead of falling back to hard-coded payment choices", () => {
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
        onCredit={() => undefined}
      />,
    );

    expect(screen.getByText("لا توجد طريقة دفع مفعّلة لهذا الجهاز.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /نقدًا/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /شبكة/ })).not.toBeInTheDocument();
  });
});
