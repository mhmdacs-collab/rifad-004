import { CashPaymentScreen } from "./screens/CashPaymentScreen";
import { PaymentScreen } from "./screens/PaymentScreen";
import { PinScreen } from "./screens/PinScreen";
import { SalesScreen } from "./screens/SalesScreen";
import { SignInScreen } from "./screens/SignInScreen";
import { SuccessScreen } from "./screens/SuccessScreen";
import { usePosFlow } from "./state/usePosFlow";

export default function App() {
  const flow = usePosFlow();

  if (flow.stage === "sign-in") {
    return <SignInScreen busy={flow.busy === "sign-in"} errorMessage={flow.errorMessage} onDismissError={flow.clearError} onSubmit={flow.signIn} />;
  }
  if (flow.stage === "pin") {
    return <PinScreen device={flow.device} busy={flow.busy === "pin"} errorMessage={flow.errorMessage} onDismissError={flow.clearError} onSubmit={flow.unlock} />;
  }
  if (flow.stage === "sales" && flow.ticket) {
    return <SalesScreen employee={flow.employee} ticket={flow.ticket} products={flow.products} categories={flow.categories} query={flow.query} categoryId={flow.categoryId} busy={flow.busy} errorMessage={flow.errorMessage} onDismissError={flow.clearError} onQueryChange={flow.setQuery} onCategoryChange={flow.setCategoryId} onAddProduct={(id) => void flow.addProduct(id)} onSetQuantity={(id, value) => void flow.setQuantity(id, value)} onRemoveLine={(id) => void flow.removeLine(id)} onCheckout={() => void flow.beginCheckout()} />;
  }
  if (flow.stage === "payment" && flow.ticket) {
    return <PaymentScreen ticket={flow.ticket} busy={flow.busy === "cash-method"} errorMessage={flow.errorMessage} onDismissError={flow.clearError} onBack={flow.returnToSales} onCash={() => void flow.selectCash()} />;
  }
  if (flow.stage === "cash" && flow.ticket) {
    return <CashPaymentScreen ticket={flow.ticket} busy={flow.busy === "complete-cash"} errorMessage={flow.errorMessage} onDismissError={flow.clearError} onBack={flow.returnToPayment} onComplete={(value) => void flow.completeCash(value)} />;
  }
  if (flow.stage === "success" && flow.receipt) {
    return <SuccessScreen receipt={flow.receipt} printStatus={flow.printStatus} busy={flow.busy !== null} onPrint={() => void flow.printReceipt()} onNewSale={() => void flow.newSale()} />;
  }
  return <div className="app-loading">جارٍ استعادة نقطة البيع…</div>;
}
