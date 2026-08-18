import {
  CatalogContractError,
  type CatalogCategory,
  type CatalogItem,
  type CatalogItemDraft,
} from "../../contracts/catalog";

export const CATALOG_SNAPSHOT_SCHEMA_VERSION = 1 as const;

export type CatalogCommandResult = Readonly<{
  commandId: string;
  itemId: string;
}>;

export type CatalogSnapshot = Readonly<{
  schemaVersion: typeof CATALOG_SNAPSHOT_SCHEMA_VERSION;
  revision: number;
  categories: readonly CatalogCategory[];
  items: readonly CatalogItem[];
  commandResults: readonly CatalogCommandResult[];
}>;

export const defaultCatalogCategories = (): readonly CatalogCategory[] => [
  { id: "hot", name: "المشروبات الساخنة" },
  { id: "cold", name: "المشروبات الباردة" },
  { id: "food", name: "المأكولات" },
  { id: "dessert", name: "الحلويات" },
];

const item = (
  id: string,
  name: string,
  categoryId: string,
  priceHalalas: number,
  sku: string,
  barcode: string,
): CatalogItem => {
  const categories = defaultCatalogCategories();
  const now = "2026-08-18T00:00:00.000Z";
  return {
    id,
    name,
    description: "",
    categoryId,
    categoryName: categories.find((category) => category.id === categoryId)?.name ?? null,
    price: { halalas: priceHalalas, currency: "SAR" },
    sku,
    barcode,
    availableForSale: true,
    soldBy: "each",
    createdAt: now,
    updatedAt: now,
  };
};

export const defaultCatalogItems = (): readonly CatalogItem[] => [
  item("p-001", "قهوة سعودية", "hot", 1800, "HOT-001", "628100000001"),
  item("p-002", "لاتيه", "hot", 2200, "HOT-002", "628100000002"),
  item("p-003", "شاي كرك", "hot", 1400, "HOT-003", "628100000003"),
  item("p-004", "قهوة اليوم", "hot", 1600, "HOT-004", "628100000004"),
  item("p-005", "ماء معدني", "cold", 400, "COLD-001", "628100000005"),
  item("p-006", "عصير برتقال", "cold", 1500, "COLD-002", "628100000006"),
  item("p-007", "موهيتو نعناع", "cold", 1900, "COLD-003", "628100000007"),
  item("p-008", "تمر سكري", "food", 1200, "FOOD-001", "628100000008"),
  item("p-009", "كرواسون جبن", "food", 1700, "FOOD-002", "628100000009"),
  item("p-010", "ساندويتش حلوم", "food", 2600, "FOOD-003", "628100000010"),
  item("p-011", "كيكة تمر", "dessert", 2000, "DESSERT-001", "628100000011"),
  item("p-012", "براوني", "dessert", 1800, "DESSERT-002", "628100000012"),
];

export const createDefaultCatalogSnapshot = (): CatalogSnapshot => ({
  schemaVersion: CATALOG_SNAPSHOT_SCHEMA_VERSION,
  revision: 1,
  categories: defaultCatalogCategories(),
  items: defaultCatalogItems(),
  commandResults: [],
});

const clean = (value: string) => value.trim();

export const normalizeCatalogDraft = (
  draft: CatalogItemDraft,
  categories: readonly CatalogCategory[],
): CatalogItemDraft & { categoryName: string | null } => {
  const name = clean(draft.name);
  const description = clean(draft.description);
  const sku = clean(draft.sku).toUpperCase();
  const barcode = draft.barcode.replace(/\s/g, "");
  const category = draft.categoryId ? categories.find((item) => item.id === draft.categoryId) : null;

  if (!name) throw new CatalogContractError("CATALOG_NAME_REQUIRED", "اكتب اسم الصنف.");
  if (!Number.isSafeInteger(draft.price.halalas) || draft.price.halalas < 0 || draft.price.currency !== "SAR") {
    throw new CatalogContractError("CATALOG_PRICE_INVALID", "أدخل سعرًا صحيحًا بالريال السعودي.");
  }
  if (draft.categoryId && !category) {
    throw new CatalogContractError("CATALOG_CATEGORY_NOT_FOUND", "الفئة المحددة غير موجودة.");
  }
  if (sku.length > 40) throw new CatalogContractError("CATALOG_SKU_TOO_LONG", "SKU يجب ألا يتجاوز 40 محرفًا.");

  return {
    ...draft,
    name,
    description,
    sku,
    barcode,
    categoryId: category?.id ?? null,
    categoryName: category?.name ?? null,
    price: { halalas: draft.price.halalas, currency: "SAR" },
  };
};

export const assertCatalogIdentityUnique = (
  items: readonly CatalogItem[],
  draft: Pick<CatalogItemDraft, "sku" | "barcode">,
  excludeItemId: string | null,
) => {
  const sku = clean(draft.sku).toUpperCase();
  const barcode = draft.barcode.replace(/\s/g, "");

  if (sku && items.some((item) => item.id !== excludeItemId && item.sku.toUpperCase() === sku)) {
    throw new CatalogContractError("CATALOG_SKU_DUPLICATE", "SKU مستخدم لصنف آخر.");
  }
  if (barcode && items.some((item) => item.id !== excludeItemId && item.barcode === barcode)) {
    throw new CatalogContractError("CATALOG_BARCODE_DUPLICATE", "الباركود مستخدم لصنف آخر.");
  }
};
