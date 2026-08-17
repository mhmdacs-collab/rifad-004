import { useEffect, useMemo, useState } from "react";
import { Icon } from "./Icon";
import { InlineNotice } from "./InlineNotice";
import { MoneyAmount } from "./MoneyAmount";
import { formatMoneyAmount, money, parseRiyalsToHalalas, suggestedCashHalalas } from "../domain/money";
import { readPrintReceiptAlways, writePrintReceiptAlways } from "../domain/posPreferences";
import type { PrintDeliveryStatus, Receipt, Ticket } from "../domain/models";

export type InlineCheckoutStage = "payment" | "cash" | "success";

type InlineCheckoutRailProps = {
  stage: InlineCheckoutStage;
  ticket: Ticket;
  receipt: Receipt | null;
  printStatus: PrintDeliveryStatus;
  busy: string | null;
  errorMessage: string | null;
  onDismissError: () => void;
  onBackToSales: () => void;
  onBackToPayment: () => void;
  onCash: () => void;
  onCompleteCash: (tenderedHalalas: number) => void;
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

export function InlineCheckoutRail({
  stage,
  ticket,
  receipt,
  printStatus,
  busy,
  errorMessage,
  onDismissError,
  onBackToSales,
  onBackToPayment,
  onCash,
  onCompleteCash,
  onPrint,
  onEmailReceipt,
  onNewSale,
}: InlineCheckoutRailProps) {
  const totalInput = (ticket.total.halalas / 100).toFixed(2);
  const [cashInput, setCashInput] = useState(totalInput);
  const [keypadFresh, setKeypadFresh] = useState(true);
  const [email, setEmail] = useState("");
  const [emailMessage, setEmailMessage] = useState<string | null>(null);
  const [emailSending, setEmailSending] = useState(false);
  const [printAlways, setPrintAlways] = useState(readPrintReceiptAlways);

  useEffect(() => {
    if (stage !== "cash") return;
    setCashInput(totalInput);
    setKeypadFresh(true);
  }, [stage, ticket.id, totalInput]);

  useEffect(() => {
    if (stage !== "success" || !receipt) return;
    setEmail(receipt.customer?.details.email ?? "");
    setEmailMessage(null);
    setEmailSending(false);
    setPrintAlways(readPrintReceiptAlways());
  }, [receipt, stage]);

  const tendered = parseRiyalsToHalalas(cashInput);
  const validCash = tendered !== null && tendered >= ticket.total.halalas;
  const change = validCash && tendered !== null ? tendered - ticket.total.halalas : 0;
  const suggestions = useMemo(() => suggestedCashHalalas(ticket.total.halalas), [ticket.total.halalas]);

  const updateCashInput = (value: string) => {
    setCashInput(value.replace(/[^0-9.]/g, ""));
    setKeypadFresh(false);
  };

  const pressKey = (key: string) => {
    if (key === "backspace") {
      setCashInput((current) => current.length <= 1 ? "0" : current.slice(0, -1));
      setKeypadFresh(false);
      return;
    }

    if (key === ".") {
      setCashInput((current) => {
        if (keypadFresh) return "0.";
        if (current.includes(".")) return current;
        return `${current || "0"}.`;
      });
      setKeypadFresh(false);
      return;
    }

    setCashInput((current) => {
      if (keypadFresh) return key;
      const [whole, fraction = ""] = current.split(".");
      if (current.includes(".") && fraction.length >= 2) return current;
      if (!current.includes(".") && whole === "0") return key;
      return `${current}${key}`;
    });
    setKeypadFresh(false);
  };

  const clearCash = () => {
    setCashInput("0");
    setKeypadFresh(false);
  };

  const chooseSuggestion = (halalas: number) => {
    setCashInput((halalas / 100).toFixed(2));
    setKeypadFresh(true);
  };

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

  if (stage === "payment") {
    return (
      <aside className="inline-checkout-rail inline-checkout-rail--payment" aria-label="الدفع">
        <header className="inline-checkout-head">
          <button type="button" className="inline-checkout-back" onClick={onBackToSales} aria-label="العودة إلى السلة"><Icon name="arrow" size={20} /></button>
          <div><strong>اختيار طريقة الدفع</strong><span>تذكرة #{ticket.sequence}</span></div>
        </header>

        <div className="inline-checkout-body">
          <section className="inline-checkout-total-card" aria-label="إجمالي البيع">
            <span>إجمالي البيع</span>
            <h1><MoneyAmount value={ticket.total} /></h1>
          </section>

          <InlineNotice message={errorMessage} onDismiss={onDismissError} />

          <section className="inline-payment-section" aria-labelledby="inline-payment-title">
            <div className="inline-section-heading">
              <strong id="inline-payment-title">طريقة الدفع</strong>
              <span>اختر طريقة لإكمال العملية</span>
            </div>
            <div className="inline-payment-methods">
              <button type="button" className="inline-payment-method inline-payment-method--ready" onClick={onCash} disabled={busy === "cash-method"}>
                <span className="inline-payment-icon"><Icon name="cash" size={27} /></span>
                <strong>نقدًا</strong>
                <small>متاح</small>
              </button>
              <button type="button" className="inline-payment-method" disabled>
                <span className="inline-payment-icon"><Icon name="card" size={27} /></span>
                <strong>شبكة / مدى</strong>
                <small>قريبًا</small>
              </button>
            </div>
          </section>

          <div className="inline-checkout-note"><Icon name="wifi" size={17} /><span>الدفع النقدي يعمل محليًا وتتم المزامنة عند توفر الاتصال.</span></div>
        </div>
      </aside>
    );
  }

  if (stage === "cash") {
    return (
      <aside className="inline-checkout-rail inline-checkout-rail--cash" aria-label="الدفع نقدًا">
        <header className="inline-checkout-head">
          <button type="button" className="inline-checkout-back" onClick={onBackToPayment} aria-label="العودة إلى طرق الدفع"><Icon name="arrow" size={20} /></button>
          <div><strong>الدفع نقدًا</strong><span>تذكرة #{ticket.sequence}</span></div>
        </header>

        <div className="inline-checkout-body inline-cash-body">
          <section className="inline-checkout-total-card" aria-label="إجمالي البيع">
            <span>إجمالي البيع</span>
            <h1><MoneyAmount value={ticket.total} /></h1>
          </section>

          <InlineNotice message={errorMessage} onDismiss={onDismissError} />

          <section className="inline-cash-entry" aria-labelledby="cash-entry-label">
            <div className="inline-section-heading inline-cash-entry-heading">
              <div><strong id="cash-entry-label">المبلغ المستلم</strong><span>اكتب المبلغ أو استخدم لوحة الأرقام</span></div>
              <button type="button" onClick={clearCash}>مسح</button>
            </div>
            <label className="inline-cash-input">
              <input
                dir="ltr"
                inputMode="decimal"
                value={cashInput}
                onChange={(event) => updateCashInput(event.target.value)}
                onFocus={(event) => event.currentTarget.select()}
                aria-label="المبلغ المستلم"
              />
              <span>ر.س</span>
            </label>
          </section>

          <div className="inline-cash-suggestions" aria-label="مبالغ سريعة">
            <button type="button" className={tendered === ticket.total.halalas ? "selected" : ""} onClick={() => chooseSuggestion(ticket.total.halalas)}>بالضبط</button>
            {suggestions.slice(0, 4).map((value) => (
              <button type="button" key={value} className={tendered === value ? "selected" : ""} onClick={() => chooseSuggestion(value)}>
                {formatMoneyAmount(money(value))}
              </button>
            ))}
          </div>

          <div className="inline-keypad" dir="ltr" aria-label="لوحة أرقام المبلغ المستلم">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0"].map((key) => (
              <button type="button" key={key} onClick={() => pressKey(key)}>{key}</button>
            ))}
            <button type="button" className="inline-keypad-backspace" onClick={() => pressKey("backspace")} aria-label="حذف آخر رقم">⌫</button>
          </div>

          <section className={`inline-change-card ${validCash ? "ready" : ""}`} aria-live="polite">
            <span>الباقي للعميل</span>
            <strong><MoneyAmount value={money(change)} /></strong>
          </section>

          {!validCash && cashInput.length > 0 ? <div className="inline-cash-validation">المبلغ المستلم أقل من إجمالي البيع.</div> : null}

          <button type="button" className="inline-complete-sale" disabled={!validCash || busy === "complete-cash"} onClick={() => tendered !== null && onCompleteCash(tendered)}>
            <Icon name="check" size={21} />
            <span>{busy === "complete-cash" ? "جارٍ السداد…" : "سداد"}</span>
          </button>
        </div>
      </aside>
    );
  }

  const completed = receipt;
  if (!completed) return null;
  const isCredit = completed.paymentMethod === "credit";

  return (
    <aside className="inline-checkout-rail inline-checkout-rail--success" aria-label="اكتملت عملية البيع">
      <div className="inline-success-body">
        <div className="inline-success-mark"><Icon name="check" size={35} strokeWidth={2.4} /></div>
        <div className="inline-success-copy">
          <span>اكتملت العملية</span>
          <h1>{isCredit ? "تم تسجيل البيع الآجل بنجاح" : "تمت عملية البيع بنجاح"}</h1>
          <p>{isCredit ? "حُفظت الفاتورة على حساب العميل." : "حُفظت العملية محليًا وهي جاهزة للمزامنة."}</p>
        </div>

        <section className="inline-success-summary" aria-label="ملخص العملية">
          <div><span>رقم الإيصال</span><strong dir="ltr">{completed.number}</strong></div>
          <div><span>الإجمالي</span><strong><MoneyAmount value={completed.total} /></strong></div>
          {isCredit ? (
            <>
              <div><span>طريقة الدفع</span><strong>آجل</strong></div>
              <div className="inline-success-highlight"><span>العميل</span><strong>{completed.customer?.name ?? "—"}</strong></div>
            </>
          ) : (
            <>
              <div><span>المستلم</span><strong><MoneyAmount value={completed.tendered} /></strong></div>
              <div className="inline-success-highlight"><span>الباقي</span><strong><MoneyAmount value={completed.change} /></strong></div>
            </>
          )}
        </section>

        {completed.customer ? (
          <section className="inline-success-email" aria-label="إرسال الإيصال للعميل">
            <label><span>إرسال الإيصال إلى العميل</span><input dir="ltr" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="customer@example.com" /></label>
            <button type="button" onClick={() => void sendEmail()} disabled={busy !== null || emailSending || !email.trim()}>{emailSending ? "جارٍ الإرسال…" : "إرسال"}</button>
            {emailMessage ? <small role="status">{emailMessage}</small> : null}
          </section>
        ) : null}

        {completed.customer && completed.loyaltyEarned.halalas > 0 ? <div className="inline-success-loyalty">النقاط المكتسبة: <strong>{formatMoneyAmount(completed.loyaltyEarned)}</strong></div> : null}

        {printMessages[printStatus] ? <div className={`inline-print-status inline-print-status--${printStatus}`} role="status"><Icon name="printer" size={17} />{printMessages[printStatus]}</div> : null}

        <label className="inline-print-always"><input type="checkbox" checked={printAlways} onChange={(event) => updatePrintAlways(event.target.checked)} /><span>طباعة الإيصال دائمًا في العمليات القادمة</span></label>

        <div className="inline-success-actions">
          <button type="button" className="inline-success-print" onClick={onPrint} disabled={busy !== null}><Icon name="printer" size={19} />{printStatus === "failed" ? "إعادة الطباعة" : "طباعة"}</button>
          <button type="button" className="inline-new-sale" onClick={onNewSale} disabled={busy !== null}><Icon name="plus" size={20} />بيع جديد</button>
        </div>
      </div>
    </aside>
  );
}
