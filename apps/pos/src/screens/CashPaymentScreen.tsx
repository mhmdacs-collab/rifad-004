import { useMemo, useState } from "react";
import { Icon } from "../components/Icon";
import { InlineNotice } from "../components/InlineNotice";
import { MoneyAmount } from "../components/MoneyAmount";
import { TicketPanel } from "../components/TicketPanel";
import { money, parseRiyalsToHalalas, suggestedCashHalalas } from "../domain/money";
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
    <main className="checkout-workspace cash-workspace" data-screen-id="POS-SCREEN-008">
      <section className="payment-pane cash-pane">
        <header className="checkout-header cash-header">
          <button type="button" className="icon-button" onClick={onBack} aria-label="العودة إلى طرق الدفع"><Icon name="arrow" /></button>
          <div><strong>الدفع نقدًا</strong><span>تذكرة #{ticket.sequence}</span></div>
        </header>

        <section className="cash-content cash-content--panel" aria-labelledby="cash-title">
          <div className="cash-total">
            <span>الإجمالي المستحق</span>
            <h1 id="cash-title"><MoneyAmount value={ticket.total} /></h1>
          </div>
          <InlineNotice message={errorMessage} onDismiss={onDismissError} />

          <label className="cash-input-wrap">
            <span className="cash-input-label">
              <strong>المبلغ المستلم من العميل</strong>
              <small id="cash-input-help">أدخل أي مبلغ أو اختر فئة سريعة</small>
            </span>
            <div className="cash-input">
              <input
                dir="ltr"
                inputMode="decimal"
                autoFocus
                value={input}
                placeholder="0.00"
                aria-label="المبلغ المستلم"
                aria-describedby="cash-input-help"
                onFocus={(event) => event.currentTarget.select()}
                onChange={(event) => setInput(event.target.value)}
              />
            </div>
          </label>

          <div className="cash-suggestions cash-suggestions--tender" aria-label="مبالغ مقترحة أعلى من الإجمالي">
            {suggestions.map((value) => (
              <button type="button" key={value} className={tendered === value ? "selected" : ""} onClick={() => setInput((value / 100).toFixed(2))}>
                <MoneyAmount value={money(value)} />
              </button>
            ))}
          </div>

          <div className={`change-card change-card--prominent ${valid ? "ready" : ""}`}>
            <span className="change-card-label">الباقي للعميل</span>
            <strong className="change-card-value"><MoneyAmount className="change-value-money" value={money(change ?? 0)} /></strong>
          </div>
          {!valid && input.length > 0 ? <p className="cash-validation">المبلغ المستلم يجب أن يساوي الإجمالي أو يزيد عليه.</p> : null}
          <button type="button" className="primary-button complete-sale" disabled={!valid || busy} onClick={() => tendered !== null && onComplete(tendered)}>
            <Icon name="check" size={21} /> {busy ? "جارٍ السداد…" : "سداد"}
          </button>
        </section>
      </section>
      <div className="checkout-ticket"><TicketPanel ticket={ticket} variant="checkout" /></div>
    </main>
  );
}
