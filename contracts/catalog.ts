export type CatalogMoney = Readonly<{
  halalas: number;
  currency: "SAR";
}>;

export type CatalogCategory = Readonly<{
  id: string;
  name: string;
}>;

export type CatalogVariantValue = Readonly<{
  id: string;
  name: string;
}>;

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

export type CatalogModifierOption = Readonly<{
  id: string;
  name: string;
  price: CatalogMoney;
}>;

export type CatalogModifierGroup = Readonly<{
  id: string;
  name: string;
  options: readonly CatalogModifierOption[];
  createdAt: string;
  updatedAt: string;
}>;

export type CatalogItem = Readonly<{
  id: string;
  name: string;
  description: string;
  categoryId: string | null;
  categoryName: string | null;
  price: CatalogMoney;
  sku: string;
  barcode: string;
  availableForSale: boolean;
  soldBy: "each";
  variantOptions?: readonly CatalogVariantOption[];
  variants?: readonly CatalogVariant[];
  modifierGroupIds?: readonly string[];
  createdAt: string;
  updatedAt: string;
}>;

export type CatalogItemDraft = Readonly<{
  name: string;
  description: string;
  categoryId: string | null;
  price: CatalogMoney;
  sku: string;
  barcode: string;
  availableForSale: boolean;
  variantOptions?: readonly CatalogVariantOption[];
  variants?: readonly CatalogVariant[];
  modifierGroupIds?: readonly string[];
}>;

export type CatalogModifierOptionDraft = Readonly<{
  id?: string;
  name: string;
  price: CatalogMoney;
}>;

export type CatalogModifierGroupDraft = Readonly<{
  name: string;
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
  }): Promise<readonly CatalogItem[]>;
  getItem(input: { itemId: string }): Promise<CatalogItem>;
}

export interface CatalogAdminContract extends CatalogReadContract {
  createItem(input: { commandId: string; item: CatalogItemDraft }): Promise<CatalogItem>;
  updateItem(input: { commandId: string; itemId: string; item: CatalogItemDraft }): Promise<CatalogItem>;
  createCategory(input: { commandId: string; name: string }): Promise<CatalogCategory>;
  updateCategory(input: { commandId: string; categoryId: string; name: string }): Promise<CatalogCategory>;
  listModifierGroups(): Promise<readonly CatalogModifierGroup[]>;
  createModifierGroup(input: { commandId: string; modifier: CatalogModifierGroupDraft }): Promise<CatalogModifierGroup>;
  updateModifierGroup(input: { commandId: string; modifierId: string; modifier: CatalogModifierGroupDraft }): Promise<CatalogModifierGroup>;
}
