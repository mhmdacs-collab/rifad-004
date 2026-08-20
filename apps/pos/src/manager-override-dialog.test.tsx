import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ManagerOverrideDialog } from "./components/ManagerOverrideDialog";
import type { ManagerOverrideRequest } from "./state/useManagerOverrideGate";

const request: ManagerOverrideRequest = {
  actorEmployeeId: "employee-001",
  capability: "reprint-resend-receipts",
  branchId: "branch-olaya",
  commandId: "override-visible-test",
  targetType: "receipt",
  targetId: "receipt-001",
  title: "إعادة طباعة الإيصال",
};

describe("POS-SCREEN-002 one-action manager override", () => {
  it("collects a four-digit manager PIN for the current blocked action without switching employee context", async () => {
    const user = userEvent.setup();
    const onApprove = vi.fn(async () => undefined);

    render(
      <ManagerOverrideDialog
        request={request}
        busy={false}
        errorMessage={null}
        onDismissError={() => undefined}
        onApprove={onApprove}
        onCancel={() => undefined}
      />,
    );

    expect(screen.getByRole("dialog", { name: "إعادة طباعة الإيصال" })).toBeInTheDocument();
    expect(screen.getByText(/لن يتم تبديل الموظف الحالي/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "رقم 4" }));
    await user.click(screen.getByRole("button", { name: "رقم 3" }));
    await user.click(screen.getByRole("button", { name: "رقم 2" }));
    await user.click(screen.getByRole("button", { name: "رقم 1" }));

    expect(onApprove).toHaveBeenCalledTimes(1);
    expect(onApprove).toHaveBeenCalledWith("4321");
  });
});
