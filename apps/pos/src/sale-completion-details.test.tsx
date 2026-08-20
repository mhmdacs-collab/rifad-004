import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { DeliveryCollectionRecord } from "../../../contracts/deliveryCollection";
import type { Receipt } from "./domain/models";
import { SaleCompletionDetails } from "./components/SaleCompletionDetails";

const money = (halalas: number) => ({ halalas, currency: "SAR" as const });

const receipt = (paymentMethod: Receipt["paymentMethod"]): Receipt => ({
  id: `receipt-${paymentMethod}`,
  number: "R-00121",
  paymentMethod,
  items: [{ productId: "product-1", name: "قهوة", quantity: 1, unitPrice: money(7700), lineTotal: money(7700) }],
  subtotal: money(7700),
  loyaltyRedemption: money(0),
  taxIncluded: money(0),
  total: money(7700),
  tendered: money(paymentMethod === "cash" ? 10000 : 7700),
  change: money(paymentMethod === "cash" ? 2300 : 0),
  loyaltyEarned: money(0),
  completedAt: "2026-08-20T15:00:00.000Z",
  employeeName: "أحمد",
  branchName: "الفرع الرئيسي",
  customer: paymentMethod === "credit" ? {
    id: "customer-1",
    name: "محمد علي",
    mobile: "0500000000",
    details: {
      email: "",
      address: "",
      city: "",
      region: "",
      postalCode: "",
      country: "",
      customerCode: "",
      note: "",
    },
  } : null,
});

const renderDetails = (input: {
  paymentMethod?: Receipt["paymentMethod"];
  deliveryContext?: DeliveryCollectionRecord | null;
  printAlways?: boolean;
  onPrintAlwaysChange?: (enabled: boolean) => void;
} = {}) => render(
  <SaleCompletionDetails
    receipt={receipt(input.paymentMethod ?? "cash")}
    deliveryContext={input.deliveryContext}
    printStatus="idle"
    busy={false}
    email=""
    emailMessage={null}
    emailSending={false}
    printAlways={input.printAlways ?? false}
    onEmailChange={() => undefined}
    onSendEmail={() => undefined}
    onPrintAlwaysChange={input.onPrintAlwaysChange ?? (() => undefined)}
  />,
);

describe("sale completion details", () => {
  it("promotes the collected amount and keeps the receipt number as a quiet reference", () => {
    const { container } = renderDetails();

    expect(screen.getByRole("heading", { name: "تمت عملية البيع بنجاح" })).toBeInTheDocument();
    expect(screen.getByText("المبلغ المدفوع")).toBeInTheDocument();
    expect(screen.getByText("R-00121")).toBeInTheDocument();
    expect(screen.getByText("نقدي")).toBeInTheDocument();
    expect(screen.getByText("Cash")).toBeInTheDocument();
    expect(screen.getByText("محفوظ محليًا")).toBeInTheDocument();
    expect(screen.queryByText("المستلم")).not.toBeInTheDocument();
    expect(screen.queryByText("الباقي")).not.toBeInTheDocument();
    expect(container.querySelector(".sale-completion-amount-hero")).toBeInTheDocument();
    expect(container.querySelector(".sale-completion-receipt-meta")).toBeInTheDocument();
    expect(container.querySelector('[data-completion-method="settled"]')).toBeInTheDocument();
  });

  it("shows merchant collection on delivery completion without exposing the order platform", () => {
    const deliveryContext: DeliveryCollectionRecord = {
      contractVersion: 1,
      ticketId: "ticket-1",
      receiptId: "receipt-cash",
      channelId: "hungerstation",
      channelName: "HungerStation",
      channelKind: "platform",
      paymentMode: "cash-on-delivery",
      settlement: "courier-pays-merchant",
      merchantCollection: "cash",
      createdAt: "2026-08-20T15:00:00.000Z",
      updatedAt: "2026-08-20T15:00:00.000Z",
    };

    renderDetails({ deliveryContext });

    expect(screen.getByText("نقدي")).toBeInTheDocument();
    expect(screen.getByText("Cash")).toBeInTheDocument();
    expect(screen.queryByText("HungerStation")).not.toBeInTheDocument();
    expect(screen.queryByText("قناة التوصيل")).not.toBeInTheDocument();
  });

  it("maps delivery card collection to the same network result used by direct sales", () => {
    const deliveryContext: DeliveryCollectionRecord = {
      contractVersion: 1,
      ticketId: "ticket-1",
      receiptId: "receipt-card",
      channelId: "keeta",
      channelName: "Keeta",
      channelKind: "platform",
      paymentMode: "cash-on-delivery",
      settlement: "courier-pays-merchant",
      merchantCollection: "card",
      createdAt: "2026-08-20T15:00:00.000Z",
      updatedAt: "2026-08-20T15:00:00.000Z",
    };

    renderDetails({ paymentMethod: "card", deliveryContext });

    expect(screen.getByText("شبكة / مدى")).toBeInTheDocument();
    expect(screen.getByText("Card")).toBeInTheDocument();
    expect(screen.queryByText("Keeta")).not.toBeInTheDocument();
  });

  it("keeps credit visually distinct and does not call it paid money", () => {
    const { container } = renderDetails({ paymentMethod: "credit" });

    expect(screen.getByRole("heading", { name: "تم تسجيل البيع الآجل بنجاح" })).toBeInTheDocument();
    expect(screen.getByText("طريقة الإنهاء")).toBeInTheDocument();
    expect(screen.getByText("آجل")).toBeInTheDocument();
    expect(screen.getByText("محمد علي")).toBeInTheDocument();
    expect(screen.getByText("قيمة البيع الآجل")).toBeInTheDocument();
    expect(screen.queryByText("المبلغ المدفوع")).not.toBeInTheDocument();
    expect(container.querySelector('[data-completion-method="credit"]')).toBeInTheDocument();
  });

  it("explains that always-print affects future operations and exposes one checkbox", () => {
    const onChange = vi.fn();
    renderDetails({ onPrintAlwaysChange: onChange });

    expect(screen.getByText("عدم إظهار هذه الشاشة في العمليات القادمة")).toBeInTheDocument();
    const checkbox = screen.getByRole("checkbox", { name: /طباعة الإيصال دائمًا/ });
    fireEvent.click(checkbox);
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
