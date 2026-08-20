import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { RestaurantServiceConfig } from "../domain/restaurantService";
import type { LocalServiceFlow } from "../state/useLocalServiceFlow";

type Props = { local: LocalServiceFlow; legacyFixture?: boolean };

const SETTINGS_OPEN_EVENT = "rifad:pos-settings-open";
const SETTINGS_SAVE_EVENT = "rifad:pos-settings-save";
const SETTINGS_CANCEL_EVENT = "rifad:pos-settings-cancel";

const sameTargets = (a: readonly HTMLElement[], b: readonly HTMLElement[]) => a.length === b.length && a.every((item, i) => item === b[i]);
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

const ensureReturnSlot = (tools: HTMLElement) => {
  const existing = directChild(tools, "local-open-order-return-slot");
  if (existing) return existing;
  const slot = document.createElement("span");
  slot.className = "local-open-order-return-slot";
  slot.dataset.localServiceSlot = "owned";
  tools.prepend(slot);
  return slot;
};

export function LocalServiceEnhancer({ local, legacyFixture = false }: Props) {
  const [settingsTargets, setSettingsTargets] = useState<readonly HTMLElement[]>([]);
  const [returnTargets, setReturnTargets] = useState<readonly HTMLElement[]>([]);
  const [settingsSessionOpen, setSettingsSessionOpen] = useState(false);
  const [draftConfig, setDraftConfig] = useState<RestaurantServiceConfig>(local.config);

  const displayConfig = settingsSessionOpen ? draftConfig : local.config;
  const serviceEnabled = displayConfig.restaurantServiceEnabled;
  const placesEnabled = displayConfig.placeManagementEnabled;
  const openCount = local.openLocalOrders.length;
  const hasOpen = openCount > 0;
  const busy = local.localBusy !== null;
  const activeServiceLabel = local.activeServiceLabel;
  const checkoutLabel = local.checkoutServiceContext?.mode === "dine_in" ? local.checkoutServiceContext.label : null;

  useEffect(() => {
    const openSettings = () => {
      setDraftConfig(local.config);
      setSettingsSessionOpen(true);
    };
    const cancelSettings = () => {
      setDraftConfig(local.config);
      setSettingsSessionOpen(false);
    };
    const saveSettings = () => {
      if (!settingsSessionOpen) return;
      const next = draftConfig;
      setSettingsSessionOpen(false);
      void local.updateConfig(next);
    };

    window.addEventListener(SETTINGS_OPEN_EVENT, openSettings);
    window.addEventListener(SETTINGS_CANCEL_EVENT, cancelSettings);
    window.addEventListener(SETTINGS_SAVE_EVENT, saveSettings);
    return () => {
      window.removeEventListener(SETTINGS_OPEN_EVENT, openSettings);
      window.removeEventListener(SETTINGS_CANCEL_EVENT, cancelSettings);
      window.removeEventListener(SETTINGS_SAVE_EVENT, saveSettings);
    };
  }, [draftConfig, local, settingsSessionOpen]);

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
      setReturnTargets([]);
      return;
    }

    const sync = () => {
      const touchWorkspace = document.querySelector<HTMLElement>(".pos-workspace.sale-screen-touch");
      if (!touchWorkspace) {
        document.querySelectorAll<HTMLElement>("[data-local-service-settings-slot=\"owned\"]").forEach((slot) => slot.remove());
        setSettingsTargets((current) => current.length === 0 ? current : []);
      } else {
        const settingSlots = Array.from(document.querySelectorAll<HTMLElement>(".pos-device-settings")).map((panel) => {
          let slot = directChild(panel, "local-service-settings-slot");
          if (!slot) {
            slot = document.createElement("div");
            slot.className = "local-service-settings-slot";
            slot.dataset.localServiceSlot = "owned";
            slot.dataset.localServiceSettingsSlot = "owned";
            const cancel = directChild(panel, "settings-cancel");
            const done = directChild(panel, "settings-done");
            const anchor = cancel ?? done;
            if (anchor) panel.insertBefore(slot, anchor);
            else panel.append(slot);
          }
          return slot;
        });
        setSettingsTargets((current) => sameTargets(current, settingSlots) ? current : settingSlots);
      }

      for (const title of document.querySelectorAll<HTMLElement>(".ticket-header .ticket-title-block")) {
        syncBadge(title, "local-ticket-context", activeServiceLabel);
      }
      for (const parent of document.querySelectorAll<HTMLElement>(".inline-checkout-head > div, .inline-success-copy")) {
        syncBadge(parent, "local-checkout-context", checkoutLabel);
      }

      if (activeServiceLabel) {
        const slots = Array.from(document.querySelectorAll<HTMLElement>(".ticket-panel--sale .ticket-header-tools")).map(ensureReturnSlot);
        setReturnTargets((current) => sameTargets(current, slots) ? current : slots);
      } else {
        document.querySelectorAll<HTMLElement>(".local-open-order-return-slot[data-local-service-slot=\"owned\"]").forEach((slot) => slot.remove());
        setReturnTargets((current) => current.length === 0 ? current : []);
      }
    };

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      document.querySelectorAll<HTMLElement>("[data-local-service-slot=\"owned\"]").forEach((slot) => slot.remove());
      setSettingsTargets([]);
      setReturnTargets([]);
    };
  }, [activeServiceLabel, checkoutLabel, legacyFixture]);

  const toggleRestaurant = () => {
    if (!settingsSessionOpen) return;
    setDraftConfig((current) => ({
      restaurantServiceEnabled: !current.restaurantServiceEnabled,
      placeManagementEnabled: false,
    }));
  };

  const togglePlaces = () => {
    if (!settingsSessionOpen || !serviceEnabled) return;
    setDraftConfig((current) => ({
      restaurantServiceEnabled: true,
      placeManagementEnabled: !current.placeManagementEnabled,
    }));
  };

  if (legacyFixture) return null;

  return <>
    {settingsTargets.map((target, index) => createPortal(
      <section className="device-settings-section local-service-settings" key={`local-settings-${index}`}>
        <div className="device-settings-copy"><strong>خدمة المطعم</strong><span>فعّلها لتمييز الطلب المحلي والسفري في شاشة اللمس. هذا الإعداد لا يظهر في نمط البيع السريع.</span></div>
        <button type="button" className={`local-setting-row ${serviceEnabled ? "active" : ""}`} onClick={toggleRestaurant} disabled={busy || (hasOpen && local.config.restaurantServiceEnabled)} aria-pressed={serviceEnabled}><span><strong>تفعيل خدمة المطعم</strong><small>{serviceEnabled ? "المحلي والسفري مفعّلان" : "وضع بيع مباشر / تجزئة"}</small></span><i className="local-setting-switch" aria-hidden="true"><b /></i></button>
        <button type="button" className={`local-setting-row local-setting-row--nested ${placesEnabled ? "active" : ""}`} onClick={togglePlaces} disabled={!serviceEnabled || busy || (hasOpen && local.config.placeManagementEnabled)} aria-pressed={placesEnabled}><span><strong>تحديد الطاولات والجلسات</strong><small>{placesEnabled ? "محلي متقدم · اختيار مكان وطلبات مفتوحة" : "محلي بسيط · بدون اختيار مكان"}</small></span><i className="local-setting-switch" aria-hidden="true"><b /></i></button>
        {hasOpen ? <small className="local-setting-lock-note">يوجد {openCount} طلب محلي مفتوح؛ أغلقها قبل إيقاف الإعدادات.</small> : null}
      </section>, target))}
    {returnTargets.map((target, index) => createPortal(
      <button
        type="button"
        className="local-open-order-return"
        key={`local-return-${index}`}
        onClick={() => void local.leaveOpenOrder()}
        disabled={busy}
        aria-label="الرجوع لشاشة البيع مع إبقاء الطاولة مفتوحة"
      >
        الرجوع لشاشة البيع
      </button>,
      target,
      `local-return-${index}`,
    ))}
    {local.localNotice ? <div className="local-service-toast local-service-toast--success" role="status">{local.localNotice}</div> : null}
    {local.localError ? <button type="button" className="local-service-toast local-service-toast--error" onClick={local.clearLocalError} role="alert">{local.localError}</button> : null}
  </>;
}
