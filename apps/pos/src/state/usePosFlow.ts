import { useCallback, useDeferredValue, useEffect, useState } from "react";
import { createMockPosRuntime } from "../adapters/mockPos";
import { PosContractError } from "../contracts/pos";
import { money } from "../domain/money";
import { readPrintReceiptAlways } from "../domain/posPreferences";
import type {
  Customer,
  DeviceSession,
  EmployeeSession,
  PrintDeliveryStatus,
  Product,
  Receipt,
  SalePage,
  Ticket,
} from "../domain/models";

export type FlowStage = "sign-in" | "pin" | "sales" | "payment" | "cash" | "success" | "receipts";

const commandId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;

const messageFrom = (error: unknown) =>
  error instanceof PosContractError ? error.message : "حدث خطأ غير متوقع. حاول مرة أخرى.";

export const usePosFlow = () => {
  const [runtime] = useState(createMockPosRuntime);
  const [restored] = useState(() => runtime.restore());
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
  const [receipts, setReceipts] = useState<readonly Receipt[]>([]);
  const [products, setProducts] = useState<readonly Product[]>([]);
  const [allProducts, setAllProducts] = useState<readonly Product[]>([]);
  const [salePages, setSalePages] = useState<readonly SalePage[]>([]);
  const [activePageId, setActivePageId] = useState("page-popular");
  const [categories, setCategories] = useState<readonly { id: string; name: string }[]>([]);
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [cashCommandId, setCashCommandId] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [printStatus, setPrintStatus] = useState<PrintDeliveryStatus>("idle");
  const [lastTouchedLineId, setLastTouchedLineId] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    let active = true;
    Promise.all([
      runtime.catalog.categories(),
      runtime.catalog.search({ query: "", categoryId: "all" }),
      runtime.saleLayout.listPages(),
    ]).then(([categoryItems, catalogItems, pages]) => {
      if (!active) return;
      setCategories(categoryItems);
      setAllProducts(catalogItems);
      setSalePages(pages);
      setActivePageId((current) => pages.some((page) => page.id === current) ? current : (pages[0]?.id ?? "all-items"));
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
        setLastTouchedLineId(null);
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
        setLastTouchedLineId(updated.lines.find((line) => line.productId === productId)?.id ?? null);
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
        setLastTouchedLineId(quantity > 0 ? lineId : null);
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
        setLastTouchedLineId(updated.lines.at(-1)?.id ?? null);
      } catch (error) {
        setErrorMessage(messageFrom(error));
      } finally {
        setBusy(null);
      }
    },
    [runtime, ticket],
  );

  const saveOpenTicket = useCallback(async () => {
    if (!ticket) return;
    setBusy("save-ticket");
    setErrorMessage(null);
    try {
      const nextTicket = await runtime.sales.saveOpenTicket({
        commandId: commandId("save-ticket"),
        ticketId: ticket.id,
      });
      setTicket(nextTicket);
      setLastTouchedLineId(null);
    } catch (error) {
      setErrorMessage(messageFrom(error));
    } finally {
      setBusy(null);
    }
  }, [runtime, ticket]);

  const searchCustomers = useCallback(async (customerQuery: string): Promise<readonly Customer[]> => {
    try {
      return await runtime.customerCredit.search({ query: customerQuery });
    } catch (error) {
      setErrorMessage(messageFrom(error));
      return [];
    }
  }, [runtime]);

  const createCustomer = useCallback(async (name: string, mobile: string): Promise<Customer | null> => {
    setBusy("customer-create");
    setErrorMessage(null);
    try {
      return await runtime.customerCredit.create({ commandId: commandId("customer"), name, mobile });
    } catch (error) {
      setErrorMessage(messageFrom(error));
      return null;
    } finally {
      setBusy(null);
    }
  }, [runtime]);

  const chargeTicketToCustomer = useCallback(async (customerId: string): Promise<Customer | null> => {
    if (!ticket || ticket.lines.length === 0) return null;
    setBusy("customer-credit");
    setErrorMessage(null);
    try {
      const result = await runtime.customerCredit.chargeTicket({
        commandId: commandId("customer-credit"),
        customerId,
        ticketId: ticket.id,
      });
      setTicket(result.nextTicket);
      setReceipt(null);
      setCheckoutId(null);
      setCashCommandId(null);
      setLastTouchedLineId(null);
      setQuery("");
      setCategoryId("all");
      setStage("sales");
      return result.customer;
    } catch (error) {
      setErrorMessage(messageFrom(error));
      return null;
    } finally {
      setBusy(null);
    }
  }, [runtime, ticket]);

  const settleCustomerDebt = useCallback(async (customerId: string, amountHalalas: number): Promise<Customer | null> => {
    setBusy("customer-settlement");
    setErrorMessage(null);
    try {
      return await runtime.customerCredit.settle({
        commandId: commandId("customer-settlement"),
        customerId,
        amount: money(amountHalalas),
      });
    } catch (error) {
      setErrorMessage(messageFrom(error));
      return null;
    } finally {
      setBusy(null);
    }
  }, [runtime]);

  const createSalePage = useCallback(async (name: string) => {
    setBusy("sale-layout");
    setErrorMessage(null);
    try {
      const pages = await runtime.saleLayout.createPage({ commandId: commandId("sale-page"), name });
      setSalePages(pages);
      setActivePageId(pages.at(-1)?.id ?? "all-items");
      return true;
    } catch (error) {
      setErrorMessage(messageFrom(error));
      return false;
    } finally {
      setBusy(null);
    }
  }, [runtime]);

  const renameSalePage = useCallback(async (pageId: string, name: string) => {
    setBusy("sale-layout");
    setErrorMessage(null);
    try {
      const pages = await runtime.saleLayout.renamePage({ commandId: commandId("sale-page-rename"), pageId, name });
      setSalePages(pages);
      return true;
    } catch (error) {
      setErrorMessage(messageFrom(error));
      return false;
    } finally {
      setBusy(null);
    }
  }, [runtime]);

  const deleteSalePage = useCallback(async (pageId: string) => {
    setBusy("sale-layout");
    setErrorMessage(null);
    try {
      const pages = await runtime.saleLayout.deletePage({ commandId: commandId("sale-page-delete"), pageId });
      setSalePages(pages);
      setActivePageId((current) => current === pageId
        ? (pages.find((page) => !page.isDefault)?.id ?? pages[0]?.id ?? "all-items")
        : current);
      return true;
    } catch (error) {
      setErrorMessage(messageFrom(error));
      return false;
    } finally {
      setBusy(null);
    }
  }, [runtime]);

  const moveSalePage = useCallback(async (pageId: string, direction: "previous" | "next") => {
    setBusy("sale-layout");
    setErrorMessage(null);
    try {
      const pages = await runtime.saleLayout.movePage({
        commandId: commandId("sale-page-move"), pageId, direction,
      });
      setSalePages(pages);
      return true;
    } catch (error) {
      setErrorMessage(messageFrom(error));
      return false;
    } finally {
      setBusy(null);
    }
  }, [runtime]);

  const placeSalePageProduct = useCallback(async (pageId: string, slotIndex: number, productId: string) => {
    setBusy("sale-layout");
    setErrorMessage(null);
    try {
      const pages = await runtime.saleLayout.placeProduct({
        commandId: commandId("sale-page-place"), pageId, slotIndex, productId,
      });
      setSalePages(pages);
    } catch (error) {
      setErrorMessage(messageFrom(error));
    } finally {
      setBusy(null);
    }
  }, [runtime]);

  const removeSalePageProduct = useCallback(async (pageId: string, slotIndex: number) => {
    setBusy("sale-layout");
    setErrorMessage(null);
    try {
      const pages = await runtime.saleLayout.removeProduct({
        commandId: commandId("sale-page-remove"), pageId, slotIndex,
      });
      setSalePages(pages);
    } catch (error) {
      setErrorMessage(messageFrom(error));
    } finally {
      setBusy(null);
    }
  }, [runtime]);

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
        setLastTouchedLineId(null);

        if (readPrintReceiptAlways()) {
          try {
            await runtime.printing.submit({
              commandId: commandId("auto-print"),
              receiptId: completed.id,
            });
          } catch {
            // The receipt is already persisted and remains available in Receipts.
          }

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
            setTicket(null);
            setReceipt(completed);
            setStage("success");
            setErrorMessage(messageFrom(error));
          }
        } else {
          setReceipt(completed);
          setTicket(null);
          setStage("success");
        }
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

  const printArchivedReceipt = useCallback(async (receiptId: string): Promise<PrintDeliveryStatus> => {
    setBusy(`print-receipt:${receiptId}`);
    try {
      return await runtime.printing.submit({ commandId: commandId("reprint"), receiptId });
    } catch {
      return "failed";
    } finally {
      setBusy(null);
    }
  }, [runtime]);

  const openReceipts = useCallback(async () => {
    setBusy("receipts");
    setErrorMessage(null);
    try {
      const items = await runtime.receipts.list();
      setReceipts(items);
      setStage("receipts");
    } catch (error) {
      setErrorMessage(messageFrom(error));
    } finally {
      setBusy(null);
    }
  }, [runtime]);

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
      setLastTouchedLineId(null);
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
    receipts,
    products,
    allProducts,
    salePages,
    activePageId,
    categories,
    query,
    categoryId,
    busy,
    errorMessage,
    printStatus,
    lastTouchedLineId,
    setQuery,
    setCategoryId,
    setActivePageId,
    clearError: () => setErrorMessage(null),
    signIn,
    unlock,
    addProduct,
    setQuantity,
    removeLine,
    saveOpenTicket,
    searchCustomers,
    createCustomer,
    chargeTicketToCustomer,
    settleCustomerDebt,
    createSalePage,
    renameSalePage,
    deleteSalePage,
    moveSalePage,
    placeSalePageProduct,
    removeSalePageProduct,
    beginCheckout,
    selectCash,
    completeCash,
    printReceipt,
    printArchivedReceipt,
    openReceipts,
    newSale,
    returnToSales: () => setStage("sales"),
    returnToPayment: () => setStage("payment"),
  };
};
