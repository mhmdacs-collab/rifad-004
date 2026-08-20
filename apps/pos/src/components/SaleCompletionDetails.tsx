import type { DeliveryCollectionRecord } from "../../../../contracts/deliveryCollection";
import { Icon } from "./Icon";
import { MoneyAmount } from "./MoneyAmount";
import { formatMoneyAmount } from "../domain/money";
import type { PrintDeliveryStatus, Receipt } from "../domain/models";

type SaleCompletionDetailsProps = {
  receipt: Receipt;
  deliveryContext?: DeliveryCollectionRecord | null;
  printStatus: PrintDeliveryStatus;
  busy: boolean;
  email: string;
  emailMessage: string | null;
  emailSending: boolean;
  printAlways: boolean;
  onEmailChange: (value: string) => void;
  onSendEmail: () => void;
  onPrintAlwaysChange: (enabled: boolean) => void;
};

const printMessages: Record<PrintDeliveryStatus, string | null> = {
  idle: null,
  queued: "أُرسلت مهمة الطباعة إلى الطابعة.",
  printed: "تمت طباعة الإيصال.",
  failed: "تعذرت الطباعة. البيع محفوظ ويمكن إعادة المحاولة.",
  "delivery-unknown": "حالة الطابعة غير مؤكدة. تحقق من الورق قبل إعادة الطباعة.",
};

const channelMark = (name: string) => {
  const compact = name.trim().replace(/\s+/g, " ");
  const words = compact.split(" ").filter(Boolean);
  if (words.length > 1) return `${words[0]?.[0] ?? ""}${words[1]?.[0] ?? ""}`.toUpperCase();
  return compact.slice(0, 2).toUpperCase();
};

export function SaleCompletionDetails({
  receipt,
  deliveryContext,
  printStatus,
  busy,
  email,
  emailMessage,
  emailSending,
  printAlways,
  onEmailChange,
  onSendEmail,
  onPrintAlwaysChange,
}: SaleCompletionDetailsProps) {
  const isCredit = receipt.paymentMethod === "credit";
  const isCard = receipt.paymentMethod === "card";
  const isDelivery = Boolean(deliveryContext);
  const variant = isDelivery ? "delivery" : isCredit ? "credit" : "settled";
  const methodLabel = deliveryContext?.channelName ?? (isCredit ? "آجل" : isCard ? "شبكة / مدى" : "نقدي");
  const methodHeading = isDelivery ? "قناة التوصيل" : isCredit ? "طريقة الإنهاء" : "طريقة الدفع";
  const methodSecondary = deliveryContext
    ? deliveryContext.merchantCollection === "cash" ? "تحصيل نقدي" : "تحصيل شبكة / مدى"
    : isCredit
      ? receipt.customer?.name ?? "عميل"
      : isCard ? "Card" : "Cash";
  const amountLabel = isCredit ? "قيمة البيع" : "المبلغ المدفوع";
  const resolvedEmail = email || receipt.customer?.details.email || "";

  return (
    <div className={`sale-completion-body sale-completion-body--${variant}`} data-completion-method={variant}>
      <section className="sale-completion-hero inline-success-copy" aria-labelledby="sale-completion-title">
        <span className="sale-completion-local"><i />محفوظ محليًا</span>
        <span className="sale-completion-mark"><Icon name="check" size={35} strokeWidth={2.5} /></span>
        <span className="sale-completion-eyebrow">اكتملت العملية</span>
        <h1 id="sale-completion-title">{isCredit ? "تم تسجيل البيع الآجل بنجاح" : "تمت عملية البيع بنجاح"}</h1>
      </section>

      <section className="sale-completion-facts" aria-label="ملخص العملية">
        <div className="sale-completion-receipt">
          <span>رقم الإيصال</span>
          <strong dir="ltr">{receipt.number}</strong>
        </div>
        <div className="sale-completion-amount">
          <span>{amountLabel}</span>
          <strong><MoneyAmount value={receipt.total} /></strong>
        </div>
      </section>

      <section className={`sale-completion-method sale-completion-method--${variant}`} aria-label={`${methodHeading}: ${methodLabel}`}>
        <span className="sale-completion-method-art" aria-hidden="true">
          {deliveryContext ? (
            <b>{channelMark(deliveryContext.channelName)}</b>
          ) : isCredit ? (
            <Icon name="user" size={30} strokeWidth={2} />
          ) : isCard ? (
            <Icon name="card" size={31} strokeWidth={2} />
          ) : (
            <Icon name="cash" size={31} strokeWidth={2} />
          )}
        </span>
        <span className="sale-completion-method-copy">
          <small>{methodHeading}</small>
          <strong>{methodLabel}</strong>
          <span lang={deliveryContext || isCredit ? undefined : "en"} dir={deliveryContext || isCredit ? undefined : "ltr"}>{methodSecondary}</span>
        </span>
      </section>

      {receipt.customer && receipt.loyaltyEarned.halalas > 0 ? (
        <div className="sale-completion-loyalty">النقاط المكتسبة: <strong>{formatMoneyAmount(receipt.loyaltyEarned)}</strong></div>
      ) : null}

      {receipt.customer ? (
        <section className="sale-completion-email" aria-label="إرسال الإيصال للعميل">
          <label>
            <span>إرسال الإيصال إلى العميل</span>
            <input
              dir="ltr"
              type="email"
              value={resolvedEmail}
              onChange={(event) => onEmailChange(event.target.value)}
              placeholder="customer@example.com"
            />
          </label>
          <button type="button" onClick={onSendEmail} disabled={busy || emailSending || !resolvedEmail.trim()}>
            {emailSending ? "جارٍ الإرسال…" : "إرسال الإيصال"}
          </button>
          {emailMessage ? <small role="status">{emailMessage}</small> : null}
        </section>
      ) : null}

      {printMessages[printStatus] ? (
        <div className={`sale-completion-print-status sale-completion-print-status--${printStatus}`} role="status">
          <Icon name="printer" size={17} />
          {printMessages[printStatus]}
        </div>
      ) : null}

      <label className={`sale-completion-print-always ${printAlways ? "active" : ""}`}>
        <input type="checkbox" checked={printAlways} onChange={(event) => onPrintAlwaysChange(event.target.checked)} />
        <span className="sale-completion-print-icon" aria-hidden="true"><Icon name="printer" size={23} /></span>
        <span className="sale-completion-print-copy">
          <strong>طباعة الإيصال دائمًا</strong>
          <small>عدم إظهار هذه الشاشة في العمليات القادمة</small>
        </span>
        <span className="sale-completion-check" aria-hidden="true"><Icon name="check" size={18} strokeWidth={2.6} /></span>
      </label>
    </div>
  );
}
