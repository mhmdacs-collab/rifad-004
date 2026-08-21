import { useEffect, useMemo, useState } from "react";
import type { OpenLocalOrder, PlaceGroup, ServicePlace } from "../domain/restaurantService";
import { formatMoney } from "../domain/money";
import { Icon } from "./Icon";

type LocalServiceDialogProps = {
  mode: "assign" | "open";
  groups: readonly PlaceGroup[];
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

export function LocalServiceDialog({ mode, groups, openOrders, busy, onClose, onAssign, onOpen }: LocalServiceDialogProps) {
  const [activeGroupId, setActiveGroupId] = useState(groups[0]?.id ?? "");

  useEffect(() => {
    if (groups.some((group) => group.id === activeGroupId)) return;
    setActiveGroupId(groups[0]?.id ?? "");
  }, [activeGroupId, groups]);

  const ordersByPlace = useMemo(() => new Map(openOrders.map((order) => [order.servicePlaceId, order])), [openOrders]);
  const activeGroup = groups.find((group) => group.id === activeGroupId) ?? groups[0];
  const totalPlaces = groups.reduce((sum, group) => sum + group.places.length, 0);
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
    <div className="dialog-backdrop local-service-backdrop" role="presentation" onClick={() => { if (!busy) onClose(); }}>
      <section className="local-service-dialog" role="dialog" aria-modal="true" aria-labelledby="local-service-title" onClick={(event) => event.stopPropagation()}>
        <header className="local-service-head">
          <div>
            <span>{mode === "assign" ? "محلي" : "إدارة الخدمة"}</span>
            <h2 id="local-service-title">{mode === "assign" ? "اختر المكان" : "الطلبات المفتوحة"}</h2>
          </div>
          <button type="button" onClick={onClose} disabled={busy} aria-label="إغلاق">×</button>
        </header>

        <div className="local-service-summary" aria-label="حالة أماكن الخدمة">
          <div><strong>{openOrders.length}</strong><span>طلبات مفتوحة</span></div>
          <i />
          <div><strong>{availablePlaces}</strong><span>أماكن متاحة</span></div>
        </div>

        <nav className="local-area-tabs" aria-label="مجموعات الأماكن">
          {groups.map((group) => {
            const groupOpenCount = openOrders.filter((order) => order.placeGroupId === group.id).length;
            return (
              <button type="button" key={group.id} className={group.id === activeGroup?.id ? "active" : ""} onClick={() => setActiveGroupId(group.id)} disabled={busy}>
                <span>{group.name}</span>
                {groupOpenCount > 0 ? <small>{groupOpenCount}</small> : null}
              </button>
            );
          })}
        </nav>

        <div className="local-place-grid" aria-busy={busy}>
          {activeGroup?.places.map((place) => {
            const order = ordersByPlace.get(place.id);
            const occupied = Boolean(order);
            const selectable = mode === "assign" ? !occupied : occupied;
            return (
              <button type="button" key={place.id} className={`local-place-card ${occupied ? "local-place-card--occupied" : "local-place-card--free"}`} disabled={!selectable || busy} onClick={() => void choosePlace(place)} aria-label={`${place.name}، الحالة: ${occupied ? "محجوزة" : "متاحة"}`}>
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
          <button type="button" onClick={onClose} disabled={busy}>إلغاء</button>
        </footer>
      </section>
    </div>
  );
}
