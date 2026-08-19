import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { EffectiveDeliveryConfiguration } from "../../../contracts/posConfiguration";
import { ConfiguredPaymentMethodRail } from "./components/ConfiguredPaymentMethodRail";
import { money } from "./domain/money";
import type { Ticket } from "./domain/models";

const ticket: Ticket = {
  id: "ticket-delivery",
  sequence: 31,
  lines: [],
  customer: null,
  subtotal: money(7500),
  loyaltyRedemption: money(0),
  taxIncluded: money(978),
  total: money(7500),
  updatedAt: "2026-08-20T00:00:00.000Z",
};

const delivery: EffectiveDeliveryConfiguration = {
  enabled: true,
  channels: [
    {
      id: "delivery-hungerstation",
      name: "HungerStation",
      kind: "platform",
      brandKey: "hungerstation",
      enabled: true,
      electronicPaymentEnabled: true,
      cashOnDeliveryEnabled: true,
      codSettlement: "courier-pays-merchant",
      storeIds: [],
      selfDelivery: null,
    },
    {
      id: "delivery-self",
      name: "التوصيل الذاتي",
      kind: "self-delivery",
      brandKey: "self-delivery",
      enabled: true,
      electronicPaymentEnabled: false,
      cashOnDeliveryEnabled: true,
      codSettlement: "courier-pays-merchant",
      storeIds: [],
      selfDelivery: { feeMode: "manual", defaultFeeHalalas: 1500, allowPosFeeOverride: true, feeBeneficiary: "merchant" },
    },
  ],
};

describe("configured delivery collection from payment surface", () => {
  it("shows one Delivery hub and routes courier-paid COD to real Cash/Network actions", async () => {
    const user = userEvent.setup();
    const onCash = vi.fn();
    const onCard = vi.fn();

    render(
      <ConfiguredPaymentMethodRail
        ticket={ticket}
        paymentMethods={[
          { id: "cash", name: "نقدًا", kind: "cash", enabled: true, sortOrder: 10, availability: "offline-capable", directImpact: "cash" },
          { id: "card", name: "شبكة / مدى", kind: "card", enabled: true, sortOrder: 20, availability: "online-required", directImpact: "bank" },
          { id: "credit", name: "آجل", kind: "customer-credit", enabled: true, sortOrder: 30, availability: "offline-capable", directImpact: "customer-receivable" },
        ]}
        delivery={delivery}
        configurationLoading={false}
        configurationError={null}
        busy={null}
        errorMessage={null}
        onDismissError={() => undefined}
        onBackToSales={() => undefined}
        onCash={onCash}
        onCard={onCard}
        onCredit={() => undefined}
      />,
    );

    await user.click(screen.getByRole("button", { name: /توصيل/ }));
    expect(screen.getByRole("button", { name: /HungerStation/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /التوصيل الذاتي/ })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /HungerStation/ }));
    expect(screen.getByText("كيف استلم المحل المبلغ؟")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /نقدي.*الأثر المباشر: النقد/ }));
    expect(onCash).toHaveBeenCalledTimes(1);
    expect(onCard).not.toHaveBeenCalled();
  });

  it("does not expose a fake Delivery button when every enabled channel still needs a later financial lifecycle", () => {
    const settlementOnly: EffectiveDeliveryConfiguration = {
      enabled: true,
      channels: [{
        ...delivery.channels[0]!,
        cashOnDeliveryEnabled: false,
        codSettlement: "platform-settlement",
      }],
    };

    render(
      <ConfiguredPaymentMethodRail
        ticket={ticket}
        paymentMethods={[]}
        delivery={settlementOnly}
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

    expect(screen.queryByRole("button", { name: /توصيل/ })).not.toBeInTheDocument();
    expect(screen.getByText("لا توجد طريقة دفع مفعّلة لهذا الجهاز.")).toBeInTheDocument();
  });
});
