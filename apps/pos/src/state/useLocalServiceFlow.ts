import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RestaurantServiceContract } from "../contracts/restaurantService";
import { PosContractError } from "../contracts/pos";
import type { OpenLocalOrder, PlaceGroup, RestaurantServiceConfig } from "../domain/restaurantService";
import type { usePosFlow } from "./usePosFlow";

type PosFlow = ReturnType<typeof usePosFlow>;
type CheckoutServiceContext = Readonly<{
  mode: "takeaway" | "dine_in";
  label: string;
}> | null;

const commandId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;
const localMessage = (error: unknown) => error instanceof PosContractError ? error.message : "تعذر تنفيذ العملية المحلية. حاول مرة أخرى.";

const INITIAL_CONFIG: RestaurantServiceConfig = {
  restaurantServiceEnabled: true,
  placeManagementEnabled: true,
};

/**
 * Restaurant/local orchestration depends only on the Rifad contract supplied by
 * the application composition root. It must not know which concrete adapter is active.
 */
export const useLocalServiceFlow = (flow: PosFlow, service: RestaurantServiceContract) => {
  const [config, setConfig] = useState<RestaurantServiceConfig>(INITIAL_CONFIG);
  const [placeGroups, setPlaceGroups] = useState<readonly PlaceGroup[]>([]);
  const [openLocalOrders, setOpenLocalOrders] = useState<readonly OpenLocalOrder[]>([]);
  const [activeOpenOrder, setActiveOpenOrder] = useState<OpenLocalOrder | null>(null);
  const [checkoutServiceContext, setCheckoutServiceContext] = useState<CheckoutServiceContext>(null);
  const [pendingSettlementSequence, setPendingSettlementSequence] = useState<number | null>(null);
  const settlementClosing = useRef(false);
  const [localBusy, setLocalBusy] = useState<string | null>(null);
  const [localNotice, setLocalNotice] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [nextConfig, groups, orders] = await Promise.all([
      service.getConfig(),
      service.listPlaceGroups(),
      service.listOpenOrders(),
    ]);
    setConfig(nextConfig);
    setPlaceGroups(groups);
    setOpenLocalOrders(orders);
  }, [service]);

  useEffect(() => {
    void refresh().catch((error: unknown) => setLocalError(localMessage(error)));
  }, [refresh]);

  useEffect(() => {
    if (!localNotice) return;
    const timer = window.setTimeout(() => setLocalNotice(null), 3200);
    return () => window.clearTimeout(timer);
  }, [localNotice]);

  const updateConfig = useCallback(async (next: RestaurantServiceConfig) => {
    setLocalBusy("config");
    setLocalError(null);
    try {
      const saved = await service.updateConfig({ config: next });
      setConfig(saved);
      return true;
    } catch (error) {
      setLocalError(localMessage(error));
      return false;
    } finally {
      setLocalBusy(null);
    }
  }, [service]);

  const prepareDirectCheckout = useCallback(() => {
    if (activeOpenOrder) {
      setCheckoutServiceContext({ mode: "dine_in", label: `محلي · ${activeOpenOrder.servicePlaceName}` });
      return;
    }
    setCheckoutServiceContext(config.restaurantServiceEnabled
      ? { mode: "takeaway", label: "سفري" }
      : null);
  }, [activeOpenOrder, config.restaurantServiceEnabled]);

  const beginSimpleLocalCheckout = useCallback(async () => {
    if (!flow.ticket || flow.ticket.lines.length === 0) return false;
    setCheckoutServiceContext({ mode: "dine_in", label: "محلي" });
    await flow.beginCheckout();
    return true;
  }, [flow]);

  const assignToPlace = useCallback(async (servicePlaceId: string) => {
    const ticket = flow.ticket;
    if (!ticket || ticket.lines.length === 0) return false;
    setLocalBusy("assign-place");
    setLocalError(null);
    try {
      const order = await service.createOpenOrder({
        commandId: commandId("local-order"),
        ticket,
        servicePlaceId,
      });
      setOpenLocalOrders(await service.listOpenOrders());
      setLocalNotice(`تم إرسال الطلب للمطبخ · ${order.servicePlaceName}`);
      setCheckoutServiceContext(null);
      await flow.newSale();
      return true;
    } catch (error) {
      setLocalError(localMessage(error));
      return false;
    } finally {
      setLocalBusy(null);
    }
  }, [flow, service]);

  const rebuildOpenOrderIntoWorkingTicket = useCallback(async (order: OpenLocalOrder) => {
    const current = flow.ticket;
    if (!current || current.lines.length > 0) {
      setLocalError("ابدأ من سلة فارغة قبل فتح طلب محلي محفوظ.");
      return false;
    }

    for (const line of order.ticket.lines) {
      for (let index = 0; index < line.quantity; index += 1) {
        await flow.addProduct(line.productId);
      }
    }
    if (order.ticket.customer) {
      await flow.setTicketCustomer(order.ticket.customer.id);
    }
    return true;
  }, [flow]);

  const resumeOpenOrder = useCallback(async (openOrderId: string) => {
    setLocalBusy("resume-order");
    setLocalError(null);
    try {
      const order = await service.getOpenOrder({ openOrderId });
      const rebuilt = await rebuildOpenOrderIntoWorkingTicket(order);
      if (!rebuilt) return false;
      setActiveOpenOrder(order);
      setCheckoutServiceContext({ mode: "dine_in", label: `محلي · ${order.servicePlaceName}` });
      setLocalNotice(`تم فتح ${order.servicePlaceName}`);
      return true;
    } catch (error) {
      setLocalError(localMessage(error));
      return false;
    } finally {
      setLocalBusy(null);
    }
  }, [rebuildOpenOrderIntoWorkingTicket, service]);

  const sendOpenOrderUpdate = useCallback(async () => {
    if (!activeOpenOrder || !flow.ticket || flow.ticket.lines.length === 0) return false;
    setLocalBusy("send-order-update");
    setLocalError(null);
    try {
      const updated = await service.updateOpenOrder({
        commandId: commandId("local-order-update"),
        openOrderId: activeOpenOrder.id,
        ticket: flow.ticket,
      });
      setOpenLocalOrders(await service.listOpenOrders());
      setActiveOpenOrder(null);
      setCheckoutServiceContext(null);
      setLocalNotice(`تم إرسال التحديث للمطبخ · ${updated.servicePlaceName}`);
      await flow.newSale();
      return true;
    } catch (error) {
      setLocalError(localMessage(error));
      return false;
    } finally {
      setLocalBusy(null);
    }
  }, [activeOpenOrder, flow, service]);

  /**
   * Called immediately before final local-order payment. Completion is observed
   * through Rifad POS state, never by reading a mock adapter's persistence.
   */
  const markSettlementPending = useCallback((ticketSequence: number) => {
    if (!activeOpenOrder) return;
    setPendingSettlementSequence(ticketSequence);
  }, [activeOpenOrder]);

  useEffect(() => {
    if (pendingSettlementSequence === null || !activeOpenOrder || settlementClosing.current) return;
    const expectedReceipt = `R-${String(pendingSettlementSequence).padStart(5, "0")}`;
    const completedWithReceipt = flow.receipt?.number === expectedReceipt;
    const completedIntoFreshSale = flow.stage === "sales"
      && Boolean(flow.ticket)
      && flow.ticket!.sequence !== pendingSettlementSequence;
    if (!completedWithReceipt && !completedIntoFreshSale) return;

    settlementClosing.current = true;
    const closingOrder = activeOpenOrder;
    void service.closeOpenOrder({ openOrderId: closingOrder.id })
      .then(async () => {
        setOpenLocalOrders(await service.listOpenOrders());
        setActiveOpenOrder(null);
        setCheckoutServiceContext(null);
        setPendingSettlementSequence(null);
        setLocalNotice(`تم إغلاق ${closingOrder.servicePlaceName}`);
      })
      .catch((error: unknown) => {
        setLocalError(localMessage(error));
      })
      .finally(() => {
        settlementClosing.current = false;
      });
  }, [activeOpenOrder, flow.receipt?.number, flow.stage, flow.ticket, pendingSettlementSequence, service]);

  const abandonActiveResume = useCallback(() => {
    setActiveOpenOrder(null);
    setCheckoutServiceContext(null);
    setPendingSettlementSequence(null);
  }, []);

  const clearCheckoutContext = useCallback(() => {
    setCheckoutServiceContext(null);
  }, []);

  const occupiedPlaceIds = useMemo(() => new Set(openLocalOrders.map((order) => order.servicePlaceId)), [openLocalOrders]);
  const activeServiceLabel = activeOpenOrder ? `محلي · ${activeOpenOrder.servicePlaceName}` : null;

  return {
    adapterInfo: service.adapterInfo,
    config,
    placeGroups,
    openLocalOrders,
    occupiedPlaceIds,
    activeOpenOrder,
    activeServiceLabel,
    checkoutServiceContext,
    localBusy,
    localNotice,
    localError,
    clearLocalError: () => setLocalError(null),
    updateConfig,
    prepareDirectCheckout,
    beginSimpleLocalCheckout,
    assignToPlace,
    resumeOpenOrder,
    sendOpenOrderUpdate,
    markSettlementPending,
    abandonActiveResume,
    clearCheckoutContext,
    refresh,
  };
};

export type LocalServiceFlow = ReturnType<typeof useLocalServiceFlow>;
