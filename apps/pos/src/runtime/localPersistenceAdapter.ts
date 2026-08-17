import { createBrowserLocalPersistence } from "../adapters/browserLocalPersistence";
import type { LocalPersistenceContract } from "../contracts/localPersistence";

export type LocalPersistenceAdapterInfo = Readonly<{
  id: string;
  contractVersion: 1;
  transport: "browser-storage" | "indexeddb" | "opfs" | "sqlite" | "external";
  implementation: "staging" | "rifad-native" | "external";
}>;

/**
 * One Rifad-owned composition point for durable local state and the
 * transactional outbox.
 *
 * Future Windows/PWA storage replacements happen here; LAN, cloud sync and
 * fiscal adapters consume the persistence contract/outbox but do not own it.
 */
export const LOCAL_PERSISTENCE_ADAPTER_INFO: LocalPersistenceAdapterInfo = {
  id: "rifad-browser-local-v1",
  contractVersion: 1,
  transport: "browser-storage",
  implementation: "staging",
};

export const createLocalPersistenceAdapter = (): LocalPersistenceContract => {
  return createBrowserLocalPersistence();
};
