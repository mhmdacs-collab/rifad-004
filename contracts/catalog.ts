export type CatalogMoney = Readonly<{
  halalas: number;
  currency: "SAR";
}>;

export type CatalogItemShape = "square" | "rounded" | "circle";

export type CatalogItemAppearance = Readonly<{
  mode: "color" | "image";
  color: string;
  shape: CatalogItemShape;
  /**
   * Staging transport only. Production media storage may replace this with an
   * asset reference behind the adapter without changing merchant semantics.
   */
  imageDataUrl: string | null;
}>;

export type CatalogCategory = Readonly<{
  id: string;
  name: string;
  color: string;
}>;

/**
 * Legacy inline variant types are kept temporarily for migration compatibility.
 * New Back Office UX uses reusable option groups and does not expose Cartesian
 * variant construction to the merchant.
 */
export type CatalogVariantValue = Readonly<{ id: string; name: string }>;
export type CatalogVariantOption = Readonly<{
  id: string;
  name: string;
  values: readonly CatalogVariantValue[];
}>;
export type CatalogVariant = Readonly<{
  id: string;
  name: string;
  optionValueIds: readonly string[];
  price: CatalogMoney;
  sku: string;
  barcode: string;
}>;

export type CatalogOptionGroupValue = Readonly<{
  id: string;
  name: string;
  price: CatalogMoney;
}>;

export type CatalogOptionGroup = Readonly<{
  id: string;
  name: string;
  color: string;
  values: readonly CatalogOptionGroupValue[];
  createdAt: string;
  updatedAt: string;
}>;

export type CatalogOptionGroupDraft = Readonly<{
  name: string;
  color?: string;
  values: readonly Readonly<{
    id?: string;
    name: string;
    price: CatalogMoney;
  }>[];
}>;

export type CatalogItemOptionPriceOverride = Readonly<{
  valueId: string;
  price: CatalogMoney;
}>;

export type CatalogItemCustomPriceOption = Readonly<{
  id: string;
  name: string;
  price: CatalogMoney;
}>;

export type CatalogItemPricing =
  | Readonly<{ mode: "fixed"; groupId?: undefined }>
  | Readonly<{
      mode: "option-group";
      groupId: string;
      priceMode: "inherit" | "custom";
      overrides: readonly CatalogItemOptionPriceOverride[];
    }>
  | Readonly<{
      mode: "custom-options";
      groupId?: undefined;
      name: string;
      values: readonly CatalogItemCustomPriceOption[];
    }>;

export type CatalogModifierOption = Readonly<{
  id: string;
  name: string;
  price: CatalogMoney;
}>;

export type CatalogModifierGroup = Readonly<{
  id: string;
  name: string;
  color: string;
  options: readonly CatalogModifierOption[];
  createdAt: string;
  updatedAt: string;
}>;

export type CatalogPrivateModifierGroup = Readonly<{
  id: string;
  name: string;
  options: readonly CatalogModifierOption[];
}>;

export type CatalogItem = Readonly<{
  id: string;
  name: string;
  description: string;
  categoryId: string | null;
  categoryName: string | null;
  /** Fixed price, or the current minimum effective price for option-priced items. */
  price: CatalogMoney;
  pricing?: CatalogItemPricing;
  sku: string;
  barcode: string;
  availableForSale: boolean;
  soldBy: "each";
  appearance?: CatalogItemAppearance;
  optionGroupIds?: readonly string[];
  modifierGroupIds?: readonly string[];
  privateModifierGroups?: readonly CatalogPrivateModifierGroup[];
  /** Legacy migration-only fields. */
  variantOptions?: readonly CatalogVariantOption[];
  variants?: readonly CatalogVariant[];
  createdAt: string;
  updatedAt: string;
}>;

export type CatalogItemDraft = Readonly<{
  name: string;
  description: string;
  categoryId: string | null;
  price: CatalogMoney;
  pricing?: CatalogItemPricing;
  sku: string;
  barcode: string;
  availableForSale: boolean;
  appearance?: CatalogItemAppearance;
  modifierGroupIds?: readonly string[];
  privateModifierGroups?: readonly CatalogPrivateModifierGroup[];
  /** Legacy migration-only fields. */
  variantOptions?: readonly CatalogVariantOption[];
  variants?: readonly CatalogVariant[];
}>;

export type CatalogModifierOptionDraft = Readonly<{
  id?: string;
  name: string;
  price: CatalogMoney;
}>;

export type CatalogModifierGroupDraft = Readonly<{
  name: string;
  color?: string;
  options: readonly CatalogModifierOptionDraft[];
}>;

export class CatalogContractError extends Error {
  constructor(readonly code: string, message: string) {
    super(message);
    this.name = "CatalogContractError";
  }
}

export interface CatalogReadContract {
  listCategories(): Promise<readonly CatalogCategory[]>;
  listItems(input?: {
    query?: string;
    categoryId?: string | null;
    includeUnavailable?: boolean;
    /** Admin/discovery clients opt in. POS stays safe until option selection UI ships. */
    includeOptionPriced?: boolean;
  }): Promise<readonly CatalogItem[]>;
  getItem(input: { itemId: string }): Promise<CatalogItem>;
  listOptionGroups(): Promise<readonly CatalogOptionGroup[]>;
}

export interface CatalogAdminContract extends CatalogReadContract {
  createItem(input: { commandId: string; item: CatalogItemDraft }): Promise<CatalogItem>;
  updateItem(input: { commandId: string; itemId: string; item: CatalogItemDraft }): Promise<CatalogItem>;
  createCategory(input: { commandId: string; name: string; color?: string }): Promise<CatalogCategory>;
  updateCategory(input: { commandId: string; categoryId: string; name: string; color?: string }): Promise<CatalogCategory>;
  createOptionGroup(input: { commandId: string; group: CatalogOptionGroupDraft }): Promise<CatalogOptionGroup>;
  updateOptionGroup(input: { commandId: string; groupId: string; group: CatalogOptionGroupDraft }): Promise<CatalogOptionGroup>;
  listModifierGroups(): Promise<readonly CatalogModifierGroup[]>;
  createModifierGroup(input: { commandId: string; modifier: CatalogModifierGroupDraft }): Promise<CatalogModifierGroup>;
  updateModifierGroup(input: { commandId: string; modifierId: string; modifier: CatalogModifierGroupDraft }): Promise<CatalogModifierGroup>;
}
