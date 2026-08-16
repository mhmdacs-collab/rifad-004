import { useEffect, useRef } from "react";
import type { Ticket, TicketLine } from "../domain/models";
import { Icon } from "./Icon";
import { MoneyAmount } from "./MoneyAmount";

type TicketPanelProps = {
  ticket: Ticket;
  editable?: boolean;
  lastTouchedLineId?: string | null;
  onEditLine?: (line: TicketLine) => void;
  variant?: "sale" | "checkout";
};

export function TicketPanel({
  ticket,
  editable = false,
  lastTouchedLineId = null,
  onEditLine,
  variant = "sale",
}: TicketPanelProps) {
  const linesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!lastTouchedLineId || !linesRef.current) return;
    const line = linesRef.current.querySelector<HTMLElement>(`[data-line-id="${lastTouchedLineId}"]`);
    if (line && typeof line.scrollIntoView === "function") {
      line.scrollIntoView({ block: "nearest", behavior: "smooth" });
    } else {
      linesRef.current.scrollTop = linesRef.current.scrollHeight;
    }
  }, [lastTouchedLineId, ticket.updatedAt]);

  return (
    <aside className={`ticket-panel ticket-panel--${variant}`} aria-label="التذكرة الحالية">
      <header className="ticket-header">
        <div className="ticket-title-block">
          <h2>تذكرة</h2>
          <span dir="ltr">#{ticket.sequence}</span>
        </div>
        <div className="ticket-header-tools" aria-hidden="true">
          <span className="ticket-more">⋮</span>
          <span className="ticket-customer"><Icon name="user" size={20} /><Icon name="plus" size={12} /></span>
        </div>
      </header>

      <div className="ticket-lines" ref={linesRef}>
        {ticket.lines.length === 0 ? (
          <div className="empty-ticket">
            <span><Icon name="receipt" size={30} /></span>
            <strong>التذكرة فارغة</strong>
            <p>اختر منتجًا من القائمة لإضافته.</p>
          </div>
        ) : ticket.lines.map((line) => {
          const lineTotal = { ...line.unitPrice, halalas: line.unitPrice.halalas * line.quantity };
          return (
            <article className={`ticket-line ${lastTouchedLineId === line.id ? "ticket-line--latest" : ""}`} key={line.id} data-line-id={line.id}>
              {variant === "checkout" ? (
                <div className="checkout-ticket-row" data-testid="checkout-ticket-row">
                  <div className="checkout-ticket-row-copy">
                    <strong className="checkout-ticket-row-name">{line.name}</strong>
                  </div>
                  <div className="checkout-ticket-row-values">
                    <strong className="checkout-ticket-row-total"><MoneyAmount value={lineTotal} /></strong>
                    <div className="checkout-ticket-row-meta" dir="ltr">
                      <b>{line.quantity}</b>
                      <span>×</span>
                      <MoneyAmount value={line.unitPrice} />
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  className="ticket-line-button ticket-line-button--structured"
                  type="button"
                  onClick={() => editable && onEditLine?.(line)}
                  disabled={!editable}
                >
                  <span className="ticket-line-copy">
                    <strong className="ticket-product-name">{line.name}</strong>
                    <span className="ticket-line-meta" dir="ltr">
                      <b>{line.quantity}</b>
                      <span>×</span>
                      <MoneyAmount value={line.unitPrice} />
                    </span>
                  </span>
                  <strong className="line-total ticket-line-total"><MoneyAmount value={lineTotal} /></strong>
                </button>
              )}
            </article>
          );
        })}
      </div>

      <footer className="ticket-totals ticket-totals--audit" data-testid="checkout-ticket-totals">
        <div className="ticket-tax-row"><strong>الضريبة (مضمنة)</strong><strong><MoneyAmount value={ticket.taxIncluded} /></strong></div>
        <div className="ticket-grand-total"><strong>الإجمالي</strong><strong><MoneyAmount value={ticket.total} /></strong></div>
      </footer>
    </aside>
  );
}
