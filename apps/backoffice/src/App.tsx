import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  CatalogContractError,
  type CatalogAdminContract,
  type CatalogCategory,
  type CatalogItem,
  type CatalogItemDraft,
  type CatalogModifierGroup,
  type CatalogModifierGroupDraft,
  type CatalogVariant,
  type CatalogVariantOption,
} from "../../../contracts/catalog";
import { createBrowserCatalogAdmin } from "../../../adapters/catalog/browserCatalog";

type CatalogPage = "items" | "categories" | "modifiers";

const uid = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;
const commandId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;

const emptyItemDraft = (): CatalogItemDraft => ({
  name: "",
  description: "",
  categoryId: null,
  price: { halalas: 0, currency: "SAR" },
  sku: "",
  barcode: "",
  availableForSale: true,
  variantOptions: [],
  variants: [],
  modifierGroupIds: [],
});

const toDraft = (item: CatalogItem): CatalogItemDraft => ({
  name: item.name,
  description: item.description,
  categoryId: item.categoryId,
  price: item.price,
  sku: item.sku,
  barcode: item.barcode,
  availableForSale: item.availableForSale,
  variantOptions: item.variantOptions ?? [],
  variants: item.variants ?? [],
  modifierGroupIds: item.modifierGroupIds ?? [],
});

const emptyModifierDraft = (): CatalogModifierGroupDraft => ({
  name: "",
  options: [{ id: uid("modifier-option"), name: "", price: { halalas: 0, currency: "SAR" } }],
});

const formatMoney = (halalas: number) => `${(halalas / 100).toLocaleString("ar-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ر.س`;
const halalasToInput = (halalas: number) => `${Math.floor(halalas / 100)}.${String(Math.abs(halalas % 100)).padStart(2, "0")}`;

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

const optionValueName = (options: readonly CatalogVariantOption[], valueId: string) => {
  for (const option of options) {
    const value = option.values.find((candidate) => candidate.id === valueId);
    if (value) return value.name;
  }
  return "";
};

const combinationKey = (ids: readonly string[]) => ids.join("|");

const buildCombinations = (options: readonly CatalogVariantOption[]): readonly (readonly string[])[] => {
  if (options.length === 0 || options.some((option) => option.values.length === 0)) return [];
  return options.reduce<readonly (readonly string[])[]>(
    (combinations, option) => combinations.flatMap((combination) => option.values.map((value) => [...combination, value.id])),
    [[]],
  );
};

const rebuildVariants = (
  options: readonly CatalogVariantOption[],
  current: readonly CatalogVariant[],
  basePriceHalalas: number,
): readonly CatalogVariant[] => {
  const previous = new Map(current.map((variant) => [combinationKey(variant.optionValueIds), variant]));
  return buildCombinations(options).map((ids) => {
    const found = previous.get(combinationKey(ids));
    if (found) {
      return {
        ...found,
        name: ids.map((id) => optionValueName(options, id)).filter(Boolean).join(" / "),
      };
    }
    return {
      id: uid("variant"),
      name: ids.map((id) => optionValueName(options, id)).filter(Boolean).join(" / "),
      optionValueIds: ids,
      price: { halalas: basePriceHalalas, currency: "SAR" },
      sku: "",
      barcode: "",
    };
  });
};

const navIcon = (value: string) => <span className="bo-nav-icon" aria-hidden="true">{value}</span>;

export default function App({ catalog = createBrowserCatalogAdmin() }: { catalog?: CatalogAdminContract }) {
  const [page, setPage] = useState<CatalogPage>("items");
  const [items, setItems] = useState<readonly CatalogItem[]>([]);
  const [categories, setCategories] = useState<readonly CatalogCategory[]>([]);
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
  const [variantValueInputs, setVariantValueInputs] = useState<Record<string, string>>({});

  const [categoryEditorId, setCategoryEditorId] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState("");

  const [modifierEditorId, setModifierEditorId] = useState<string | null | undefined>(undefined);
  const [modifierDraft, setModifierDraft] = useState<CatalogModifierGroupDraft>(emptyModifierDraft());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextItems, nextCategories, nextModifiers] = await Promise.all([
        catalog.listItems({ includeUnavailable: true }),
        catalog.listCategories(),
        catalog.listModifierGroups(),
      ]);
      setItems(nextItems);
      setCategories(nextCategories);
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
      const variantMatch = (item.variants ?? []).some((variant) =>
        variant.name.toLocaleLowerCase("ar").includes(needle)
        || variant.sku.toLocaleLowerCase("en").includes(needle.toLocaleLowerCase("en"))
        || variant.barcode.includes(needle));
      return item.name.toLocaleLowerCase("ar").includes(needle)
        || item.sku.toLocaleLowerCase("en").includes(needle.toLocaleLowerCase("en"))
        || item.barcode.includes(needle)
        || variantMatch;
    });
  }, [categoryFilter, items, query]);

  const selectedItem = itemEditorId ? items.find((item) => item.id === itemEditorId) ?? null : null;
  const selectedModifier = modifierEditorId ? modifierGroups.find((modifier) => modifier.id === modifierEditorId) ?? null : null;

  const showFlash = (message: string) => {
    setFlash(message);
    window.setTimeout(() => setFlash((current) => current === message ? null : current), 2400);
  };

  const openPage = (nextPage: CatalogPage) => {
    setPage(nextPage);
    setItemEditorId(undefined);
    setModifierEditorId(undefined);
    setCategoryEditorId(null);
    setError(null);
  };

  const openNewItem = () => {
    setItemEditorId(null);
    setItemDraft(emptyItemDraft());
    setBasePriceText("0.00");
    setVariantValueInputs({});
    setError(null);
  };

  const openItem = (item: CatalogItem) => {
    setItemEditorId(item.id);
    setItemDraft(toDraft(item));
    setBasePriceText(halalasToInput(item.price.halalas));
    setVariantValueInputs({});
    setError(null);
  };

  const setVariantOptions = (options: readonly CatalogVariantOption[]) => {
    const variants = rebuildVariants(options, itemDraft.variants ?? [], itemDraft.price.halalas);
    setItemDraft({ ...itemDraft, variantOptions: options, variants });
  };

  const addVariantOption = () => {
    const current = itemDraft.variantOptions ?? [];
    if (current.length >= 3) return;
    setVariantOptions([...current, { id: uid("variant-option"), name: "", values: [] }]);
  };

  const updateVariantOptionName = (optionId: string, name: string) => {
    setVariantOptions((itemDraft.variantOptions ?? []).map((option) => option.id === optionId ? { ...option, name } : option));
  };

  const removeVariantOption = (optionId: string) => {
    setVariantOptions((itemDraft.variantOptions ?? []).filter((option) => option.id !== optionId));
  };

  const addVariantValue = (optionId: string) => {
    const name = (variantValueInputs[optionId] ?? "").trim();
    if (!name) return;
    const options = itemDraft.variantOptions ?? [];
    const target = options.find((option) => option.id === optionId);
    if (!target || target.values.some((value) => value.name.toLocaleLowerCase("ar") === name.toLocaleLowerCase("ar"))) return;
    const tentative = options.map((option) => option.id === optionId
      ? { ...option, values: [...option.values, { id: uid("variant-value"), name }] }
      : option);
    const count = tentative.reduce((total, option) => total * Math.max(option.values.length, 1), 1);
    if (tentative.every((option) => option.values.length > 0) && count > 200) {
      setError("عدد تركيبات المتغيرات لا يمكن أن يتجاوز 200.");
      return;
    }
    setVariantValueInputs({ ...variantValueInputs, [optionId]: "" });
    setVariantOptions(tentative);
  };

  const removeVariantValue = (optionId: string, valueId: string) => {
    setVariantOptions((itemDraft.variantOptions ?? []).map((option) => option.id === optionId
      ? { ...option, values: option.values.filter((value) => value.id !== valueId) }
      : option));
  };

  const updateVariant = (variantId: string, patch: Partial<CatalogVariant>) => {
    setItemDraft({
      ...itemDraft,
      variants: (itemDraft.variants ?? []).map((variant) => variant.id === variantId ? { ...variant, ...patch } : variant),
    });
  };

  const toggleModifierForItem = (modifierId: string) => {
    const current = new Set(itemDraft.modifierGroupIds ?? []);
    if (current.has(modifierId)) current.delete(modifierId); else current.add(modifierId);
    setItemDraft({ ...itemDraft, modifierGroupIds: Array.from(current) });
  };

  const saveItem = async (event: FormEvent) => {
    event.preventDefault();
    const halalas = parsePriceInput(basePriceText);
    if (halalas === null) {
      setError("أدخل السعر بصيغة صحيحة مثل 12.50");
      return;
    }
    const normalizedDraft: CatalogItemDraft = {
      ...itemDraft,
      price: { halalas, currency: "SAR" },
      variants: (itemDraft.variants ?? []).map((variant) => ({
        ...variant,
        price: variant.price.currency === "SAR" ? variant.price : { halalas: variant.price.halalas, currency: "SAR" },
      })),
    };
    setSaving(true);
    setError(null);
    try {
      if (itemEditorId) {
        await catalog.updateItem({ commandId: commandId("catalog-update"), itemId: itemEditorId, item: normalizedDraft });
      } else {
        await catalog.createItem({ commandId: commandId("catalog-create"), item: normalizedDraft });
      }
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
    setError(null);
  };

  const startEditCategory = (category: CatalogCategory) => {
    setCategoryEditorId(category.id);
    setCategoryName(category.name);
    setError(null);
  };

  const saveCategory = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (categoryEditorId && categoryEditorId !== "new") {
        await catalog.updateCategory({ commandId: commandId("category-update"), categoryId: categoryEditorId, name: categoryName });
      } else {
        await catalog.createCategory({ commandId: commandId("category-create"), name: categoryName });
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

  const openNewModifier = () => {
    setModifierEditorId(null);
    setModifierDraft(emptyModifierDraft());
    setError(null);
  };

  const openModifier = (modifier: CatalogModifierGroup) => {
    setModifierEditorId(modifier.id);
    setModifierDraft({ name: modifier.name, options: modifier.options });
    setError(null);
  };

  const addModifierOption = () => {
    setModifierDraft({
      ...modifierDraft,
      options: [...modifierDraft.options, { id: uid("modifier-option"), name: "", price: { halalas: 0, currency: "SAR" } }],
    });
  };

  const updateModifierOption = (optionId: string | undefined, index: number, patch: { name?: string; halalas?: number }) => {
    setModifierDraft({
      ...modifierDraft,
      options: modifierDraft.options.map((option, optionIndex) => optionIndex === index
        ? {
            ...option,
            id: optionId ?? option.id,
            name: patch.name ?? option.name,
            price: patch.halalas === undefined ? option.price : { halalas: patch.halalas, currency: "SAR" },
          }
        : option),
    });
  };

  const saveModifier = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (modifierEditorId) {
        await catalog.updateModifierGroup({ commandId: commandId("modifier-update"), modifierId: modifierEditorId, modifier: modifierDraft });
      } else {
        await catalog.createModifierGroup({ commandId: commandId("modifier-create"), modifier: modifierDraft });
      }
      await load();
      setModifierEditorId(undefined);
      showFlash("تم حفظ مجموعة الإضافات");
    } catch (saveError) {
      setError(messageFrom(saveError));
    } finally {
      setSaving(false);
    }
  };

  const renderSidebar = () => (
    <aside className="bo-sidebar" aria-label="تنقل المكتب الخلفي">
      <div className="bo-brand">
        <div className="bo-brand-mark">ر</div>
        <div><strong>رفاد</strong><span>المكتب الخلفي</span></div>
      </div>
      <button className="bo-store-switch" type="button" disabled>
        <span><small>المتجر</small><strong>المتجر الرئيسي</strong></span><b>⌄</b>
      </button>
      <nav className="bo-nav">
        <button className="bo-nav-item bo-nav-item--disabled" type="button" disabled>{navIcon("⌂")}<span>لوحة المعلومات</span><em>لاحقًا</em></button>
        <button className="bo-nav-item bo-nav-item--disabled" type="button" disabled>{navIcon("▥")}<span>التقارير</span><em>لاحقًا</em></button>
        <div className="bo-nav-group">
          <div className="bo-nav-group-title">{navIcon("▦")}<strong>الأصناف</strong></div>
          <button className={`bo-subnav-item ${page === "items" ? "bo-subnav-item--active" : ""}`} type="button" onClick={() => openPage("items")}>قائمة الأصناف</button>
          <button className={`bo-subnav-item ${page === "categories" ? "bo-subnav-item--active" : ""}`} type="button" onClick={() => openPage("categories")}>الفئات</button>
          <button className={`bo-subnav-item ${page === "modifiers" ? "bo-subnav-item--active" : ""}`} type="button" onClick={() => openPage("modifiers")}>الإضافات</button>
        </div>
        <button className="bo-nav-item bo-nav-item--disabled" type="button" disabled>{navIcon("▤")}<span>المخزون</span><em>لاحقًا</em></button>
        <button className="bo-nav-item bo-nav-item--disabled" type="button" disabled>{navIcon("♙")}<span>الموظفون</span><em>لاحقًا</em></button>
        <button className="bo-nav-item bo-nav-item--disabled" type="button" disabled>{navIcon("◎")}<span>العملاء</span><em>لاحقًا</em></button>
        <button className="bo-nav-item bo-nav-item--disabled" type="button" disabled>{navIcon("⚙")}<span>الإعدادات</span><em>لاحقًا</em></button>
      </nav>
      <div className="bo-sidebar-footer"><span className="bo-avatar">م</span><div><strong>مدير المتجر</strong><small>واجهة تقييم محلية</small></div></div>
    </aside>
  );

  const renderItemsList = () => (
    <>
      <div className="bo-page-header">
        <div><h1>قائمة الأصناف</h1><p>إدارة الأصناف الأساسية والمتغيرات والإضافات المرتبطة بها.</p></div>
        <button className="bo-primary" type="button" onClick={openNewItem}>+ إضافة صنف</button>
      </div>
      <section className="bo-toolbar" aria-label="أدوات قائمة الأصناف">
        <label className="bo-search-field"><span aria-hidden="true">⌕</span><input aria-label="بحث في الأصناف" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="بحث بالاسم أو SKU أو الباركود" /></label>
        <label className="bo-filter-field"><span>الفئة</span><select aria-label="تصفية حسب الفئة" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option value="all">كل الفئات</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
      </section>
      <section className="bo-card bo-table-card" aria-busy={loading}>
        <div className="bo-table-headline"><strong>{loading ? "جاري التحميل…" : `${visibleItems.length} صنف`}</strong><span>اضغط على أي صنف لفتح صفحة التعديل</span></div>
        <div className="bo-table-wrap">
          <table>
            <thead><tr><th>الصنف</th><th>الفئة</th><th>SKU</th><th>السعر</th><th>المتغيرات</th><th>الإضافات</th><th>الحالة</th></tr></thead>
            <tbody>
              {!loading && visibleItems.length === 0 ? <tr><td colSpan={7} className="bo-empty">لا توجد أصناف مطابقة.</td></tr> : visibleItems.map((item) => (
                <tr key={item.id} onClick={() => openItem(item)} tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter") openItem(item); }}>
                  <td><strong>{item.name}</strong>{item.description ? <span className="bo-muted-line">{item.description}</span> : null}</td>
                  <td>{item.categoryName ?? "بدون فئة"}</td>
                  <td dir="ltr">{item.sku || "—"}</td>
                  <td className="bo-price">{formatMoney(item.price.halalas)}</td>
                  <td>{(item.variants ?? []).length > 0 ? `${(item.variants ?? []).length} متغير` : "—"}</td>
                  <td>{(item.modifierGroupIds ?? []).length > 0 ? `${(item.modifierGroupIds ?? []).length} مجموعة` : "—"}</td>
                  <td><span className={item.availableForSale ? "bo-status bo-status--on" : "bo-status bo-status--off"}>{item.availableForSale ? "متاح للبيع" : "غير متاح"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );

  const renderItemEditor = () => (
    <form className="bo-editor-page" onSubmit={saveItem}>
      <div className="bo-editor-topbar">
        <div className="bo-editor-title"><button className="bo-back-button" type="button" onClick={() => setItemEditorId(undefined)} aria-label="العودة إلى قائمة الأصناف">←</button><div><small>{selectedItem ? "تعديل صنف" : "صنف جديد"}</small><h1>{selectedItem?.name || "إضافة صنف"}</h1></div></div>
        <div className="bo-editor-actions"><button className="bo-secondary" type="button" onClick={() => setItemEditorId(undefined)} disabled={saving}>إلغاء</button><button className="bo-primary" type="submit" disabled={saving}>{saving ? "جارٍ الحفظ…" : "حفظ"}</button></div>
      </div>

      <div className="bo-editor-layout">
        <div className="bo-editor-column">
          <section className="bo-form-card">
            <div className="bo-section-heading"><div><h2>معلومات الصنف</h2><p>البيانات الأساسية التي يتعرف بها الكاشير على الصنف.</p></div></div>
            <div className="bo-form-grid">
              <label className="bo-field bo-field--wide"><span>اسم الصنف <b>*</b></span><input aria-label="اسم الصنف" value={itemDraft.name} onChange={(event) => setItemDraft({ ...itemDraft, name: event.target.value })} autoFocus /></label>
              <label className="bo-field"><span>الفئة</span><select aria-label="فئة الصنف" value={itemDraft.categoryId ?? ""} onChange={(event) => setItemDraft({ ...itemDraft, categoryId: event.target.value || null })}><option value="">بدون فئة</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
              <label className="bo-field"><span>السعر الأساسي <b>*</b></span><div className="bo-money-input"><input aria-label="السعر الأساسي" inputMode="decimal" dir="ltr" value={basePriceText} onChange={(event) => { setBasePriceText(event.target.value); const parsed = parsePriceInput(event.target.value); if (parsed !== null) setItemDraft({ ...itemDraft, price: { halalas: parsed, currency: "SAR" } }); }} /><span>ر.س</span></div></label>
              <label className="bo-field"><span>SKU</span><input aria-label="SKU" dir="ltr" value={itemDraft.sku} onChange={(event) => setItemDraft({ ...itemDraft, sku: event.target.value })} maxLength={40} /></label>
              <label className="bo-field"><span>الباركود</span><input aria-label="الباركود" dir="ltr" value={itemDraft.barcode} onChange={(event) => setItemDraft({ ...itemDraft, barcode: event.target.value })} inputMode="numeric" /></label>
              <label className="bo-field bo-field--wide"><span>الوصف</span><textarea aria-label="الوصف" value={itemDraft.description} onChange={(event) => setItemDraft({ ...itemDraft, description: event.target.value })} rows={3} placeholder="وصف اختياري يظهر في تفاصيل الصنف" /></label>
              <label className="bo-toggle bo-field--wide"><input aria-label="متاح للبيع" type="checkbox" checked={itemDraft.availableForSale} onChange={(event) => setItemDraft({ ...itemDraft, availableForSale: event.target.checked })} /><span><strong>متاح للبيع</strong><small>عند إيقافه يبقى الصنف محفوظًا في المكتب الخلفي ولا يظهر في كتالوج البيع الحالي.</small></span></label>
            </div>
          </section>

          <section className="bo-form-card">
            <div className="bo-section-heading"><div><h2>المتغيرات</h2><p>استخدمها للحجم أو اللون أو أي نسخة من نفس الصنف. يمكن إنشاء حتى 3 خيارات و200 تركيبة.</p></div>{(itemDraft.variantOptions ?? []).length === 0 ? <button className="bo-link-button" type="button" onClick={addVariantOption}>+ إضافة متغيرات</button> : null}</div>
            {(itemDraft.variantOptions ?? []).length === 0 ? <div className="bo-empty-panel"><strong>لا توجد متغيرات</strong><span>مثال: الحجم — صغير، وسط، كبير.</span></div> : (
              <div className="bo-variant-builder">
                {(itemDraft.variantOptions ?? []).map((option, optionIndex) => (
                  <div className="bo-option-card" key={option.id}>
                    <div className="bo-option-header"><strong>الخيار {optionIndex + 1}</strong><button type="button" className="bo-text-danger" onClick={() => removeVariantOption(option.id)}>حذف الخيار</button></div>
                    <label className="bo-field"><span>اسم الخيار</span><input aria-label={`اسم خيار المتغير ${optionIndex + 1}`} value={option.name} onChange={(event) => updateVariantOptionName(option.id, event.target.value)} placeholder="مثال: الحجم" /></label>
                    <div className="bo-values-block"><span className="bo-field-label">القيم</span><div className="bo-chip-list">{option.values.map((value) => <span className="bo-chip" key={value.id}>{value.name}<button type="button" aria-label={`حذف ${value.name}`} onClick={() => removeVariantValue(option.id, value.id)}>×</button></span>)}</div><div className="bo-inline-add"><input aria-label={`قيمة جديدة للخيار ${optionIndex + 1}`} value={variantValueInputs[option.id] ?? ""} onChange={(event) => setVariantValueInputs({ ...variantValueInputs, [option.id]: event.target.value })} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addVariantValue(option.id); } }} placeholder="اكتب قيمة ثم اضغط إضافة" /><button type="button" className="bo-secondary bo-small-button" onClick={() => addVariantValue(option.id)}>إضافة</button></div></div>
                  </div>
                ))}
                {(itemDraft.variantOptions ?? []).length < 3 ? <button className="bo-dashed-button" type="button" onClick={addVariantOption}>+ إضافة خيار آخر</button> : null}
                {(itemDraft.variants ?? []).length > 0 ? (
                  <div className="bo-variant-table-wrap"><div className="bo-subsection-title"><strong>تركيبات المتغيرات</strong><span>{(itemDraft.variants ?? []).length} تركيبة</span></div><table className="bo-variant-table"><thead><tr><th>المتغير</th><th>السعر</th><th>SKU</th><th>الباركود</th></tr></thead><tbody>{(itemDraft.variants ?? []).map((variant) => <tr key={variant.id}><td><strong>{variant.name}</strong></td><td><div className="bo-compact-money"><input aria-label={`سعر ${variant.name}`} type="number" min="0" step="0.01" value={(variant.price.halalas / 100).toFixed(2)} onChange={(event) => updateVariant(variant.id, { price: { halalas: Math.max(0, Math.round(Number(event.target.value || 0) * 100)), currency: "SAR" } })} /><span>ر.س</span></div></td><td><input aria-label={`SKU ${variant.name}`} dir="ltr" value={variant.sku} onChange={(event) => updateVariant(variant.id, { sku: event.target.value })} /></td><td><input aria-label={`باركود ${variant.name}`} dir="ltr" value={variant.barcode} onChange={(event) => updateVariant(variant.id, { barcode: event.target.value })} /></td></tr>)}</tbody></table></div>
                ) : <div className="bo-hint">أضف قيمة واحدة على الأقل لكل خيار حتى تتولد التركيبات.</div>}
              </div>
            )}
          </section>

          <section className="bo-form-card">
            <div className="bo-section-heading"><div><h2>الإضافات</h2><p>اربط مجموعات الإضافات التي تظهر مع هذا الصنف أثناء البيع.</p></div><button className="bo-link-button" type="button" onClick={() => openPage("modifiers")}>إدارة الإضافات</button></div>
            {modifierGroups.length === 0 ? <div className="bo-empty-panel"><strong>لا توجد مجموعات إضافات</strong><span>أنشئ مجموعة مثل إضافات القهوة ثم اربطها بالصنف.</span></div> : <div className="bo-check-list">{modifierGroups.map((modifier) => <label className="bo-check-row" key={modifier.id}><input type="checkbox" checked={(itemDraft.modifierGroupIds ?? []).includes(modifier.id)} onChange={() => toggleModifierForItem(modifier.id)} /><span><strong>{modifier.name}</strong><small>{modifier.options.map((option) => option.name).join("، ")}</small></span><em>{modifier.options.length} خيار</em></label>)}</div>}
          </section>
        </div>

        <aside className="bo-summary-column">
          <section className="bo-summary-card"><h3>ملخص الصنف</h3><div className="bo-summary-row"><span>السعر الأساسي</span><strong>{formatMoney(itemDraft.price.halalas)}</strong></div><div className="bo-summary-row"><span>المتغيرات</span><strong>{(itemDraft.variants ?? []).length}</strong></div><div className="bo-summary-row"><span>مجموعات الإضافات</span><strong>{(itemDraft.modifierGroupIds ?? []).length}</strong></div><div className="bo-summary-row"><span>الحالة</span><strong className={itemDraft.availableForSale ? "bo-green-text" : "bo-red-text"}>{itemDraft.availableForSale ? "متاح للبيع" : "غير متاح"}</strong></div></section>
          <section className="bo-summary-card bo-summary-note"><h3>هذه مرحلة اكتشاف المنتج</h3><p>المخزون والتكلفة والضرائب والصور وأسعار الفروع ستدخل عندما نبدأ أقسامها، ولن نفرض حقولها الآن على نموذج رفاد.</p></section>
        </aside>
      </div>
      {error ? <div className="bo-floating-alert" role="alert">{error}</div> : null}
    </form>
  );

  const renderCategories = () => (
    <>
      <div className="bo-page-header"><div><h1>الفئات</h1><p>تنظيم الأصناف في مجموعات واضحة للكاشير.</p></div><button className="bo-primary" type="button" onClick={startNewCategory}>+ إضافة فئة</button></div>
      {categoryEditorId ? <form className="bo-inline-editor bo-card" onSubmit={saveCategory}><div><label className="bo-field"><span>اسم الفئة</span><input aria-label="اسم الفئة" value={categoryName} onChange={(event) => setCategoryName(event.target.value)} autoFocus /></label></div><div className="bo-inline-actions"><button type="button" className="bo-secondary" onClick={() => setCategoryEditorId(null)}>إلغاء</button><button className="bo-primary" type="submit" disabled={saving}>{saving ? "جارٍ الحفظ…" : "حفظ"}</button></div></form> : null}
      {error ? <div className="bo-alert" role="alert">{error}</div> : null}
      <section className="bo-card bo-list-card"><div className="bo-table-headline"><strong>{categories.length} فئة</strong><span>يمكن تعديل الاسم الآن؛ اللون والترتيب نراجعهما لاحقًا.</span></div>{categories.map((category) => <button className="bo-management-row" type="button" key={category.id} onClick={() => startEditCategory(category)}><span className="bo-category-dot">{category.name.slice(0, 1)}</span><span><strong>{category.name}</strong><small>{items.filter((item) => item.categoryId === category.id).length} صنف</small></span><b>تعديل</b></button>)}</section>
    </>
  );

  const renderModifiers = () => (
    <>
      <div className="bo-page-header"><div><h1>الإضافات</h1><p>مجموعات خيارات يمكن ربطها بأكثر من صنف، مثل شوت إضافي أو حليب بديل.</p></div><button className="bo-primary" type="button" onClick={openNewModifier}>+ إضافة مجموعة</button></div>
      {error ? <div className="bo-alert" role="alert">{error}</div> : null}
      <section className="bo-card bo-list-card"><div className="bo-table-headline"><strong>{modifierGroups.length} مجموعة</strong><span>سعر الإضافة يُضاف إلى سعر الصنف عند اختيارها مستقبلًا في POS.</span></div>{modifierGroups.map((modifier) => <button className="bo-management-row" type="button" key={modifier.id} onClick={() => openModifier(modifier)}><span className="bo-modifier-icon">＋</span><span><strong>{modifier.name}</strong><small>{modifier.options.map((option) => `${option.name}${option.price.halalas ? ` (+${formatMoney(option.price.halalas)})` : ""}`).join(" · ")}</small></span><em>{modifier.options.length} خيار</em><b>تعديل</b></button>)}</section>
    </>
  );

  const renderModifierEditor = () => (
    <form className="bo-editor-page" onSubmit={saveModifier}>
      <div className="bo-editor-topbar"><div className="bo-editor-title"><button className="bo-back-button" type="button" onClick={() => setModifierEditorId(undefined)} aria-label="العودة إلى الإضافات">←</button><div><small>{selectedModifier ? "تعديل مجموعة إضافات" : "مجموعة جديدة"}</small><h1>{selectedModifier?.name || "إضافة مجموعة"}</h1></div></div><div className="bo-editor-actions"><button className="bo-secondary" type="button" onClick={() => setModifierEditorId(undefined)}>إلغاء</button><button className="bo-primary" type="submit" disabled={saving}>{saving ? "جارٍ الحفظ…" : "حفظ"}</button></div></div>
      <div className="bo-editor-layout bo-editor-layout--narrow"><div className="bo-editor-column"><section className="bo-form-card"><div className="bo-section-heading"><div><h2>مجموعة الإضافات</h2><p>أنشئ المجموعة مرة واحدة ثم اربطها بالأصناف المناسبة.</p></div></div><div className="bo-form-grid"><label className="bo-field bo-field--wide"><span>اسم المجموعة <b>*</b></span><input aria-label="اسم مجموعة الإضافات" value={modifierDraft.name} onChange={(event) => setModifierDraft({ ...modifierDraft, name: event.target.value })} placeholder="مثال: إضافات القهوة" autoFocus /></label></div></section><section className="bo-form-card"><div className="bo-section-heading"><div><h2>الخيارات</h2><p>كل خيار يمكن أن يكون مجانيًا أو بسعر إضافي.</p></div><button type="button" className="bo-link-button" onClick={addModifierOption}>+ إضافة خيار</button></div><div className="bo-modifier-options">{modifierDraft.options.map((option, index) => <div className="bo-modifier-option-row" key={option.id ?? index}><span className="bo-drag-handle" aria-hidden="true">⋮⋮</span><label className="bo-field"><span>اسم الإضافة</span><input aria-label={`اسم الإضافة ${index + 1}`} value={option.name} onChange={(event) => updateModifierOption(option.id, index, { name: event.target.value })} placeholder="مثال: شوت إضافي" /></label><label className="bo-field"><span>السعر الإضافي</span><div className="bo-money-input"><input aria-label={`سعر الإضافة ${index + 1}`} type="number" min="0" step="0.01" dir="ltr" value={(option.price.halalas / 100).toFixed(2)} onChange={(event) => updateModifierOption(option.id, index, { halalas: Math.max(0, Math.round(Number(event.target.value || 0) * 100)) })} /><span>ر.س</span></div></label><button type="button" className="bo-remove-circle" aria-label={`حذف الإضافة ${index + 1}`} disabled={modifierDraft.options.length === 1} onClick={() => setModifierDraft({ ...modifierDraft, options: modifierDraft.options.filter((_, optionIndex) => optionIndex !== index) })}>×</button></div>)}</div></section></div></div>
      {error ? <div className="bo-floating-alert" role="alert">{error}</div> : null}
    </form>
  );

  const editingItem = itemEditorId !== undefined;
  const editingModifier = page === "modifiers" && modifierEditorId !== undefined;

  return (
    <div className="bo-shell" dir="rtl">
      {renderSidebar()}
      <div className="bo-workspace">
        <header className="bo-topbar"><div className="bo-local-badge"><span></span>بيانات محلية للتقييم</div><div className="bo-topbar-actions"><button type="button" disabled>مساعدة</button><button type="button" disabled className="bo-user-button"><span className="bo-avatar bo-avatar--small">م</span>مدير المتجر</button></div></header>
        <main className="bo-main">
          {flash ? <div className="bo-toast" role="status">✓ {flash}</div> : null}
          {editingItem ? renderItemEditor() : editingModifier ? renderModifierEditor() : page === "categories" ? renderCategories() : page === "modifiers" ? renderModifiers() : renderItemsList()}
        </main>
      </div>
    </div>
  );
}
