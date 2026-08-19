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

describe("BO-FLOW-003 editable management records", () => {
  it("edits an existing employee and payment type through visible Back Office forms", async () => {
    const user = userEvent.setup();
    const key = `rifad-map01-editing-${crypto.randomUUID()}`;
    const admin = createBrowserPosConfigurationAdmin(window.localStorage, key);

    render(<App catalog={getBackOfficeCatalogAdmin()} posConfiguration={admin} />);

    await user.click(screen.getByRole("button", { name: "التشغيل والصلاحيات" }));
    const employeesTable = await screen.findByRole("table");
    const cashierRow = within(employeesTable).getByRole("row", { name: /أمين الصندوق/ });
    await user.click(cashierRow);

    const employeeName = screen.getByLabelText("اسم الموظف");
    await user.clear(employeeName);
    await user.type(employeeName, "كاشير الفرع");
    await user.click(screen.getByRole("button", { name: "حفظ الموظف" }));

    expect((await admin.read()).employees.find((employee) => employee.id === "employee-cashier")?.name).toBe("كاشير الفرع");
    expect(await screen.findByText("كاشير الفرع")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "طرق الدفع" }));
    const paymentsTable = screen.getByRole("table");
    await user.click(within(paymentsTable).getByRole("button", { name: "شبكة / مدى" }));

    const paymentName = screen.getByLabelText("اسم طريقة الدفع");
    await user.clear(paymentName);
    await user.type(paymentName, "شبكة محلية");
    await user.click(screen.getByRole("button", { name: "حفظ الطريقة" }));

    expect((await admin.read()).paymentTypes.find((payment) => payment.id === "payment-card")?.name).toBe("شبكة محلية");
    expect(await screen.findByRole("button", { name: "شبكة محلية" })).toBeInTheDocument();
  });
});
