import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BACK_OFFICE_PERMISSION_KEYS,
  type MerchantEmployee,
  type MerchantPaymentType,
  type MerchantPermissionKey,
  type MerchantPosConfiguration,
  type MerchantPosDevice,
  type MerchantRole,
  type MerchantStore,
  type PosConfigurationAdminContract,
} from "../../../contracts/posConfigurationAdmin";
import {
  POS_FEATURE_KEYS,
  POS_PERMISSION_KEYS,
  type PosFeatureKey,
  type PosPaymentAvailability,
  type PosPaymentMethodKind,
} from "../../../contracts/posConfiguration";

type Page = "employees" | "roles" | "features" | "stores" | "devices" | "payments";
type Editor =
  | { kind: "employee"; id: string; name: string; email: string; phone: string; roleId: string; storeIds: string[]; active: boolean; pin: string }
  | { kind: "role"; id: string; name: string; permissions: MerchantPermissionKey[] }
  | { kind: "store"; id: string; name: string; address: string; phone: string; taxRegistrationNumber: string; description: string; active: boolean }
  | { kind: "device"; id: string; name: string; storeId: string; status: MerchantPosDevice["status"] }
  | { kind: "payment"; id: string; name: string; paymentKind: PosPaymentMethodKind; enabled: boolean; availability: PosPaymentAvailability; storeIds: string[] }
  | null;

const commandId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;
const entityId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;

const FEATURE_LABELS: Record<PosFeatureKey, string> = {
  shifts: "الورديات",
  "time-clock": "ساعة الدوام",
  "open-tickets": "التذاكر المفتوحة",
  "restaurant-service": "خدمة المطعم",
  "place-management": "إدارة الأماكن",
  "dining-options": "خيارات تناول الطعام",
  "kitchen-routing": "توجيه المطبخ",
  "customer-display": "شاشة العميل",
};

const POS_PERMISSION_LABELS: Record<(typeof POS_PERMISSION_KEYS)[number], string> = {
  "accept-payment": "قبول الدفع",
  "view-all-receipts": "عرض كل الإيصالات",
  "reprint-resend-receipts": "إعادة طباعة/إرسال الإيصالات",
  "apply-restricted-discounts": "تطبيق الخصومات المقيدة",
  "change-sale-tax": "تغيير الضريبة أثناء البيع",
  "perform-returns": "تنفيذ المرتجعات",
  "manage-all-open-tickets": "إدارة كل التذاكر المفتوحة",
  "void-saved-items": "إلغاء أصناف محفوظة",
  "view-shift-report": "عرض تقرير الوردية",
  "open-cash-drawer-without-sale": "فتح درج النقد دون بيع",
  "manage-pos-items": "إدارة الأصناف من POS",
  "view-item-cost": "عرض تكلفة الصنف",
  "change-device-settings": "تغيير إعدادات الجهاز",
};

const BO_PERMISSION_LABELS: Record<(typeof BACK_OFFICE_PERMISSION_KEYS)[number], string> = {
  "access-back-office": "الدخول إلى المكتب الخلفي",
  "view-sales-reports": "عرض تقارير المبيعات",
  "cancel-receipts": "إلغاء الإيصالات",
  "manage-items": "إدارة الأصناف",
  "manage-inventory": "إدارة المخزون",
  "view-item-cost": "عرض تكلفة الصنف",
  "manage-employees": "إدارة الموظفين",
  "manage-customers": "إدارة العملاء",
  "edit-general-settings": "تعديل الإعدادات العامة",
  "manage-stores": "إدارة الفروع",
  "manage-pos-devices": "إدارة أجهزة POS",
  "manage-payment-types": "إدارة طرق الدفع",
  "manage-loyalty": "إدارة الولاء",
  "manage-taxes": "إدارة الضرائب",
  "manage-kitchen-routing": "إدارة توجيه المطبخ",
  "manage-dining-options": "إدارة خيارات تناول الطعام",
  "manage-billing": "إدارة الفوترة والاشتراك",
};

const paymentKindLabel = (kind: PosPaymentMethodKind) => kind === "cash" ? "نقدي" : kind === "card" ? "بطاقة" : kind === "customer-credit" ? "آجل عميل" : "مخصص";
const availabilityLabel = (availability: PosPaymentAvailability) => availability === "offline-capable" ? "يعمل دون اتصال" : "يتطلب اتصالًا";
const deviceStatusLabel = (status: MerchantPosDevice["status"]) => status === "linked" ? "مرتبط" : status === "pending-link" ? "بانتظار الربط" : "معطل";

const messageFrom = (error: unknown) => error instanceof Error ? error.message : "تعذر حفظ التغيير. حاول مرة أخرى.";

export default function PosOperationalConfigApp({ admin }: { admin: PosConfigurationAdminContract }) {
  const [page, setPage] = useState<Page>("employees");
  const [config, setConfig] = useState<MerchantPosConfiguration | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [editor, setEditor] = useState<Editor>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setConfig(await admin.read());
    } catch (loadError) {
      setError(messageFrom(loadError));
    } finally {
      setLoading(false);
    }
  }, [admin]);

  useEffect(() => { void load(); }, [load]);

  const showFlash = (message: string) => {
    setFlash(message);
    window.setTimeout(() => setFlash((current) => current === message ? null : current), 2200);
  };

  const commit = async (action: () => Promise<MerchantPosConfiguration>, success: string) => {
    setSaving(true);
    setError(null);
    try {
      const next = await action();
      setConfig(next);
      setEditor(null);
      showFlash(success);
    } catch (saveError) {
      setError(messageFrom(saveError));
    } finally {
      setSaving(false);
    }
  };

  const pageTitle = page === "employees" ? "الموظفون" : page === "roles" ? "صلاحيات الوصول" : page === "features" ? "الميزات" : page === "stores" ? "الفروع" : page === "devices" ? "أجهزة POS" : "طرق الدفع";

  const openEmployee = (employee?: MerchantEmployee) => {
    if (!config) return;
    setEditor({
      kind: "employee",
      id: employee?.id ?? entityId("employee"),
      name: employee?.name ?? "",
      email: employee?.email ?? "",
      phone: employee?.phone ?? "",
      roleId: employee?.roleId ?? config.roles.find((role) => !role.ownerRole)?.id ?? config.roles[0]?.id ?? "",
      storeIds: employee?.storeIds ? [...employee.storeIds] : config.stores[0] ? [config.stores[0].id] : [],
      active: employee?.active ?? true,
      pin: "",
    });
  };

  const saveEmployee = async () => {
    if (!editor || editor.kind !== "employee") return;
    setSaving(true);
    setError(null);
    try {
      let next = await admin.saveEmployee({
        commandId: commandId("employee-save"),
        employee: {
          id: editor.id,
          name: editor.name,
          email: editor.email,
          phone: editor.phone,
          roleId: editor.roleId,
          storeIds: editor.storeIds,
          active: editor.active,
        },
      });
      if (editor.pin) {
        next = await admin.setEmployeePin({ commandId: commandId("employee-pin"), employeeId: editor.id, pin: editor.pin });
      }
      setConfig(next);
      setEditor(null);
      showFlash("تم حفظ الموظف");
    } catch (saveError) {
      setError(messageFrom(saveError));
    } finally {
      setSaving(false);
    }
  };

  const openRole = (role?: MerchantRole) => {
    setEditor({ kind: "role", id: role?.id ?? entityId("role"), name: role?.name ?? "", permissions: role ? [...role.permissions] : ["accept-payment"] });
  };

  const openStore = (store?: MerchantStore) => {
    setEditor({
      kind: "store",
      id: store?.id ?? entityId("store"),
      name: store?.name ?? "",
      address: store?.address ?? "",
      phone: store?.phone ?? "",
      taxRegistrationNumber: store?.taxRegistrationNumber ?? "",
      description: store?.description ?? "",
      active: store?.active ?? true,
    });
  };

  const openDevice = (device?: MerchantPosDevice) => {
    if (!config) return;
    setEditor({ kind: "device", id: device?.id ?? entityId("pos-device"), name: device?.name ?? "", storeId: device?.storeId ?? config.stores[0]?.id ?? "", status: device?.status ?? "pending-link" });
  };

  const openPayment = (payment?: MerchantPaymentType) => {
    setEditor({
      kind: "payment",
      id: payment?.id ?? entityId("payment-type"),
      name: payment?.name ?? "",
      paymentKind: payment?.kind ?? "custom",
      enabled: payment?.enabled ?? true,
      availability: payment?.availability ?? "offline-capable",
      storeIds: payment?.storeIds ? [...payment.storeIds] : [],
    });
  };

  const toggleStoreScope = (storeId: string, current: string[], update: (next: string[]) => void) => {
    update(current.includes(storeId) ? current.filter((id) => id !== storeId) : [...current, storeId]);
  };

  const togglePermission = (permission: MerchantPermissionKey) => {
    if (!editor || editor.kind !== "role") return;
    const permissions = editor.permissions.includes(permission)
      ? editor.permissions.filter((value) => value !== permission)
      : [...editor.permissions, permission];
    setEditor({ ...editor, permissions });
  };

  const movePayment = async (id: string, direction: -1 | 1) => {
    if (!config) return;
    const ordered = [...config.paymentTypes].sort((a, b) => a.sortOrder - b.sortOrder);
    const index = ordered.findIndex((payment) => payment.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= ordered.length) return;
    [ordered[index], ordered[target]] = [ordered[target]!, ordered[index]!];
    await commit(
      () => admin.reorderPaymentTypes({ commandId: commandId("payment-reorder"), orderedIds: ordered.map((payment) => payment.id) }),
      "تم تحديث ترتيب طرق الدفع",
    );
  };

  const navButton = (target: Page, label: string) => (
    <button className={`bo-modern-subnav ${page === target ? "is-active" : ""}`} type="button" onClick={() => { setPage(target); setEditor(null); setError(null); }}>{label}</button>
  );

  const renderSidebar = () => (
    <aside className="bo-sidebar bo-sidebar--modern" aria-label="تنقل إعدادات التشغيل">
      <div className="bo-account"><span className="bo-avatar">ر</span><div><strong>رفاد</strong><small>المكتب الخلفي</small></div></div>
      <div className="bo-store-switch bo-store-switch--modern"><span><small>MAP-01</small><strong>إعداد التشغيل والصلاحيات</strong></span></div>
      <nav className="bo-modern-nav-list">
        <div className="bo-modern-nav-section"><div className="bo-modern-nav-title"><strong>الموظفون والوصول</strong></div>
          {navButton("employees", "الموظفون")}
          {navButton("roles", "صلاحيات الوصول")}
        </div>
        <div className="bo-modern-nav-section"><div className="bo-modern-nav-title"><strong>إعداد نقطة البيع</strong></div>
          {navButton("features", "الميزات")}
          {navButton("stores", "الفروع")}
          {navButton("devices", "أجهزة POS")}
          {navButton("payments", "طرق الدفع")}
        </div>
      </nav>
      <div className="bo-sidebar-footer"><span className="bo-avatar bo-avatar--small">م</span><div><strong>سياسة المالك</strong><small>staging محلي — MAP-01</small></div></div>
    </aside>
  );

  const renderEmployees = () => (
    <>
      <div className="bo-page-header bo-page-header--compact"><div><h1>الموظفون</h1><p>الدور والفروع والـPIN تحدد هوية الموظف ونطاق عمله؛ اسم الدور وحده ليس صلاحية.</p></div><button className="bo-primary" type="button" onClick={() => openEmployee()}>إضافة موظف</button></div>
      <section className="bo-card"><div className="bo-table-wrap"><table className="bo-modern-table"><thead><tr><th>الموظف</th><th>الدور</th><th>الفروع</th><th>PIN</th><th>الحالة</th></tr></thead><tbody>
        {(config?.employees ?? []).map((employee) => <tr key={employee.id} onClick={() => openEmployee(employee)} tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter") openEmployee(employee); }}><td><strong>{employee.name}</strong><br/><small>{employee.email || employee.phone || employee.id}</small></td><td>{config?.roles.find((role) => role.id === employee.roleId)?.name ?? "—"}</td><td>{employee.storeIds.map((id) => config?.stores.find((store) => store.id === id)?.name ?? id).join("، ")}</td><td>{employee.pinConfigured ? "مُعد" : "غير مُعد"}</td><td>{employee.active ? "نشط" : "معطل"}</td></tr>)}
      </tbody></table></div></section>
    </>
  );

  const renderRoles = () => (
    <>
      <div className="bo-page-header bo-page-header--compact"><div><h1>صلاحيات الوصول</h1><p>Owner ثابت بكامل السلطة. بقية الأدوار تُدار بقدرات صريحة ويطبق POS الجزء المحلي منها.</p></div><button className="bo-primary" type="button" onClick={() => openRole()}>إضافة دور</button></div>
      <section className="bo-card"><div className="bo-table-wrap"><table className="bo-modern-table"><thead><tr><th>الدور</th><th>عدد الصلاحيات</th><th>النوع</th></tr></thead><tbody>
        {(config?.roles ?? []).map((role) => <tr key={role.id} onClick={() => { if (!role.ownerRole) openRole(role); }} className={role.ownerRole ? "is-disabled" : ""}><td><strong>{role.name}</strong></td><td>{role.permissions.length}</td><td>{role.ownerRole ? "Owner — ثابت" : "قابل للتعديل"}</td></tr>)}
      </tbody></table></div></section>
    </>
  );

  const renderFeatures = () => (
    <>
      <div className="bo-page-header bo-page-header--compact"><div><h1>الميزات</h1><p>هذه مفاتيح سياسة فقط. تفعيل المفتاح لا يعني أن تنفيذ MAP اللاحق أصبح مكتملًا.</p></div></div>
      <section className="bo-card map01-feature-grid">
        {POS_FEATURE_KEYS.map((feature) => <label className="bo-switch-card" key={feature}><input aria-label={FEATURE_LABELS[feature]} type="checkbox" checked={config?.features[feature] ?? false} disabled={!config || saving} onChange={(event) => { const enabled = event.target.checked; void commit(() => admin.setFeature({ commandId: commandId("feature"), feature, enabled }), `تم ${enabled ? "تفعيل" : "إيقاف"} ${FEATURE_LABELS[feature]}`); }} /><span className="bo-switch-ui"/><span><strong>{FEATURE_LABELS[feature]}</strong><small>{feature}</small></span></label>)}
      </section>
    </>
  );

  const renderStores = () => (
    <>
      <div className="bo-page-header bo-page-header--compact"><div><h1>الفروع</h1><p>الفروع تحدد النطاق الذي يُسقط إليه الموظفون والأجهزة وطرق الدفع.</p></div><button className="bo-primary" type="button" onClick={() => openStore()}>إضافة فرع</button></div>
      <section className="bo-card"><div className="bo-table-wrap"><table className="bo-modern-table"><thead><tr><th>الفرع</th><th>العنوان</th><th>الهاتف</th><th>الحالة</th></tr></thead><tbody>{(config?.stores ?? []).map((store) => <tr key={store.id} onClick={() => openStore(store)}><td><strong>{store.name}</strong></td><td>{store.address || "—"}</td><td dir="ltr">{store.phone || "—"}</td><td>{store.active ? "نشط" : "معطل"}</td></tr>)}</tbody></table></div></section>
    </>
  );

  const renderDevices = () => (
    <>
      <div className="bo-page-header bo-page-header--compact"><div><h1>أجهزة POS</h1><p>كل جهاز له هوية ثابتة وفرع واحد. الربط الفعلي مع الجهاز يبقى مسارًا منفصلًا.</p></div><button className="bo-primary" type="button" onClick={() => openDevice()}>إضافة جهاز</button></div>
      <section className="bo-card"><div className="bo-table-wrap"><table className="bo-modern-table"><thead><tr><th>الجهاز</th><th>الفرع</th><th>الحالة</th></tr></thead><tbody>{(config?.devices ?? []).map((device) => <tr key={device.id} onClick={() => openDevice(device)}><td><strong>{device.name}</strong></td><td>{config?.stores.find((store) => store.id === device.storeId)?.name ?? device.storeId}</td><td>{deviceStatusLabel(device.status)}</td></tr>)}</tbody></table></div></section>
    </>
  );

  const orderedPayments = useMemo(() => [...(config?.paymentTypes ?? [])].sort((a, b) => a.sortOrder - b.sortOrder), [config]);

  const renderPayments = () => (
    <>
      <div className="bo-page-header bo-page-header--compact"><div><h1>طرق الدفع</h1><p>التعريف والترتيب من Back Office؛ إعداد الطرفية المدمجة نفسها ليس ضمن MAP-01.</p></div><button className="bo-primary" type="button" onClick={() => openPayment()}>إضافة طريقة</button></div>
      <section className="bo-card"><div className="bo-table-wrap"><table className="bo-modern-table"><thead><tr><th>الترتيب</th><th>الطريقة</th><th>النوع</th><th>التوافر</th><th>الفروع</th><th>الحالة</th></tr></thead><tbody>{orderedPayments.map((payment, index) => <tr key={payment.id}><td><div className="map01-order-buttons"><button type="button" disabled={index === 0 || saving} onClick={() => void movePayment(payment.id, -1)} aria-label={`رفع ${payment.name}`}>↑</button><button type="button" disabled={index === orderedPayments.length - 1 || saving} onClick={() => void movePayment(payment.id, 1)} aria-label={`خفض ${payment.name}`}>↓</button></div></td><td><button className="map01-row-link" type="button" onClick={() => openPayment(payment)}>{payment.name}</button></td><td>{paymentKindLabel(payment.kind)}</td><td>{availabilityLabel(payment.availability)}</td><td>{payment.storeIds.length ? payment.storeIds.map((id) => config?.stores.find((store) => store.id === id)?.name ?? id).join("، ") : "كل الفروع"}</td><td>{payment.enabled ? "مفعلة" : "متوقفة"}</td></tr>)}</tbody></table></div></section>
    </>
  );

  const renderEmployeeEditor = () => {
    if (!editor || editor.kind !== "employee" || !config) return null;
    return <div className="bo-modal-backdrop"><div className="bo-modal bo-modal--wide map01-editor" role="dialog" aria-label="تحرير الموظف"><h2>{config.employees.some((employee) => employee.id === editor.id) ? "تعديل الموظف" : "موظف جديد"}</h2><div className="bo-form-grid bo-form-grid--modern">
      <label className="bo-field"><span>الاسم</span><input aria-label="اسم الموظف" value={editor.name} onChange={(event) => setEditor({ ...editor, name: event.target.value })}/></label>
      <label className="bo-field"><span>الدور</span><select aria-label="دور الموظف" value={editor.roleId} onChange={(event) => setEditor({ ...editor, roleId: event.target.value })}>{config.roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select></label>
      <label className="bo-field"><span>البريد</span><input aria-label="بريد الموظف" dir="ltr" value={editor.email} onChange={(event) => setEditor({ ...editor, email: event.target.value })}/></label>
      <label className="bo-field"><span>الهاتف</span><input aria-label="هاتف الموظف" dir="ltr" value={editor.phone} onChange={(event) => setEditor({ ...editor, phone: event.target.value })}/></label>
      <label className="bo-field"><span>PIN جديد/تعيين PIN</span><input aria-label="PIN الموظف" inputMode="numeric" maxLength={4} value={editor.pin} onChange={(event) => setEditor({ ...editor, pin: event.target.value.replace(/\D/g, "").slice(0, 4) })} placeholder="4 أرقام"/></label>
      <label className="bo-switch-card"><input aria-label="الموظف نشط" type="checkbox" checked={editor.active} onChange={(event) => setEditor({ ...editor, active: event.target.checked })}/><span className="bo-switch-ui"/><span><strong>نشط</strong><small>الموظف المعطل لا يُسمح له بالعمل.</small></span></label>
    </div><div className="map01-scope"><strong>الفروع المسموحة</strong>{config.stores.map((store) => <label key={store.id}><input type="checkbox" aria-label={`فرع ${store.name}`} checked={editor.storeIds.includes(store.id)} onChange={() => toggleStoreScope(store.id, editor.storeIds, (storeIds) => setEditor({ ...editor, storeIds }))}/><span>{store.name}</span></label>)}</div>{error ? <div className="bo-alert" role="alert">{error}</div> : null}<div className="bo-modal-actions"><button className="bo-secondary" type="button" onClick={() => setEditor(null)}>إلغاء</button><button className="bo-primary" type="button" disabled={saving} onClick={() => void saveEmployee()}>{saving ? "جارٍ الحفظ…" : "حفظ الموظف"}</button></div></div></div>;
  };

  const renderRoleEditor = () => {
    if (!editor || editor.kind !== "role") return null;
    return <div className="bo-modal-backdrop"><div className="bo-modal bo-modal--wide map01-editor map01-role-editor" role="dialog" aria-label="تحرير الدور"><h2>الدور والصلاحيات</h2><label className="bo-field"><span>اسم الدور</span><input aria-label="اسم الدور" value={editor.name} onChange={(event) => setEditor({ ...editor, name: event.target.value })}/></label><div className="map01-permission-columns"><section><h3>صلاحيات POS</h3>{POS_PERMISSION_KEYS.map((permission) => <label key={permission}><input type="checkbox" aria-label={POS_PERMISSION_LABELS[permission]} checked={editor.permissions.includes(permission)} onChange={() => togglePermission(permission)}/><span>{POS_PERMISSION_LABELS[permission]}</span></label>)}</section><section><h3>صلاحيات Back Office</h3>{BACK_OFFICE_PERMISSION_KEYS.map((permission) => <label key={permission}><input type="checkbox" aria-label={BO_PERMISSION_LABELS[permission]} checked={editor.permissions.includes(permission)} onChange={() => togglePermission(permission)}/><span>{BO_PERMISSION_LABELS[permission]}</span></label>)}</section></div>{error ? <div className="bo-alert" role="alert">{error}</div> : null}<div className="bo-modal-actions"><button className="bo-secondary" type="button" onClick={() => setEditor(null)}>إلغاء</button><button className="bo-primary" type="button" disabled={saving} onClick={() => void commit(() => admin.saveRole({ commandId: commandId("role-save"), role: { id: editor.id, name: editor.name, permissions: editor.permissions } }), "تم حفظ الدور")}>حفظ الدور</button></div></div></div>;
  };

  const renderStoreEditor = () => {
    if (!editor || editor.kind !== "store") return null;
    return <div className="bo-modal-backdrop"><div className="bo-modal bo-modal--wide map01-editor" role="dialog" aria-label="تحرير الفرع"><h2>بيانات الفرع</h2><div className="bo-form-grid bo-form-grid--modern"><label className="bo-field"><span>اسم الفرع</span><input aria-label="اسم الفرع" value={editor.name} onChange={(event) => setEditor({ ...editor, name: event.target.value })}/></label><label className="bo-field"><span>الهاتف</span><input aria-label="هاتف الفرع" dir="ltr" value={editor.phone} onChange={(event) => setEditor({ ...editor, phone: event.target.value })}/></label><label className="bo-field bo-field--wide"><span>العنوان</span><input aria-label="عنوان الفرع" value={editor.address} onChange={(event) => setEditor({ ...editor, address: event.target.value })}/></label><label className="bo-field"><span>الرقم الضريبي</span><input aria-label="الرقم الضريبي" dir="ltr" value={editor.taxRegistrationNumber} onChange={(event) => setEditor({ ...editor, taxRegistrationNumber: event.target.value })}/></label><label className="bo-field bo-field--wide"><span>وصف</span><textarea aria-label="وصف الفرع" value={editor.description} onChange={(event) => setEditor({ ...editor, description: event.target.value })}/></label><label className="bo-switch-card"><input aria-label="الفرع نشط" type="checkbox" checked={editor.active} onChange={(event) => setEditor({ ...editor, active: event.target.checked })}/><span className="bo-switch-ui"/><span><strong>نشط</strong></span></label></div>{error ? <div className="bo-alert" role="alert">{error}</div> : null}<div className="bo-modal-actions"><button className="bo-secondary" type="button" onClick={() => setEditor(null)}>إلغاء</button><button className="bo-primary" type="button" disabled={saving} onClick={() => void commit(() => admin.saveStore({ commandId: commandId("store-save"), store: { id: editor.id, name: editor.name, address: editor.address, phone: editor.phone, taxRegistrationNumber: editor.taxRegistrationNumber, description: editor.description, active: editor.active } }), "تم حفظ الفرع")}>حفظ الفرع</button></div></div></div>;
  };

  const renderDeviceEditor = () => {
    if (!editor || editor.kind !== "device" || !config) return null;
    return <div className="bo-modal-backdrop"><div className="bo-modal map01-editor" role="dialog" aria-label="تحرير جهاز POS"><h2>جهاز POS</h2><label className="bo-field"><span>اسم الجهاز</span><input aria-label="اسم جهاز POS" value={editor.name} onChange={(event) => setEditor({ ...editor, name: event.target.value })}/></label><label className="bo-field"><span>الفرع</span><select aria-label="فرع جهاز POS" value={editor.storeId} onChange={(event) => setEditor({ ...editor, storeId: event.target.value })}>{config.stores.map((store) => <option key={store.id} value={store.id}>{store.name}</option>)}</select></label><label className="bo-field"><span>الحالة</span><select aria-label="حالة جهاز POS" value={editor.status} onChange={(event) => setEditor({ ...editor, status: event.target.value as MerchantPosDevice["status"] })}><option value="pending-link">بانتظار الربط</option><option value="linked">مرتبط</option><option value="disabled">معطل</option></select></label>{error ? <div className="bo-alert" role="alert">{error}</div> : null}<div className="bo-modal-actions"><button className="bo-secondary" type="button" onClick={() => setEditor(null)}>إلغاء</button><button className="bo-primary" type="button" disabled={saving} onClick={() => void commit(() => admin.saveDevice({ commandId: commandId("device-save"), device: { id: editor.id, name: editor.name, storeId: editor.storeId, status: editor.status } }), "تم حفظ جهاز POS")}>حفظ الجهاز</button></div></div></div>;
  };

  const renderPaymentEditor = () => {
    if (!editor || editor.kind !== "payment" || !config) return null;
    return <div className="bo-modal-backdrop"><div className="bo-modal bo-modal--wide map01-editor" role="dialog" aria-label="تحرير طريقة الدفع"><h2>طريقة الدفع</h2><div className="bo-form-grid bo-form-grid--modern"><label className="bo-field"><span>الاسم</span><input aria-label="اسم طريقة الدفع" value={editor.name} onChange={(event) => setEditor({ ...editor, name: event.target.value })}/></label><label className="bo-field"><span>النوع</span><select aria-label="نوع طريقة الدفع" value={editor.paymentKind} onChange={(event) => setEditor({ ...editor, paymentKind: event.target.value as PosPaymentMethodKind })}><option value="cash">نقدي</option><option value="card">بطاقة</option><option value="customer-credit">آجل عميل</option><option value="custom">مخصص</option></select></label><label className="bo-field"><span>التوافر</span><select aria-label="توافر طريقة الدفع" value={editor.availability} onChange={(event) => setEditor({ ...editor, availability: event.target.value as PosPaymentAvailability })}><option value="offline-capable">يعمل دون اتصال</option><option value="online-required">يتطلب اتصالًا</option></select></label><label className="bo-switch-card"><input aria-label="طريقة الدفع مفعلة" type="checkbox" checked={editor.enabled} onChange={(event) => setEditor({ ...editor, enabled: event.target.checked })}/><span className="bo-switch-ui"/><span><strong>مفعلة</strong></span></label></div><div className="map01-scope"><strong>نطاق الفروع</strong><small>عدم اختيار فرع يعني كل الفروع.</small>{config.stores.map((store) => <label key={store.id}><input type="checkbox" aria-label={`طريقة الدفع في ${store.name}`} checked={editor.storeIds.includes(store.id)} onChange={() => toggleStoreScope(store.id, editor.storeIds, (storeIds) => setEditor({ ...editor, storeIds }))}/><span>{store.name}</span></label>)}</div>{error ? <div className="bo-alert" role="alert">{error}</div> : null}<div className="bo-modal-actions"><button className="bo-secondary" type="button" onClick={() => setEditor(null)}>إلغاء</button><button className="bo-primary" type="button" disabled={saving} onClick={() => void commit(() => admin.savePaymentType({ commandId: commandId("payment-save"), paymentType: { id: editor.id, name: editor.name, kind: editor.paymentKind, enabled: editor.enabled, availability: editor.availability, storeIds: editor.storeIds } }), "تم حفظ طريقة الدفع")}>حفظ الطريقة</button></div></div></div>;
  };

  return (
    <div className="bo-shell map01-shell" dir="rtl">
      {renderSidebar()}
      <main className="bo-main">
        <div className="bo-topbar"><div className="bo-topbar-title"><strong>{pageTitle}</strong><span>{config ? `إصدار الإعداد ${config.revision}` : "MAP-01"}</span></div><span className="bo-top-status">إعداد محلي فعال</span></div>
        <div className="bo-content">{loading ? <div className="bo-card map01-loading">جاري تحميل إعداد التشغيل…</div> : error && !config ? <div className="bo-alert" role="alert">{error}</div> : page === "employees" ? renderEmployees() : page === "roles" ? renderRoles() : page === "features" ? renderFeatures() : page === "stores" ? renderStores() : page === "devices" ? renderDevices() : renderPayments()}</div>
      </main>
      {renderEmployeeEditor()}{renderRoleEditor()}{renderStoreEditor()}{renderDeviceEditor()}{renderPaymentEditor()}
      {flash ? <div className="bo-toast" role="status">✓ {flash}</div> : null}
    </div>
  );
}
