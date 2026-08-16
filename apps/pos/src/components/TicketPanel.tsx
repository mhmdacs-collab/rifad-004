import { useEffect, useRef } from "react";
import { formatMoney } from "../domain/money";
import type { Ticket, TicketLine } from "../domain/models";
import { Icon } from "./Icon";

type TicketPanelProps = {
  ticket: Ticket;
  editable?: boolean;
  lastTouchedLineId?: string | null;
  onEditLine?: (line: TicketLine) => void;
};

export function TicketPanel({
  ticket,
  editable = false,
  lastTouchedLineId = null,
  onEditLine,
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
    <aside className="ticket-panel" aria-label="التذكرة الحالية">
      <header className="ticket-header">
        <h2>تذكرة</h2>
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
        ) : ticket.lines.map((line) => (
          <article className="ticket-line" key={line.id} data-line-id={line.id}>
            <button
              className="ticket-line-button"
              type="button"
              onClick={() => editable && onEditLine?.(line)}
              disabled={!editable}
            >
              <span className="ticket-line-name"><strong>{line.name}</strong><small dir="ltr">{line.quantity} x</small></span>
              <strong className="line-total" dir="ltr">{formatMoney({ ...line.unitPrice, halalas: line.unitPrice.halalas * line.quantity })}</strong>
            </button>
          </article>
        ))}
      </div>

      <footer className="ticket-totals">
        <div><span>الضريبة (مضمنة)</span><span dir="ltr">{formatMoney(ticket.taxIncluded)}</span></div>
        <div className="ticket-grand-total"><strong>الإجمالي</strong><strong dir="ltr">{formatMoney(ticket.total)}</strong></div>
      </footer>
    </aside>
  );
}
