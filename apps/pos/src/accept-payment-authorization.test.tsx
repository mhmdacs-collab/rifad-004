import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import type { EffectivePosConfiguration } from "../../../contracts/posConfiguration";
import App from "./App";
import { BROWSER_LOCAL_PERSISTENCE_KEY, createBrowserLocalPersistence } from "./adapters/browserLocalPersistence";
import {
  POS_EFFECTIVE_CONFIGURATION_NAMESPACE,
  POS_EFFECTIVE_CONFIGURATION_SCHEMA_VERSION,
} from "./runtime/effectivePosConfigurationAdapter";

const LEGACY_POS_KEY = "rifad.pos.mock.v1";
const LEGACY_ORDER_TYPES_KEY = "rifad.pos.visible-order-types.v1";

const unlockAndOpenSales = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("button", { name: "تسجيل الدخول" }));
  await screen.findByRole("heading", { name: "أدخل الرقم السري" });
  for (const digit of ["1", "2", "3", "4"]) {
    await user.click(screen.getByRole("button", { name: `رقم ${digit}` }));
  }
  await screen.findByRole("button", { name: /قهوة سعودية/ });
};

afterEach(() => {
  window.localStorage.removeItem(BROWSER_LOCAL_PERSISTENCE_KEY);
  window.localStorage.removeItem(LEGACY_POS_KEY);
  window.localStorage.removeItem(LEGACY_ORDER_TYPES_KEY);
});

describe("MAP-01 visible POS authorization", () => {
  it("blocks checkout locally when accept-payment is missing and requires a fresh manager approval for each attempt", async () => {
    const user = userEvent.setup();
    render(<App />);
    await unlockAndOpenSales(user);

    const persistence = createBrowserLocalPersistence();
    let current: Awaited<ReturnType<typeof persistence.readSnapshot<EffectivePosConfiguration>>> = null;
    await waitFor(async () => {
      current = await persistence.readSnapshot<EffectivePosConfiguration>(POS_EFFECTIVE_CONFIGURATION_NAMESPACE);
      expect(current).not.toBeNull();
    });

    const effective = current!.value;
    const restrictive: EffectivePosConfiguration = {
      ...effective,
      roles: effective.roles.map((role) => role.roleId === "role-cashier"
        ? { ...role, permissions: role.permissions.filter((permission) => permission !== "accept-payment") }
        : role),
    };
    await persistence.commitSnapshot({
      namespace: POS_EFFECTIVE_CONFIGURATION_NAMESPACE,
      schemaVersion: POS_EFFECTIVE_CONFIGURATION_SCHEMA_VERSION,
      value: restrictive,
    });

    await user.click(screen.getByRole("button", { name: /قهوة سعودية/ }));
    await user.click(screen.getByRole("button", { name: "دفع" }));

    const firstApproval = await screen.findByRole("dialog", { name: "اعتماد الدفع" });
    expect(firstApproval).toHaveTextContent("لن يتم تبديل الموظف الحالي");
    expect(screen.queryByText("اختيار طريقة الدفع")).not.toBeInTheDocument();

    for (const digit of ["4", "3", "2", "1"]) {
      await user.click(screen.getByRole("button", { name: `رقم ${digit}` }));
    }
    expect(await screen.findByText("اختيار طريقة الدفع")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "العودة إلى السلة" }));
    await user.click(screen.getByRole("button", { name: "دفع" }));

    expect(await screen.findByRole("dialog", { name: "اعتماد الدفع" })).toBeInTheDocument();
    expect(screen.queryByText("اختيار طريقة الدفع")).not.toBeInTheDocument();
  });
});
