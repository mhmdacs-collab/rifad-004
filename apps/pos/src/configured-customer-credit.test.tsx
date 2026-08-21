import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ConfiguredCustomerCredit } from "./components/ConfiguredCustomerCredit";
import type { Customer, CustomerDetails } from "./domain/models";

const details: CustomerDetails = {
  email: "", address: "", city: "", region: "", postalCode: "", country: "", customerCode: "", taxNumber: "", note: "",
};
const customers: readonly Customer[] = [
  { id: "one", name: "أحمد", mobile: "0501234567", details, debt: { halalas: 2_000, currency: "SAR" } },
  { id: "two", name: "سارة", mobile: "0559876543", details, debt: { halalas: 0, currency: "SAR" } },
];

describe("configured customer credit", () => {
  it("replaces search/results with one selected summary until Change customer", async () => {
    const user = userEvent.setup();
    render(
      <ConfiguredCustomerCredit
        ticketTotal={{ halalas: 1_500, currency: "SAR" }}
        busy={false}
        onSearch={vi.fn(async () => customers)}
        onCreateCustomer={vi.fn(async () => null)}
        onChargeCredit={vi.fn(async () => null)}
      />,
    );

    await user.click(await screen.findByRole("button", { name: /أحمد/ }));
    expect(screen.queryByRole("textbox", { name: "بحث العميل للبيع الآجل" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /سارة/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "تغيير العميل" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "تغيير العميل" }));
    expect(screen.getByRole("textbox", { name: "بحث العميل للبيع الآجل" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /سارة/ })).toBeInTheDocument();
  });

  it("submits a selected credit sale only once on a double action", async () => {
    let finish!: (value: Customer | null) => void;
    const onChargeCredit = vi.fn(() => new Promise<Customer | null>((resolve) => { finish = resolve; }));
    const user = userEvent.setup();
    render(
      <ConfiguredCustomerCredit
        ticketTotal={{ halalas: 1_500, currency: "SAR" }}
        busy={false}
        onSearch={vi.fn(async () => customers)}
        onCreateCustomer={vi.fn(async () => null)}
        onChargeCredit={onChargeCredit}
      />,
    );

    await user.click(await screen.findByRole("button", { name: /أحمد/ }));
    const submit = screen.getByRole("button", { name: "تسجيل آجل" });
    fireEvent.click(submit);
    fireEvent.click(submit);
    expect(onChargeCredit).toHaveBeenCalledTimes(1);

    finish(customers[0]!);
    await waitFor(() => expect(submit).toBeDisabled());
  });
});
