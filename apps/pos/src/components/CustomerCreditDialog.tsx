import { useEffect, useRef, useState, type FormEvent } from "react";
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
  onSettleDebt: (customerId: string, amountHalalas: number) => Promise<Customer | null>;
};

const formatHalalasForInput = (halalas: number) => {
  const whole = Math.floor(halalas / 100);
  const fraction = String(halalas % 100).padStart(2, "0");
  return `${whole}.${fraction}`;
};

const parseSarInputToHalalas = (value: string): number | null => {
  const normalized = value.trim().replace(",", ".");
  if (!/^\d+(?:\.\d{0,2})?$/.test(normalized)) return null;
  const [wholePart = "0", fractionPart = ""] = normalized.split(".");
  const whole = Number(wholePart);
  if (!Number.isSafeInteger(whole)) return null;
  const fraction = Number((fractionPart + "00").slice(0, 2));
  const halalas = whole * 100 + fraction;
  return Number.isSafeInteger(halalas) ? halalas : null;
};

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
  const [settlementEditing, setSettlementEditing] = useState(false);
  const [settlementInput, setSettlementInput] = useState("");
  const searchSequence = useRef(0);

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
    setSettlementEditing(false);
    setSettlementInput(formatHalalasForInput(customer.debt.halalas));
  };

  const submitCreate = async (event: FormEvent) => {
    event.preventDefault();
    const created = await onCreateCustomer(newName, newMobile);
    if (!created) {
      setMessage("تعذر إضافة العميل. تحقق من الاسم ورقم الجوال.");
      return;
    }
    setResults((current) => [created, ...current.filter((customer) => customer.id !== created.id)]);
    selectCustomer(created);
    setMessage("تمت إضافة العميل.");
  };

  const settlementHalalas = parseSarInputToHalalas(settlementInput);
  const settlementInvalid = mode === "settlement" && selected
    ? settlementHalalas === null
      || settlementHalalas <= 0
      || settlementHalalas > selected.debt.halalas
    : false;

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

    if (settlementHalalas === null || settlementHalalas <= 0) {
      setMessage("أدخل مبلغ سداد صحيحًا أكبر من صفر.");
      return;
    }
    if (settlementHalalas > selected.debt.halalas) {
      setMessage("مبلغ السداد أكبر من دين العميل.");
      return;
    }

    const wasFullSettlement = settlementHalalas === selected.debt.halalas;
    const updated = await onSettleDebt(selected.id, settlementHalalas);
    if (!updated) {
      setMessage("تعذر تسجيل سداد الدين.");
      return;
    }
    setSelected(updated);
    setResults((current) => current.map((customer) => customer.id === updated.id ? updated : customer));
    setSettlementEditing(false);
    setSettlementInput(formatHalalasForInput(updated.debt.halalas));
    setMessage(wasFullSettlement ? "تم سداد الدين بالكامل." : "تم تسجيل السداد الجزئي. الرصيد المتبقي موضح أعلاه.");
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
            <span>{mode === "credit" ? "اختر العميل الذي ستُسجل عليه قيمة التذكرة." : "ابحث بالاسم أو رقم الجوال، ثم اختر مبلغ السداد."}</span>
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
            />
          </label>
          <span className="customer-live-search-status" role="status">{searching ? "جارٍ البحث…" : `${results.length} نتيجة`}</span>
        </div>
        <p className="customer-mobile-note">البحث يتحدث مباشرة مع كل حرف أو رقم. رقم الجوال هو المعرف الأساسي للعميل ويجب أن يكون فريدًا.</p>

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
                  <div className="customer-settlement-row">
                    <div>
                      <span>مبلغ السداد</span>
                      {!settlementEditing ? (
                        <strong><MoneyAmount value={{ halalas: settlementHalalas ?? 0, currency: selected.debt.currency }} /></strong>
                      ) : (
                        <label className="customer-settlement-input">
                          <input
                            autoFocus
                            dir="ltr"
                            inputMode="decimal"
                            value={settlementInput}
                            onChange={(event) => setSettlementInput(event.target.value)}
                            aria-label="مبلغ السداد"
                          />
                          <span>ر.س</span>
                        </label>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (settlementEditing) {
                          setSettlementInput(formatHalalasForInput(selected.debt.halalas));
                          setSettlementEditing(false);
                        } else {
                          setSettlementEditing(true);
                        }
                        setMessage(null);
                      }}
                      disabled={selected.debt.halalas <= 0}
                    >
                      {settlementEditing ? "كامل الدين" : "تعديل المبلغ"}
                    </button>
                  </div>
                  {settlementEditing && settlementHalalas !== null && settlementHalalas > 0 && settlementHalalas <= selected.debt.halalas ? (
                    <div className="customer-balance-row customer-balance-row--total">
                      <span>المتبقي بعد السداد</span>
                      <strong><MoneyAmount value={{ halalas: selected.debt.halalas - settlementHalalas, currency: selected.debt.currency }} /></strong>
                    </div>
                  ) : null}
                  {settlementInvalid ? <small className="customer-settlement-error">أدخل مبلغًا أكبر من صفر ولا يتجاوز الدين الحالي.</small> : null}
                  <button
                    type="button"
                    className="primary-button customer-credit-submit"
                    onClick={() => void submitAction()}
                    disabled={busy || selected.debt.halalas <= 0 || settlementInvalid}
                  >
                    سداد
                  </button>
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
