import { useState } from "react";
import type { EffectiveDeliveryChannel, EffectiveDeliveryConfiguration } from "../../../../contracts/posConfiguration";
import type { DeliveryMerchantCollection } from "../../../../contracts/deliveryCollection";

const executableChannel = (channel: EffectiveDeliveryChannel) =>
  channel.kind !== "self-delivery"
  && channel.cashOnDeliveryEnabled
  && channel.codSettlement === "courier-pays-merchant";

export const hasExecutableDeliveryCollection = (delivery: EffectiveDeliveryConfiguration | undefined) =>
  Boolean(delivery?.enabled && delivery.channels.some(executableChannel));

type Props = {
  delivery: EffectiveDeliveryConfiguration;
  onBack: () => void;
  onCollect: (channel: EffectiveDeliveryChannel, merchantCollection: DeliveryMerchantCollection) => void;
};

export function ConfiguredDeliveryCollection({ delivery, onBack, onCollect }: Props) {
  const channels = delivery.channels.filter(executableChannel);
  const [selected, setSelected] = useState<EffectiveDeliveryChannel | null>(null);

  return (
    <div className="delivery-collection-flow" aria-label="تحصيل طلب التوصيل">
      <div className="delivery-collection-head">
        <button type="button" onClick={() => selected ? setSelected(null) : onBack()} aria-label="رجوع">→</button>
        <div>
          <strong>{selected ? selected.name : "توصيل"}</strong>
          <small>{selected ? "كيف استلم المحل المبلغ؟" : "اختر تطبيق أو قناة التوصيل"}</small>
        </div>
      </div>

      {!selected ? (
        <div className="delivery-channel-choice-grid">
          {channels.map((channel) => (
            <button type="button" key={channel.id} className="delivery-channel-choice" onClick={() => setSelected(channel)}>
              <span className={`delivery-channel-mark delivery-channel-mark--${channel.brandKey}`}>{channel.name.slice(0, 2).toUpperCase()}</span>
              <strong>{channel.name}</strong>
              <small>الدفع عند الاستلام</small>
            </button>
          ))}
        </div>
      ) : (
        <div className="delivery-merchant-collection">
          <div className="delivery-collection-context">
            <strong>عند الاستلام</strong>
            <span>المندوب يسدد للمحل عند استلام الطلب، ثم يحصل القيمة من العميل عند التوصيل.</span>
          </div>
          <div className="delivery-collection-actions">
            <button type="button" className="delivery-collection-action" onClick={() => onCollect(selected, "cash")}><strong>نقدي</strong><small>الأثر المباشر: النقد</small></button>
            <button type="button" className="delivery-collection-action" onClick={() => onCollect(selected, "card")}><strong>شبكة</strong><small>الأثر المباشر: البنك</small></button>
          </div>
        </div>
      )}
    </div>
  );
}
