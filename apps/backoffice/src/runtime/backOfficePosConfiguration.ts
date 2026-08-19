import { createBrowserPosConfigurationAdmin } from "../../../../adapters/posConfiguration/browserPosConfigurationAdmin";
import type { PosConfigurationAdminContract } from "../../../../contracts/posConfigurationAdmin";

let instance: PosConfigurationAdminContract | null = null;

export const getBackOfficePosConfigurationAdmin = (): PosConfigurationAdminContract => {
  if (!instance) instance = createBrowserPosConfigurationAdmin();
  return instance;
};
