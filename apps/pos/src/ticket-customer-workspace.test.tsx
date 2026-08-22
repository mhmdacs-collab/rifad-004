import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Customer, CustomerDetails } from "./domain/models";
import { TicketCustomerWorkspace } from "./components/TicketCustomerWorkspace";

const money = (halalas: number) => ({ halalas, currency: "SAR" as const });
const details = (overrides: Partial<CustomerDetails> = {}): CustomerDetails => ({
  email: "",
  address: "",
  city: "",
  region: "",
  postalCode: "",
  country: "",
  customerCode: "",
  taxNumber: "",
  note: "",
  ...overrides,
});

const customers: readonly Customer[] = [
  { id: "customer-1", name: "أحمد محمد", mobile: "0501234567", details: details(), debt: money(0) },
  { id: "customer-2", name: "سارة خالد", mobile: "0559876543", details: details(), debt: money(0) },
];

const renderWorkspace = (input: {
  onSearch?: (query: string) => Promise<readonly Customer[]>;
  onCreateCustomer?: (name: string, mobile: string, customerDetails: CustomerDetails) => Promise<Customer | null>;
  onAttachCustomer?: (customerId: string | null) => Promise<boolean>;
  onClose?: () => void;
} = {}) => {
  const onSearch = input.onSearch ?? vi.fn(async () => customers);
  const onCreateCustomer = input.onCreateCustomer ?? vi.fn(async () => null);
  const onAttachCustomer = input.onAttachCustomer ?? vi.fn(async () => true);
  const onClose = input.onClose ?? vi.fn();

  const rendered = render(
    <TicketCustomerWorkspace
      busy={false}
      onClose={onClose}
      onSearch={onSearch}
      onCreateCustomer={onCreateCustomer}
      onAttachCustomer={onAttachCustomer}
    />,
  );

  return { onSearch, onCreateCustomer, onAttachCustomer, onClose, container: rendered.container };
};

describe("ticket customer workspace", () => {
  it("renders as inline cart-column content rather than a modal", async () => {
    const { container } = renderWorkspace();

    await screen.findByText("أحمد محمد");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(container.querySelector(".dialog-backdrop")).not.toBeInTheDocument();
    expect(container.querySelector("[data-ticket-workspace='customer']")).toBeInTheDocument();
  });

  it("keeps attach action inside only the selected customer card", async () => {
    const { onAttachCustomer, onClose } = renderWorkspace();

    await screen.findByText("سارة خالد");
    expect(screen.queryByRole("button", { name: "إضافة إلى التذكرة" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("سارة خالد"));
    const attach = screen.getByRole("button", { name: "إضافة إلى التذكرة" });
    fireEvent.click(attach);

    await waitFor(() => expect(onAttachCustomer).toHaveBeenCalledWith("customer-2"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("uses four creation fields and saves then attaches in one action", async () => {
    const created: Customer = {
      id: "customer-new",
      name: "نورة علي",
      mobile: "0501112233",
      details: details({ taxNumber: "310000000000003", address: "حي العليا" }),
      debt: money(0),
    };
    const onCreateCustomer = vi.fn(async () => created);
    const onAttachCustomer = vi.fn(async () => true);
    const onClose = vi.fn();
    renderWorkspace({ onCreateCustomer, onAttachCustomer, onClose });

    await screen.findByText("أحمد محمد");
    fireEvent.click(screen.getByRole("button", { name: "+ إضافة عميل جديد" }));

    expect(screen.getByLabelText(/اسم العميل/)).toBeInTheDocument();
    expect(screen.getByLabelText(/رقم الجوال/)).toBeInTheDocument();
    expect(screen.getByLabelText(/الرقم الضريبي/)).toBeInTheDocument();
    expect(screen.getByLabelText(/العنوان/)).toBeInTheDocument();
    expect(screen.queryByText("البريد الإلكتروني")).not.toBeInTheDocument();
    expect(screen.queryByText("المدينة")).not.toBeInTheDocument();
    expect(screen.queryByText("ملاحظات")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/اسم العميل/), { target: { value: "نورة علي" } });
    fireEvent.change(screen.getByLabelText(/رقم الجوال/), { target: { value: "0501112233" } });
    fireEvent.change(screen.getByLabelText(/الرقم الضريبي/), { target: { value: "310000000000003" } });
    fireEvent.change(screen.getByLabelText(/العنوان/), { target: { value: "حي العليا" } });
    fireEvent.click(screen.getByRole("button", { name: "حفظ وإضافة إلى التذكرة" }));

    await waitFor(() => expect(onCreateCustomer).toHaveBeenCalledTimes(1));
    expect(onCreateCustomer).toHaveBeenCalledWith(
      "نورة علي",
      "0501112233",
      details({ taxNumber: "310000000000003", address: "حي العليا" }),
    );
    expect(onAttachCustomer).toHaveBeenCalledWith("customer-new");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("keeps the required mobile validation before creating", async () => {
    const onCreateCustomer = vi.fn(async () => null);
    renderWorkspace({ onCreateCustomer });

    await screen.findByText("أحمد محمد");
    fireEvent.click(screen.getByRole("button", { name: "+ إضافة عميل جديد" }));
    fireEvent.change(screen.getByLabelText(/اسم العميل/), { target: { value: "عميل جديد" } });
    fireEvent.change(screen.getByLabelText(/رقم الجوال/), { target: { value: "05123" } });
    fireEvent.submit(screen.getByRole("button", { name: "حفظ وإضافة إلى التذكرة" }).closest("form")!);

    expect(await screen.findByText("رقم الجوال يجب أن يكون 10 أرقام ويبدأ بـ05.")).toBeInTheDocument();
    expect(onCreateCustomer).not.toHaveBeenCalled();
  });

  it("returns from the create view without auto-saving the draft", async () => {
    const onCreateCustomer = vi.fn(async () => null);
    const onClose = vi.fn();
    renderWorkspace({ onCreateCustomer, onClose });

    await screen.findByText("أحمد محمد");
    fireEvent.click(screen.getByRole("button", { name: "+ إضافة عميل جديد" }));
    fireEvent.change(screen.getByLabelText(/اسم العميل/), { target: { value: "مسودة عميل" } });
    fireEvent.change(screen.getByLabelText(/رقم الجوال/), { target: { value: "0501112233" } });
    fireEvent.click(screen.getByRole("button", { name: "إلغاء" }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onCreateCustomer).not.toHaveBeenCalled();
  });
});
