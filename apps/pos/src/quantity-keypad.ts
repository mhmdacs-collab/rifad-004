const setControlledInputValue = (input: HTMLInputElement, value: string) => {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
};

const enhanceQuantityEditor = (root: ParentNode = document) => {
  const editor = root.querySelector<HTMLElement>(".line-editor");
  if (!editor || editor.querySelector(".line-quantity-keypad")) return;

  const input = editor.querySelector<HTMLInputElement>(".line-quantity-input");
  const quantityEditor = editor.querySelector<HTMLElement>(".line-quantity-editor");
  if (!input || !quantityEditor) return;

  // Keep hardware-keyboard entry available, but prevent a touch device from
  // covering the POS editor with its system keyboard. The embedded keypad is
  // the primary touch path.
  input.inputMode = "none";
  input.setAttribute("inputmode", "none");
  input.dataset.quantityKeypadFresh = "true";

  const keypad = document.createElement("div");
  keypad.className = "line-quantity-keypad";
  keypad.setAttribute("role", "group");
  keypad.setAttribute("aria-label", "لوحة أرقام الكمية");

  const keys: readonly { value: string; label: string; className?: string }[] = [
    { value: "1", label: "رقم 1" },
    { value: "2", label: "رقم 2" },
    { value: "3", label: "رقم 3" },
    { value: "4", label: "رقم 4" },
    { value: "5", label: "رقم 5" },
    { value: "6", label: "رقم 6" },
    { value: "7", label: "رقم 7" },
    { value: "8", label: "رقم 8" },
    { value: "9", label: "رقم 9" },
    { value: "00", label: "صفران", className: "line-quantity-key--double-zero" },
    { value: "0", label: "رقم 0" },
    { value: "backspace", label: "حذف رقم", className: "line-quantity-key--backspace" },
  ];

  for (const key of keys) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = key.className ? `line-quantity-key ${key.className}` : "line-quantity-key";
    button.setAttribute("aria-label", key.label);
    button.textContent = key.value === "backspace" ? "⌫" : key.value;
    button.addEventListener("click", () => {
      const fresh = input.dataset.quantityKeypadFresh === "true";
      const current = input.value;

      if (key.value === "backspace") {
        const next = fresh ? "" : current.slice(0, -1);
        input.dataset.quantityKeypadFresh = "false";
        setControlledInputValue(input, next);
        return;
      }

      const next = fresh
        ? (key.value === "00" ? "0" : key.value)
        : `${current}${key.value}`;
      input.dataset.quantityKeypadFresh = "false";
      setControlledInputValue(input, next);
    });
    keypad.append(button);
  }

  quantityEditor.insertAdjacentElement("afterend", keypad);
};

export const installQuantityKeypad = () => {
  if (typeof document === "undefined") return () => undefined;

  enhanceQuantityEditor();
  const observer = new MutationObserver(() => enhanceQuantityEditor());
  observer.observe(document.body, { childList: true, subtree: true });

  return () => observer.disconnect();
};
