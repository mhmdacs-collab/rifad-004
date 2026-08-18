import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { getBackOfficeCatalogAdmin } from "./runtime/backOfficeCatalog";
import "./styles.css";
import "./reference-overrides.css";

const catalog = getBackOfficeCatalogAdmin();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App catalog={catalog} />
  </StrictMode>,
);
