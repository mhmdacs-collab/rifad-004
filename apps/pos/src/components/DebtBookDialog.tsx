import { useEffect, useMemo, useRef, useState } from "react";
import { MoneyAmount } from "./MoneyAmount";
import type { Customer, DebtLedgerEntry, Money } from "../domain/models";

type DebtBookDialogProps = {
  busy: boolean;
  onClose: () => void;
  onSearch: (query: string) => Promise<readonly Customer[]>;
  onLoadLedger: (customerId: string) => Promise<readonly DebtLedgerEntry[]>;
  onSettleDebt: (customerId: string, amountHalalas: number) => Promise<Customer | null>;
};

type SettlementSuccess = {
  customerName: string;
  paidHalalas: number;
  remainingHalalas: number;
  currency: Money["currency"];
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

const ledgerLabel = (entry: DebtLedgerEntry) => {
  if (entry.kind === "payment") return "سداد";
  if (entry.kind === "credit-sale") return entry.ticketSequence ? `بيع آجل · تذكرة #${entry.ticketSequence}` : "بيع آجل";
  return "رصيد افتتاحي";
};

const ledgerDate = (value: string) => {
  try {
    return new Intl.DateTimeFormat("ar-SA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
};

export function DebtBookDialog({
  busy,
  onClose,
  onSearch,
  onLoadLedger,
  onSettleDebt,
}: DebtBookDialogProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<readonly Customer[]>([]);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [ledger, setLedger] = useState<readonly DebtLedgerEntry[]>([]);
  const [searching, setSearching] = useState(false);
  const [loadingLedger, setLoadingLedger] = useState(false);
  const [editingAmount, setEditingAmount] = useState(false);
  const [amountInput, setAmountInput] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<SettlementSuccess | null>(null);
  const searchSequence = useRef(0);
  const ledgerSequence = useRef(0);
  const actionLocked = useRef(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  useEffect(() => {
    if (success) return;
    const sequence = ++searchSequence.current;
    setSearching(true);
    void onSearch(query)
      .then((items) => {
        if (sequence !== searchSequence.current) return;
        setResults(items.filter((customer) => customer.debt.halalas > 0));
      })
      .finally(() => {
        if (sequence === searchSequence.current) setSearching(false);
      });
  }, [onSearch, query, success]);

  const debtorsTotal = useMemo(
    () => results.reduce((sum, customer) => sum + customer.debt.halalas, 0),
    [results],
  );

  const selectCustomer = async (customer: Customer) => {
    if (actionLocked.current) return;
    setSelected(customer);
    setAmountInput(formatHalalasForInput(customer.debt.halalas));
    setEditingAmount(false);
    setMessage(null);
    const sequence = ++ledgerSequence.current;
    setLoadingLedger(true);
    const entries = await onLoadLedger(customer.id);
    if (sequence === ledgerSequence.current) {
      setLedger(entries);
      setLoadingLedger(false);
    }
  };

  const settlementHalalas = parseSarInputToHalalas(amountInput);
  const settlementInvalid = selected
    ? settlementHalalas === null || settlementHalalas <= 0 || settlementHalalas > selected.debt.halalas
    : true;

  const submitSettlement = async () => {
    if (!selected || settlementInvalid || settlementHalalas === null || actionLocked.current) return;
    actionLocked.current = true;
    setSubmitting(true);
    setMessage(null);
    const paidHalalas = settlementHalalas;
    const updated = await onSettleDebt(selected.id, paidHalalas);
    if (!updated) {
      actionLocked.current = false;
      setSubmitting(false);
      setMessage("تعذر تسجيل السداد.");
      return;
    }

    setSuccess({
      customerName: updated.name,
      paidHalalas,
      remainingHalalas: updated.debt.halalas,
      currency: updated.debt.currency,
    });
    setSubmitting(false);
    closeTimer.current = setTimeout(onClose, 1000);
  };

  const confirmationLabel = settlementHalalas !== null && settlementHalalas > 0
    ? `تأكيد سداد ${formatHalalasForInput(settlementHalalas)} ر.س`
    : "تأكيد السداد";

  return (
    <div className="dialog-backdrop customer-credit-backdrop" role="presentation" onClick={() => { if (!submitting) onClose(); }}>
      <section className="customer-credit-dialog debt-book-dialog" role="dialog" aria-modal="true" aria-labelledby="debt-book-title" onClick={(event) => event.stopPropagation()}>
        <header>
          <button type="button" onClick={onClose} aria-label="إغلاق" disabled={submitting}>×</button>
          <div>
            <h2 id="debt-book-title">دفتر الديون</h2>
            <span>العملاء المدينون، سجل الفواتير الآجلة، وحركات السداد في مكان واحد.</span>
          </div>
        </header>

        {success ? (
          <div className="debt-book-success" aria-live="assertive">
            <strong>تم سداد {formatHalalasForInput(success.paidHalalas)} ر.س</strong>
            <span>{success.customerName}</span>
            <div><span>الرصيد المتبقي</span><strong><MoneyAmount value={{ halalas: success.remainingHalalas, currency: success.currency }} /></strong></div>
            <small>سيتم إغلاق دفتر الديون والعودة للبيع تلقائيًا.</small>
          </div>
        ) : (
          <>
            <div className="debt-book-toolbar">
              <label>
                <span>البحث في دفتر الديون</span>
                <input
                  autoFocus
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="اسم العميل أو رقم الجوال"
                  aria-label="بحث دفتر الديون"
                  disabled={submitting}
                />
              </label>
              <div className="debt-book-summary">
                <span>{searching ? "جارٍ البحث…" : `${results.length} مدين`}</span>
                <strong><MoneyAmount value={{ halalas: debtorsTotal, currency: "SAR" }} /></strong>
                <small>إجمالي الرصيد الظاهر</small>
              </div>
            </div>

            <div className="debt-book-body">
              <div className="debtors-list" aria-label="العملاء المدينون">
                <div className="debtors-list-title"><strong>المدينون</strong><span>اضغط على العميل لفتح حسابه</span></div>
                {results.map((customer) => (
                  <button
                    type="button"
                    key={customer.id}
                    className={selected?.id === customer.id ? "active" : ""}
                    onClick={() => void selectCustomer(customer)}
                    disabled={submitting}
                  >
                    <span><strong>{customer.name}</strong><small dir="ltr">{customer.mobile}</small></span>
                    <strong className="debtor-balance"><MoneyAmount value={customer.debt} /></strong>
                  </button>
                ))}
                {!searching && results.length === 0 ? <div className="customer-empty-result">لا توجد ديون مطابقة للبحث.</div> : null}
              </div>

              {selected ? (
                <div className="debt-account-view">
                  <div className="debt-account-head">
                    <span><strong>{selected.name}</strong><small dir="ltr">{selected.mobile}</small></span>
                    <div><span>الرصيد الحالي</span><strong><MoneyAmount value={selected.debt} /></strong></div>
                  </div>

                  <div className="debt-ledger" aria-label="حركات الدين">
                    <div className="debt-ledger-title"><strong>الحركات</strong><span>{loadingLedger ? "جارٍ التحميل…" : `${ledger.length} حركة`}</span></div>
                    {!loadingLedger && ledger.map((entry) => (
                      <div className="debt-ledger-row" key={entry.id}>
                        <span>
                          <strong>{ledgerLabel(entry)}</strong>
                          <small>{ledgerDate(entry.createdAt)}</small>
                        </span>
                        <strong className={entry.direction === "debit" ? "debt-increase" : "debt-payment"}>
                          {entry.direction === "debit" ? "+" : "−"}<MoneyAmount value={entry.amount} />
                        </strong>
                      </div>
                    ))}
                    {!loadingLedger && ledger.length === 0 ? <div className="debt-ledger-empty">لا توجد حركات محفوظة.</div> : null}
                  </div>

                  <div className="debt-settlement-box">
                    <div className="customer-settlement-row">
                      <div>
                        <span>مبلغ السداد</span>
                        {!editingAmount ? (
                          <strong><MoneyAmount value={{ halalas: settlementHalalas ?? 0, currency: selected.debt.currency }} /></strong>
                        ) : (
                          <label className="customer-settlement-input">
                            <input
                              autoFocus
                              dir="ltr"
                              inputMode="decimal"
                              value={amountInput}
                              onChange={(event) => setAmountInput(event.target.value)}
                              aria-label="مبلغ السداد"
                              disabled={submitting}
                            />
                            <span>ر.س</span>
                          </label>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (editingAmount) {
                            setAmountInput(formatHalalasForInput(selected.debt.halalas));
                            setEditingAmount(false);
                          } else {
                            setEditingAmount(true);
                          }
                          setMessage(null);
                        }}
                        disabled={submitting}
                      >
                        {editingAmount ? "كامل الدين" : "تعديل المبلغ"}
                      </button>
                    </div>

                    {editingAmount && settlementHalalas !== null && settlementHalalas > 0 && settlementHalalas <= selected.debt.halalas ? (
                      <div className="debt-after-payment"><span>المتبقي بعد السداد</span><strong><MoneyAmount value={{ halalas: selected.debt.halalas - settlementHalalas, currency: selected.debt.currency }} /></strong></div>
                    ) : null}
                    {settlementInvalid ? <small className="customer-settlement-error">أدخل مبلغًا أكبر من صفر ولا يتجاوز الرصيد الحالي.</small> : null}
                    <button
                      type="button"
                      className="primary-button debt-settlement-submit"
                      onClick={() => void submitSettlement()}
                      disabled={busy || submitting || settlementInvalid}
                    >
                      {submitting ? "جارٍ تسجيل السداد…" : confirmationLabel}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="debt-book-placeholder">
                  <strong>اختر عميلًا من دفتر الديون</strong>
                  <span>ستظهر هنا الفواتير الآجلة والسدادات والرصيد الحالي.</span>
                </div>
              )}
            </div>

            {message ? <div className="customer-credit-message" role="status">{message}</div> : null}
          </>
        )}
      </section>
    </div>
  );
}
