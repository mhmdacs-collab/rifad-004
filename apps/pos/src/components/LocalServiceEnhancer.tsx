import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { migrateLegacyOrderTypePreference } from "../adapters/mockRestaurantService";
import type { Ticket } from "../domain/models";
import type { LocalServiceFlow } from "../state/useLocalServiceFlow";
import { LocalServiceDialog } from "./LocalServiceDialog";

migrateLegacyOrderTypePreference();

type LocalServiceEnhancerProps = {
  ticket: Ticket;
  local: LocalServiceFlow;
};

const sameTargets = (left: readonly HTMLElement[], right: readonly HTMLElement[]) =>
  left.length === right.length && left.every((item, index) => item === right[index]);

const setButtonText = (button: HTMLButtonElement, text: string) => {
  if (button.textContent !== text) button.textContent = text;
};

const setDisabled = (button: HTMLButtonElement, disabled: boolean) => {
  if (button.disabled !== disabled) button.disabled = disabled;
};

const setClass = (element: Element, className: string, enabled: boolean) => {
  if (element.classList.contains(className) !== enabled) element.classList.toggle(className, enabled);
};

const setAttributeValue = (element: Element, name: string, value: string | null) => {
  if (value === null) {
    if (element.hasAttribute(name)) element.removeAttribute(name);
    return;
  }
  if (element.getAttribute(name) !== value) element.setAttribute(name, value);
};

const ownedSlot = (parent: HTMLElement, className: string) => {
  const current = Array.from(parent.children).find((child): child is HTMLElement => child instanceof HTMLElement && child.classList.contains(className));
  if (current) return current;
  const slot = document.createElement("span");
  slot.className = className;
  slot.dataset.localServiceSlot = "owned";
  parent.append(slot);
  return slot;
};

export function LocalServiceEnhancer({ ticket, local }: LocalServiceEnhancerProps) {
  const localRef = useRef(local);
  localRef.current = local;
  const [dialogMode, setDialogMode] = useState<"assign" | "open" | null>(null);
  const [settingsTargets, setSettingsTargets] = useState<readonly HTMLElement[]>([]);
  const [ticketContextTargets, setTicketContextTargets] = useState<readonly HTMLElement[]>([]);
  const [checkoutContextTargets, setCheckoutContextTargets] = useState<readonly HTMLElement[]>([]);
  const itemCount = ticket.lines.reduce((sum, line) => sum + line.quantity, 0);
  const serviceEnabled = local.config.restaurantServiceEnabled;
  const advanced = serviceEnabled && local.config.placeManagementEnabled;
  const hasOpenOrders = local.openLocalOrders.length > 0;
  const openOrderCount = local.openLocalOrders.length;
  const activeOpenOrderId = local.activeOpenOrder?.id ?? null;
  const isBusy = local.localBusy !== null;

  useEffect(() => {
    const sync = () => {
      const workspace = document.querySelector<HTMLElement>(".pos-workspace");
      const touchMode = workspace?.classList.contains("sale-screen-touch") ?? false;

      if (touchMode) {
        const actionCards = Array.from(document.querySelectorAll<HTMLElement>(".ticket-actions"));
        for (const card of actionCards) {
          const buttons = Array.from(card.children).filter((child): child is HTMLButtonElement => child instanceof HTMLButtonElement);
          const secondary = buttons[0];
          const pay = buttons[1];
          if (!secondary || !pay) continue;

          setClass(secondary, "local-service-action", true);
          setClass(secondary, "local-service-action--open", false);
          setClass(secondary, "local-service-action--send", false);
          setClass(secondary, "local-service-action--hidden", false);
          setClass(pay, "local-pay--inactive", false);

          if (!serviceEnabled) {
            setButtonText(secondary, "محلي");
            setDisabled(secondary, true);
            setClass(secondary, "local-service-action--hidden", true);
            setAttributeValue(secondary, "aria-hidden", "true");
          } else if (activeOpenOrderId) {
            const active = localRef.current.activeOpenOrder;
            setButtonText(secondary, "إرسال");
            setDisabled(secondary, itemCount === 0 || isBusy);
            setClass(secondary, "local-service-action--send", true);
            setAttributeValue(secondary, "aria-hidden", null);
            setAttributeValue(secondary, "aria-label", active ? `إرسال تحديث ${active.servicePlaceName} للمطبخ` : "إرسال تحديث الطلب للمطبخ");
          } else if (advanced && itemCount === 0 && hasOpenOrders) {
            setButtonText(secondary, `طلبات مفتوحة · ${openOrderCount}`);
            setDisabled(secondary, isBusy);
            setClass(secondary, "local-service-action--open", true);
            setAttributeValue(secondary, "aria-hidden", null);
            setAttributeValue(secondary, "aria-label", `الطلبات المفتوحة، ${openOrderCount}`);
            setClass(pay, "local-pay--inactive", true);
          } else {
            setButtonText(secondary, "محلي");
            setDisabled(secondary, itemCount === 0 || isBusy);
            setAttributeValue(secondary, "aria-hidden", null);
            setAttributeValue(secondary, "aria-label", advanced ? "محلي، اختيار مكان" : "محلي");
          }
        }
      }

      const settings = Array.from(document.querySelectorAll<HTMLElement>(".pos-device-settings"));
      const nextSettingsTargets = settings.map((panel) => {
        let slot = panel.querySelector<HTMLElement>(":scope > .local-service-settings-slot");
        if (!slot) {
          slot = document.createElement("div");
          slot.className = "local-service-settings-slot";
          slot.dataset.localServiceSlot = "owned";
          const done = panel.querySelector(":scope > .settings-done");
          if (done) panel.insertBefore(slot, done);
          else panel.append(slot);
        }
        return slot;
      });
      setSettingsTargets((current) => sameTargets(current, nextSettingsTargets) ? current : nextSettingsTargets);

      const ticketTitles = Array.from(document.querySelectorAll<HTMLElement>(".ticket-header .ticket-title-block"));
      const nextTicketTargets = ticketTitles.map((title) => ownedSlot(title, "local-ticket-context-slot"));
      setTicketContextTargets((current) => sameTargets(current, nextTicketTargets) ? current : nextTicketTargets);

      const checkoutHeads = Array.from(document.querySelectorAll<HTMLElement>(".inline-checkout-head > div"));
      const successCopies = Array.from(document.querySelectorAll<HTMLElement>(".inline-success-copy"));
      const nextCheckoutTargets = [...checkoutHeads, ...successCopies].map((target) => ownedSlot(target, "local-checkout-context-slot"));
      setCheckoutContextTargets((current) => sameTargets(current, nextCheckoutTargets) ? current : nextCheckoutTargets);
    };

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["disabled", "class"] });

    const captureActions = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest<HTMLButtonElement>(".ticket-actions > button") : null;
      if (!target) return;
      const workspace = target.closest<HTMLElement>(".pos-workspace");
      if (!workspace?.classList.contains("sale-screen-touch")) return;
      const card = target.parentElement;
      if (!card) return;
      const buttons = Array.from(card.children).filter((child): child is HTMLButtonElement => child instanceof HTMLButtonElement);
      const index = buttons.indexOf(target);

      if (index === 1) {
        localRef.current.prepareDirectCheckout();
        return;
      }
      if (index !== 0 || target.disabled || !serviceEnabled) return;

      event.preventDefault();
      event.stopPropagation();

      const current = localRef.current;
      if (current.activeOpenOrder) {
        void current.sendOpenOrderUpdate();
      } else if (advanced && itemCount === 0 && hasOpenOrders) {
        setDialogMode("open");
      } else if (advanced) {
        setDialogMode("assign");
      } else if (itemCount > 0) {
        void current.beginSimpleLocalCheckout();
      }
    };

    document.addEventListener("click", captureActions, true);
    return () => {
      observer.disconnect();
      document.removeEventListener("click", captureActions, true);
      document.querySelectorAll<HTMLElement>("[data-local-service-slot=\"owned\"]").forEach((slot) => slot.remove());
    };
  }, [activeOpenOrderId, advanced, hasOpenOrders, isBusy, itemCount, openOrderCount, serviceEnabled]);

  const toggleRestaurantService = async () => {
    await local.updateConfig({ restaurantServiceEnabled: !serviceEnabled, placeManagementEnabled: false });
  };

  const togglePlaceManagement = async () => {
    if (!serviceEnabled) return;
    await local.updateConfig({ restaurantServiceEnabled: true, placeManagementEnabled: !local.config.placeManagementEnabled });
  };

  const ticketContext = local.activeServiceLabel;
  const checkoutContext = local.checkoutServiceContext?.mode === "dine_in" ? local.checkoutServiceContext.label : null;

  return (
    <>
      {settingsTargets.map((target, index) => createPortal(
        <section className="device-settings-section local-service-settings" key={`local-settings-${index}`}>
          <div className="device-settings-copy">
            <strong>خدمة المطعم</strong>
            <span>فعّلها لتمييز البيع المباشر كسفري وإظهار خيار المحلي. إعداد مؤقت هنا وسيُنقل للباك أوفس لاحقًا.</span>
          </div>
          <button type="button" className={`local-setting-row ${serviceEnabled ? "active" : ""}`} onClick={() => void toggleRestaurantService()} disabled={isBusy || (hasOpenOrders && serviceEnabled)} aria-pressed={serviceEnabled}>
            <span><strong>تفعيل خدمة المطعم</strong><small>{serviceEnabled ? "المحلي والسفري مفعّلان" : "وضع بيع مباشر / تجزئة"}</small></span>
            <i className="local-setting-switch" aria-hidden="true"><b /></i>
          </button>
          <button type="button" className={`local-setting-row local-setting-row--nested ${local.config.placeManagementEnabled ? "active" : ""}`} onClick={() => void togglePlaceManagement()} disabled={!serviceEnabled || isBusy || (hasOpenOrders && local.config.placeManagementEnabled)} aria-pressed={local.config.placeManagementEnabled}>
            <span><strong>تحديد الطاولات والجلسات</strong><small>{local.config.placeManagementEnabled ? "محلي متقدم · اختيار مكان وطلبات مفتوحة" : "محلي بسيط · بدون اختيار مكان"}</small></span>
            <i className="local-setting-switch" aria-hidden="true"><b /></i>
          </button>
          {hasOpenOrders ? <small className="local-setting-lock-note">يوجد {openOrderCount} طلب محلي مفتوح؛ أغلقها قبل إيقاف الإعدادات.</small> : null}
        </section>,
        target,
      ))}

      {ticketContextTargets.map((target, index) => createPortal(ticketContext ? <span className="local-ticket-context" key={`ticket-context-${index}`}>{ticketContext}</span> : null, target))}
      {checkoutContextTargets.map((target, index) => createPortal(checkoutContext ? <span className="local-checkout-context" key={`checkout-context-${index}`}>{checkoutContext}</span> : null, target))}

      {dialogMode ? <LocalServiceDialog mode={dialogMode} areas={local.serviceAreas} openOrders={local.openLocalOrders} busy={isBusy} onClose={() => setDialogMode(null)} onAssign={local.assignToPlace} onOpen={local.resumeOpenOrder} /> : null}
      {local.localNotice ? <div className="local-service-toast local-service-toast--success" role="status">{local.localNotice}</div> : null}
      {local.localError ? <button type="button" className="local-service-toast local-service-toast--error" onClick={local.clearLocalError} role="alert">{local.localError}</button> : null}
    </>
  );
}
