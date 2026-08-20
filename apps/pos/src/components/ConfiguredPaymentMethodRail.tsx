import { useState } from "react";
import type {
  EffectiveDeliveryChannel,
  EffectiveDeliveryConfiguration,
  EffectivePosPaymentMethod,
  PosPaymentDirectImpact,
} from "../../../../contracts/posConfiguration";
import type { DeliveryMerchantCollection } from "../../../../contracts/deliveryCollection";
import type { Customer, Ticket } from "../domain/models";
import { ConfiguredCustomerCredit } from "./ConfiguredCustomerCredit";
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
  onSearchCustomers: (query: string) => Promise<readonly Customer[]>;
  onCreateCustomer: (name: string, mobile: string) => Promise<Customer | null>;
  onChargeCredit: (customerId: string) => Promise<Customer | null>;
  onDeliveryCollect: (channel: EffectiveDeliveryChannel, merchantCollection: DeliveryMerchantCollection) => void;
};

type SpecialPaymentFlow = "credit" | "delivery" | null;

const supportedKinds = new Set<EffectivePosPaymentMethod["kind"]>(["cash", "card"]);
const EMPTY_DELIVERY: EffectiveDeliveryConfiguration = { enabled: false, channels: [] };

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

type ArtworkKind = "cash" | "card" | "credit" | "transfer" | "platform";

function artworkKindFor(method: EffectivePosPaymentMethod): ArtworkKind {
  if (method.kind === "cash") return "cash";
  if (method.kind === "card") return "card";
  if (method.kind === "customer-credit") return "credit";
  const impact = directImpactFor(method);
  if (impact === "cash") return "cash";
  if (impact === "customer-receivable") return "credit";
  if (impact === "external-platform") return "platform";
  return "transfer";
}

function PaymentArtwork({ method }: { method: EffectivePosPaymentMethod }) {
  const artwork = artworkKindFor(method);

  if (artwork === "cash") {
    return (
      <span className="payment-method-art payment-method-art--cash" aria-hidden="true">
        <svg viewBox="0 0 96 72" focusable="false">
          <rect className="payment-art-soft" x="23" y="16" width="55" height="35" rx="8" transform="rotate(-7 23 16)" />
          <rect className="payment-art-main" x="13" y="14" width="59" height="37" rx="9" />
          <path className="payment-art-line" d="M21 22h43v21H21z" />
          <circle className="payment-art-mark" cx="42.5" cy="32.5" r="7" />
          <path className="payment-art-line" d="M18 25c4 0 7-3 7-7M67 25c-4 0-7-3-7-7M18 40c4 0 7 3 7 7M67 40c-4 0-7 3-7 7" />
          <circle className="payment-art-coin" cx="69" cy="51" r="12" />
          <path className="payment-art-coin-line" d="M64 51h10M69 46v10" />
        </svg>
      </span>
    );
  }

  if (artwork === "card") {
    return (
      <span className="payment-method-art payment-method-art--card" aria-hidden="true">
        <svg viewBox="0 0 96 72" focusable="false">
          <rect className="payment-art-main" x="13" y="15" width="64" height="42" rx="10" />
          <rect className="payment-art-chip" x="22" y="27" width="14" height="11" rx="3" />
          <path className="payment-art-line" d="M22 46h22" />
          <path className="payment-art-wave" d="M60 25c5 4 5 11 0 15M65 21c8 7 8 17 0 24M70 18c11 9 11 22 0 31" />
          <circle className="payment-art-dot" cx="69" cy="52" r="9" />
        </svg>
      </span>
    );
  }

  if (artwork === "credit") {
    return (
      <span className="payment-method-art payment-method-art--credit" aria-hidden="true">
        <svg viewBox="0 0 96 72" focusable="false">
          <circle className="payment-art-main" cx="33" cy="27" r="11" />
          <path className="payment-art-profile" d="M15 56c2-12 9-18 18-18s16 6 18 18" />
          <rect className="payment-art-soft" x="53" y="17" width="25" height="39" rx="7" />
          <path className="payment-art-line" d="M60 29h11M60 36h11M60 43h7" />
          <circle className="payment-art-badge" cx="74" cy="51" r="10" />
          <path className="payment-art-badge-line" d="M70 51l3 3 6-7" />
        </svg>
      </span>
    );
  }

  if (artwork === "platform") {
    return (
      <span className="payment-method-art payment-method-art--platform" aria-hidden="true">
        <svg viewBox="0 0 96 72" focusable="false">
          <rect className="payment-art-main" x="29" y="10" width="38" height="52" rx="10" />
          <rect className="payment-art-soft" x="36" y="19" width="24" height="26" rx="6" />
          <circle className="payment-art-dot" cx="48" cy="54" r="3" />
          <circle className="payment-art-orbit" cx="22" cy="27" r="7" />
          <circle className="payment-art-orbit" cx="76" cy="34" r="7" />
          <path className="payment-art-wave" d="M28 28h8M60 35h9" />
        </svg>
      </span>
    );
  }

  return (
    <span className="payment-method-art payment-method-art--transfer" aria-hidden="true">
      <svg viewBox="0 0 96 72" focusable="false">
        <circle className="payment-art-soft" cx="31" cy="36" r="18" />
        <circle className="payment-art-main" cx="65" cy="36" r="18" />
        <path className="payment-art-arrow payment-art-arrow--top" d="M29 29h35l-7-7M64 29l-7 7" />
        <path className="payment-art-arrow payment-art-arrow--bottom" d="M67 43H32l7 7M32 43l7-7" />
      </svg>
    </span>
  );
}

function DeliveryArtwork() {
  return (
    <span className="payment-method-art payment-method-art--delivery" aria-hidden="true">
      <svg viewBox="0 0 96 72" focusable="false">
        <path className="payment-art-main" d="M14 24h42v28H14z" />
        <path className="payment-art-soft" d="M56 32h13l12 11v9H56z" />
        <path className="payment-art-line" d="M62 36h6l7 7H62z" />
        <circle className="payment-art-wheel" cx="29" cy="55" r="8" />
        <circle className="payment-art-wheel" cx="68" cy="55" r="8" />
        <path className="payment-art-speed" d="M10 32H3M10 40H6M14 48H8" />
      </svg>
    </span>
  );
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
  onSearchCustomers,
  onCreateCustomer,
  onChargeCredit,
  onDeliveryCollect,
}: ConfiguredPaymentMethodRailProps) {
  const [specialFlow, setSpecialFlow] = useState<SpecialPaymentFlow>(null);
  const enabledMethods = [...paymentMethods]
    .filter((method) => method.enabled)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "ar"));
  const creditMethod = enabledMethods.find((method) => method.kind === "customer-credit") ?? null;
  const methods = enabledMethods.filter((method) => method.kind !== "customer-credit");
  const deliveryExecutable = hasExecutableDeliveryCollection(delivery);

  const choose = (method: EffectivePosPaymentMethod) => {
    if (method.kind === "cash") onCash();
    if (method.kind === "card") onCard();
  };

  const headerTitle = specialFlow === "delivery" ? "تحصيل طلب التوصيل" : specialFlow === "credit" ? "بيع آجل" : "اختيار طريقة الدفع";
  const headerEnglish = specialFlow === "delivery" ? "Delivery collection" : specialFlow === "credit" ? "Credit sale" : "Choose payment method";

  return (
    <aside className="inline-checkout-rail inline-checkout-rail--payment" aria-label="الدفع" data-screen-id="POS-SCREEN-007">
      <header className="inline-checkout-head">
        <button
          type="button"
          className="inline-checkout-back"
          onClick={specialFlow ? () => setSpecialFlow(null) : onBackToSales}
          aria-label={specialFlow ? "العودة إلى طرق الدفع" : "العودة إلى السلة"}
        >
          <Icon name="arrow" size={20} />
        </button>
        <div>
          <strong>{headerTitle}</strong>
          <span lang="en" dir="ltr">{headerEnglish} · Ticket #{ticket.sequence}</span>
        </div>
      </header>

      <div className="inline-checkout-body">
        <section className="inline-checkout-total-card" aria-label="إجمالي البيع">
          <span>إجمالي البيع <small lang="en" dir="ltr">· Total</small></span>
          <h1><MoneyAmount value={ticket.total} /></h1>
        </section>

        <InlineNotice message={errorMessage} onDismiss={onDismissError} />
        <InlineNotice message={configurationError} onDismiss={() => undefined} />

        {specialFlow === "delivery" ? (
          <ConfiguredDeliveryCollection
            delivery={delivery ?? EMPTY_DELIVERY}
            onBack={() => setSpecialFlow(null)}
            onCollect={onDeliveryCollect}
          />
        ) : specialFlow === "credit" && creditMethod ? (
          <ConfiguredCustomerCredit
            ticketTotal={ticket.total}
            busy={busy === "customer-create" || busy === "customer-credit" || busy === "customer-settlement"}
            onSearch={onSearchCustomers}
            onCreateCustomer={onCreateCustomer}
            onChargeCredit={onChargeCredit}
          />
        ) : (
          <section className="inline-payment-section" aria-label="طرق الدفع">
            {configurationLoading ? <div className="inline-checkout-note"><span>جارٍ تحميل طرق الدفع المحلية…</span></div> : null}
            {!configurationLoading && methods.length === 0 ? <div className="inline-checkout-note"><span>لا توجد طريقة تحصيل مباشرة مفعّلة لهذا الجهاز.</span></div> : null}

            <div
              className="inline-payment-methods"
              data-payment-method-count={methods.length}
              data-payment-layout="scroll-list"
            >
              {methods.map((method) => {
                const supported = supportedKinds.has(method.kind);
                const methodBusy = method.kind === "cash"
                  ? busy === "cash-method"
                  : method.kind === "card"
                    ? busy === "card-method"
                    : false;
                const englishName = englishLabelFor(method);
                return (
                  <button
                    type="button"
                    className={`inline-payment-method ${method.kind === "cash" ? "inline-payment-method--cash" : method.kind === "card" ? "inline-payment-method--mada" : "inline-payment-method--custom"}`}
                    key={method.id}
                    onClick={() => choose(method)}
                    disabled={!supported || methodBusy}
                    aria-label={`${method.name} — ${englishName}`}
                    data-payment-method-id={method.id}
                    data-payment-impact={directImpactFor(method)}
                  >
                    <PaymentArtwork method={method} />
                    <span className="inline-payment-copy">
                      <strong>{method.name}</strong>
                      <span className="inline-payment-english" lang="en" dir="ltr">{englishName}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="payment-special-actions" aria-label="مسارات الدفع الخاصة">
              {creditMethod ? (
                <button
                  type="button"
                  className="payment-special-action payment-special-action--credit"
                  onClick={() => setSpecialFlow("credit")}
                  aria-label="آجل — Credit"
                  data-special-payment-flow="credit"
                >
                  <PaymentArtwork method={creditMethod} />
                  <span><strong>آجل</strong><small lang="en" dir="ltr">Credit</small></span>
                </button>
              ) : null}
              <button
                type="button"
                className="payment-special-action payment-special-action--delivery"
                onClick={() => setSpecialFlow("delivery")}
                aria-label="توصيل — Delivery"
                data-special-payment-flow="delivery"
                data-delivery-ready={deliveryExecutable ? "true" : "false"}
              >
                <DeliveryArtwork />
                <span><strong>توصيل</strong><small lang="en" dir="ltr">Delivery</small></span>
              </button>
            </div>
          </section>
        )}
      </div>
    </aside>
  );
}
