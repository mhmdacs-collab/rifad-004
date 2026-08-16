import { useState } from "react";
import { Brand } from "../components/Brand";
import { Icon } from "../components/Icon";
import { InlineNotice } from "../components/InlineNotice";
import { TicketPanel } from "../components/TicketPanel";
import { formatMoney } from "../domain/money";
import type { EmployeeSession, Product, Ticket } from "../domain/models";

type SalesScreenProps = {
  employee: EmployeeSession | null;
  ticket: Ticket;
  products: readonly Product[];
  categories: readonly { id: string; name: string }[];
  query: string;
  categoryId: string;
  busy: string | null;
  errorMessage: string | null;
  onDismissError: () => void;
  onQueryChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onAddProduct: (productId: string) => void;
  onSetQuantity: (lineId: string, quantity: number) => void;
  onRemoveLine: (lineId: string) => void;
  onCheckout: () => void;
};

export function SalesScreen(props: SalesScreenProps) {
  const [mobileTicketOpen, setMobileTicketOpen] = useState(false);
  const {
    employee, ticket, products, categories, query, categoryId, busy, errorMessage,
    onDismissError, onQueryChange, onCategoryChange, onAddProduct,
    onSetQuantity, onRemoveLine, onCheckout,
  } = props;
  const itemCount = ticket.lines.reduce((count, line) => count + line.quantity, 0);

  return (
    <main className="pos-workspace" data-screen-id="POS-SCREEN-003">
      <section className="sales-catalog">
        <header className="workspace-header">
          <Brand compact />
          <div className="branch-copy">
            <strong>رفاد — فرع الرياض</strong>
            <span><i /> نقطة البيع متصلة محليًا</span>
          </div>
          <label className="catalog-search">
            <Icon name="search" size={20} />
            <input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="ابحث عن منتج"
              aria-label="البحث عن منتج"
            />
          </label>
          <div className="employee-chip">
            <span><Icon name="user" size={18} /></span>
            <div><strong>{employee?.employeeName ?? "الموظف"}</strong><small>{employee?.roleName ?? "كاشير"}</small></div>
          </div>
        </header>

        <nav className="category-tabs" aria-label="تصنيفات المنتجات">
          <button type="button" className={categoryId === "all" ? "active" : ""} onClick={() => onCategoryChange("all")}>
            <Icon name="grid" size={18} /> الكل
          </button>
          {categories.map((category) => (
            <button
              type="button"
              key={category.id}
              className={categoryId === category.id ? "active" : ""}
              onClick={() => onCategoryChange(category.id)}
            >{category.name}</button>
          ))}
        </nav>

        <InlineNotice message={errorMessage} onDismiss={onDismissError} />

        <div className="product-area">
          <div className="section-title">
            <div><span className="eyebrow">المنتجات</span><h1>{categoryId === "all" ? "جميع العناصر" : categories.find((item) => item.id === categoryId)?.name}</h1></div>
            <span>{products.length} منتج</span>
          </div>

          <div className="product-grid" aria-busy={busy === "catalog"}>
            {products.map((product) => (
              <button
                type="button"
                className="product-tile"
                key={product.id}
                onClick={() => onAddProduct(product.id)}
                disabled={busy === `product:${product.id}`}
              >
                <span className={`product-art tone-${product.tone}`}><b>{product.abbreviation}</b></span>
                <span className="product-info"><strong>{product.name}</strong><small>{formatMoney(product.price)}</small></span>
                <span className="quick-add"><Icon name="plus" size={17} /></span>
              </button>
            ))}
            {busy !== "catalog" && products.length === 0 ? (
              <div className="empty-products">
                <Icon name="search" size={28} />
                <strong>لا توجد نتائج</strong>
                <span>جرّب عبارة أخرى أو اختر تصنيفًا مختلفًا.</span>
              </div>
            ) : null}
          </div>
        </div>

        <button
          className="mobile-checkout primary-button"
          type="button"
          disabled={itemCount === 0 || busy === "checkout"}
          onClick={() => setMobileTicketOpen(true)}
          aria-expanded={mobileTicketOpen}
        >عرض التذكرة · {formatMoney(ticket.total)}</button>
      </section>

      <div className="ticket-column">
        <TicketPanel
          ticket={ticket}
          editable
          busy={busy}
          onSetQuantity={onSetQuantity}
          onRemoveLine={onRemoveLine}
        />
        <button
          className="checkout-button"
          type="button"
          disabled={itemCount === 0 || busy === "checkout"}
          onClick={onCheckout}
        >
          <span>{busy === "checkout" ? "جارٍ التجهيز…" : "الدفع"}</span>
          <strong>{formatMoney(ticket.total)}</strong>
        </button>
      </div>

      {mobileTicketOpen ? (
        <section className="mobile-ticket-surface" aria-label="التذكرة الحالية على الهاتف">
          <button className="mobile-ticket-close" type="button" onClick={() => setMobileTicketOpen(false)}>
            <Icon name="arrow" size={19} /> العودة إلى المنتجات
          </button>
          <TicketPanel
            ticket={ticket}
            editable
            busy={busy}
            onSetQuantity={onSetQuantity}
            onRemoveLine={onRemoveLine}
          />
          <button className="checkout-button" type="button" disabled={itemCount === 0 || busy === "checkout"} onClick={onCheckout}>
            <span>متابعة الدفع</span><strong>{formatMoney(ticket.total)}</strong>
          </button>
        </section>
      ) : null}
    </main>
  );
}
