import { useEffect, useMemo, useState } from "react";
import type { DeliveryCollectionRecord } from "../../../../contracts/deliveryCollection";
import { Icon } from "./Icon";
import { InlineNotice } from "./InlineNotice";
import { MoneyAmount } from "./MoneyAmount";
import { SaleCompletionDetails } from "./SaleCompletionDetails";
import { formatMoneyAmount, money, parseRiyalsToHalalas, suggestedCashHalalas } from "../domain/money";
import { readPrintReceiptAlways, writePrintReceiptAlways } from "../domain/posPreferences";
import type { PrintDeliveryStatus, Receipt, Ticket } from "../domain/models";

export type InlineCheckoutStage = "payment" | "cash" | "card" | "success";

type InlineCheckoutRailProps = {
  stage: InlineCheckoutStage;
  ticket: Ticket;
  receipt: Receipt | null;
  deliveryContext?: DeliveryCollectionRecord | null;
  serviceLabel?: string | null;
  printStatus: PrintDeliveryStatus;
  busy: string | null;
  errorMessage: string | null;
  onDismissError: () => void;
  onBackToSales: () => void;
  onBackToPayment: () => void;
  onCash: () => void;
  onCard: () => void;
  onCompleteCash: (tenderedHalalas: number) => void;
  onCompleteCard: () => void;
  onPrint: () => void;
  onEmailReceipt: (email: string) => Promise<boolean>;
  onNewSale: () => void;
};

function CashPaymentVisual() {
  return (
    <span className="payment-method-visual payment-method-visual--cash" aria-hidden="true">
      <span className="cash-note cash-note--back" />
      <span className="cash-note cash-note--front"><Icon name="cash" size={32} /></span>
      <span className="cash-coin">ر.س</span>
    </span>
  );
}

function MadaPaymentVisual() {
  return (
    <span className="payment-method-visual payment-method-visual--mada" aria-hidden="true">
      <span className="mada-card-shape"><Icon name="card" size={31} /><b>مدى</b></span>
      <span className="mada-contactless"><i /><i /><i /></span>
    </span>
  );
}

export function InlineCheckoutRail({
  stage,
  ticket,
  receipt,
  deliveryContext,
  serviceLabel = null,
  printStatus,
  busy,
  errorMessage,
  onDismissError,
  onBackToSales,
  onBackToPayment,
  onCash,
  onCard,
  onCompleteCash,
  onCompleteCard,
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

  const chooseSuggestion = (halalas: number) => {
    setCashInput((halalas / 100).toFixed(2));
    setKeypadFresh(true);
  };

  const updatePrintAlways = (enabled: boolean) => {
    setPrintAlways(enabled);
    writePrintReceiptAlways(enabled);
  };

  const sendEmail = async () => {
    const resolvedEmail = email.trim() || receipt?.customer?.details.email?.trim() || "";
    if (!resolvedEmail || emailSending) return;
    setEmailSending(true);
    setEmailMessage(null);
    const sent = await onEmailReceipt(resolvedEmail);
    setEmailSending(false);
    setEmailMessage(sent ? "تم إرسال الإيصال إلى البريد الإلكتروني." : "تعذر إرسال الإيصال. تحقق من البريد وحاول مرة أخرى.");
  };

  if (stage === "payment") {
    return (
      <aside className="inline-checkout-rail inline-checkout-rail--payment" aria-label="الدفع">
        <header className="inline-checkout-head">
          <button type="button" className="inline-checkout-back" onClick={onBackToSales} aria-label="العودة إلى السلة"><Icon name="arrow" size={20} /></button>
          <div><strong>اختيار طريقة الدفع</strong><span>تذكرة #{ticket.sequence}</span>{serviceLabel ? <span className="local-checkout-context">{serviceLabel}</span> : null}</div>
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
              <span>اختر الطريقة المناسبة للعميل</span>
            </div>
            <div className="inline-payment-methods">
              <button type="button" className="inline-payment-method inline-payment-method--cash" onClick={onCash} disabled={busy === "cash-method"}>
                <CashPaymentVisual />
                <span className="inline-payment-copy"><strong>نقدًا</strong><small>استلام المبلغ وحساب الباقي</small></span>
                <span className="inline-payment-chevron">‹</span>
              </button>
              <button type="button" className="inline-payment-method inline-payment-method--mada" onClick={onCard} disabled={busy === "card-method"}>
                <MadaPaymentVisual />
                <span className="inline-payment-copy"><strong>شبكة / مدى</strong><small>بطاقة أو دفع لاتلامسي</small></span>
                <span className="inline-payment-chevron">‹</span>
              </button>
            </div>
          </section>

          <div className="inline-checkout-note"><Icon name="wifi" size={17} /><span>اختر طريقة الدفع لإكمال العملية داخل نفس شاشة البيع.</span></div>
        </div>
      </aside>
    );
  }

  if (stage === "cash") {
    return (
      <aside className="inline-checkout-rail inline-checkout-rail--cash" aria-label="الدفع نقدًا">
        <header className="inline-checkout-head">
          <button type="button" className="inline-checkout-back" onClick={onBackToPayment} aria-label="العودة إلى طرق الدفع"><Icon name="arrow" size={20} /></button>
          <div><strong>الدفع نقدًا</strong><span>تذكرة #{ticket.sequence}</span>{serviceLabel ? <span className="local-checkout-context">{serviceLabel}</span> : null}</div>
        </header>

        <div className="inline-checkout-body inline-cash-body">
          <section className="inline-checkout-total-card" aria-label="إجمالي البيع">
            <span>إجمالي البيع</span>
            <h1><MoneyAmount value={ticket.total} /></h1>
          </section>

          <InlineNotice message={errorMessage} onDismiss={onDismissError} />

          <section className="inline-cash-entry" aria-labelledby="cash-entry-label">
            <div className="inline-section-heading inline-cash-entry-heading">
              <div><strong id="cash-entry-label">المبلغ المستلم</strong></div>
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
        </div>

        <footer className="inline-operation-footer transaction-operation-card" aria-label="إجراءات العملية">
          <button type="button" className="inline-cancel-sale" disabled={busy !== null} onClick={onNewSale}>
            إلغاء الفاتورة
          </button>
          <button type="button" className="inline-complete-sale" disabled={!validCash || busy === "complete-cash"} onClick={() => tendered !== null && onCompleteCash(tendered)}>
            <Icon name="check" size={21} />
            <span>{busy === "complete-cash" ? "جارٍ السداد…" : "سداد"}</span>
          </button>
        </footer>
      </aside>
    );
  }

  if (stage === "card") {
    return (
      <aside className="inline-checkout-rail inline-checkout-rail--card" aria-label="الدفع عبر شبكة أو مدى">
        <header className="inline-checkout-head">
          <button type="button" className="inline-checkout-back" onClick={onBackToPayment} aria-label="العودة إلى طرق الدفع"><Icon name="arrow" size={20} /></button>
          <div><strong>شبكة / مدى</strong><span>تذكرة #{ticket.sequence}</span>{serviceLabel ? <span className="local-checkout-context">{serviceLabel}</span> : null}</div>
        </header>

        <div className="inline-checkout-body inline-card-body">
          <section className="inline-checkout-total-card" aria-label="إجمالي البيع">
            <span>المبلغ المطلوب</span>
            <h1><MoneyAmount value={ticket.total} /></h1>
          </section>

          <InlineNotice message={errorMessage} onDismiss={onDismissError} />

          <section className="inline-card-terminal" aria-labelledby="inline-card-title">
            <div className="inline-card-terminal-visual"><MadaPaymentVisual /></div>
            <div className="inline-card-terminal-copy">
              <span>جاهز للدفع</span>
              <h2 id="inline-card-title">مرّر البطاقة أو استخدم الدفع اللاتلامسي</h2>
              <p>بعد تأكيد العملية من جهاز الشبكة، أكمل البيع من الزر أدناه.</p>
            </div>
            <div className="inline-card-status"><i /><span>جهاز الدفع جاهز</span></div>
          </section>
        </div>

        <footer className="inline-operation-footer transaction-operation-card" aria-label="إجراءات العملية">
          <button type="button" className="inline-cancel-sale" disabled={busy !== null} onClick={onNewSale}>
            إلغاء الفاتورة
          </button>
          <button type="button" className="inline-complete-sale inline-complete-card" disabled={busy === "complete-card"} onClick={onCompleteCard}>
            <Icon name="check" size={21} />
            <span>{busy === "complete-card" ? "جارٍ تأكيد الدفع…" : "تم الدفع"}</span>
          </button>
        </footer>
      </aside>
    );
  }

  const completed = receipt;
  if (!completed) return null;

  return (
    <aside className="inline-checkout-rail inline-checkout-rail--success" aria-label="اكتملت عملية البيع">
      <SaleCompletionDetails
        receipt={completed}
        deliveryContext={deliveryContext}
        printStatus={printStatus}
        busy={busy !== null}
        email={email}
        emailMessage={emailMessage}
        emailSending={emailSending}
        printAlways={printAlways}
        onEmailChange={setEmail}
        onSendEmail={() => void sendEmail()}
        onPrintAlwaysChange={updatePrintAlways}
      />

      <footer className="inline-success-actions inline-operation-footer transaction-operation-card" aria-label="إجراءات العملية">
        <button type="button" className="inline-success-print" onClick={onPrint} disabled={busy !== null} aria-label={printStatus === "failed" ? "إعادة طباعة الإيصال" : "طباعة الإيصال"}><Icon name="printer" size={19} />{printStatus === "failed" ? "إعادة الطباعة" : "طباعة"}</button>
        <button type="button" className="inline-new-sale" onClick={onNewSale} disabled={busy !== null}><Icon name="plus" size={20} />بيع جديد</button>
      </footer>
    </aside>
  );
}
