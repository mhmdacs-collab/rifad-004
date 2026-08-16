import { useEffect, useRef, useState, type FormEvent } from "react";
import { MoneyAmount } from "./MoneyAmount";
import type { Customer, CustomerDetails, CustomerReference, Money } from "../domain/models";

export type CustomerPickerPurpose = "attach" | "credit";

type CustomerPickerDialogProps = {
  purpose: CustomerPickerPurpose;
  ticketTotal: Money;
  attachedCustomer: CustomerReference | null;
  busy: boolean;
  onClose: () => void;
  onSearch: (query: string) => Promise<readonly Customer[]>;
  onCreateCustomer: (name: string, mobile: string, details: CustomerDetails) => Promise<Customer | null>;
  onAttachCustomer: (customerId: string | null) => Promise<boolean>;
  onChargeCredit: (customerId: string) => Promise<Customer | null>;
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

export function CustomerPickerDialog({
  purpose,
  ticketTotal,
  attachedCustomer,
  busy,
  onClose,
  onSearch,
  onCreateCustomer,
  onAttachCustomer,
  onChargeCredit,
}: CustomerPickerDialogProps) {
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
  const searchSequence = useRef(0);
  const actionLocked = useRef(false);

  useEffect(() => {
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
  }, [attachedCustomer, onSearch, query, selected]);

  const updateDetail = (key: keyof CustomerDetails, value: string) => {
    setNewDetails((current) => ({ ...current, [key]: value }));
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
    setMessage("تم إنشاء العميل. أكمل ربطه بالتذكرة.");
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

  const debtAfterCredit: Money | null = selected && purpose === "credit"
    ? { halalas: selected.debt.halalas + ticketTotal.halalas, currency: selected.debt.currency }
    : null;

  return (
    <div className="dialog-backdrop customer-credit-backdrop" role="presentation" onClick={() => { if (!submitting) onClose(); }}>
      <section className="customer-credit-dialog customer-picker-dialog" role="dialog" aria-modal="true" aria-labelledby="customer-picker-title" onClick={(event) => event.stopPropagation()}>
        <header>
          <button type="button" onClick={onClose} aria-label="إغلاق" disabled={submitting}>×</button>
          <div>
            <h2 id="customer-picker-title">{purpose === "credit" ? "بيع آجل" : "إضافة عميل إلى التذكرة"}</h2>
            <span>{purpose === "credit" ? "اختر العميل الذي ستُسجل عليه قيمة التذكرة." : "اربط العميل بالطلب ليظهر على الفاتورة ويُستخدم للولاء وسجل المشتريات."}</span>
          </div>
        </header>

        <div className="customer-search-form customer-search-form--live">
          <label>
            <span>العميل أو رقم الجوال</span>
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ابدأ بالاسم أو 0501234567"
              aria-label="بحث العميل"
              disabled={submitting}
            />
          </label>
          <span className="customer-live-search-status" role="status">{searching ? "جارٍ البحث…" : `${results.length} نتيجة`}</span>
        </div>
        <p className="customer-mobile-note">البحث يتحدث مباشرة. رقم الجوال هو المعرف الأساسي للعميل ولا يسمح بتكراره.</p>

        <div className="customer-credit-body">
          <div className="customer-results" aria-label="نتائج العملاء">
            {results.map((customer) => (
              <button
                type="button"
                key={customer.id}
                className={selected?.id === customer.id ? "active" : ""}
                onClick={() => selectCustomer(customer)}
                disabled={submitting}
              >
                <span><strong>{customer.name}</strong><small dir="ltr">{customer.mobile}</small></span>
                <span className="customer-result-debt"><small>الدين</small><strong><MoneyAmount value={customer.debt} /></strong></span>
              </button>
            ))}
            {!searching && results.length === 0 ? <div className="customer-empty-result">لا يوجد عميل مطابق.</div> : null}
          </div>

          {selected ? (
            <div className="customer-account-card">
              <div className="customer-account-head">
                <span><strong>{selected.name}</strong><small dir="ltr">{selected.mobile}</small></span>
                <button type="button" onClick={() => setSelected(null)} disabled={submitting}>تغيير</button>
              </div>
              {selected.details.email ? <div className="customer-profile-line"><span>البريد</span><strong dir="ltr">{selected.details.email}</strong></div> : null}
              {selected.details.city || selected.details.region ? <div className="customer-profile-line"><span>الموقع</span><strong>{[selected.details.city, selected.details.region].filter(Boolean).join("، ")}</strong></div> : null}
              <div className="customer-balance-row"><span>الدين الحالي</span><strong><MoneyAmount value={selected.debt} /></strong></div>
              {purpose === "credit" ? (
                <>
                  <div className="customer-balance-row"><span>قيمة البيع الآجل</span><strong><MoneyAmount value={ticketTotal} /></strong></div>
                  {debtAfterCredit ? <div className="customer-balance-row customer-balance-row--total"><span>الدين بعد العملية</span><strong><MoneyAmount value={debtAfterCredit} /></strong></div> : null}
                  <button type="button" className="primary-button customer-credit-submit" onClick={() => void submitCredit()} disabled={busy || submitting}>{submitting ? "جارٍ التسجيل…" : "تسجيل آجل"}</button>
                </>
              ) : (
                <>
                  <div className="ticket-customer-purpose"><strong>سيتم ربط هذا العميل بالتذكرة الحالية</strong><span>الدفع يبقى نقدًا أو شبكة بشكل طبيعي، ولا ينشأ دين إلا عند اختيار «آجل».</span></div>
                  <button type="button" className="primary-button customer-credit-submit" onClick={() => void submitAttach()} disabled={busy || submitting}>{submitting ? "جارٍ الربط…" : "إضافة إلى التذكرة"}</button>
                  {attachedCustomer ? <button type="button" className="customer-remove-from-ticket" onClick={() => void removeAttachedCustomer()} disabled={busy || submitting}>إزالة العميل من التذكرة</button> : null}
                </>
              )}
            </div>
          ) : (
            <div className="customer-account-placeholder">
              <strong>اختر عميلًا</strong>
              <span>أو أضف عميلًا جديدًا برقم جواله.</span>
            </div>
          )}
        </div>

        <div className="customer-create-section">
          {!createOpen ? (
            <button type="button" className="customer-create-toggle" onClick={() => { setCreateOpen(true); setNewMobile(query); }} disabled={submitting}>+ إضافة عميل جديد</button>
          ) : (
            <form className="customer-create-form customer-create-form--expanded" onSubmit={(event) => void submitCreate(event)}>
              <strong>عميل جديد</strong>
              <label><span>اسم العميل</span><input value={newName} onChange={(event) => setNewName(event.target.value)} required disabled={submitting} /></label>
              <label><span>رقم الجوال</span><input dir="ltr" value={newMobile} onChange={(event) => setNewMobile(event.target.value)} placeholder="05XXXXXXXX" required disabled={submitting} /></label>

              <label className="customer-extra-toggle">
                <input type="checkbox" checked={extraOpen} onChange={(event) => setExtraOpen(event.target.checked)} disabled={submitting} />
                <span><strong>معلومات إضافية</strong><small>البريد، العنوان، المدينة، المنطقة، الرمز البريدي، الدولة، رمز العميل والملاحظات.</small></span>
              </label>

              {extraOpen ? (
                <div className="customer-extra-fields">
                  <label><span>البريد الإلكتروني</span><input dir="ltr" type="email" value={newDetails.email} onChange={(event) => updateDetail("email", event.target.value)} disabled={submitting} /></label>
                  <label><span>رمز العميل</span><input dir="ltr" value={newDetails.customerCode} onChange={(event) => updateDetail("customerCode", event.target.value)} disabled={submitting} /></label>
                  <label className="customer-extra-wide"><span>العنوان</span><input value={newDetails.address} onChange={(event) => updateDetail("address", event.target.value)} disabled={submitting} /></label>
                  <label><span>المدينة</span><input value={newDetails.city} onChange={(event) => updateDetail("city", event.target.value)} disabled={submitting} /></label>
                  <label><span>المنطقة</span><input value={newDetails.region} onChange={(event) => updateDetail("region", event.target.value)} disabled={submitting} /></label>
                  <label><span>الرمز البريدي</span><input dir="ltr" value={newDetails.postalCode} onChange={(event) => updateDetail("postalCode", event.target.value)} disabled={submitting} /></label>
                  <label><span>الدولة</span><input value={newDetails.country} onChange={(event) => updateDetail("country", event.target.value)} placeholder="السعودية" disabled={submitting} /></label>
                  <label className="customer-extra-wide"><span>ملاحظات</span><textarea value={newDetails.note} onChange={(event) => updateDetail("note", event.target.value)} disabled={submitting} /></label>
                </div>
              ) : null}

              <div><button type="button" onClick={resetCreate} disabled={submitting}>إلغاء</button><button type="submit" className="primary-button" disabled={busy || submitting}>إنشاء العميل</button></div>
            </form>
          )}
        </div>

        {message ? <div className="customer-credit-message" role="status">{message}</div> : null}
      </section>
    </div>
  );
}
