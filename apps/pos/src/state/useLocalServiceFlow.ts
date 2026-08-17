import { useCallback, useEffect, useMemo, useState } from "react";
import { createMockRestaurantService, DEMO_SERVICE_AREAS, readRestaurantServiceSnapshot } from "../adapters/mockRestaurantService";
import { PosContractError } from "../contracts/pos";
import type { OpenLocalOrder, RestaurantServiceConfig, ServiceArea } from "../domain/restaurantService";
import type { Ticket } from "../domain/models";
import type { usePosFlow } from "./usePosFlow";

type PosFlow = ReturnType<typeof usePosFlow>;
type CheckoutServiceContext = Readonly<{
  mode: "takeaway" | "dine_in";
  label: string;
}> | null;

const commandId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;
const localMessage = (error: unknown) => error instanceof PosContractError ? error.message : "تعذر تنفيذ العملية المحلية. حاول مرة أخرى.";

export const useLocalServiceFlow = (flow: PosFlow) => {
  const [service] = useState(createMockRestaurantService);
  const [initial] = useState(readRestaurantServiceSnapshot);
  const [config, setConfig] = useState<RestaurantServiceConfig>(initial.config);
  const [serviceAreas, setServiceAreas] = useState<readonly ServiceArea[]>(DEMO_SERVICE_AREAS);
  const [openLocalOrders, setOpenLocalOrders] = useState<readonly OpenLocalOrder[]>(initial.openOrders);
  const [activeOpenOrder, setActiveOpenOrder] = useState<OpenLocalOrder | null>(null);
  const [checkoutServiceContext, setCheckoutServiceContext] = useState<CheckoutServiceContext>(null);
  const [localBusy, setLocalBusy] = useState<string | null>(null);
  const [localNotice, setLocalNotice] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [nextConfig, areas, orders] = await Promise.all([
      service.getConfig(),
      service.listAreas(),
      service.listOpenOrders(),
    ]);
    setConfig(nextConfig);
    setServiceAreas(areas);
    setOpenLocalOrders(orders);
  }, [service]);

  useEffect(() => {
    void refresh();
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

  const settleActiveOrderIfCompleted = useCallback(async (ticketSequence: number) => {
    if (!activeOpenOrder) return false;
    try {
      const raw = window.localStorage.getItem("rifad.pos.mock.v1");
      if (!raw) return false;
      const persisted = JSON.parse(raw) as { receipt?: { number?: string } | null; receipts?: { number?: string }[] };
      const expected = `R-${String(ticketSequence).padStart(5, "0")}`;
      const completed = persisted.receipt?.number === expected || persisted.receipts?.some((receipt) => receipt.number === expected);
      if (!completed) return false;
      const placeName = activeOpenOrder.servicePlaceName;
      await service.closeOpenOrder({ openOrderId: activeOpenOrder.id });
      setOpenLocalOrders(await service.listOpenOrders());
      setActiveOpenOrder(null);
      setLocalNotice(`تم إغلاق ${placeName}`);
      return true;
    } catch {
      return false;
    }
  }, [activeOpenOrder, service]);

  const abandonActiveResume = useCallback(() => {
    setActiveOpenOrder(null);
    setCheckoutServiceContext(null);
  }, []);

  const clearCheckoutContext = useCallback(() => {
    setCheckoutServiceContext(null);
  }, []);

  const occupiedPlaceIds = useMemo(() => new Set(openLocalOrders.map((order) => order.servicePlaceId)), [openLocalOrders]);
  const activeServiceLabel = activeOpenOrder ? `محلي · ${activeOpenOrder.servicePlaceName}` : null;

  return {
    config,
    serviceAreas,
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
    settleActiveOrderIfCompleted,
    abandonActiveResume,
    clearCheckoutContext,
    refresh,
  };
};

export type LocalServiceFlow = ReturnType<typeof useLocalServiceFlow>;
