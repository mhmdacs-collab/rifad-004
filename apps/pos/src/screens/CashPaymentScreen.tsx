import { useMemo, useState } from "react";
import { Icon } from "../components/Icon";
import { InlineNotice } from "../components/InlineNotice";
import { formatMoney, money, parseRiyalsToHalalas, suggestedCashHalalas } from "../domain/money";
import type { Ticket } from "../domain/models";

type CashPaymentScreenProps = {
  ticket: Ticket;
  busy: boolean;
  errorMessage: string | null;
  onDismissError: () => void;
  onBack: () => void;
  onComplete: (tenderedHalalas: number) => void;
};

export function CashPaymentScreen({ ticket, busy, errorMessage, onDismissError, onBack, onComplete }: CashPaymentScreenProps) {
  const [input, setInput] = useState((ticket.total.halalas / 100).toFixed(2));
  const tendered = parseRiyalsToHalalas(input);
  const change = tendered === null ? null : Math.max(0, tendered - ticket.total.halalas);
  const suggestions = useMemo(() => suggestedCashHalalas(ticket.total.halalas), [ticket.total.halalas]);
  const valid = tendered !== null && tendered >= ticket.total.halalas;

  return (
    <main className="cash-screen" data-screen-id="POS-SCREEN-008">
      <header className="checkout-header cash-header">
        <button type="button" className="icon-button" onClick={onBack} aria-label="العودة إلى طرق الدفع"><Icon name="arrow" /></button>
        <div><strong>الدفع نقدًا</strong><span>تذكرة #{ticket.sequence}</span></div>
      </header>

      <section className="cash-content" aria-labelledby="cash-title">
        <div className="cash-total"><span>الإجمالي المستحق</span><h1 id="cash-title">{formatMoney(ticket.total)}</h1></div>
        <InlineNotice message={errorMessage} onDismiss={onDismissError} />
        <label className="cash-input-wrap">
          <span>المبلغ المستلم من العميل</span>
          <div className="cash-input"><input dir="ltr" inputMode="decimal" autoFocus value={input} onChange={(event) => setInput(event.target.value)} aria-label="المبلغ المستلم" /><b>SAR</b></div>
        </label>
        <div className="cash-suggestions" aria-label="مبالغ مقترحة">
          {suggestions.map((value) => (
            <button type="button" key={value} className={tendered === value ? "selected" : ""} onClick={() => setInput((value / 100).toFixed(2))}>
              {formatMoney(money(value))}
            </button>
          ))}
        </div>
        <div className={`change-card ${valid ? "ready" : ""}`}>
          <span>الباقي للعميل</span>
          <strong>{formatMoney(money(change ?? 0))}</strong>
        </div>
        {!valid && input.length > 0 ? <p className="cash-validation">المبلغ المستلم يجب أن يساوي الإجمالي أو يزيد عليه.</p> : null}
        <button type="button" className="primary-button complete-sale" disabled={!valid || busy} onClick={() => tendered !== null && onComplete(tendered)}>
          <Icon name="check" size={21} /> {busy ? "جارٍ تسجيل العملية…" : "تأكيد وإتمام البيع"}
        </button>
      </section>
    </main>
  );
}
