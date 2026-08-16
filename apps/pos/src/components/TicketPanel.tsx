import { formatMoney } from "../domain/money";
import type { Ticket } from "../domain/models";
import { Icon } from "./Icon";

type TicketPanelProps = {
  ticket: Ticket;
  editable?: boolean;
  busy?: string | null;
  onSetQuantity?: (lineId: string, quantity: number) => void;
  onRemoveLine?: (lineId: string) => void;
};

export function TicketPanel({
  ticket,
  editable = false,
  busy,
  onSetQuantity,
  onRemoveLine,
}: TicketPanelProps) {
  const itemCount = ticket.lines.reduce((count, line) => count + line.quantity, 0);

  return (
    <aside className="ticket-panel" aria-label="التذكرة الحالية">
      <header className="ticket-header">
        <div>
          <span className="eyebrow">الطلب الحالي</span>
          <h2>تذكرة #{ticket.sequence}</h2>
        </div>
        <span className="ticket-count">{itemCount} عنصر</span>
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
            <span className={`product-swatch tone-${line.tone}`} aria-hidden="true" />
            <div className="ticket-line-copy">
              <strong>{line.name}</strong>
              <span>{formatMoney(line.unitPrice)}</span>
            </div>
            {editable ? (
              <div className="quantity-control" aria-label={`كمية ${line.name}`}>
                <button
                  type="button"
                  onClick={() => line.quantity === 1
                    ? onRemoveLine?.(line.id)
                    : onSetQuantity?.(line.id, line.quantity - 1)}
                  disabled={busy === `line:${line.id}`}
                  aria-label={line.quantity === 1 ? `حذف ${line.name}` : `تقليل كمية ${line.name}`}
                >
                  <Icon name={line.quantity === 1 ? "trash" : "minus"} size={15} />
                </button>
                <b>{line.quantity}</b>
                <button
                  type="button"
                  onClick={() => onSetQuantity?.(line.id, line.quantity + 1)}
                  disabled={busy === `line:${line.id}`}
                  aria-label={`زيادة كمية ${line.name}`}
                >
                  <Icon name="plus" size={15} />
                </button>
              </div>
            ) : <b className="line-quantity">× {line.quantity}</b>}
            <strong className="line-total">{formatMoney({ ...line.unitPrice, halalas: line.unitPrice.halalas * line.quantity })}</strong>
          </article>
        ))}
      </div>

      <footer className="ticket-totals">
        <div><span>المجموع الفرعي</span><span>{formatMoney(ticket.subtotal)}</span></div>
        <div><span>الضريبة (مضمنة)</span><span>{formatMoney(ticket.taxIncluded)}</span></div>
        <div className="ticket-grand-total"><strong>الإجمالي</strong><strong>{formatMoney(ticket.total)}</strong></div>
      </footer>
    </aside>
  );
}
