import assert from 'node:assert/strict';
import { rmSync } from 'node:fs';
import { PowerSyncDatabase, Schema, Table, column } from '@powersync/node';

const API_URL = process.env.RIFAD_FIELD_API_URL ?? 'http://127.0.0.1:8787';
const DEVICE_ID = process.env.RIFAD_FIELD_DEVICE_ID ?? 'win11-native';
const DB_FILE = process.env.RIFAD_FIELD_DB_FILE ?? 'rifad-field-win11.db';

const schema = new Schema({
  catalog_items: new Table({
    merchant_id: column.text,
    branch_id: column.text,
    name: column.text,
    price_minor: column.integer,
    metadata_json: column.text
  }),
  sales: new Table({
    merchant_id: column.text,
    branch_id: column.text,
    device_id: column.text,
    business_id: column.text,
    total_minor: column.integer,
    completed_at: column.text
  })
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitFor(getter, label, timeoutMs = 45000) {
  const started = Date.now();
  let lastError;
  while (Date.now() - started < timeoutMs) {
    try {
      const value = await getter();
      if (value) return { value, elapsedMs: Date.now() - started };
    } catch (error) {
      lastError = error;
    }
    await sleep(125);
  }
  throw new Error(`${label} timed out${lastError ? `: ${lastError.message}` : ''}`);
}

class FieldConnector {
  async fetchCredentials() {
    const response = await fetch(`${API_URL}/token`);
    if (!response.ok) throw new Error(`token request failed: ${response.status}`);
    return response.json();
  }

  async uploadData(database) {
    const batch = await database.getCrudBatch();
    if (!batch) return;

    const crud = batch.crud.map((op) => ({
      clientId: op.clientId,
      transactionId: op.transactionId,
      table: op.table,
      op: op.op,
      id: op.id,
      opData: op.opData,
      previousValues: op.previousValues,
      metadata: op.metadata
    }));

    const response = await fetch(`${API_URL}/sync-batch`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-rifad-device': DEVICE_ID
      },
      body: JSON.stringify({ crud })
    });

    if (!response.ok) {
      throw new Error(`upload rejected: ${response.status} ${await response.text()}`);
    }

    await batch.complete();
  }
}

function cleanupDb() {
  for (const suffix of ['', '-wal', '-shm', '-journal']) {
    rmSync(`${DB_FILE}${suffix}`, { force: true });
  }
}

async function openClient({ connect = true } = {}) {
  const db = new PowerSyncDatabase({
    database: { dbFilename: DB_FILE },
    schema
  });
  await db.init();
  db.registerListener({
    statusChanged(status) {
      const uploadError = status.dataFlowStatus?.uploadError;
      const downloadError = status.dataFlowStatus?.downloadError;
      if (uploadError) console.error('UPLOAD_ERROR', uploadError);
      if (downloadError) console.error('DOWNLOAD_ERROR', downloadError);
    }
  });
  if (connect) {
    await db.connect(new FieldConnector());
    await db.waitForFirstSync();
  }
  return db;
}

async function closeClient(db, disconnect = true) {
  if (disconnect) {
    try {
      await db.disconnect();
    } catch {
      // A deliberate offline transition may already be disconnected.
    }
  }
  await Promise.resolve(db.close());
}

async function sourceSale(id) {
  const response = await fetch(`${API_URL}/control/sale/${encodeURIComponent(id)}`);
  if (!response.ok) throw new Error(`source sale query failed: ${response.status}`);
  return response.json();
}

assert.equal(process.platform, 'win32', 'field native proof must run on Windows');
console.log(`CANDIDATE powersync FIELD_NATIVE platform=${process.platform} arch=${process.arch}`);
console.log(`API ${API_URL}`);

cleanupDb();
let db;

try {
  db = await openClient();

  const nonce = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  const itemId = `field-item-${nonce}`;
  const onlineSaleId = `field-online-sale-${nonce}`;
  const offlineSaleId = `field-offline-sale-${nonce}`;

  console.log('CHECK live_service_backoffice_to_windows:start');
  const itemStarted = Date.now();
  const itemResponse = await fetch(`${API_URL}/control/item`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      id: itemId,
      name: `Field item ${nonce}`,
      priceMinor: 1234,
      metadata: { proof: 'win11-live-service' }
    })
  });
  assert.equal(itemResponse.ok, true, `source item write failed: ${itemResponse.status}`);

  const itemArrival = await waitFor(async () => {
    const rows = await db.getAll('SELECT * FROM catalog_items WHERE id = ?', [itemId]);
    return rows.length === 1 && Number(rows[0].price_minor) === 1234 ? rows[0] : false;
  }, 'source item reaching native Windows client');
  console.log(`CHECK live_service_backoffice_to_windows:pass latency_ms=${Date.now() - itemStarted} observed_ms=${itemArrival.elapsedMs}`);

  console.log('CHECK live_windows_to_source:start');
  const onlineStarted = Date.now();
  await db.execute(
    'INSERT INTO sales(id, merchant_id, branch_id, device_id, business_id, total_minor, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [onlineSaleId, 'merchant-proof', 'branch-proof', DEVICE_ID, onlineSaleId, 4321, new Date().toISOString()]
  );
  const onlineArrival = await waitFor(async () => {
    const result = await sourceSale(onlineSaleId);
    return result.count === 1 ? result.row : false;
  }, 'native Windows sale reaching source');
  console.log(`CHECK live_windows_to_source:pass latency_ms=${Date.now() - onlineStarted} observed_ms=${onlineArrival.elapsedMs}`);

  console.log('CHECK windows_offline_restart_reconnect:start');
  await db.disconnect();
  await db.execute(
    'INSERT INTO sales(id, merchant_id, branch_id, device_id, business_id, total_minor, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [offlineSaleId, 'merchant-proof', 'branch-proof', DEVICE_ID, offlineSaleId, 7654, new Date().toISOString()]
  );

  const beforeRestart = await db.getCrudBatch();
  assert.ok(beforeRestart, 'offline write must be queued before restart');
  const queuedBefore = beforeRestart.crud.find((op) => op.table === 'sales' && op.id === offlineSaleId);
  assert.ok(queuedBefore, 'offline sale must exist in pending queue before restart');
  const stableClientId = queuedBefore.clientId;

  await closeClient(db, false);
  db = await openClient({ connect: false });

  const afterRestart = await db.getCrudBatch();
  assert.ok(afterRestart, 'pending queue must survive database restart');
  const queuedAfter = afterRestart.crud.find((op) => op.table === 'sales' && op.id === offlineSaleId);
  assert.ok(queuedAfter, 'offline sale must still be queued after restart');
  assert.equal(queuedAfter.clientId, stableClientId, 'queued operation identity must survive restart');

  const failResponse = await fetch(`${API_URL}/control/fail-next-sale`, { method: 'POST' });
  assert.equal(failResponse.ok, true, 'failed to arm ambiguous retry proof');

  const reconnectStarted = Date.now();
  await db.connect(new FieldConnector());
  await db.waitForFirstSync();

  const offlineArrival = await waitFor(async () => {
    const result = await sourceSale(offlineSaleId);
    return result.count === 1 ? result.row : false;
  }, 'offline/restarted sale replay');

  const attemptsResponse = await fetch(
    `${API_URL}/control/attempts?device=${encodeURIComponent(DEVICE_ID)}&id=${encodeURIComponent(offlineSaleId)}`
  );
  const attempts = await attemptsResponse.json();
  const source = await sourceSale(offlineSaleId);
  assert.equal(source.count, 1, 'ambiguous retry must leave exactly one source sale');
  assert.ok(Number(attempts.maxAttempts) >= 2, 'intentional ambiguous failure should produce a retry attempt');

  console.log(
    `CHECK windows_offline_restart_reconnect:pass replay_ms=${Date.now() - reconnectStarted} observed_ms=${offlineArrival.elapsedMs} client_op_id=${stableClientId} attempts=${attempts.maxAttempts} source_rows=${source.count}`
  );
  console.log('RESULT PASS candidate=powersync scope=windows11-live-service-native-offline-restart');
} finally {
  if (db) await closeClient(db).catch(() => {});
}
