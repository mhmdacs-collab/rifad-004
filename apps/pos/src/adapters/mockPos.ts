import type {
  CatalogContract,
  CheckoutContract,
  DeviceSessionContract,
  EmployeeSessionContract,
  MockPosRuntime,
  PrintingContract,
  SalesContract,
} from "../contracts/pos";
import { PosContractError } from "../contracts/pos";
import { addMoney, money, multiplyMoney } from "../domain/money";
import type {
  DeviceSession,
  EmployeeSession,
  Product,
  Receipt,
  RestoredPosState,
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

type Persisted = {
  device: DeviceSession | null;
  employee: EmployeeSession | null;
  ticket: Ticket | null;
  receipt: Receipt | null;
  nextTicketSequence: number;
};

const emptyState = (): Persisted => ({
  device: null,
  employee: null,
  ticket: null,
  receipt: null,
  nextTicketSequence: 1,
});

const pause = () => new Promise<void>((resolve) => window.setTimeout(resolve, WAIT_MS));
const createId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;

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
      return raw ? (JSON.parse(raw) as Persisted) : emptyState();
    } catch {
      return emptyState();
    }
  }

  private persist() {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
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
    return this.saveTicket(this.createTicket(lines, ticket.sequence, ticket.id));
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
    return this.saveTicket(this.createTicket(lines, ticket.sequence, ticket.id));
  }

  async removeLine(ticketId: string, lineId: string): Promise<Ticket> {
    return this.setLineQuantity(ticketId, lineId, 0);
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
    };
    this.completedCommands.set(commandId, receipt);
    this.state = { ...this.state, receipt, ticket: null };
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

  private requireTicket(ticketId: string): Ticket {
    const ticket = this.state.ticket;
    if (!ticket || ticket.id !== ticketId) {
      throw new PosContractError("TICKET_NOT_FOUND", "تعذر العثور على التذكرة الحالية.");
    }
    return ticket;
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

  private createTicket(lines: readonly TicketLine[], sequence: number, id = createId("ticket")): Ticket {
    const subtotal = addMoney(...lines.map((line) => multiplyMoney(line.unitPrice, line.quantity)));
    const taxIncluded = money(Math.round((subtotal.halalas * 15) / 115));
    return {
      id,
      sequence,
      lines,
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
  const sales: SalesContract = {
    startTicket: () => store.startTicket(),
    addItem: ({ ticketId, productId }) => store.addItem(ticketId, productId),
    setLineQuantity: ({ ticketId, lineId, quantity }) => store.setLineQuantity(ticketId, lineId, quantity),
    removeLine: ({ ticketId, lineId }) => store.removeLine(ticketId, lineId),
  };
  const checkout: CheckoutContract = {
    begin: ({ ticketId }) => store.begin(ticketId),
    selectPaymentMethod: ({ checkoutId }) => store.selectMethod(checkoutId),
    completeCashSale: ({ commandId, checkoutId, tendered }) =>
      store.completeCash(commandId, checkoutId, tendered.halalas),
  };
  const printing: PrintingContract = {
    submit: () => store.print(),
  };

  return {
    restore: () => store.restore(),
    deviceSession,
    employeeSession,
    catalog,
    sales,
    checkout,
    printing,
  };
};
