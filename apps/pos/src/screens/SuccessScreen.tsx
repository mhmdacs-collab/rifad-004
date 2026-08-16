import { useState } from "react";
import { Brand } from "../components/Brand";
import { Icon } from "../components/Icon";
import { MoneyAmount } from "../components/MoneyAmount";
import { formatMoneyAmount } from "../domain/money";
import type { PrintDeliveryStatus, Receipt } from "../domain/models";
import { readPrintReceiptAlways, writePrintReceiptAlways } from "../domain/posPreferences";

type SuccessScreenProps = {
  receipt: Receipt;
  printStatus: PrintDeliveryStatus;
  busy: boolean;
  onPrint: () => void;
  onEmailReceipt: (email: string) => Promise<boolean>;
  onNewSale: () => void;
};

const printMessages: Record<PrintDeliveryStatus, string | null> = {
  idle: null,
  queued: "أُرسلت مهمة الطباعة إلى الطابعة.",
  printed: "تمت طباعة الإيصال.",
  failed: "تعذرت الطباعة. البيع محفوظ ويمكن إعادة المحاولة.",
  "delivery-unknown": "حالة الطابعة غير مؤكدة. تحقق من الورق قبل إعادة الطباعة.",
};

export function SuccessScreen({ receipt, printStatus, busy, onPrint, onEmailReceipt, onNewSale }: SuccessScreenProps) {
  const [printAlways, setPrintAlways] = useState(readPrintReceiptAlways);
  const [email, setEmail] = useState(receipt.customer?.details.email ?? "");
  const [emailMessage, setEmailMessage] = useState<string | null>(null);
  const [emailSending, setEmailSending] = useState(false);
  const isCredit = receipt.paymentMethod === "credit";

  const updatePrintAlways = (enabled: boolean) => {
    setPrintAlways(enabled);
    writePrintReceiptAlways(enabled);
  };

  const sendEmail = async () => {
    if (!email.trim() || emailSending) return;
    setEmailSending(true);
    setEmailMessage(null);
    const sent = await onEmailReceipt(email.trim());
    setEmailSending(false);
    setEmailMessage(sent ? "تم إرسال الإيصال إلى البريد الإلكتروني." : "تعذر إرسال الإيصال. تحقق من البريد وحاول مرة أخرى.");
  };

  return (
    <main className="success-screen" data-screen-id="POS-SCREEN-011">
      <header className="success-header"><Brand compact /><span>رفاد POS</span><span className="local-saved"><i /> محفوظ محليًا</span></header>
      <section className="success-card" aria-labelledby="success-title">
        <span className="success-mark"><Icon name="check" size={45} strokeWidth={2.3} /></span>
        <span className="eyebrow">اكتملت العملية</span>
        <h1 id="success-title">{isCredit ? "تم تسجيل البيع الآجل بنجاح" : "تمت عملية البيع بنجاح"}</h1>
        <p>{isCredit ? "حُفظت الفاتورة على حساب العميل وأضيفت إلى دفتر ديونه." : "حُفظت العملية محليًا وهي جاهزة للمزامنة."}</p>
        <div className="receipt-summary">
          <div><span>رقم الإيصال</span><strong dir="ltr">{receipt.number}</strong></div>
          <div><span>الإجمالي</span><strong><MoneyAmount value={receipt.total} /></strong></div>
          {receipt.loyaltyRedemption.halalas > 0 ? <div><span>استبدال نقاط</span><strong>− <MoneyAmount value={receipt.loyaltyRedemption} /></strong></div> : null}
          {isCredit ? (
            <>
              <div><span>طريقة الإنهاء</span><strong>آجل</strong></div>
              <div className="receipt-change"><span>العميل</span><strong>{receipt.customer?.name ?? "—"}</strong></div>
            </>
          ) : (
            <>
              <div><span>المستلم</span><strong><MoneyAmount value={receipt.tendered} /></strong></div>
              <div className="receipt-change"><span>الباقي</span><strong><MoneyAmount value={receipt.change} /></strong></div>
            </>
          )}
        </div>

        {receipt.customer && receipt.loyaltyEarned.halalas > 0 ? (
          <div className="success-loyalty-earned" role="status">النقاط المكتسبة: <strong>{formatMoneyAmount(receipt.loyaltyEarned)}</strong></div>
        ) : null}

        {receipt.customer ? (
          <section className="success-email-receipt" aria-label="إرسال الإيصال للعميل">
            <label><span>البريد الإلكتروني للعميل</span><input dir="ltr" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="customer@example.com" /></label>
            <button type="button" onClick={() => void sendEmail()} disabled={busy || emailSending || !email.trim()}>{emailSending ? "جارٍ الإرسال…" : "إرسال الإيصال"}</button>
            {emailMessage ? <div className="success-email-message" role="status">{emailMessage}</div> : null}
          </section>
        ) : null}

        {printMessages[printStatus] ? <div className={`print-status print-status--${printStatus}`} role="status"><Icon name="printer" size={18} />{printMessages[printStatus]}</div> : null}
        <label className="print-always-toggle print-always-toggle--summary">
          <input type="checkbox" checked={printAlways} onChange={(event) => updatePrintAlways(event.target.checked)} />
          <span><strong>طباعة الإيصال دائمًا</strong><small>في العمليات القادمة سيُرسل الإيصال للطابعة ثم يبدأ بيع جديد مباشرة بدون إظهار هذا الملخص.</small></span>
        </label>
        <div className="success-actions success-actions--touch">
          <button type="button" className="secondary-button" onClick={onPrint} disabled={busy}><Icon name="printer" size={20} />{printStatus === "failed" ? "إعادة الطباعة" : "طباعة الإيصال"}</button>
          <button type="button" className="primary-button" onClick={onNewSale} disabled={busy}><Icon name="plus" size={20} />بيع جديد</button>
        </div>
      </section>
    </main>
  );
}
