import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";

type TransactionOperationEnhancerProps = {
  showClearCart: boolean;
  onClearCart: () => Promise<void>;
};

const sameTargets = (left: readonly HTMLElement[], right: readonly HTMLElement[]) =>
  left.length === right.length && left.every((item, index) => item === right[index]);

const ensureClearCartSlot = (ticketPanel: HTMLElement) => {
  const existing = Array.from(ticketPanel.children).find((child) => child.classList.contains("ticket-clear-cart-slot"));
  if (existing instanceof HTMLElement) return existing;

  const slot = document.createElement("div");
  slot.className = "ticket-clear-cart-slot";
  slot.setAttribute("data-clear-cart-slot", "true");

  const ticketLines = Array.from(ticketPanel.children).find((child) => child.classList.contains("ticket-lines"));
  if (ticketLines) ticketPanel.insertBefore(slot, ticketLines);
  else ticketPanel.append(slot);

  return slot;
};

export function TransactionOperationEnhancer({ showClearCart, onClearCart }: TransactionOperationEnhancerProps) {
  const [clearCartTargets, setClearCartTargets] = useState<readonly HTMLElement[]>([]);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    const sync = () => {
      const operationCards = Array.from(document.querySelectorAll<HTMLElement>(".ticket-actions, .inline-operation-footer"));
      for (const card of operationCards) card.classList.add("transaction-operation-card");

      const ticketPanels = Array.from(document.querySelectorAll<HTMLElement>(".ticket-panel--sale"));
      const slots = ticketPanels.map(ensureClearCartSlot);
      setClearCartTargets((current) => sameTargets(current, slots) ? current : slots);
    };

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      document.querySelectorAll<HTMLElement>(".ticket-clear-cart-slot[data-clear-cart-slot='true']").forEach((slot) => slot.remove());
    };
  }, []);

  if (!showClearCart) return null;

  const clear = async () => {
    if (clearing) return;
    setClearing(true);
    try {
      await onClearCart();
    } finally {
      setClearing(false);
    }
  };

  return (
    <>
      {clearCartTargets.map((target, index) => createPortal(
        <button
          type="button"
          className="ticket-clear-cart"
          data-action-id="SALES-ACTION-004"
          onClick={() => void clear()}
          disabled={clearing}
          aria-label="مسح السلة"
        >
          <span className="ticket-clear-cart-icon" aria-hidden="true"><Icon name="trash" size={20} /></span>
          <span className="ticket-clear-cart-copy">
            <strong>{clearing ? "جارٍ مسح السلة…" : "مسح السلة"}</strong>
            <small>إزالة جميع الأصناف</small>
          </span>
          <span className="ticket-clear-cart-badge" aria-hidden="true">الكل</span>
        </button>,
        target,
        `clear-cart-${index}`,
      ))}
    </>
  );
}
