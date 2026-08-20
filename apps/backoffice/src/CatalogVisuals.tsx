import { useState } from "react";
import type { CatalogItemAppearance, CatalogItemShape } from "../../../contracts/catalog";

export const CATALOG_COLOR_PALETTE = [
  "#0A714E",
  "#2D8CFF",
  "#7B61FF",
  "#9B51E0",
  "#F2994A",
  "#F2C94C",
  "#EB5757",
  "#27AE60",
  "#56CCF2",
  "#667085",
] as const;

export const DEFAULT_ITEM_APPEARANCE: CatalogItemAppearance = {
  mode: "color",
  color: "#0A714E",
  shape: "rounded",
  imageDataUrl: null,
};

const initials = (name: string) => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return `${words[0]?.[0] ?? ""}${words[1]?.[0] ?? ""}`;
  return Array.from(words[0] ?? "ص").slice(0, 2).join("");
};

const radiusFor = (shape: CatalogItemShape) => shape === "circle" ? "50%" : shape === "rounded" ? "22%" : "10%";

export function CatalogItemVisual({
  appearance = DEFAULT_ITEM_APPEARANCE,
  name,
  size = 48,
  className = "",
}: {
  appearance?: CatalogItemAppearance;
  name: string;
  size?: number;
  className?: string;
}) {
  const style = {
    width: size,
    height: size,
    borderRadius: radiusFor(appearance.shape),
    background: appearance.color,
  };
  return (
    <span className={`bo-catalog-visual ${className}`} style={style} aria-hidden="true">
      {appearance.mode === "image" && appearance.imageDataUrl
        ? <img src={appearance.imageDataUrl} alt="" />
        : <strong>{initials(name)}</strong>}
    </span>
  );
}

export function CatalogColorPicker({
  value,
  onChange,
  label = "اللون",
}: {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}) {
  return (
    <div className="bo-color-picker" role="group" aria-label={label}>
      {CATALOG_COLOR_PALETTE.map((color) => (
        <button
          key={color}
          className={`bo-color-swatch ${value.toUpperCase() === color ? "is-selected" : ""}`}
          type="button"
          style={{ background: color }}
          onClick={() => onChange(color)}
          aria-label={`${label} ${color}`}
          aria-pressed={value.toUpperCase() === color}
        />
      ))}
    </div>
  );
}

const readFileAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("IMAGE_READ_FAILED"));
  reader.onerror = () => reject(new Error("IMAGE_READ_FAILED"));
  reader.readAsDataURL(file);
});

const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = () => reject(new Error("IMAGE_DECODE_FAILED"));
  image.src = src;
});

const squareThumbnail = async (file: File) => {
  if (!file.type.startsWith("image/")) throw new Error("IMAGE_TYPE_INVALID");
  if (file.size > 8 * 1024 * 1024) throw new Error("IMAGE_TOO_LARGE");
  const source = await readFileAsDataUrl(file);
  const image = await loadImage(source);
  const side = Math.min(image.naturalWidth, image.naturalHeight);
  const sx = Math.max(0, (image.naturalWidth - side) / 2);
  const sy = Math.max(0, (image.naturalHeight - side) / 2);
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("IMAGE_CANVAS_FAILED");
  context.drawImage(image, sx, sy, side, side, 0, 0, 512, 512);
  return canvas.toDataURL("image/jpeg", 0.84);
};

export function CatalogAppearanceEditor({
  appearance,
  itemName,
  onChange,
}: {
  appearance: CatalogItemAppearance;
  itemName: string;
  onChange: (appearance: CatalogItemAppearance) => void;
}) {
  const [processing, setProcessing] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  const uploadImage = async (file: File | undefined) => {
    if (!file) return;
    setProcessing(true);
    setImageError(null);
    try {
      const imageDataUrl = await squareThumbnail(file);
      onChange({ ...appearance, mode: "image", imageDataUrl });
    } catch (error) {
      const code = error instanceof Error ? error.message : "";
      setImageError(code === "IMAGE_TOO_LARGE" ? "الصورة أكبر من 8 MB." : "تعذر تجهيز الصورة. اختر JPG أو PNG أو WebP.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="bo-appearance-editor">
      <div className="bo-pos-preview-card">
        <span className="bo-preview-eyebrow">معاينة في نقطة البيع</span>
        <CatalogItemVisual appearance={appearance} name={itemName || "صنف"} size={142} className="bo-catalog-visual--hero" />
        <strong>{itemName || "اسم الصنف"}</strong>
        <small>يظهر الشكل أو الصورة على بطاقة البيع.</small>
      </div>

      <div className="bo-appearance-controls">
        <div className="bo-segmented bo-appearance-mode" role="group" aria-label="طريقة عرض الصنف">
          <button type="button" className={appearance.mode === "color" ? "is-active" : ""} onClick={() => onChange({ ...appearance, mode: "color" })}>لون وشكل</button>
          <button type="button" className={appearance.mode === "image" ? "is-active" : ""} onClick={() => onChange({ ...appearance, mode: appearance.imageDataUrl ? "image" : "color" })}>صورة</button>
        </div>

        <div className="bo-appearance-block">
          <div><strong>لون الأيقونة</strong><small>يستخدم عندما لا توجد صورة.</small></div>
          <CatalogColorPicker value={appearance.color} onChange={(color) => onChange({ ...appearance, color, mode: appearance.imageDataUrl && appearance.mode === "image" ? "image" : "color" })} label="لون الصنف" />
        </div>

        <div className="bo-appearance-block">
          <div><strong>شكل الأيقونة</strong><small>اختر الشكل الأقرب لطريقة عرض المتجر.</small></div>
          <div className="bo-shape-picker" role="group" aria-label="شكل أيقونة الصنف">
            {(["square", "rounded", "circle"] as const).map((shape) => (
              <button key={shape} type="button" className={appearance.shape === shape ? "is-selected" : ""} onClick={() => onChange({ ...appearance, shape })} aria-label={shape === "square" ? "مربع" : shape === "rounded" ? "مربع مستدير" : "دائرة"} aria-pressed={appearance.shape === shape}>
                <span style={{ borderRadius: radiusFor(shape) }} />
              </button>
            ))}
          </div>
        </div>

        <div className="bo-appearance-block bo-image-upload-block">
          <div><strong>صورة الصنف</strong><small>نقصها تلقائيًا من المنتصف إلى مربع 512×512 مثل بطاقة POS.</small></div>
          <div className="bo-image-actions">
            <label className="bo-secondary bo-upload-action">
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => { void uploadImage(event.target.files?.[0]); event.currentTarget.value = ""; }} />
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M12 16V4m0 0-4 4m4-4 4 4"/><path d="M5 14v5h14v-5"/></svg>
              {processing ? "جارٍ تجهيز الصورة…" : appearance.imageDataUrl ? "تغيير الصورة" : "رفع صورة"}
            </label>
            {appearance.imageDataUrl ? <button className="bo-image-remove" type="button" onClick={() => onChange({ ...appearance, mode: "color", imageDataUrl: null })}>إزالة الصورة</button> : null}
          </div>
          {imageError ? <span className="bo-image-error" role="alert">{imageError}</span> : null}
        </div>
      </div>
    </div>
  );
}
