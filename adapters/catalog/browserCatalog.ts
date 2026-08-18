import {
  CatalogContractError,
  type CatalogAdminContract,
  type CatalogCategory,
  type CatalogItem,
  type CatalogItemDraft,
  type CatalogItemPricing,
  type CatalogModifierGroup,
  type CatalogModifierGroupDraft,
  type CatalogOptionGroup,
  type CatalogOptionGroupDraft,
  type CatalogReadContract,
} from "../../contracts/catalog";
import {
  CATALOG_SNAPSHOT_SCHEMA_VERSION,
  assertCatalogIdentityUnique,
  createDefaultCatalogSnapshot,
  normalizeCatalogDraft,
  normalizeCategoryName,
  normalizeModifierDraft,
  normalizeOptionGroupDraft,
  type CatalogCommandResult,
  type CatalogSnapshot,
} from "../../core/catalog/catalogRules";

export const BROWSER_CATALOG_STORAGE_KEY = "rifad.catalog.staging.v1";
export const BROWSER_CATALOG_CHANGE_EVENT = "rifad:catalog-changed";

const createItemId = () => `item-${crypto.randomUUID()}`;
const createCategoryId = () => `category-${crypto.randomUUID()}`;
const createOptionGroupId = () => `option-group-${crypto.randomUUID()}`;
const createModifierId = () => `modifier-${crypto.randomUUID()}`;
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const migrateCommandResults = (value: unknown): readonly CatalogCommandResult[] => {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const record = entry as Record<string, unknown>;
    if (typeof record.commandId !== "string") return [];
    if (typeof record.entityType === "string" && typeof record.entityId === "string") {
      if (["item", "category", "option-group", "modifier"].includes(record.entityType)) {
        return [{ commandId: record.commandId, entityType: record.entityType, entityId: record.entityId } as CatalogCommandResult];
      }
    }
    if (typeof record.itemId === "string") {
      return [{ commandId: record.commandId, entityType: "item", entityId: record.itemId } as CatalogCommandResult];
    }
    return [];
  });
};

const migratePricing = (item: CatalogItem): CatalogItemPricing => item.pricing ?? { mode: "fixed" };

const parseSnapshot = (raw: string | null): CatalogSnapshot => {
  const fallback = createDefaultCatalogSnapshot();
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!Array.isArray(parsed.categories) || !Array.isArray(parsed.items)) return fallback;
    return {
      schemaVersion: CATALOG_SNAPSHOT_SCHEMA_VERSION,
      revision: Number.isSafeInteger(parsed.revision) ? Number(parsed.revision) : 1,
      categories: parsed.categories as CatalogSnapshot["categories"],
      items: (parsed.items as CatalogItem[]).map((item) => ({
        ...item,
        pricing: migratePricing(item),
        modifierGroupIds: item.modifierGroupIds ?? [],
        privateModifierGroups: item.privateModifierGroups ?? [],
        variantOptions: item.variantOptions ?? [],
        variants: item.variants ?? [],
      })),
      optionGroups: Array.isArray(parsed.optionGroups) ? parsed.optionGroups as CatalogSnapshot["optionGroups"] : fallback.optionGroups,
      modifierGroups: Array.isArray(parsed.modifierGroups) ? parsed.modifierGroups as CatalogSnapshot["modifierGroups"] : fallback.modifierGroups,
      commandResults: migrateCommandResults(parsed.commandResults),
    };
  } catch {
    return fallback;
  }
};

const appendCommand = (
  snapshot: CatalogSnapshot,
  commandId: string,
  entityType: CatalogCommandResult["entityType"],
  entityId: string,
) => [...snapshot.commandResults.slice(-299), { commandId, entityType, entityId }];

const effectiveItemPrice = (item: CatalogItem, optionGroups: readonly CatalogOptionGroup[]) => {
  const pricing = item.pricing ?? { mode: "fixed" as const };
  if (pricing.mode === "fixed") return item.price;
  if (pricing.mode === "custom-options") {
    const values = pricing.values.map((value) => value.price.halalas);
    return { halalas: values.length ? Math.min(...values) : item.price.halalas, currency: "SAR" as const };
  }
  const group = optionGroups.find((candidate) => candidate.id === pricing.groupId);
  if (!group) return item.price;
  const overrides = new Map(pricing.overrides.map((override) => [override.valueId, override.price.halalas]));
  const values = group.values.map((value) => pricing.priceMode === "custom" ? overrides.get(value.id) ?? value.price.halalas : value.price.halalas);
  return { halalas: values.length ? Math.min(...values) : item.price.halalas, currency: "SAR" as const };
};

const hydrateItem = (snapshot: CatalogSnapshot, item: CatalogItem): CatalogItem => ({
  ...item,
  pricing: migratePricing(item),
  price: effectiveItemPrice(item, snapshot.optionGroups),
  modifierGroupIds: item.modifierGroupIds ?? [],
  privateModifierGroups: item.privateModifierGroups ?? [],
});

export class BrowserCatalogAdapter implements CatalogAdminContract {
  constructor(
    private readonly storage: Storage = window.localStorage,
    private readonly storageKey = BROWSER_CATALOG_STORAGE_KEY,
  ) {
    const raw = this.storage.getItem(this.storageKey);
    if (!raw) {
      this.write(createDefaultCatalogSnapshot());
      return;
    }
    try {
      const parsed = JSON.parse(raw) as { schemaVersion?: number };
      if (parsed.schemaVersion !== CATALOG_SNAPSHOT_SCHEMA_VERSION) this.write(parseSnapshot(raw));
    } catch {
      this.write(createDefaultCatalogSnapshot());
    }
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

  private prior(snapshot: CatalogSnapshot, commandId: string, entityType: CatalogCommandResult["entityType"]) {
    return snapshot.commandResults.find((result) => result.commandId === commandId && result.entityType === entityType);
  }

  async listCategories() {
    return [...clone(this.read().categories)].sort((a, b) => a.name.localeCompare(b.name, "ar"));
  }

  async listOptionGroups() {
    return [...clone(this.read().optionGroups)].sort((a, b) => a.name.localeCompare(b.name, "ar"));
  }

  async listItems(input: { query?: string; categoryId?: string | null; includeUnavailable?: boolean; includeOptionPriced?: boolean } = {}) {
    const snapshot = this.read();
    const query = input.query?.trim().toLocaleLowerCase("ar") ?? "";
    return snapshot.items
      .map((item) => hydrateItem(snapshot, item))
      .filter((item) => input.includeUnavailable || item.availableForSale)
      .filter((item) => input.includeOptionPriced || (item.pricing ?? { mode: "fixed" }).mode === "fixed")
      .filter((item) => !input.categoryId || item.categoryId === input.categoryId)
      .filter((item) => {
        if (!query) return true;
        return item.name.toLocaleLowerCase("ar").includes(query)
          || item.sku.toLocaleLowerCase("en").includes(query.toLocaleLowerCase("en"))
          || item.barcode.includes(query);
      })
      .sort((a, b) => a.name.localeCompare(b.name, "ar"))
      .map(clone);
  }

  async getItem(input: { itemId: string }): Promise<CatalogItem> {
    const snapshot = this.read();
    const item = snapshot.items.find((candidate) => candidate.id === input.itemId);
    if (!item) throw new CatalogContractError("CATALOG_ITEM_NOT_FOUND", "الصنف غير موجود.");
    return clone(hydrateItem(snapshot, item));
  }

  async listModifierGroups() {
    return [...clone(this.read().modifierGroups)].sort((a, b) => a.name.localeCompare(b.name, "ar"));
  }

  async createItem(input: { commandId: string; item: CatalogItemDraft }): Promise<CatalogItem> {
    const snapshot = this.read();
    const prior = this.prior(snapshot, input.commandId, "item");
    if (prior) return this.getItem({ itemId: prior.entityId });
    const normalized = normalizeCatalogDraft(input.item, snapshot.categories, snapshot.modifierGroups, snapshot.optionGroups);
    assertCatalogIdentityUnique(snapshot.items, normalized, null);
    const now = new Date().toISOString();
    const item: CatalogItem = {
      id: createItemId(),
      name: normalized.name,
      description: normalized.description,
      categoryId: normalized.categoryId,
      categoryName: normalized.categoryName,
      price: normalized.price,
      pricing: normalized.pricing,
      sku: normalized.sku,
      barcode: normalized.barcode,
      availableForSale: normalized.availableForSale,
      soldBy: "each",
      modifierGroupIds: normalized.modifierGroupIds,
      privateModifierGroups: normalized.privateModifierGroups,
      variantOptions: normalized.variantOptions,
      variants: normalized.variants,
      createdAt: now,
      updatedAt: now,
    };
    this.write({
      ...snapshot,
      revision: snapshot.revision + 1,
      items: [...snapshot.items, item],
      commandResults: appendCommand(snapshot, input.commandId, "item", item.id),
    });
    return clone(hydrateItem({ ...snapshot, items: [...snapshot.items, item] }, item));
  }

  async updateItem(input: { commandId: string; itemId: string; item: CatalogItemDraft }): Promise<CatalogItem> {
    const snapshot = this.read();
    const prior = this.prior(snapshot, input.commandId, "item");
    if (prior) return this.getItem({ itemId: prior.entityId });
    const existing = snapshot.items.find((item) => item.id === input.itemId);
    if (!existing) throw new CatalogContractError("CATALOG_ITEM_NOT_FOUND", "الصنف غير موجود.");
    const normalized = normalizeCatalogDraft(input.item, snapshot.categories, snapshot.modifierGroups, snapshot.optionGroups);
    assertCatalogIdentityUnique(snapshot.items, normalized, input.itemId);
    const updated: CatalogItem = {
      ...existing,
      name: normalized.name,
      description: normalized.description,
      categoryId: normalized.categoryId,
      categoryName: normalized.categoryName,
      price: normalized.price,
      pricing: normalized.pricing,
      sku: normalized.sku,
      barcode: normalized.barcode,
      availableForSale: normalized.availableForSale,
      modifierGroupIds: normalized.modifierGroupIds,
      privateModifierGroups: normalized.privateModifierGroups,
      variantOptions: normalized.variantOptions,
      variants: normalized.variants,
      updatedAt: new Date().toISOString(),
    };
    const next = { ...snapshot, items: snapshot.items.map((item) => item.id === input.itemId ? updated : item) };
    this.write({
      ...next,
      revision: snapshot.revision + 1,
      commandResults: appendCommand(snapshot, input.commandId, "item", updated.id),
    });
    return clone(hydrateItem(next, updated));
  }

  async createCategory(input: { commandId: string; name: string }): Promise<CatalogCategory> {
    const snapshot = this.read();
    const prior = this.prior(snapshot, input.commandId, "category");
    if (prior) {
      const existing = snapshot.categories.find((category) => category.id === prior.entityId);
      if (existing) return clone(existing);
    }
    const category: CatalogCategory = { id: createCategoryId(), name: normalizeCategoryName(input.name, snapshot.categories) };
    this.write({
      ...snapshot,
      revision: snapshot.revision + 1,
      categories: [...snapshot.categories, category],
      commandResults: appendCommand(snapshot, input.commandId, "category", category.id),
    });
    return clone(category);
  }

  async updateCategory(input: { commandId: string; categoryId: string; name: string }): Promise<CatalogCategory> {
    const snapshot = this.read();
    const prior = this.prior(snapshot, input.commandId, "category");
    if (prior) {
      const previous = snapshot.categories.find((category) => category.id === prior.entityId);
      if (previous) return clone(previous);
    }
    const existing = snapshot.categories.find((category) => category.id === input.categoryId);
    if (!existing) throw new CatalogContractError("CATALOG_CATEGORY_NOT_FOUND", "الفئة المحددة غير موجودة.");
    const updated = { ...existing, name: normalizeCategoryName(input.name, snapshot.categories, input.categoryId) };
    this.write({
      ...snapshot,
      revision: snapshot.revision + 1,
      categories: snapshot.categories.map((category) => category.id === input.categoryId ? updated : category),
      items: snapshot.items.map((item) => item.categoryId === input.categoryId ? { ...item, categoryName: updated.name, updatedAt: new Date().toISOString() } : item),
      commandResults: appendCommand(snapshot, input.commandId, "category", updated.id),
    });
    return clone(updated);
  }

  async createOptionGroup(input: { commandId: string; group: CatalogOptionGroupDraft }): Promise<CatalogOptionGroup> {
    const snapshot = this.read();
    const prior = this.prior(snapshot, input.commandId, "option-group");
    if (prior) {
      const existing = snapshot.optionGroups.find((group) => group.id === prior.entityId);
      if (existing) return clone(existing);
    }
    const normalized = normalizeOptionGroupDraft(input.group);
    if (snapshot.optionGroups.some((group) => group.name.toLocaleLowerCase("ar") === normalized.name.toLocaleLowerCase("ar"))) {
      throw new CatalogContractError("CATALOG_OPTION_GROUP_DUPLICATE", "توجد مجموعة خيارات بهذا الاسم بالفعل.");
    }
    const now = new Date().toISOString();
    const group: CatalogOptionGroup = {
      id: createOptionGroupId(),
      name: normalized.name,
      values: normalized.values.map((value) => ({ ...value, id: value.id || `option-value-${crypto.randomUUID()}` })),
      createdAt: now,
      updatedAt: now,
    };
    this.write({
      ...snapshot,
      revision: snapshot.revision + 1,
      optionGroups: [...snapshot.optionGroups, group],
      commandResults: appendCommand(snapshot, input.commandId, "option-group", group.id),
    });
    return clone(group);
  }

  async updateOptionGroup(input: { commandId: string; groupId: string; group: CatalogOptionGroupDraft }): Promise<CatalogOptionGroup> {
    const snapshot = this.read();
    const prior = this.prior(snapshot, input.commandId, "option-group");
    if (prior) {
      const previous = snapshot.optionGroups.find((group) => group.id === prior.entityId);
      if (previous) return clone(previous);
    }
    const existing = snapshot.optionGroups.find((group) => group.id === input.groupId);
    if (!existing) throw new CatalogContractError("CATALOG_OPTION_GROUP_NOT_FOUND", "مجموعة الخيارات غير موجودة.");
    const normalized = normalizeOptionGroupDraft(input.group);
    if (snapshot.optionGroups.some((group) => group.id !== input.groupId && group.name.toLocaleLowerCase("ar") === normalized.name.toLocaleLowerCase("ar"))) {
      throw new CatalogContractError("CATALOG_OPTION_GROUP_DUPLICATE", "توجد مجموعة خيارات بهذا الاسم بالفعل.");
    }
    const existingById = new Map(existing.values.map((value) => [value.id, value]));
    const updated: CatalogOptionGroup = {
      ...existing,
      name: normalized.name,
      values: normalized.values.map((value) => ({
        ...value,
        id: value.id && existingById.has(value.id) ? value.id : `option-value-${crypto.randomUUID()}`,
      })),
      updatedAt: new Date().toISOString(),
    };
    this.write({
      ...snapshot,
      revision: snapshot.revision + 1,
      optionGroups: snapshot.optionGroups.map((group) => group.id === input.groupId ? updated : group),
      commandResults: appendCommand(snapshot, input.commandId, "option-group", updated.id),
    });
    return clone(updated);
  }

  async createModifierGroup(input: { commandId: string; modifier: CatalogModifierGroupDraft }): Promise<CatalogModifierGroup> {
    const snapshot = this.read();
    const prior = this.prior(snapshot, input.commandId, "modifier");
    if (prior) {
      const existing = snapshot.modifierGroups.find((modifier) => modifier.id === prior.entityId);
      if (existing) return clone(existing);
    }
    const normalized = normalizeModifierDraft(input.modifier);
    if (snapshot.modifierGroups.some((modifier) => modifier.name.toLocaleLowerCase("ar") === normalized.name.toLocaleLowerCase("ar"))) {
      throw new CatalogContractError("CATALOG_MODIFIER_DUPLICATE", "توجد مجموعة إضافات بهذا الاسم بالفعل.");
    }
    const now = new Date().toISOString();
    const modifier: CatalogModifierGroup = {
      id: createModifierId(),
      name: normalized.name,
      options: normalized.options.map((option) => ({ ...option, id: option.id || `modifier-option-${crypto.randomUUID()}` })),
      createdAt: now,
      updatedAt: now,
    };
    this.write({
      ...snapshot,
      revision: snapshot.revision + 1,
      modifierGroups: [...snapshot.modifierGroups, modifier],
      commandResults: appendCommand(snapshot, input.commandId, "modifier", modifier.id),
    });
    return clone(modifier);
  }

  async updateModifierGroup(input: { commandId: string; modifierId: string; modifier: CatalogModifierGroupDraft }): Promise<CatalogModifierGroup> {
    const snapshot = this.read();
    const prior = this.prior(snapshot, input.commandId, "modifier");
    if (prior) {
      const previous = snapshot.modifierGroups.find((modifier) => modifier.id === prior.entityId);
      if (previous) return clone(previous);
    }
    const existing = snapshot.modifierGroups.find((modifier) => modifier.id === input.modifierId);
    if (!existing) throw new CatalogContractError("CATALOG_MODIFIER_NOT_FOUND", "مجموعة الإضافات المحددة غير موجودة.");
    const normalized = normalizeModifierDraft(input.modifier);
    if (snapshot.modifierGroups.some((modifier) => modifier.id !== input.modifierId && modifier.name.toLocaleLowerCase("ar") === normalized.name.toLocaleLowerCase("ar"))) {
      throw new CatalogContractError("CATALOG_MODIFIER_DUPLICATE", "توجد مجموعة إضافات بهذا الاسم بالفعل.");
    }
    const updated: CatalogModifierGroup = {
      ...existing,
      name: normalized.name,
      options: normalized.options.map((option) => ({ ...option, id: option.id || `modifier-option-${crypto.randomUUID()}` })),
      updatedAt: new Date().toISOString(),
    };
    this.write({
      ...snapshot,
      revision: snapshot.revision + 1,
      modifierGroups: snapshot.modifierGroups.map((modifier) => modifier.id === input.modifierId ? updated : modifier),
      commandResults: appendCommand(snapshot, input.commandId, "modifier", updated.id),
    });
    return clone(updated);
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
