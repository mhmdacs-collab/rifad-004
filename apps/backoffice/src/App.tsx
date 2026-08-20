import { useState } from "react";
import type { CatalogAdminContract } from "../../../contracts/catalog";
import type { PosConfigurationAdminContract } from "../../../contracts/posConfigurationAdmin";
import BackOfficeApp from "./BackOfficeApp";
import PaymentAndDeliverySettingsApp from "./PaymentAndDeliverySettingsApp";
import PosOperationalConfigApp from "./PosOperationalConfigApp";
import { getBackOfficePosConfigurationAdmin } from "./runtime/backOfficePosConfiguration";
import "./pos-operational-config.css";
import "./payment-delivery-settings.css";

type BackOfficeArea = "catalog" | "operations" | "payments";

const BACK_OFFICE_AREA_KEY = "rifad.backoffice.active-area.v1";

const initialArea = (): BackOfficeArea => {
  const stored = window.localStorage.getItem(BACK_OFFICE_AREA_KEY);
  return stored === "catalog" || stored === "operations" || stored === "payments" ? stored : "catalog";
};

export default function App({
  catalog,
  posConfiguration = getBackOfficePosConfigurationAdmin(),
}: {
  catalog: CatalogAdminContract;
  posConfiguration?: PosConfigurationAdminContract;
}) {
  const [area, setArea] = useState<BackOfficeArea>(initialArea);

  const openArea = (next: BackOfficeArea) => {
    window.localStorage.setItem(BACK_OFFICE_AREA_KEY, next);
    setArea(next);
  };

  return (
    <>
      <div className="bo-area-switcher" role="group" aria-label="نطاق المكتب الخلفي">
        <button
          className={area === "catalog" ? "is-active" : ""}
          type="button"
          onClick={() => openArea("catalog")}
        >
          الأصناف والكتالوج
        </button>
        <button
          aria-label="التشغيل والصلاحيات"
          className={area === "operations" ? "is-active" : ""}
          type="button"
          onClick={() => openArea("operations")}
        >
          إدارة الموظفين والإعدادات
        </button>
        <button
          aria-label="الدفع والتوصيل"
          className={area === "payments" ? "is-active" : ""}
          type="button"
          onClick={() => openArea("payments")}
        >
          الدفع والتوصيل
        </button>
      </div>
      {area === "catalog"
        ? <BackOfficeApp catalog={catalog} />
        : area === "operations"
          ? <PosOperationalConfigApp admin={posConfiguration} />
          : <PaymentAndDeliverySettingsApp admin={posConfiguration} />}
    </>
  );
}
