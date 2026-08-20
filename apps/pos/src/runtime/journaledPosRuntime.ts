import type { LocalDomainEventDraft, LocalPersistenceContract } from "../contracts/localPersistence";
import type { PosRuntimeContract } from "../contracts/pos";
import type { LegacySnapshotBridge } from "./legacySnapshotBridge";

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
 * Adds Rifad local persistence/outbox behavior around any PosRuntimeContract.
 *
 * When a snapshot bridge is supplied, durable runtime changes are mirrored into
 * one versioned LocalPersistence namespace. Events produced by the same action
 * are committed with that snapshot in the same persistence operation. The
 * bridge exists only for the current legacy mock; a native runtime can write
 * through LocalPersistenceContract directly and omit it.
 */
export const withLocalPersistenceJournal = (
  base: PosRuntimeContract,
  persistence: LocalPersistenceContract,
  snapshotBridge?: LegacySnapshotBridge,
): PosRuntimeContract => {
  const ready = snapshotBridge?.ready ?? Promise.resolve();

  const ensureDeviceBinding = async () => {
    const device = base.restore().device;
    if (!device) return;
    const context = await persistence.getNodeContext();
    if (context.branchId !== device.branchId || context.deviceId !== device.deviceId) {
      await persistence.bindDevice({ branchId: device.branchId, deviceId: device.deviceId });
    }
  };

  const append = async (events: readonly LocalDomainEventDraft[]) => {
    await ready;
    await ensureDeviceBinding();
    await persistence.appendEvents(events);
  };

  const commit = async (events: readonly LocalDomainEventDraft[] = []) => {
    await ready;
    await ensureDeviceBinding();
    if (!snapshotBridge) {
      if (events.length > 0) await persistence.appendEvents(events);
      return;
    }
    const value = snapshotBridge.readCurrentSnapshot();
    if (value === null) {
      throw new Error(`Missing durable POS snapshot after runtime mutation (${snapshotBridge.namespace}).`);
    }
    await persistence.commitSnapshot({
      namespace: snapshotBridge.namespace,
      schemaVersion: snapshotBridge.schemaVersion,
      value,
      events,
    });
  };

  return {
    ...base,
    deviceSession: {
      ...base.deviceSession,
      linkWithCredentials: async (input) => {
        await ready;
        const device = await base.deviceSession.linkWithCredentials(input);
        await persistence.bindDevice({ branchId: device.branchId, deviceId: device.deviceId });
        await commit([
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
    employeeSession: {
      ...base.employeeSession,
      unlock: async (input) => {
        await ready;
        const employee = await base.employeeSession.unlock(input);
        await commit();
        return employee;
      },
    },
    saleLayout: {
      ...base.saleLayout,
      createPage: async (input) => {
        await ready;
        const pages = await base.saleLayout.createPage(input);
        await commit();
        return pages;
      },
      renamePage: async (input) => {
        await ready;
        const pages = await base.saleLayout.renamePage(input);
        await commit();
        return pages;
      },
      deletePage: async (input) => {
        await ready;
        const pages = await base.saleLayout.deletePage(input);
        await commit();
        return pages;
      },
      movePage: async (input) => {
        await ready;
        const pages = await base.saleLayout.movePage(input);
        await commit();
        return pages;
      },
      placeProduct: async (input) => {
        await ready;
        const pages = await base.saleLayout.placeProduct(input);
        await commit();
        return pages;
      },
      removeProduct: async (input) => {
        await ready;
        const pages = await base.saleLayout.removeProduct(input);
        await commit();
        return pages;
      },
    },
    sales: {
      ...base.sales,
      startTicket: async (input) => {
        await ready;
        const ticket = await base.sales.startTicket(input);
        await commit();
        return ticket;
      },
      addItem: async (input) => {
        await ready;
        const ticket = await base.sales.addItem(input);
        await commit();
        return ticket;
      },
      setLineQuantity: async (input) => {
        await ready;
        const ticket = await base.sales.setLineQuantity(input);
        await commit();
        return ticket;
      },
      removeLine: async (input) => {
        await ready;
        const ticket = await base.sales.removeLine(input);
        await commit();
        return ticket;
      },
      saveOpenTicket: async (input) => {
        await ready;
        const current = base.restore().ticket;
        const next = await base.sales.saveOpenTicket(input);
        await commit(current ? [
          domainEvent(
            `ticket.opened:${input.commandId}`,
            "ticket.opened.v1",
            "ticket",
            current.id,
            { ticket: current, nextWorkingTicketId: next.id },
          ),
        ] : []);
        return next;
      },
      setCustomer: async (input) => {
        await ready;
        const ticket = await base.sales.setCustomer(input);
        await commit();
        return ticket;
      },
      setLoyaltyRedemption: async (input) => {
        await ready;
        const ticket = await base.sales.setLoyaltyRedemption(input);
        await commit();
        return ticket;
      },
    },
    customerCredit: {
      ...base.customerCredit,
      create: async (input) => {
        await ready;
        const customer = await base.customerCredit.create(input);
        await commit([
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
        await ready;
        const customer = await base.customerCredit.update(input);
        await commit([
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
        await ready;
        const result = await base.customerCredit.chargeTicket(input);
        const employee = base.restore().employee;
        await commit([
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
        await ready;
        const customer = await base.customerCredit.settle(input);
        await commit([
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
        await ready;
        const receipt = await base.checkout.completeCashSale(input);
        const employee = base.restore().employee;
        await commit([
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
        await ready;
        const receipt = await base.checkout.completeCardSale(input);
        const employee = base.restore().employee;
        await commit([
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
        await ready;
        const receipt = await base.receipts.setLoyaltyEarned(input);
        await commit([
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
        await ready;
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
