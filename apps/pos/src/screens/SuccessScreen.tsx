import { useState } from "react";
import type { DeliveryCollectionRecord } from "../../../../contracts/deliveryCollection";
import { Brand } from "../components/Brand";
import { Icon } from "../components/Icon";
import { SaleCompletionDetails } from "../components/SaleCompletionDetails";
import type { PrintDeliveryStatus, Receipt } from "../domain/models";
import { readPrintReceiptAlways, writePrintReceiptAlways } from "../domain/posPreferences";

type SuccessScreenProps = {
  receipt: Receipt;
  deliveryContext?: DeliveryCollectionRecord | null;
  printStatus: PrintDeliveryStatus;
  busy: boolean;
  onPrint: () => void;
  onEmailReceipt: (email: string) => Promise<boolean>;
  onNewSale: () => void;
};

export function SuccessScreen({ receipt, deliveryContext, printStatus, busy, onPrint, onEmailReceipt, onNewSale }: SuccessScreenProps) {
  const [printAlways, setPrintAlways] = useState(readPrintReceiptAlways);
  const [email, setEmail] = useState(receipt.customer?.details.email ?? "");
  const [emailMessage, setEmailMessage] = useState<string | null>(null);
  const [emailSending, setEmailSending] = useState(false);

  const updatePrintAlways = (enabled: boolean) => {
    setPrintAlways(enabled);
    writePrintReceiptAlways(enabled);
  };

  const sendEmail = async () => {
    if (!email.trim() || emailSending) return;
    setEmailSending(true);
    setEmailMessage(null);
    const sent = await onEmailReceipt(email.trim());
    setEmailSending(false);
    setEmailMessage(sent ? "تم إرسال الإيصال إلى البريد الإلكتروني." : "تعذر إرسال الإيصال. تحقق من البريد وحاول مرة أخرى.");
  };

  return (
    <main className="success-screen" data-screen-id="POS-SCREEN-011">
      <header className="success-header"><Brand compact /><span>رفاد POS</span></header>
      <section className="success-card sale-completion-shell" aria-label="اكتملت عملية البيع">
        <SaleCompletionDetails
          receipt={receipt}
          deliveryContext={deliveryContext}
          printStatus={printStatus}
          busy={busy}
          email={email}
          emailMessage={emailMessage}
          emailSending={emailSending}
          printAlways={printAlways}
          onEmailChange={setEmail}
          onSendEmail={() => void sendEmail()}
          onPrintAlwaysChange={updatePrintAlways}
        />

        <div className="success-actions success-actions--touch">
          <button type="button" className="secondary-button" onClick={onPrint} disabled={busy}><Icon name="printer" size={20} />{printStatus === "failed" ? "إعادة الطباعة" : "طباعة الإيصال"}</button>
          <button type="button" className="primary-button" onClick={onNewSale} disabled={busy}><Icon name="plus" size={20} />بيع جديد</button>
        </div>
      </section>
    </main>
  );
}
