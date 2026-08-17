import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Ticket } from "../domain/models";
import type { LocalServiceFlow } from "../state/useLocalServiceFlow";
import { LocalServiceDialog } from "./LocalServiceDialog";

type Props = { ticket: Ticket; local: LocalServiceFlow; legacyFixture?: boolean };

const sameTargets = (a: readonly HTMLElement[], b: readonly HTMLElement[]) => a.length === b.length && a.every((item, i) => item === b[i]);
const setText = (button: HTMLButtonElement, text: string) => { if (button.textContent !== text) button.textContent = text; };
const setDisabled = (button: HTMLButtonElement, value: boolean) => { if (button.disabled !== value) button.disabled = value; };
const setClass = (element: Element, name: string, value: boolean) => { if (element.classList.contains(name) !== value) element.classList.toggle(name, value); };
const setAttr = (element: Element, name: string, value: string | null) => {
  if (value === null) { if (element.hasAttribute(name)) element.removeAttribute(name); }
  else if (element.getAttribute(name) !== value) element.setAttribute(name, value);
};
const directChild = (parent: HTMLElement, className: string) => Array.from(parent.children).find((child): child is HTMLElement => child instanceof HTMLElement && child.classList.contains(className));
const syncBadge = (parent: HTMLElement, className: string, label: string | null) => {
  const current = directChild(parent, className);
  if (!label) {
    current?.remove();
    return;
  }
  const badge = current ?? document.createElement("span");
  if (!current) {
    badge.className = className;
    badge.dataset.localServiceSlot = "owned";
    parent.append(badge);
  }
  if (badge.textContent !== label) badge.textContent = label;
};

export function LocalServiceEnhancer({ ticket, local, legacyFixture = false }: Props) {
  const localRef = useRef(local);
  localRef.current = local;
  const [dialogMode, setDialogMode] = useState<"assign" | "open" | null>(null);
  const [settingsTargets, setSettingsTargets] = useState<readonly HTMLElement[]>([]);

  const itemCount = ticket.lines.reduce((sum, line) => sum + line.quantity, 0);
  const serviceEnabled = local.config.restaurantServiceEnabled;
  const advanced = serviceEnabled && local.config.placeManagementEnabled;
  const openCount = local.openLocalOrders.length;
  const hasOpen = openCount > 0;
  const activeId = local.activeOpenOrder?.id ?? null;
  const busy = local.localBusy !== null;
  const activeServiceLabel = local.activeServiceLabel;
  const checkoutLabel = local.checkoutServiceContext?.mode === "dine_in" ? local.checkoutServiceContext.label : null;

  useEffect(() => {
    if (!legacyFixture) {
      document.body.classList.add("local-service-ui-active");
      return () => document.body.classList.remove("local-service-ui-active");
    }

    document.body.classList.remove("local-service-ui-active");
    const revealLegacyFixture = () => {
      document.querySelectorAll<HTMLElement>(".ticket-order-type").forEach((element) => element.style.setProperty("display", "flex", "important"));
      document.querySelectorAll<HTMLElement>(".device-settings-section--order-types").forEach((element) => element.style.setProperty("display", "block", "important"));
    };
    revealLegacyFixture();
    const observer = new MutationObserver(revealLegacyFixture);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [legacyFixture]);

  useEffect(() => {
    if (legacyFixture) {
      setSettingsTargets([]);
      return;
    }

    const sync = () => {
      const workspace = document.querySelector<HTMLElement>(".pos-workspace");
      if (workspace?.classList.contains("sale-screen-touch")) {
        for (const card of document.querySelectorAll<HTMLElement>(".ticket-actions")) {
          const buttons = Array.from(card.children).filter((child): child is HTMLButtonElement => child instanceof HTMLButtonElement);
          const first = buttons[0];
          const pay = buttons[1];
          if (!first || !pay) continue;
          setClass(first, "local-service-action", true);
          setClass(first, "local-service-action--open", false);
          setClass(first, "local-service-action--send", false);
          setClass(first, "local-service-action--hidden", false);
          setClass(pay, "local-pay--inactive", false);

          if (!serviceEnabled) {
            setText(first, "محلي");
            setDisabled(first, true);
            setClass(first, "local-service-action--hidden", true);
            setAttr(first, "aria-hidden", "true");
          } else if (activeId) {
            const active = localRef.current.activeOpenOrder;
            setText(first, "إرسال");
            setDisabled(first, itemCount === 0 || busy);
            setClass(first, "local-service-action--send", true);
            setAttr(first, "aria-hidden", null);
            setAttr(first, "aria-label", active ? `إرسال تحديث ${active.servicePlaceName} للمطبخ` : "إرسال تحديث الطلب للمطبخ");
          } else if (advanced && itemCount === 0 && hasOpen) {
            setText(first, `طلبات مفتوحة · ${openCount}`);
            setDisabled(first, busy);
            setClass(first, "local-service-action--open", true);
            setAttr(first, "aria-hidden", null);
            setAttr(first, "aria-label", `الطلبات المفتوحة، ${openCount}`);
            setClass(pay, "local-pay--inactive", true);
          } else {
            setText(first, "محلي");
            setDisabled(first, itemCount === 0 || busy);
            setAttr(first, "aria-hidden", null);
            setAttr(first, "aria-label", advanced ? "محلي، اختيار مكان" : "محلي");
          }
        }
      }

      const settingSlots = Array.from(document.querySelectorAll<HTMLElement>(".pos-device-settings")).map((panel) => {
        let slot = directChild(panel, "local-service-settings-slot");
        if (!slot) {
          slot = document.createElement("div");
          slot.className = "local-service-settings-slot";
          slot.dataset.localServiceSlot = "owned";
          const done = directChild(panel, "settings-done");
          if (done) panel.insertBefore(slot, done);
          else panel.append(slot);
        }
        return slot;
      });
      setSettingsTargets((current) => sameTargets(current, settingSlots) ? current : settingSlots);

      for (const title of document.querySelectorAll<HTMLElement>(".ticket-header .ticket-title-block")) {
        syncBadge(title, "local-ticket-context", activeServiceLabel);
      }
      for (const parent of document.querySelectorAll<HTMLElement>(".inline-checkout-head > div, .inline-success-copy")) {
        syncBadge(parent, "local-checkout-context", checkoutLabel);
      }
    };

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true });

    const capture = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest<HTMLButtonElement>(".ticket-actions > button") : null;
      if (!target) return;
      const workspace = target.closest<HTMLElement>(".pos-workspace");
      if (!workspace?.classList.contains("sale-screen-touch")) return;
      const buttons = target.parentElement ? Array.from(target.parentElement.children).filter((child): child is HTMLButtonElement => child instanceof HTMLButtonElement) : [];
      const index = buttons.indexOf(target);
      if (index === 1) {
        localRef.current.prepareDirectCheckout();
        return;
      }
      if (index !== 0 || target.disabled || !serviceEnabled) return;
      event.preventDefault();
      event.stopPropagation();
      const current = localRef.current;
      if (current.activeOpenOrder) void current.sendOpenOrderUpdate();
      else if (advanced && itemCount === 0 && hasOpen) setDialogMode("open");
      else if (advanced) setDialogMode("assign");
      else if (itemCount > 0) void current.beginSimpleLocalCheckout();
    };

    document.addEventListener("click", capture, true);
    return () => {
      observer.disconnect();
      document.removeEventListener("click", capture, true);
      document.querySelectorAll<HTMLElement>("[data-local-service-slot=\"owned\"]").forEach((slot) => slot.remove());
    };
  }, [activeId, activeServiceLabel, advanced, busy, checkoutLabel, hasOpen, itemCount, legacyFixture, openCount, serviceEnabled]);

  const toggleRestaurant = async () => {
    await local.updateConfig({ restaurantServiceEnabled: !serviceEnabled, placeManagementEnabled: false });
  };
  const togglePlaces = async () => {
    if (serviceEnabled) await local.updateConfig({ restaurantServiceEnabled: true, placeManagementEnabled: !local.config.placeManagementEnabled });
  };

  if (legacyFixture) return null;

  return <>
    {settingsTargets.map((target, index) => createPortal(
      <section className="device-settings-section local-service-settings" key={`local-settings-${index}`}>
        <div className="device-settings-copy"><strong>خدمة المطعم</strong><span>فعّلها لتمييز البيع المباشر كسفري وإظهار خيار المحلي. إعداد مؤقت هنا وسيُنقل للباك أوفس لاحقًا.</span></div>
        <button type="button" className={`local-setting-row ${serviceEnabled ? "active" : ""}`} onClick={() => void toggleRestaurant()} disabled={busy || (hasOpen && serviceEnabled)} aria-pressed={serviceEnabled}><span><strong>تفعيل خدمة المطعم</strong><small>{serviceEnabled ? "المحلي والسفري مفعّلان" : "وضع بيع مباشر / تجزئة"}</small></span><i className="local-setting-switch" aria-hidden="true"><b /></i></button>
        <button type="button" className={`local-setting-row local-setting-row--nested ${local.config.placeManagementEnabled ? "active" : ""}`} onClick={() => void togglePlaces()} disabled={!serviceEnabled || busy || (hasOpen && local.config.placeManagementEnabled)} aria-pressed={local.config.placeManagementEnabled}><span><strong>تحديد الطاولات والجلسات</strong><small>{local.config.placeManagementEnabled ? "محلي متقدم · اختيار مكان وطلبات مفتوحة" : "محلي بسيط · بدون اختيار مكان"}</small></span><i className="local-setting-switch" aria-hidden="true"><b /></i></button>
        {hasOpen ? <small className="local-setting-lock-note">يوجد {openCount} طلب محلي مفتوح؛ أغلقها قبل إيقاف الإعدادات.</small> : null}
      </section>, target))}
    {dialogMode ? <LocalServiceDialog mode={dialogMode} groups={local.placeGroups} openOrders={local.openLocalOrders} busy={busy} onClose={() => setDialogMode(null)} onAssign={local.assignToPlace} onOpen={local.resumeOpenOrder} /> : null}
    {local.localNotice ? <div className="local-service-toast local-service-toast--success" role="status">{local.localNotice}</div> : null}
    {local.localError ? <button type="button" className="local-service-toast local-service-toast--error" onClick={local.clearLocalError} role="alert">{local.localError}</button> : null}
  </>;
}
