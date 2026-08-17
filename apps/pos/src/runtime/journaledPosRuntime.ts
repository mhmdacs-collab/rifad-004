import type { LocalDomainEventDraft, LocalPersistenceContract } from "../contracts/localPersistence";
import type { PosRuntimeContract } from "../contracts/pos";

const now = () => new Date().toISOString();

const domainEvent = (
  id: string,
  type: string,
  aggregateType: string,
  aggregateId: string,
  payload: unknown,
  occurredAt = now(),
): LocalDomainEventDraft => ({ id, type, aggregateType, aggregateId, payload, occurredAt });

/**
 * Adds the Rifad local outbox boundary around any PosRuntimeContract.
 *
 * The underlying runtime remains the authority for its current capability
 * behavior. This decorator records durable cross-boundary facts using stable
 * command-derived event IDs so LAN/cloud/fiscal consumers can replay without
 * turning their transport into POS business authority.
 */
export const withLocalPersistenceJournal = (
  base: PosRuntimeContract,
  persistence: LocalPersistenceContract,
): PosRuntimeContract => {
  const ensureDeviceBinding = async () => {
    const device = base.restore().device;
    if (!device) return;
    const context = await persistence.getNodeContext();
    if (context.branchId !== device.branchId || context.deviceId !== device.deviceId) {
      await persistence.bindDevice({ branchId: device.branchId, deviceId: device.deviceId });
    }
  };

  const append = async (events: readonly LocalDomainEventDraft[]) => {
    await ensureDeviceBinding();
    await persistence.appendEvents(events);
  };

  return {
    ...base,
    deviceSession: {
      ...base.deviceSession,
      linkWithCredentials: async (input) => {
        const device = await base.deviceSession.linkWithCredentials(input);
        await persistence.bindDevice({ branchId: device.branchId, deviceId: device.deviceId });
        await persistence.appendEvents([
          domainEvent(
            `device.linked:${input.commandId}`,
            "device.linked.v1",
            "device",
            device.deviceId,
            { device, linkedByCommandId: input.commandId },
          ),
        ]);
        return device;
      },
    },
    sales: {
      ...base.sales,
      saveOpenTicket: async (input) => {
        const current = base.restore().ticket;
        const next = await base.sales.saveOpenTicket(input);
        if (current) {
          await append([
            domainEvent(
              `ticket.opened:${input.commandId}`,
              "ticket.opened.v1",
              "ticket",
              current.id,
              { ticket: current, nextWorkingTicketId: next.id },
            ),
          ]);
        }
        return next;
      },
    },
    customerCredit: {
      ...base.customerCredit,
      create: async (input) => {
        const customer = await base.customerCredit.create(input);
        await append([
          domainEvent(
            `customer.created:${input.commandId}`,
            "customer.created.v1",
            "customer",
            customer.id,
            { customer },
          ),
        ]);
        return customer;
      },
      update: async (input) => {
        const customer = await base.customerCredit.update(input);
        await append([
          domainEvent(
            `customer.updated:${input.commandId}`,
            "customer.updated.v1",
            "customer",
            customer.id,
            { customer },
          ),
        ]);
        return customer;
      },
      chargeTicket: async (input) => {
        const result = await base.customerCredit.chargeTicket(input);
        const employee = base.restore().employee;
        await append([
          domainEvent(
            `sale.completed:${input.commandId}`,
            "sale.completed.v1",
            "receipt",
            result.receipt.id,
            {
              receipt: result.receipt,
              collection: "customer-credit",
              employeeId: employee?.employeeId ?? null,
            },
            result.receipt.completedAt,
          ),
          domainEvent(
            `customer.credit-charged:${input.commandId}`,
            "customer.credit-charged.v1",
            "customer",
            result.customer.id,
            { customer: result.customer, receiptId: result.receipt.id },
            result.receipt.completedAt,
          ),
        ]);
        return result;
      },
      settle: async (input) => {
        const customer = await base.customerCredit.settle(input);
        await append([
          domainEvent(
            `customer.debt-settled:${input.commandId}`,
            "customer.debt-settled.v1",
            "customer",
            customer.id,
            { customer, amount: input.amount },
          ),
        ]);
        return customer;
      },
    },
    checkout: {
      ...base.checkout,
      completeCashSale: async (input) => {
        const receipt = await base.checkout.completeCashSale(input);
        const employee = base.restore().employee;
        await append([
          domainEvent(
            `sale.completed:${input.commandId}`,
            "sale.completed.v1",
            "receipt",
            receipt.id,
            {
              receipt,
              collection: "cash",
              employeeId: employee?.employeeId ?? null,
            },
            receipt.completedAt,
          ),
        ]);
        return receipt;
      },
      completeCardSale: async (input) => {
        const receipt = await base.checkout.completeCardSale(input);
        const employee = base.restore().employee;
        await append([
          domainEvent(
            `sale.completed:${input.commandId}`,
            "sale.completed.v1",
            "receipt",
            receipt.id,
            {
              receipt,
              collection: "card",
              employeeId: employee?.employeeId ?? null,
            },
            receipt.completedAt,
          ),
        ]);
        return receipt;
      },
    },
    receipts: {
      ...base.receipts,
      setLoyaltyEarned: async (input) => {
        const receipt = await base.receipts.setLoyaltyEarned(input);
        await append([
          domainEvent(
            `receipt.loyalty-earned:${receipt.id}:${receipt.loyaltyEarned.halalas}`,
            "receipt.loyalty-earned-set.v1",
            "receipt",
            receipt.id,
            { receiptId: receipt.id, earned: receipt.loyaltyEarned },
          ),
        ]);
        return receipt;
      },
    },
    printing: {
      ...base.printing,
      submit: async (input) => {
        const status = await base.printing.submit(input);
        await append([
          domainEvent(
            `print.attempted:${input.commandId}`,
            "print.attempted.v1",
            "receipt",
            input.receiptId,
            { receiptId: input.receiptId, status },
          ),
        ]);
        return status;
      },
    },
  };
};
