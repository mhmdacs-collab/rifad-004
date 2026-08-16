import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type { LoyaltyRedemptionQuote, LoyaltyStatus } from "../domain/loyalty";
import { formatMoneyAmount } from "../domain/money";
import type { Customer, CustomerDetails, CustomerReference, Money, Receipt } from "../domain/models";
import { MoneyAmount } from "./MoneyAmount";

export type CustomerPickerPurpose = "attach" | "credit";
type CustomerView = "picker" | "profile" | "edit" | "history" | "redeem";

type CustomerPickerDialogProps = {
  purpose: CustomerPickerPurpose;
  ticketTotal: Money;
  ticketSubtotal: Money;
  loyaltyRedemption: Money;
  attachedCustomer: CustomerReference | null;
  busy: boolean;
  onClose: () => void;
  onSearch: (query: string) => Promise<readonly Customer[]>;
  onCreateCustomer: (name: string, mobile: string, details: CustomerDetails) => Promise<Customer | null>;
  onUpdateCustomer: (customerId: string, name: string, mobile: string, details: CustomerDetails) => Promise<Customer | null>;
  onAttachCustomer: (customerId: string | null) => Promise<boolean>;
  onChargeCredit: (customerId: string) => Promise<Customer | null>;
  onLoadLoyaltyStatus: (customerId: string) => Promise<LoyaltyStatus | null>;
  onQuoteLoyaltyRedemption: (customerId: string, ticketTotalHalalas: number) => Promise<LoyaltyRedemptionQuote | null>;
  onApplyLoyaltyRedemption: (amountHalalas: number) => Promise<boolean>;
  onLoadPurchases: (customerId: string) => Promise<readonly Receipt[]>;
};

const EMPTY_DETAILS: CustomerDetails = {
  email: "",
  address: "",
  city: "",
  region: "",
  postalCode: "",
  country: "",
  customerCode: "",
  note: "",
};

const dateFormatter = new Intl.DateTimeFormat("ar-SA-u-nu-latn", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const detailAddress = (details: CustomerDetails) =>
  [details.address, details.city, details.region, details.postalCode, details.country].filter(Boolean).join("، ");

const digitsToHalalas = (digits: string) => {
  const value = Number(digits || "0");
  return Number.isSafeInteger(value) ? value : 0;
};

export function CustomerPickerDialog({
  purpose,
  ticketTotal,
  ticketSubtotal,
  loyaltyRedemption,
  attachedCustomer,
  busy,
  onClose,
  onSearch,
  onCreateCustomer,
  onUpdateCustomer,
  onAttachCustomer,
  onChargeCredit,
  onLoadLoyaltyStatus,
  onQuoteLoyaltyRedemption,
  onApplyLoyaltyRedemption,
  onLoadPurchases,
}: CustomerPickerDialogProps) {
  const [view, setView] = useState<CustomerView>(purpose === "attach" && attachedCustomer ? "profile" : "picker");
  const [query, setQuery] = useState(attachedCustomer?.mobile ?? "");
  const [results, setResults] = useState<readonly Customer[]>([]);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [searching, setSearching] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [extraOpen, setExtraOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newMobile, setNewMobile] = useState("");
  const [newDetails, setNewDetails] = useState<CustomerDetails>(EMPTY_DETAILS);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loyaltyStatus, setLoyaltyStatus] = useState<LoyaltyStatus | null>(null);
  const [purchases, setPurchases] = useState<readonly Receipt[]>([]);
  const [profileLoading, setProfileLoading] = useState(Boolean(attachedCustomer && purpose === "attach"));
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [historyQuery, setHistoryQuery] = useState("");
  const [redeemDigits, setRedeemDigits] = useState(loyaltyRedemption.halalas > 0 ? String(loyaltyRedemption.halalas) : "");
  const [redemptionQuote, setRedemptionQuote] = useState<LoyaltyRedemptionQuote | null>(null);
  const [editName, setEditName] = useState("");
  const [editMobile, setEditMobile] = useState("");
  const [editDetails, setEditDetails] = useState<CustomerDetails>(EMPTY_DETAILS);
  const searchSequence = useRef(0);
  const profileSequence = useRef(0);
  const actionLocked = useRef(false);

  const loadProfile = async (customer: Customer) => {
    const sequence = ++profileSequence.current;
    setProfileLoading(true);
    const [loyalty, history] = await Promise.all([
      onLoadLoyaltyStatus(customer.id),
      onLoadPurchases(customer.id),
    ]);
    if (sequence !== profileSequence.current) return;
    setSelected(customer);
    setLoyaltyStatus(loyalty);
    setPurchases(history);
    setProfileLoading(false);
  };

  useEffect(() => {
    if (view !== "picker") return;
    const sequence = ++searchSequence.current;
    setSearching(true);
    setMessage(null);
    void onSearch(query)
      .then((items) => {
        if (sequence !== searchSequence.current) return;
        setResults(items);
        if (attachedCustomer && !selected) {
          setSelected(items.find((customer) => customer.id === attachedCustomer.id) ?? null);
        }
      })
      .finally(() => {
        if (sequence === searchSequence.current) setSearching(false);
      });
  }, [attachedCustomer, onSearch, query, selected, view]);

  useEffect(() => {
    if (purpose !== "attach" || !attachedCustomer || view !== "profile" || selected?.id === attachedCustomer.id) return;
    let active = true;
    setProfileLoading(true);
    void onSearch(attachedCustomer.mobile).then((items) => {
      if (!active) return;
      const customer = items.find((item) => item.id === attachedCustomer.id);
      if (customer) void loadProfile(customer);
      else setProfileLoading(false);
    });
    return () => { active = false; };
  }, [attachedCustomer, onSearch, purpose, selected?.id, view]);

  useEffect(() => {
    if (view !== "redeem" || !selected) return;
    void onQuoteLoyaltyRedemption(selected.id, ticketSubtotal.halalas).then(setRedemptionQuote);
  }, [onQuoteLoyaltyRedemption, selected, ticketSubtotal.halalas, view]);

  const updateNewDetail = (key: keyof CustomerDetails, value: string) => {
    setNewDetails((current) => ({ ...current, [key]: value }));
  };

  const updateEditDetail = (key: keyof CustomerDetails, value: string) => {
    setEditDetails((current) => ({ ...current, [key]: value }));
  };

  const resetCreate = () => {
    setCreateOpen(false);
    setExtraOpen(false);
    setNewName("");
    setNewMobile("");
    setNewDetails(EMPTY_DETAILS);
  };

  const selectCustomer = (customer: Customer) => {
    if (actionLocked.current) return;
    setSelected(customer);
    resetCreate();
    setMessage(null);
  };

  const submitCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (actionLocked.current) return;
    const created = await onCreateCustomer(newName, newMobile, newDetails);
    if (!created) {
      setMessage("تعذر إضافة العميل. تحقق من الاسم ورقم الجوال.");
      return;
    }
    setResults((current) => [created, ...current.filter((customer) => customer.id !== created.id)]);
    setSelected(created);
    resetCreate();
    setMessage("تم إنشاء العميل. اضغط «إضافة إلى التذكرة» للمتابعة.");
  };

  const submitAttach = async () => {
    if (!selected || actionLocked.current) return;
    actionLocked.current = true;
    setSubmitting(true);
    const attached = await onAttachCustomer(selected.id);
    if (!attached) {
      actionLocked.current = false;
      setSubmitting(false);
      setMessage("تعذر ربط العميل بالتذكرة.");
      return;
    }
    onClose();
  };

  const removeAttachedCustomer = async () => {
    if (!attachedCustomer || actionLocked.current) return;
    actionLocked.current = true;
    setSubmitting(true);
    const removed = await onAttachCustomer(null);
    if (!removed) {
      actionLocked.current = false;
      setSubmitting(false);
      setMessage("تعذر إزالة العميل من التذكرة.");
      return;
    }
    onClose();
  };

  const submitCredit = async () => {
    if (!selected || actionLocked.current) return;
    actionLocked.current = true;
    setSubmitting(true);
    const updated = await onChargeCredit(selected.id);
    if (!updated) {
      actionLocked.current = false;
      setSubmitting(false);
      setMessage("تعذر تسجيل البيع الآجل.");
      return;
    }
    onClose();
  };

  const openEdit = () => {
    if (!selected) return;
    setEditName(selected.name);
    setEditMobile(selected.mobile);
    setEditDetails(selected.details);
    setProfileMenuOpen(false);
    setView("edit");
  };

  const submitEdit = async (event: FormEvent) => {
    event.preventDefault();
    if (!selected || actionLocked.current) return;
    actionLocked.current = true;
    setSubmitting(true);
    const updated = await onUpdateCustomer(selected.id, editName, editMobile, editDetails);
    actionLocked.current = false;
    setSubmitting(false);
    if (!updated) {
      setMessage("تعذر حفظ بيانات العميل.");
      return;
    }
    await loadProfile(updated);
    setMessage("تم تحديث الملف الشخصي.");
    setView("profile");
  };

  const redeemHalalas = digitsToHalalas(redeemDigits);
  const redeemMaximum = redemptionQuote?.amount.halalas ?? 0;
  const redeemValid = redeemHalalas > 0 && redeemHalalas <= redeemMaximum;

  const appendRedeemDigit = (digit: string) => {
    setRedeemDigits((current) => {
      const next = `${current}${digit}`.replace(/^0+(?=\d)/, "").slice(0, 8);
      return next;
    });
  };

  const applyRedemption = async () => {
    if (!redeemValid || actionLocked.current) return;
    actionLocked.current = true;
    setSubmitting(true);
    const applied = await onApplyLoyaltyRedemption(redeemHalalas);
    actionLocked.current = false;
    setSubmitting(false);
    if (!applied) {
      setMessage("تعذر تطبيق استبدال النقاط.");
      return;
    }
    onClose();
  };

  const clearRedemption = async () => {
    if (actionLocked.current) return;
    actionLocked.current = true;
    setSubmitting(true);
    const cleared = await onApplyLoyaltyRedemption(0);
    actionLocked.current = false;
    setSubmitting(false);
    if (cleared) onClose();
  };

  const debtAfterCredit: Money | null = selected && purpose === "credit"
    ? { halalas: selected.debt.halalas + ticketTotal.halalas, currency: selected.debt.currency }
    : null;

  const filteredPurchases = useMemo(() => {
    const needle = historyQuery.trim().toLowerCase();
    if (!needle) return purchases;
    return purchases.filter((receipt) => receipt.number.toLowerCase().includes(needle));
  }, [historyQuery, purchases]);

  const visitCount = purchases.length;
  const lastVisit = purchases[0]?.completedAt ? dateFormatter.format(new Date(purchases[0].completedAt)) : "—";
  const purchaseProgress = loyaltyStatus?.program.mode === "purchase-count"
    ? loyaltyStatus.qualifyingPurchases % loyaltyStatus.program.purchasesRequired
    : 0;

  if (purpose === "credit" && attachedCustomer) {
    return (
      <div className="dialog-backdrop customer-credit-backdrop" role="presentation" onClick={() => { if (!submitting) onClose(); }}>
        <section className="customer-credit-dialog customer-credit-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="credit-confirm-title" onClick={(event) => event.stopPropagation()}>
          <header className="customer-touch-header">
            <button type="button" onClick={onClose} aria-label="إغلاق" disabled={submitting}>×</button>
            <div><h2 id="credit-confirm-title">تأكيد البيع الآجل</h2><span>العميل مضاف إلى التذكرة مسبقًا.</span></div>
          </header>
          {selected ? (
            <div className="customer-account-card customer-credit-confirm-card">
              <div className="customer-account-head"><span><strong>{selected.name}</strong><small dir="ltr">{selected.mobile}</small></span></div>
              <div className="customer-balance-row"><span>الدين الحالي</span><strong><MoneyAmount value={selected.debt} /></strong></div>
              <div className="customer-balance-row"><span>قيمة البيع الآجل</span><strong><MoneyAmount value={ticketTotal} /></strong></div>
              {debtAfterCredit ? <div className="customer-balance-row customer-balance-row--total"><span>الدين بعد العملية</span><strong><MoneyAmount value={debtAfterCredit} /></strong></div> : null}
              <button type="button" className="primary-button customer-credit-submit customer-touch-primary" onClick={() => void submitCredit()} disabled={busy || submitting}>{submitting ? "جارٍ التسجيل…" : "تأكيد البيع الآجل"}</button>
            </div>
          ) : (
            <div className="customer-account-placeholder customer-credit-confirm-loading"><strong>{searching ? "جارٍ تحميل حساب العميل…" : "تعذر تحميل حساب العميل"}</strong></div>
          )}
        </section>
      </div>
    );
  }

  if (purpose === "attach" && attachedCustomer && view !== "picker") {
    return (
      <div className="dialog-backdrop customer-credit-backdrop" role="presentation" onClick={() => { if (!submitting) onClose(); }}>
        <section className="customer-credit-dialog customer-profile-dialog" role="dialog" aria-modal="true" aria-label={view === "history" ? "تاريخ الشراء" : view === "redeem" ? "استبدال النقاط" : view === "edit" ? "تعديل الملف الشخصي" : "الملف الشخصي للعميل"} onClick={(event) => event.stopPropagation()}>
          <header className="customer-touch-header customer-profile-topbar">
            <button type="button" onClick={() => view === "profile" ? onClose() : setView("profile")} aria-label={view === "profile" ? "إغلاق" : "رجوع"}>{view === "profile" ? "×" : "→"}</button>
            <div><h2>{view === "history" ? "تاريخ الشراء" : view === "redeem" ? "استبدال النقاط" : view === "edit" ? "تعديل الملف الشخصي" : "الملف الشخصي للعميل"}</h2></div>
            {view === "profile" ? (
              <div className="customer-profile-menu-wrap">
                <button type="button" className="customer-profile-menu-trigger" aria-label="خيارات العميل" aria-expanded={profileMenuOpen} onClick={() => setProfileMenuOpen((current) => !current)}>⋮</button>
                {profileMenuOpen ? <button type="button" className="customer-profile-remove-menu" onClick={() => void removeAttachedCustomer()} disabled={submitting}>إزالة من التذكرة</button> : null}
              </div>
            ) : <span className="customer-topbar-spacer" />}
          </header>

          {profileLoading || !selected ? (
            <div className="customer-profile-loading">جارٍ تحميل ملف العميل…</div>
          ) : view === "profile" ? (
            <div className="customer-profile-shell">
              <section className="customer-profile-hero">
                <div className="customer-profile-avatar" aria-hidden="true">●</div>
                <h3>{selected.name}</h3>
                {selected.details.email ? <div className="customer-profile-detail"><span>✉</span><strong dir="ltr">{selected.details.email}</strong></div> : null}
                <div className="customer-profile-detail"><span>☎</span><strong dir="ltr">{selected.mobile}</strong></div>
                {detailAddress(selected.details) ? <div className="customer-profile-detail"><span>⌖</span><strong>{detailAddress(selected.details)}</strong></div> : null}
                {selected.details.customerCode ? <div className="customer-profile-detail"><span>▣</span><strong dir="ltr">{selected.details.customerCode}</strong></div> : null}
              </section>

              <section className="customer-profile-stats" aria-label="ملخص العميل">
                {loyaltyStatus?.program.mode === "cashback" ? (
                  <div><span>★</span><strong>{formatMoneyAmount(loyaltyStatus.balance)}</strong><small>رصيد الولاء</small></div>
                ) : loyaltyStatus?.program.mode === "purchase-count" ? (
                  <div><span>★</span><strong dir="ltr">{purchaseProgress} / {loyaltyStatus.program.purchasesRequired}</strong><small>تقدم المكافأة</small></div>
                ) : <div><span>★</span><strong>—</strong><small>الولاء غير مفعّل</small></div>}
                <div><span>▰</span><strong>{visitCount}</strong><small>الزيارات</small></div>
                <div><span>▣</span><strong>{lastVisit}</strong><small>آخر زيارة</small></div>
              </section>

              {loyaltyStatus?.program.mode === "purchase-count" && loyaltyStatus.rewardsAvailable > 0 ? <div className="customer-profile-reward">مكافأة جاهزة · {loyaltyStatus.rewardsAvailable} — {loyaltyStatus.program.rewardLabel}</div> : null}
              {loyaltyRedemption.halalas > 0 ? <div className="customer-profile-redemption-active"><span>مطبق على التذكرة</span><strong>− {formatMoneyAmount(loyaltyRedemption)} ر.س</strong></div> : null}

              <div className="customer-profile-actions">
                <button type="button" className="customer-touch-action" onClick={openEdit}>تعديل الملف الشخصي</button>
                <button type="button" className="customer-touch-action" onClick={() => { setRedeemDigits(loyaltyRedemption.halalas > 0 ? String(loyaltyRedemption.halalas) : ""); setView("redeem"); }} disabled={loyaltyStatus?.program.mode !== "cashback" || (loyaltyStatus?.balance.halalas ?? 0) <= 0 || ticketSubtotal.halalas <= 0}>استبدال النقاط</button>
                <button type="button" className="customer-touch-action" onClick={() => setView("history")}>عرض المشتريات</button>
              </div>
              {message ? <div className="customer-credit-message" role="status">{message}</div> : null}
            </div>
          ) : view === "history" ? (
            <div className="customer-history-shell">
              <label className="customer-history-search"><span>بحث برقم الإيصال</span><input value={historyQuery} onChange={(event) => setHistoryQuery(event.target.value)} placeholder="R-00001" /></label>
              <div className="customer-purchase-list">
                {filteredPurchases.map((purchase) => (
                  <article className="customer-purchase-row" key={purchase.id}>
                    <div className="customer-purchase-main"><strong><MoneyAmount value={purchase.total} /></strong><span>{purchase.items.map((item) => `${item.quantity} × ${item.name}`).join("، ") || "عملية بيع"}</span></div>
                    <div className="customer-purchase-meta"><strong dir="ltr">{purchase.number}</strong><span>{dateFormatter.format(new Date(purchase.completedAt))}</span>{purchase.loyaltyRedemption.halalas > 0 ? <small>استبدال نقاط: − {formatMoneyAmount(purchase.loyaltyRedemption)} ر.س</small> : null}</div>
                  </article>
                ))}
                {filteredPurchases.length === 0 ? <div className="customer-history-empty">لا توجد مشتريات مطابقة.</div> : null}
              </div>
            </div>
          ) : view === "redeem" ? (
            <div className="customer-redeem-shell">
              <section className="customer-redeem-summary">
                <span>رصيد الولاء المتاح</span>
                <strong>{loyaltyStatus ? formatMoneyAmount(loyaltyStatus.balance) : "0.00"} ر.س</strong>
                <small>الحد الأقصى لهذه التذكرة: {formatMoneyAmount({ halalas: redeemMaximum, currency: "SAR" })} ر.س</small>
              </section>
              <section className="customer-redeem-value" aria-label="قيمة الاستبدال"><span>القيمة</span><strong>{(redeemHalalas / 100).toFixed(2)} ر.س</strong></section>
              <div className="customer-redeem-keypad" aria-label="لوحة استبدال النقاط">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => <button type="button" key={digit} onClick={() => appendRedeemDigit(digit)}>{digit}</button>)}
                <button type="button" onClick={() => appendRedeemDigit("0")}>0</button>
                <button type="button" onClick={() => appendRedeemDigit("00")}>00</button>
                <button type="button" className="customer-keypad-delete" aria-label="حذف رقم" onClick={() => setRedeemDigits((current) => current.slice(0, -1))}>⌫</button>
              </div>
              {redeemHalalas > redeemMaximum ? <div className="customer-redeem-error">القيمة أكبر من الرصيد المتاح لهذه التذكرة.</div> : null}
              <button type="button" className="primary-button customer-redeem-confirm" onClick={() => void applyRedemption()} disabled={!redeemValid || submitting}>{submitting ? "جارٍ التطبيق…" : `استبدال ${(redeemHalalas / 100).toFixed(2)} ر.س`}</button>
              {loyaltyRedemption.halalas > 0 ? <button type="button" className="customer-redeem-clear" onClick={() => void clearRedemption()} disabled={submitting}>إزالة الاستبدال الحالي</button> : null}
            </div>
          ) : (
            <form className="customer-profile-edit-form" onSubmit={(event) => void submitEdit(event)}>
              <label><span>اسم العميل</span><input value={editName} onChange={(event) => setEditName(event.target.value)} required /></label>
              <label><span>رقم الجوال</span><input dir="ltr" value={editMobile} onChange={(event) => setEditMobile(event.target.value)} required /></label>
              <label><span>البريد الإلكتروني</span><input dir="ltr" type="email" value={editDetails.email} onChange={(event) => updateEditDetail("email", event.target.value)} /></label>
              <label><span>رمز العميل</span><input dir="ltr" value={editDetails.customerCode} onChange={(event) => updateEditDetail("customerCode", event.target.value)} /></label>
              <label><span>العنوان</span><input value={editDetails.address} onChange={(event) => updateEditDetail("address", event.target.value)} /></label>
              <label><span>المدينة</span><input value={editDetails.city} onChange={(event) => updateEditDetail("city", event.target.value)} /></label>
              <label><span>المنطقة</span><input value={editDetails.region} onChange={(event) => updateEditDetail("region", event.target.value)} /></label>
              <label><span>الرمز البريدي</span><input dir="ltr" value={editDetails.postalCode} onChange={(event) => updateEditDetail("postalCode", event.target.value)} /></label>
              <label><span>الدولة</span><input value={editDetails.country} onChange={(event) => updateEditDetail("country", event.target.value)} /></label>
              <label><span>ملاحظات</span><textarea value={editDetails.note} onChange={(event) => updateEditDetail("note", event.target.value)} /></label>
              <button type="submit" className="primary-button customer-touch-primary" disabled={busy || submitting}>{submitting ? "جارٍ الحفظ…" : "حفظ التعديلات"}</button>
            </form>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="dialog-backdrop customer-credit-backdrop" role="presentation" onClick={() => { if (!submitting) onClose(); }}>
      <section className="customer-credit-dialog customer-picker-dialog" role="dialog" aria-modal="true" aria-labelledby="customer-picker-title" onClick={(event) => event.stopPropagation()}>
        <header className="customer-touch-header">
          <button type="button" onClick={onClose} aria-label="إغلاق" disabled={submitting}>×</button>
          <div><h2 id="customer-picker-title">{purpose === "credit" ? "بيع آجل" : "إضافة عميل إلى التذكرة"}</h2><span>{purpose === "credit" ? "اختر العميل الذي ستُسجل عليه قيمة التذكرة." : "ابحث بالاسم أو رقم الجوال، أو أضف عميلًا جديدًا."}</span></div>
        </header>

        <div className="customer-search-form customer-search-form--live">
          <label><span>العميل أو رقم الجوال</span><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابدأ بالاسم أو 0501234567" aria-label="بحث العميل" disabled={submitting} /></label>
          <span className="customer-live-search-status" role="status">{searching ? "جارٍ البحث…" : `${results.length} نتيجة`}</span>
        </div>

        <div className="customer-credit-body">
          <div className="customer-results" aria-label="نتائج العملاء">
            {results.map((customer) => (
              <button type="button" key={customer.id} className={selected?.id === customer.id ? "active" : ""} onClick={() => selectCustomer(customer)} disabled={submitting}>
                <span><strong>{customer.name}</strong><small dir="ltr">{customer.mobile}</small></span>
                {purpose === "credit" ? <span className="customer-result-debt"><small>الدين</small><strong><MoneyAmount value={customer.debt} /></strong></span> : null}
              </button>
            ))}
            {!searching && results.length === 0 ? <div className="customer-empty-result">لا يوجد عميل مطابق.</div> : null}
          </div>

          {selected ? (
            <div className="customer-account-card customer-picker-selection">
              <div className="customer-account-head"><span><strong>{selected.name}</strong><small dir="ltr">{selected.mobile}</small></span><button type="button" onClick={() => setSelected(null)}>تغيير</button></div>
              {purpose === "credit" ? (
                <>
                  <div className="customer-balance-row"><span>الدين الحالي</span><strong><MoneyAmount value={selected.debt} /></strong></div>
                  <div className="customer-balance-row"><span>قيمة البيع الآجل</span><strong><MoneyAmount value={ticketTotal} /></strong></div>
                  {debtAfterCredit ? <div className="customer-balance-row customer-balance-row--total"><span>الدين بعد العملية</span><strong><MoneyAmount value={debtAfterCredit} /></strong></div> : null}
                  <button type="button" className="primary-button customer-touch-primary" onClick={() => void submitCredit()} disabled={busy || submitting}>تسجيل آجل</button>
                </>
              ) : (
                <>
                  <div className="ticket-customer-purpose"><strong>سيتم ربط العميل بالتذكرة</strong><span>الولاء وسجل المشتريات سيستخدمان نفس العميل. الدين لا يظهر هنا.</span></div>
                  <button type="button" className="primary-button customer-touch-primary" onClick={() => void submitAttach()} disabled={busy || submitting}>إضافة إلى التذكرة</button>
                </>
              )}
            </div>
          ) : <div className="customer-account-placeholder"><strong>اختر عميلًا</strong><span>أو أضف عميلًا جديدًا.</span></div>}
        </div>

        <div className="customer-create-section">
          {!createOpen ? <button type="button" className="customer-create-toggle customer-touch-create" onClick={() => { setCreateOpen(true); setNewMobile(query); }} disabled={submitting}>+ إضافة عميل جديد</button> : (
            <form className="customer-create-form customer-create-form--expanded" onSubmit={(event) => void submitCreate(event)}>
              <strong>عميل جديد</strong>
              <label><span>اسم العميل</span><input value={newName} onChange={(event) => setNewName(event.target.value)} required /></label>
              <label><span>رقم الجوال</span><input dir="ltr" value={newMobile} onChange={(event) => setNewMobile(event.target.value)} placeholder="05XXXXXXXX" required /></label>
              <label className="customer-extra-toggle"><input type="checkbox" checked={extraOpen} onChange={(event) => setExtraOpen(event.target.checked)} /><span><strong>معلومات إضافية</strong><small>إظهار البريد والعنوان وبقية بيانات العميل.</small></span></label>
              {extraOpen ? (
                <div className="customer-extra-fields">
                  <label><span>البريد الإلكتروني</span><input dir="ltr" type="email" value={newDetails.email} onChange={(event) => updateNewDetail("email", event.target.value)} /></label>
                  <label><span>رمز العميل</span><input dir="ltr" value={newDetails.customerCode} onChange={(event) => updateNewDetail("customerCode", event.target.value)} /></label>
                  <label><span>العنوان</span><input value={newDetails.address} onChange={(event) => updateNewDetail("address", event.target.value)} /></label>
                  <label><span>المدينة</span><input value={newDetails.city} onChange={(event) => updateNewDetail("city", event.target.value)} /></label>
                  <label><span>المنطقة</span><input value={newDetails.region} onChange={(event) => updateNewDetail("region", event.target.value)} /></label>
                  <label><span>الرمز البريدي</span><input dir="ltr" value={newDetails.postalCode} onChange={(event) => updateNewDetail("postalCode", event.target.value)} /></label>
                  <label><span>الدولة</span><input value={newDetails.country} onChange={(event) => updateNewDetail("country", event.target.value)} placeholder="السعودية" /></label>
                  <label><span>ملاحظات</span><textarea value={newDetails.note} onChange={(event) => updateNewDetail("note", event.target.value)} /></label>
                </div>
              ) : null}
              <div className="customer-create-actions"><button type="button" onClick={resetCreate}>إلغاء</button><button type="submit" className="primary-button">إنشاء العميل</button></div>
            </form>
          )}
        </div>
        {message ? <div className="customer-credit-message" role="status">{message}</div> : null}
      </section>
    </div>
  );
}
