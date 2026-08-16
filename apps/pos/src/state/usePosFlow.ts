import { useCallback, useDeferredValue, useEffect, useState } from "react";
import { createMockPosRuntime } from "../adapters/mockPos";
import { PosContractError } from "../contracts/pos";
import { money } from "../domain/money";
import type {
  DeviceSession,
  EmployeeSession,
  PrintDeliveryStatus,
  Product,
  Receipt,
  Ticket,
} from "../domain/models";

export type FlowStage = "sign-in" | "pin" | "sales" | "payment" | "cash" | "success";

const commandId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;

const messageFrom = (error: unknown) =>
  error instanceof PosContractError ? error.message : "حدث خطأ غير متوقع. حاول مرة أخرى.";

export const usePosFlow = () => {
  const [runtime] = useState(createMockPosRuntime);
  const restored = runtime.restore();
  const initialStage: FlowStage = restored.receipt
    ? "success"
    : restored.employee && restored.ticket
      ? "sales"
      : restored.device
        ? "pin"
        : "sign-in";

  const [stage, setStage] = useState<FlowStage>(initialStage);
  const [device, setDevice] = useState<DeviceSession | null>(restored.device);
  const [employee, setEmployee] = useState<EmployeeSession | null>(restored.employee);
  const [ticket, setTicket] = useState<Ticket | null>(restored.ticket);
  const [receipt, setReceipt] = useState<Receipt | null>(restored.receipt);
  const [products, setProducts] = useState<readonly Product[]>([]);
  const [categories, setCategories] = useState<readonly { id: string; name: string }[]>([]);
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [cashCommandId, setCashCommandId] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [printStatus, setPrintStatus] = useState<PrintDeliveryStatus>("idle");
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    let active = true;
    runtime.catalog.categories().then((items) => {
      if (active) setCategories(items);
    });
    return () => {
      active = false;
    };
  }, [runtime]);

  useEffect(() => {
    if (stage !== "sales") return;
    let active = true;
    setBusy("catalog");
    runtime.catalog
      .search({ query: deferredQuery, categoryId })
      .then((items) => {
        if (active) setProducts(items);
      })
      .catch((error: unknown) => {
        if (active) setErrorMessage(messageFrom(error));
      })
      .finally(() => {
        if (active) setBusy((current) => (current === "catalog" ? null : current));
      });
    return () => {
      active = false;
    };
  }, [categoryId, deferredQuery, runtime, stage]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      setBusy("sign-in");
      setErrorMessage(null);
      try {
        const linked = await runtime.deviceSession.linkWithCredentials({
          commandId: commandId("device-link"),
          email,
          password,
        });
        setDevice(linked);
        setStage("pin");
      } catch (error) {
        setErrorMessage(messageFrom(error));
      } finally {
        setBusy(null);
      }
    },
    [runtime],
  );

  const unlock = useCallback(
    async (pin: string) => {
      setBusy("pin");
      setErrorMessage(null);
      try {
        const activeEmployee = await runtime.employeeSession.unlock({ pin });
        const activeTicket = await runtime.sales.startTicket({ commandId: commandId("ticket") });
        setEmployee(activeEmployee);
        setTicket(activeTicket);
        setReceipt(null);
        setStage("sales");
      } catch (error) {
        setErrorMessage(messageFrom(error));
        throw error;
      } finally {
        setBusy(null);
      }
    },
    [runtime],
  );

  const addProduct = useCallback(
    async (productId: string) => {
      if (!ticket) return;
      setBusy(`product:${productId}`);
      setErrorMessage(null);
      try {
        const updated = await runtime.sales.addItem({
          commandId: commandId("add-item"),
          ticketId: ticket.id,
          productId,
        });
        setTicket(updated);
      } catch (error) {
        setErrorMessage(messageFrom(error));
      } finally {
        setBusy(null);
      }
    },
    [runtime, ticket],
  );

  const setQuantity = useCallback(
    async (lineId: string, quantity: number) => {
      if (!ticket) return;
      setBusy(`line:${lineId}`);
      setErrorMessage(null);
      try {
        const updated = await runtime.sales.setLineQuantity({ ticketId: ticket.id, lineId, quantity });
        setTicket(updated);
      } catch (error) {
        setErrorMessage(messageFrom(error));
      } finally {
        setBusy(null);
      }
    },
    [runtime, ticket],
  );

  const removeLine = useCallback(
    async (lineId: string) => {
      if (!ticket) return;
      setBusy(`line:${lineId}`);
      setErrorMessage(null);
      try {
        const updated = await runtime.sales.removeLine({ ticketId: ticket.id, lineId });
        setTicket(updated);
      } catch (error) {
        setErrorMessage(messageFrom(error));
      } finally {
        setBusy(null);
      }
    },
    [runtime, ticket],
  );

  const beginCheckout = useCallback(async () => {
    if (!ticket) return;
    setBusy("checkout");
    setErrorMessage(null);
    try {
      const checkout = await runtime.checkout.begin({ commandId: commandId("checkout"), ticketId: ticket.id });
      setCheckoutId(checkout.checkoutId);
      setStage("payment");
    } catch (error) {
      setErrorMessage(messageFrom(error));
    } finally {
      setBusy(null);
    }
  }, [runtime, ticket]);

  const selectCash = useCallback(async () => {
    if (!checkoutId) return;
    setBusy("cash-method");
    setErrorMessage(null);
    try {
      await runtime.checkout.selectPaymentMethod({ checkoutId, method: "cash" });
      setCashCommandId((current) => current ?? commandId("cash-sale"));
      setStage("cash");
    } catch (error) {
      setErrorMessage(messageFrom(error));
    } finally {
      setBusy(null);
    }
  }, [checkoutId, runtime]);

  const completeCash = useCallback(
    async (tenderedHalalas: number) => {
      if (!checkoutId || !cashCommandId) return;
      setBusy("complete-cash");
      setErrorMessage(null);
      try {
        const completed = await runtime.checkout.completeCashSale({
          commandId: cashCommandId,
          checkoutId,
          tendered: money(tenderedHalalas),
        });
        setReceipt(completed);
        setTicket(null);
        setStage("success");
      } catch (error) {
        setErrorMessage(messageFrom(error));
      } finally {
        setBusy(null);
      }
    },
    [cashCommandId, checkoutId, runtime],
  );

  const printReceipt = useCallback(async () => {
    if (!receipt) return;
    setBusy("print");
    setPrintStatus("queued");
    try {
      const result = await runtime.printing.submit({
        commandId: commandId("print"),
        receiptId: receipt.id,
      });
      setPrintStatus(result);
    } catch {
      setPrintStatus("failed");
    } finally {
      setBusy(null);
    }
  }, [receipt, runtime]);

  const newSale = useCallback(async () => {
    setBusy("new-sale");
    setErrorMessage(null);
    try {
      const activeTicket = await runtime.sales.startTicket({ commandId: commandId("ticket") });
      setTicket(activeTicket);
      setReceipt(null);
      setCheckoutId(null);
      setCashCommandId(null);
      setPrintStatus("idle");
      setQuery("");
      setCategoryId("all");
      setStage("sales");
    } catch (error) {
      setErrorMessage(messageFrom(error));
    } finally {
      setBusy(null);
    }
  }, [runtime]);

  return {
    stage,
    device,
    employee,
    ticket,
    receipt,
    products,
    categories,
    query,
    categoryId,
    busy,
    errorMessage,
    printStatus,
    setQuery,
    setCategoryId,
    clearError: () => setErrorMessage(null),
    signIn,
    unlock,
    addProduct,
    setQuantity,
    removeLine,
    beginCheckout,
    selectCash,
    completeCash,
    printReceipt,
    newSale,
    returnToSales: () => setStage("sales"),
    returnToPayment: () => setStage("payment"),
  };
};
