import { useEffect, useState, type FormEvent } from "react";
import { MoneyAmount } from "./MoneyAmount";
import type { Customer, Money } from "../domain/models";

export type CustomerCreditMode = "credit" | "settlement";

type CustomerCreditDialogProps = {
  mode: CustomerCreditMode;
  ticketTotal: Money;
  busy: boolean;
  onClose: () => void;
  onSearch: (query: string) => Promise<readonly Customer[]>;
  onCreateCustomer: (name: string, mobile: string) => Promise<Customer | null>;
  onChargeCredit: (customerId: string) => Promise<Customer | null>;
  onSettleDebt: (customerId: string) => Promise<Customer | null>;
};

const digitsOnly = (value: string) => value.replace(/\D/g, "");

export function CustomerCreditDialog({
  mode,
  ticketTotal,
  busy,
  onClose,
  onSearch,
  onCreateCustomer,
  onChargeCredit,
  onSettleDebt,
}: CustomerCreditDialogProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<readonly Customer[]>([]);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [searching, setSearching] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newMobile, setNewMobile] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const runSearch = async (value: string) => {
    setSearching(true);
    setMessage(null);
    try {
      const items = await onSearch(value);
      const text = value.trim().toLocaleLowerCase("ar");
      const mobile = digitsOnly(value);
      if (!text) {
        setResults(items);
        return;
      }
      setResults(items.filter((customer) =>
        customer.name.toLocaleLowerCase("ar").includes(text)
        || (mobile.length > 0 && digitsOnly(customer.mobile).includes(mobile)),
      ));
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    void runSearch("");
  }, []);

  const selectCustomer = (customer: Customer) => {
    setSelected(customer);
    setCreateOpen(false);
    setMessage(null);
  };

  const submitCreate = async (event: FormEvent) => {
    event.preventDefault();
    const created = await onCreateCustomer(newName, newMobile);
    if (!created) {
      setMessage("تعذر إضافة العميل. تحقق من الاسم ورقم الجوال.");
      return;
    }
    setResults((current) => [created, ...current]);
    setSelected(created);
    setCreateOpen(false);
    setMessage("تمت إضافة العميل.");
  };

  const submitAction = async () => {
    if (!selected) return;
    if (mode === "credit") {
      const updated = await onChargeCredit(selected.id);
      if (!updated) {
        setMessage("تعذر تسجيل البيع الآجل.");
        return;
      }
      onClose();
      return;
    }

    const updated = await onSettleDebt(selected.id);
    if (!updated) {
      setMessage("تعذر سداد الدين.");
      return;
    }
    setSelected(updated);
    setResults((current) => current.map((customer) => customer.id === updated.id ? updated : customer));
    setMessage("تم سداد الدين بالكامل.");
  };

  const debtAfterCredit: Money | null = selected && mode === "credit"
    ? { halalas: selected.debt.halalas + ticketTotal.halalas, currency: selected.debt.currency }
    : null;

  return (
    <div className="dialog-backdrop customer-credit-backdrop" role="presentation" onClick={onClose}>
      <section className="customer-credit-dialog" role="dialog" aria-modal="true" aria-labelledby="customer-credit-title" onClick={(event) => event.stopPropagation()}>
        <header>
          <button type="button" onClick={onClose} aria-label="إغلاق">×</button>
          <div>
            <h2 id="customer-credit-title">{mode === "credit" ? "بيع آجل" : "سداد دين عميل"}</h2>
            <span>{mode === "credit" ? "اختر العميل الذي ستُسجل عليه قيمة التذكرة." : "اختر العميل لمعرفة رصيد دينه وسداده."}</span>
          </div>
        </header>

        <form className="customer-search-form" onSubmit={(event) => { event.preventDefault(); void runSearch(query); }}>
          <label>
            <span>العميل أو رقم الجوال</span>
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="مثال: 0501234567"
              aria-label="بحث العميل"
            />
          </label>
          <button type="submit" disabled={searching}>{searching ? "جارٍ البحث…" : "بحث"}</button>
        </form>
        <p className="customer-mobile-note">رقم الجوال هو المعرف الأساسي للعميل ويجب أن يكون فريدًا.</p>

        <div className="customer-credit-body">
          <div className="customer-results" aria-label="نتائج العملاء">
            {results.map((customer) => (
              <button
                type="button"
                key={customer.id}
                className={selected?.id === customer.id ? "active" : ""}
                onClick={() => selectCustomer(customer)}
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
                <button type="button" onClick={() => setSelected(null)}>تغيير</button>
              </div>
              <div className="customer-balance-row"><span>الدين الحالي</span><strong><MoneyAmount value={selected.debt} /></strong></div>
              {mode === "credit" ? (
                <>
                  <div className="customer-balance-row"><span>قيمة البيع الآجل</span><strong><MoneyAmount value={ticketTotal} /></strong></div>
                  {debtAfterCredit ? <div className="customer-balance-row customer-balance-row--total"><span>الدين بعد العملية</span><strong><MoneyAmount value={debtAfterCredit} /></strong></div> : null}
                  <button type="button" className="primary-button customer-credit-submit" onClick={() => void submitAction()} disabled={busy}>تسجيل آجل</button>
                </>
              ) : (
                <>
                  <div className="customer-balance-row customer-balance-row--total"><span>المبلغ المستحق</span><strong><MoneyAmount value={selected.debt} /></strong></div>
                  <button type="button" className="primary-button customer-credit-submit" onClick={() => void submitAction()} disabled={busy || selected.debt.halalas <= 0}>سداد كامل الدين</button>
                  {selected.debt.halalas <= 0 ? <small className="customer-no-debt">لا يوجد دين مستحق على هذا العميل.</small> : null}
                </>
              )}
            </div>
          ) : (
            <div className="customer-account-placeholder">
              <strong>اختر عميلًا</strong>
              <span>سيظهر هنا رصيد الدين وتفاصيل العملية.</span>
            </div>
          )}
        </div>

        {mode === "credit" ? (
          <div className="customer-create-section">
            {!createOpen ? (
              <button type="button" className="customer-create-toggle" onClick={() => { setCreateOpen(true); setNewMobile(query); }}>+ إضافة عميل جديد</button>
            ) : (
              <form className="customer-create-form" onSubmit={(event) => void submitCreate(event)}>
                <strong>عميل جديد</strong>
                <label><span>اسم العميل</span><input value={newName} onChange={(event) => setNewName(event.target.value)} required /></label>
                <label><span>رقم الجوال</span><input dir="ltr" value={newMobile} onChange={(event) => setNewMobile(event.target.value)} placeholder="05XXXXXXXX" required /></label>
                <div><button type="button" onClick={() => setCreateOpen(false)}>إلغاء</button><button type="submit" className="primary-button" disabled={busy}>إضافة العميل</button></div>
              </form>
            )}
          </div>
        ) : null}

        {message ? <div className="customer-credit-message" role="status">{message}</div> : null}
      </section>
    </div>
  );
}
