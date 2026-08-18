import type {
  CatalogAdminContract,
  CatalogItem,
  CatalogItemDraft,
  CatalogReadContract,
} from "../../contracts/catalog";
import {
  CATALOG_SNAPSHOT_SCHEMA_VERSION,
  assertCatalogIdentityUnique,
  createDefaultCatalogSnapshot,
  normalizeCatalogDraft,
  type CatalogSnapshot,
} from "../../core/catalog/catalogRules";

export const BROWSER_CATALOG_STORAGE_KEY = "rifad.catalog.staging.v1";
export const BROWSER_CATALOG_CHANGE_EVENT = "rifad:catalog-changed";

const createItemId = () => `item-${crypto.randomUUID()}`;

const cloneSnapshot = (snapshot: CatalogSnapshot): CatalogSnapshot => JSON.parse(JSON.stringify(snapshot)) as CatalogSnapshot;

const parseSnapshot = (raw: string | null): CatalogSnapshot => {
  if (!raw) return createDefaultCatalogSnapshot();
  try {
    const parsed = JSON.parse(raw) as Partial<CatalogSnapshot>;
    if (parsed.schemaVersion !== CATALOG_SNAPSHOT_SCHEMA_VERSION || !Array.isArray(parsed.categories) || !Array.isArray(parsed.items)) {
      return createDefaultCatalogSnapshot();
    }
    return {
      schemaVersion: CATALOG_SNAPSHOT_SCHEMA_VERSION,
      revision: Number.isSafeInteger(parsed.revision) ? Number(parsed.revision) : 1,
      categories: parsed.categories,
      items: parsed.items,
      commandResults: Array.isArray(parsed.commandResults) ? parsed.commandResults : [],
    };
  } catch {
    return createDefaultCatalogSnapshot();
  }
};

export class BrowserCatalogAdapter implements CatalogAdminContract {
  constructor(
    private readonly storage: Storage = window.localStorage,
    private readonly storageKey = BROWSER_CATALOG_STORAGE_KEY,
  ) {
    if (!this.storage.getItem(this.storageKey)) this.write(createDefaultCatalogSnapshot());
  }

  private read(): CatalogSnapshot {
    return parseSnapshot(this.storage.getItem(this.storageKey));
  }

  private write(snapshot: CatalogSnapshot) {
    this.storage.setItem(this.storageKey, JSON.stringify(snapshot));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(BROWSER_CATALOG_CHANGE_EVENT, { detail: { revision: snapshot.revision } }));
    }
  }

  async listCategories() {
    return cloneSnapshot(this.read()).categories;
  }

  async listItems(input: { query?: string; categoryId?: string | null; includeUnavailable?: boolean } = {}) {
    const snapshot = this.read();
    const query = input.query?.trim().toLocaleLowerCase("ar") ?? "";
    return snapshot.items
      .filter((item) => input.includeUnavailable || item.availableForSale)
      .filter((item) => !input.categoryId || item.categoryId === input.categoryId)
      .filter((item) => {
        if (!query) return true;
        return item.name.toLocaleLowerCase("ar").includes(query)
          || item.sku.toLocaleLowerCase("en").includes(query.toLocaleLowerCase("en"))
          || item.barcode.includes(query);
      })
      .sort((a, b) => a.name.localeCompare(b.name, "ar"));
  }

  async getItem(input: { itemId: string }): Promise<CatalogItem> {
    const item = this.read().items.find((candidate) => candidate.id === input.itemId);
    if (!item) throw new Error("CATALOG_ITEM_NOT_FOUND");
    return cloneSnapshot({ ...createDefaultCatalogSnapshot(), items: [item] }).items[0]!;
  }

  async createItem(input: { commandId: string; item: CatalogItemDraft }): Promise<CatalogItem> {
    const snapshot = this.read();
    const prior = snapshot.commandResults.find((result) => result.commandId === input.commandId);
    if (prior) return this.getItem({ itemId: prior.itemId });

    const normalized = normalizeCatalogDraft(input.item, snapshot.categories);
    assertCatalogIdentityUnique(snapshot.items, normalized, null);
    const now = new Date().toISOString();
    const item: CatalogItem = {
      id: createItemId(),
      name: normalized.name,
      description: normalized.description,
      categoryId: normalized.categoryId,
      categoryName: normalized.categoryName,
      price: normalized.price,
      sku: normalized.sku,
      barcode: normalized.barcode,
      availableForSale: normalized.availableForSale,
      soldBy: "each",
      createdAt: now,
      updatedAt: now,
    };
    this.write({
      ...snapshot,
      revision: snapshot.revision + 1,
      items: [...snapshot.items, item],
      commandResults: [...snapshot.commandResults.slice(-199), { commandId: input.commandId, itemId: item.id }],
    });
    return item;
  }

  async updateItem(input: { commandId: string; itemId: string; item: CatalogItemDraft }): Promise<CatalogItem> {
    const snapshot = this.read();
    const prior = snapshot.commandResults.find((result) => result.commandId === input.commandId);
    if (prior) return this.getItem({ itemId: prior.itemId });
    const existing = snapshot.items.find((item) => item.id === input.itemId);
    if (!existing) throw new Error("CATALOG_ITEM_NOT_FOUND");

    const normalized = normalizeCatalogDraft(input.item, snapshot.categories);
    assertCatalogIdentityUnique(snapshot.items, normalized, input.itemId);
    const updated: CatalogItem = {
      ...existing,
      name: normalized.name,
      description: normalized.description,
      categoryId: normalized.categoryId,
      categoryName: normalized.categoryName,
      price: normalized.price,
      sku: normalized.sku,
      barcode: normalized.barcode,
      availableForSale: normalized.availableForSale,
      updatedAt: new Date().toISOString(),
    };
    this.write({
      ...snapshot,
      revision: snapshot.revision + 1,
      items: snapshot.items.map((item) => item.id === input.itemId ? updated : item),
      commandResults: [...snapshot.commandResults.slice(-199), { commandId: input.commandId, itemId: updated.id }],
    });
    return updated;
  }
}

export const createBrowserCatalogAdmin = (): CatalogAdminContract => new BrowserCatalogAdapter();
export const createBrowserCatalogReader = (): CatalogReadContract => new BrowserCatalogAdapter();

export const subscribeBrowserCatalogChanges = (listener: () => void) => {
  const onCustom = () => listener();
  const onStorage = (event: StorageEvent) => {
    if (event.key === BROWSER_CATALOG_STORAGE_KEY) listener();
  };
  window.addEventListener(BROWSER_CATALOG_CHANGE_EVENT, onCustom);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(BROWSER_CATALOG_CHANGE_EVENT, onCustom);
    window.removeEventListener("storage", onStorage);
  };
};
