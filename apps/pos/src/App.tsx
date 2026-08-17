import { useRef } from "react";
import { InlineCheckoutRail } from "./components/InlineCheckoutRail";
import { PinScreen } from "./screens/PinScreen";
import { ReceiptsScreen } from "./screens/ReceiptsScreen";
import { SalesScreen } from "./screens/SalesScreen";
import { SignInScreen } from "./screens/SignInScreen";
import { SuccessScreen } from "./screens/SuccessScreen";
import { CustomerFlowProvider } from "./state/CustomerFlowContext";
import { usePosFlow } from "./state/usePosFlow";

export default function App() {
  const flow = usePosFlow();
  const lastSaleTicket = useRef(flow.ticket);

  if (flow.ticket) {
    lastSaleTicket.current = flow.ticket;
  }

  const inlineCheckoutStage = flow.stage === "payment" || flow.stage === "cash" || flow.stage === "success"
    ? flow.stage
    : null;
  const saleTicket = flow.ticket ?? (flow.stage === "success" ? lastSaleTicket.current : null);

  if (flow.stage === "sign-in") {
    return (
      <SignInScreen
        busy={flow.busy === "sign-in"}
        errorMessage={flow.errorMessage}
        onDismissError={flow.clearError}
        onSubmit={flow.signIn}
      />
    );
  }

  if (flow.stage === "pin") {
    return (
      <PinScreen
        device={flow.device}
        busy={flow.busy === "pin"}
        errorMessage={flow.errorMessage}
        onDismissError={flow.clearError}
        onSubmit={flow.unlock}
      />
    );
  }

  if ((flow.stage === "sales" || inlineCheckoutStage) && saleTicket) {
    // The original basket is covered by the checkout rail. After completion we
    // keep the catalog visible but clear hidden ticket text so the success rail
    // is the single semantic source for customer/payment summary information.
    const backgroundTicket = inlineCheckoutStage === "success"
      ? { ...saleTicket, lines: [], customer: null }
      : saleTicket;

    return (
      <CustomerFlowProvider value={{
        ticket: saleTicket,
        updateCustomer: flow.updateCustomer,
        applyLoyaltyRedemption: flow.applyLoyaltyRedemption,
        loadLoyaltyStatus: flow.loadLoyaltyStatus,
        quoteLoyaltyRedemption: flow.quoteLoyaltyRedemption,
        loadCustomerPurchases: flow.loadCustomerPurchases,
      }}>
        <div className={`sale-flow-shell ${inlineCheckoutStage ? "sale-flow-shell--checkout" : ""}`}>
          <SalesScreen
            employee={flow.employee}
            ticket={backgroundTicket}
            products={flow.products}
            allProducts={flow.allProducts}
            salePages={flow.salePages}
            activePageId={flow.activePageId}
            query={flow.query}
            busy={flow.busy}
            errorMessage={inlineCheckoutStage ? null : flow.errorMessage}
            lastTouchedLineId={flow.lastTouchedLineId}
            onDismissError={flow.clearError}
            onQueryChange={flow.setQuery}
            onPageChange={flow.setActivePageId}
            onCreatePage={flow.createSalePage}
            onRenamePage={flow.renameSalePage}
            onDeletePage={flow.deleteSalePage}
            onMovePage={flow.moveSalePage}
            onPlacePageProduct={(pageId, slotIndex, productId) => void flow.placeSalePageProduct(pageId, slotIndex, productId)}
            onRemovePageProduct={(pageId, slotIndex) => void flow.removeSalePageProduct(pageId, slotIndex)}
            onAddProduct={(id) => void flow.addProduct(id)}
            onSetQuantity={(id, value) => void flow.setQuantity(id, value)}
            onRemoveLine={(id) => void flow.removeLine(id)}
            onSaveTicket={() => void flow.saveOpenTicket()}
            onCheckout={() => void flow.beginCheckout()}
            onOpenReceipts={() => void flow.openReceipts()}
            onSearchCustomers={flow.searchCustomers}
            onCreateCustomer={flow.createCustomer}
            onSetTicketCustomer={flow.setTicketCustomer}
            onLoadCustomerLedger={flow.loadCustomerLedger}
            onChargeCredit={flow.chargeTicketToCustomer}
            onSettleDebt={flow.settleCustomerDebt}
          />

          {inlineCheckoutStage ? (
            <InlineCheckoutRail
              stage={inlineCheckoutStage}
              ticket={saleTicket}
              receipt={flow.receipt}
              printStatus={flow.printStatus}
              busy={flow.busy}
              errorMessage={flow.errorMessage}
              onDismissError={flow.clearError}
              onBackToSales={flow.returnToSales}
              onBackToPayment={flow.returnToPayment}
              onCash={() => void flow.selectCash()}
              onCompleteCash={(value) => void flow.completeCash(value)}
              onPrint={() => void flow.printReceipt()}
              onEmailReceipt={flow.emailReceipt}
              onNewSale={() => void flow.newSale()}
            />
          ) : null}
        </div>
      </CustomerFlowProvider>
    );
  }

  if (flow.stage === "receipts") {
    return (
      <ReceiptsScreen
        receipts={flow.receipts}
        busy={flow.busy}
        onBack={flow.returnToSales}
        onPrint={flow.printArchivedReceipt}
      />
    );
  }

  // Cold restoration can contain a completed receipt without the previous visual ticket.
  // Keep the standalone summary as a safe fallback for that recovery-only case.
  if (flow.stage === "success" && flow.receipt) {
    return (
      <SuccessScreen
        receipt={flow.receipt}
        printStatus={flow.printStatus}
        busy={flow.busy !== null}
        onPrint={() => void flow.printReceipt()}
        onEmailReceipt={flow.emailReceipt}
        onNewSale={() => void flow.newSale()}
      />
    );
  }

  return <div className="app-loading">جارٍ استعادة نقطة البيع…</div>;
}
