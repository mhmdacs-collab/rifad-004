import { useEffect, useRef } from "react";
import type { Ticket, TicketLine } from "../domain/models";
import { Icon } from "./Icon";
import { MoneyAmount } from "./MoneyAmount";

type TicketPanelProps = {
  ticket: Ticket;
  editable?: boolean;
  lastTouchedLineId?: string | null;
  onEditLine?: (line: TicketLine) => void;
  onCustomerClick?: () => void;
  variant?: "sale" | "checkout";
};

export function TicketPanel({
  ticket,
  editable = false,
  lastTouchedLineId = null,
  onEditLine,
  onCustomerClick,
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
        <div className="ticket-header-tools">
          <span className="ticket-more" aria-hidden="true">⋮</span>
          {variant === "sale" && onCustomerClick ? (
            <button
              type="button"
              className={`ticket-customer ticket-customer-button ${ticket.customer ? "ticket-customer-button--linked" : ""}`}
              onClick={onCustomerClick}
              aria-label={ticket.customer ? `العميل ${ticket.customer.name}` : "إضافة عميل إلى التذكرة"}
            >
              <Icon name="user" size={20} />
              {ticket.customer ? <span className="ticket-customer-name">{ticket.customer.name}</span> : <Icon name="plus" size={12} />}
            </button>
          ) : ticket.customer ? (
            <span className="ticket-customer ticket-customer--read-only"><Icon name="user" size={18} /><span className="ticket-customer-name">{ticket.customer.name}</span></span>
          ) : null}
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
          const rowKey = variant === "sale" ? `${line.id}:${line.quantity}` : line.id;
          return (
            <article className={`ticket-line ${lastTouchedLineId === line.id ? "ticket-line--latest" : ""}`} key={rowKey} data-line-id={line.id}>
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
                    <span className="ticket-line-main">
                      <span className="ticket-quantity-chip" key={`${line.id}:${line.quantity}`}>{line.quantity}</span>
                      <span className="ticket-line-times">×</span>
                      <strong className="ticket-product-name">{line.name}</strong>
                    </span>
                    <span className="ticket-unit-price" dir="ltr"><MoneyAmount value={line.unitPrice} /></span>
                  </span>
                  <strong className="line-total ticket-line-total"><MoneyAmount value={lineTotal} /></strong>
                </button>
              )}
            </article>
          );
        })}
      </div>

      <footer className="ticket-totals ticket-totals--audit" data-testid="checkout-ticket-totals">
        {ticket.loyaltyRedemption.halalas > 0 ? (
          <>
            <div className="ticket-subtotal-row"><strong>المجموع قبل الخصم</strong><strong><MoneyAmount value={ticket.subtotal} /></strong></div>
            <div className="ticket-loyalty-discount-row"><strong>استبدال نقاط</strong><strong>− <MoneyAmount value={ticket.loyaltyRedemption} /></strong></div>
          </>
        ) : null}
        <div className="ticket-tax-row"><strong>الضريبة (مضمنة)</strong><strong><MoneyAmount value={ticket.taxIncluded} /></strong></div>
        <div className="ticket-grand-total"><strong>الإجمالي</strong><strong><MoneyAmount value={ticket.total} /></strong></div>
      </footer>
    </aside>
  );
}
