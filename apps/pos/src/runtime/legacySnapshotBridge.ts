import { readBrowserLocalSnapshotSync } from "../adapters/browserLocalPersistence";
import type { LocalPersistenceContract } from "../contracts/localPersistence";

export class LocalSnapshotMigrationError extends Error {
  constructor(
    readonly code: "LEGACY_SNAPSHOT_CORRUPT" | "UNSUPPORTED_SNAPSHOT_VERSION",
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "LocalSnapshotMigrationError";
  }
}

type SnapshotMigration = (value: unknown, fromVersion: number) => unknown;

export type LegacySnapshotBridge = Readonly<{
  namespace: string;
  schemaVersion: number;
  ready: Promise<void>;
  readCurrentSnapshot(): unknown | null;
}>;

const parseLegacyValue = (storage: Storage, key: string): unknown | null => {
  const raw = storage.getItem(key);
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch (error) {
    throw new LocalSnapshotMigrationError(
      "LEGACY_SNAPSHOT_CORRUPT",
      `تعذر ترحيل مخزن رفاد القديم (${key}) بأمان.`,
      error,
    );
  }
};

const defaultMigration = (targetVersion: number): SnapshotMigration => (value, fromVersion) => {
  if (fromVersion === 0 || fromVersion === targetVersion) return value;
  throw new LocalSnapshotMigrationError(
    "UNSUPPORTED_SNAPSHOT_VERSION",
    `إصدار البيانات المحلية ${fromVersion} غير مدعوم لهذا الجزء من رفاد.`,
  );
};

/**
 * Temporary bridge for the current synchronous localStorage-based mocks.
 *
 * The Rifad LocalPersistence namespace is authoritative when it exists. Its
 * value is copied into the old mock key before the mock is constructed. If no
 * namespace exists yet, the legacy value is imported once into the Rifad
 * persistence contract. All subsequent durable writes are mirrored back to the
 * namespace by the runtime decorators.
 *
 * This bridge is intentionally adapter/runtime-only and must be deleted when
 * the legacy mock stores are replaced by a native persistence-aware runtime.
 */
export const createLegacySnapshotBridge = (input: {
  persistence: LocalPersistenceContract;
  namespace: string;
  schemaVersion: number;
  legacyStorageKey: string;
  storage?: Storage;
  migrate?: SnapshotMigration;
}): LegacySnapshotBridge => {
  const storage = input.storage ?? window.localStorage;
  const migrate = input.migrate ?? defaultMigration(input.schemaVersion);
  const persisted = readBrowserLocalSnapshotSync<unknown>(input.namespace, storage);

  let ready: Promise<void>;

  if (persisted) {
    if (persisted.schemaVersion > input.schemaVersion) {
      throw new LocalSnapshotMigrationError(
        "UNSUPPORTED_SNAPSHOT_VERSION",
        `بيانات ${input.namespace} أُنشئت بإصدار أحدث (${persisted.schemaVersion}) من الإصدار المدعوم (${input.schemaVersion}).`,
      );
    }
    const migrated = migrate(persisted.value, persisted.schemaVersion);
    storage.setItem(input.legacyStorageKey, JSON.stringify(migrated));
    ready = persisted.schemaVersion === input.schemaVersion
      ? Promise.resolve()
      : input.persistence.commitSnapshot({
          namespace: input.namespace,
          schemaVersion: input.schemaVersion,
          value: migrated,
        }).then(() => undefined);
  } else {
    const legacy = parseLegacyValue(storage, input.legacyStorageKey);
    if (legacy === null) {
      ready = Promise.resolve();
    } else {
      const migrated = migrate(legacy, 0);
      storage.setItem(input.legacyStorageKey, JSON.stringify(migrated));
      ready = input.persistence.commitSnapshot({
        namespace: input.namespace,
        schemaVersion: input.schemaVersion,
        value: migrated,
      }).then(() => undefined);
    }
  }

  return {
    namespace: input.namespace,
    schemaVersion: input.schemaVersion,
    ready,
    readCurrentSnapshot: () => parseLegacyValue(storage, input.legacyStorageKey),
  };
};
