import { createBrowserCatalogReader } from "../../../../adapters/catalog/browserCatalog";
import type { CatalogItem } from "../../../../contracts/catalog";
import { loyaltyContract } from "./mockLoyalty";
import type {
  CatalogContract,
  CheckoutContract,
  CustomerCreditContract,
  DeviceSessionContract,
  EmployeeSessionContract,
  MockPosRuntime,
  PrintingContract,
  ReceiptsContract,
  SaleLayoutContract,
  SalesContract,
} from "../contracts/pos";
import { PosContractError } from "../contracts/pos";
import { addMoney, money, multiplyMoney } from "../domain/money";
import type {
  Customer,
  CustomerDetails,
  CustomerReference,
  DebtCollectionMethod,
  DebtLedgerEntry,
  DeviceSession,
  EmployeeSession,
  Money,
  Product,
  ProductTone,
  Receipt,
  ReceiptItem,
  RestoredPosState,
  SalePage,
  Ticket,
  TicketLine,
} from "../domain/models";

export const MOCK_POS_STORAGE_KEY = "rifad.pos.mock.v1";
const STORAGE_KEY = MOCK_POS_STORAGE_KEY;
const WAIT_MS = import.meta.env.MODE === "test" ? 0 : 180;

const PRODUCT_TONES: readonly ProductTone[] = ["sand", "mint", "rose", "sky", "amber", "stone"];

const toneFor = (id: string): ProductTone => {
  let hash = 0;
  for (const character of id) hash = ((hash << 5) - hash + character.charCodeAt(0)) | 0;
  return PRODUCT_TONES[Math.abs(hash) % PRODUCT_TONES.length] ?? "stone";
};

const abbreviationFor = (name: string) => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return `${words[0]?.[0] ?? ""}${words[1]?.[0] ?? ""}`;
  return Array.from(words[0] ?? "ص").slice(0, 2).join("");
};

const toPosProduct = (item: CatalogItem): Product => ({
  id: item.id,
  name: item.name,
  categoryId: item.categoryId ?? "uncategorized",
  categoryName: item.categoryName ?? "بدون فئة",
  price: money(item.price.halalas),
  abbreviation: abbreviationFor(item.name),
  tone: toneFor(item.id),
});

type CreditSaleRecord = {
  id: string;
  commandId: string;
  customerId: string;
  ticket: Ticket;
  amount: Money;
  createdAt: string;
  receiptId?: string;
};

type DebtPaymentRecord = {
  id: string;
  commandId: string;
  customerId: string;
  amount: Money;
  createdAt: string;
  collectionMethod?: DebtCollectionMethod;
  collectionReceiptId?: string;
  collectionReceiptNumber?: string;
};

type Persisted = {
  device: DeviceSession | null;
  employee: EmployeeSession | null;
  ticket: Ticket | null;
  receipt: Receipt | null;
  receipts: Receipt[];
  nextTicketSequence: number;
  openTickets: Ticket[];
  salePages: SalePage[];
  customers: Customer[];
  creditSales: CreditSaleRecord[];
  debtPayments: DebtPaymentRecord[];
  debtLedger: DebtLedgerEntry[];
};

const EMPTY_CUSTOMER_DETAILS: CustomerDetails = {
  email: "",
  address: "",
  city: "",
  region: "",
  postalCode: "",
  country: "",
  customerCode: "",
  taxNumber: "",
  note: "",
};

const emptySlots = () => Array<string | null>(20).fill(null);

const initialSalePages = (): SalePage[] => [
  { id: "all-items", name: "كافة العناصر", isDefault: true, productSlots: [] },
  { id: "page-popular", name: "أهم المنتجات", isDefault: false, productSlots: ["p-001", "p-002", "p-003", null, null, ...emptySlots().slice(5)] },
  { id: "page-drinks", name: "المشروبات", isDefault: false, productSlots: ["p-006", "p-007", "p-005", "p-004", null, ...emptySlots().slice(5)] },
];

const initialCustomers = (): Customer[] => [
  {
    id: "customer-001",
    name: "أحمد محمد",
    mobile: "0501234567",
    details: { ...EMPTY_CUSTOMER_DETAILS, email: "ahmad@example.com", city: "الرياض", region: "الرياض", country: "السعودية", customerCode: "C-001" },
    debt: money(12000),
  },
  {
    id: "customer-002",
    name: "سارة خالد",
    mobile: "0559876543",
    details: { ...EMPTY_CUSTOMER_DETAILS, city: "الرياض", country: "السعودية", customerCode: "C-002" },
    debt: money(3500),
  },
];

const initialDebtLedger = (): DebtLedgerEntry[] => [
  { id: "debt-opening-001", customerId: "customer-001", kind: "opening", direction: "debit", amount: money(12000), createdAt: "2026-08-01T09:00:00.000Z", ticketSequence: null },
  { id: "debt-opening-002", customerId: "customer-002", kind: "opening", direction: "debit", amount: money(3500), createdAt: "2026-08-02T10:30:00.000Z", ticketSequence: null },
];

const emptyState = (): Persisted => ({
  device: null,
  employee: null,
  ticket: null,
  receipt: null,
  receipts: [],
  nextTicketSequence: 1,
  openTickets: [],
  salePages: initialSalePages(),
  customers: initialCustomers(),
  creditSales: [],
  debtPayments: [],
  debtLedger: initialDebtLedger(),
});

const pause = () => new Promise<void>((resolve) => window.setTimeout(resolve, WAIT_MS));
const createId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;

const normalizeMobile = (value: string) => {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("966") && digits.length === 12) digits = `0${digits.slice(3)}`;
  if (digits.startsWith("5") && digits.length === 9) digits = `0${digits}`;
  return digits;
};

const normalizeCustomerDetails = (details: Partial<CustomerDetails> | null | undefined): CustomerDetails => ({
  email: details?.email?.trim() ?? "",
  address: details?.address?.trim() ?? "",
  city: details?.city?.trim() ?? "",
  region: details?.region?.trim() ?? "",
  postalCode: details?.postalCode?.trim() ?? "",
  country: details?.country?.trim() ?? "",
  customerCode: details?.customerCode?.trim() ?? "",
  taxNumber: details?.taxNumber?.trim() ?? "",
  note: details?.note?.trim() ?? "",
});

const normalizeCustomer = (customer: Customer): Customer => ({ ...customer, details: normalizeCustomerDetails(customer.details) });

const customerReference = (customer: Customer): CustomerReference => ({
  id: customer.id,
  name: customer.name,
  mobile: customer.mobile,
  details: normalizeCustomerDetails(customer.details),
});

const normalizeCustomerReference = (customer: CustomerReference | null | undefined): CustomerReference | null =>
  customer ? { ...customer, details: normalizeCustomerDetails(customer.details) } : null;

const lineSubtotal = (lines: readonly TicketLine[]) => addMoney(...lines.map((line) => multiplyMoney(line.unitPrice, line.quantity)));

const receiptItems = (ticket: Ticket): readonly ReceiptItem[] => ticket.lines.map((line) => ({
  productId: line.productId,
  name: line.name,
  quantity: line.quantity,
  unitPrice: line.unitPrice,
  lineTotal: money(line.unitPrice.halalas * line.quantity),
}));

const normalizeTicket = (ticket: Ticket | null | undefined): Ticket | null => {
  if (!ticket) return null;
  const subtotal = ticket.subtotal ?? lineSubtotal(ticket.lines ?? []);
  const rawRedemption = ticket.loyaltyRedemption?.halalas ?? 0;
  const loyaltyRedemption = money(Math.min(Math.max(0, rawRedemption), subtotal.halalas));
  const total = money(Math.max(0, subtotal.halalas - loyaltyRedemption.halalas));
  return {
    ...ticket,
    customer: normalizeCustomerReference(ticket.customer),
    subtotal,
    loyaltyRedemption,
    taxIncluded: money(Math.round((total.halalas * 15) / 115)),
    total,
  };
};

const normalizeReceipt = (receipt: Receipt | null | undefined): Receipt | null => {
  if (!receipt) return null;
  const legacyTotal = receipt.total ?? money(0);
  const subtotal = receipt.subtotal ?? legacyTotal;
  const loyaltyRedemption = receipt.loyaltyRedemption ?? money(0);
  return {
    ...receipt,
    paymentMethod: receipt.paymentMethod ?? "cash",
    items: receipt.items ?? [],
    subtotal,
    loyaltyRedemption,
    taxIncluded: receipt.taxIncluded ?? money(Math.round((legacyTotal.halalas * 15) / 115)),
    loyaltyEarned: receipt.loyaltyEarned ?? money(0),
    customer: normalizeCustomerReference(receipt.customer),
  };
};

const migrateDebtLedger = (
  customers: readonly Customer[],
  creditSales: readonly CreditSaleRecord[],
  debtPayments: readonly DebtPaymentRecord[],
): DebtLedgerEntry[] => {
  const converted: DebtLedgerEntry[] = [
    ...creditSales.map((record) => ({ id: `ledger-${record.id}`, customerId: record.customerId, kind: "credit-sale" as const, direction: "debit" as const, amount: record.amount, createdAt: record.createdAt, ticketSequence: record.ticket.sequence })),
    ...debtPayments.map((record) => ({ id: `ledger-${record.id}`, customerId: record.customerId, kind: "payment" as const, direction: "credit" as const, amount: record.amount, createdAt: record.createdAt, ticketSequence: null })),
  ];
  for (const customer of customers) {
    const knownNet = converted
      .filter((entry) => entry.customerId === customer.id)
      .reduce((sum, entry) => sum + (entry.direction === "debit" ? entry.amount.halalas : -entry.amount.halalas), 0);
    const opening = customer.debt.halalas - knownNet;
    if (opening === 0) continue;
    converted.push({ id: `ledger-opening-${customer.id}`, customerId: customer.id, kind: "opening", direction: opening > 0 ? "debit" : "credit", amount: money(Math.abs(opening)), createdAt: "2026-08-01T00:00:00.000Z", ticketSequence: null });
  }
  return converted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};

class MockStore {
  private state: Persisted;
  private checkout: { id: string; ticket: Ticket; method: "cash" | "card" | null } | null = null;
  private completedCommands = new Map<string, Receipt>();
  private readonly catalog = createBrowserCatalogReader();

  constructor() {
    this.state = this.read();
  }

  restore(): RestoredPosState {
    return { device: this.state.device, employee: this.state.employee, ticket: this.state.ticket, receipt: this.state.receipt };
  }

  private read(): Persisted {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return emptyState();
      const parsed = JSON.parse(raw) as Partial<Persisted>;
      const customers = (parsed.customers ?? initialCustomers()).map(normalizeCustomer);
      const creditSales = (parsed.creditSales ?? []).map((record) => ({ ...record, ticket: normalizeTicket(record.ticket) ?? record.ticket }));
      const debtPayments = parsed.debtPayments ?? [];
      const debtLedger = parsed.debtLedger ?? migrateDebtLedger(customers, creditSales, debtPayments);
      const receipts = (parsed.receipts ?? (parsed.receipt ? [parsed.receipt] : []))
        .map(normalizeReceipt)
        .filter((receipt): receipt is Receipt => receipt !== null);
      return {
        ...emptyState(),
        ...parsed,
        ticket: normalizeTicket(parsed.ticket),
        receipt: normalizeReceipt(parsed.receipt),
        receipts,
        openTickets: (parsed.openTickets ?? []).map((ticket) => normalizeTicket(ticket) ?? ticket),
        salePages: parsed.salePages?.length ? parsed.salePages : initialSalePages(),
        customers,
        creditSales,
        debtPayments,
        debtLedger,
      };
    } catch {
      return emptyState();
    }
  }

  private persist() {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
  }

  private debtBalanceHalalas(customerId: string) {
    return this.state.debtLedger
      .filter((entry) => entry.customerId === customerId)
      .reduce((sum, entry) => sum + (entry.direction === "debit" ? entry.amount.halalas : -entry.amount.halalas), 0);
  }

  private customerWithBalance(customer: Customer): Customer {
    return { ...normalizeCustomer(customer), debt: money(Math.max(0, this.debtBalanceHalalas(customer.id))) };
  }

  private requireCustomer(customerId: string): Customer {
    const customer = this.state.customers.find((item) => item.id === customerId);
    if (!customer) throw new PosContractError("CUSTOMER_NOT_FOUND", "تعذر العثور على العميل.");
    return this.customerWithBalance(customer);
  }

  private requireTicket(ticketId: string): Ticket {
    const ticket = this.state.ticket;
    if (!ticket || ticket.id !== ticketId) throw new PosContractError("TICKET_NOT_FOUND", "تعذر العثور على التذكرة الحالية.");
    return normalizeTicket(ticket) ?? ticket;
  }

  private requireCheckout(checkoutId: string) {
    if (!this.checkout || this.checkout.id !== checkoutId) {
      throw new PosContractError("CHECKOUT_NOT_FOUND", "انتهت جلسة الدفع. ارجع إلى التذكرة وحاول مجددًا.");
    }
    return this.checkout;
  }

  private saveTicket(ticket: Ticket): Ticket {
    this.state = { ...this.state, ticket };
    this.persist();
    return ticket;
  }

  private createTicket(
    lines: readonly TicketLine[],
    sequence: number,
    id = createId("ticket"),
    customer: CustomerReference | null = null,
    redemption: Money = money(0),
  ): Ticket {
    const subtotal = lineSubtotal(lines);
    const redemptionHalalas = customer ? Math.min(Math.max(0, redemption.halalas), subtotal.halalas) : 0;
    const loyaltyRedemption = money(redemptionHalalas);
    const total = money(subtotal.halalas - redemptionHalalas);
    return {
      id,
      sequence,
      lines,
      customer,
      subtotal,
      loyaltyRedemption,
      taxIncluded: money(Math.round((total.halalas * 15) / 115)),
      total,
      updatedAt: new Date().toISOString(),
    };
  }

  private makeReceipt(ticket: Ticket, paymentMethod: "cash" | "card" | "credit", tendered: Money, completedAt = new Date().toISOString()): Receipt {
    return {
      id: createId("receipt"),
      number: `R-${String(ticket.sequence).padStart(5, "0")}`,
      paymentMethod,
      items: receiptItems(ticket),
      subtotal: ticket.subtotal,
      loyaltyRedemption: ticket.loyaltyRedemption,
      taxIncluded: ticket.taxIncluded,
      total: ticket.total,
      tendered,
      change: paymentMethod === "cash" ? money(Math.max(0, tendered.halalas - ticket.total.halalas)) : money(0),
      loyaltyEarned: money(0),
      completedAt,
      employeeName: this.state.employee?.employeeName ?? "موظف رفاد",
      branchName: this.state.device?.branchName ?? "فرع رفاد",
      customer: ticket.customer,
    };
  }

  async link(email: string, password: string): Promise<DeviceSession> {
    await pause();
    if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 4) throw new PosContractError("INVALID_CREDENTIALS", "تحقق من البريد الإلكتروني وكلمة المرور.");
    const device: DeviceSession = { deviceId: "device-pos-01", deviceName: "جهاز البيع 01", branchId: "branch-olaya", branchName: "فرع العليا", linkedEmail: email };
    this.state = { ...this.state, device, employee: null };
    this.persist();
    return device;
  }

  async unlock(pin: string): Promise<EmployeeSession> {
    await pause();
    if (pin !== "1234") throw new PosContractError("INVALID_PIN", "الرقم السري غير صحيح.");
    const employee = { employeeId: "employee-001", employeeName: "محمد العتيبي", roleName: "أمين صندوق" };
    this.state = { ...this.state, employee };
    this.persist();
    return employee;
  }

  async search(query: string, categoryId: string | null): Promise<readonly Product[]> {
    await pause();
    const uncategorized = categoryId === "uncategorized";
    const items = await this.catalog.listItems({
      query,
      categoryId: uncategorized ? null : categoryId === "all" ? null : categoryId,
      includeUnavailable: false,
    });
    return items
      .filter((item) => !uncategorized || item.categoryId === null)
      .map(toPosProduct);
  }

  async listCategories() {
    await pause();
    const categories = await this.catalog.listCategories();
    const items = await this.catalog.listItems({ includeUnavailable: false });
    return items.some((item) => item.categoryId === null)
      ? [...categories, { id: "uncategorized", name: "بدون فئة" }]
      : categories;
  }

  async listSalePages() { await pause(); return this.state.salePages; }
  async listReceipts() { await pause(); return this.state.receipts; }

  async listReceiptsByCustomer(customerId: string): Promise<readonly Receipt[]> {
    await pause();
    return this.state.receipts.filter((receipt) => receipt.customer?.id === customerId).sort((a, b) => b.completedAt.localeCompare(a.completedAt));
  }

  async setReceiptLoyaltyEarned(receiptId: string, earned: Money): Promise<Receipt> {
    await pause();
    const receipt = this.state.receipts.find((item) => item.id === receiptId);
    if (!receipt) throw new PosContractError("RECEIPT_NOT_FOUND", "تعذر العثور على الإيصال.");
    const updated = { ...receipt, loyaltyEarned: earned };
    this.state = {
      ...this.state,
      receipt: this.state.receipt?.id === receiptId ? updated : this.state.receipt,
      receipts: this.state.receipts.map((item) => item.id === receiptId ? updated : item),
    };
    this.persist();
    return updated;
  }

  async emailReceipt(receiptId: string, email: string): Promise<void> {
    await pause();
    if (!this.state.receipts.some((item) => item.id === receiptId)) throw new PosContractError("RECEIPT_NOT_FOUND", "تعذر العثور على الإيصال.");
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) throw new PosContractError("INVALID_EMAIL", "أدخل بريدًا إلكترونيًا صحيحًا.");
  }

  async searchCustomers(query: string): Promise<readonly Customer[]> {
    await pause();
    const text = query.trim().toLocaleLowerCase("ar");
    const mobile = normalizeMobile(query);
    return this.state.customers
      .map((customer) => this.customerWithBalance(customer))
      .filter((customer) => !text || customer.name.toLocaleLowerCase("ar").includes(text) || (mobile.length > 0 && normalizeMobile(customer.mobile).includes(mobile)));
  }

  async createCustomer(name: string, mobileInput: string, details: CustomerDetails): Promise<Customer> {
    return this.saveCustomer(null, name, mobileInput, details);
  }

  async updateCustomer(customerId: string, name: string, mobileInput: string, details: CustomerDetails): Promise<Customer> {
    return this.saveCustomer(customerId, name, mobileInput, details);
  }

  private async saveCustomer(customerId: string | null, name: string, mobileInput: string, details: CustomerDetails): Promise<Customer> {
    await pause();
    const nameValue = name.trim();
    const mobile = normalizeMobile(mobileInput);
    if (!nameValue) throw new PosContractError("CUSTOMER_NAME_REQUIRED", "اكتب اسم العميل.");
    if (!/^05\d{8}$/.test(mobile)) throw new PosContractError("INVALID_CUSTOMER_MOBILE", "أدخل رقم جوال سعودي صحيحًا مثل 05XXXXXXXX.");
    if (this.state.customers.some((customer) => customer.id !== customerId && normalizeMobile(customer.mobile) === mobile)) throw new PosContractError("CUSTOMER_MOBILE_EXISTS", "يوجد عميل مسجل بهذا الرقم بالفعل.");
    const normalizedDetails = normalizeCustomerDetails(details);
    if (normalizedDetails.customerCode && this.state.customers.some((customer) => customer.id !== customerId && customer.details.customerCode === normalizedDetails.customerCode)) throw new PosContractError("CUSTOMER_CODE_EXISTS", "رمز العميل مستخدم لعميل آخر.");

    const existing = customerId ? this.requireCustomer(customerId) : null;
    const customer: Customer = { id: existing?.id ?? createId("customer"), name: nameValue, mobile, details: normalizedDetails, debt: existing?.debt ?? money(0) };
    const customers = existing
      ? this.state.customers.map((item) => item.id === customer.id ? customer : item)
      : [...this.state.customers, customer];
    const ticket = this.state.ticket?.customer?.id === customer.id
      ? { ...this.state.ticket, customer: customerReference(customer), updatedAt: new Date().toISOString() }
      : this.state.ticket;
    this.state = { ...this.state, customers, ticket };
    this.persist();
    return this.customerWithBalance(customer);
  }

  async setTicketCustomer(ticketId: string, customerId: string | null): Promise<Ticket> {
    await pause();
    const ticket = this.requireTicket(ticketId);
    const customer = customerId ? this.requireCustomer(customerId) : null;
    const sameCustomer = customer?.id === ticket.customer?.id;
    return this.saveTicket({
      ...ticket,
      customer: customer ? customerReference(customer) : null,
      loyaltyRedemption: sameCustomer ? ticket.loyaltyRedemption : money(0),
      total: sameCustomer ? ticket.total : ticket.subtotal,
      taxIncluded: sameCustomer ? ticket.taxIncluded : money(Math.round((ticket.subtotal.halalas * 15) / 115)),
      updatedAt: new Date().toISOString(),
    });
  }

  async setLoyaltyRedemption(ticketId: string, amount: Money): Promise<Ticket> {
    await pause();
    const ticket = this.requireTicket(ticketId);
    if (!ticket.customer) throw new PosContractError("CUSTOMER_REQUIRED", "أضف عميلًا إلى التذكرة أولًا.");
    if (!Number.isSafeInteger(amount.halalas) || amount.halalas < 0) throw new PosContractError("INVALID_LOYALTY_REDEMPTION", "قيمة الاستبدال غير صالحة.");
    const quote = await loyaltyContract.quoteRedemption({ customerId: ticket.customer.id, ticketTotal: ticket.subtotal });
    if (amount.halalas > quote.amount.halalas) throw new PosContractError("LOYALTY_REDEMPTION_EXCEEDS_BALANCE", "قيمة الاستبدال أكبر من الرصيد المتاح.");
    return this.saveTicket(this.createTicket(ticket.lines, ticket.sequence, ticket.id, ticket.customer, amount));
  }

  async listCustomerLedger(customerId: string): Promise<readonly DebtLedgerEntry[]> {
    await pause();
    this.requireCustomer(customerId);
    return this.state.debtLedger.filter((entry) => entry.customerId === customerId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async chargeTicketToCustomer(commandId: string, customerId: string, ticketId: string): Promise<{ customer: Customer; receipt: Receipt }> {
    await pause();
    const prior = this.state.creditSales.find((record) => record.commandId === commandId);
    if (prior) {
      const customer = this.requireCustomer(prior.customerId);
      const storedReceipt = prior.receiptId ? this.state.receipts.find((item) => item.id === prior.receiptId) : null;
      if (storedReceipt) return { customer, receipt: storedReceipt };
      const normalizedTicket = normalizeTicket(prior.ticket) ?? prior.ticket;
      return { customer, receipt: this.makeReceipt(normalizedTicket, "credit", money(0), prior.createdAt) };
    }

    const ticket = this.requireTicket(ticketId);
    if (ticket.lines.length === 0) throw new PosContractError("EMPTY_TICKET", "أضف عنصرًا واحدًا على الأقل قبل البيع الآجل.");
    const customer = this.requireCustomer(customerId);
    const chargedTicket = this.createTicket(ticket.lines, ticket.sequence, ticket.id, customerReference(customer), ticket.loyaltyRedemption);
    const createdAt = new Date().toISOString();
    const receipt = this.makeReceipt(chargedTicket, "credit", money(0), createdAt);
    const record: CreditSaleRecord = { id: createId("credit-sale"), commandId, customerId, ticket: chargedTicket, amount: chargedTicket.total, createdAt, receiptId: receipt.id };
    const ledgerEntry: DebtLedgerEntry = { id: createId("debt-entry"), customerId, kind: "credit-sale", direction: "debit", amount: chargedTicket.total, createdAt, ticketSequence: ticket.sequence };
    const updatedCustomer = { ...customer, debt: money(customer.debt.halalas + chargedTicket.total.halalas) };
    this.state = {
      ...this.state,
      customers: this.state.customers.map((item) => item.id === customerId ? updatedCustomer : item),
      creditSales: [record, ...this.state.creditSales],
      debtLedger: [ledgerEntry, ...this.state.debtLedger],
      receipt,
      receipts: [receipt, ...this.state.receipts.filter((item) => item.id !== receipt.id)],
      ticket: null,
    };
    this.checkout = null;
    this.persist();
    return { customer: this.customerWithBalance(updatedCustomer), receipt };
  }

  async settleCustomerDebt(
    commandId: string,
    customerId: string,
    amount: Money,
    collectionMethod?: DebtCollectionMethod,
    collectionReceiptId?: string,
    collectionReceiptNumber?: string,
    collectedAt?: string,
  ): Promise<Customer> {
    await pause();
    const prior = this.state.debtPayments.find((record) => record.commandId === commandId);
    if (prior) return this.requireCustomer(prior.customerId);
    const customer = this.requireCustomer(customerId);
    if (!Number.isSafeInteger(amount.halalas) || amount.halalas <= 0) throw new PosContractError("INVALID_DEBT_PAYMENT", "أدخل مبلغ سداد أكبر من صفر.");
    if (amount.halalas > customer.debt.halalas) throw new PosContractError("DEBT_PAYMENT_EXCEEDS_BALANCE", "مبلغ السداد أكبر من دين العميل.");
    const createdAt = collectedAt ?? new Date().toISOString();
    const payment: DebtPaymentRecord = {
      id: createId("debt-payment"),
      commandId,
      customerId,
      amount,
      createdAt,
      collectionMethod,
      collectionReceiptId,
      collectionReceiptNumber,
    };
    const ledgerEntry: DebtLedgerEntry = {
      id: createId("debt-entry"),
      customerId,
      kind: "payment",
      direction: "credit",
      amount,
      createdAt,
      ticketSequence: null,
      collectionMethod,
      collectionReceiptId,
      collectionReceiptNumber,
    };
    const updatedCustomer = { ...customer, debt: money(customer.debt.halalas - amount.halalas) };
    this.state = {
      ...this.state,
      customers: this.state.customers.map((item) => item.id === customerId ? updatedCustomer : item),
      debtPayments: [payment, ...this.state.debtPayments],
      debtLedger: [ledgerEntry, ...this.state.debtLedger],
    };
    this.persist();
    return this.customerWithBalance(updatedCustomer);
  }

  async createSalePage(name: string): Promise<readonly SalePage[]> {
    await pause();
    const cleanName = name.trim();
    if (!cleanName) throw new PosContractError("PAGE_NAME_REQUIRED", "اكتب اسمًا للصفحة.");
    if (this.state.salePages.some((page) => page.name === cleanName)) throw new PosContractError("PAGE_NAME_DUPLICATE", "يوجد بالفعل صفحة بهذا الاسم.");
    const page = { id: createId("sale-page"), name: cleanName, isDefault: false, productSlots: emptySlots() };
    this.state = { ...this.state, salePages: [...this.state.salePages, page] };
    this.persist();
    return this.state.salePages;
  }

  async renameSalePage(pageId: string, name: string): Promise<readonly SalePage[]> {
    await pause();
    const cleanName = name.trim();
    const page = this.state.salePages.find((item) => item.id === pageId);
    if (!page || page.isDefault) throw new PosContractError("PAGE_NOT_EDITABLE", "هذه الصفحة لا يمكن تعديلها.");
    if (!cleanName) throw new PosContractError("PAGE_NAME_REQUIRED", "اكتب اسمًا للصفحة.");
    if (this.state.salePages.some((item) => item.id !== pageId && item.name === cleanName)) throw new PosContractError("PAGE_NAME_DUPLICATE", "يوجد بالفعل صفحة بهذا الاسم.");
    this.state = { ...this.state, salePages: this.state.salePages.map((item) => item.id === pageId ? { ...item, name: cleanName } : item) };
    this.persist();
    return this.state.salePages;
  }

  async deleteSalePage(pageId: string): Promise<readonly SalePage[]> {
    await pause();
    const page = this.state.salePages.find((item) => item.id === pageId);
    if (!page || page.isDefault) throw new PosContractError("PAGE_NOT_EDITABLE", "هذه الصفحة لا يمكن حذفها.");
    this.state = { ...this.state, salePages: this.state.salePages.filter((item) => item.id !== pageId) };
    this.persist();
    return this.state.salePages;
  }

  async moveSalePage(pageId: string, direction: "previous" | "next"): Promise<readonly SalePage[]> {
    await pause();
    const pages = [...this.state.salePages];
    const index = pages.findIndex((item) => item.id === pageId);
    if (index < 1) throw new PosContractError("PAGE_NOT_EDITABLE", "هذه الصفحة لا يمكن نقلها.");
    const target = direction === "previous" ? index - 1 : index + 1;
    if (target < 1 || target >= pages.length) return pages;
    const current = pages[index];
    const replacement = pages[target];
    if (!current || !replacement) return pages;
    pages[index] = replacement;
    pages[target] = current;
    this.state = { ...this.state, salePages: pages };
    this.persist();
    return pages;
  }

  async placeSalePageProduct(pageId: string, slotIndex: number, productId: string): Promise<readonly SalePage[]> {
    await pause();
    try {
      const product = await this.catalog.getItem({ itemId: productId });
      if (!product.availableForSale) throw new Error("unavailable");
    } catch {
      throw new PosContractError("PRODUCT_NOT_FOUND", "العنصر غير متاح.");
    }
    this.state = {
      ...this.state,
      salePages: this.state.salePages.map((page) => {
        if (page.id !== pageId || page.isDefault) return page;
        const productSlots = [...page.productSlots];
        if (slotIndex < 0 || slotIndex >= productSlots.length) throw new PosContractError("INVALID_PAGE_SLOT", "مكان المنتج غير صالح.");
        productSlots[slotIndex] = productId;
        return { ...page, productSlots };
      }),
    };
    this.persist();
    return this.state.salePages;
  }

  async removeSalePageProduct(pageId: string, slotIndex: number): Promise<readonly SalePage[]> {
    await pause();
    this.state = {
      ...this.state,
      salePages: this.state.salePages.map((page) => {
        if (page.id !== pageId || page.isDefault) return page;
        const productSlots = [...page.productSlots];
        if (slotIndex >= 0 && slotIndex < productSlots.length) productSlots[slotIndex] = null;
        return { ...page, productSlots };
      }),
    };
    this.persist();
    return this.state.salePages;
  }

  async startTicket(): Promise<Ticket> {
    await pause();
    const ticket = this.createTicket([], this.state.nextTicketSequence);
    this.state = { ...this.state, ticket, receipt: null, nextTicketSequence: this.state.nextTicketSequence + 1 };
    this.checkout = null;
    this.persist();
    return ticket;
  }

  async addItem(ticketId: string, productId: string): Promise<Ticket> {
    await pause();
    const ticket = this.requireTicket(ticketId);
    let product: Product;
    try {
      const catalogItem = await this.catalog.getItem({ itemId: productId });
      if (!catalogItem.availableForSale) throw new Error("unavailable");
      product = toPosProduct(catalogItem);
    } catch {
      throw new PosContractError("PRODUCT_NOT_FOUND", "العنصر غير متاح.");
    }
    const existing = ticket.lines.find((line) => line.productId === product.id);
    const lines = existing
      ? ticket.lines.map((line) => line.id === existing.id ? { ...line, quantity: line.quantity + 1 } : line)
      : [...ticket.lines, { id: createId("line"), productId: product.id, name: product.name, unitPrice: product.price, quantity: 1, tone: product.tone } satisfies TicketLine];
    return this.saveTicket(this.createTicket(lines, ticket.sequence, ticket.id, ticket.customer, ticket.loyaltyRedemption));
  }

  async setLineQuantity(ticketId: string, lineId: string, quantity: number): Promise<Ticket> {
    await pause();
    const ticket = this.requireTicket(ticketId);
    if (!Number.isSafeInteger(quantity) || quantity < 0) throw new PosContractError("INVALID_QUANTITY", "الكمية غير صالحة.");
    const lines = quantity === 0 ? ticket.lines.filter((line) => line.id !== lineId) : ticket.lines.map((line) => line.id === lineId ? { ...line, quantity } : line);
    return this.saveTicket(this.createTicket(lines, ticket.sequence, ticket.id, ticket.customer, ticket.loyaltyRedemption));
  }

  async removeLine(ticketId: string, lineId: string) { return this.setLineQuantity(ticketId, lineId, 0); }

  async saveOpenTicket(ticketId: string): Promise<Ticket> {
    await pause();
    const ticket = this.requireTicket(ticketId);
    if (ticket.lines.length === 0) throw new PosContractError("EMPTY_TICKET", "أضف عنصرًا واحدًا على الأقل قبل الحفظ.");
    const nextTicket = this.createTicket([], this.state.nextTicketSequence);
    this.state = { ...this.state, openTickets: [...this.state.openTickets, ticket], ticket: nextTicket, nextTicketSequence: this.state.nextTicketSequence + 1 };
    this.persist();
    return nextTicket;
  }

  async begin(ticketId: string): Promise<{ checkoutId: string }> {
    await pause();
    const ticket = this.requireTicket(ticketId);
    if (ticket.lines.length === 0) throw new PosContractError("EMPTY_TICKET", "أضف عنصرًا واحدًا على الأقل قبل الدفع.");
    const id = createId("checkout");
    this.checkout = { id, ticket, method: null };
    return { checkoutId: id };
  }

  async selectMethod(checkoutId: string, method: "cash" | "card") {
    await pause();
    const checkout = this.requireCheckout(checkoutId);
    this.checkout = { ...checkout, method };
  }

  async completeCash(commandId: string, checkoutId: string, tenderedHalalas: number): Promise<Receipt> {
    await pause();
    const prior = this.completedCommands.get(commandId);
    if (prior) return prior;
    const checkout = this.requireCheckout(checkoutId);
    if (checkout.method !== "cash") throw new PosContractError("PAYMENT_METHOD_REQUIRED", "اختر طريقة الدفع النقدي أولًا.");
    if (tenderedHalalas < checkout.ticket.total.halalas) throw new PosContractError("UNDER_TENDER", "المبلغ المستلم أقل من الإجمالي.");
    const receipt = this.makeReceipt(checkout.ticket, "cash", money(tenderedHalalas));
    this.completedCommands.set(commandId, receipt);
    this.state = { ...this.state, receipt, receipts: [receipt, ...this.state.receipts.filter((item) => item.id !== receipt.id)], ticket: null };
    this.checkout = null;
    this.persist();
    return receipt;
  }

  async completeCard(commandId: string, checkoutId: string): Promise<Receipt> {
    await pause();
    const prior = this.completedCommands.get(commandId);
    if (prior) return prior;
    const checkout = this.requireCheckout(checkoutId);
    if (checkout.method !== "card") throw new PosContractError("PAYMENT_METHOD_REQUIRED", "اختر شبكة / مدى أولًا.");
    const receipt = this.makeReceipt(checkout.ticket, "card", checkout.ticket.total);
    this.completedCommands.set(commandId, receipt);
    this.state = { ...this.state, receipt, receipts: [receipt, ...this.state.receipts.filter((item) => item.id !== receipt.id)], ticket: null };
    this.checkout = null;
    this.persist();
    return receipt;
  }

  async print(): Promise<"queued" | "failed" | "delivery-unknown"> {
    await pause();
    const scenario = new URLSearchParams(window.location.search).get("print");
    if (scenario === "failed") return "failed";
    if (scenario === "unknown") return "delivery-unknown";
    return "queued";
  }
}

export const createMockPosRuntime = (): MockPosRuntime => {
  const store = new MockStore();

  const deviceSession: DeviceSessionContract = { linkWithCredentials: ({ email, password }) => store.link(email, password) };
  const employeeSession: EmployeeSessionContract = { unlock: ({ pin }) => store.unlock(pin) };
  const catalog: CatalogContract = { search: ({ query, categoryId }) => store.search(query, categoryId), categories: () => store.listCategories() };
  const saleLayout: SaleLayoutContract = {
    listPages: () => store.listSalePages(),
    createPage: ({ name }) => store.createSalePage(name),
    renamePage: ({ pageId, name }) => store.renameSalePage(pageId, name),
    deletePage: ({ pageId }) => store.deleteSalePage(pageId),
    movePage: ({ pageId, direction }) => store.moveSalePage(pageId, direction),
    placeProduct: ({ pageId, slotIndex, productId }) => store.placeSalePageProduct(pageId, slotIndex, productId),
    removeProduct: ({ pageId, slotIndex }) => store.removeSalePageProduct(pageId, slotIndex),
  };
  const sales: SalesContract = {
    startTicket: () => store.startTicket(),
    addItem: ({ ticketId, productId }) => store.addItem(ticketId, productId),
    setLineQuantity: ({ ticketId, lineId, quantity }) => store.setLineQuantity(ticketId, lineId, quantity),
    removeLine: ({ ticketId, lineId }) => store.removeLine(ticketId, lineId),
    saveOpenTicket: ({ ticketId }) => store.saveOpenTicket(ticketId),
    setCustomer: ({ ticketId, customerId }) => store.setTicketCustomer(ticketId, customerId),
    setLoyaltyRedemption: ({ ticketId, amount }) => store.setLoyaltyRedemption(ticketId, amount),
  };
  const customerCredit: CustomerCreditContract = {
    search: ({ query }) => store.searchCustomers(query),
    create: ({ name, mobile, details }) => store.createCustomer(name, mobile, details),
    update: ({ customerId, name, mobile, details }) => store.updateCustomer(customerId, name, mobile, details),
    ledger: ({ customerId }) => store.listCustomerLedger(customerId),
    chargeTicket: ({ commandId, customerId, ticketId }) => store.chargeTicketToCustomer(commandId, customerId, ticketId),
    settle: ({ commandId, customerId, amount, collectionMethod, collectionReceiptId, collectionReceiptNumber, collectedAt }) =>
      store.settleCustomerDebt(commandId, customerId, amount, collectionMethod, collectionReceiptId, collectionReceiptNumber, collectedAt),
  };
  const checkout: CheckoutContract = {
    begin: ({ ticketId }) => store.begin(ticketId),
    selectPaymentMethod: ({ checkoutId, method }) => store.selectMethod(checkoutId, method),
    completeCashSale: ({ commandId, checkoutId, tendered }) => store.completeCash(commandId, checkoutId, tendered.halalas),
    completeCardSale: ({ commandId, checkoutId }) => store.completeCard(commandId, checkoutId),
  };
  const receipts: ReceiptsContract = {
    list: () => store.listReceipts(),
    listByCustomer: ({ customerId }) => store.listReceiptsByCustomer(customerId),
    setLoyaltyEarned: ({ receiptId, earned }) => store.setReceiptLoyaltyEarned(receiptId, earned),
    emailReceipt: ({ receiptId, email }) => store.emailReceipt(receiptId, email),
  };
  const printing: PrintingContract = { submit: () => store.print() };

  return {
    restore: () => store.restore(),
    deviceSession,
    employeeSession,
    catalog,
    saleLayout,
    sales,
    customerCredit,
    loyalty: loyaltyContract,
    checkout,
    receipts,
    printing,
  };
};
