import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
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
  type CatalogPrivateModifierGroup,
} from "../../../contracts/catalog";
import {
  CatalogAppearanceEditor,
  CatalogColorPicker,
  CatalogItemVisual,
  CATALOG_COLOR_PALETTE,
  DEFAULT_ITEM_APPEARANCE,
} from "./CatalogVisuals";

type CatalogPage = "items" | "categories" | "options" | "modifiers";
type IconName = "add" | "items" | "category" | "options" | "addon" | "search" | "save" | "trash" | "back" | "chevron" | "store" | "reports" | "inventory" | "staff" | "customers" | "settings";

const uid = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;
const commandId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;

const Icon = ({ name, size = 18 }: { name: IconName; size?: number }) => {
  const paths: Record<IconName, ReactNode> = {
    add: <><path d="M12 5v14M5 12h14" /></>,
    items: <><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
    category: <><path d="M4 7h7v7H4zM13 7h7v7h-7zM4 16h7v4H4zM13 16h7v4h-7z" /></>,
    options: <><path d="M4 7h10M18 7h2M4 12h3M11 12h9M4 17h8M16 17h4" /><circle cx="16" cy="7" r="2" /><circle cx="9" cy="12" r="2" /><circle cx="14" cy="17" r="2" /></>,
    addon: <><circle cx="12" cy="12" r="8" /><path d="M12 8v8M8 12h8" /></>,
    search: <><circle cx="11" cy="11" r="6" /><path d="m16 16 4 4" /></>,
    save: <><path d="M5 4h12l2 2v14H5z" /><path d="M8 4v6h8V4M8 20v-6h8v6" /></>,
    trash: <><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13" /><path d="M10 11v5M14 11v5" /></>,
    back: <><path d="m15 18-6-6 6-6" /></>,
    chevron: <><path d="m9 10 3 3 3-3" /></>,
    store: <><path d="M4 10h16v10H4zM3 10l2-6h14l2 6" /><path d="M8 20v-6h5v6" /></>,
    reports: <><path d="M5 20V9M12 20V4M19 20v-7" /></>,
    inventory: <><path d="M4 7l8-4 8 4-8 4zM4 7v10l8 4 8-4V7M12 11v10" /></>,
    staff: <><circle cx="12" cy="8" r="3" /><path d="M6 20c0-4 2-6 6-6s6 2 6 6" /></>,
    customers: <><circle cx="9" cy="9" r="3" /><circle cx="17" cy="10" r="2" /><path d="M3 20c0-4 2-6 6-6s6 2 6 6M15 15c4 0 6 2 6 5" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" /></>,
  };
  return <svg className="bo-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
};

const emptyItemDraft = (): CatalogItemDraft => ({
  name: "",
  description: "",
  categoryId: null,
  price: { halalas: 0, currency: "SAR" },
  pricing: { mode: "fixed" },
  sku: "",
  barcode: "",
  availableForSale: true,
  appearance: { ...DEFAULT_ITEM_APPEARANCE },
  modifierGroupIds: [],
  privateModifierGroups: [],
  variantOptions: [],
  variants: [],
});

const toDraft = (item: CatalogItem): CatalogItemDraft => ({
  name: item.name,
  description: item.description,
  categoryId: item.categoryId,
  price: item.price,
  pricing: item.pricing ?? { mode: "fixed" },
  sku: item.sku,
  barcode: item.barcode,
  availableForSale: item.availableForSale,
  appearance: item.appearance ?? { ...DEFAULT_ITEM_APPEARANCE },
  modifierGroupIds: item.modifierGroupIds ?? [],
  privateModifierGroups: item.privateModifierGroups ?? [],
  variantOptions: item.variantOptions ?? [],
  variants: item.variants ?? [],
});

const emptyOptionGroupDraft = (): CatalogOptionGroupDraft => ({
  name: "",
  color: "#2D8CFF",
  values: [
    { id: uid("option-value"), name: "", price: { halalas: 0, currency: "SAR" } },
    { id: uid("option-value"), name: "", price: { halalas: 0, currency: "SAR" } },
  ],
});

const emptyModifierDraft = (): CatalogModifierGroupDraft => ({
  name: "",
  color: "#9B51E0",
  options: [{ id: uid("modifier-option"), name: "", price: { halalas: 0, currency: "SAR" } }],
});

const emptyPrivateModifier = (): CatalogPrivateModifierGroup => ({
  id: uid("private-addon-group"),
  name: "",
  options: [{ id: uid("private-addon"), name: "", price: { halalas: 0, currency: "SAR" } }],
});

const formatMoney = (halalas: number) => `${(halalas / 100).toLocaleString("ar-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ر.س`;
const halalasToInput = (halalas: number) => `${Math.floor(halalas / 100)}.${String(Math.abs(halalas % 100)).padStart(2, "0")}`;
const toHalalas = (value: string) => Math.max(0, Math.round(Number(value || 0) * 100));

const parsePriceInput = (value: string): number | null => {
  const normalized = value.replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit))).trim();
  if (!/^\d+(?:\.\d{0,2})?$/.test(normalized)) return null;
  const [whole = "0", fraction = ""] = normalized.split(".");
  const halalas = Number(whole) * 100 + Number((fraction + "00").slice(0, 2));
  return Number.isSafeInteger(halalas) ? halalas : null;
};

const messageFrom = (error: unknown) => error instanceof CatalogContractError
  ? error.message
  : error instanceof Error && error.message === "CATALOG_ITEM_NOT_FOUND"
    ? "تعذر العثور على الصنف."
    : "تعذر حفظ التغيير. حاول مرة أخرى.";

const pricingLabel = (item: CatalogItem, optionGroups: readonly CatalogOptionGroup[]) => {
  const pricing = item.pricing ?? { mode: "fixed" as const };
  if (pricing.mode === "fixed") return "سعر واحد";
  if (pricing.mode === "custom-options") return pricing.name || "أسعار خاصة";
  return optionGroups.find((group) => group.id === pricing.groupId)?.name ?? "مجموعة خيارات";
};

const tint = (hex: string) => `${hex}18`;

export default function BackOfficeApp({ catalog }: { catalog: CatalogAdminContract }) {
  const [page, setPage] = useState<CatalogPage>("items");
  const [items, setItems] = useState<readonly CatalogItem[]>([]);
  const [categories, setCategories] = useState<readonly CatalogCategory[]>([]);
  const [optionGroups, setOptionGroups] = useState<readonly CatalogOptionGroup[]>([]);
  const [modifierGroups, setModifierGroups] = useState<readonly CatalogModifierGroup[]>([]);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const [itemEditorId, setItemEditorId] = useState<string | null | undefined>(undefined);
  const [itemDraft, setItemDraft] = useState<CatalogItemDraft>(emptyItemDraft());
  const [basePriceText, setBasePriceText] = useState("0.00");

  const [categoryEditorId, setCategoryEditorId] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryColor, setCategoryColor] = useState<string>(CATALOG_COLOR_PALETTE[0]);

  const [optionGroupEditorId, setOptionGroupEditorId] = useState<string | null | undefined>(undefined);
  const [optionGroupDraft, setOptionGroupDraft] = useState<CatalogOptionGroupDraft>(emptyOptionGroupDraft());

  const [modifierEditorId, setModifierEditorId] = useState<string | null | undefined>(undefined);
  const [modifierDraft, setModifierDraft] = useState<CatalogModifierGroupDraft>(emptyModifierDraft());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextItems, nextCategories, nextOptionGroups, nextModifiers] = await Promise.all([
        catalog.listItems({ includeUnavailable: true, includeOptionPriced: true }),
        catalog.listCategories(),
        catalog.listOptionGroups(),
        catalog.listModifierGroups(),
      ]);
      setItems(nextItems);
      setCategories(nextCategories);
      setOptionGroups(nextOptionGroups);
      setModifierGroups(nextModifiers);
    } catch (loadError) {
      setError(messageFrom(loadError));
    } finally {
      setLoading(false);
    }
  }, [catalog]);

  useEffect(() => { void load(); }, [load]);

  const visibleItems = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("ar");
    return items.filter((item) => {
      if (categoryFilter !== "all" && item.categoryId !== categoryFilter) return false;
      if (!needle) return true;
      return item.name.toLocaleLowerCase("ar").includes(needle)
        || item.sku.toLocaleLowerCase("en").includes(needle.toLocaleLowerCase("en"))
        || item.barcode.includes(needle);
    });
  }, [categoryFilter, items, query]);

  const selectedItem = itemEditorId ? items.find((item) => item.id === itemEditorId) ?? null : null;
  const selectedPricingGroup = itemDraft.pricing?.mode === "option-group" ? optionGroups.find((group) => group.id === itemDraft.pricing?.groupId) ?? null : null;
  const pricing = itemDraft.pricing ?? { mode: "fixed" as const };
  const multiplePrices = pricing.mode !== "fixed";
  const appearance = itemDraft.appearance ?? DEFAULT_ITEM_APPEARANCE;

  const showFlash = (message: string) => {
    setFlash(message);
    window.setTimeout(() => setFlash((current) => current === message ? null : current), 2200);
  };

  const closeEditors = () => {
    setItemEditorId(undefined);
    setOptionGroupEditorId(undefined);
    setModifierEditorId(undefined);
    setCategoryEditorId(null);
    setError(null);
  };

  const openPage = (nextPage: CatalogPage) => {
    setPage(nextPage);
    closeEditors();
  };

  const openNewItem = () => {
    setItemEditorId(null);
    setItemDraft(emptyItemDraft());
    setBasePriceText("0.00");
    setError(null);
  };

  const openItem = (item: CatalogItem) => {
    setItemEditorId(item.id);
    setItemDraft(toDraft(item));
    setBasePriceText(halalasToInput(item.price.halalas));
    setError(null);
  };

  const setMultiplePrices = (enabled: boolean) => {
    if (!enabled) {
      setItemDraft({ ...itemDraft, pricing: { mode: "fixed" } });
      return;
    }
    if (optionGroups[0]) {
      setItemDraft({ ...itemDraft, pricing: { mode: "option-group", groupId: optionGroups[0].id, priceMode: "inherit", overrides: [] } });
      return;
    }
    setItemDraft({
      ...itemDraft,
      pricing: {
        mode: "custom-options",
        name: "الحجم",
        values: [
          { id: uid("custom-price"), name: "", price: { halalas: 0, currency: "SAR" } },
          { id: uid("custom-price"), name: "", price: { halalas: 0, currency: "SAR" } },
        ],
      },
    });
  };

  const useSharedPricing = () => {
    const group = selectedPricingGroup ?? optionGroups[0];
    if (!group) return;
    setItemDraft({ ...itemDraft, pricing: { mode: "option-group", groupId: group.id, priceMode: "inherit", overrides: [] } });
  };

  const useCustomPricing = () => {
    setItemDraft({
      ...itemDraft,
      pricing: {
        mode: "custom-options",
        name: pricing.mode === "custom-options" ? pricing.name : "الحجم",
        values: pricing.mode === "custom-options" && pricing.values.length >= 2 ? pricing.values : [
          { id: uid("custom-price"), name: "", price: { halalas: 0, currency: "SAR" } },
          { id: uid("custom-price"), name: "", price: { halalas: 0, currency: "SAR" } },
        ],
      },
    });
  };

  const setPricingGroup = (groupId: string) => {
    setItemDraft({ ...itemDraft, pricing: { mode: "option-group", groupId, priceMode: "inherit", overrides: [] } });
  };

  const setGroupPriceMode = (custom: boolean) => {
    if (pricing.mode !== "option-group") return;
    setItemDraft({ ...itemDraft, pricing: { ...pricing, priceMode: custom ? "custom" : "inherit", overrides: custom ? pricing.overrides : [] } });
  };

  const updateGroupPriceOverride = (valueId: string, halalas: number) => {
    if (pricing.mode !== "option-group") return;
    const existing = pricing.overrides.find((override) => override.valueId === valueId);
    const overrides = existing
      ? pricing.overrides.map((override) => override.valueId === valueId ? { ...override, price: { halalas, currency: "SAR" as const } } : override)
      : [...pricing.overrides, { valueId, price: { halalas, currency: "SAR" as const } }];
    setItemDraft({ ...itemDraft, pricing: { ...pricing, priceMode: "custom", overrides } });
  };

  const updateCustomPriceValue = (id: string, patch: { name?: string; halalas?: number }) => {
    if (pricing.mode !== "custom-options") return;
    setItemDraft({
      ...itemDraft,
      pricing: {
        ...pricing,
        values: pricing.values.map((value) => value.id === id ? {
          ...value,
          name: patch.name ?? value.name,
          price: patch.halalas === undefined ? value.price : { halalas: patch.halalas, currency: "SAR" },
        } : value),
      },
    });
  };

  const addCustomPriceValue = () => {
    if (pricing.mode !== "custom-options") return;
    setItemDraft({ ...itemDraft, pricing: { ...pricing, values: [...pricing.values, { id: uid("custom-price"), name: "", price: { halalas: 0, currency: "SAR" } }] } });
  };

  const removeCustomPriceValue = (id: string) => {
    if (pricing.mode !== "custom-options" || pricing.values.length <= 2) return;
    setItemDraft({ ...itemDraft, pricing: { ...pricing, values: pricing.values.filter((value) => value.id !== id) } });
  };

  const toggleModifierForItem = (modifierId: string) => {
    const current = new Set(itemDraft.modifierGroupIds ?? []);
    if (current.has(modifierId)) current.delete(modifierId); else current.add(modifierId);
    setItemDraft({ ...itemDraft, modifierGroupIds: Array.from(current) });
  };

  const addPrivateModifierGroup = () => setItemDraft({ ...itemDraft, privateModifierGroups: [...(itemDraft.privateModifierGroups ?? []), emptyPrivateModifier()] });

  const updatePrivateModifierGroup = (groupId: string, patch: Partial<CatalogPrivateModifierGroup>) => {
    setItemDraft({
      ...itemDraft,
      privateModifierGroups: (itemDraft.privateModifierGroups ?? []).map((group) => group.id === groupId ? { ...group, ...patch } : group),
    });
  };

  const addPrivateModifierOption = (groupId: string) => {
    const groups = itemDraft.privateModifierGroups ?? [];
    setItemDraft({
      ...itemDraft,
      privateModifierGroups: groups.map((group) => group.id === groupId ? {
        ...group,
        options: [...group.options, { id: uid("private-addon"), name: "", price: { halalas: 0, currency: "SAR" } }],
      } : group),
    });
  };

  const updatePrivateModifierOption = (groupId: string, optionId: string, patch: { name?: string; halalas?: number }) => {
    const groups = itemDraft.privateModifierGroups ?? [];
    setItemDraft({
      ...itemDraft,
      privateModifierGroups: groups.map((group) => group.id === groupId ? {
        ...group,
        options: group.options.map((option) => option.id === optionId ? {
          ...option,
          name: patch.name ?? option.name,
          price: patch.halalas === undefined ? option.price : { halalas: patch.halalas, currency: "SAR" },
        } : option),
      } : group),
    });
  };

  const removePrivateModifierOption = (groupId: string, optionId: string) => {
    const groups = itemDraft.privateModifierGroups ?? [];
    setItemDraft({
      ...itemDraft,
      privateModifierGroups: groups.map((group) => group.id === groupId && group.options.length > 1
        ? { ...group, options: group.options.filter((option) => option.id !== optionId) }
        : group),
    });
  };

  const saveItem = async (event: FormEvent) => {
    event.preventDefault();
    const halalas = parsePriceInput(basePriceText);
    if (pricing.mode === "fixed" && halalas === null) {
      setError("أدخل السعر بصيغة صحيحة مثل 12.50");
      return;
    }
    const normalizedDraft: CatalogItemDraft = {
      ...itemDraft,
      price: { halalas: pricing.mode === "fixed" ? halalas ?? 0 : itemDraft.price.halalas, currency: "SAR" },
    };
    setSaving(true);
    setError(null);
    try {
      if (itemEditorId) await catalog.updateItem({ commandId: commandId("catalog-update"), itemId: itemEditorId, item: normalizedDraft });
      else await catalog.createItem({ commandId: commandId("catalog-create"), item: normalizedDraft });
      await load();
      setItemEditorId(undefined);
      showFlash("تم حفظ الصنف");
    } catch (saveError) {
      setError(messageFrom(saveError));
    } finally {
      setSaving(false);
    }
  };

  const startNewCategory = () => {
    setCategoryEditorId("new");
    setCategoryName("");
    setCategoryColor(CATALOG_COLOR_PALETTE[0]);
    setError(null);
  };

  const startEditCategory = (category: CatalogCategory) => {
    setCategoryEditorId(category.id);
    setCategoryName(category.name);
    setCategoryColor(category.color);
    setError(null);
  };

  const saveCategory = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (categoryEditorId && categoryEditorId !== "new") {
        await catalog.updateCategory({ commandId: commandId("category-update"), categoryId: categoryEditorId, name: categoryName, color: categoryColor });
      } else {
        await catalog.createCategory({ commandId: commandId("category-create"), name: categoryName, color: categoryColor });
      }
      await load();
      setCategoryEditorId(null);
      showFlash("تم حفظ الفئة");
    } catch (saveError) {
      setError(messageFrom(saveError));
    } finally {
      setSaving(false);
    }
  };

  const openNewOptionGroup = () => {
    setOptionGroupEditorId(null);
    setOptionGroupDraft(emptyOptionGroupDraft());
    setError(null);
  };

  const openOptionGroup = (group: CatalogOptionGroup) => {
    setOptionGroupEditorId(group.id);
    setOptionGroupDraft({ name: group.name, color: group.color, values: group.values });
    setError(null);
  };

  const addOptionGroupValue = () => setOptionGroupDraft({ ...optionGroupDraft, values: [...optionGroupDraft.values, { id: uid("option-value"), name: "", price: { halalas: 0, currency: "SAR" } }] });

  const updateOptionGroupValue = (index: number, patch: { name?: string; halalas?: number }) => setOptionGroupDraft({
    ...optionGroupDraft,
    values: optionGroupDraft.values.map((value, valueIndex) => valueIndex === index ? {
      ...value,
      name: patch.name ?? value.name,
      price: patch.halalas === undefined ? value.price : { halalas: patch.halalas, currency: "SAR" },
    } : value),
  });

  const saveOptionGroup = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (optionGroupEditorId) await catalog.updateOptionGroup({ commandId: commandId("option-update"), groupId: optionGroupEditorId, group: optionGroupDraft });
      else await catalog.createOptionGroup({ commandId: commandId("option-create"), group: optionGroupDraft });
      await load();
      setOptionGroupEditorId(undefined);
      showFlash("تم حفظ مجموعة الخيارات");
    } catch (saveError) {
      setError(messageFrom(saveError));
    } finally {
      setSaving(false);
    }
  };

  const openNewModifier = () => {
    setModifierEditorId(null);
    setModifierDraft(emptyModifierDraft());
    setError(null);
  };

  const openModifier = (modifier: CatalogModifierGroup) => {
    setModifierEditorId(modifier.id);
    setModifierDraft({ name: modifier.name, color: modifier.color, options: modifier.options });
    setError(null);
  };

  const addModifierOption = () => setModifierDraft({ ...modifierDraft, options: [...modifierDraft.options, { id: uid("modifier-option"), name: "", price: { halalas: 0, currency: "SAR" } }] });

  const updateModifierOption = (index: number, patch: { name?: string; halalas?: number }) => setModifierDraft({
    ...modifierDraft,
    options: modifierDraft.options.map((option, optionIndex) => optionIndex === index ? {
      ...option,
      name: patch.name ?? option.name,
      price: patch.halalas === undefined ? option.price : { halalas: patch.halalas, currency: "SAR" },
    } : option),
  });

  const saveModifier = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (modifierEditorId) await catalog.updateModifierGroup({ commandId: commandId("modifier-update"), modifierId: modifierEditorId, modifier: modifierDraft });
      else await catalog.createModifierGroup({ commandId: commandId("modifier-create"), modifier: modifierDraft });
      await load();
      setModifierEditorId(undefined);
      showFlash("تم حفظ مجموعة الإضافات");
    } catch (saveError) {
      setError(messageFrom(saveError));
    } finally {
      setSaving(false);
    }
  };

  const nav = (name: IconName, label: string, onClick?: () => void, disabled = false) => (
    <button className="bo-modern-nav" type="button" onClick={onClick} disabled={disabled}>
      <Icon name={name} size={19} /><span>{label}</span>{disabled ? <small>لاحقًا</small> : null}
    </button>
  );

  const renderSidebar = () => (
    <aside className="bo-sidebar bo-sidebar--modern" aria-label="تنقل المكتب الخلفي">
      <div className="bo-account"><span className="bo-avatar">ر</span><div><strong>رفاد</strong><small>المكتب الخلفي</small></div></div>
      <button className="bo-store-switch bo-store-switch--modern" type="button" disabled><Icon name="store" size={18} /><span><small>المتجر</small><strong>المتجر الرئيسي</strong></span><Icon name="chevron" size={15} /></button>
      <nav className="bo-modern-nav-list">
        {nav("items", "لوحة المعلومات", undefined, true)}
        {nav("reports", "التقارير", undefined, true)}
        <div className="bo-modern-nav-section"><div className="bo-modern-nav-title"><Icon name="items" size={19} /><strong>الأصناف</strong></div>
          <button className={`bo-modern-subnav ${page === "items" ? "is-active" : ""}`} type="button" onClick={() => openPage("items")}>قائمة الأصناف</button>
          <button className={`bo-modern-subnav ${page === "categories" ? "is-active" : ""}`} type="button" onClick={() => openPage("categories")}>الفئات</button>
          <button className={`bo-modern-subnav ${page === "options" ? "is-active" : ""}`} type="button" onClick={() => openPage("options")}>مجموعات الخيارات</button>
          <button className={`bo-modern-subnav ${page === "modifiers" ? "is-active" : ""}`} type="button" onClick={() => openPage("modifiers")}>الإضافات</button>
        </div>
        {nav("inventory", "المخزون", undefined, true)}
        {nav("staff", "الموظفون", undefined, true)}
        {nav("customers", "العملاء", undefined, true)}
        {nav("settings", "الإعدادات", undefined, true)}
      </nav>
      <div className="bo-sidebar-footer"><span className="bo-avatar bo-avatar--small">م</span><div><strong>مدير المتجر</strong><small>واجهة تقييم محلية</small></div></div>
    </aside>
  );

  const renderItemsList = () => (
    <>
      <div className="bo-page-header bo-page-header--compact">
        <div><h1>قائمة الأصناف</h1><p>كل أصناف المتجر في مكان واحد.</p></div>
        <button className="bo-primary bo-action-with-icon" type="button" onClick={openNewItem}><Icon name="add" />إضافة صنف</button>
      </div>
      <section className="bo-card bo-catalog-list-card" aria-busy={loading}>
        <div className="bo-modern-toolbar">
          <label className="bo-modern-search"><Icon name="search" size={18} /><input aria-label="بحث في الأصناف" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث بالاسم أو SKU أو الباركود" /></label>
          <label className="bo-modern-filter"><span>الفئة</span><select aria-label="تصفية حسب الفئة" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option value="all">كل الفئات</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
        </div>
        <div className="bo-list-meta"><strong>{loading ? "جاري التحميل…" : `${visibleItems.length} صنف`}</strong><span>اضغط على الصنف للتعديل</span></div>
        <div className="bo-table-wrap"><table className="bo-modern-table bo-items-table"><thead><tr><th>الصنف</th><th>الفئة</th><th>SKU</th><th>السعر</th><th>التسعير</th><th>الإضافات</th><th>الحالة</th></tr></thead><tbody>
          {!loading && visibleItems.length === 0 ? <tr><td colSpan={7} className="bo-empty">لا توجد أصناف مطابقة.</td></tr> : visibleItems.map((item) => {
            const itemPricing = item.pricing ?? { mode: "fixed" as const };
            const addonCount = (item.modifierGroupIds ?? []).length + (item.privateModifierGroups ?? []).length;
            const category = categories.find((candidate) => candidate.id === item.categoryId);
            return <tr key={item.id} onClick={() => openItem(item)} tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter") openItem(item); }}>
              <td><div className="bo-item-name-cell"><CatalogItemVisual appearance={item.appearance} name={item.name} size={44} /><span><strong>{item.name}</strong>{item.description ? <small>{item.description}</small> : null}</span></div></td>
              <td>{category ? <span className="bo-category-pill"><i style={{ background: category.color }} />{category.name}</span> : "بدون فئة"}</td>
              <td dir="ltr">{item.sku || "—"}</td>
              <td className="bo-price">{itemPricing.mode === "fixed" ? formatMoney(item.price.halalas) : `من ${formatMoney(item.price.halalas)}`}</td>
              <td><span className={`bo-pricing-badge ${itemPricing.mode === "fixed" ? "is-fixed" : "is-multiple"}`}>{pricingLabel(item, optionGroups)}</span></td>
              <td>{addonCount ? `${addonCount} مجموعة` : "—"}</td>
              <td><span className={item.availableForSale ? "bo-status bo-status--on" : "bo-status bo-status--off"}>{item.availableForSale ? "متاح للبيع" : "غير متاح"}</span></td>
            </tr>;
          })}
        </tbody></table></div>
      </section>
    </>
  );

  const renderPricingCard = () => (
    <section className="bo-form-card bo-modern-section">
      <div className="bo-section-heading"><div><h2>السعر</h2><p>اختر سعرًا واحدًا أو أسعارًا مباشرة حسب الحجم أو أي مجموعة خيارات.</p></div></div>
      <div className="bo-modern-section-body">
        <div className="bo-price-mode-row">
          <label className={`bo-field bo-fixed-price-field ${multiplePrices ? "is-disabled" : ""}`}><span>السعر الأساسي</span><div className="bo-money-input"><input aria-label="السعر الأساسي" inputMode="decimal" dir="ltr" value={basePriceText} disabled={multiplePrices} onChange={(event) => { setBasePriceText(event.target.value); const parsed = parsePriceInput(event.target.value); if (parsed !== null) setItemDraft({ ...itemDraft, price: { halalas: parsed, currency: "SAR" } }); }} /><span>ر.س</span></div></label>
          <label className="bo-switch-card"><input aria-label="أسعار متعددة" type="checkbox" checked={multiplePrices} onChange={(event) => setMultiplePrices(event.target.checked)} /><span className="bo-switch-ui" /><span><strong>أسعار متعددة</strong><small>مثال: صغير 10، وسط 20، كبير 25</small></span></label>
        </div>
        {multiplePrices ? <div className="bo-multi-price-panel">
          <div className="bo-segmented" role="group" aria-label="مصدر الأسعار">
            <button className={pricing.mode === "option-group" ? "is-active" : ""} type="button" onClick={useSharedPricing}>مجموعة جاهزة</button>
            <button className={pricing.mode === "custom-options" ? "is-active" : ""} type="button" onClick={useCustomPricing}>خيارات خاصة بهذا الصنف</button>
          </div>
          {pricing.mode === "option-group" ? <>
            <label className="bo-field bo-field--wide"><span>مجموعة الخيارات</span><select aria-label="مجموعة الخيارات" value={pricing.groupId} onChange={(event) => setPricingGroup(event.target.value)}>{optionGroups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select></label>
            {selectedPricingGroup ? <div className="bo-price-options-card">
              <div className="bo-price-options-head"><div className="bo-group-heading"><span className="bo-group-color" style={{ background: selectedPricingGroup.color }} /><div><strong>{selectedPricingGroup.name}</strong><small>تتحدث أسعار هذه المجموعة لكل الأصناف التي تستخدمها.</small></div></div><label className="bo-inline-check"><input aria-label="تخصيص الأسعار لهذا الصنف" type="checkbox" checked={pricing.priceMode === "custom"} onChange={(event) => setGroupPriceMode(event.target.checked)} /><span>تخصيص الأسعار لهذا الصنف</span></label></div>
              <div className="bo-price-option-rows">{selectedPricingGroup.values.map((value) => {
                const override = pricing.overrides.find((candidate) => candidate.valueId === value.id);
                const halalas = pricing.priceMode === "custom" ? override?.price.halalas ?? value.price.halalas : value.price.halalas;
                return <div className="bo-price-option-row" key={value.id}><strong>{value.name}</strong><div className="bo-compact-money"><input aria-label={`سعر ${value.name}`} type="number" min="0" step="0.01" disabled={pricing.priceMode !== "custom"} value={(halalas / 100).toFixed(2)} onChange={(event) => updateGroupPriceOverride(value.id, toHalalas(event.target.value))} /><span>ر.س</span></div>{pricing.priceMode === "custom" && override ? <small>مخصص</small> : <small>من المجموعة</small>}</div>;
              })}</div>
            </div> : <div className="bo-empty-panel"><strong>لا توجد مجموعة جاهزة</strong><span>أنشئ مجموعة خيارات أولًا أو استخدم خيارات خاصة.</span></div>}
          </> : null}
          {pricing.mode === "custom-options" ? <div className="bo-custom-pricing-card">
            <label className="bo-field bo-field--wide"><span>اسم الخيار</span><input aria-label="اسم الخيارات الخاصة" value={pricing.name} onChange={(event) => setItemDraft({ ...itemDraft, pricing: { ...pricing, name: event.target.value } })} placeholder="مثال: الحجم" /></label>
            <div className="bo-price-option-rows">{pricing.values.map((value) => <div className="bo-price-option-row bo-price-option-row--editable" key={value.id}><input aria-label="اسم الخيار الخاص" value={value.name} onChange={(event) => updateCustomPriceValue(value.id, { name: event.target.value })} placeholder="مثال: صغير" /><div className="bo-compact-money"><input aria-label={`سعر ${value.name || "الخيار"}`} type="number" min="0" step="0.01" value={(value.price.halalas / 100).toFixed(2)} onChange={(event) => updateCustomPriceValue(value.id, { halalas: toHalalas(event.target.value) })} /><span>ر.س</span></div><button className="bo-icon-danger" type="button" disabled={pricing.values.length <= 2} onClick={() => removeCustomPriceValue(value.id)} aria-label="حذف الخيار"><Icon name="trash" size={17} /></button></div>)}</div>
            <button className="bo-add-row" type="button" onClick={addCustomPriceValue}><Icon name="add" size={17} />إضافة خيار</button>
          </div> : null}
        </div> : null}
      </div>
    </section>
  );

  const renderAppearanceCard = () => (
    <section className="bo-form-card bo-modern-section bo-appearance-section">
      <div className="bo-section-heading"><div><h2>العرض في نقطة البيع</h2><p>اختر صورة للصنف أو لونًا وشكلًا واضحين للكاشير.</p></div></div>
      <div className="bo-modern-section-body">
        <CatalogAppearanceEditor appearance={appearance} itemName={itemDraft.name} onChange={(next) => setItemDraft({ ...itemDraft, appearance: next })} />
      </div>
    </section>
  );

  const renderAddonsCard = () => (
    <section className="bo-form-card bo-modern-section">
      <div className="bo-section-heading"><div><h2>الإضافات</h2><p>استخدم مجموعة عامة لأصناف كثيرة، أو أضف خيارات خاصة بهذا الصنف فقط.</p></div></div>
      <div className="bo-modern-section-body bo-addon-sections">
        <div><div className="bo-subsection-title"><div><strong>الإضافات العامة</strong><small>أنشئها مرة واربطها بأي عدد من الأصناف.</small></div></div>
          {modifierGroups.length === 0 ? <div className="bo-empty-panel"><strong>لا توجد إضافات عامة</strong><span>أنشئ مجموعة من صفحة الإضافات.</span></div> : <div className="bo-check-list">{modifierGroups.map((modifier) => <label key={modifier.id} className="bo-check-card" style={{ borderInlineStartColor: modifier.color }}><input type="checkbox" checked={(itemDraft.modifierGroupIds ?? []).includes(modifier.id)} onChange={() => toggleModifierForItem(modifier.id)} aria-label={modifier.name} /><span className="bo-group-color bo-group-color--small" style={{ background: modifier.color }} /><span><strong>{modifier.name}</strong><small>{modifier.options.length} خيار</small></span></label>)}</div>}
        </div>
        <div className="bo-private-addons"><div className="bo-subsection-title"><div><strong>إضافات خاصة بهذا الصنف</strong><small>لا تظهر ولا تُستخدم مع أي صنف آخر.</small></div><button className="bo-link-button bo-action-with-icon" type="button" onClick={addPrivateModifierGroup}><Icon name="add" size={16} />إضافة خاصة</button></div>
          {(itemDraft.privateModifierGroups ?? []).length === 0 ? <div className="bo-empty-inline">لا توجد إضافات خاصة.</div> : (itemDraft.privateModifierGroups ?? []).map((group) => <div className="bo-private-group" key={group.id}>
            <div className="bo-private-group-head"><input aria-label="اسم الإضافات الخاصة" value={group.name} onChange={(event) => updatePrivateModifierGroup(group.id, { name: event.target.value })} placeholder="مثال: إضافات البيتزا الخاصة" /><button className="bo-icon-danger" type="button" onClick={() => setItemDraft({ ...itemDraft, privateModifierGroups: (itemDraft.privateModifierGroups ?? []).filter((candidate) => candidate.id !== group.id) })} aria-label="حذف مجموعة الإضافات الخاصة"><Icon name="trash" size={17} /></button></div>
            {group.options.map((option) => <div className="bo-addon-option-row" key={option.id}><input aria-label="اسم الإضافة الخاصة" value={option.name} onChange={(event) => updatePrivateModifierOption(group.id, option.id, { name: event.target.value })} placeholder="اسم الإضافة" /><div className="bo-compact-money"><input aria-label={`سعر ${option.name || "الإضافة"}`} type="number" min="0" step="0.01" value={(option.price.halalas / 100).toFixed(2)} onChange={(event) => updatePrivateModifierOption(group.id, option.id, { halalas: toHalalas(event.target.value) })} /><span>ر.س</span></div><button className="bo-icon-danger" type="button" disabled={group.options.length <= 1} onClick={() => removePrivateModifierOption(group.id, option.id)} aria-label="حذف الإضافة"><Icon name="trash" size={16} /></button></div>)}
            <button className="bo-add-row" type="button" onClick={() => addPrivateModifierOption(group.id)}><Icon name="add" size={16} />إضافة خيار</button>
          </div>)}
        </div>
      </div>
    </section>
  );

  const renderItemEditor = () => (
    <form className="bo-editor-page bo-item-editor-2026" onSubmit={saveItem}>
      <div className="bo-editor-topbar bo-editor-topbar--modern"><button className="bo-back-link" type="button" onClick={() => setItemEditorId(undefined)}><Icon name="back" size={18} />قائمة الأصناف</button><div className="bo-editor-actions"><button className="bo-secondary" type="button" onClick={() => setItemEditorId(undefined)} disabled={saving}>إلغاء</button><button className="bo-primary bo-action-with-icon" type="submit" disabled={saving}><Icon name="save" size={17} />{saving ? "جارٍ الحفظ…" : "حفظ الصنف"}</button></div></div>
      <div className="bo-editor-heading"><span>{selectedItem ? "تعديل صنف" : "صنف جديد"}</span><h1>{selectedItem?.name || itemDraft.name || "إضافة صنف"}</h1></div>
      <div className="bo-editor-column bo-editor-column--focused">
        <section className="bo-form-card bo-modern-section"><div className="bo-section-heading"><div><h2>معلومات الصنف</h2><p>المعلومات الأساسية التي تظهر في المكتب الخلفي ونقطة البيع.</p></div></div><div className="bo-form-grid bo-form-grid--modern">
          <label className="bo-field bo-field--wide"><span>اسم الصنف <b>*</b></span><input aria-label="اسم الصنف" value={itemDraft.name} onChange={(event) => setItemDraft({ ...itemDraft, name: event.target.value })} autoFocus /></label>
          <label className="bo-field"><span>الفئة</span><select aria-label="فئة الصنف" value={itemDraft.categoryId ?? ""} onChange={(event) => setItemDraft({ ...itemDraft, categoryId: event.target.value || null })}><option value="">بدون فئة</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
          <label className="bo-field"><span>SKU</span><input aria-label="SKU" dir="ltr" value={itemDraft.sku} onChange={(event) => setItemDraft({ ...itemDraft, sku: event.target.value })} maxLength={40} /></label>
          <label className="bo-field"><span>الباركود</span><input aria-label="الباركود" dir="ltr" value={itemDraft.barcode} onChange={(event) => setItemDraft({ ...itemDraft, barcode: event.target.value })} inputMode="numeric" /></label>
          <label className="bo-field bo-field--wide"><span>الوصف</span><textarea aria-label="الوصف" value={itemDraft.description} onChange={(event) => setItemDraft({ ...itemDraft, description: event.target.value })} rows={3} placeholder="وصف اختياري" /></label>
          <label className="bo-switch-card bo-field--wide"><input aria-label="متاح للبيع" type="checkbox" checked={itemDraft.availableForSale} onChange={(event) => setItemDraft({ ...itemDraft, availableForSale: event.target.checked })} /><span className="bo-switch-ui" /><span><strong>متاح للبيع</strong><small>عند الإيقاف يبقى الصنف محفوظًا لكنه لا يظهر في نقطة البيع.</small></span></label>
        </div></section>
        {renderPricingCard()}
        {renderAppearanceCard()}
        {renderAddonsCard()}
      </div>
      {error ? <div className="bo-alert bo-editor-alert" role="alert">{error}</div> : null}
      <div className="bo-editor-bottom-actions"><button className="bo-secondary" type="button" onClick={() => setItemEditorId(undefined)} disabled={saving}>إلغاء</button><button className="bo-primary bo-action-with-icon" type="submit" disabled={saving}><Icon name="save" size={17} />{saving ? "جارٍ الحفظ…" : "حفظ الصنف"}</button></div>
    </form>
  );

  const renderCategories = () => (
    <>
      <div className="bo-page-header bo-page-header--compact"><div><h1>الفئات</h1><p>ألوان الفئات تجعل قائمة البيع أسرع في المسح البصري.</p></div><button className="bo-primary bo-action-with-icon" type="button" onClick={startNewCategory}><Icon name="add" />إضافة فئة</button></div>
      <section className="bo-card"><div className="bo-table-wrap"><table className="bo-modern-table bo-simple-table"><thead><tr><th>الفئة</th><th>عدد الأصناف</th></tr></thead><tbody>{categories.map((category) => <tr key={category.id} onClick={() => startEditCategory(category)}><td><div className="bo-category-name"><span className="bo-category-dot" style={{ background: category.color, boxShadow: `0 0 0 4px ${tint(category.color)}` }} /><strong>{category.name}</strong></div></td><td>{items.filter((item) => item.categoryId === category.id).length}</td></tr>)}</tbody></table></div></section>
      {categoryEditorId ? <div className="bo-modal-backdrop"><form className="bo-modal bo-focused-modal" onSubmit={saveCategory}><div className="bo-modal-icon" style={{ color: categoryColor, background: tint(categoryColor) }}><Icon name="category" size={28} /></div><label className="bo-field"><span>اسم الفئة</span><input aria-label="اسم الفئة" autoFocus value={categoryName} onChange={(event) => setCategoryName(event.target.value)} placeholder="مثال: البيتزا" /></label><div className="bo-modal-color-field"><strong>لون الفئة</strong><small>يظهر كمؤشر بصري في الإدارة ونقطة البيع.</small><CatalogColorPicker value={categoryColor} onChange={setCategoryColor} label="لون الفئة" /></div>{error ? <div className="bo-alert" role="alert">{error}</div> : null}<div className="bo-modal-actions"><button type="button" className="bo-secondary" onClick={() => setCategoryEditorId(null)}>إلغاء</button><button type="submit" className="bo-primary bo-action-with-icon"><Icon name="save" size={16} />حفظ</button></div></form></div> : null}
    </>
  );

  const renderOptions = () => (
    <>
      <div className="bo-page-header bo-page-header--compact"><div><h1>مجموعات الخيارات</h1><p>أنشئ المجموعة مرة واحدة واستخدمها مع عشرات أو مئات الأصناف.</p></div><button className="bo-primary bo-action-with-icon" type="button" onClick={openNewOptionGroup}><Icon name="add" />إضافة مجموعة</button></div>
      <section className="bo-card"><div className="bo-table-wrap"><table className="bo-modern-table bo-simple-table"><thead><tr><th>المجموعة</th><th>الخيارات والأسعار</th><th>مستخدمة في</th></tr></thead><tbody>{optionGroups.map((group) => <tr key={group.id} onClick={() => openOptionGroup(group)}><td><div className="bo-row-title-icon"><span className="bo-round-icon" style={{ color: group.color, background: tint(group.color) }}><Icon name="options" size={18} /></span><strong>{group.name}</strong></div></td><td>{group.values.map((value) => `${value.name} ${formatMoney(value.price.halalas)}`).join(" · ")}</td><td>{items.filter((item) => item.pricing?.mode === "option-group" && item.pricing.groupId === group.id).length} صنف</td></tr>)}</tbody></table></div></section>
      {optionGroupEditorId !== undefined ? <div className="bo-modal-backdrop"><form className="bo-modal bo-modal--wide bo-focused-modal" onSubmit={saveOptionGroup}><div className="bo-modal-icon" style={{ color: optionGroupDraft.color, background: tint(optionGroupDraft.color ?? "#2D8CFF") }}><Icon name="options" size={28} /></div><label className="bo-field"><span>اسم المجموعة</span><input aria-label="اسم مجموعة الخيارات" autoFocus value={optionGroupDraft.name} onChange={(event) => setOptionGroupDraft({ ...optionGroupDraft, name: event.target.value })} placeholder="مثال: أحجام البيتزا" /></label><div className="bo-modal-color-field"><strong>لون المجموعة</strong><small>يساعد على تمييز مجموعات التسعير بسرعة.</small><CatalogColorPicker value={optionGroupDraft.color ?? "#2D8CFF"} onChange={(color) => setOptionGroupDraft({ ...optionGroupDraft, color })} label="لون مجموعة الخيارات" /></div><div className="bo-builder-list"><div className="bo-builder-head"><strong>الخيارات والأسعار</strong><span>هذه الأسعار الافتراضية لكل الأصناف المرتبطة بالمجموعة.</span></div>{optionGroupDraft.values.map((value, index) => <div className="bo-builder-row" key={value.id ?? index}><input aria-label={`اسم الخيار ${index + 1}`} value={value.name} onChange={(event) => updateOptionGroupValue(index, { name: event.target.value })} placeholder="مثال: صغير" /><div className="bo-compact-money"><input aria-label={`سعر الخيار ${index + 1}`} type="number" min="0" step="0.01" value={(value.price.halalas / 100).toFixed(2)} onChange={(event) => updateOptionGroupValue(index, { halalas: toHalalas(event.target.value) })} /><span>ر.س</span></div><button type="button" className="bo-icon-danger" disabled={optionGroupDraft.values.length <= 2} onClick={() => setOptionGroupDraft({ ...optionGroupDraft, values: optionGroupDraft.values.filter((_, valueIndex) => valueIndex !== index) })} aria-label="حذف الخيار"><Icon name="trash" size={16} /></button></div>)}<button className="bo-add-row" type="button" onClick={addOptionGroupValue}><Icon name="add" size={16} />إضافة خيار</button></div>{error ? <div className="bo-alert" role="alert">{error}</div> : null}<div className="bo-modal-actions"><button type="button" className="bo-secondary" onClick={() => setOptionGroupEditorId(undefined)}>إلغاء</button><button type="submit" className="bo-primary bo-action-with-icon"><Icon name="save" size={16} />حفظ المجموعة</button></div></form></div> : null}
    </>
  );

  const renderModifiers = () => (
    <>
      <div className="bo-page-header bo-page-header--compact"><div><h1>الإضافات</h1><p>مجموعات إضافات عامة يمكن ربطها بأي عدد من الأصناف.</p></div><button className="bo-primary bo-action-with-icon" type="button" onClick={openNewModifier}><Icon name="add" />إضافة مجموعة</button></div>
      <section className="bo-card"><div className="bo-table-wrap"><table className="bo-modern-table bo-simple-table"><thead><tr><th>المجموعة</th><th>الإضافات</th><th>مستخدمة في</th></tr></thead><tbody>{modifierGroups.map((modifier) => <tr key={modifier.id} onClick={() => openModifier(modifier)}><td><div className="bo-row-title-icon"><span className="bo-round-icon" style={{ color: modifier.color, background: tint(modifier.color) }}><Icon name="addon" size={18} /></span><strong>{modifier.name}</strong></div></td><td>{modifier.options.map((option) => `${option.name} +${formatMoney(option.price.halalas)}`).join(" · ")}</td><td>{items.filter((item) => (item.modifierGroupIds ?? []).includes(modifier.id)).length} صنف</td></tr>)}</tbody></table></div></section>
      {modifierEditorId !== undefined ? <div className="bo-modal-backdrop"><form className="bo-modal bo-modal--wide bo-focused-modal" onSubmit={saveModifier}><div className="bo-modal-icon" style={{ color: modifierDraft.color, background: tint(modifierDraft.color ?? "#9B51E0") }}><Icon name="addon" size={28} /></div><label className="bo-field"><span>اسم المجموعة</span><input aria-label="اسم مجموعة الإضافات" autoFocus value={modifierDraft.name} onChange={(event) => setModifierDraft({ ...modifierDraft, name: event.target.value })} placeholder="مثال: إضافات القهوة" /></label><div className="bo-modal-color-field"><strong>لون المجموعة</strong><small>لون هادئ لتمييز مجموعات الإضافات.</small><CatalogColorPicker value={modifierDraft.color ?? "#9B51E0"} onChange={(color) => setModifierDraft({ ...modifierDraft, color })} label="لون مجموعة الإضافات" /></div><div className="bo-builder-list"><div className="bo-builder-head"><strong>الإضافات</strong><span>السعر هنا يضاف إلى سعر الصنف.</span></div>{modifierDraft.options.map((option, index) => <div className="bo-builder-row" key={option.id ?? index}><input aria-label={`اسم الإضافة ${index + 1}`} value={option.name} onChange={(event) => updateModifierOption(index, { name: event.target.value })} placeholder="مثال: شوت إضافي" /><div className="bo-compact-money"><input aria-label={`سعر الإضافة ${index + 1}`} type="number" min="0" step="0.01" value={(option.price.halalas / 100).toFixed(2)} onChange={(event) => updateModifierOption(index, { halalas: toHalalas(event.target.value) })} /><span>ر.س</span></div><button type="button" className="bo-icon-danger" disabled={modifierDraft.options.length <= 1} onClick={() => setModifierDraft({ ...modifierDraft, options: modifierDraft.options.filter((_, optionIndex) => optionIndex !== index) })} aria-label="حذف الإضافة"><Icon name="trash" size={16} /></button></div>)}<button className="bo-add-row" type="button" onClick={addModifierOption}><Icon name="add" size={16} />إضافة خيار</button></div>{error ? <div className="bo-alert" role="alert">{error}</div> : null}<div className="bo-modal-actions"><button type="button" className="bo-secondary" onClick={() => setModifierEditorId(undefined)}>إلغاء</button><button type="submit" className="bo-primary bo-action-with-icon"><Icon name="save" size={16} />حفظ المجموعة</button></div></form></div> : null}
    </>
  );

  const title = itemEditorId !== undefined ? "الصنف" : page === "categories" ? "الفئات" : page === "options" ? "مجموعات الخيارات" : page === "modifiers" ? "الإضافات" : "قائمة الأصناف";

  return (
    <div className="bo-shell" dir="rtl">
      {renderSidebar()}
      <main className="bo-main">
        <div className="bo-topbar"><div className="bo-topbar-title"><strong>{title}</strong><span>المتجر الرئيسي</span></div><span className="bo-top-status">تجربة محلية</span></div>
        <div className="bo-content">{itemEditorId !== undefined ? renderItemEditor() : page === "categories" ? renderCategories() : page === "options" ? renderOptions() : page === "modifiers" ? renderModifiers() : renderItemsList()}</div>
      </main>
      {flash ? <div className="bo-toast" role="status">✓ {flash}</div> : null}
    </div>
  );
}
