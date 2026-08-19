import type { EffectivePosPaymentMethod } from "../../../../contracts/posConfiguration";
import type { Ticket } from "../domain/models";
import { Icon } from "./Icon";
import { InlineNotice } from "./InlineNotice";
import { MoneyAmount } from "./MoneyAmount";

type ConfiguredPaymentMethodRailProps = {
  ticket: Ticket;
  paymentMethods: readonly EffectivePosPaymentMethod[];
  configurationLoading: boolean;
  configurationError: string | null;
  busy: string | null;
  errorMessage: string | null;
  onDismissError: () => void;
  onBackToSales: () => void;
  onCash: () => void;
  onCard: () => void;
};

const supportedKinds = new Set<EffectivePosPaymentMethod["kind"]>(["cash", "card"]);

function PaymentVisual({ kind }: { kind: EffectivePosPaymentMethod["kind"] }) {
  if (kind === "cash") {
    return (
      <span className="payment-method-visual payment-method-visual--cash" aria-hidden="true">
        <span className="cash-note cash-note--back" />
        <span className="cash-note cash-note--front"><Icon name="cash" size={32} /></span>
        <span className="cash-coin">ر.س</span>
      </span>
    );
  }

  if (kind === "card") {
    return (
      <span className="payment-method-visual payment-method-visual--mada" aria-hidden="true">
        <span className="mada-card-shape"><Icon name="card" size={31} /><b>مدى</b></span>
        <span className="mada-contactless"><i /><i /><i /></span>
      </span>
    );
  }

  return <span className="payment-method-visual" aria-hidden="true"><Icon name="card" size={30} /></span>;
}

const descriptionFor = (method: EffectivePosPaymentMethod) => {
  if (method.kind === "cash") return "استلام المبلغ وحساب الباقي";
  if (method.kind === "card") return "بطاقة أو دفع لاتلامسي";
  if (method.kind === "customer-credit") return "يتطلب مسار العميل الآجل";
  return "طريقة دفع مخصصة";
};

export function ConfiguredPaymentMethodRail({
  ticket,
  paymentMethods,
  configurationLoading,
  configurationError,
  busy,
  errorMessage,
  onDismissError,
  onBackToSales,
  onCash,
  onCard,
}: ConfiguredPaymentMethodRailProps) {
  const methods = [...paymentMethods]
    .filter((method) => method.enabled)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "ar"));

  const choose = (method: EffectivePosPaymentMethod) => {
    if (method.kind === "cash") onCash();
    if (method.kind === "card") onCard();
  };

  return (
    <aside className="inline-checkout-rail inline-checkout-rail--payment" aria-label="الدفع" data-screen-id="POS-SCREEN-007">
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
        <InlineNotice message={configurationError} onDismiss={() => undefined} />

        <section className="inline-payment-section" aria-labelledby="inline-payment-title">
          <div className="inline-section-heading">
            <strong id="inline-payment-title">طريقة الدفع</strong>
            <span>الطرق المتاحة يحددها إعداد هذا الفرع والجهاز</span>
          </div>

          {configurationLoading ? <div className="inline-checkout-note"><span>جارٍ تحميل طرق الدفع المحلية…</span></div> : null}
          {!configurationLoading && methods.length === 0 ? <div className="inline-checkout-note"><span>لا توجد طريقة دفع مفعّلة لهذا الجهاز.</span></div> : null}

          <div className="inline-payment-methods">
            {methods.map((method) => {
              const supported = supportedKinds.has(method.kind);
              const methodBusy = method.kind === "cash" ? busy === "cash-method" : method.kind === "card" ? busy === "card-method" : false;
              return (
                <button
                  type="button"
                  className={`inline-payment-method ${method.kind === "cash" ? "inline-payment-method--cash" : method.kind === "card" ? "inline-payment-method--mada" : ""}`}
                  key={method.id}
                  onClick={() => choose(method)}
                  disabled={!supported || methodBusy}
                  data-payment-method-id={method.id}
                >
                  <PaymentVisual kind={method.kind} />
                  <span className="inline-payment-copy">
                    <strong>{method.name}</strong>
                    <small>{supported ? descriptionFor(method) : `${descriptionFor(method)} — غير مدعومة في مسار الدفع الحالي`}</small>
                  </span>
                  <span className="inline-payment-chevron">‹</span>
                </button>
              );
            })}
          </div>
        </section>

        <div className="inline-checkout-note"><Icon name="wifi" size={17} /><span>إتاحة الطريقة وترتيبها من إعدادات رفاد الفعالة لهذا الجهاز، وليس من قائمة ثابتة داخل الواجهة.</span></div>
      </div>
    </aside>
  );
}
