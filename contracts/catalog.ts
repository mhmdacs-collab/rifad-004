export type CatalogMoney = Readonly<{
  halalas: number;
  currency: "SAR";
}>;

export type CatalogCategory = Readonly<{
  id: string;
  name: string;
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
}
