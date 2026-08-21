import { useEffect, useRef, useState } from "react";
import type { EffectiveDeliveryChannel } from "../../../contracts/posConfiguration";
import type { DeliveryCollectionRecord, DeliveryMerchantCollection } from "../../../contracts/deliveryCollection";
import { ConfiguredPaymentMethodRail } from "./components/ConfiguredPaymentMethodRail";
import { InlineCheckoutRail } from "./components/InlineCheckoutRail";
import { LocalServiceEnhancer } from "./components/LocalServiceEnhancer";
import { ManagerOverrideDialog } from "./components/ManagerOverrideDialog";
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
import { useManagerOverrideGate } from "./state/useManagerOverrideGate";
import { usePosFlow } from "./state/usePosFlow";

prepareRestaurantServiceCompatibility();

const commandId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;

export default function App() {
  const legacyOrderTypeFixture = useRef(import.meta.env.MODE === "test" && window.localStorage.getItem(LEGACY_ORDER_TYPES_KEY) !== null).current;
  const [posRuntime] = useState(createPosRuntimeAdapter);
  const [restaurantService] = useState(createRestaurantServiceAdapter);
  const [paymentContextError, setPaymentContextError] = useState<string | null>(null);
  const [completedDelivery, setCompletedDelivery] = useState<DeliveryCollectionRecord | null>(null);
  const flow = usePosFlow(posRuntime);
  const effectiveConfiguration = useEffectivePosConfiguration(posRuntime, flow.device);
  const managerOverride = useManagerOverrideGate(posRuntime, flow.employee, flow.device);
  const local = useLocalServiceFlow(flow, restaurantService);
  const lastSaleTicket = useRef(flow.ticket);

  if (flow.ticket) {
    lastSaleTicket.current = flow.ticket;
  }

  useEffect(() => installQuantityKeypad(), []);

  useEffect(() => {
    let active = true;
    if (flow.stage !== "success" || !flow.receipt) {
      setCompletedDelivery(null);
      return () => { active = false; };
    }

    void posRuntime.deliveryCollection.readForReceipt({ receiptId: flow.receipt.id })
      .then((record) => { if (active) setCompletedDelivery(record); })
      .catch(() => { if (active) setCompletedDelivery(null); });

    return () => { active = false; };
  }, [flow.stage, flow.receipt?.id, posRuntime]);

  useEffect(() => {
    if (flow.stage !== "success") return;
    setPaymentContextError(null);
  }, [flow.stage]);

  const inlineCheckoutStage = flow.stage === "payment" || flow.stage === "cash" || flow.stage === "card" || flow.stage === "success"
    ? flow.stage
    : null;
  const saleTicket = flow.ticket ?? (flow.stage === "success" ? lastSaleTicket.current : null);

  const managerOverrideDialog = managerOverride.request ? (
    <ManagerOverrideDialog
      request={managerOverride.request}
      busy={managerOverride.busy}
      errorMessage={managerOverride.errorMessage}
      onDismissError={managerOverride.clearError}
      onApprove={managerOverride.approve}
      onCancel={managerOverride.cancel}
    />
  ) : null;

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
    const creditEnabled = effectiveConfiguration.configuration?.paymentMethods.some((method) =>
      method.enabled && (method.systemDefault === "credit" || method.kind === "customer-credit")) ?? false;

    const clearDeliveryForDirectPayment = async () => {
      await posRuntime.deliveryCollection.clearForTicket({
        commandId: commandId("delivery-direct-clear"),
        ticketId: saleTicket.id,
      });
    };

    const selectDirectPayment = async (method: "cash" | "card") => {
      setPaymentContextError(null);
      try {
        await clearDeliveryForDirectPayment();
        if (method === "cash") await flow.selectCash();
        else await flow.selectCard();
      } catch (error) {
        setPaymentContextError(error instanceof Error ? error.message : "تعذر تجهيز سياق الدفع المحلي.");
      }
    };

    const selectDeliveryCollection = async (
      channel: EffectiveDeliveryChannel,
      merchantCollection: DeliveryMerchantCollection,
    ) => {
      setPaymentContextError(null);
      try {
        await posRuntime.deliveryCollection.setForTicket({
          commandId: commandId("delivery-collection"),
          ticketId: saleTicket.id,
          channelId: channel.id,
          channelName: channel.name,
          channelKind: channel.kind,
          merchantCollection,
        });
        if (merchantCollection === "cash") await flow.selectCash();
        else await flow.selectCard();
      } catch (error) {
        setPaymentContextError(error instanceof Error ? error.message : "تعذر حفظ قناة التوصيل محليًا.");
      }
    };

    const switchCheckoutMethod = async (method: "cash" | "card") => {
      setPaymentContextError(null);
      try {
        const current = await posRuntime.deliveryCollection.readForTicket({ ticketId: saleTicket.id });
        if (current) {
          await posRuntime.deliveryCollection.setForTicket({
            commandId: commandId("delivery-collection-switch"),
            ticketId: saleTicket.id,
            channelId: current.channelId,
            channelName: current.channelName,
            channelKind: current.channelKind,
            merchantCollection: method,
          });
        }
        if (method === "cash") await flow.selectCash();
        else await flow.selectCard();
      } catch (error) {
        setPaymentContextError(error instanceof Error ? error.message : "تعذر تغيير طريقة تحصيل طلب التوصيل.");
      }
    };

    const chargeCreditInline = async (customerId: string) => {
      setPaymentContextError(null);
      try {
        await clearDeliveryForDirectPayment();
        local.markSettlementPending(saleTicket.sequence);
        return await flow.chargeTicketToCustomer(customerId);
      } catch (error) {
        setPaymentContextError(error instanceof Error ? error.message : "تعذر تجهيز البيع الآجل.");
        return null;
      }
    };

    const returnPaymentToSales = async () => {
      setPaymentContextError(null);
      try {
        await clearDeliveryForDirectPayment();
        flow.returnToSales();
      } catch (error) {
        setPaymentContextError(error instanceof Error ? error.message : "تعذر إغلاق سياق الدفع.");
      }
    };

    const startFreshSale = () => {
      local.abandonActiveResume();
      local.clearCheckoutContext();
      setPaymentContextError(null);
      void flow.newSale();
    };

    const authorizeSaleCompletion = () => managerOverride.requirePermission({
      capability: "accept-payment",
      commandId: commandId("accept-payment"),
      title: "اعتماد الدفع",
      targetType: "ticket",
      targetId: saleTicket.id,
    });

    const beginAuthorizedCheckout = async () => {
      if (!(await authorizeSaleCompletion())) return false;
      await flow.beginCheckout();
      return true;
    };

    const beginAuthorizedRestaurantLocalCheckout = async () => {
      if (!(await authorizeSaleCompletion())) return false;
      return local.beginSimpleLocalCheckout();
    };

    const beginAuthorizedRestaurantDirectCheckout = async () => {
      if (!(await authorizeSaleCompletion())) return false;
      local.prepareDirectCheckout();
      await flow.beginCheckout();
      return true;
    };

    const chargeCreditFromTicket = async (customerId: string) => {
      if (!(await authorizeSaleCompletion())) return null;
      return chargeCreditInline(customerId);
    };

    return (
      <>
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
              onCheckout={() => void beginAuthorizedCheckout()}
              onOpenReceipts={() => void flow.openReceipts()}
              onSearchCustomers={flow.searchCustomers}
              onCreateCustomer={flow.createCustomer}
              onSetTicketCustomer={flow.setTicketCustomer}
              onLoadCustomerLedger={flow.loadCustomerLedger}
              onChargeCredit={chargeCreditFromTicket}
              onSettleDebt={flow.settleCustomerDebt}
              onPrintDebtCollection={flow.printDebtCollectionReceipt}
              local={local}
              creditEnabled={creditEnabled}
              onRestaurantLocalCheckout={beginAuthorizedRestaurantLocalCheckout}
              onRestaurantDirectCheckout={beginAuthorizedRestaurantDirectCheckout}
            />

            <LocalServiceEnhancer local={local} legacyFixture={legacyOrderTypeFixture} />

            {inlineCheckoutStage === "payment" ? (
              <ConfiguredPaymentMethodRail
                ticket={saleTicket}
                paymentMethods={effectiveConfiguration.configuration?.paymentMethods ?? []}
                delivery={effectiveConfiguration.configuration?.delivery}
                serviceMode={local.checkoutServiceContext?.mode ?? null}
                serviceLabel={local.checkoutServiceContext?.label ?? null}
                configurationLoading={effectiveConfiguration.loading}
                configurationError={effectiveConfiguration.errorMessage}
                busy={flow.busy}
                errorMessage={paymentContextError ?? flow.errorMessage}
                onDismissError={() => {
                  setPaymentContextError(null);
                  flow.clearError();
                }}
                onBackToSales={() => void returnPaymentToSales()}
                onCash={() => void selectDirectPayment("cash")}
                onCard={() => void selectDirectPayment("card")}
                onSearchCustomers={flow.searchCustomers}
                onCreateCustomer={(name, mobile) => flow.createCustomer(name, mobile)}
                onChargeCredit={chargeCreditInline}
                onDeliveryCollect={(channel, merchantCollection) => void selectDeliveryCollection(channel, merchantCollection)}
              />
            ) : inlineCheckoutStage ? (
              <InlineCheckoutRail
                stage={inlineCheckoutStage}
                ticket={saleTicket}
                receipt={flow.receipt}
                deliveryContext={completedDelivery}
                serviceLabel={local.checkoutServiceContext?.label ?? null}
                printStatus={flow.printStatus}
                busy={flow.busy}
                errorMessage={paymentContextError ?? flow.errorMessage}
                onDismissError={() => {
                  setPaymentContextError(null);
                  flow.clearError();
                }}
                onBackToSales={() => void returnPaymentToSales()}
                onBackToPayment={flow.returnToPayment}
                onCash={() => void switchCheckoutMethod("cash")}
                onCard={() => void switchCheckoutMethod("card")}
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
        {managerOverrideDialog}
      </>
    );
  }

  if (flow.stage === "receipts") {
    const printWithAuthorization = async (receiptId: string) => {
      const approved = await managerOverride.requirePermission({
        capability: "reprint-resend-receipts",
        commandId: commandId("reprint-authorization"),
        title: "إعادة طباعة الإيصال",
        targetType: "receipt",
        targetId: receiptId,
      });
      if (!approved) return "idle" as const;
      return flow.printArchivedReceipt(receiptId);
    };

    return (
      <>
        <ReceiptsScreen
          receipts={flow.receipts}
          busy={flow.busy}
          onBack={flow.returnToSales}
          onPrint={printWithAuthorization}
        />
        {managerOverrideDialog}
      </>
    );
  }

  if (flow.stage === "success" && flow.receipt) {
    return (
      <SuccessScreen
        receipt={flow.receipt}
        deliveryContext={completedDelivery}
        printStatus={flow.printStatus}
        busy={flow.busy !== null}
        onPrint={() => void flow.printReceipt()}
        onEmailReceipt={flow.emailReceipt}
        onNewSale={() => {
          local.abandonActiveResume();
          local.clearCheckoutContext();
          setPaymentContextError(null);
          void flow.newSale();
        }}
      />
    );
  }

  return <div className="app-loading">جارٍ استعادة نقطة البيع…</div>;
}
