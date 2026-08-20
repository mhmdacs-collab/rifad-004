import { useEffect, useRef, useState } from "react";
import type { Ticket, TicketLine } from "../domain/models";
import { Icon } from "./Icon";
import { MoneyAmount } from "./MoneyAmount";

type TicketPanelProps = {
  ticket: Ticket;
  editable?: boolean;
  lastTouchedLineId?: string | null;
  onEditLine?: (line: TicketLine) => void;
  onRemoveLine?: (lineId: string) => void;
  onCustomerClick?: () => void;
  variant?: "sale" | "checkout";
};

type SwipeStart = Readonly<{
  lineId: string;
  x: number;
  y: number;
}>;

export function TicketPanel({
  ticket,
  editable = false,
  lastTouchedLineId = null,
  onEditLine,
  onRemoveLine,
  onCustomerClick,
  variant = "sale",
}: TicketPanelProps) {
  const linesRef = useRef<HTMLDivElement | null>(null);
  const swipeStartRef = useRef<SwipeStart | null>(null);
  const suppressLineClickRef = useRef<string | null>(null);
  const [revealedLineId, setRevealedLineId] = useState<string | null>(null);

  useEffect(() => {
    if (!lastTouchedLineId || !linesRef.current) return;
    const line = linesRef.current.querySelector<HTMLElement>(`[data-line-id="${lastTouchedLineId}"]`);
    if (line && typeof line.scrollIntoView === "function") {
      line.scrollIntoView({ block: "nearest", behavior: "smooth" });
    } else {
      linesRef.current.scrollTop = linesRef.current.scrollHeight;
    }
  }, [lastTouchedLineId, ticket.updatedAt]);

  useEffect(() => {
    if (revealedLineId && !ticket.lines.some((line) => line.id === revealedLineId)) {
      setRevealedLineId(null);
    }
  }, [revealedLineId, ticket.lines]);

  const beginSwipe = (event: React.PointerEvent<HTMLButtonElement>, lineId: string) => {
    if (!editable || !onRemoveLine || event.button !== 0) return;
    swipeStartRef.current = { lineId, x: event.clientX, y: event.clientY };
  };

  const finishSwipe = (event: React.PointerEvent<HTMLButtonElement>, lineId: string) => {
    const start = swipeStartRef.current;
    swipeStartRef.current = null;
    if (!start || start.lineId !== lineId) return;

    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    const horizontalSwipe = Math.abs(deltaX) >= 46 && Math.abs(deltaX) > Math.abs(deltaY) * 1.4;
    if (!horizontalSwipe) return;

    suppressLineClickRef.current = lineId;
    setRevealedLineId(deltaX < 0 ? lineId : null);
  };

  const editLine = (line: TicketLine) => {
    if (suppressLineClickRef.current === line.id) {
      suppressLineClickRef.current = null;
      return;
    }
    setRevealedLineId(null);
    if (editable) onEditLine?.(line);
  };

  const removeLine = (lineId: string) => {
    setRevealedLineId(null);
    onRemoveLine?.(lineId);
  };

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

      <div className="ticket-lines" ref={linesRef} onPointerDown={(event) => {
        if (event.target === event.currentTarget) setRevealedLineId(null);
      }}>
        {ticket.lines.length === 0 ? (
          <div className="empty-ticket">
            <span><Icon name="receipt" size={30} /></span>
            <strong>التذكرة فارغة</strong>
            <p>اختر منتجًا من القائمة لإضافته.</p>
          </div>
        ) : ticket.lines.map((line) => {
          const lineTotal = { ...line.unitPrice, halalas: line.unitPrice.halalas * line.quantity };
          const deleteRevealed = variant === "sale" && editable && onRemoveLine && revealedLineId === line.id;
          return (
            <article
              className={`ticket-line ${lastTouchedLineId === line.id ? "ticket-line--latest" : ""} ${deleteRevealed ? "ticket-line--delete-revealed" : ""}`}
              key={line.id}
              data-line-id={line.id}
              data-delete-revealed={deleteRevealed ? "true" : "false"}
            >
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
                <>
                  {editable && onRemoveLine ? (
                    <button
                      type="button"
                      className="ticket-line-swipe-delete"
                      onClick={() => removeLine(line.id)}
                      tabIndex={deleteRevealed ? 0 : -1}
                      aria-hidden={!deleteRevealed}
                      aria-label={`حذف ${line.name}`}
                    >
                      <Icon name="trash" size={18} />
                      <span>حذف</span>
                    </button>
                  ) : null}
                  <button
                    className="ticket-line-button ticket-line-button--structured"
                    type="button"
                    onPointerDown={(event) => beginSwipe(event, line.id)}
                    onPointerUp={(event) => finishSwipe(event, line.id)}
                    onPointerCancel={() => { swipeStartRef.current = null; }}
                    onClick={() => editLine(line)}
                    disabled={!editable}
                  >
                    <span className="ticket-line-copy">
                      <span className="ticket-line-main">
                        <span className="ticket-line-title-row">
                          <span className="ticket-quantity-inline" key={`${line.id}:${line.quantity}`} dir="ltr">
                            <b>{line.quantity}</b><span aria-hidden="true">×</span>
                          </span>
                          <strong className="ticket-product-name">{line.name}</strong>
                        </span>
                        <span className="ticket-unit-price" dir="ltr"><MoneyAmount value={line.unitPrice} /></span>
                      </span>
                    </span>
                    <strong className="line-total ticket-line-total"><MoneyAmount value={lineTotal} /></strong>
                  </button>
                </>
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
