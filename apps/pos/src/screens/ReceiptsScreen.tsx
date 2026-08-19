import { useState } from "react";
import { Icon } from "../components/Icon";
import { MoneyAmount } from "../components/MoneyAmount";
import type { PrintDeliveryStatus, Receipt } from "../domain/models";

type ReceiptsScreenProps = {
  receipts: readonly Receipt[];
  busy: string | null;
  onBack: () => void;
  onPrint: (receiptId: string) => Promise<PrintDeliveryStatus>;
};

const formatDateTime = (value: string) => new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
}).format(new Date(value));

export function ReceiptsScreen({ receipts, busy, onBack, onPrint }: ReceiptsScreenProps) {
  const [statuses, setStatuses] = useState<Record<string, PrintDeliveryStatus>>({});
  const [confirmUnknownId, setConfirmUnknownId] = useState<string | null>(null);

  const print = async (receipt: Receipt) => {
    if (statuses[receipt.id] === "delivery-unknown" && confirmUnknownId !== receipt.id) {
      setConfirmUnknownId(receipt.id);
      return;
    }
    setConfirmUnknownId(null);
    const status = await onPrint(receipt.id);
    setStatuses((current) => ({ ...current, [receipt.id]: status }));
  };

  return (
    <main className="receipts-screen" data-screen-id="POS-SCREEN-016">
      <header className="receipts-header">
        <button type="button" className="appbar-icon" onClick={onBack} aria-label="العودة إلى المبيعات"><Icon name="arrow" /></button>
        <strong>الإيصالات</strong>
      </header>

      <section className="receipts-content">
        {receipts.length === 0 ? (
          <div className="receipts-empty">
            <Icon name="receipt" size={42} />
            <strong>لا توجد إيصالات بعد</strong>
            <span>ستظهر هنا العمليات المكتملة ويمكن إعادة طباعة أي إيصال منها.</span>
          </div>
        ) : (
          <div className="receipts-list">
            {receipts.map((receipt) => {
              const status = statuses[receipt.id];
              const isBusy = busy === `print-receipt:${receipt.id}`;
              const needsConfirm = status === "delivery-unknown" && confirmUnknownId === receipt.id;
              return (
                <article className="receipt-row" key={receipt.id}>
                  <div className="receipt-row-main">
                    <strong dir="ltr">{receipt.number}</strong>
                    <span dir="ltr">{formatDateTime(receipt.completedAt)}</span>
                    <small>{receipt.employeeName} · {receipt.branchName}</small>
                    {receipt.customer ? <small className="receipt-customer"><Icon name="user" size={14} />{receipt.customer.name} · <span dir="ltr">{receipt.customer.mobile}</span></small> : null}
                  </div>
                  <div className="receipt-row-total"><MoneyAmount value={receipt.total} /></div>
                  <div className="receipt-row-print">
                    {needsConfirm ? <small className="receipt-print-warning">قد يكون الإيصال طُبع بالفعل. اضغط مرة أخرى للتأكيد.</small> : null}
                    {status === "failed" ? <small className="receipt-print-failed">تعذرت الطباعة.</small> : null}
                    {status === "queued" || status === "printed" ? <small className="receipt-print-ok">تم إرسال الإيصال للطابعة.</small> : null}
                    <button type="button" onClick={() => void print(receipt)} disabled={isBusy}>
                      <Icon name="printer" size={18} />
                      {needsConfirm ? "تأكيد إعادة الطباعة" : status === "failed" ? "إعادة الطباعة" : "طباعة"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
