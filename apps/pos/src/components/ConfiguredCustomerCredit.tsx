import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Customer, Money } from "../domain/models";
import { MoneyAmount } from "./MoneyAmount";

type Props = {
  ticketTotal: Money;
  busy: boolean;
  onSearch: (query: string) => Promise<readonly Customer[]>;
  onCreateCustomer: (name: string, mobile: string) => Promise<Customer | null>;
  onChargeCredit: (customerId: string) => Promise<Customer | null>;
};

export function ConfiguredCustomerCredit({ ticketTotal, busy, onSearch, onCreateCustomer, onChargeCredit }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<readonly Customer[]>([]);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [searching, setSearching] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newMobile, setNewMobile] = useState("");
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
        if (sequence === searchSequence.current) setResults(items);
      })
      .finally(() => {
        if (sequence === searchSequence.current) setSearching(false);
      });
  }, [onSearch, query]);

  const selectCustomer = (customer: Customer) => {
    setSelected(customer);
    setCreateOpen(false);
    setMessage(null);
  };

  const submitCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (busy || submitting || actionLocked.current) return;
    actionLocked.current = true;
    setSubmitting(true);
    setMessage(null);
    const created = await onCreateCustomer(newName, newMobile);
    setSubmitting(false);
    if (!created) {
      actionLocked.current = false;
      setMessage("تعذر إضافة العميل. تحقق من الاسم ورقم الجوال.");
      return;
    }
    setResults((current) => [created, ...current.filter((customer) => customer.id !== created.id)]);
    setNewName("");
    setNewMobile("");
    selectCustomer(created);
    actionLocked.current = false;
  };

  const submitCredit = async () => {
    if (!selected || busy || submitting || actionLocked.current) return;
    actionLocked.current = true;
    setSubmitting(true);
    setMessage(null);
    const updated = await onChargeCredit(selected.id);
    if (!updated) {
      actionLocked.current = false;
      setSubmitting(false);
      setMessage("تعذر تسجيل البيع الآجل.");
    }
  };

  const debtAfterCredit = selected
    ? { halalas: selected.debt.halalas + ticketTotal.halalas, currency: selected.debt.currency } as const
    : null;

  return (
    <div className="payment-credit-flow" aria-label="بيع آجل">
      <div className="payment-credit-intro">
        <strong>اختر العميل</strong>
        <span>سجّل قيمة الفاتورة على ذمة العميل المختار.</span>
        <span lang="en" dir="ltr">Choose customer for credit sale</span>
      </div>

      {!selected ? <label className="payment-credit-search">
        <span>العميل أو رقم الجوال</span>
        <input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="الاسم أو 05XXXXXXXX"
          aria-label="بحث العميل للبيع الآجل"
          disabled={busy || submitting}
        />
        <small>{searching ? "جارٍ البحث…" : `${results.length} نتيجة`}</small>
      </label> : null}

      {!selected ? <div className="payment-credit-results" aria-label="نتائج العملاء">
        {results.map((customer) => (
          <button
            type="button"
            key={customer.id}
            className=""
            onClick={() => selectCustomer(customer)}
            disabled={busy || submitting}
          >
            <span>
              <strong>{customer.name}</strong>
              <small dir="ltr">{customer.mobile}</small>
            </span>
            <span>
              <small>الدين</small>
              <strong><MoneyAmount value={customer.debt} /></strong>
            </span>
          </button>
        ))}
        {!searching && results.length === 0 ? <div className="payment-credit-empty">لا يوجد عميل مطابق.</div> : null}
      </div> : null}

      {selected && debtAfterCredit ? (
        <div className="payment-credit-summary">
          <div className="payment-credit-customer">
            <span><strong>{selected.name}</strong><small dir="ltr">{selected.mobile}</small></span>
            <button type="button" onClick={() => setSelected(null)} disabled={busy || submitting}>تغيير العميل</button>
          </div>
          <div><span>الدين الحالي</span><strong><MoneyAmount value={selected.debt} /></strong></div>
          <div><span>قيمة الفاتورة</span><strong><MoneyAmount value={ticketTotal} /></strong></div>
          <div className="payment-credit-total"><span>الدين بعد العملية</span><strong><MoneyAmount value={debtAfterCredit} /></strong></div>
          <button type="button" className="payment-credit-submit" onClick={() => void submitCredit()} disabled={busy || submitting}>
            {submitting ? "جارٍ التسجيل…" : "تسجيل آجل"}
          </button>
        </div>
      ) : (
        <button type="button" className="payment-credit-create-toggle" onClick={() => { setCreateOpen((current) => !current); setNewMobile(query); }} disabled={busy || submitting}>
          + إضافة عميل جديد
        </button>
      )}

      {createOpen && !selected ? (
        <form className="payment-credit-create" onSubmit={(event) => void submitCreate(event)}>
          <label><span>اسم العميل</span><input value={newName} onChange={(event) => setNewName(event.target.value)} required disabled={busy || submitting} /></label>
          <label><span>رقم الجوال</span><input dir="ltr" value={newMobile} onChange={(event) => setNewMobile(event.target.value)} placeholder="05XXXXXXXX" required disabled={busy || submitting} /></label>
          <button type="submit" disabled={busy || submitting}>{submitting ? "جارٍ الإضافة…" : "إضافة واختيار"}</button>
        </form>
      ) : null}

      {message ? <div className="payment-credit-message" role="status">{message}</div> : null}
    </div>
  );
}
