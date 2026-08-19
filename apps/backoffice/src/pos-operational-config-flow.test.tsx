import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { createBrowserPosConfigurationAdmin } from "../../../adapters/posConfiguration/browserPosConfigurationAdmin";
import App from "./App";
import { getBackOfficeCatalogAdmin } from "./runtime/backOfficeCatalog";

describe("BO-FLOW-003 POS operational configuration", () => {
  it("exposes the bounded MAP-01 family and persists merchant policy through the admin contract", async () => {
    const user = userEvent.setup();
    const key = `rifad-map01-ui-${crypto.randomUUID()}`;
    const admin = createBrowserPosConfigurationAdmin(window.localStorage, key);

    render(<App catalog={getBackOfficeCatalogAdmin()} posConfiguration={admin} />);

    await user.click(screen.getByRole("button", { name: "التشغيل والصلاحيات" }));
    expect(await screen.findByRole("heading", { name: "الموظفون" })).toBeInTheDocument();
    expect(screen.getByText("أمين الصندوق")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "صلاحيات الوصول" }));
    expect(screen.getByRole("heading", { name: "صلاحيات الوصول" })).toBeInTheDocument();
    expect(screen.getByText("المالك")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "الميزات" }));
    const timeClock = screen.getByRole("checkbox", { name: "ساعة الدوام" });
    expect(timeClock).not.toBeChecked();
    await user.click(timeClock);
    expect(await screen.findByText("تم تفعيل ساعة الدوام")).toBeInTheDocument();
    expect((await admin.read()).features["time-clock"]).toBe(true);

    await user.click(screen.getByRole("button", { name: "الفروع" }));
    expect(screen.getByRole("heading", { name: "الفروع" })).toBeInTheDocument();
    expect(screen.getByText("الفرع الرئيسي")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "أجهزة POS" }));
    expect(screen.getByRole("heading", { name: "أجهزة POS" })).toBeInTheDocument();
    expect(screen.getByText("نقطة البيع الرئيسية")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "طرق الدفع" }));
    expect(screen.getByRole("heading", { name: "طرق الدفع" })).toBeInTheDocument();
    const table = screen.getByRole("table");
    expect(within(table).getByRole("button", { name: "نقدًا" })).toBeInTheDocument();
    expect(within(table).getByRole("button", { name: "شبكة / مدى" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "خفض نقدًا" }));
    const reordered = [...(await admin.read()).paymentTypes].sort((a, b) => a.sortOrder - b.sortOrder);
    expect(reordered.map((payment) => payment.id)).toEqual(["payment-card", "payment-cash"]);
  });
});
