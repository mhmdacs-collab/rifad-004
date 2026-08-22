import { useEffect, useRef, useState } from "react";
import type { Ticket, TicketLine } from "../domain/models";
import type { OpenLocalOrder } from "../domain/restaurantService";
import { isPendingKitchenLine } from "../domain/kitchenDelta";
import { Icon } from "./Icon";
import { MoneyAmount } from "./MoneyAmount";

type TicketPanelProps = {
  ticket: Ticket;
  editable?: boolean;
  lastTouchedLineId?: string | null;
  onEditLine?: (line: TicketLine) => void;
  onRemoveLine?: (lineId: string) => void | Promise<void>;
  onCustomerClick?: () => void;
  onClearCart?: () => Promise<void>;
  clearingCart?: boolean;
  serviceLabel?: string | null;
  onReturn?: () => Promise<boolean>;
  activeOrder?: OpenLocalOrder | null;
  pendingMetadata?: boolean;
  interactionDisabled?: boolean;
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
  onClearCart,
  clearingCart = false,
  serviceLabel = null,
  onReturn,
  activeOrder = null,
  pendingMetadata = false,
  interactionDisabled = false,
  variant = "sale",
}: TicketPanelProps) {
  const linesRef = useRef<HTMLDivElement | null>(null);
  const swipeStartRef = useRef<SwipeStart | null>(null);
  const suppressLineClickRef = useRef<string | null>(null);
  const [revealedLineId, setRevealedLineId] = useState<string | null>(null);
  const pendingKitchenLines = activeOrder ? ticket.lines.filter(isPendingKitchenLine) : [];

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
    const line = ticket.lines.find((candidate) => candidate.id === lineId);
    if (!editable || !onRemoveLine || !line || line.kitchenState === "sent" || event.button !== 0) return;
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
    if (editable && line.kitchenState !== "sent") onEditLine?.(line);
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
          {serviceLabel ? <span className="local-ticket-context">{serviceLabel}</span> : null}
        </div>
        <div className="ticket-header-tools">
          {onReturn ? (
            <button type="button" className="local-open-order-return" onClick={() => void onReturn()} disabled={interactionDisabled} aria-label="الرجوع لشاشة البيع مع إبقاء الطاولة مفتوحة">
              الرجوع لشاشة البيع
            </button>
          ) : null}
          <span className="ticket-more" aria-hidden="true">⋮</span>
          {variant === "sale" && onCustomerClick ? (
            <button
              type="button"
              className={`ticket-customer ticket-customer-button ${ticket.customer ? "ticket-customer-button--linked" : ""}`}
              onClick={onCustomerClick}
              disabled={interactionDisabled}
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

      {onClearCart ? (
        <div className="ticket-clear-cart-slot">
          <button type="button" className="ticket-clear-cart" data-action-id="SALES-ACTION-004" onClick={() => void onClearCart()} disabled={clearingCart || interactionDisabled} aria-label={activeOrder ? "مسح التغييرات غير المرسلة" : "مسح السلة"}>
            <span className="ticket-clear-cart-icon" aria-hidden="true"><Icon name="trash" size={20} /></span>
            <strong>{clearingCart ? (activeOrder ? "جارٍ مسح التغييرات…" : "جارٍ مسح السلة…") : (activeOrder ? "مسح التغييرات" : "مسح السلة")}</strong>
          </button>
        </div>
      ) : null}

      <div className="ticket-lines" ref={linesRef} onPointerDown={(event) => {
        if (event.target === event.currentTarget) setRevealedLineId(null);
      }}>
        {activeOrder ? (
          <div className="kitchen-ticket-workspace">
            <section className="kitchen-sent-history" aria-label="الأصناف المرسلة للمطبخ">
              <header><strong>أُرسل للمطبخ</strong><small>سجل ثابت · الإصدار {activeOrder.kitchenRevision}</small></header>
              {activeOrder.kitchenBatches.map((batch) => (
                <div className="kitchen-dispatch-batch" key={batch.id} data-kitchen-revision={batch.revision}>
                  <small>إرسال {batch.revision}</small>
                  {batch.lines.map((line) => (
                    <div className={`kitchen-delta-row kitchen-delta-row--sent kitchen-delta-row--${line.kind}`} key={line.id}>
                      <span dir="ltr"><b>{line.quantity}</b> ×</span>
                      <strong>{line.name}</strong>
                      <small>{line.kind === "add" ? "مرسل" : line.kind === "reduce" ? "تصحيح −" : "إلغاء"}</small>
                    </div>
                  ))}
                </div>
              ))}
            </section>
            <section className="kitchen-pending-changes" aria-label="التغييرات غير المرسلة">
              <header><strong>التغييرات الحالية</strong><small>{pendingKitchenLines.length > 0 || pendingMetadata ? "بانتظار الإرسال" : "لا توجد تغييرات"}</small></header>
              {pendingKitchenLines.map((line) => (
                <div className="kitchen-pending-line" key={`pending:${line.id}`}>
                  <button type="button" className="kitchen-delta-row kitchen-delta-row--pending kitchen-delta-row--add" onClick={() => editLine(line)} disabled={!editable} aria-label={`تعديل ${line.name}، بانتظار الإرسال`}>
                    <span dir="ltr"><b>{line.quantity}</b> ×</span>
                    <strong>{line.name}</strong>
                    <small>إضافة</small>
                  </button>
                  {editable && onRemoveLine ? <button type="button" className="kitchen-pending-remove" onClick={() => removeLine(line.id)} aria-label={`حذف الإضافة ${line.name}`}>حذف</button> : null}
                </div>
              ))}
              {pendingMetadata ? <p className="kitchen-metadata-pending">تغييرات بيانات التذكرة بانتظار الإرسال.</p> : null}
              {pendingKitchenLines.length === 0 && !pendingMetadata ? <p className="kitchen-no-pending">كل التغييرات مرسلة.</p> : null}
            </section>
            <p className="kitchen-sent-immutable-note">الأصناف المرسلة ثابتة وغير قابلة للتعديل من أدوات السلة الحالية.</p>
          </div>
        ) : ticket.lines.length === 0 ? (
          <div className="empty-ticket">
            <span><Icon name="receipt" size={30} /></span>
            <strong>التذكرة فارغة</strong>
            <p>اختر منتجًا من القائمة لإضافته.</p>
          </div>
        ) : ticket.lines.map((line) => {
          const lineTotal = { ...line.unitPrice, halalas: line.unitPrice.halalas * line.quantity };
          const lineEditable = editable && line.kitchenState !== "sent";
          const deleteRevealed = variant === "sale" && lineEditable && onRemoveLine && revealedLineId === line.id;
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
                  {lineEditable && onRemoveLine ? (
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
                    disabled={!lineEditable}
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
