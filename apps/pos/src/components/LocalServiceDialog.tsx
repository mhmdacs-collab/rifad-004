import { useEffect, useMemo, useState } from "react";
import type { OpenLocalOrder, ServiceArea, ServicePlace } from "../domain/restaurantService";
import { formatMoney } from "../domain/money";
import { Icon } from "./Icon";

type LocalServiceDialogProps = {
  mode: "assign" | "open";
  areas: readonly ServiceArea[];
  openOrders: readonly OpenLocalOrder[];
  busy: boolean;
  onClose: () => void;
  onAssign: (servicePlaceId: string) => Promise<boolean>;
  onOpen: (openOrderId: string) => Promise<boolean>;
};

const elapsedLabel = (iso: string) => {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return "الآن";
  if (minutes < 60) return `${minutes} د`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours} س ${remainder} د` : `${hours} س`;
};

export function LocalServiceDialog({ mode, areas, openOrders, busy, onClose, onAssign, onOpen }: LocalServiceDialogProps) {
  const [activeAreaId, setActiveAreaId] = useState(areas[0]?.id ?? "");

  useEffect(() => {
    if (areas.some((area) => area.id === activeAreaId)) return;
    setActiveAreaId(areas[0]?.id ?? "");
  }, [activeAreaId, areas]);

  const ordersByPlace = useMemo(() => new Map(openOrders.map((order) => [order.servicePlaceId, order])), [openOrders]);
  const activeArea = areas.find((area) => area.id === activeAreaId) ?? areas[0];
  const totalPlaces = areas.reduce((sum, area) => sum + area.places.length, 0);
  const availablePlaces = Math.max(0, totalPlaces - openOrders.length);

  const choosePlace = async (place: ServicePlace) => {
    if (busy) return;
    const existing = ordersByPlace.get(place.id);
    if (mode === "assign") {
      if (existing) return;
      if (await onAssign(place.id)) onClose();
      return;
    }
    if (!existing) return;
    if (await onOpen(existing.id)) onClose();
  };

  return (
    <div className="dialog-backdrop local-service-backdrop" role="presentation" onClick={onClose}>
      <section className="local-service-dialog" role="dialog" aria-modal="true" aria-labelledby="local-service-title" onClick={(event) => event.stopPropagation()}>
        <header className="local-service-head">
          <div>
            <span>{mode === "assign" ? "محلي" : "إدارة الخدمة"}</span>
            <h2 id="local-service-title">{mode === "assign" ? "اختر المكان" : "الطلبات المفتوحة"}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="إغلاق">×</button>
        </header>

        <div className="local-service-summary" aria-label="حالة أماكن الخدمة">
          <div><strong>{openOrders.length}</strong><span>طلبات مفتوحة</span></div>
          <i />
          <div><strong>{availablePlaces}</strong><span>أماكن متاحة</span></div>
        </div>

        <nav className="local-area-tabs" aria-label="مجموعات الأماكن">
          {areas.map((area) => {
            const areaOpenCount = openOrders.filter((order) => order.serviceAreaId === area.id).length;
            return (
              <button type="button" key={area.id} className={area.id === activeArea?.id ? "active" : ""} onClick={() => setActiveAreaId(area.id)}>
                <span>{area.name}</span>
                {areaOpenCount > 0 ? <small>{areaOpenCount}</small> : null}
              </button>
            );
          })}
        </nav>

        <div className="local-place-grid" aria-busy={busy}>
          {activeArea?.places.map((place) => {
            const order = ordersByPlace.get(place.id);
            const occupied = Boolean(order);
            const selectable = mode === "assign" ? !occupied : occupied;
            return (
              <button type="button" key={place.id} className={`local-place-card ${occupied ? "local-place-card--occupied" : "local-place-card--free"}`} disabled={!selectable || busy} onClick={() => void choosePlace(place)} aria-label={occupied ? `${place.name}، الحالة: محجوزة` : `${place.name}، الحالة: متاحة`}>
                <span className="local-place-card-top">
                  <span className={`local-place-status ${occupied ? "occupied" : "free"}`}>{occupied ? "محجوزة" : "متاحة"}</span>
                </span>
                <strong>{place.name}</strong>
                {order ? (
                  <span className="local-place-order-meta">
                    <b className="local-place-total">{formatMoney(order.ticket.total)}</b>
                    <span className="local-place-elapsed">{elapsedLabel(order.openedAt)}</span>
                  </span>
                ) : <span className="local-place-free-hint">اضغط لبدء طلب</span>}
              </button>
            );
          })}
        </div>

        {mode === "open" && openOrders.length === 0 ? <div className="local-orders-empty"><Icon name="receipt" size={30} /><strong>لا توجد طلبات مفتوحة</strong></div> : null}

        <footer className="local-service-foot">
          <span>{mode === "assign" ? "اختيار المكان يرسل الطلب للمطبخ ويُفرغ السلة." : "اضغط على المكان المحجوز لاستعادة طلبه."}</span>
          <button type="button" onClick={onClose}>إلغاء</button>
        </footer>
      </section>
    </div>
  );
}
