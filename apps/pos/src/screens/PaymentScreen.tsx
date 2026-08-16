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
    <main className="checkout-workspace checkout-workspace--payment" data-screen-id="POS-SCREEN-007">
      <section className="payment-pane">
        <header className="checkout-header">
          <button type="button" className="icon-button" onClick={onBack} aria-label="العودة إلى البيع"><Icon name="arrow" /></button>
          <Brand compact />
          <div><strong>اختيار طريقة الدفع</strong><span>تذكرة #{ticket.sequence}</span></div>
        </header>

        <div className="payment-content payment-content--rich">
          <div className="payment-amount-block">
            <span className="eyebrow">المبلغ المطلوب</span>
            <h1 dir="ltr">{formatMoney(ticket.total)}</h1>
            <p>اختر طريقة الدفع المناسبة لإتمام عملية البيع.</p>
          </div>

          <InlineNotice message={errorMessage} onDismiss={onDismissError} />

          <div className="payment-section-heading">
            <strong>طرق الدفع</strong>
            <span>اختر طريقة واحدة للمتابعة</span>
          </div>

          <div className="payment-methods payment-methods--cards">
            <button type="button" className="payment-method payment-method--cash" onClick={onCash} disabled={busy}>
              <span className="payment-icon payment-icon--cash"><Icon name="cash" size={30} /></span>
              <span className="payment-method-copy"><strong>نقدًا</strong><small>جاهز للعمل دون اتصال</small></span>
              <span className="payment-method-status payment-method-status--ready">متاح</span>
              <Icon name="chevron" />
            </button>

            <button type="button" className="payment-method payment-method--brand" disabled aria-describedby="mada-disabled">
              <span className="payment-brand-mark payment-brand-mark--mada" aria-hidden="true">mada</span>
              <span className="payment-method-copy"><strong>شبكة / مدى</strong><small id="mada-disabled">يتطلب ربط جهاز الدفع</small></span>
              <span className="soon-badge">قريبًا</span>
            </button>

            <button type="button" className="payment-method payment-method--brand" disabled aria-describedby="apple-disabled">
              <span className="payment-brand-mark payment-brand-mark--apple" aria-hidden="true"><b></b><span>Pay</span></span>
              <span className="payment-method-copy"><strong>Apple Pay</strong><small id="apple-disabled">متاح بعد ربط جهاز الدفع</small></span>
              <span className="soon-badge">قريبًا</span>
            </button>
          </div>

          <div className="offline-note"><Icon name="wifi" size={18} /><span><strong>الدفع النقدي يعمل محليًا.</strong> ستتم مزامنة العملية عند توفر الاتصال.</span></div>
        </div>
      </section>
      <div className="checkout-ticket"><TicketPanel ticket={ticket} /></div>
    </main>
  );
}
