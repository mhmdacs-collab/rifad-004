import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RestaurantServiceContract } from "../contracts/restaurantService";
import { PosContractError } from "../contracts/pos";
import type { Ticket } from "../domain/models";
import { kitchenStateOf } from "../domain/kitchenDelta";
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
  restaurantServiceEnabled: false,
  placeManagementEnabled: false,
};

const sameTicketContent = (working: Ticket | null, sent: Ticket) => {
  if (!working) return false;
  if (JSON.stringify(working.customer) !== JSON.stringify(sent.customer)) return false;
  if (JSON.stringify(working.subtotal) !== JSON.stringify(sent.subtotal)) return false;
  if (JSON.stringify(working.loyaltyRedemption) !== JSON.stringify(sent.loyaltyRedemption)) return false;
  if (JSON.stringify(working.taxIncluded) !== JSON.stringify(sent.taxIncluded)) return false;
  if (JSON.stringify(working.total) !== JSON.stringify(sent.total)) return false;

  const normalize = (ticket: Ticket) => ticket.lines
    .map((line) => ({
      id: line.id,
      productId: line.productId,
      name: line.name,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      tone: line.tone,
      kitchenState: kitchenStateOf(line),
    }))
    .sort((left, right) => `${left.kitchenState}:${left.id}:${left.productId}:${left.unitPrice.halalas}:${left.quantity}`.localeCompare(`${right.kitchenState}:${right.id}:${right.productId}:${right.unitPrice.halalas}:${right.quantity}`));
  return JSON.stringify(normalize(working)) === JSON.stringify(normalize(sent));
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
  const initialRefreshComplete = useRef(false);
  const initialOrderReconciled = useRef(false);
  const actionLock = useRef<string | null>(null);
  const pendingAssignCommand = useRef<{ servicePlaceId: string; ticketId: string; ticketUpdatedAt: string; commandId: string } | null>(null);
  const pendingUpdateCommand = useRef<{ openOrderId: string; ticketUpdatedAt: string; commandId: string } | null>(null);
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
    initialRefreshComplete.current = true;
  }, [service]);

  useEffect(() => {
    void refresh().catch((error: unknown) => setLocalError(localMessage(error)));
  }, [refresh]);

  useEffect(() => {
    if (!localNotice) return;
    const timer = window.setTimeout(() => setLocalNotice(null), 3200);
    return () => window.clearTimeout(timer);
  }, [localNotice]);

  // A browser/app restart restores the POS ticket before this hook fetches
  // restaurant orders. Re-associate that ticket with its one open order so a
  // sent table cannot silently fall back to an ordinary editable sale rail.
  // This runs only for the initial hydration; later tickets are explicitly
  // assigned/reopened by the cashier.
  useEffect(() => {
    if (initialOrderReconciled.current || !initialRefreshComplete.current || !flow.ticket) return;
    initialOrderReconciled.current = true;
    if (openLocalOrders.length === 0) return;
    const matches = openLocalOrders.filter((order) =>
      order.ticket.id === flow.ticket?.id && order.ticket.sequence === flow.ticket?.sequence);
    if (matches.length !== 1) return;
    const [order] = matches;
    if (!order) return;
    setActiveOpenOrder(order);
    setCheckoutServiceContext({ mode: "dine_in", label: `محلي · ${order.servicePlaceName}` });
    pendingUpdateCommand.current = null;
  }, [flow.ticket, openLocalOrders]);

  const updateConfig = useCallback(async (next: RestaurantServiceConfig) => {
    if (actionLock.current) return false;
    actionLock.current = "config";
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
      actionLock.current = null;
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
    if (!ticket || ticket.lines.length === 0 || actionLock.current) return false;
    actionLock.current = "assign-place";
    setLocalBusy("assign-place");
    setLocalError(null);
    try {
      const assignCommand = pendingAssignCommand.current?.servicePlaceId === servicePlaceId
        && pendingAssignCommand.current.ticketId === ticket.id
        && pendingAssignCommand.current.ticketUpdatedAt === ticket.updatedAt
        ? pendingAssignCommand.current.commandId
        : commandId("local-order");
      pendingAssignCommand.current = { servicePlaceId, ticketId: ticket.id, ticketUpdatedAt: ticket.updatedAt, commandId: assignCommand };
      const order = await service.createOpenOrder({
        commandId: assignCommand,
        ticket,
        servicePlaceId,
      });
      setOpenLocalOrders(await service.listOpenOrders());
      setLocalNotice(`تم إرسال الطلب للمطبخ · ${order.servicePlaceName}`);
      setCheckoutServiceContext(null);
      await flow.newSale();
      pendingAssignCommand.current = null;
      return true;
    } catch (error) {
      setLocalError(localMessage(error));
      return false;
    } finally {
      actionLock.current = null;
      setLocalBusy(null);
    }
  }, [flow, service]);

  const rebuildOpenOrderIntoWorkingTicket = useCallback(async (order: OpenLocalOrder) => {
    const current = flow.ticket;
    if (!current || current.lines.length > 0) {
      setLocalError("ابدأ من سلة فارغة قبل فتح طلب محلي محفوظ.");
      return false;
    }
    return flow.restoreTicket(order.ticket);
  }, [flow]);

  const resumeOpenOrder = useCallback(async (openOrderId: string) => {
    if (actionLock.current) return false;
    actionLock.current = "resume-order";
    setLocalBusy("resume-order");
    setLocalError(null);
    try {
      const order = await service.getOpenOrder({ openOrderId });
      const rebuilt = await rebuildOpenOrderIntoWorkingTicket(order);
      if (!rebuilt) return false;
      pendingUpdateCommand.current = null;
      setActiveOpenOrder(order);
      setCheckoutServiceContext({ mode: "dine_in", label: `محلي · ${order.servicePlaceName}` });
      setLocalNotice(`تم فتح ${order.servicePlaceName}`);
      return true;
    } catch (error) {
      setLocalError(localMessage(error));
      return false;
    } finally {
      actionLock.current = null;
      setLocalBusy(null);
    }
  }, [rebuildOpenOrderIntoWorkingTicket, service]);

  const hasUnsentOpenOrderChanges = useMemo(
    () => activeOpenOrder ? !sameTicketContent(flow.ticket, activeOpenOrder.ticket) : false,
    [activeOpenOrder, flow.ticket],
  );

  const sendOpenOrderUpdate = useCallback(async () => {
    if (!activeOpenOrder || !flow.ticket || !hasUnsentOpenOrderChanges || actionLock.current) return false;
    actionLock.current = "send-order-update";
    setLocalBusy("send-order-update");
    setLocalError(null);
    try {
      const updateCommand = pendingUpdateCommand.current?.openOrderId === activeOpenOrder.id
        && pendingUpdateCommand.current.ticketUpdatedAt === flow.ticket.updatedAt
        ? pendingUpdateCommand.current.commandId
        : commandId("local-order-update");
      pendingUpdateCommand.current = { openOrderId: activeOpenOrder.id, ticketUpdatedAt: flow.ticket.updatedAt, commandId: updateCommand };
      const updated = await service.updateOpenOrder({
        commandId: updateCommand,
        openOrderId: activeOpenOrder.id,
        ticket: flow.ticket,
        allowSentCorrections: flow.sentCorrectionPending,
      });
      const restored = await flow.restoreTicket(updated.ticket);
      if (!restored) return false;
      setOpenLocalOrders(await service.listOpenOrders());
      setActiveOpenOrder(updated);
      pendingUpdateCommand.current = null;
      setCheckoutServiceContext({ mode: "dine_in", label: `محلي · ${updated.servicePlaceName}` });
      setLocalNotice(`تم إرسال التحديث للمطبخ · ${updated.servicePlaceName}`);
      return true;
    } catch (error) {
      setLocalError(localMessage(error));
      return false;
    } finally {
      actionLock.current = null;
      setLocalBusy(null);
    }
  }, [activeOpenOrder, flow, flow.ticket, hasUnsentOpenOrderChanges, service]);

  /**
   * Discard only the uncommitted working batch. The restaurant snapshot is the
   * sent floor, so restoring it atomically cannot erase kitchen history or
   * briefly expose a ticket total below what the table already owes.
   */
  const clearPendingOpenOrder = useCallback(async () => {
    if (!activeOpenOrder || !flow.ticket || actionLock.current) return false;
    if (!hasUnsentOpenOrderChanges) return true;
    actionLock.current = "clear-pending-order";
    setLocalBusy("clear-pending-order");
    setLocalError(null);
    try {
      const restored = await flow.restoreTicket(activeOpenOrder.ticket);
      if (!restored) return false;
      pendingUpdateCommand.current = null;
      setLocalNotice(`تم مسح التغييرات غير المرسلة · ${activeOpenOrder.servicePlaceName}`);
      return true;
    } catch (error) {
      setLocalError(localMessage(error));
      return false;
    } finally {
      actionLock.current = null;
      setLocalBusy(null);
    }
  }, [activeOpenOrder, flow, hasUnsentOpenOrderChanges]);

  /**
   * Leave an already-synchronised table ticket without paying it. Unsent edits
   * are deliberately protected from silent loss: the cashier must send them
   * before leaving this working copy.
   */
  const leaveOpenOrder = useCallback(async () => {
    if (!activeOpenOrder || actionLock.current) return false;
    if (hasUnsentOpenOrderChanges) {
      setLocalError("أرسل تعديلات الطاولة قبل الرجوع إلى شاشة البيع.");
      return false;
    }
    actionLock.current = "leave-open-order";
    setLocalBusy("leave-open-order");
    setLocalError(null);
    try {
      setActiveOpenOrder(null);
      pendingUpdateCommand.current = null;
      setCheckoutServiceContext(null);
      setPendingSettlementSequence(null);
      await flow.newSale();
      return true;
    } catch (error) {
      setLocalError(localMessage(error));
      return false;
    } finally {
      actionLock.current = null;
      setLocalBusy(null);
    }
  }, [activeOpenOrder, flow, hasUnsentOpenOrderChanges]);

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
    hasUnsentOpenOrderChanges,
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
    clearPendingOpenOrder,
    leaveOpenOrder,
    markSettlementPending,
    abandonActiveResume,
    clearCheckoutContext,
    refresh,
  };
};

export type LocalServiceFlow = ReturnType<typeof useLocalServiceFlow>;
