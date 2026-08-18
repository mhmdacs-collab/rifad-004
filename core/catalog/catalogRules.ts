import {
  CatalogContractError,
  type CatalogCategory,
  type CatalogItem,
  type CatalogItemDraft,
  type CatalogModifierGroup,
  type CatalogModifierGroupDraft,
  type CatalogModifierOption,
  type CatalogVariant,
  type CatalogVariantOption,
} from "../../contracts/catalog";

export const CATALOG_SNAPSHOT_SCHEMA_VERSION = 2 as const;

export type CatalogCommandResult = Readonly<{
  commandId: string;
  entityType: "item" | "category" | "modifier";
  entityId: string;
}>;

export type CatalogSnapshot = Readonly<{
  schemaVersion: typeof CATALOG_SNAPSHOT_SCHEMA_VERSION;
  revision: number;
  categories: readonly CatalogCategory[];
  items: readonly CatalogItem[];
  modifierGroups: readonly CatalogModifierGroup[];
  commandResults: readonly CatalogCommandResult[];
}>;

export const defaultCatalogCategories = (): readonly CatalogCategory[] => [
  { id: "hot", name: "المشروبات الساخنة" },
  { id: "cold", name: "المشروبات الباردة" },
  { id: "food", name: "المأكولات" },
  { id: "dessert", name: "الحلويات" },
];

const defaultModifierGroups = (): readonly CatalogModifierGroup[] => {
  const now = "2026-08-18T00:00:00.000Z";
  return [
    {
      id: "modifier-coffee",
      name: "إضافات القهوة",
      options: [
        { id: "modifier-coffee-shot", name: "شوت إسبريسو إضافي", price: { halalas: 400, currency: "SAR" } },
        { id: "modifier-coffee-milk", name: "حليب بديل", price: { halalas: 300, currency: "SAR" } },
      ],
      createdAt: now,
      updatedAt: now,
    },
  ];
};

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
    variantOptions: [],
    variants: [],
    modifierGroupIds: [],
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
  modifierGroups: defaultModifierGroups(),
  commandResults: [],
});

const clean = (value: string) => value.trim();
const cleanSku = (value: string) => clean(value).toUpperCase();
const cleanBarcode = (value: string) => value.replace(/\s/g, "");

const validateMoney = (halalas: number) => {
  if (!Number.isSafeInteger(halalas) || halalas < 0) {
    throw new CatalogContractError("CATALOG_PRICE_INVALID", "أدخل سعرًا صحيحًا بالريال السعودي.");
  }
};

const normalizeVariantOptions = (options: readonly CatalogVariantOption[]): readonly CatalogVariantOption[] => {
  if (options.length > 3) {
    throw new CatalogContractError("CATALOG_VARIANT_OPTIONS_LIMIT", "يمكن إضافة 3 خيارات للمتغيرات كحد أقصى.");
  }

  const normalized = options.map((option) => {
    const name = clean(option.name);
    if (!name) throw new CatalogContractError("CATALOG_VARIANT_OPTION_NAME_REQUIRED", "اكتب اسم خيار المتغير مثل الحجم أو اللون.");
    const valueNames = new Set<string>();
    const values = option.values.map((value) => {
      const valueName = clean(value.name);
      if (!valueName) throw new CatalogContractError("CATALOG_VARIANT_VALUE_REQUIRED", "لا تترك قيمة متغير فارغة.");
      const compare = valueName.toLocaleLowerCase("ar");
      if (valueNames.has(compare)) throw new CatalogContractError("CATALOG_VARIANT_VALUE_DUPLICATE", "لا تكرر نفس قيمة المتغير داخل الخيار.");
      valueNames.add(compare);
      return { ...value, name: valueName };
    });
    if (values.length === 0) throw new CatalogContractError("CATALOG_VARIANT_VALUES_REQUIRED", "أضف قيمة واحدة على الأقل لكل خيار متغير.");
    return { ...option, name, values };
  });

  const optionNames = new Set<string>();
  for (const option of normalized) {
    const compare = option.name.toLocaleLowerCase("ar");
    if (optionNames.has(compare)) throw new CatalogContractError("CATALOG_VARIANT_OPTION_DUPLICATE", "لا تكرر نفس اسم خيار المتغير.");
    optionNames.add(compare);
  }

  const combinations = normalized.reduce((count, option) => count * option.values.length, 1);
  if (normalized.length > 0 && combinations > 200) {
    throw new CatalogContractError("CATALOG_VARIANTS_LIMIT", "عدد تركيبات المتغيرات لا يمكن أن يتجاوز 200.");
  }
  return normalized;
};

const normalizeVariants = (
  variants: readonly CatalogVariant[],
  options: readonly CatalogVariantOption[],
): readonly CatalogVariant[] => {
  if (options.length === 0) return [];
  const expected = options.reduce((count, option) => count * option.values.length, 1);
  if (variants.length !== expected) {
    throw new CatalogContractError("CATALOG_VARIANTS_INCOMPLETE", "أعد توليد تركيبات المتغيرات قبل الحفظ.");
  }

  const allowedByOption = options.map((option) => new Set(option.values.map((value) => value.id)));
  const seenCombinations = new Set<string>();
  const seenIds = new Set<string>();

  return variants.map((variant) => {
    if (!variant.id || seenIds.has(variant.id)) throw new CatalogContractError("CATALOG_VARIANT_ID_INVALID", "تعذر حفظ هوية أحد المتغيرات.");
    seenIds.add(variant.id);
    if (variant.optionValueIds.length !== options.length) {
      throw new CatalogContractError("CATALOG_VARIANT_VALUES_INVALID", "تركيبة أحد المتغيرات غير مكتملة.");
    }
    variant.optionValueIds.forEach((valueId, index) => {
      if (!allowedByOption[index]?.has(valueId)) throw new CatalogContractError("CATALOG_VARIANT_VALUES_INVALID", "تركيبة أحد المتغيرات غير صالحة.");
    });
    const combination = variant.optionValueIds.join("|");
    if (seenCombinations.has(combination)) throw new CatalogContractError("CATALOG_VARIANT_DUPLICATE", "هناك تركيبة متغير مكررة.");
    seenCombinations.add(combination);
    validateMoney(variant.price.halalas);
    return {
      ...variant,
      name: clean(variant.name),
      sku: cleanSku(variant.sku),
      barcode: cleanBarcode(variant.barcode),
      price: { halalas: variant.price.halalas, currency: "SAR" as const },
    };
  });
};

export const normalizeCatalogDraft = (
  draft: CatalogItemDraft,
  categories: readonly CatalogCategory[],
  modifierGroups: readonly CatalogModifierGroup[] = [],
): CatalogItemDraft & { categoryName: string | null; variantOptions: readonly CatalogVariantOption[]; variants: readonly CatalogVariant[]; modifierGroupIds: readonly string[] } => {
  const name = clean(draft.name);
  const description = clean(draft.description);
  const sku = cleanSku(draft.sku);
  const barcode = cleanBarcode(draft.barcode);
  const category = draft.categoryId ? categories.find((item) => item.id === draft.categoryId) : null;

  if (!name) throw new CatalogContractError("CATALOG_NAME_REQUIRED", "اكتب اسم الصنف.");
  validateMoney(draft.price.halalas);
  if (draft.price.currency !== "SAR") throw new CatalogContractError("CATALOG_CURRENCY_INVALID", "عملة الكتالوج الحالية هي الريال السعودي.");
  if (draft.categoryId && !category) throw new CatalogContractError("CATALOG_CATEGORY_NOT_FOUND", "الفئة المحددة غير موجودة.");
  if (sku.length > 40) throw new CatalogContractError("CATALOG_SKU_TOO_LONG", "SKU يجب ألا يتجاوز 40 محرفًا.");

  const variantOptions = normalizeVariantOptions(draft.variantOptions ?? []);
  const variants = normalizeVariants(draft.variants ?? [], variantOptions);
  const modifierIds = Array.from(new Set(draft.modifierGroupIds ?? []));
  const knownModifierIds = new Set(modifierGroups.map((modifier) => modifier.id));
  if (modifierIds.some((id) => !knownModifierIds.has(id))) {
    throw new CatalogContractError("CATALOG_MODIFIER_NOT_FOUND", "إحدى مجموعات الإضافات المحددة لم تعد موجودة.");
  }

  return {
    ...draft,
    name,
    description,
    sku,
    barcode,
    categoryId: category?.id ?? null,
    categoryName: category?.name ?? null,
    price: { halalas: draft.price.halalas, currency: "SAR" },
    variantOptions,
    variants,
    modifierGroupIds: modifierIds,
  };
};

const identityRecords = (item: CatalogItem) => [
  { sku: item.sku, barcode: item.barcode },
  ...(item.variants ?? []).map((variant) => ({ sku: variant.sku, barcode: variant.barcode })),
];

export const assertCatalogIdentityUnique = (
  items: readonly CatalogItem[],
  draft: Pick<CatalogItemDraft, "sku" | "barcode" | "variants">,
  excludeItemId: string | null,
) => {
  const existing = items
    .filter((item) => item.id !== excludeItemId)
    .flatMap(identityRecords);
  const incoming = [
    { sku: cleanSku(draft.sku), barcode: cleanBarcode(draft.barcode) },
    ...(draft.variants ?? []).map((variant) => ({ sku: cleanSku(variant.sku), barcode: cleanBarcode(variant.barcode) })),
  ];

  const ownSkus = new Set<string>();
  const ownBarcodes = new Set<string>();
  for (const record of incoming) {
    if (record.sku) {
      if (ownSkus.has(record.sku)) throw new CatalogContractError("CATALOG_SKU_DUPLICATE", "SKU مستخدم لأكثر من صنف أو متغير.");
      ownSkus.add(record.sku);
      if (existing.some((candidate) => cleanSku(candidate.sku) === record.sku)) {
        throw new CatalogContractError("CATALOG_SKU_DUPLICATE", "SKU مستخدم لصنف أو متغير آخر.");
      }
    }
    if (record.barcode) {
      if (ownBarcodes.has(record.barcode)) throw new CatalogContractError("CATALOG_BARCODE_DUPLICATE", "الباركود مستخدم لأكثر من صنف أو متغير.");
      ownBarcodes.add(record.barcode);
      if (existing.some((candidate) => cleanBarcode(candidate.barcode) === record.barcode)) {
        throw new CatalogContractError("CATALOG_BARCODE_DUPLICATE", "الباركود مستخدم لصنف أو متغير آخر.");
      }
    }
  }
};

export const normalizeCategoryName = (name: string, categories: readonly CatalogCategory[], excludeId: string | null = null) => {
  const normalized = clean(name);
  if (!normalized) throw new CatalogContractError("CATALOG_CATEGORY_NAME_REQUIRED", "اكتب اسم الفئة.");
  if (categories.some((category) => category.id !== excludeId && category.name.toLocaleLowerCase("ar") === normalized.toLocaleLowerCase("ar"))) {
    throw new CatalogContractError("CATALOG_CATEGORY_DUPLICATE", "توجد فئة بهذا الاسم بالفعل.");
  }
  return normalized;
};

export const normalizeModifierDraft = (draft: CatalogModifierGroupDraft): CatalogModifierGroupDraft => {
  const name = clean(draft.name);
  if (!name) throw new CatalogContractError("CATALOG_MODIFIER_NAME_REQUIRED", "اكتب اسم مجموعة الإضافات.");
  if (draft.options.length === 0) throw new CatalogContractError("CATALOG_MODIFIER_OPTIONS_REQUIRED", "أضف خيارًا واحدًا على الأقل لمجموعة الإضافات.");

  const names = new Set<string>();
  const options: readonly CatalogModifierOption[] = draft.options.map((option) => {
    const optionName = clean(option.name);
    if (!optionName) throw new CatalogContractError("CATALOG_MODIFIER_OPTION_NAME_REQUIRED", "اكتب اسم الإضافة.");
    const compare = optionName.toLocaleLowerCase("ar");
    if (names.has(compare)) throw new CatalogContractError("CATALOG_MODIFIER_OPTION_DUPLICATE", "لا تكرر نفس الإضافة داخل المجموعة.");
    names.add(compare);
    validateMoney(option.price.halalas);
    return {
      id: option.id || `modifier-option-${crypto.randomUUID()}`,
      name: optionName,
      price: { halalas: option.price.halalas, currency: "SAR" },
    };
  });
  return { name, options };
};
