import type { CatalogAdminContract } from "../../../../contracts/catalog";
import { createBrowserCatalogAdmin } from "../../../../adapters/catalog/browserCatalog";

let catalogAdmin: CatalogAdminContract | null = null;

export const getBackOfficeCatalogAdmin = (): CatalogAdminContract => {
  if (!catalogAdmin) catalogAdmin = createBrowserCatalogAdmin();
  return catalogAdmin;
};
