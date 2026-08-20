import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Customer, CustomerDetails } from "../domain/models";
import "../ticket-customer-workspace.css";

type TicketCustomerWorkspaceProps = {
  busy: boolean;
  onClose: () => void;
  onSearch: (query: string) => Promise<readonly Customer[]>;
  onCreateCustomer: (name: string, mobile: string, details: CustomerDetails) => Promise<Customer | null>;
  onAttachCustomer: (customerId: string | null) => Promise<boolean>;
};

type CustomerWorkspaceView = "picker" | "create";

const EMPTY_DETAILS: CustomerDetails = {
  email: "",
  address: "",
  city: "",
  region: "",
  postalCode: "",
  country: "",
  customerCode: "",
  taxNumber: "",
  note: "",
};

const cleanMobileDraft = (value: string) => value.replace(/\D/g, "").slice(0, 10);
const isValidSaudiMobileDraft = (value: string) => /^05\d{8}$/.test(value);
const cleanTaxNumberDraft = (value: string) => value.replace(/\D/g, "").slice(0, 20);

export function TicketCustomerWorkspace({
  busy,
  onClose,
  onSearch,
  onCreateCustomer,
  onAttachCustomer,
}: TicketCustomerWorkspaceProps) {
  const [view, setView] = useState<CustomerWorkspaceView>("picker");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<readonly Customer[]>([]);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newMobile, setNewMobile] = useState("");
  const [newTaxNumber, setNewTaxNumber] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const searchSequence = useRef(0);
  const actionLocked = useRef(false);

  useEffect(() => {
    if (view !== "picker") return;
    const sequence = ++searchSequence.current;
    setSearching(true);
    setMessage(null);
    void onSearch(query)
      .then((items) => {
        if (sequence !== searchSequence.current) return;
        setResults(items);
      })
      .finally(() => {
        if (sequence === searchSequence.current) setSearching(false);
      });
  }, [onSearch, query, view]);

  const openCreate = () => {
    setSelected(null);
    setMessage(null);
    setNewName("");
    setNewMobile(cleanMobileDraft(query));
    setNewTaxNumber("");
    setNewAddress("");
    setView("create");
  };

  const returnToPicker = () => {
    if (submitting) return;
    setMessage(null);
    setView("picker");
  };

  const attachCustomer = async (customer: Customer) => {
    if (actionLocked.current) return;
    actionLocked.current = true;
    setSubmitting(true);
    setMessage(null);
    const attached = await onAttachCustomer(customer.id);
    if (attached) {
      onClose();
      return;
    }
    actionLocked.current = false;
    setSubmitting(false);
    setMessage("تعذر إضافة العميل إلى التذكرة.");
  };

  const submitCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (actionLocked.current) return;
    const name = newName.trim();
    if (!name) {
      setMessage("اسم العميل مطلوب.");
      return;
    }
    if (!isValidSaudiMobileDraft(newMobile)) {
      setMessage("رقم الجوال يجب أن يكون 10 أرقام ويبدأ بـ05.");
      return;
    }

    actionLocked.current = true;
    setSubmitting(true);
    setMessage(null);
    const details: CustomerDetails = {
      ...EMPTY_DETAILS,
      address: newAddress.trim(),
      taxNumber: newTaxNumber.trim(),
    };
    const created = await onCreateCustomer(name, newMobile, details);
    if (!created) {
      actionLocked.current = false;
      setSubmitting(false);
      setMessage("تعذر إضافة العميل. تحقق من الاسم ورقم الجوال.");
      return;
    }

    const attached = await onAttachCustomer(created.id);
    if (attached) {
      onClose();
      return;
    }

    actionLocked.current = false;
    setSubmitting(false);
    setMessage("تم حفظ العميل، لكن تعذر ربطه بالتذكرة.");
  };

  const headerBack = view === "create" ? returnToPicker : onClose;

  return (
    <div className="dialog-backdrop customer-credit-backdrop ticket-customer-workspace-backdrop" role="presentation">
      <section
        className="customer-credit-dialog ticket-customer-workspace"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ticket-customer-workspace-title"
      >
        <header className="customer-touch-header ticket-customer-workspace-header">
          <button type="button" onClick={headerBack} aria-label={view === "create" ? "العودة إلى العملاء" : "العودة إلى السلة"} disabled={submitting}>×</button>
          <div>
            <h2 id="ticket-customer-workspace-title">{view === "create" ? "إضافة عميل جديد" : "إضافة عميل إلى التذكرة"}</h2>
            <span>{view === "create" ? "أدخل البيانات الأساسية ثم احفظ العميل وأضفه مباشرة إلى التذكرة." : "ابحث بالاسم أو رقم الجوال، ثم اختر العميل."}</span>
          </div>
        </header>

        {view === "picker" ? (
          <div className="ticket-customer-picker-view">
            <div className="ticket-customer-search">
              <label>
                <span>العميل أو رقم الجوال</span>
                <input
                  autoFocus
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setSelected(null);
                  }}
                  placeholder="ابدأ بالاسم أو 0501234567"
                  aria-label="بحث العميل"
                  disabled={submitting}
                />
              </label>
              <span className="ticket-customer-search-status" role="status">{searching ? "جارٍ البحث…" : `${results.length} نتيجة`}</span>
            </div>

            <div className="ticket-customer-results" aria-label="نتائج العملاء">
              {results.map((customer) => {
                const active = selected?.id === customer.id;
                return (
                  <div key={customer.id} className={`ticket-customer-result${active ? " active" : ""}`}>
                    <button
                      type="button"
                      className="ticket-customer-result-main"
                      onClick={() => {
                        setSelected(customer);
                        setMessage(null);
                      }}
                      disabled={submitting}
                      aria-pressed={active}
                    >
                      <span>
                        <strong>{customer.name}</strong>
                        <small dir="ltr">{customer.mobile}</small>
                      </span>
                    </button>
                    {active ? (
                      <button
                        type="button"
                        className="ticket-customer-result-attach"
                        onClick={() => void attachCustomer(customer)}
                        disabled={busy || submitting}
                      >
                        {submitting ? "جارٍ الإضافة…" : "إضافة إلى التذكرة"}
                      </button>
                    ) : null}
                  </div>
                );
              })}
              {!searching && results.length === 0 ? <div className="ticket-customer-empty">لا يوجد عميل مطابق.</div> : null}
            </div>

            {message ? <div className="ticket-customer-message" role="status">{message}</div> : null}

            <footer className="ticket-customer-picker-footer">
              <button type="button" className="ticket-customer-create-trigger" onClick={openCreate} disabled={submitting}>+ إضافة عميل جديد</button>
            </footer>
          </div>
        ) : (
          <div className="ticket-customer-create-view" data-customer-create-view="slide-up">
            <form className="ticket-customer-create-form" onSubmit={(event) => void submitCreate(event)}>
              <div className="ticket-customer-create-fields">
                <label>
                  <span>اسم العميل <b aria-hidden="true">*</b></span>
                  <input autoFocus value={newName} onChange={(event) => setNewName(event.target.value)} required autoComplete="name" />
                </label>
                <label>
                  <span>رقم الجوال <b aria-hidden="true">*</b></span>
                  <input
                    dir="ltr"
                    inputMode="numeric"
                    minLength={10}
                    maxLength={10}
                    pattern="05[0-9]{8}"
                    value={newMobile}
                    onChange={(event) => setNewMobile(cleanMobileDraft(event.target.value))}
                    placeholder="05XXXXXXXX"
                    required
                    autoComplete="tel"
                  />
                </label>
                <label>
                  <span>الرقم الضريبي <em>اختياري</em></span>
                  <input
                    dir="ltr"
                    inputMode="numeric"
                    maxLength={20}
                    value={newTaxNumber}
                    onChange={(event) => setNewTaxNumber(cleanTaxNumberDraft(event.target.value))}
                  />
                </label>
                <label>
                  <span>العنوان <em>اختياري</em></span>
                  <input value={newAddress} onChange={(event) => setNewAddress(event.target.value)} autoComplete="street-address" />
                </label>
              </div>

              {message ? <div className="ticket-customer-message ticket-customer-create-message" role="status">{message}</div> : null}

              <button type="submit" className="primary-button ticket-customer-create-submit" disabled={busy || submitting}>
                {submitting ? "جارٍ الحفظ والإضافة…" : "حفظ وإضافة إلى التذكرة"}
              </button>
            </form>
          </div>
        )}
      </section>
    </div>
  );
}
