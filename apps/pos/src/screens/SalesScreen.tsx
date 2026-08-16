import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "../components/Icon";
import { InlineNotice } from "../components/InlineNotice";
import { TicketPanel } from "../components/TicketPanel";
import { formatMoney } from "../domain/money";
import type { EmployeeSession, Product, SalePage, Ticket, TicketLine } from "../domain/models";

type SalesScreenMode = "touch" | "basic";
type OrderType = "dine-in" | "takeaway" | "delivery";

const SALE_SCREEN_MODE_KEY = "rifad.pos.sale-screen-mode.v1";
const ORDER_TYPES_KEY = "rifad.pos.visible-order-types.v1";

const ORDER_TYPE_OPTIONS: readonly { id: OrderType; label: string }[] = [
  { id: "dine-in", label: "محلي" },
  { id: "takeaway", label: "سفري" },
  { id: "delivery", label: "توصيل" },
];

const readSaleScreenMode = (): SalesScreenMode => {
  if (typeof window === "undefined") return "touch";
  try {
    return window.localStorage.getItem(SALE_SCREEN_MODE_KEY) === "basic" ? "basic" : "touch";
  } catch {
    return "touch";
  }
};

const readVisibleOrderTypes = (): readonly OrderType[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ORDER_TYPES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const valid = new Set<OrderType>(ORDER_TYPE_OPTIONS.map((option) => option.id));
    return parsed.filter((value): value is OrderType => valid.has(value));
  } catch {
    return [];
  }
};

type SalesScreenProps = {
  employee: EmployeeSession | null;
  ticket: Ticket;
  products: readonly Product[];
  allProducts: readonly Product[];
  salePages: readonly SalePage[];
  activePageId: string;
  query: string;
  busy: string | null;
  errorMessage: string | null;
  lastTouchedLineId: string | null;
  onDismissError: () => void;
  onQueryChange: (value: string) => void;
  onPageChange: (value: string) => void;
  onCreatePage: (name: string) => Promise<boolean>;
  onRenamePage: (pageId: string, name: string) => Promise<boolean>;
  onDeletePage: (pageId: string) => Promise<boolean>;
  onMovePage: (pageId: string, direction: "previous" | "next") => Promise<boolean>;
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
    employee, ticket, products, allProducts, salePages, activePageId,
    query, busy, errorMessage, lastTouchedLineId, onDismissError, onQueryChange,
    onPageChange, onCreatePage, onRenamePage, onDeletePage, onMovePage,
    onPlacePageProduct, onRemovePageProduct, onAddProduct, onSetQuantity,
    onRemoveLine, onSaveTicket, onCheckout,
  } = props;

  const [mobileTicketOpen, setMobileTicketOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [screenMode, setScreenMode] = useState<SalesScreenMode>(readSaleScreenMode);
  const [visibleOrderTypes, setVisibleOrderTypes] = useState<readonly OrderType[]>(readVisibleOrderTypes);
  const [selectedOrderType, setSelectedOrderType] = useState<OrderType | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [pickerSlot, setPickerSlot] = useState<number | null>(null);
  const [pageDialogOpen, setPageDialogOpen] = useState(false);
  const [pageName, setPageName] = useState("");
  const [pageMenu, setPageMenu] = useState<SalePage | null>(null);
  const [renamingPage, setRenamingPage] = useState<SalePage | null>(null);
  const [renameName, setRenameName] = useState("");
  const [editingLine, setEditingLine] = useState<TicketLine | null>(null);
  const [draftQuantity, setDraftQuantity] = useState(1);
  const pagePressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggered = useRef(false);

  useEffect(() => () => {
    if (pagePressTimer.current) clearTimeout(pagePressTimer.current);
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(SALE_SCREEN_MODE_KEY, screenMode);
    } catch {
      // Device preference persistence is best-effort in this UI prototype.
    }

    if (screenMode === "basic") {
      setEditMode(false);
      setSearchOpen(true);
    } else {
      setSearchOpen(false);
    }
  }, [screenMode]);

  useEffect(() => {
    try {
      window.localStorage.setItem(ORDER_TYPES_KEY, JSON.stringify(visibleOrderTypes));
    } catch {
      // Device preference persistence is best-effort in this UI prototype.
    }
    if (selectedOrderType && !visibleOrderTypes.includes(selectedOrderType)) {
      setSelectedOrderType(null);
    }
  }, [selectedOrderType, visibleOrderTypes]);

  useEffect(() => {
    setSelectedOrderType(null);
  }, [ticket.sequence]);

  const itemCount = ticket.lines.reduce((count, line) => count + line.quantity, 0);
  const activePage = salePages.find((page) => page.id === activePageId) ?? salePages[0];
  const productById = useMemo(() => new Map(allProducts.map((product) => [product.id, product])), [allProducts]);
  const filteredMode = query.trim().length > 0 || activePage?.isDefault;
  const isBasicMode = screenMode === "basic";
  const effectiveOrderType = visibleOrderTypes.length === 1 ? visibleOrderTypes[0] : selectedOrderType;
  const showTicketOrderType = !isBasicMode && itemCount > 0 && visibleOrderTypes.length > 0;
  const orderTypeRequired = showTicketOrderType && visibleOrderTypes.length > 1 && !effectiveOrderType;

  const openLineEditor = (line: TicketLine) => {
    setEditingLine(line);
    setDraftQuantity(line.quantity);
  };

  const selectPage = (page: SalePage) => {
    onPageChange(page.id);
    onQueryChange("");
    setSearchOpen(false);
  };

  const startPagePress = (page: SalePage) => {
    if (page.isDefault) return;
    longPressTriggered.current = false;
    pagePressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      onPageChange(page.id);
      setPageMenu(page);
    }, 520);
  };

  const cancelPagePress = () => {
    if (pagePressTimer.current) clearTimeout(pagePressTimer.current);
    pagePressTimer.current = null;
  };

  const openPageMenu = (page: SalePage) => {
    if (page.isDefault) return;
    cancelPagePress();
    longPressTriggered.current = true;
    onPageChange(page.id);
    setPageMenu(page);
  };

  const toggleVisibleOrderType = (orderType: OrderType) => {
    setVisibleOrderTypes((current) => current.includes(orderType)
      ? current.filter((value) => value !== orderType)
      : ORDER_TYPE_OPTIONS.map((option) => option.id).filter((value) => value === orderType || current.includes(value)));
  };

  const renderOrderTypeSelector = () => showTicketOrderType ? (
    <div className={`ticket-order-type ${orderTypeRequired ? "ticket-order-type--required" : ""}`} aria-label="نوع الطلب">
      <div className="ticket-order-type-head">
        <strong>نوع الطلب</strong>
        <small>{visibleOrderTypes.length === 1 ? "محدد تلقائيًا" : (orderTypeRequired ? "اختر للمتابعة" : "تم الاختيار")}</small>
      </div>
      <div className="order-type-options">
        {ORDER_TYPE_OPTIONS.filter((option) => visibleOrderTypes.includes(option.id)).map((option) => (
          <button
            type="button"
            key={option.id}
            className={effectiveOrderType === option.id ? "active" : ""}
            aria-pressed={effectiveOrderType === option.id}
            onClick={() => setSelectedOrderType(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  ) : null;

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
    <main className={`pos-workspace loyverse-shell sale-screen-${screenMode}`} data-screen-id={editMode ? "POS-SCREEN-026" : "POS-SCREEN-003"}>
      <section className="sales-catalog">
        <header className={`workspace-header ${editMode ? "workspace-header--editing" : ""}`}>
          {editMode ? (
            <>
              <button className="appbar-text-action done-editing" type="button" onClick={() => setEditMode(false)}>تم</button>
              <strong className="layout-title">تعديل · {activePage?.name ?? "صفحة البيع"}</strong>
              <div className="appbar-spacer" />
              {!activePage?.isDefault ? <button className="appbar-icon" type="button" onClick={() => activePage && setPageMenu(activePage)} aria-label="إعدادات الصفحة"><span className="kebab">⋮</span></button> : null}
            </>
          ) : (
            <>
              <button className="appbar-icon" type="button" onClick={() => setMenuOpen(true)} aria-label="فتح القائمة"><Icon name="menu" /></button>
              <strong className="current-page-title">{isBasicMode ? "شاشة أساسية" : (activePage?.name ?? "المبيعات")}</strong>
              <div className="appbar-spacer" />
              {isBasicMode || searchOpen ? (
                <label className={`catalog-search ${isBasicMode ? "catalog-search--always" : ""}`}>
                  <input autoFocus={isBasicMode || searchOpen} value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder={isBasicMode ? "امسح الباركود أو ابحث باسم الصنف / SKU" : "اسم المنتج أو SKU"} aria-label="البحث عن منتج" />
                  {!isBasicMode ? <button type="button" onClick={() => { setSearchOpen(false); onQueryChange(""); }} aria-label="إغلاق البحث">×</button> : null}
                </label>
              ) : <button className="appbar-icon" type="button" onClick={() => setSearchOpen(true)} aria-label="البحث"><Icon name="search" /></button>}
            </>
          )}
        </header>

        <InlineNotice message={errorMessage} onDismiss={onDismissError} />

        {isBasicMode ? (
          <div className="basic-sale-surface">
            {query.trim().length === 0 ? (
              <div className="basic-sale-empty">
                <Icon name="search" size={42} />
                <strong>جاهز للبحث أو الباركود</strong>
                <span>امسح الباركود مباشرة أو اكتب اسم الصنف أو SKU في خانة البحث.</span>
              </div>
            ) : (
              <div className="basic-product-results" aria-busy={busy === "catalog"}>
                {products.map((product) => (
                  <button type="button" className="basic-product-row" key={product.id} onClick={() => onAddProduct(product.id)} disabled={busy === `product:${product.id}`}>
                    <span className={`basic-product-swatch tone-${product.tone}`}>{product.abbreviation}</span>
                    <strong>{product.name}</strong>
                    <small dir="ltr">{formatMoney(product.price)}</small>
                    <Icon name="plus" size={20} />
                  </button>
                ))}
                {busy !== "catalog" && products.length === 0 ? <div className="basic-no-results"><strong>لا توجد نتائج</strong><span>تحقق من الباركود أو جرّب اسمًا آخر.</span></div> : null}
              </div>
            )}
          </div>
        ) : (
          <>
            <div className={`product-area ${editMode ? "product-area--editing" : ""}`}>
              <div className="product-grid" aria-busy={busy === "catalog" || busy === "sale-layout"}>
                {gridContent}
                {busy !== "catalog" && filteredMode && products.length === 0 ? <div className="empty-products"><Icon name="search" size={28} /><strong>لا توجد نتائج</strong><span>جرّب عبارة بحث أخرى.</span></div> : null}
              </div>
            </div>

            <nav className={`sale-page-tabs ${editMode ? "sale-page-tabs--editing" : ""}`} aria-label="صفحات البيع">
              {salePages.filter((page) => !page.isDefault).map((page) => (
                <button
                  type="button"
                  key={page.id}
                  className={activePageId === page.id ? "active" : ""}
                  title="اضغط مطولًا لإعدادات الصفحة"
                  onPointerDown={() => startPagePress(page)}
                  onPointerUp={cancelPagePress}
                  onPointerLeave={cancelPagePress}
                  onPointerCancel={cancelPagePress}
                  onContextMenu={(event) => { event.preventDefault(); openPageMenu(page); }}
                  onClick={() => {
                    if (longPressTriggered.current) { longPressTriggered.current = false; return; }
                    selectPage(page);
                  }}
                >
                  {page.name}
                </button>
              ))}
              {salePages.filter((page) => page.isDefault).map((page) => <button type="button" key={page.id} className={`grid-page ${activePageId === page.id ? "active" : ""}`} onClick={() => selectPage(page)} aria-label="كافة العناصر"><Icon name="grid" size={24} /></button>)}
              <button type="button" className="add-sale-page" onClick={() => setPageDialogOpen(true)} aria-label="إضافة صفحة بيع"><Icon name="plus" size={22} /></button>
            </nav>
          </>
        )}

        <button className="mobile-checkout primary-button" type="button" disabled={itemCount === 0} onClick={() => setMobileTicketOpen(true)} aria-expanded={mobileTicketOpen}>عرض التذكرة · {formatMoney(ticket.total)}</button>
      </section>

      <div className="ticket-column">
        <TicketPanel ticket={ticket} editable lastTouchedLineId={lastTouchedLineId} onEditLine={openLineEditor} />
        {renderOrderTypeSelector()}
        <div className="ticket-actions"><button type="button" onClick={onSaveTicket} disabled={itemCount === 0 || orderTypeRequired || busy === "save-ticket"}>حفظ</button><button type="button" onClick={onCheckout} disabled={itemCount === 0 || orderTypeRequired || busy === "checkout"}>دفع</button></div>
      </div>

      {mobileTicketOpen ? <section className="mobile-ticket-surface" aria-label="التذكرة الحالية على الهاتف"><button className="mobile-ticket-close" type="button" onClick={() => setMobileTicketOpen(false)}><Icon name="arrow" size={19} /> العودة إلى المنتجات</button><TicketPanel ticket={ticket} editable lastTouchedLineId={lastTouchedLineId} onEditLine={openLineEditor} />{renderOrderTypeSelector()}<div className="ticket-actions"><button type="button" onClick={onSaveTicket} disabled={itemCount === 0 || orderTypeRequired || busy === "save-ticket"}>حفظ</button><button type="button" onClick={onCheckout} disabled={itemCount === 0 || orderTypeRequired || busy === "checkout"}>دفع</button></div></section> : null}

      {menuOpen ? <div className="pos-drawer-backdrop" role="presentation" onClick={() => setMenuOpen(false)}><aside className="pos-drawer" aria-label="قائمة نقطة البيع" onClick={(event) => event.stopPropagation()}><header><strong>{employee?.employeeName ?? "موظف رفاد"}</strong><span>{employee?.roleName ?? "أمين صندوق"}</span></header><button type="button" className="active"><Icon name="receipt" />المبيعات</button><button type="button" disabled>الإيصالات</button><button type="button" disabled>الوردية</button><button type="button" disabled>العناصر</button><button type="button" onClick={() => { setMenuOpen(false); setSettingsOpen(true); }}><Icon name="settings" />الإعدادات</button></aside></div> : null}

      {settingsOpen ? <div className="dialog-backdrop" role="presentation" onClick={() => setSettingsOpen(false)}><section className="layout-dialog pos-device-settings" role="dialog" aria-modal="true" aria-labelledby="pos-settings-title" onClick={(event) => event.stopPropagation()}><header><button type="button" onClick={() => setSettingsOpen(false)} aria-label="إغلاق">×</button><h2 id="pos-settings-title">إعدادات نقطة البيع</h2></header><div className="device-settings-section"><div className="device-settings-copy"><strong>نمط شاشة البيع</strong><span>هذا الإعداد خاص بهذا الجهاز ويمكن أن يختلف بين أجهزة نفس المنشأة.</span></div><div className="screen-mode-options"><button type="button" className={screenMode === "touch" ? "active" : ""} onClick={() => { setScreenMode("touch"); onQueryChange(""); }}><span className="screen-mode-icon"><Icon name="grid" size={24} /></span><strong>شاشة لمس</strong><small>شبكة أصناف وصفحات سريعة للمس.</small></button><button type="button" className={screenMode === "basic" ? "active" : ""} onClick={() => { setScreenMode("basic"); onQueryChange(""); }}><span className="screen-mode-icon"><Icon name="search" size={24} /></span><strong>شاشة أساسية</strong><small>بحث وباركود أولًا للبيع بالتجزئة.</small></button></div></div><div className="device-settings-section device-settings-section--order-types"><div className="device-settings-copy"><strong>أنواع الطلب في شاشة اللمس</strong><span>اختر الأنواع التي تريد إظهارها للكاشير. إذا فعّلت أكثر من نوع يجب اختيار أحدها بعد إضافة أول صنف. إذا فعّلت نوعًا واحدًا يُحدد تلقائيًا. اتركها كلها غير مفعلة لإخفاء الخيار.</span></div><div className="order-type-settings">{ORDER_TYPE_OPTIONS.map((option) => { const enabled = visibleOrderTypes.includes(option.id); return <button type="button" key={option.id} className={enabled ? "active" : ""} aria-pressed={enabled} onClick={() => toggleVisibleOrderType(option.id)}><span>{enabled ? <Icon name="check" size={18} /> : null}</span><strong>{option.label}</strong></button>; })}</div></div><button className="primary-button settings-done" type="button" onClick={() => setSettingsOpen(false)}>تم</button></section></div> : null}

      {pageMenu ? <div className="dialog-backdrop page-menu-backdrop" role="presentation" onClick={() => setPageMenu(null)}><section className="page-action-menu" role="dialog" aria-modal="true" aria-label={`إعدادات صفحة ${pageMenu.name}`} onClick={(event) => event.stopPropagation()}><header><strong>{pageMenu.name}</strong><button type="button" onClick={() => setPageMenu(null)} aria-label="إغلاق">×</button></header><button type="button" onClick={() => { setEditMode(true); setPageMenu(null); }}><Icon name="grid" size={19} />تعديل محتوى الصفحة</button><button type="button" onClick={() => { setRenameName(pageMenu.name); setRenamingPage(pageMenu); setPageMenu(null); }}><span className="page-action-glyph">✎</span>إعادة تسمية</button><button type="button" onClick={() => void onMovePage(pageMenu.id, "previous")}><span className="page-action-glyph">→</span>التحريك إلى اليمين</button><button type="button" onClick={() => void onMovePage(pageMenu.id, "next")}><span className="page-action-glyph">←</span>التحريك إلى اليسار</button><button type="button" className="danger-action" onClick={async () => { if (await onDeletePage(pageMenu.id)) setPageMenu(null); }}><Icon name="trash" size={18} />حذف الصفحة</button></section></div> : null}

      {pickerSlot !== null && activePage ? <div className="dialog-backdrop" role="presentation"><section className="layout-dialog product-picker" role="dialog" aria-modal="true" aria-labelledby="product-picker-title"><header><button type="button" onClick={() => setPickerSlot(null)} aria-label="إغلاق">×</button><h2 id="product-picker-title">إضافة منتج إلى الصفحة</h2></header><div className="picker-tabs"><button type="button" className="active">العناصر</button><button type="button" disabled>التصنيفات</button><button type="button" disabled>الخصومات</button></div><div className="picker-list">{allProducts.map((product) => <button type="button" key={product.id} onClick={() => { onPlacePageProduct(activePage.id, pickerSlot, product.id); setPickerSlot(null); }}><span className={`picker-swatch tone-${product.tone}`}>{product.abbreviation}</span><strong>{product.name}</strong><small dir="ltr">{formatMoney(product.price)}</small></button>)}</div></section></div> : null}

      {pageDialogOpen ? <div className="dialog-backdrop" role="presentation"><form className="layout-dialog page-name-dialog" onSubmit={async (event) => { event.preventDefault(); if (await onCreatePage(pageName)) { setPageDialogOpen(false); setPageName(""); setEditMode(true); } }}><header><button type="button" onClick={() => setPageDialogOpen(false)} aria-label="إغلاق">×</button><h2>إضافة صفحة بيع</h2></header><label><span>اسم الصفحة</span><input autoFocus value={pageName} onChange={(event) => setPageName(event.target.value)} placeholder="مثال: المشاوي" required /></label><button className="primary-button" type="submit" disabled={busy === "sale-layout"}>إنشاء الصفحة</button></form></div> : null}

      {renamingPage ? <div className="dialog-backdrop" role="presentation"><form className="layout-dialog page-name-dialog" onSubmit={async (event) => { event.preventDefault(); if (await onRenamePage(renamingPage.id, renameName)) { setRenamingPage(null); setRenameName(""); } }}><header><button type="button" onClick={() => setRenamingPage(null)} aria-label="إغلاق">×</button><h2>إعادة تسمية الصفحة</h2></header><label><span>اسم الصفحة</span><input autoFocus value={renameName} onChange={(event) => setRenameName(event.target.value)} required /></label><button className="primary-button" type="submit" disabled={busy === "sale-layout"}>حفظ الاسم</button></form></div> : null}

      {editingLine ? <div className="dialog-backdrop" role="presentation"><section className="layout-dialog line-editor" role="dialog" aria-modal="true" aria-labelledby="line-editor-title"><header><button type="button" onClick={() => setEditingLine(null)} aria-label="إغلاق">×</button><h2 id="line-editor-title">{editingLine.name} · {formatMoney(editingLine.unitPrice)}</h2></header><label>الكمية</label><div className="line-quantity-editor"><button type="button" aria-label="تقليل الكمية" onClick={() => setDraftQuantity((value) => Math.max(1, value - 1))}><Icon name="minus" /></button><strong>{draftQuantity}</strong><button type="button" aria-label="زيادة الكمية" onClick={() => setDraftQuantity((value) => value + 1)}><Icon name="plus" /></button></div><div className="line-editor-actions"><button type="button" className="delete-line" onClick={() => { onRemoveLine(editingLine.id); setEditingLine(null); }}><Icon name="trash" size={18} />حذف</button><button type="button" className="primary-button" onClick={() => { onSetQuantity(editingLine.id, draftQuantity); setEditingLine(null); }}>حفظ</button></div></section></div> : null}
    </main>
  );
}
