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
  { id: "mada", name: "شبكة / مدى", kind: "card", enabled: true, sortOrder: 20, availability: "online-required" },
  { id: "disabled", name: "طريقة متوقفة", kind: "custom", enabled: false, sortOrder: 1, availability: "offline-capable" },
  { id: "cash", name: "نقدًا", kind: "cash", enabled: true, sortOrder: 10, availability: "offline-capable" },
];

describe("POS-SCREEN-007 configured payment methods", () => {
  it("renders only enabled methods in merchant-defined order and dispatches the selected supported method", async () => {
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
      />,
    );

    const buttons = screen.getAllByRole("button").filter((button) => button.hasAttribute("data-payment-method-id"));
    expect(buttons.map((button) => button.getAttribute("data-payment-method-id"))).toEqual(["cash", "mada"]);
    expect(screen.queryByText("طريقة متوقفة")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /نقدًا/ }));
    expect(onCash).toHaveBeenCalledTimes(1);
    expect(onCard).not.toHaveBeenCalled();
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
      />,
    );

    expect(screen.getByText("لا توجد طريقة دفع مفعّلة لهذا الجهاز.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /نقدًا/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /شبكة/ })).not.toBeInTheDocument();
  });
});
