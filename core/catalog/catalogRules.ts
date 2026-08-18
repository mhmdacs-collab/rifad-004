import {
  CatalogContractError,
  type CatalogCategory,
  type CatalogItem,
  type CatalogItemDraft,
  type CatalogItemPricing,
  type CatalogModifierGroup,
  type CatalogModifierGroupDraft,
  type CatalogModifierOption,
  type CatalogOptionGroup,
  type CatalogOptionGroupDraft,
  type CatalogPrivateModifierGroup,
  type CatalogVariant,
  type CatalogVariantOption,
} from "../../contracts/catalog";

export const CATALOG_SNAPSHOT_SCHEMA_VERSION = 3 as const;

export type CatalogCommandResult = Readonly<{
  commandId: string;
  entityType: "item" | "category" | "option-group" | "modifier";
  entityId: string;
}>;

export type CatalogSnapshot = Readonly<{
  schemaVersion: typeof CATALOG_SNAPSHOT_SCHEMA_VERSION;
  revision: number;
  categories: readonly CatalogCategory[];
  items: readonly CatalogItem[];
  optionGroups: readonly CatalogOptionGroup[];
  modifierGroups: readonly CatalogModifierGroup[];
  commandResults: readonly CatalogCommandResult[];
}>;

export const defaultCatalogCategories = (): readonly CatalogCategory[] => [
  { id: "hot", name: "المشروبات الساخنة" },
  { id: "cold", name: "المشروبات الباردة" },
  { id: "food", name: "المأكولات" },
  { id: "dessert", name: "الحلويات" },
];

const defaultOptionGroups = (): readonly CatalogOptionGroup[] => {
  const now = "2026-08-18T00:00:00.000Z";
  return [
    {
      id: "option-pizza-size",
      name: "أحجام البيتزا",
      values: [
        { id: "pizza-small", name: "صغير", price: { halalas: 1000, currency: "SAR" } },
        { id: "pizza-medium", name: "وسط", price: { halalas: 2000, currency: "SAR" } },
        { id: "pizza-large", name: "كبير", price: { halalas: 2500, currency: "SAR" } },
      ],
      createdAt: now,
      updatedAt: now,
    },
  ];
};

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
    pricing: { mode: "fixed" },
    sku,
    barcode,
    availableForSale: true,
    soldBy: "each",
    modifierGroupIds: [],
    privateModifierGroups: [],
    variantOptions: [],
    variants: [],
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
  optionGroups: defaultOptionGroups(),
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
  if (options.length > 3) throw new CatalogContractError("CATALOG_VARIANT_OPTIONS_LIMIT", "يمكن إضافة 3 خيارات قديمة كحد أقصى.");
  return options.map((option) => ({
    ...option,
    name: clean(option.name),
    values: option.values.map((value) => ({ ...value, name: clean(value.name) })),
  }));
};

const normalizeVariants = (variants: readonly CatalogVariant[]): readonly CatalogVariant[] => variants.map((variant) => {
  validateMoney(variant.price.halalas);
  return {
    ...variant,
    name: clean(variant.name),
    sku: cleanSku(variant.sku),
    barcode: cleanBarcode(variant.barcode),
    price: { halalas: variant.price.halalas, currency: "SAR" as const },
  };
});

export const normalizeOptionGroupDraft = (draft: CatalogOptionGroupDraft): CatalogOptionGroupDraft => {
  const name = clean(draft.name);
  if (!name) throw new CatalogContractError("CATALOG_OPTION_GROUP_NAME_REQUIRED", "اكتب اسم مجموعة الخيارات، مثل أحجام البيتزا.");
  if (draft.values.length < 2) throw new CatalogContractError("CATALOG_OPTION_GROUP_VALUES_REQUIRED", "أضف خيارين على الأقل للمجموعة.");
  if (draft.values.length > 50) throw new CatalogContractError("CATALOG_OPTION_GROUP_VALUES_LIMIT", "مجموعة الخيارات لا يمكن أن تتجاوز 50 خيارًا.");

  const names = new Set<string>();
  const values = draft.values.map((value) => {
    const valueName = clean(value.name);
    if (!valueName) throw new CatalogContractError("CATALOG_OPTION_VALUE_NAME_REQUIRED", "اكتب اسم الخيار.");
    const compare = valueName.toLocaleLowerCase("ar");
    if (names.has(compare)) throw new CatalogContractError("CATALOG_OPTION_VALUE_DUPLICATE", "لا تكرر نفس الخيار داخل المجموعة.");
    names.add(compare);
    validateMoney(value.price.halalas);
    return {
      id: value.id,
      name: valueName,
      price: { halalas: value.price.halalas, currency: "SAR" as const },
    };
  });
  return { name, values };
};

const normalizePrivateModifierGroups = (groups: readonly CatalogPrivateModifierGroup[]): readonly CatalogPrivateModifierGroup[] => {
  const groupNames = new Set<string>();
  return groups.map((group) => {
    const name = clean(group.name);
    if (!name) throw new CatalogContractError("CATALOG_PRIVATE_MODIFIER_NAME_REQUIRED", "اكتب اسم الإضافات الخاصة.");
    const compare = name.toLocaleLowerCase("ar");
    if (groupNames.has(compare)) throw new CatalogContractError("CATALOG_PRIVATE_MODIFIER_DUPLICATE", "لا تكرر نفس مجموعة الإضافات الخاصة.");
    groupNames.add(compare);
    if (group.options.length === 0) throw new CatalogContractError("CATALOG_PRIVATE_MODIFIER_OPTIONS_REQUIRED", "أضف خيارًا واحدًا على الأقل للإضافات الخاصة.");
    const optionNames = new Set<string>();
    return {
      ...group,
      name,
      options: group.options.map((option) => {
        const optionName = clean(option.name);
        if (!optionName) throw new CatalogContractError("CATALOG_PRIVATE_MODIFIER_OPTION_REQUIRED", "اكتب اسم الإضافة الخاصة.");
        const optionCompare = optionName.toLocaleLowerCase("ar");
        if (optionNames.has(optionCompare)) throw new CatalogContractError("CATALOG_PRIVATE_MODIFIER_OPTION_DUPLICATE", "لا تكرر نفس الإضافة الخاصة.");
        optionNames.add(optionCompare);
        validateMoney(option.price.halalas);
        return { ...option, name: optionName, price: { halalas: option.price.halalas, currency: "SAR" as const } };
      }),
    };
  });
};

const normalizePricing = (
  pricing: CatalogItemPricing | undefined,
  fallbackPrice: number,
  optionGroups: readonly CatalogOptionGroup[],
): { pricing: CatalogItemPricing; effectivePrice: number } => {
  if (!pricing || pricing.mode === "fixed") {
    validateMoney(fallbackPrice);
    return { pricing: { mode: "fixed" }, effectivePrice: fallbackPrice };
  }

  if (pricing.mode === "option-group") {
    const group = optionGroups.find((candidate) => candidate.id === pricing.groupId);
    if (!group) throw new CatalogContractError("CATALOG_OPTION_GROUP_NOT_FOUND", "مجموعة الخيارات المحددة لم تعد موجودة.");
    const knownValueIds = new Set(group.values.map((value) => value.id));
    const seen = new Set<string>();
    const overrides = pricing.priceMode === "custom" ? pricing.overrides.map((override) => {
      if (!knownValueIds.has(override.valueId)) throw new CatalogContractError("CATALOG_OPTION_OVERRIDE_INVALID", "أحد تخصيصات السعر لا يطابق خيارات المجموعة.");
      if (seen.has(override.valueId)) throw new CatalogContractError("CATALOG_OPTION_OVERRIDE_DUPLICATE", "يوجد سعر مخصص مكرر لنفس الخيار.");
      seen.add(override.valueId);
      validateMoney(override.price.halalas);
      return { valueId: override.valueId, price: { halalas: override.price.halalas, currency: "SAR" as const } };
    }) : [];
    const overrideMap = new Map(overrides.map((override) => [override.valueId, override.price.halalas]));
    const effectivePrices = group.values.map((value) => overrideMap.get(value.id) ?? value.price.halalas);
    return {
      pricing: { mode: "option-group", groupId: group.id, priceMode: pricing.priceMode, overrides },
      effectivePrice: Math.min(...effectivePrices),
    };
  }

  const name = clean(pricing.name);
  if (!name) throw new CatalogContractError("CATALOG_CUSTOM_OPTIONS_NAME_REQUIRED", "اكتب اسم الخيارات الخاصة، مثل الحجم.");
  if (pricing.values.length < 2) throw new CatalogContractError("CATALOG_CUSTOM_OPTIONS_VALUES_REQUIRED", "أضف خيارين على الأقل للأسعار المتعددة.");
  const names = new Set<string>();
  const values = pricing.values.map((value) => {
    const valueName = clean(value.name);
    if (!valueName) throw new CatalogContractError("CATALOG_CUSTOM_OPTION_NAME_REQUIRED", "اكتب اسم الخيار الخاص.");
    const compare = valueName.toLocaleLowerCase("ar");
    if (names.has(compare)) throw new CatalogContractError("CATALOG_CUSTOM_OPTION_DUPLICATE", "لا تكرر نفس الخيار الخاص.");
    names.add(compare);
    validateMoney(value.price.halalas);
    return { ...value, name: valueName, price: { halalas: value.price.halalas, currency: "SAR" as const } };
  });
  return {
    pricing: { mode: "custom-options", name, values },
    effectivePrice: Math.min(...values.map((value) => value.price.halalas)),
  };
};

export const normalizeCatalogDraft = (
  draft: CatalogItemDraft,
  categories: readonly CatalogCategory[],
  modifierGroups: readonly CatalogModifierGroup[] = [],
  optionGroups: readonly CatalogOptionGroup[] = [],
): CatalogItemDraft & {
  categoryName: string | null;
  pricing: CatalogItemPricing;
  modifierGroupIds: readonly string[];
  privateModifierGroups: readonly CatalogPrivateModifierGroup[];
  variantOptions: readonly CatalogVariantOption[];
  variants: readonly CatalogVariant[];
} => {
  const name = clean(draft.name);
  const description = clean(draft.description);
  const sku = cleanSku(draft.sku);
  const barcode = cleanBarcode(draft.barcode);
  const category = draft.categoryId ? categories.find((item) => item.id === draft.categoryId) : null;

  if (!name) throw new CatalogContractError("CATALOG_NAME_REQUIRED", "اكتب اسم الصنف.");
  if (draft.price.currency !== "SAR") throw new CatalogContractError("CATALOG_CURRENCY_INVALID", "عملة الكتالوج الحالية هي الريال السعودي.");
  if (draft.categoryId && !category) throw new CatalogContractError("CATALOG_CATEGORY_NOT_FOUND", "الفئة المحددة غير موجودة.");
  if (sku.length > 40) throw new CatalogContractError("CATALOG_SKU_TOO_LONG", "SKU يجب ألا يتجاوز 40 محرفًا.");

  const normalizedPricing = normalizePricing(draft.pricing, draft.price.halalas, optionGroups);
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
    price: { halalas: normalizedPricing.effectivePrice, currency: "SAR" },
    pricing: normalizedPricing.pricing,
    modifierGroupIds: modifierIds,
    privateModifierGroups: normalizePrivateModifierGroups(draft.privateModifierGroups ?? []),
    variantOptions: normalizeVariantOptions(draft.variantOptions ?? []),
    variants: normalizeVariants(draft.variants ?? []),
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
  const existing = items.filter((item) => item.id !== excludeItemId).flatMap(identityRecords);
  const incoming = [
    { sku: cleanSku(draft.sku), barcode: cleanBarcode(draft.barcode) },
    ...(draft.variants ?? []).map((variant) => ({ sku: cleanSku(variant.sku), barcode: cleanBarcode(variant.barcode) })),
  ];
  const ownSkus = new Set<string>();
  const ownBarcodes = new Set<string>();
  for (const record of incoming) {
    if (record.sku) {
      if (ownSkus.has(record.sku) || existing.some((candidate) => cleanSku(candidate.sku) === record.sku)) {
        throw new CatalogContractError("CATALOG_SKU_DUPLICATE", "SKU مستخدم لصنف أو خيار آخر.");
      }
      ownSkus.add(record.sku);
    }
    if (record.barcode) {
      if (ownBarcodes.has(record.barcode) || existing.some((candidate) => cleanBarcode(candidate.barcode) === record.barcode)) {
        throw new CatalogContractError("CATALOG_BARCODE_DUPLICATE", "الباركود مستخدم لصنف أو خيار آخر.");
      }
      ownBarcodes.add(record.barcode);
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
