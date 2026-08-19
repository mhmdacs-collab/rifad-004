import { useState } from "react";
import type {
  EffectiveDeliveryChannel,
  EffectiveDeliveryConfiguration,
  EffectivePosPaymentMethod,
  PosPaymentDirectImpact,
} from "../../../../contracts/posConfiguration";
import type { DeliveryMerchantCollection } from "../../../../contracts/deliveryCollection";
import type { Ticket } from "../domain/models";
import { ConfiguredDeliveryCollection, hasExecutableDeliveryCollection } from "./ConfiguredDeliveryCollection";
import { Icon } from "./Icon";
import { InlineNotice } from "./InlineNotice";
import { MoneyAmount } from "./MoneyAmount";

type ConfiguredPaymentMethodRailProps = {
  ticket: Ticket;
  paymentMethods: readonly EffectivePosPaymentMethod[];
  delivery?: EffectiveDeliveryConfiguration;
  configurationLoading: boolean;
  configurationError: string | null;
  busy: string | null;
  errorMessage: string | null;
  onDismissError: () => void;
  onBackToSales: () => void;
  onCash: () => void;
  onCard: () => void;
  onCredit: () => void;
  onDeliveryCollect: (channel: EffectiveDeliveryChannel, merchantCollection: DeliveryMerchantCollection) => void;
};

const supportedKinds = new Set<EffectivePosPaymentMethod["kind"]>(["cash", "card", "customer-credit"]);

const directImpactFor = (method: EffectivePosPaymentMethod): PosPaymentDirectImpact => {
  if (method.directImpact) return method.directImpact;
  if (method.kind === "cash") return "cash";
  if (method.kind === "card") return "bank";
  if (method.kind === "customer-credit") return "customer-receivable";
  return "bank";
};

const englishLabelFor = (method: EffectivePosPaymentMethod) => {
  if (method.systemDefault === "cash" || method.kind === "cash") return "Cash";
  if (method.systemDefault === "network" || method.kind === "card") return "Card";
  if (method.systemDefault === "credit" || method.kind === "customer-credit") return "Credit";

  const normalizedName = method.name.replace(/\s+/g, " ").trim();
  const lowerName = normalizedName.toLocaleLowerCase("ar");
  if (/^[\x00-\x7F]+$/.test(normalizedName)) return normalizedName;
  if (lowerName.includes("تحويل")) return "Transfer";
  if (lowerName.includes("شيك")) return "Cheque";

  const impact = directImpactFor(method);
  if (impact === "cash") return "Cash";
  if (impact === "customer-receivable") return "Credit";
  if (impact === "external-platform") return "Platform";
  return "Bank";
};

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

  if (kind === "customer-credit") {
    return <span className="payment-method-visual payment-method-visual--credit" aria-hidden="true"><Icon name="user" size={30} /></span>;
  }

  return <span className="payment-method-visual payment-method-visual--custom" aria-hidden="true"><Icon name="card" size={30} /></span>;
}

export function ConfiguredPaymentMethodRail({
  ticket,
  paymentMethods,
  delivery,
  configurationLoading,
  configurationError,
  busy,
  errorMessage,
  onDismissError,
  onBackToSales,
  onCash,
  onCard,
  onCredit,
  onDeliveryCollect,
}: ConfiguredPaymentMethodRailProps) {
  const [deliveryOpen, setDeliveryOpen] = useState(false);
  const methods = [...paymentMethods]
    .filter((method) => method.enabled)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "ar"));
  const deliveryAvailable = hasExecutableDeliveryCollection(delivery);

  const choose = (method: EffectivePosPaymentMethod) => {
    if (method.kind === "cash") onCash();
    if (method.kind === "card") onCard();
    if (method.kind === "customer-credit") onCredit();
  };

  const visibleChoiceCount = methods.length + (deliveryAvailable ? 1 : 0);

  return (
    <aside className="inline-checkout-rail inline-checkout-rail--payment" aria-label="الدفع" data-screen-id="POS-SCREEN-007">
      <header className="inline-checkout-head">
        <button type="button" className="inline-checkout-back" onClick={deliveryOpen ? () => setDeliveryOpen(false) : onBackToSales} aria-label={deliveryOpen ? "العودة إلى طرق الدفع" : "العودة إلى السلة"}><Icon name="arrow" size={20} /></button>
        <div><strong>{deliveryOpen ? "تحصيل طلب التوصيل" : "اختيار طريقة الدفع"}</strong><span>تذكرة #{ticket.sequence}</span></div>
      </header>

      <div className="inline-checkout-body">
        <section className="inline-checkout-total-card" aria-label="إجمالي البيع">
          <span>إجمالي البيع</span>
          <h1><MoneyAmount value={ticket.total} /></h1>
        </section>

        <InlineNotice message={errorMessage} onDismiss={onDismissError} />
        <InlineNotice message={configurationError} onDismiss={() => undefined} />

        {deliveryOpen && delivery ? (
          <ConfiguredDeliveryCollection
            delivery={delivery}
            onBack={() => setDeliveryOpen(false)}
            onCollect={onDeliveryCollect}
          />
        ) : (
          <section className="inline-payment-section" aria-labelledby="inline-payment-title">
            <div className="inline-section-heading inline-section-heading--bilingual">
              <strong id="inline-payment-title">طريقة الدفع</strong>
              <span lang="en" dir="ltr">Payment method</span>
            </div>

            {configurationLoading ? <div className="inline-checkout-note"><span>جارٍ تحميل طرق الدفع المحلية…</span></div> : null}
            {!configurationLoading && visibleChoiceCount === 0 ? <div className="inline-checkout-note"><span>لا توجد طريقة دفع مفعّلة لهذا الجهاز.</span></div> : null}

            <div className="inline-payment-methods" data-payment-method-count={visibleChoiceCount} data-payment-layout="scroll-list">
              {methods.map((method) => {
                const supported = supportedKinds.has(method.kind);
                const methodBusy = method.kind === "cash"
                  ? busy === "cash-method"
                  : method.kind === "card"
                    ? busy === "card-method"
                    : method.kind === "customer-credit"
                      ? busy === "customer-credit"
                      : false;
                const englishName = englishLabelFor(method);
                return (
                  <button
                    type="button"
                    className={`inline-payment-method ${method.kind === "cash" ? "inline-payment-method--cash" : method.kind === "card" ? "inline-payment-method--mada" : method.kind === "customer-credit" ? "inline-payment-method--credit" : "inline-payment-method--custom"}`}
                    key={method.id}
                    onClick={() => choose(method)}
                    disabled={!supported || methodBusy}
                    aria-label={`${method.name} — ${englishName}`}
                    data-payment-method-id={method.id}
                    data-payment-impact={directImpactFor(method)}
                  >
                    <PaymentVisual kind={method.kind} />
                    <span className="inline-payment-copy">
                      <strong>{method.name}</strong>
                      <span className="inline-payment-english" lang="en" dir="ltr">{englishName}</span>
                    </span>
                    <span className="inline-payment-chevron">‹</span>
                  </button>
                );
              })}

              {deliveryAvailable ? (
                <button type="button" className="inline-payment-method inline-payment-method--delivery" onClick={() => setDeliveryOpen(true)} aria-label="توصيل — Delivery" data-payment-method-id="delivery-hub">
                  <span className="payment-method-visual payment-method-visual--delivery" aria-hidden="true">🚚</span>
                  <span className="inline-payment-copy"><strong>توصيل</strong><span className="inline-payment-english" lang="en" dir="ltr">Delivery</span></span>
                  <span className="inline-payment-chevron">‹</span>
                </button>
              ) : null}
            </div>
          </section>
        )}
      </div>
    </aside>
  );
}
