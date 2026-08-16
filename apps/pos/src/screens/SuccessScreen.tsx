import { Brand } from "../components/Brand";
import { Icon } from "../components/Icon";
import { formatMoney } from "../domain/money";
import type { PrintDeliveryStatus, Receipt } from "../domain/models";

type SuccessScreenProps = {
  receipt: Receipt;
  printStatus: PrintDeliveryStatus;
  busy: boolean;
  onPrint: () => void;
  onNewSale: () => void;
};

const printMessages: Record<PrintDeliveryStatus, string | null> = {
  idle: null,
  queued: "أُرسلت مهمة الطباعة إلى الطابعة.",
  printed: "تمت طباعة الإيصال.",
  failed: "تعذرت الطباعة. البيع محفوظ ويمكن إعادة المحاولة.",
  "delivery-unknown": "حالة الطابعة غير مؤكدة. تحقق من الورق قبل إعادة الطباعة.",
};

export function SuccessScreen({ receipt, printStatus, busy, onPrint, onNewSale }: SuccessScreenProps) {
  return (
    <main className="success-screen" data-screen-id="POS-SCREEN-011">
      <header className="success-header"><Brand compact /><span>رفاد POS</span><span className="local-saved"><i /> محفوظ محليًا</span></header>
      <section className="success-card" aria-labelledby="success-title">
        <span className="success-mark"><Icon name="check" size={45} strokeWidth={2.3} /></span>
        <span className="eyebrow">اكتملت العملية</span>
        <h1 id="success-title">تمت عملية البيع بنجاح</h1>
        <p>حُفظت العملية محليًا وهي جاهزة للمزامنة.</p>
        <div className="receipt-summary">
          <div><span>رقم الإيصال</span><strong dir="ltr">{receipt.number}</strong></div>
          <div><span>الإجمالي</span><strong>{formatMoney(receipt.total)}</strong></div>
          <div><span>المستلم</span><strong>{formatMoney(receipt.tendered)}</strong></div>
          <div className="receipt-change"><span>الباقي</span><strong>{formatMoney(receipt.change)}</strong></div>
        </div>
        {printMessages[printStatus] ? <div className={`print-status print-status--${printStatus}`} role="status"><Icon name="printer" size={18} />{printMessages[printStatus]}</div> : null}
        <div className="success-actions">
          <button type="button" className="secondary-button" onClick={onPrint} disabled={busy}><Icon name="printer" size={20} />{printStatus === "failed" ? "إعادة الطباعة" : "طباعة الإيصال"}</button>
          <button type="button" className="primary-button" onClick={onNewSale} disabled={busy}><Icon name="plus" size={20} />بيع جديد</button>
        </div>
      </section>
    </main>
  );
}
