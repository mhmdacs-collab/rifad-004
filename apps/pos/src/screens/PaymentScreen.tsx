import { Brand } from "../components/Brand";
import { Icon } from "../components/Icon";
import { InlineNotice } from "../components/InlineNotice";
import { TicketPanel } from "../components/TicketPanel";
import { formatMoney } from "../domain/money";
import type { Ticket } from "../domain/models";

type PaymentScreenProps = {
  ticket: Ticket;
  busy: boolean;
  errorMessage: string | null;
  onDismissError: () => void;
  onBack: () => void;
  onCash: () => void;
};

export function PaymentScreen({ ticket, busy, errorMessage, onDismissError, onBack, onCash }: PaymentScreenProps) {
  return (
    <main className="checkout-workspace" data-screen-id="POS-SCREEN-007">
      <section className="payment-pane">
        <header className="checkout-header">
          <button type="button" className="icon-button" onClick={onBack} aria-label="العودة إلى البيع"><Icon name="arrow" /></button>
          <Brand compact />
          <div><strong>اختيار طريقة الدفع</strong><span>تذكرة #{ticket.sequence}</span></div>
        </header>
        <div className="payment-content">
          <span className="eyebrow">المبلغ المطلوب</span>
          <h1>{formatMoney(ticket.total)}</h1>
          <p>اختر طريقة الدفع المناسبة لإتمام عملية البيع.</p>
          <InlineNotice message={errorMessage} onDismiss={onDismissError} />
          <div className="payment-methods">
            <button type="button" className="payment-method" onClick={onCash} disabled={busy}>
              <span className="payment-icon"><Icon name="cash" size={29} /></span>
              <span><strong>نقدًا</strong><small>متاح محليًا دون اتصال</small></span>
              <Icon name="chevron" />
            </button>
            <button type="button" className="payment-method" disabled aria-describedby="card-disabled">
              <span className="payment-icon payment-icon--muted"><Icon name="card" size={29} /></span>
              <span><strong>بطاقة مدى</strong><small id="card-disabled">يتطلب ربط جهاز الدفع</small></span>
              <span className="soon-badge">قريبًا</span>
            </button>
          </div>
          <div className="offline-note"><Icon name="wifi" size={18} /><span><strong>الدفع النقدي جاهز للعمل المحلي.</strong> ستتم مزامنة العملية عند توفر الاتصال.</span></div>
        </div>
      </section>
      <div className="checkout-ticket"><TicketPanel ticket={ticket} /></div>
    </main>
  );
}
