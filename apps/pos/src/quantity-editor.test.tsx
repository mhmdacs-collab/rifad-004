import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it } from "vitest";
import App from "./App";

const STORAGE_KEY = "rifad.pos.mock.v1";

afterEach(() => {
  window.localStorage.clear();
});

it("accepts a large quantity directly from the keyboard", async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole("button", { name: "تسجيل الدخول" }));
  await screen.findByRole("heading", { name: "أدخل الرقم السري" });
  for (const digit of ["1", "2", "3", "4"]) {
    await user.click(screen.getByRole("button", { name: `رقم ${digit}` }));
  }

  await user.click(await screen.findByRole("button", { name: /قهوة سعودية/ }));
  await waitFor(() => expect(document.querySelector(".ticket-line-button")).not.toBeNull());

  await user.click(document.querySelector<HTMLButtonElement>(".ticket-line-button")!);
  const editor = await screen.findByRole("dialog");
  const quantity = within(editor).getByRole("textbox", { name: "الكمية" });
  await user.clear(quantity);
  await user.type(quantity, "1000");
  expect(quantity).toHaveValue("1000");

  await user.click(within(editor).getByRole("button", { name: "حفظ" }));

  await waitFor(() => {
    const persisted = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}") as {
      ticket?: { lines?: Array<{ quantity: number }> };
    };
    expect(persisted.ticket?.lines?.[0]?.quantity).toBe(1000);
  });
});
