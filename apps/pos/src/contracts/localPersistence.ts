export const LOCAL_PERSISTENCE_CONTRACT_VERSION = 1 as const;

export type LocalNodeContext = Readonly<{
  installationId: string;
  branchId: string | null;
  deviceId: string | null;
}>;

export type LocalDomainEventDraft = Readonly<{
  id: string;
  type: string;
  aggregateType: string;
  aggregateId: string;
  occurredAt: string;
  payload: unknown;
}>;

export type LocalOutboxRecord = LocalDomainEventDraft & Readonly<{
  contractVersion: typeof LOCAL_PERSISTENCE_CONTRACT_VERSION;
  installationId: string;
  branchId: string | null;
  deviceId: string | null;
  queuedAt: string;
  attempts: number;
  lastAttemptAt: string | null;
  lastError: string | null;
}>;

export type LocalSnapshotRecord<T> = Readonly<{
  namespace: string;
  schemaVersion: number;
  revision: number;
  updatedAt: string;
  value: T;
}>;

export type LocalSnapshotCommit<T> = Readonly<{
  namespace: string;
  schemaVersion: number;
  value: T;
  events?: readonly LocalDomainEventDraft[];
}>;

/**
 * Rifad-owned local persistence boundary.
 *
 * The current browser implementation is only one transport. A Windows SQLite,
 * IndexedDB, OPFS, embedded donor database, or another local store may replace
 * it without changing POS/domain code.
 *
 * Namespaces are private module state. A module must not read another module's
 * namespace as an integration mechanism; cross-module propagation uses Rifad
 * contracts or versioned domain events.
 */
export interface LocalPersistenceContract {
  readonly contractVersion: typeof LOCAL_PERSISTENCE_CONTRACT_VERSION;

  getNodeContext(): Promise<LocalNodeContext>;
  bindDevice(input: { branchId: string; deviceId: string }): Promise<LocalNodeContext>;

  readSnapshot<T>(namespace: string): Promise<LocalSnapshotRecord<T> | null>;

  /**
   * Replaces one module snapshot and queues its domain events in one local
   * persistence commit. Production implementations must preserve equivalent
   * atomicity even if their physical storage differs.
   */
  commitSnapshot<T>(input: LocalSnapshotCommit<T>): Promise<LocalSnapshotRecord<T>>;

  /** Queue one or more durable domain events without replacing a snapshot. */
  appendEvents(events: readonly LocalDomainEventDraft[]): Promise<void>;

  listPendingOutbox(input?: { limit?: number }): Promise<readonly LocalOutboxRecord[]>;
  recordOutboxFailure(input: { ids: readonly string[]; error: string }): Promise<void>;
  acknowledgeOutbox(input: { ids: readonly string[] }): Promise<void>;
}
