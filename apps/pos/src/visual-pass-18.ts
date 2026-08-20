/*
 * Rifad POS — Visual Pass 18 helper
 * Adds a presentation-only data-price attribute to rendered touch product cards.
 * The source value already exists in each card's accessible aria-label; this helper
 * keeps the visual experiment isolated from sale-domain behavior.
 */

const localizeTouchPrice = (value: string) => value
  .replace(/\bSAR\b/gi, "ر.س")
  .replace(/\s+/g, " ")
  .trim();

const syncTouchProductPrices = (root: ParentNode) => {
  root.querySelectorAll<HTMLElement>(".sale-screen-touch button.catalog-product[aria-label]").forEach((card) => {
    const label = card.getAttribute("aria-label") ?? "";
    const separatorIndex = label.lastIndexOf("،");
    if (separatorIndex < 0) return;

    const price = localizeTouchPrice(label.slice(separatorIndex + 1));
    if (price) card.dataset.price = price;
  });
};

export function installVisualPass18ProductPrices() {
  if (typeof document === "undefined" || typeof MutationObserver === "undefined") return;

  const root = document.getElementById("root");
  if (!root) return;

  const sync = () => syncTouchProductPrices(root);
  const observer = new MutationObserver(sync);
  observer.observe(root, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["aria-label"],
  });

  queueMicrotask(sync);
}
