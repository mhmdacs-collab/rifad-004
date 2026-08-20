import type { MerchantDeliveryConfiguration } from "../../contracts/posConfigurationAdmin";

/**
 * Rifad-owned starter delivery policy.
 *
 * Known Saudi delivery channels are available for the merchant to enable, but
 * delivery is off by default so a retail activity does not gain restaurant or
 * delivery behavior merely because the configuration schema supports it.
 */
export const createDefaultDeliveryConfiguration = (): MerchantDeliveryConfiguration => ({
  enabled: false,
  channels: [
    {
      id: "delivery-hungerstation",
      name: "HungerStation",
      kind: "platform",
      brandKey: "hungerstation",
      enabled: false,
      electronicPaymentEnabled: true,
      cashOnDeliveryEnabled: true,
      codSettlement: "courier-pays-merchant",
      storeIds: [],
      selfDelivery: null,
    },
    {
      id: "delivery-keeta",
      name: "Keeta",
      kind: "platform",
      brandKey: "keeta",
      enabled: false,
      electronicPaymentEnabled: true,
      cashOnDeliveryEnabled: true,
      codSettlement: "courier-pays-merchant",
      storeIds: [],
      selfDelivery: null,
    },
    {
      id: "delivery-jahez",
      name: "Jahez",
      kind: "platform",
      brandKey: "jahez",
      enabled: false,
      electronicPaymentEnabled: true,
      cashOnDeliveryEnabled: true,
      codSettlement: "courier-pays-merchant",
      storeIds: [],
      selfDelivery: null,
    },
    {
      id: "delivery-self",
      name: "التوصيل الذاتي",
      kind: "self-delivery",
      brandKey: "self-delivery",
      enabled: false,
      electronicPaymentEnabled: false,
      cashOnDeliveryEnabled: true,
      codSettlement: "courier-pays-merchant",
      storeIds: [],
      selfDelivery: {
        feeMode: "manual",
        defaultFeeHalalas: 0,
        allowPosFeeOverride: true,
        feeBeneficiary: "merchant",
      },
    },
  ],
});
