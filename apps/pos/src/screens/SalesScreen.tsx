import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "../components/Icon";
import { InlineNotice } from "../components/InlineNotice";
import { TicketPanel } from "../components/TicketPanel";
import { formatMoney } from "../domain/money";
import type { EmployeeSession, Product, SalePage, Ticket, TicketLine } from "../domain/models";

type SalesScreenProps = {
  employee: EmployeeSession | null;
  ticket: Ticket;
  products: readonly Product[];
  allProducts: readonly Product[];
  salePages: readonly SalePage[];
  activePageId: string;
  categories: readonly { id: string; name: string }[];
  query: string;
  categoryId: string;
  busy: string | null;
  errorMessage: string | null;
  onDismissError: () => void;
  onQueryChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onPageChange: (value: string) => void;
  onCreatePage: (name: string) => Promise<boolean>;
  onPlacePageProduct: (pageId: string, slotIndex: number, productId: string) => void;
  onRemovePageProduct: (pageId: string, slotIndex: number) => void;
  onAddProduct: (productId: string) => void;
  onSetQuantity: (lineId: string, quantity: number) => void;
  onRemoveLine: (lineId: string) => void;
  onSaveTicket: () => void;
  onCheckout: () => void;
};

export function SalesScreen(props: SalesScreenProps) {
  const {
    employee, ticket, products, allProducts, salePages, activePageId, categories,
    query, categoryId, busy, errorMessage, onDismissError, onQueryChange,
    onCategoryChange, onPageChange, onCreatePage, onPlacePageProduct,
    onRemovePageProduct, onAddProduct, onSetQuantity, onRemoveLine,
    onSaveTicket, onCheckout,
  } = props;
  const [mobileTicketOpen, setMobileTicketOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [pickerSlot, setPickerSlot] = useState<number | null>(null);
  const [pageDialogOpen, setPageDialogOpen] = useState(false);
  const [pageName, setPageName] = useState("");
  const [editingLine, setEditingLine] = useState<TicketLine | null>(null);
  const [draftQuantity, setDraftQuantity] = useState(1);
  const pagePressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggered = useRef(false);

  useEffect(() => () => {
    if (pagePressTimer.current) clearTimeout(pagePressTimer.current);
  }, []);

  const itemCount = ticket.lines.reduce((count, line) => count + line.quantity, 0);
  const activePage = salePages.find((page) => page.id === activePageId) ?? salePages[0];
  const productById = useMemo(() => new Map(allProducts.map((product) => [product.id, product])), [allProducts]);
  const filteredMode = query.trim().length > 0 || categoryId !== "all" || activePage?.isDefault;

  const openLineEditor = (line: TicketLine) => {
    setEditingLine(line);
    setDraftQuantity(line.quantity);
  };

  const selectPage = (page: SalePage) => {
    onPageChange(page.id);
    onQueryChange("");
    onCategoryChange("all");
    setSearchOpen(false);
    setEditMode(false);
  };

  const chooseCategory = (category: string) => {
    onCategoryChange(category);
    const defaultPage = salePages.find((page) => page.isDefault);
    if (defaultPage) onPageChange(defaultPage.id);
  };

  const startPagePress = (page: SalePage) => {
    if (page.isDefault) return;
    longPressTriggered.current = false;
    pagePressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      onPageChange(page.id);
      setEditMode(true);
    }, 550);
  };

  const cancelPagePress = () => {
    if (pagePressTimer.current) clearTimeout(pagePressTimer.current);
    pagePressTimer.current = null;
  };

  const renderProduct = (product: Product, slotIndex?: number) => {
    if (editMode && slotIndex !== undefined) {
      return (
        <div className="catalog-cell catalog-cell--editing" key={`${product.id}-${slotIndex}`}>
          <span className={`catalog-product tone-${product.tone}`}><strong>{product.name}</strong></span>
          <button type="button" className="remove-layout-item" onClick={() => activePage && onRemovePageProduct(activePage.id, slotIndex)} aria-label={`إزالة ${product.name} من الصفحة`}>×</button>
        </div>
      );
    }
    return (
      <button type="button" className={`catalog-cell catalog-product tone-${product.tone}`} key={`${product.id}-${slotIndex ?? "catalog"}`} onClick={() => onAddProduct(product.id)} disabled={busy === `product:${product.id}`} aria-label={`${product.name}، ${formatMoney(product.price)}`}>
        <strong>{product.name}</strong>
      </button>
    );
  };

  const gridContent = filteredMode
    ? products.map((product) => renderProduct(product))
    : activePage?.productSlots.map((productId, slotIndex) => {
        const product = productId ? productById.get(productId) : null;
        if (product) return renderProduct(product, slotIndex);
        return editMode ? (
          <button type="button" className="catalog-cell empty-layout-slot" key={`slot-${slotIndex}`} onClick={() => setPickerSlot(slotIndex)} aria-label={`إضافة منتج إلى الخانة ${slotIndex + 1}`}><Icon name="plus" size={27} /></button>
        ) : <span className="catalog-cell blank-layout-slot" key={`slot-${slotIndex}`} />;
      });

  return (
    <main className="pos-workspace loyverse-shell" data-screen-id={editMode ? "POS-SCREEN-026" : "POS-SCREEN-003"}>
      <section className="sales-catalog">
        <header className={`workspace-header ${editMode ? "workspace-header--editing" : ""}`}>
          {editMode ? (
            <><button className="appbar-text-action" type="button" onClick={() => setEditMode(false)}>تم</button><strong className="layout-title">ترتيب صفحة {activePage?.name}</strong></>
          ) : (
            <>
              <button className="appbar-icon" type="button" onClick={() => setMenuOpen(true)} aria-label="فتح القائمة"><Icon name="menu" /></button>
              <label className="category-select">
                <select value={categoryId} onChange={(event) => chooseCategory(event.target.value)} aria-label="تصفية حسب التصنيف">
                  <option value="all">كافة العناصر</option>
                  {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
                <Icon name="chevron" size={17} />
              </label>
              <div className="appbar-spacer" />
              {searchOpen ? (
                <label className="catalog-search"><input autoFocus value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="اسم المنتج أو SKU" aria-label="البحث عن منتج" /><button type="button" onClick={() => { setSearchOpen(false); onQueryChange(""); }} aria-label="إغلاق البحث">×</button></label>
              ) : <button className="appbar-icon" type="button" onClick={() => { setSearchOpen(true); chooseCategory("all"); }} aria-label="البحث"><Icon name="search" /></button>}
            </>
          )}
        </header>

        <InlineNotice message={errorMessage} onDismiss={onDismissError} />

        <div className={`product-area ${editMode ? "product-area--editing" : ""}`}>
          <div className="product-grid" aria-busy={busy === "catalog" || busy === "sale-layout"}>
            {gridContent}
            {busy !== "catalog" && filteredMode && products.length === 0 ? <div className="empty-products"><Icon name="search" size={28} /><strong>لا توجد نتائج</strong><span>جرّب عبارة بحث أو تصنيفًا آخر.</span></div> : null}
          </div>
        </div>

        <nav className="sale-page-tabs" aria-label="صفحات البيع">
          {salePages.filter((page) => !page.isDefault).map((page) => <button type="button" key={page.id} className={activePageId === page.id ? "active" : ""} title="اضغط مطولًا لترتيب الصفحة" onPointerDown={() => startPagePress(page)} onPointerUp={cancelPagePress} onPointerLeave={cancelPagePress} onContextMenu={(event) => { event.preventDefault(); onPageChange(page.id); setEditMode(true); }} onClick={() => { if (longPressTriggered.current) { longPressTriggered.current = false; return; } selectPage(page); }}>{page.name}</button>)}
          {salePages.filter((page) => page.isDefault).map((page) => <button type="button" key={page.id} className={`grid-page ${activePageId === page.id ? "active" : ""}`} onClick={() => selectPage(page)} aria-label="كافة العناصر"><Icon name="grid" size={24} /></button>)}
          <button type="button" className="add-sale-page" onClick={() => setPageDialogOpen(true)} aria-label="إضافة صفحة بيع"><Icon name="plus" size={22} /></button>
        </nav>

        <button className="mobile-checkout primary-button" type="button" disabled={itemCount === 0} onClick={() => setMobileTicketOpen(true)} aria-expanded={mobileTicketOpen}>عرض التذكرة · {formatMoney(ticket.total)}</button>
      </section>

      <div className="ticket-column">
        <TicketPanel ticket={ticket} editable onEditLine={openLineEditor} />
        <div className="ticket-actions"><button type="button" onClick={onSaveTicket} disabled={itemCount === 0 || busy === "save-ticket"}>حفظ</button><button type="button" onClick={onCheckout} disabled={itemCount === 0 || busy === "checkout"}>السداد</button></div>
      </div>

      {mobileTicketOpen ? <section className="mobile-ticket-surface" aria-label="التذكرة الحالية على الهاتف"><button className="mobile-ticket-close" type="button" onClick={() => setMobileTicketOpen(false)}><Icon name="arrow" size={19} /> العودة إلى المنتجات</button><TicketPanel ticket={ticket} editable onEditLine={openLineEditor} /><div className="ticket-actions"><button type="button" onClick={onSaveTicket} disabled={itemCount === 0 || busy === "save-ticket"}>حفظ</button><button type="button" onClick={onCheckout} disabled={itemCount === 0 || busy === "checkout"}>السداد</button></div></section> : null}

      {menuOpen ? <div className="pos-drawer-backdrop" role="presentation" onClick={() => setMenuOpen(false)}><aside className="pos-drawer" aria-label="قائمة نقطة البيع" onClick={(event) => event.stopPropagation()}><header><strong>{employee?.employeeName ?? "موظف رفاد"}</strong><span>{employee?.roleName ?? "أمين صندوق"}</span></header><button type="button" className="active"><Icon name="receipt" />المبيعات</button><button type="button" disabled>الإيصالات</button><button type="button" disabled>الوردية</button><button type="button" disabled>العناصر</button><button type="button" disabled>الإعدادات</button></aside></div> : null}

      {pickerSlot !== null && activePage ? <div className="dialog-backdrop" role="presentation"><section className="layout-dialog product-picker" role="dialog" aria-modal="true" aria-labelledby="product-picker-title"><header><button type="button" onClick={() => setPickerSlot(null)} aria-label="إغلاق">×</button><h2 id="product-picker-title">إضافة منتج إلى الصفحة</h2></header><div className="picker-tabs"><button type="button" className="active">العناصر</button><button type="button" disabled>التصنيفات</button><button type="button" disabled>الخصومات</button></div><div className="picker-list">{allProducts.map((product) => <button type="button" key={product.id} onClick={() => { onPlacePageProduct(activePage.id, pickerSlot, product.id); setPickerSlot(null); }}><span className={`picker-swatch tone-${product.tone}`}>{product.abbreviation}</span><strong>{product.name}</strong><small>{formatMoney(product.price)}</small></button>)}</div></section></div> : null}

      {pageDialogOpen ? <div className="dialog-backdrop" role="presentation"><form className="layout-dialog page-name-dialog" onSubmit={async (event) => { event.preventDefault(); if (await onCreatePage(pageName)) { setPageDialogOpen(false); setPageName(""); setEditMode(true); } }}><header><button type="button" onClick={() => setPageDialogOpen(false)} aria-label="إغلاق">×</button><h2>إضافة صفحة بيع</h2></header><label><span>اسم الصفحة</span><input autoFocus value={pageName} onChange={(event) => setPageName(event.target.value)} placeholder="مثال: المشاوي" required /></label><button className="primary-button" type="submit" disabled={busy === "sale-layout"}>إنشاء الصفحة</button></form></div> : null}

      {editingLine ? <div className="dialog-backdrop" role="presentation"><section className="layout-dialog line-editor" role="dialog" aria-modal="true" aria-labelledby="line-editor-title"><header><button type="button" onClick={() => setEditingLine(null)} aria-label="إغلاق">×</button><h2 id="line-editor-title">{editingLine.name} · {formatMoney(editingLine.unitPrice)}</h2></header><label>الكمية</label><div className="line-quantity-editor"><button type="button" aria-label="تقليل الكمية" onClick={() => setDraftQuantity((value) => Math.max(1, value - 1))}><Icon name="minus" /></button><strong>{draftQuantity}</strong><button type="button" aria-label="زيادة الكمية" onClick={() => setDraftQuantity((value) => value + 1)}><Icon name="plus" /></button></div><div className="line-editor-actions"><button type="button" className="delete-line" onClick={() => { onRemoveLine(editingLine.id); setEditingLine(null); }}><Icon name="trash" size={18} />حذف</button><button type="button" className="primary-button" onClick={() => { onSetQuantity(editingLine.id, draftQuantity); setEditingLine(null); }}>حفظ</button></div></section></div> : null}
    </main>
  );
}
