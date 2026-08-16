import { CashPaymentScreen } from "./screens/CashPaymentScreen";
import { PaymentScreen } from "./screens/PaymentScreen";
import { PinScreen } from "./screens/PinScreen";
import { ReceiptsScreen } from "./screens/ReceiptsScreen";
import { SalesScreen } from "./screens/SalesScreen";
import { SignInScreen } from "./screens/SignInScreen";
import { SuccessScreen } from "./screens/SuccessScreen";
import { CustomerFlowProvider } from "./state/CustomerFlowContext";
import { usePosFlow } from "./state/usePosFlow";

export default function App() {
  const flow = usePosFlow();

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

  if (flow.stage === "sales" && flow.ticket) {
    return (
      <CustomerFlowProvider value={{
        ticket: flow.ticket,
        updateCustomer: flow.updateCustomer,
        applyLoyaltyRedemption: flow.applyLoyaltyRedemption,
        loadLoyaltyStatus: flow.loadLoyaltyStatus,
        quoteLoyaltyRedemption: flow.quoteLoyaltyRedemption,
        loadCustomerPurchases: flow.loadCustomerPurchases,
      }}>
        <SalesScreen
          employee={flow.employee}
          ticket={flow.ticket}
          products={flow.products}
          allProducts={flow.allProducts}
          salePages={flow.salePages}
          activePageId={flow.activePageId}
          query={flow.query}
          busy={flow.busy}
          errorMessage={flow.errorMessage}
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

  if (flow.stage === "payment" && flow.ticket) {
    return (
      <PaymentScreen
        ticket={flow.ticket}
        busy={flow.busy === "cash-method"}
        errorMessage={flow.errorMessage}
        onDismissError={flow.clearError}
        onBack={flow.returnToSales}
        onCash={() => void flow.selectCash()}
      />
    );
  }

  if (flow.stage === "cash" && flow.ticket) {
    return (
      <CashPaymentScreen
        ticket={flow.ticket}
        busy={flow.busy === "complete-cash"}
        errorMessage={flow.errorMessage}
        onDismissError={flow.clearError}
        onBack={flow.returnToPayment}
        onComplete={(value) => void flow.completeCash(value)}
      />
    );
  }

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
