import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  CatalogContractError,
  type CatalogAdminContract,
  type CatalogCategory,
  type CatalogItem,
  type CatalogItemDraft,
} from "../../../contracts/catalog";
import { createBrowserCatalogAdmin } from "../../../adapters/catalog/browserCatalog";

const commandId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;

const EMPTY_DRAFT: CatalogItemDraft = {
  name: "",
  description: "",
  categoryId: null,
  price: { halalas: 0, currency: "SAR" },
  sku: "",
  barcode: "",
  availableForSale: true,
};

const toDraft = (item: CatalogItem): CatalogItemDraft => ({
  name: item.name,
  description: item.description,
  categoryId: item.categoryId,
  price: item.price,
  sku: item.sku,
  barcode: item.barcode,
  availableForSale: item.availableForSale,
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

export default function App({ catalog = createBrowserCatalogAdmin() }: { catalog?: CatalogAdminContract }) {
  const [items, setItems] = useState<readonly CatalogItem[]>([]);
  const [categories, setCategories] = useState<readonly CatalogCategory[]>([]);
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [editorItemId, setEditorItemId] = useState<string | null | undefined>(undefined);
  const [draft, setDraft] = useState<CatalogItemDraft>(EMPTY_DRAFT);
  const [priceText, setPriceText] = useState("0.00");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextCategories, nextItems] = await Promise.all([
        catalog.listCategories(),
        catalog.listItems({
          query,
          categoryId: categoryId === "all" ? null : categoryId,
          includeUnavailable: true,
        }),
      ]);
      setCategories(nextCategories);
      setItems(nextItems);
    } catch (loadError) {
      setError(messageFrom(loadError));
    } finally {
      setLoading(false);
    }
  }, [catalog, categoryId, query]);

  useEffect(() => { void load(); }, [load]);

  const selectedItem = useMemo(
    () => editorItemId ? items.find((item) => item.id === editorItemId) ?? null : null,
    [editorItemId, items],
  );

  const openNew = () => {
    setEditorItemId(null);
    setDraft(EMPTY_DRAFT);
    setPriceText("0.00");
    setError(null);
  };

  const openEdit = (item: CatalogItem) => {
    setEditorItemId(item.id);
    setDraft(toDraft(item));
    setPriceText(halalasToInput(item.price.halalas));
    setError(null);
  };

  const closeEditor = () => {
    setEditorItemId(undefined);
    setError(null);
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    const halalas = parsePriceInput(priceText);
    if (halalas === null) {
      setError("أدخل السعر بصيغة صحيحة مثل 12.50");
      return;
    }

    setSaving(true);
    setError(null);
    const normalizedDraft: CatalogItemDraft = {
      ...draft,
      price: { halalas, currency: "SAR" },
    };
    try {
      if (editorItemId) {
        await catalog.updateItem({ commandId: commandId("catalog-update"), itemId: editorItemId, item: normalizedDraft });
      } else {
        await catalog.createItem({ commandId: commandId("catalog-create"), item: normalizedDraft });
      }
      setEditorItemId(undefined);
      await load();
    } catch (saveError) {
      setError(messageFrom(saveError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bo-shell" dir="rtl">
      <aside className="bo-sidebar" aria-label="تنقل المكتب الخلفي">
        <div className="bo-brand">
          <div className="bo-brand-mark">ر</div>
          <div>
            <strong>رفاد</strong>
            <span>المكتب الخلفي</span>
          </div>
        </div>
        <nav>
          <button className="bo-nav-item bo-nav-item--active" type="button" aria-current="page">
            <span aria-hidden="true">▦</span>
            الأصناف
          </button>
        </nav>
        <div className="bo-sidebar-note">هذه الجولة مخصصة للكتالوج فقط. بقية الوحدات ستظهر بعد اعتماد تدفقاتها.</div>
      </aside>

      <main className="bo-main">
        <header className="bo-header">
          <div>
            <p className="bo-eyebrow">الكتالوج</p>
            <h1>الأصناف</h1>
            <p>أضف الصنف أو عدّل بيانات بيعه الأساسية. نفس هوية الصنف ستستخدمها شاشة البيع.</p>
          </div>
          <button className="bo-primary" type="button" onClick={openNew}>+ إضافة صنف</button>
        </header>

        <section className="bo-toolbar" aria-label="أدوات قائمة الأصناف">
          <label className="bo-search">
            <span>بحث</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="الاسم أو SKU أو الباركود"
              aria-label="بحث في الأصناف"
            />
          </label>
          <label className="bo-filter">
            <span>الفئة</span>
            <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} aria-label="تصفية حسب الفئة">
              <option value="all">كل الفئات</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </label>
        </section>

        {error && editorItemId === undefined ? <div className="bo-alert" role="alert">{error}</div> : null}

        <section className="bo-card bo-table-card" aria-busy={loading}>
          <div className="bo-table-headline">
            <strong>{loading ? "جاري التحميل…" : `${items.length} صنف`}</strong>
            <span>السعر المعروض هو سعر البيع الأساسي</span>
          </div>
          <div className="bo-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>الصنف</th>
                  <th>الفئة</th>
                  <th>SKU</th>
                  <th>الباركود</th>
                  <th>السعر</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {!loading && items.length === 0 ? (
                  <tr><td colSpan={6} className="bo-empty">لا توجد أصناف مطابقة.</td></tr>
                ) : items.map((item) => (
                  <tr key={item.id} onClick={() => openEdit(item)} tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter") openEdit(item); }}>
                    <td>
                      <strong>{item.name}</strong>
                      {item.description ? <span className="bo-muted-line">{item.description}</span> : null}
                    </td>
                    <td>{item.categoryName ?? "بدون فئة"}</td>
                    <td dir="ltr">{item.sku || "—"}</td>
                    <td dir="ltr">{item.barcode || "—"}</td>
                    <td className="bo-price">{formatMoney(item.price.halalas)}</td>
                    <td><span className={item.availableForSale ? "bo-status bo-status--on" : "bo-status bo-status--off"}>{item.availableForSale ? "متاح للبيع" : "غير متاح"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {editorItemId !== undefined ? (
        <div className="bo-editor-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target && !saving) closeEditor(); }}>
          <aside className="bo-editor" role="dialog" aria-modal="true" aria-labelledby="bo-editor-title">
            <form onSubmit={save}>
              <div className="bo-editor-header">
                <div>
                  <p className="bo-eyebrow">{selectedItem ? "تعديل" : "جديد"}</p>
                  <h2 id="bo-editor-title">{selectedItem?.name || "إضافة صنف"}</h2>
                </div>
                <button type="button" className="bo-icon-button" onClick={closeEditor} disabled={saving} aria-label="إغلاق">×</button>
              </div>

              <div className="bo-form-grid">
                <label className="bo-field bo-field--wide">
                  <span>اسم الصنف <b>*</b></span>
                  <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} autoFocus />
                </label>
                <label className="bo-field bo-field--wide">
                  <span>الوصف</span>
                  <textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} rows={3} />
                </label>
                <label className="bo-field">
                  <span>الفئة</span>
                  <select aria-label="فئة الصنف" value={draft.categoryId ?? ""} onChange={(event) => setDraft({ ...draft, categoryId: event.target.value || null })}>
                    <option value="">بدون فئة</option>
                    {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                  </select>
                </label>
                <label className="bo-field">
                  <span>السعر الأساسي <b>*</b></span>
                  <div className="bo-money-input"><input aria-label="السعر الأساسي" inputMode="decimal" dir="ltr" value={priceText} onChange={(event) => setPriceText(event.target.value)} /><span>ر.س</span></div>
                </label>
                <label className="bo-field">
                  <span>SKU</span>
                  <input dir="ltr" value={draft.sku} onChange={(event) => setDraft({ ...draft, sku: event.target.value })} maxLength={40} />
                </label>
                <label className="bo-field">
                  <span>الباركود</span>
                  <input dir="ltr" value={draft.barcode} onChange={(event) => setDraft({ ...draft, barcode: event.target.value })} inputMode="numeric" />
                </label>
                <label className="bo-toggle bo-field--wide">
                  <input aria-label="متاح للبيع" type="checkbox" checked={draft.availableForSale} onChange={(event) => setDraft({ ...draft, availableForSale: event.target.checked })} />
                  <span><strong>متاح للبيع</strong><small>عند إيقافه يبقى الصنف في المكتب الخلفي ولا يظهر في كتالوج البيع.</small></span>
                </label>
              </div>

              {error ? <div className="bo-alert" role="alert">{error}</div> : null}

              <div className="bo-editor-footer">
                <button type="button" className="bo-secondary" onClick={closeEditor} disabled={saving}>إلغاء</button>
                <button type="submit" className="bo-primary" disabled={saving}>{saving ? "جارٍ الحفظ…" : "حفظ"}</button>
              </div>
            </form>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
