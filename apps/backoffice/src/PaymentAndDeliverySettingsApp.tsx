import { useEffect, useMemo, useState } from "react";
import type {
  PosPaymentDirectImpact,
  PosPaymentMethodKind,
} from "../../../contracts/posConfiguration";
import type {
  MerchantDeliveryChannel,
  MerchantDeliveryConfiguration,
  MerchantPaymentType,
  MerchantPosConfiguration,
  PosConfigurationAdminContract,
} from "../../../contracts/posConfigurationAdmin";
import { createDefaultDeliveryConfiguration } from "../../../adapters/posConfiguration/browserPosConfigurationAdmin";

type PaymentEditor = {
  id?: string;
  name: string;
  kind: PosPaymentMethodKind;
  directImpact: PosPaymentDirectImpact;
  enabled: boolean;
};

type ChannelEditor = {
  name: string;
};

const commandId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;

const impactForKind = (kind: PosPaymentMethodKind): PosPaymentDirectImpact => {
  if (kind === "cash") return "cash";
  if (kind === "card") return "bank";
  if (kind === "customer-credit") return "customer-receivable";
  return "bank";
};

const impactLabel = (impact: PosPaymentDirectImpact) => {
  if (impact === "cash") return "النقد";
  if (impact === "bank") return "البنك";
  if (impact === "customer-receivable") return "ذمة العميل";
  return "منصة خارجية";
};

const kindLabel = (kind: PosPaymentMethodKind) => {
  if (kind === "cash") return "نقدي";
  if (kind === "card") return "شبكة / بطاقة";
  if (kind === "customer-credit") return "آجل";
  return "مخصص";
};

const toSarInput = (halalas: number) => (halalas / 100).toFixed(2);
const toHalalas = (value: string) => Math.max(0, Math.round(Number(value || 0) * 100));

export default function PaymentAndDeliverySettingsApp({ admin }: { admin: PosConfigurationAdminContract }) {
  const [config, setConfig] = useState<MerchantPosConfiguration | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [paymentEditor, setPaymentEditor] = useState<PaymentEditor | null>(null);
  const [channelEditor, setChannelEditor] = useState<ChannelEditor | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setConfig(await admin.read());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "تعذر تحميل إعدادات الدفع.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [admin]);

  const showFlash = (message: string) => {
    setFlash(message);
    window.setTimeout(() => setFlash((current) => current === message ? null : current), 2200);
  };

  const delivery: MerchantDeliveryConfiguration = config?.delivery ?? createDefaultDeliveryConfiguration();
  const orderedPayments = useMemo(
    () => [...(config?.paymentTypes ?? [])].sort((a, b) => a.sortOrder - b.sortOrder),
    [config],
  );

  const savePayment = async (draft: PaymentEditor) => {
    if (!config || !draft.name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const existing = draft.id ? config.paymentTypes.find((item) => item.id === draft.id) : undefined;
      const next = await admin.savePaymentType({
        commandId: commandId("payment-save"),
        paymentType: {
          id: draft.id,
          name: draft.name,
          kind: draft.kind,
          directImpact: draft.directImpact,
          enabled: draft.enabled,
          availability: existing?.availability ?? "offline-capable",
          storeIds: existing?.storeIds ?? [],
          systemDefault: existing?.systemDefault ?? null,
        },
      });
      setConfig(next);
      setPaymentEditor(null);
      showFlash("تم حفظ طريقة الدفع");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "تعذر حفظ طريقة الدفع.");
    } finally {
      setSaving(false);
    }
  };

  const togglePayment = async (payment: MerchantPaymentType) => {
    await savePayment({
      id: payment.id,
      name: payment.name,
      kind: payment.kind,
      directImpact: payment.directImpact ?? impactForKind(payment.kind),
      enabled: !payment.enabled,
    });
  };

  const movePayment = async (paymentId: string, direction: -1 | 1) => {
    if (!config) return;
    const ordered = [...orderedPayments];
    const index = ordered.findIndex((payment) => payment.id === paymentId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= ordered.length) return;
    [ordered[index], ordered[target]] = [ordered[target]!, ordered[index]!];
    setSaving(true);
    try {
      const next = await admin.reorderPaymentTypes({
        commandId: commandId("payment-reorder"),
        orderedIds: ordered.map((payment) => payment.id),
      });
      setConfig(next);
      showFlash("تم تحديث ترتيب طرق الدفع");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "تعذر تغيير الترتيب.");
    } finally {
      setSaving(false);
    }
  };

  const saveDelivery = async (nextDelivery: MerchantDeliveryConfiguration, success = "تم حفظ إعدادات التوصيل") => {
    if (!admin.saveDeliveryConfiguration) {
      setError("محول إعدادات التوصيل غير متاح في هذا التشغيل.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const next = await admin.saveDeliveryConfiguration({
        commandId: commandId("delivery-save"),
        delivery: nextDelivery,
      });
      setConfig(next);
      showFlash(success);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "تعذر حفظ إعدادات التوصيل.");
    } finally {
      setSaving(false);
    }
  };

  const updateChannel = (channelId: string, patch: Partial<MerchantDeliveryChannel>) => {
    const channels = delivery.channels.map((channel) => channel.id === channelId ? { ...channel, ...patch } : channel);
    void saveDelivery({ ...delivery, channels });
  };

  const addCustomChannel = async () => {
    if (!channelEditor?.name.trim()) return;
    const channel: MerchantDeliveryChannel = {
      id: `delivery-custom-${crypto.randomUUID()}`,
      name: channelEditor.name.trim(),
      kind: "custom",
      brandKey: "custom",
      enabled: true,
      electronicPaymentEnabled: true,
      cashOnDeliveryEnabled: true,
      codSettlement: "courier-pays-merchant",
      storeIds: [],
      selfDelivery: null,
    };
    await saveDelivery({ ...delivery, enabled: true, channels: [...delivery.channels, channel] }, "تمت إضافة قناة التوصيل");
    setChannelEditor(null);
  };

  if (loading) return <div className="payment-config-loading">جاري تحميل إعدادات الدفع والتوصيل…</div>;
  if (!config) return <div className="bo-alert" role="alert">{error ?? "تعذر تحميل الإعدادات."}</div>;

  return (
    <div className="payment-config-workspace" dir="rtl">
      <header className="payment-config-header">
        <div>
          <span>إعداد المنشأة · إصدار {config.revision}</span>
          <h1>الدفع والتوصيل</h1>
          <p>طريقة الدفع تحدد كيف أصبح حق المنشأة مباشرة، بينما قناة التوصيل تحدد مصدر/سياق الطلب.</p>
        </div>
        <button type="button" className="bo-primary" onClick={() => setPaymentEditor({ name: "", kind: "custom", directImpact: "bank", enabled: true })}>إضافة طريقة دفع</button>
      </header>

      {error ? <div className="bo-alert" role="alert">{error}</div> : null}

      <section className="payment-config-card">
        <div className="payment-config-section-title">
          <div><h2>طرق الدفع</h2><p>الافتراضي عند أول إعداد: نقدي، شبكة / مدى، وآجل. يمكن إخفاؤها وإعادة إظهارها دون تغيير معناها التاريخي.</p></div>
        </div>
        <div className="payment-config-table-wrap">
          <table className="payment-config-table">
            <thead><tr><th>الترتيب</th><th>الطريقة</th><th>النوع</th><th>الأثر المباشر</th><th>الحالة</th><th /></tr></thead>
            <tbody>
              {orderedPayments.map((payment, index) => (
                <tr key={payment.id}>
                  <td><div className="payment-order"><button type="button" disabled={index === 0 || saving} onClick={() => void movePayment(payment.id, -1)}>↑</button><button type="button" disabled={index === orderedPayments.length - 1 || saving} onClick={() => void movePayment(payment.id, 1)}>↓</button></div></td>
                  <td><strong>{payment.name}</strong>{payment.systemDefault ? <small>افتراضية · {payment.systemDefault === "cash" ? "نقدي" : payment.systemDefault === "network" ? "شبكة" : "آجل"}</small> : <small>مضافة من التاجر</small>}</td>
                  <td>{kindLabel(payment.kind)}</td>
                  <td><span className={`payment-impact payment-impact--${payment.directImpact ?? impactForKind(payment.kind)}`}>{impactLabel(payment.directImpact ?? impactForKind(payment.kind))}</span></td>
                  <td><button type="button" className={`payment-toggle ${payment.enabled ? "is-on" : ""}`} disabled={saving} onClick={() => void togglePayment(payment)}>{payment.enabled ? "ظاهرة" : "مخفية"}</button></td>
                  <td><button type="button" className="payment-edit" onClick={() => setPaymentEditor({ id: payment.id, name: payment.name, kind: payment.kind, directImpact: payment.directImpact ?? impactForKind(payment.kind), enabled: payment.enabled })}>تعديل</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="payment-config-card">
        <div className="payment-config-section-title payment-config-section-title--switch">
          <div><h2>قنوات التوصيل</h2><p>تظهر في POS لاحقًا تحت زر واحد «توصيل» بدل ملء صف الدفع بأسماء التطبيقات.</p></div>
          <label className="payment-master-switch"><input type="checkbox" checked={delivery.enabled} disabled={saving} onChange={(event) => void saveDelivery({ ...delivery, enabled: event.target.checked })}/><span>{delivery.enabled ? "مفعلة" : "غير مفعلة"}</span></label>
        </div>

        <div className="delivery-channel-grid">
          {delivery.channels.map((channel) => (
            <article className={`delivery-channel-card ${channel.enabled ? "is-enabled" : ""}`} key={channel.id}>
              <div className="delivery-channel-head">
                <div className={`delivery-brand delivery-brand--${channel.brandKey}`}>{channel.kind === "self-delivery" ? "🚚" : channel.name.slice(0, 2).toUpperCase()}</div>
                <div><strong>{channel.name}</strong><small>{channel.kind === "self-delivery" ? "توصيل المنشأة" : "تطبيق / منصة توصيل"}</small></div>
                <label><input type="checkbox" checked={channel.enabled} disabled={saving} onChange={(event) => updateChannel(channel.id, { enabled: event.target.checked })}/><span>{channel.enabled ? "مفعل" : "مخفي"}</span></label>
              </div>

              {channel.kind !== "self-delivery" ? (
                <div className="delivery-channel-options">
                  <label><input type="checkbox" checked={channel.electronicPaymentEnabled} onChange={(event) => updateChannel(channel.id, { electronicPaymentEnabled: event.target.checked })}/><span>دفع إلكتروني عبر التطبيق</span></label>
                  <label><input type="checkbox" checked={channel.cashOnDeliveryEnabled} onChange={(event) => updateChannel(channel.id, { cashOnDeliveryEnabled: event.target.checked })}/><span>الدفع عند الاستلام</span></label>
                  {channel.cashOnDeliveryEnabled ? (
                    <label className="delivery-select"><span>عند الاستلام</span><select value={channel.codSettlement} onChange={(event) => updateChannel(channel.id, { codSettlement: event.target.value as MerchantDeliveryChannel["codSettlement"] })}><option value="courier-pays-merchant">المندوب يسدد للمحل (نقدي أو شبكة)</option><option value="platform-settlement">المنصة تسوي المبلغ لاحقًا</option></select></label>
                  ) : null}
                </div>
              ) : channel.selfDelivery ? (
                <div className="delivery-channel-options">
                  <label className="delivery-field"><span>رسوم افتراضية</span><input type="number" min="0" step="0.01" value={toSarInput(channel.selfDelivery.defaultFeeHalalas)} onChange={(event) => updateChannel(channel.id, { selfDelivery: { ...channel.selfDelivery!, defaultFeeHalalas: toHalalas(event.target.value) } })}/><small>ر.س</small></label>
                  <label><input type="checkbox" checked={channel.selfDelivery.allowPosFeeOverride} onChange={(event) => updateChannel(channel.id, { selfDelivery: { ...channel.selfDelivery!, allowPosFeeOverride: event.target.checked } })}/><span>السماح بتعديل رسوم التوصيل من POS</span></label>
                  <label className="delivery-select"><span>رسوم التوصيل محسوبة لـ</span><select value={channel.selfDelivery.feeBeneficiary} onChange={(event) => updateChannel(channel.id, { selfDelivery: { ...channel.selfDelivery!, feeBeneficiary: event.target.value as "merchant" | "courier" } })}><option value="merchant">المحل</option><option value="courier">المندوب / جهة التوصيل</option></select></label>
                </div>
              ) : null}
            </article>
          ))}
        </div>

        <div className="delivery-add-row">
          {channelEditor ? <><input aria-label="اسم قناة التوصيل الجديدة" value={channelEditor.name} onChange={(event) => setChannelEditor({ name: event.target.value })} placeholder="اسم التطبيق أو جهة التوصيل"/><button className="bo-primary" type="button" onClick={() => void addCustomChannel()} disabled={saving || !channelEditor.name.trim()}>حفظ القناة</button><button className="bo-secondary" type="button" onClick={() => setChannelEditor(null)}>إلغاء</button></> : <button className="bo-secondary" type="button" onClick={() => setChannelEditor({ name: "" })}>+ إضافة قناة توصيل مخصصة</button>}
        </div>
      </section>

      <aside className="payment-scope-note">
        <strong>حد التنفيذ الحالي</strong>
        <p>تعريف الطرق، أثرها المباشر، ترتيبها، إخفاؤها وقنوات التوصيل أصبح جزءًا من MAP-01. تقسيم فاتورة واحدة على عدة دفعات، تسوية المنصات وإضافة رسوم التوصيل فعليًا إلى حساب الفاتورة تبقى ضمن دورة الدفع/التسوية اللاحقة حتى لا نسجل أرقامًا مالية غير صحيحة.</p>
      </aside>

      {paymentEditor ? (
        <div className="payment-editor-backdrop" role="presentation">
          <section className="payment-editor-dialog" role="dialog" aria-modal="true" aria-label="تحرير طريقة الدفع">
            <header><h2>{paymentEditor.id ? "تعديل طريقة الدفع" : "طريقة دفع جديدة"}</h2><button type="button" onClick={() => setPaymentEditor(null)}>×</button></header>
            <label><span>الاسم</span><input aria-label="اسم طريقة الدفع" value={paymentEditor.name} onChange={(event) => setPaymentEditor({ ...paymentEditor, name: event.target.value })}/></label>
            <label><span>النوع التشغيلي</span><select aria-label="نوع طريقة الدفع" value={paymentEditor.kind} onChange={(event) => { const kind = event.target.value as PosPaymentMethodKind; setPaymentEditor({ ...paymentEditor, kind, directImpact: impactForKind(kind) }); }}><option value="cash">نقدي</option><option value="card">شبكة / بطاقة</option><option value="customer-credit">آجل</option><option value="custom">مخصص</option></select></label>
            <label><span>الأثر المباشر</span><select aria-label="الأثر المباشر" value={paymentEditor.directImpact} onChange={(event) => setPaymentEditor({ ...paymentEditor, directImpact: event.target.value as PosPaymentDirectImpact })}><option value="cash">النقد</option><option value="bank">البنك</option><option value="customer-receivable">ذمة العميل</option><option value="external-platform">منصة خارجية</option></select></label>
            <label className="payment-editor-switch"><input type="checkbox" checked={paymentEditor.enabled} onChange={(event) => setPaymentEditor({ ...paymentEditor, enabled: event.target.checked })}/><span>إظهار في POS</span></label>
            <footer><button type="button" className="bo-secondary" onClick={() => setPaymentEditor(null)}>إلغاء</button><button type="button" className="bo-primary" disabled={saving || !paymentEditor.name.trim()} onClick={() => void savePayment(paymentEditor)}>حفظ</button></footer>
          </section>
        </div>
      ) : null}

      {flash ? <div className="bo-toast" role="status">✓ {flash}</div> : null}
    </div>
  );
}
