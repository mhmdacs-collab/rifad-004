import {
  LOCAL_PERSISTENCE_CONTRACT_VERSION,
  type LocalDomainEventDraft,
  type LocalNodeContext,
  type LocalOutboxRecord,
  type LocalPersistenceContract,
  type LocalSnapshotCommit,
  type LocalSnapshotRecord,
} from "../contracts/localPersistence";

export const BROWSER_LOCAL_PERSISTENCE_KEY = "rifad.local-persistence.v1";

export class LocalPersistenceError extends Error {
  constructor(
    readonly code: "LOCAL_STORE_CORRUPT" | "LOCAL_STORE_READ_FAILED" | "LOCAL_STORE_WRITE_FAILED",
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "LocalPersistenceError";
  }
}

type StoredNamespace = {
  schemaVersion: number;
  revision: number;
  updatedAt: string;
  value: unknown;
};

type StoredRoot = {
  schemaVersion: typeof LOCAL_PERSISTENCE_CONTRACT_VERSION;
  installationId: string;
  binding: { branchId: string; deviceId: string } | null;
  namespaces: Record<string, StoredNamespace>;
  outbox: LocalOutboxRecord[];
};

const createInstallationId = () => `installation-${crypto.randomUUID()}`;

const createRoot = (): StoredRoot => ({
  schemaVersion: LOCAL_PERSISTENCE_CONTRACT_VERSION,
  installationId: createInstallationId(),
  binding: null,
  namespaces: {},
  outbox: [],
});

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

const assertRoot = (value: unknown): StoredRoot => {
  if (!isObject(value)
    || value.schemaVersion !== LOCAL_PERSISTENCE_CONTRACT_VERSION
    || typeof value.installationId !== "string"
    || !isObject(value.namespaces)
    || !Array.isArray(value.outbox)) {
    throw new LocalPersistenceError("LOCAL_STORE_CORRUPT", "تعذر قراءة مخزن رفاد المحلي بأمان.");
  }

  const binding = value.binding;
  if (binding !== null && (!isObject(binding) || typeof binding.branchId !== "string" || typeof binding.deviceId !== "string")) {
    throw new LocalPersistenceError("LOCAL_STORE_CORRUPT", "بيانات ربط الجهاز في مخزن رفاد المحلي غير صالحة.");
  }

  return value as StoredRoot;
};

const readStoredRoot = (storage: Storage, storageKey: string): StoredRoot | null => {
  try {
    const raw = storage.getItem(storageKey);
    if (!raw) return null;
    return assertRoot(JSON.parse(raw));
  } catch (error) {
    if (error instanceof LocalPersistenceError) throw error;
    throw new LocalPersistenceError("LOCAL_STORE_READ_FAILED", "تعذر فتح مخزن رفاد المحلي.", error);
  }
};

/**
 * Staging-only synchronous read used by the legacy mock migration bridge.
 *
 * Product/domain code must use LocalPersistenceContract instead. This helper
 * exists only because the current mock runtimes construct synchronously and
 * still expect their old localStorage keys. It disappears with those mocks.
 */
export const readBrowserLocalSnapshotSync = <T>(
  namespace: string,
  storage: Storage = window.localStorage,
  storageKey = BROWSER_LOCAL_PERSISTENCE_KEY,
): LocalSnapshotRecord<T> | null => {
  const root = readStoredRoot(storage, storageKey);
  const stored = root?.namespaces[namespace];
  if (!stored) return null;
  return {
    namespace,
    schemaVersion: stored.schemaVersion,
    revision: stored.revision,
    updatedAt: stored.updatedAt,
    value: stored.value as T,
  };
};

const toOutboxRecord = (root: StoredRoot, event: LocalDomainEventDraft): LocalOutboxRecord => ({
  ...event,
  contractVersion: LOCAL_PERSISTENCE_CONTRACT_VERSION,
  installationId: root.installationId,
  branchId: root.binding?.branchId ?? null,
  deviceId: root.binding?.deviceId ?? null,
  queuedAt: new Date().toISOString(),
  attempts: 0,
  lastAttemptAt: null,
  lastError: null,
});

/**
 * Browser staging implementation of LocalPersistenceContract.
 *
 * It intentionally stores the complete persistence root with one setItem so a
 * module snapshot + its outbox events are committed together in this adapter.
 * The contract is async so IndexedDB/OPFS/SQLite can replace this transport
 * later without changing consumers.
 *
 * This adapter is suitable for current product proof/restart evidence, but it
 * is not the final multi-process or high-volume production store.
 */
export class BrowserLocalPersistence implements LocalPersistenceContract {
  readonly contractVersion = LOCAL_PERSISTENCE_CONTRACT_VERSION;

  constructor(
    private readonly storage: Storage = window.localStorage,
    private readonly storageKey = BROWSER_LOCAL_PERSISTENCE_KEY,
  ) {}

  private readRoot(): StoredRoot {
    const stored = readStoredRoot(this.storage, this.storageKey);
    if (stored) return stored;
    const root = createRoot();
    this.writeRoot(root);
    return root;
  }

  private writeRoot(root: StoredRoot) {
    try {
      this.storage.setItem(this.storageKey, JSON.stringify(root));
    } catch (error) {
      throw new LocalPersistenceError("LOCAL_STORE_WRITE_FAILED", "تعذر حفظ بيانات رفاد محليًا.", error);
    }
  }

  private withEvents(root: StoredRoot, events: readonly LocalDomainEventDraft[]): StoredRoot {
    if (events.length === 0) return root;
    const known = new Set(root.outbox.map((event) => event.id));
    const additions: LocalOutboxRecord[] = [];

    for (const event of events) {
      if (known.has(event.id)) continue;
      known.add(event.id);
      additions.push(toOutboxRecord(root, event));
    }

    return additions.length === 0 ? root : { ...root, outbox: [...root.outbox, ...additions] };
  }

  async getNodeContext(): Promise<LocalNodeContext> {
    const root = this.readRoot();
    return {
      installationId: root.installationId,
      branchId: root.binding?.branchId ?? null,
      deviceId: root.binding?.deviceId ?? null,
    };
  }

  async bindDevice(input: { branchId: string; deviceId: string }): Promise<LocalNodeContext> {
    const root = this.readRoot();
    const next: StoredRoot = { ...root, binding: { branchId: input.branchId, deviceId: input.deviceId } };
    this.writeRoot(next);
    return {
      installationId: next.installationId,
      branchId: input.branchId,
      deviceId: input.deviceId,
    };
  }

  async readSnapshot<T>(namespace: string): Promise<LocalSnapshotRecord<T> | null> {
    const stored = this.readRoot().namespaces[namespace];
    if (!stored) return null;
    return {
      namespace,
      schemaVersion: stored.schemaVersion,
      revision: stored.revision,
      updatedAt: stored.updatedAt,
      value: stored.value as T,
    };
  }

  async commitSnapshot<T>(input: LocalSnapshotCommit<T>): Promise<LocalSnapshotRecord<T>> {
    const root = this.readRoot();
    const previous = root.namespaces[input.namespace];
    const updatedAt = new Date().toISOString();
    const stored: StoredNamespace = {
      schemaVersion: input.schemaVersion,
      revision: (previous?.revision ?? 0) + 1,
      updatedAt,
      value: input.value,
    };
    const withSnapshot: StoredRoot = {
      ...root,
      namespaces: { ...root.namespaces, [input.namespace]: stored },
    };
    const next = this.withEvents(withSnapshot, input.events ?? []);
    this.writeRoot(next);
    return {
      namespace: input.namespace,
      schemaVersion: stored.schemaVersion,
      revision: stored.revision,
      updatedAt,
      value: input.value,
    };
  }

  async appendEvents(events: readonly LocalDomainEventDraft[]): Promise<void> {
    if (events.length === 0) return;
    const root = this.readRoot();
    const next = this.withEvents(root, events);
    if (next !== root) this.writeRoot(next);
  }

  async listPendingOutbox(input: { limit?: number } = {}): Promise<readonly LocalOutboxRecord[]> {
    const requested = input.limit ?? 100;
    const limit = Math.max(1, Math.min(1000, Math.trunc(requested)));
    return this.readRoot().outbox.slice(0, limit);
  }

  async recordOutboxFailure(input: { ids: readonly string[]; error: string }): Promise<void> {
    if (input.ids.length === 0) return;
    const ids = new Set(input.ids);
    const now = new Date().toISOString();
    const root = this.readRoot();
    const outbox = root.outbox.map((event) => ids.has(event.id)
      ? { ...event, attempts: event.attempts + 1, lastAttemptAt: now, lastError: input.error }
      : event);
    this.writeRoot({ ...root, outbox });
  }

  async acknowledgeOutbox(input: { ids: readonly string[] }): Promise<void> {
    if (input.ids.length === 0) return;
    const ids = new Set(input.ids);
    const root = this.readRoot();
    this.writeRoot({ ...root, outbox: root.outbox.filter((event) => !ids.has(event.id)) });
  }
}

export const createBrowserLocalPersistence = (
  storage: Storage = window.localStorage,
  storageKey = BROWSER_LOCAL_PERSISTENCE_KEY,
): LocalPersistenceContract => new BrowserLocalPersistence(storage, storageKey);
