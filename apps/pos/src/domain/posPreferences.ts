export const PRINT_RECEIPT_ALWAYS_KEY = "rifad.pos.print-receipt-always.v1";

export const readPrintReceiptAlways = (): boolean => {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(PRINT_RECEIPT_ALWAYS_KEY) === "1";
  } catch {
    return false;
  }
};

export const writePrintReceiptAlways = (enabled: boolean): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PRINT_RECEIPT_ALWAYS_KEY, enabled ? "1" : "0");
  } catch {
    // Device preference persistence is best-effort in this UI prototype.
  }
};
