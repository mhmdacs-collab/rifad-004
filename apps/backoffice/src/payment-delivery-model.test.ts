import { afterEach, describe, expect, it } from "vitest";
import {
  BROWSER_POS_CONFIGURATION_ADMIN_STORAGE_KEY,
  createBrowserPosConfigurationAdmin,
} from "../../../adapters/posConfiguration/browserPosConfigurationAdmin";

afterEach(() => {
  window.localStorage.removeItem(BROWSER_POS_CONFIGURATION_ADMIN_STORAGE_KEY);
});

describe("MAP-01 payment and delivery merchant policy", () => {
  it("starts with Cash/Network/Credit and preserves direct financial impact", async () => {
    const admin = createBrowserPosConfigurationAdmin();
    const initial = await admin.read();

    expect(initial.paymentTypes.map((payment) => ({
      id: payment.id,
      name: payment.name,
      enabled: payment.enabled,
      impact: payment.directImpact,
      systemDefault: payment.systemDefault,
    }))).toEqual([
      { id: "payment-cash", name: "نقدًا", enabled: true, impact: "cash", systemDefault: "cash" },
      { id: "payment-card", name: "شبكة / مدى", enabled: true, impact: "bank", systemDefault: "network" },
      { id: "payment-credit", name: "آجل", enabled: true, impact: "customer-receivable", systemDefault: "credit" },
    ]);

    const credit = initial.paymentTypes.find((payment) => payment.id === "payment-credit")!;
    const hidden = await admin.savePaymentType({
      commandId: "hide-credit",
      paymentType: { ...credit, enabled: false },
    });
    expect(hidden.paymentTypes.find((payment) => payment.id === "payment-credit")).toMatchObject({
      enabled: false,
      systemDefault: "credit",
      directImpact: "customer-receivable",
    });

    const withTransfer = await admin.savePaymentType({
      commandId: "add-transfer",
      paymentType: {
        id: "payment-transfer",
        name: "تحويل",
        kind: "custom",
        enabled: true,
        availability: "offline-capable",
        storeIds: [],
        directImpact: "bank",
        systemDefault: null,
      },
    });
    expect(withTransfer.paymentTypes.find((payment) => payment.id === "payment-transfer")).toMatchObject({
      name: "تحويل",
      directImpact: "bank",
      enabled: true,
    });
  });

  it("persists delivery channels, COD settlement and self-delivery fee ownership", async () => {
    const admin = createBrowserPosConfigurationAdmin();
    const initial = await admin.read();
    expect(initial.delivery?.enabled).toBe(false);
    expect(initial.delivery?.channels.map((channel) => channel.id)).toEqual([
      "delivery-hungerstation",
      "delivery-keeta",
      "delivery-jahez",
      "delivery-self",
    ]);

    const channels = initial.delivery!.channels.map((channel) => {
      if (channel.id === "delivery-hungerstation") {
        return { ...channel, enabled: true, cashOnDeliveryEnabled: true, codSettlement: "courier-pays-merchant" as const };
      }
      if (channel.id === "delivery-self") {
        return {
          ...channel,
          enabled: true,
          selfDelivery: {
            ...channel.selfDelivery!,
            defaultFeeHalalas: 1500,
            allowPosFeeOverride: true,
            feeBeneficiary: "courier" as const,
          },
        };
      }
      return channel;
    });

    const saved = await admin.saveDeliveryConfiguration!({
      commandId: "delivery-policy",
      delivery: { enabled: true, channels },
    });

    expect(saved.delivery?.enabled).toBe(true);
    expect(saved.delivery?.channels.find((channel) => channel.id === "delivery-hungerstation")).toMatchObject({
      enabled: true,
      cashOnDeliveryEnabled: true,
      codSettlement: "courier-pays-merchant",
    });
    expect(saved.delivery?.channels.find((channel) => channel.id === "delivery-self")?.selfDelivery).toMatchObject({
      defaultFeeHalalas: 1500,
      allowPosFeeOverride: true,
      feeBeneficiary: "courier",
    });

    const reopened = createBrowserPosConfigurationAdmin();
    const restored = await reopened.read();
    expect(restored.delivery).toEqual(saved.delivery);
  });
});
