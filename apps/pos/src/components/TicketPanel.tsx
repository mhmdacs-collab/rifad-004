import type { Money, Ticket, TicketLine } from "../domain/models";
import { Icon } from "./Icon";

const formatTicketMoney = (value: Money) => `${(value.halalas / 100).toFixed(2)} SAR`;

type TicketPanelProps = {
  ticket: Ticket;
  editable?: boolean;
  onEditLine?: (line: TicketLine) => void;
};

export function TicketPanel({
  ticket,
  editable = false,
  onEditLine,
}: TicketPanelProps) {
  return (
    <aside className="ticket-panel" aria-label="التذكرة الحالية">
      <header className="ticket-header">
        <h2>تذكرة</h2>
        <div className="ticket-header-tools" aria-hidden="true">
          <span className="ticket-more">⋮</span>
          <span className="ticket-customer"><Icon name="user" size={20} /><Icon name="plus" size={12} /></span>
        </div>
      </header>

      <div className="ticket-lines">
        {ticket.lines.length === 0 ? (
          <div className="empty-ticket">
            <span><Icon name="receipt" size={30} /></span>
            <strong>التذكرة فارغة</strong>
            <p>اختر منتجًا من القائمة لإضافته.</p>
          </div>
        ) : ticket.lines.map((line) => (
          <article className="ticket-line" key={line.id}>
            <button
              className="ticket-line-button"
              type="button"
              onClick={() => editable && onEditLine?.(line)}
              disabled={!editable}
            >
              <span className="ticket-line-name"><strong>{line.name}</strong><small>× {line.quantity}</small></span>
              <strong className="line-total">{formatTicketMoney({ ...line.unitPrice, halalas: line.unitPrice.halalas * line.quantity })}</strong>
            </button>
          </article>
        ))}
      </div>

      <footer className="ticket-totals">
        <div><span>الضريبة (مضمنة)</span><span>{formatTicketMoney(ticket.taxIncluded)}</span></div>
        <div className="ticket-grand-total"><strong>الإجمالي</strong><strong>{formatTicketMoney(ticket.total)}</strong></div>
      </footer>
    </aside>
  );
}
