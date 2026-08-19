import { useEffect, useRef, useState } from "react";
import { InlineCheckoutRail } from "./components/InlineCheckoutRail";
import { LocalServiceEnhancer } from "./components/LocalServiceEnhancer";
import { TransactionOperationEnhancer } from "./components/TransactionOperationEnhancer";
import { installQuantityKeypad } from "./quantity-keypad";
import { createPosRuntimeAdapter } from "./runtime/posRuntimeAdapter";
import {
  createRestaurantServiceAdapter,
  LEGACY_ORDER_TYPES_KEY,
  prepareRestaurantServiceCompatibility,
} from "./runtime/restaurantServiceAdapter";
import { PinScreen } from "./screens/PinScreen";
import { ReceiptsScreen } from "./screens/ReceiptsScreen";
import { SalesScreen } from "./screens/SalesScreen";
import { SignInScreen } from "./screens/SignInScreen";
import { SuccessScreen } from "./screens/SuccessScreen";
import { CustomerFlowProvider } from "./state/CustomerFlowContext";
import { useEffectivePosConfiguration } from "./state/useEffectivePosConfiguration";
import { useLocalServiceFlow } from "./state/useLocalServiceFlow";
import { usePosFlow } from "./state/usePosFlow";

prepareRestaurantServiceCompatibility();

export default function App() {
  const legacyOrderTypeFixture = useRef(import.meta.env.MODE === "test" && window.localStorage.getItem(LEGACY_ORDER_TYPES_KEY) !== null).current;
  const [posRuntime] = useState(createPosRuntimeAdapter);
  const [restaurantService] = useState(createRestaurantServiceAdapter);
  const flow = usePosFlow(posRuntime);
  const effectiveConfiguration = useEffectivePosConfiguration(posRuntime, flow.device);
  const local = useLocalServiceFlow(flow, restaurantService);
  const lastSaleTicket = useRef(flow.ticket);

  if (flow.ticket) {
    lastSaleTicket.current = flow.ticket;
  }

  useEffect(() => installQuantityKeypad(), []);

  useEffect(() => {
    if (flow.stage !== "success") return;
    const printButton = document.querySelector<HTMLButtonElement>(".inline-success-print");
    printButton?.setAttribute("aria-label", "طباعة الإيصال");
  }, [flow.stage, flow.printStatus]);

  const inlineCheckoutStage = flow.stage === "payment" || flow.stage === "cash" || flow.stage === "card" || flow.stage === "success"
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
    const backgroundTicket = inlineCheckoutStage === "success"
      ? { ...saleTicket, lines: [], customer: null }
      : saleTicket;

    const startFreshSale = () => {
      local.abandonActiveResume();
      local.clearCheckoutContext();
      void flow.newSale();
    };

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

          <TransactionOperationEnhancer
            showClearCart={flow.stage === "sales" && saleTicket.lines.length > 0}
            onClearCart={async () => {
              await Promise.all(saleTicket.lines.map((line) => flow.removeLine(line.id)));
            }}
          />

          <LocalServiceEnhancer ticket={saleTicket} local={local} legacyFixture={legacyOrderTypeFixture} />

          {inlineCheckoutStage ? (
            <InlineCheckoutRail
              stage={inlineCheckoutStage}
              ticket={saleTicket}
              receipt={flow.receipt}
              printStatus={flow.printStatus}
              busy={flow.busy}
              errorMessage={flow.errorMessage}
              configurationError={effectiveConfiguration.errorMessage}
              paymentMethods={effectiveConfiguration.configuration?.paymentMethods ?? []}
              onDismissError={flow.clearError}
              onBackToSales={flow.returnToSales}
              onBackToPayment={flow.returnToPayment}
              onCash={() => void flow.selectCash()}
              onCard={() => void flow.selectCard()}
              onCompleteCash={async (value) => {
                local.markSettlementPending(saleTicket.sequence);
                await flow.completeCash(value);
              }}
              onCompleteCard={async () => {
                local.markSettlementPending(saleTicket.sequence);
                await flow.completeCard();
              }}
              onPrint={() => void flow.printReceipt()}
              onEmailReceipt={flow.emailReceipt}
              onNewSale={startFreshSale}
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

  if (flow.stage === "success" && flow.receipt) {
    return (
      <SuccessScreen
        receipt={flow.receipt}
        printStatus={flow.printStatus}
        busy={flow.busy !== null}
        onPrint={() => void flow.printReceipt()}
        onEmailReceipt={flow.emailReceipt}
        onNewSale={() => {
          local.abandonActiveResume();
          local.clearCheckoutContext();
          void flow.newSale();
        }}
      />
    );
  }

  return <div className="app-loading">جارٍ استعادة نقطة البيع…</div>;
}
