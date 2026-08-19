import { useState } from "react";
import type { CatalogAdminContract } from "../../../contracts/catalog";
import type { PosConfigurationAdminContract } from "../../../contracts/posConfigurationAdmin";
import BackOfficeApp from "./BackOfficeApp";
import PosOperationalConfigApp from "./PosOperationalConfigApp";
import { getBackOfficePosConfigurationAdmin } from "./runtime/backOfficePosConfiguration";
import "./pos-operational-config.css";

type BackOfficeArea = "catalog" | "operations";

export default function App({
  catalog,
  posConfiguration = getBackOfficePosConfigurationAdmin(),
}: {
  catalog: CatalogAdminContract;
  posConfiguration?: PosConfigurationAdminContract;
}) {
  const [area, setArea] = useState<BackOfficeArea>("catalog");

  return (
    <>
      <div className="bo-area-switcher" role="group" aria-label="نطاق المكتب الخلفي">
        <button className={area === "catalog" ? "is-active" : ""} type="button" onClick={() => setArea("catalog")}>الكتالوج</button>
        <button className={area === "operations" ? "is-active" : ""} type="button" onClick={() => setArea("operations")}>التشغيل والصلاحيات</button>
      </div>
      {area === "catalog" ? <BackOfficeApp catalog={catalog} /> : <PosOperationalConfigApp admin={posConfiguration} />}
    </>
  );
}
