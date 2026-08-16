import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("POS-FLOW-001", () => {
  it("completes a local cash sale through the Rifad contracts", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "تسجيل الدخول" }));
    await screen.findByRole("heading", { name: "أدخل الرقم السري" });

    for (const digit of ["1", "2", "3", "4"]) {
      await user.click(screen.getByRole("button", { name: `رقم ${digit}` }));
    }

    await screen.findByRole("heading", { name: "جميع العناصر" });
    await user.click(await screen.findByRole("button", { name: /قهوة سعودية/ }));
    await waitFor(() => expect(screen.getByText("تذكرة #1")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /^الدفع/ }));
    await screen.findByText("اختيار طريقة الدفع");
    await user.click(screen.getByRole("button", { name: /نقدًا/ }));

    await screen.findByRole("heading", { name: /ر\.س/ });
    await user.click(screen.getByRole("button", { name: "تأكيد وإتمام البيع" }));

    await screen.findByRole("heading", { name: "تمت عملية البيع بنجاح" });
    expect(screen.getByText("محفوظ محليًا")).toBeInTheDocument();
    expect(window.localStorage.getItem("rifad.pos.mock.v1")).toContain('"receipt"');
  });
});
