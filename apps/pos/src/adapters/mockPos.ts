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
  CustomerReference,
  DebtLedgerEntry,
  DeviceSession,
  EmployeeSession,
  Money,
  Product,
  Receipt,
  RestoredPosState,
  SalePage,
  Ticket,
  TicketLine,
} from "../domain/models";

const STORAGE_KEY = "rifad.pos.mock.v1";
const WAIT_MS = import.meta.env.MODE === "test" ? 0 : 180;

const products: readonly Product[] = [
  { id: "p-001", name: "قهوة سعودية", categoryId: "hot", categoryName: "المشروبات الساخنة", price: money(1800), abbreviation: "قس", tone: "sand" },
  { id: "p-002", name: "لاتيه", categoryId: "hot", categoryName: "المشروبات الساخنة", price: money(2200), abbreviation: "لا", tone: "amber" },
  { id: "p-003", name: "شاي كرك", categoryId: "hot", categoryName: "المشروبات الساخنة", price: money(1400), abbreviation: "شك", tone: "rose" },
  { id: "p-004", name: "قهوة اليوم", categoryId: "hot", categoryName: "المشروبات الساخنة", price: money(1600), abbreviation: "قي", tone: "stone" },
  { id: "p-005", name: "ماء معدني", categoryId: "cold", categoryName: "المشروبات الباردة", price: money(400), abbreviation: "م", tone: "sky" },
  { id: "p-006", name: "عصير برتقال", categoryId: "cold", categoryName: "المشروبات الباردة", price: money(1500), abbreviation: "عب", tone: "amber" },
  { id: "p-007", name: "موهيتو نعناع", categoryId: "cold", categoryName: "المشروبات الباردة", price: money(1900), abbreviation: "من", tone: "mint" },
  { id: "p-008", name: "تمر سكري", categoryId: "food", categoryName: "المأكولات", price: money(1200), abbreviation: "تس", tone: "sand" },
  { id: "p-009", name: "كرواسون جبن", categoryId: "food", categoryName: "المأكولات", price: money(1700), abbreviation: "كج", tone: "stone" },
  { id: "p-010", name: "ساندويتش حلوم", categoryId: "food", categoryName: "المأكولات", price: money(2600), abbreviation: "سح", tone: "mint" },
  { id: "p-011", name: "كيكة تمر", categoryId: "dessert", categoryName: "الحلويات", price: money(2000), abbreviation: "كت", tone: "rose" },
  { id: "p-012", name: "براوني", categoryId: "dessert", categoryName: "الحلويات", price: money(1800), abbreviation: "بر", tone: "stone" },
];

const categories = [
  { id: "hot", name: "ساخنة" },
  { id: "cold", name: "باردة" },
  { id: "food", name: "مأكولات" },
  { id: "dessert", name: "حلويات" },
] as const;

type CreditSaleRecord = {
  id: string;
  commandId: string;
  customerId: string;
  ticket: Ticket;
  amount: Money;
  createdAt: string;
};

type DebtPaymentRecord = {
  id: string;
  commandId: string;
  customerId: string;
  amount: Money;
  createdAt: string;
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

const emptySlots = () => Array<string | null>(20).fill(null);

const initialSalePages = (): SalePage[] => [
  { id: "all-items", name: "كافة العناصر", isDefault: true, productSlots: [] },
  {
    id: "page-popular",
    name: "أهم المنتجات",
    isDefault: false,
    productSlots: ["p-001", "p-002", "p-003", null, null, ...emptySlots().slice(5)],
  },
  {
    id: "page-drinks",
    name: "المشروبات",
    isDefault: false,
    productSlots: ["p-006", "p-007", "p-005", "p-004", null, ...emptySlots().slice(5)],
  },
];

const initialCustomers = (): Customer[] => [
  { id: "customer-001", name: "أحمد محمد", mobile: "0501234567", debt: money(12000) },
  { id: "customer-002", name: "سارة خالد", mobile: "0559876543", debt: money(3500) },
];

const initialDebtLedger = (): DebtLedgerEntry[] => [
  {
    id: "debt-opening-001",
    customerId: "customer-001",
    kind: "opening",
    direction: "debit",
    amount: money(12000),
    createdAt: "2026-08-01T09:00:00.000Z",
    ticketSequence: null,
  },
  {
    id: "debt-opening-002",
    customerId: "customer-002",
    kind: "opening",
    direction: "debit",
    amount: money(3500),
    createdAt: "2026-08-02T10:30:00.000Z",
    ticketSequence: null,
  },
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

const customerReference = (customer: Customer): CustomerReference => ({
  id: customer.id,
  name: customer.name,
  mobile: customer.mobile,
});

const normalizeTicket = (ticket: Ticket | null | undefined): Ticket | null => {
  if (!ticket) return null;
  return { ...ticket, customer: ticket.customer ?? null };
};

const normalizeReceipt = (receipt: Receipt | null | undefined): Receipt | null => {
  if (!receipt) return null;
  return { ...receipt, customer: receipt.customer ?? null };
};

const migrateDebtLedger = (
  customers: readonly Customer[],
  creditSales: readonly CreditSaleRecord[],
  debtPayments: readonly DebtPaymentRecord[],
): DebtLedgerEntry[] => {
  const converted: DebtLedgerEntry[] = [
    ...creditSales.map((record) => ({
      id: `ledger-${record.id}`,
      customerId: record.customerId,
      kind: "credit-sale" as const,
      direction: "debit" as const,
      amount: record.amount,
      createdAt: record.createdAt,
      ticketSequence: record.ticket.sequence,
    })),
    ...debtPayments.map((record) => ({
      id: `ledger-${record.id}`,
      customerId: record.customerId,
      kind: "payment" as const,
      direction: "credit" as const,
      amount: record.amount,
      createdAt: record.createdAt,
      ticketSequence: null,
    })),
  ];

  for (const customer of customers) {
    const knownNet = converted
      .filter((entry) => entry.customerId === customer.id)
      .reduce((sum, entry) => sum + (entry.direction === "debit" ? entry.amount.halalas : -entry.amount.halalas), 0);
    const opening = customer.debt.halalas - knownNet;
    if (opening === 0) continue;
    converted.push({
      id: `ledger-opening-${customer.id}`,
      customerId: customer.id,
      kind: "opening",
      direction: opening > 0 ? "debit" : "credit",
      amount: money(Math.abs(opening)),
      createdAt: "2026-08-01T00:00:00.000Z",
      ticketSequence: null,
    });
  }

  return converted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};

class MockStore {
  private state: Persisted;
  private checkout: { id: string; ticket: Ticket; method: "cash" | null } | null = null;
  private completedCommands = new Map<string, Receipt>();

  constructor() {
    this.state = this.read();
  }

  restore(): RestoredPosState {
    return {
      device: this.state.device,
      employee: this.state.employee,
      ticket: this.state.ticket,
      receipt: this.state.receipt,
    };
  }

  private read(): Persisted {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return emptyState();
      const parsed = JSON.parse(raw) as Partial<Persisted>;
      const customers = parsed.customers ?? initialCustomers();
      const creditSales = (parsed.creditSales ?? []).map((record) => ({
        ...record,
        ticket: normalizeTicket(record.ticket) ?? record.ticket,
      }));
      const debtPayments = parsed.debtPayments ?? [];
      const debtLedger = parsed.debtLedger ?? migrateDebtLedger(customers, creditSales, debtPayments);
      const migratedReceipts = (parsed.receipts ?? (parsed.receipt ? [parsed.receipt] : []))
        .map((receipt) => normalizeReceipt(receipt))
        .filter((receipt): receipt is Receipt => receipt !== null);
      return {
        ...emptyState(),
        ...parsed,
        ticket: normalizeTicket(parsed.ticket),
        receipt: normalizeReceipt(parsed.receipt),
        receipts: migratedReceipts,
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

  private debtBalanceHalalas(customerId: string): number {
    return this.state.debtLedger
      .filter((entry) => entry.customerId === customerId)
      .reduce((sum, entry) => sum + (entry.direction === "debit" ? entry.amount.halalas : -entry.amount.halalas), 0);
  }

  private customerWithBalance(customer: Customer): Customer {
    return { ...customer, debt: money(Math.max(0, this.debtBalanceHalalas(customer.id))) };
  }

  async link(email: string, password: string): Promise<DeviceSession> {
    await pause();
    if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 4) {
      throw new PosContractError("INVALID_CREDENTIALS", "تحقق من البريد الإلكتروني وكلمة المرور.");
    }
    const device: DeviceSession = {
      deviceId: "device-pos-01",
      deviceName: "جهاز البيع 01",
      branchId: "branch-olaya",
      branchName: "فرع العليا",
      linkedEmail: email,
    };
    this.state = { ...this.state, device, employee: null };
    this.persist();
    return device;
  }

  async unlock(pin: string): Promise<EmployeeSession> {
    await pause();
    if (pin !== "1234") {
      throw new PosContractError("INVALID_PIN", "الرقم السري غير صحيح.");
    }
    const employee: EmployeeSession = {
      employeeId: "employee-001",
      employeeName: "محمد العتيبي",
      roleName: "أمين صندوق",
    };
    this.state = { ...this.state, employee };
    this.persist();
    return employee;
  }

  async search(query: string, categoryId: string | null): Promise<readonly Product[]> {
    await pause();
    const normalized = query.trim().toLocaleLowerCase("ar");
    return products.filter((product) => {
      const matchesCategory = !categoryId || categoryId === "all" || product.categoryId === categoryId;
      const matchesQuery = !normalized || product.name.toLocaleLowerCase("ar").includes(normalized);
      return matchesCategory && matchesQuery;
    });
  }

  async listSalePages(): Promise<readonly SalePage[]> {
    await pause();
    return this.state.salePages;
  }

  async listReceipts(): Promise<readonly Receipt[]> {
    await pause();
    return this.state.receipts;
  }

  async searchCustomers(query: string): Promise<readonly Customer[]> {
    await pause();
    const text = query.trim().toLocaleLowerCase("ar");
    const mobile = normalizeMobile(query);
    return this.state.customers
      .map((customer) => this.customerWithBalance(customer))
      .filter((customer) => {
        if (!text) return true;
        return customer.name.toLocaleLowerCase("ar").includes(text)
          || (mobile.length > 0 && normalizeMobile(customer.mobile).includes(mobile));
      });
  }

  async listCustomerLedger(customerId: string): Promise<readonly DebtLedgerEntry[]> {
    await pause();
    this.requireCustomer(customerId);
    return this.state.debtLedger
      .filter((entry) => entry.customerId === customerId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async createCustomer(name: string, mobileInput: string): Promise<Customer> {
    await pause();
    const nameValue = name.trim();
    const mobile = normalizeMobile(mobileInput);
    if (!nameValue) throw new PosContractError("CUSTOMER_NAME_REQUIRED", "اكتب اسم العميل.");
    if (!/^05\d{8}$/.test(mobile)) {
      throw new PosContractError("INVALID_CUSTOMER_MOBILE", "أدخل رقم جوال سعودي صحيحًا مثل 05XXXXXXXX.");
    }
    if (this.state.customers.some((customer) => normalizeMobile(customer.mobile) === mobile)) {
      throw new PosContractError("CUSTOMER_MOBILE_EXISTS", "يوجد عميل مسجل بهذا الرقم بالفعل.");
    }
    const customer: Customer = {
      id: createId("customer"),
      name: nameValue,
      mobile,
      debt: money(0),
    };
    this.state = { ...this.state, customers: [...this.state.customers, customer] };
    this.persist();
    return customer;
  }

  async setTicketCustomer(ticketId: string, customerId: string | null): Promise<Ticket> {
    await pause();
    const ticket = this.requireTicket(ticketId);
    const customer = customerId ? this.requireCustomer(customerId) : null;
    const updated: Ticket = {
      ...ticket,
      customer: customer ? customerReference(customer) : null,
      updatedAt: new Date().toISOString(),
    };
    return this.saveTicket(updated);
  }

  async chargeTicketToCustomer(commandId: string, customerId: string, ticketId: string): Promise<{ customer: Customer; nextTicket: Ticket }> {
    await pause();
    const prior = this.state.creditSales.find((record) => record.commandId === commandId);
    if (prior) {
      const customer = this.requireCustomer(prior.customerId);
      const nextTicket = this.state.ticket ?? this.createTicket([], this.state.nextTicketSequence);
      return { customer, nextTicket };
    }

    const ticket = this.requireTicket(ticketId);
    if (ticket.lines.length === 0) {
      throw new PosContractError("EMPTY_TICKET", "أضف عنصرًا واحدًا على الأقل قبل البيع الآجل.");
    }
    const customer = this.requireCustomer(customerId);
    const chargedTicket: Ticket = {
      ...ticket,
      customer: customerReference(customer),
      updatedAt: new Date().toISOString(),
    };
    const record: CreditSaleRecord = {
      id: createId("credit-sale"),
      commandId,
      customerId,
      ticket: chargedTicket,
      amount: chargedTicket.total,
      createdAt: new Date().toISOString(),
    };
    const ledgerEntry: DebtLedgerEntry = {
      id: createId("debt-entry"),
      customerId,
      kind: "credit-sale",
      direction: "debit",
      amount: chargedTicket.total,
      createdAt: record.createdAt,
      ticketSequence: chargedTicket.sequence,
    };
    const nextTicket = this.createTicket([], this.state.nextTicketSequence);
    const nextLedger = [ledgerEntry, ...this.state.debtLedger];
    const updatedCustomer: Customer = {
      ...customer,
      debt: money(customer.debt.halalas + chargedTicket.total.halalas),
    };

    this.state = {
      ...this.state,
      customers: this.state.customers.map((item) => item.id === customerId ? updatedCustomer : item),
      creditSales: [record, ...this.state.creditSales],
      debtLedger: nextLedger,
      ticket: nextTicket,
      receipt: null,
      nextTicketSequence: this.state.nextTicketSequence + 1,
    };
    this.checkout = null;
    this.persist();
    return { customer: this.customerWithBalance(updatedCustomer), nextTicket };
  }

  async settleCustomerDebt(commandId: string, customerId: string, amount: Money): Promise<Customer> {
    await pause();
    const prior = this.state.debtPayments.find((record) => record.commandId === commandId);
    if (prior) return this.requireCustomer(prior.customerId);

    const customer = this.requireCustomer(customerId);
    if (!Number.isSafeInteger(amount.halalas) || amount.halalas <= 0) {
      throw new PosContractError("INVALID_DEBT_PAYMENT", "أدخل مبلغ سداد أكبر من صفر.");
    }
    if (amount.halalas > customer.debt.halalas) {
      throw new PosContractError("DEBT_PAYMENT_EXCEEDS_BALANCE", "مبلغ السداد أكبر من دين العميل.");
    }

    const createdAt = new Date().toISOString();
    const payment: DebtPaymentRecord = {
      id: createId("debt-payment"),
      commandId,
      customerId,
      amount,
      createdAt,
    };
    const ledgerEntry: DebtLedgerEntry = {
      id: createId("debt-entry"),
      customerId,
      kind: "payment",
      direction: "credit",
      amount,
      createdAt,
      ticketSequence: null,
    };
    const updatedCustomer: Customer = {
      ...customer,
      debt: money(customer.debt.halalas - amount.halalas),
    };
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
    if (this.state.salePages.some((page) => page.name === cleanName)) {
      throw new PosContractError("PAGE_NAME_DUPLICATE", "يوجد بالفعل صفحة بهذا الاسم.");
    }
    const page: SalePage = {
      id: createId("sale-page"),
      name: cleanName,
      isDefault: false,
      productSlots: emptySlots(),
    };
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
    if (this.state.salePages.some((item) => item.id !== pageId && item.name === cleanName)) {
      throw new PosContractError("PAGE_NAME_DUPLICATE", "يوجد بالفعل صفحة بهذا الاسم.");
    }
    this.state = {
      ...this.state,
      salePages: this.state.salePages.map((item) => item.id === pageId ? { ...item, name: cleanName } : item),
    };
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
    if (target < 1 || target >= pages.length) return this.state.salePages;
    const currentPage = pages[index];
    const targetPage = pages[target];
    if (!currentPage || !targetPage) return this.state.salePages;
    pages[index] = targetPage;
    pages[target] = currentPage;
    this.state = { ...this.state, salePages: pages };
    this.persist();
    return this.state.salePages;
  }

  async placeSalePageProduct(pageId: string, slotIndex: number, productId: string): Promise<readonly SalePage[]> {
    await pause();
    if (!products.some((product) => product.id === productId)) {
      throw new PosContractError("PRODUCT_NOT_FOUND", "العنصر غير متاح.");
    }
    this.state = {
      ...this.state,
      salePages: this.state.salePages.map((page) => {
        if (page.id !== pageId || page.isDefault) return page;
        const productSlots = [...page.productSlots];
        if (slotIndex < 0 || slotIndex >= productSlots.length) {
          throw new PosContractError("INVALID_PAGE_SLOT", "مكان المنتج غير صالح.");
        }
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
    this.state = {
      ...this.state,
      ticket,
      receipt: null,
      nextTicketSequence: this.state.nextTicketSequence + 1,
    };
    this.checkout = null;
    this.persist();
    return ticket;
  }

  async addItem(ticketId: string, productId: string): Promise<Ticket> {
    await pause();
    const ticket = this.requireTicket(ticketId);
    const product = products.find((item) => item.id === productId);
    if (!product) throw new PosContractError("PRODUCT_NOT_FOUND", "العنصر غير متاح.");
    const existing = ticket.lines.find((line) => line.productId === product.id);
    const lines = existing
      ? ticket.lines.map((line) => (line.id === existing.id ? { ...line, quantity: line.quantity + 1 } : line))
      : [
          ...ticket.lines,
          {
            id: createId("line"),
            productId: product.id,
            name: product.name,
            unitPrice: product.price,
            quantity: 1,
            tone: product.tone,
          } satisfies TicketLine,
        ];
    return this.saveTicket(this.createTicket(lines, ticket.sequence, ticket.id, ticket.customer ?? null));
  }

  async setLineQuantity(ticketId: string, lineId: string, quantity: number): Promise<Ticket> {
    await pause();
    const ticket = this.requireTicket(ticketId);
    if (!Number.isSafeInteger(quantity) || quantity < 0) {
      throw new PosContractError("INVALID_QUANTITY", "الكمية غير صالحة.");
    }
    const lines = quantity === 0
      ? ticket.lines.filter((line) => line.id !== lineId)
      : ticket.lines.map((line) => (line.id === lineId ? { ...line, quantity } : line));
    return this.saveTicket(this.createTicket(lines, ticket.sequence, ticket.id, ticket.customer ?? null));
  }

  async removeLine(ticketId: string, lineId: string): Promise<Ticket> {
    return this.setLineQuantity(ticketId, lineId, 0);
  }

  async saveOpenTicket(ticketId: string): Promise<Ticket> {
    await pause();
    const ticket = this.requireTicket(ticketId);
    if (ticket.lines.length === 0) {
      throw new PosContractError("EMPTY_TICKET", "أضف عنصرًا واحدًا على الأقل قبل الحفظ.");
    }
    const nextTicket = this.createTicket([], this.state.nextTicketSequence);
    this.state = {
      ...this.state,
      openTickets: [...this.state.openTickets, ticket],
      ticket: nextTicket,
      nextTicketSequence: this.state.nextTicketSequence + 1,
    };
    this.persist();
    return nextTicket;
  }

  async begin(ticketId: string): Promise<{ checkoutId: string }> {
    await pause();
    const ticket = this.requireTicket(ticketId);
    if (ticket.lines.length === 0) {
      throw new PosContractError("EMPTY_TICKET", "أضف عنصرًا واحدًا على الأقل قبل الدفع.");
    }
    const id = createId("checkout");
    this.checkout = { id, ticket, method: null };
    return { checkoutId: id };
  }

  async selectMethod(checkoutId: string): Promise<void> {
    await pause();
    const checkout = this.requireCheckout(checkoutId);
    this.checkout = { ...checkout, method: "cash" };
  }

  async completeCash(commandId: string, checkoutId: string, tenderedHalalas: number): Promise<Receipt> {
    await pause();
    const prior = this.completedCommands.get(commandId);
    if (prior) return prior;
    const checkout = this.requireCheckout(checkoutId);
    if (checkout.method !== "cash") {
      throw new PosContractError("PAYMENT_METHOD_REQUIRED", "اختر طريقة الدفع النقدي أولًا.");
    }
    if (tenderedHalalas < checkout.ticket.total.halalas) {
      throw new PosContractError("UNDER_TENDER", "المبلغ المستلم أقل من الإجمالي.");
    }
    const receipt: Receipt = {
      id: createId("receipt"),
      number: `R-${String(checkout.ticket.sequence).padStart(5, "0")}`,
      total: checkout.ticket.total,
      tendered: money(tenderedHalalas),
      change: money(tenderedHalalas - checkout.ticket.total.halalas),
      completedAt: new Date().toISOString(),
      employeeName: this.state.employee?.employeeName ?? "موظف رفاد",
      branchName: this.state.device?.branchName ?? "فرع رفاد",
      customer: checkout.ticket.customer ?? null,
    };
    this.completedCommands.set(commandId, receipt);
    this.state = {
      ...this.state,
      receipt,
      receipts: [receipt, ...this.state.receipts.filter((item) => item.id !== receipt.id)],
      ticket: null,
    };
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

  private requireCustomer(customerId: string): Customer {
    const customer = this.state.customers.find((item) => item.id === customerId);
    if (!customer) throw new PosContractError("CUSTOMER_NOT_FOUND", "تعذر العثور على العميل.");
    return this.customerWithBalance(customer);
  }

  private requireTicket(ticketId: string): Ticket {
    const ticket = this.state.ticket;
    if (!ticket || ticket.id !== ticketId) {
      throw new PosContractError("TICKET_NOT_FOUND", "تعذر العثور على التذكرة الحالية.");
    }
    return { ...ticket, customer: ticket.customer ?? null };
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
  ): Ticket {
    const subtotal = addMoney(...lines.map((line) => multiplyMoney(line.unitPrice, line.quantity)));
    const taxIncluded = money(Math.round((subtotal.halalas * 15) / 115));
    return {
      id,
      sequence,
      lines,
      customer,
      subtotal,
      taxIncluded,
      total: subtotal,
      updatedAt: new Date().toISOString(),
    };
  }
}

export const createMockPosRuntime = (): MockPosRuntime => {
  const store = new MockStore();

  const deviceSession: DeviceSessionContract = {
    linkWithCredentials: ({ email, password }) => store.link(email, password),
  };
  const employeeSession: EmployeeSessionContract = {
    unlock: ({ pin }) => store.unlock(pin),
  };
  const catalog: CatalogContract = {
    search: ({ query, categoryId }) => store.search(query, categoryId),
    categories: async () => categories,
  };
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
  };
  const customerCredit: CustomerCreditContract = {
    search: ({ query }) => store.searchCustomers(query),
    create: ({ name, mobile }) => store.createCustomer(name, mobile),
    ledger: ({ customerId }) => store.listCustomerLedger(customerId),
    chargeTicket: ({ commandId, customerId, ticketId }) => store.chargeTicketToCustomer(commandId, customerId, ticketId),
    settle: ({ commandId, customerId, amount }) => store.settleCustomerDebt(commandId, customerId, amount),
  };
  const checkout: CheckoutContract = {
    begin: ({ ticketId }) => store.begin(ticketId),
    selectPaymentMethod: ({ checkoutId }) => store.selectMethod(checkoutId),
    completeCashSale: ({ commandId, checkoutId, tendered }) => store.completeCash(commandId, checkoutId, tendered.halalas),
  };
  const receipts: ReceiptsContract = {
    list: () => store.listReceipts(),
  };
  const printing: PrintingContract = {
    submit: () => store.print(),
  };

  return {
    restore: () => store.restore(),
    deviceSession,
    employeeSession,
    catalog,
    saleLayout,
    sales,
    customerCredit,
    checkout,
    receipts,
    printing,
  };
};
