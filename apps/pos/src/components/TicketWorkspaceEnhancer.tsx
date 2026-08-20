import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Customer, CustomerDetails, DebtLedgerEntry, Ticket } from "../domain/models";
import type { LocalServiceFlow } from "../state/useLocalServiceFlow";
import { CustomerPickerDialog } from "./CustomerPickerDialog";
import { DebtBookDialog } from "./DebtBookDialog";
import { LocalServiceDialog } from "./LocalServiceDialog";
import { TicketCustomerWorkspace } from "./TicketCustomerWorkspace";

type TicketTaskKind = "customer" | "credit" | "debt" | "place-assign" | "place-open";

type TicketTask = Readonly<{
  kind: TicketTaskKind;
  host: HTMLElement;
}>;

type Props = {
  active: boolean;
  ticket: Ticket;
  local: LocalServiceFlow;
  creditEnabled: boolean;
  legacyFixture?: boolean;
  busy: string | null;
  onCheckout: () => Promise<boolean>;
  onRestaurantLocalCheckout: () => Promise<boolean>;
  onRestaurantDirectCheckout: () => Promise<boolean>;
  onSearchCustomers: (query: string) => Promise<readonly Customer[]>;
  onCreateCustomer: (name: string, mobile: string, details: CustomerDetails) => Promise<Customer | null>;
  onSetTicketCustomer: (customerId: string | null) => Promise<boolean>;
  onLoadCustomerLedger: (customerId: string) => Promise<readonly DebtLedgerEntry[]>;
  onChargeCredit: (customerId: string) => Promise<Customer | null>;
  onSettleDebt: (customerId: string, amountHalalas: number) => Promise<Customer | null>;
};

const setText = (button: HTMLButtonElement, text: string) => {
  if (button.textContent !== text) button.textContent = text;
};

const setDisabled = (button: HTMLButtonElement, disabled: boolean) => {
  if (button.disabled !== disabled) button.disabled = disabled;
};

const setClass = (element: Element, className: string, enabled: boolean) => {
  if (element.classList.contains(className) !== enabled) element.classList.toggle(className, enabled);
};

const setAttr = (element: Element, name: string, value: string | null) => {
  if (value === null) {
    if (element.hasAttribute(name)) element.removeAttribute(name);
    return;
  }
  if (element.getAttribute(name) !== value) element.setAttribute(name, value);
};

const actionButtons = (container: Element) =>
  Array.from(container.children).filter((child): child is HTMLButtonElement => child instanceof HTMLButtonElement);

const taskHostFor = (element: Element) =>
  element.closest<HTMLElement>(".mobile-ticket-surface")
  ?? element.closest<HTMLElement>(".ticket-column");

const resetActionClass = (button: HTMLButtonElement) => {
  for (const name of [
    "ticket-workspace-action--local",
    "ticket-workspace-action--takeaway",
    "ticket-workspace-action--credit",
    "ticket-workspace-action--settlement",
    "ticket-workspace-action--open",
    "ticket-workspace-action--send",
    "ticket-workspace-action--hidden",
  ]) setClass(button, name, false);
};

export function TicketWorkspaceEnhancer({
  active,
  ticket,
  local,
  creditEnabled,
  legacyFixture = false,
  busy,
  onCheckout,
  onRestaurantLocalCheckout,
  onRestaurantDirectCheckout,
  onSearchCustomers,
  onCreateCustomer,
  onSetTicketCustomer,
  onLoadCustomerLedger,
  onChargeCredit,
  onSettleDebt,
}: Props) {
  const [task, setTask] = useState<TicketTask | null>(null);
  const taskRef = useRef(task);
  taskRef.current = task;

  const itemCount = ticket.lines.reduce((sum, line) => sum + line.quantity, 0);
  const serviceEnabled = local.config.restaurantServiceEnabled;
  const advancedRestaurant = serviceEnabled && local.config.placeManagementEnabled;
  const activeOpenOrder = local.activeOpenOrder;
  const openCount = local.openLocalOrders.length;
  const localBusy = local.localBusy !== null;
  const customerBusy = busy === "customer-credit" || busy === "customer-settlement" || busy === "ticket-customer" || busy === "customer-create";

  useEffect(() => {
    setTask(null);
  }, [ticket.sequence]);

  useEffect(() => {
    if (active) return;
    setTask(null);
  }, [active]);

  useEffect(() => {
    const previousHost = task?.host;
    if (!previousHost) return;
    previousHost.classList.add("ticket-workspace-host--active");
    return () => previousHost.classList.remove("ticket-workspace-host--active");
  }, [task]);

  useEffect(() => {
    if (!active || legacyFixture) return;

    const sync = () => {
      for (const container of document.querySelectorAll<HTMLElement>(".ticket-actions")) {
        const workspace = container.closest<HTMLElement>(".pos-workspace");
        if (!workspace) continue;
        const buttons = actionButtons(container);
        const first = buttons[0];
        const second = buttons[1];
        if (!first || !second) continue;

        resetActionClass(first);
        resetActionClass(second);
        setAttr(first, "aria-hidden", null);
        setAttr(second, "aria-hidden", null);
        setClass(container, "ticket-workspace-actions--single", false);
        setClass(container, "ticket-workspace-actions--restaurant", false);

        const basic = workspace.classList.contains("sale-screen-basic");
        const touchRestaurant = !basic && serviceEnabled;

        if (touchRestaurant) {
          setClass(container, "ticket-workspace-actions--restaurant", true);

          if (activeOpenOrder) {
            setText(first, "إرسال");
            setText(second, "دفع");
            setDisabled(first, itemCount === 0 || localBusy);
            setDisabled(second, itemCount === 0 || localBusy);
            setClass(first, "ticket-workspace-action--send", true);
            setAttr(first, "aria-label", `إرسال تحديث ${activeOpenOrder.servicePlaceName} للمطبخ`);
            continue;
          }

          if (itemCount === 0) {
            if (advancedRestaurant && openCount > 0) {
              setText(first, `طلبات مفتوحة · ${openCount}`);
              setDisabled(first, localBusy);
              setClass(first, "ticket-workspace-action--open", true);
              setAttr(first, "aria-label", `الطلبات المفتوحة، ${openCount}`);
              setClass(second, "ticket-workspace-action--hidden", true);
              setAttr(second, "aria-hidden", "true");
              setDisabled(second, true);
              setClass(container, "ticket-workspace-actions--single", true);
            } else {
              setClass(first, "ticket-workspace-action--hidden", true);
              setClass(second, "ticket-workspace-action--hidden", true);
              setAttr(first, "aria-hidden", "true");
              setAttr(second, "aria-hidden", "true");
              setDisabled(first, true);
              setDisabled(second, true);
            }
            continue;
          }

          setText(first, "محلي");
          setText(second, "سفري");
          setDisabled(first, localBusy);
          setDisabled(second, localBusy);
          setClass(first, "ticket-workspace-action--local", true);
          setClass(second, "ticket-workspace-action--takeaway", true);
          setAttr(first, "aria-label", advancedRestaurant ? "محلي، اختيار مكان" : "محلي");
          setAttr(second, "aria-label", "سفري");
          continue;
        }

        if (creditEnabled) {
          setText(first, itemCount > 0 ? "آجل" : "سداد");
          setDisabled(first, customerBusy);
          setClass(first, itemCount > 0 ? "ticket-workspace-action--credit" : "ticket-workspace-action--settlement", true);
          setAttr(first, "aria-label", itemCount > 0 ? "آجل" : "سداد");
        } else {
          setClass(first, "ticket-workspace-action--hidden", true);
          setAttr(first, "aria-hidden", "true");
          setDisabled(first, true);
        }

        if (itemCount > 0) {
          setText(second, "دفع");
          setDisabled(second, busy === "checkout");
          setAttr(second, "aria-label", "دفع");
          if (!creditEnabled) setClass(container, "ticket-workspace-actions--single", true);
        } else {
          setClass(second, "ticket-workspace-action--hidden", true);
          setAttr(second, "aria-hidden", "true");
          setDisabled(second, true);
          if (creditEnabled) setClass(container, "ticket-workspace-actions--single", true);
        }
      }
    };

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true });

    const capture = (event: MouseEvent) => {
      if (!active) return;
      const source = event.target instanceof Element ? event.target : null;
      if (!source) return;

      const customerButton = source.closest<HTMLButtonElement>(".ticket-customer-button");
      if (customerButton) {
        const host = taskHostFor(customerButton);
        if (!host) return;
        event.preventDefault();
        event.stopPropagation();
        setTask({ kind: "customer", host });
        return;
      }

      const action = source.closest<HTMLButtonElement>(".ticket-actions > button");
      if (!action || action.disabled || action.classList.contains("ticket-workspace-action--hidden")) return;
      const container = action.parentElement;
      const workspace = action.closest<HTMLElement>(".pos-workspace");
      const host = taskHostFor(action);
      if (!container || !workspace || !host) return;
      const buttons = actionButtons(container);
      const index = buttons.indexOf(action);
      if (index < 0) return;

      const basic = workspace.classList.contains("sale-screen-basic");
      const touchRestaurant = !basic && serviceEnabled;

      event.preventDefault();
      event.stopPropagation();

      if (!touchRestaurant) {
        if (index === 0 && creditEnabled) {
          setTask({ kind: itemCount > 0 ? "credit" : "debt", host });
        } else if (index === 1 && itemCount > 0) {
          void onCheckout();
        }
        return;
      }

      if (activeOpenOrder) {
        if (index === 0) void local.sendOpenOrderUpdate();
        else if (index === 1) void onRestaurantDirectCheckout();
        return;
      }

      if (itemCount === 0) {
        if (index === 0 && advancedRestaurant && openCount > 0) setTask({ kind: "place-open", host });
        return;
      }

      if (index === 0) {
        if (advancedRestaurant) setTask({ kind: "place-assign", host });
        else void onRestaurantLocalCheckout();
        return;
      }

      if (index === 1) void onRestaurantDirectCheckout();
    };

    document.addEventListener("click", capture, true);
    return () => {
      observer.disconnect();
      document.removeEventListener("click", capture, true);
    };
  }, [
    active,
    activeOpenOrder,
    advancedRestaurant,
    busy,
    creditEnabled,
    customerBusy,
    itemCount,
    legacyFixture,
    local,
    localBusy,
    onCheckout,
    onRestaurantDirectCheckout,
    onRestaurantLocalCheckout,
    openCount,
    serviceEnabled,
  ]);

  if (!task) return null;

  const closeTask = () => setTask(null);
  const customerPurpose = task.kind === "credit" ? "credit" : "attach";

  const taskContent = task.kind === "customer" && !ticket.customer ? (
    <TicketCustomerWorkspace
      busy={customerBusy}
      onClose={closeTask}
      onSearch={onSearchCustomers}
      onCreateCustomer={onCreateCustomer}
      onAttachCustomer={onSetTicketCustomer}
    />
  ) : task.kind === "customer" || task.kind === "credit" ? (
    <CustomerPickerDialog
      purpose={customerPurpose}
      ticketTotal={ticket.total}
      attachedCustomer={ticket.customer ?? null}
      busy={customerBusy}
      onClose={closeTask}
      onSearch={onSearchCustomers}
      onCreateCustomer={async (name, mobile, details) => {
        const created = await onCreateCustomer(name, mobile, details);
        if (created && task.kind === "customer") {
          const attached = await onSetTicketCustomer(created.id);
          if (attached) closeTask();
        }
        return created;
      }}
      onAttachCustomer={onSetTicketCustomer}
      onChargeCredit={onChargeCredit}
    />
  ) : task.kind === "debt" ? (
    <DebtBookDialog
      busy={busy === "customer-settlement"}
      onClose={closeTask}
      onSearch={onSearchCustomers}
      onLoadLedger={onLoadCustomerLedger}
      onSettleDebt={onSettleDebt}
    />
  ) : (
    <LocalServiceDialog
      mode={task.kind === "place-assign" ? "assign" : "open"}
      groups={local.placeGroups}
      openOrders={local.openLocalOrders}
      busy={localBusy}
      onClose={closeTask}
      onAssign={local.assignToPlace}
      onOpen={local.resumeOpenOrder}
    />
  );

  return createPortal(
    <div className="ticket-workspace-overlay" data-ticket-workspace={task.kind}>
      {taskContent}
    </div>,
    task.host,
  );
}
