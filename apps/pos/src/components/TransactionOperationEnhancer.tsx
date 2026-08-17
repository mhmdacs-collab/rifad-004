import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";

type TransactionOperationEnhancerProps = {
  showClearCart: boolean;
  onClearCart: () => Promise<void>;
};

const sameTargets = (left: readonly HTMLElement[], right: readonly HTMLElement[]) =>
  left.length === right.length && left.every((item, index) => item === right[index]);

export function TransactionOperationEnhancer({ showClearCart, onClearCart }: TransactionOperationEnhancerProps) {
  const [ticketActionTargets, setTicketActionTargets] = useState<readonly HTMLElement[]>([]);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    const sync = () => {
      const operationCards = Array.from(document.querySelectorAll<HTMLElement>(".ticket-actions, .inline-operation-footer"));
      for (const card of operationCards) card.classList.add("transaction-operation-card");

      const ticketCards = operationCards.filter((card) => card.classList.contains("ticket-actions"));
      setTicketActionTargets((current) => sameTargets(current, ticketCards) ? current : ticketCards);
    };

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
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
      {ticketActionTargets.map((target, index) => createPortal(
        <button
          type="button"
          className="ticket-clear-cart"
          data-action-id="SALES-ACTION-004"
          onClick={() => void clear()}
          disabled={clearing}
          aria-label="مسح السلة"
        >
          <Icon name="trash" size={18} />
          <span>{clearing ? "جارٍ مسح السلة…" : "مسح السلة"}</span>
        </button>,
        target,
        `clear-cart-${index}`,
      ))}
    </>
  );
}
