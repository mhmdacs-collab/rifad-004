import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
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
  previousHalalas: number;
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
  const [amountFresh, setAmountFresh] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<SettlementSuccess | null>(null);
  const searchSequence = useRef(0);
  const ledgerSequence = useRef(0);
  const actionLocked = useRef(false);

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
    setAmountFresh(true);
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

  const clearSelectedCustomer = () => {
    if (submitting) return;
    ledgerSequence.current += 1;
    setSelected(null);
    setLedger([]);
    setEditingAmount(false);
    setAmountInput("");
    setAmountFresh(true);
    setMessage(null);
  };

  const applySettlementKey = (key: string) => {
    setAmountInput((current) => {
      if (key === "backspace") {
        setAmountFresh(false);
        return amountFresh ? "" : current.slice(0, -1);
      }

      if (key === "decimal") {
        setAmountFresh(false);
        if (amountFresh) return "0.";
        return current.includes(".") ? current : `${current || "0"}.`;
      }

      const seed = amountFresh ? "" : current;
      setAmountFresh(false);
      const [whole = "", fraction] = seed.split(".");
      if (fraction !== undefined) {
        const room = Math.max(0, 2 - fraction.length);
        if (room === 0) return seed;
        return `${whole || "0"}.${fraction}${key.slice(0, room)}`;
      }

      const next = `${seed}${key}`.replace(/^0+(?=\d)/, "").slice(0, 9);
      return next || "0";
    });
    setMessage(null);
  };

  const handleSettlementKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (/^\d$/.test(event.key)) {
      event.preventDefault();
      applySettlementKey(event.key);
      return;
    }
    if (event.key === "." || event.key === ",") {
      event.preventDefault();
      applySettlementKey("decimal");
      return;
    }
    if (event.key === "Backspace" || event.key === "Delete") {
      event.preventDefault();
      applySettlementKey("backspace");
    }
  };

  const settlementHalalas = parseSarInputToHalalas(amountInput);
  const settlementInvalid = selected
    ? settlementHalalas === null || settlementHalalas <= 0 || settlementHalalas > selected.debt.halalas
    : true;
  const settlementPreviewHalalas = selected
    ? settlementHalalas === null
      ? selected.debt.halalas
      : Math.max(0, selected.debt.halalas - settlementHalalas)
    : 0;

  const submitSettlement = async () => {
    if (!selected || settlementInvalid || settlementHalalas === null || actionLocked.current) return;
    actionLocked.current = true;
    setSubmitting(true);
    setMessage(null);
    const previousHalalas = selected.debt.halalas;
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
      previousHalalas,
      paidHalalas,
      remainingHalalas: updated.debt.halalas,
      currency: updated.debt.currency,
    });
    setSubmitting(false);
  };

  const confirmationLabel = settlementHalalas !== null && settlementHalalas > 0
    ? `تأكيد سداد ${formatHalalasForInput(settlementHalalas)} ر.س`
    : "تأكيد السداد";

  return (
    <div className="dialog-backdrop customer-credit-backdrop" role="presentation" onClick={() => { if (!submitting) onClose(); }}>
      <section className={`customer-credit-dialog debt-book-dialog${selected ? " debt-book-dialog--selected" : ""}${success ? " debt-book-dialog--success" : ""}`} role="dialog" aria-modal="true" aria-labelledby="debt-book-title" onClick={(event) => event.stopPropagation()}>
        <header>
          <button type="button" onClick={onClose} aria-label="إغلاق" disabled={submitting}>×</button>
          <div>
            <h2 id="debt-book-title">دفتر الديون</h2>
            <span>{success ? "ملخص السداد" : "ابحث عن العميل وسجّل السداد."}</span>
          </div>
        </header>

        {success ? (
          <div className="debt-book-success" aria-live="assertive">
            <div className="debt-book-success-main">
              <div className="debt-book-success-mark" aria-hidden="true">✓</div>
              <div className="debt-book-success-copy">
                <span>تم</span>
                <strong>تم تسجيل السداد</strong>
                <small>{success.customerName}</small>
              </div>

              <div className="debt-book-success-summary" aria-label="ملخص سداد الدين">
                <div>
                  <span>الرصيد قبل السداد</span>
                  <strong><MoneyAmount value={{ halalas: success.previousHalalas, currency: success.currency }} /></strong>
                </div>
                <div>
                  <span>المبلغ المسدد</span>
                  <strong><MoneyAmount value={{ halalas: success.paidHalalas, currency: success.currency }} /></strong>
                </div>
                <div className="debt-book-success-remaining">
                  <span>{success.remainingHalalas > 0 ? "المتبقي على العميل" : "الرصيد المتبقي"}</span>
                  <strong><MoneyAmount value={{ halalas: success.remainingHalalas, currency: success.currency }} /></strong>
                </div>
              </div>

              <div className="debt-book-success-note">
                {success.remainingHalalas > 0
                  ? "يمكن إبلاغ العميل بالمبلغ المتبقي مباشرة من هذا الملخص."
                  : "تم سداد كامل الدين ولا يوجد رصيد مستحق على العميل."}
              </div>
            </div>

            <footer className="debt-book-success-footer">
              <button type="button" className="primary-button" onClick={onClose}>تم</button>
            </footer>
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
                <div className="debtors-list-title"><strong>المدينون</strong><span>اختر العميل</span></div>
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
                    <button type="button" className="debt-change-customer" onClick={clearSelectedCustomer} disabled={submitting}>تغيير العميل</button>
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
                              inputMode="none"
                              value={amountInput}
                              onChange={(event) => {
                                setAmountInput(event.target.value);
                                setAmountFresh(false);
                                setMessage(null);
                              }}
                              onKeyDown={handleSettlementKeyDown}
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
                            setAmountFresh(true);
                            setEditingAmount(false);
                          } else {
                            setAmountInput(formatHalalasForInput(selected.debt.halalas));
                            setAmountFresh(true);
                            setEditingAmount(true);
                          }
                          setMessage(null);
                        }}
                        disabled={submitting}
                      >
                        {editingAmount ? "كامل الدين" : "تعديل المبلغ"}
                      </button>
                    </div>

                    {editingAmount ? (
                      <>
                        <div className="debt-settlement-keypad" aria-label="لوحة مبلغ السداد">
                          {["1", "2", "3"].map((key) => <button type="button" key={key} onClick={() => applySettlementKey(key)}>{key}</button>)}
                          <button type="button" className="debt-settlement-key--backspace" aria-label="حذف رقم" onClick={() => applySettlementKey("backspace")}>⌫</button>
                          {["4", "5", "6"].map((key) => <button type="button" key={key} onClick={() => applySettlementKey(key)}>{key}</button>)}
                          <button type="button" aria-label="فاصل عشري" onClick={() => applySettlementKey("decimal")}>.</button>
                          {["7", "8", "9"].map((key) => <button type="button" key={key} onClick={() => applySettlementKey(key)}>{key}</button>)}
                          <button type="button" className="debt-settlement-key--double-zero" onClick={() => applySettlementKey("00")}>00</button>
                          <button type="button" className="debt-settlement-key--zero" onClick={() => applySettlementKey("0")}>0</button>
                        </div>

                        <div className={`debt-settlement-feedback${settlementInvalid ? " is-error" : " is-ready"}`} role="status">
                          <div>
                            <span>المتبقي بعد السداد</span>
                            <strong><MoneyAmount value={{ halalas: settlementPreviewHalalas, currency: selected.debt.currency }} /></strong>
                          </div>
                          <small>
                            {settlementInvalid
                              ? "أدخل مبلغًا أكبر من صفر ولا يتجاوز الرصيد الحالي."
                              : settlementPreviewHalalas === 0
                                ? "سيتم سداد كامل الدين."
                                : "هذا هو الرصيد الذي سيبقى على العميل بعد السداد."}
                          </small>
                        </div>
                      </>
                    ) : null}

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
                  <span>سيظهر الرصيد والحركات وإجراء السداد هنا.</span>
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