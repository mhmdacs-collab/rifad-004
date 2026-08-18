import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { rmSync, mkdirSync } from 'node:fs';
import PouchDB from 'pouchdb';

const baseDir = new URL('./.tmp/', import.meta.url);
const localAPath = new URL('backoffice', baseDir).pathname;
const localBPath = new URL('pos', baseDir).pathname;
const couchContainer = process.env.COUCH_CONTAINER ?? 'rifad-couchdb-proof';
const remoteUrl = process.env.COUCH_URL ?? 'http://admin:rifad-sync-proof@127.0.0.1:5984/rifad_sync';

rmSync(baseDir, { recursive: true, force: true });
mkdirSync(baseDir, { recursive: true });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitFor(getter, label, timeoutMs = 15000) {
  const started = Date.now();
  let lastError;
  while (Date.now() - started < timeoutMs) {
    try {
      const value = await getter();
      if (value) return { value, elapsedMs: Date.now() - started };
    } catch (error) {
      lastError = error;
    }
    await sleep(100);
  }
  throw new Error(`${label} timed out after ${timeoutMs}ms${lastError ? `: ${lastError.message}` : ''}`);
}

async function waitForCouch(timeoutMs = 30000) {
  await waitFor(async () => {
    try {
      const response = await fetch('http://127.0.0.1:5984/');
      return response.status > 0;
    } catch {
      return false;
    }
  }, 'CouchDB restart', timeoutMs);
}

function startLiveSync(db, remote) {
  const sync = db.sync(remote, { live: true, retry: true });
  sync.on('error', () => {
    // retry:true deliberately absorbs transient network failures for this proof.
  });
  return sync;
}

async function closeClient(client) {
  client.syncHandle?.cancel();
  await client.db.close();
}

function openClient(path, remote) {
  const db = new PouchDB(path);
  return { db, syncHandle: startLiveSync(db, remote) };
}

const remote = new PouchDB(remoteUrl, { skip_setup: true });
let backoffice = openClient(localAPath, remote);
let pos = openClient(localBPath, remote);

console.log('CANDIDATE couchdb+pouchdb');
console.log('CHECK online_backoffice_to_pos:start');

const itemId = 'catalog:item:espresso';
await backoffice.db.put({
  _id: itemId,
  entityType: 'catalog-item',
  merchantId: 'merchant-proof',
  branchId: 'branch-proof',
  name: 'Espresso',
  priceMinor: 1200,
  version: 1
});

const boToPos = await waitFor(async () => {
  const doc = await pos.db.get(itemId);
  return doc.priceMinor === 1200 ? doc : false;
}, 'Back Office item propagation');

console.log(`CHECK online_backoffice_to_pos:pass latency_ms=${boToPos.elapsedMs}`);

console.log('CHECK permitted_pos_to_backoffice:start');
const customerId = 'customer:proof-001';
await pos.db.put({
  _id: customerId,
  entityType: 'customer',
  merchantId: 'merchant-proof',
  branchId: 'branch-proof',
  displayName: 'عميل اختبار',
  note: 'created-by-permitted-pos'
});

const posToBo = await waitFor(async () => {
  const doc = await backoffice.db.get(customerId);
  return doc.note === 'created-by-permitted-pos' ? doc : false;
}, 'POS permitted mutation propagation');
console.log(`CHECK permitted_pos_to_backoffice:pass latency_ms=${posToBo.elapsedMs}`);

console.log('CHECK offline_restart_reconnect:start');
execFileSync('docker', ['stop', couchContainer], { stdio: 'inherit' });
await sleep(500);

const saleId = 'sale:proof-001';
await pos.db.put({
  _id: saleId,
  entityType: 'sale',
  merchantId: 'merchant-proof',
  branchId: 'branch-proof',
  deviceId: 'pos-proof-device',
  businessId: saleId,
  totalMinor: 2500,
  completedAt: new Date().toISOString()
});

await closeClient(backoffice);
await closeClient(pos);

// Simulate both apps/processes reopening after an offline durable write.
backoffice = { db: new PouchDB(localAPath), syncHandle: null };
pos = { db: new PouchDB(localBPath), syncHandle: null };
const localSaleAfterRestart = await pos.db.get(saleId);
assert.equal(localSaleAfterRestart.businessId, saleId, 'offline sale must survive local client restart');

execFileSync('docker', ['start', couchContainer], { stdio: 'inherit' });
await waitForCouch();
backoffice.syncHandle = startLiveSync(backoffice.db, remote);
pos.syncHandle = startLiveSync(pos.db, remote);

const reconnect = await waitFor(async () => {
  const doc = await backoffice.db.get(saleId);
  return doc.businessId === saleId ? doc : false;
}, 'offline sale replay after reconnect', 30000);

await pos.db.sync(remote);
await pos.db.sync(remote);
const remoteSales = await remote.allDocs({ startkey: saleId, endkey: `${saleId}\ufff0`, include_docs: true });
assert.equal(remoteSales.rows.length, 1, 'retries must not create duplicate sale documents');
console.log(`CHECK offline_restart_reconnect:pass replay_ms=${reconnect.elapsedMs} duplicate_count=${remoteSales.rows.length}`);

console.log('CHECK additive_schema_growth:start');
const currentItem = await backoffice.db.get(itemId);
await backoffice.db.put({
  ...currentItem,
  preparationTimeSeconds: 45,
  taxProfileId: 'tax-standard'
});
const optionGroupId = 'catalog:option-group:size';
await backoffice.db.put({
  _id: optionGroupId,
  entityType: 'catalog-option-group',
  merchantId: 'merchant-proof',
  name: 'الحجم',
  values: [
    { id: 'small', label: 'صغير', priceMinor: 1000 },
    { id: 'large', label: 'كبير', priceMinor: 1500 }
  ]
});

await waitFor(async () => {
  const updated = await pos.db.get(itemId);
  return updated.preparationTimeSeconds === 45 && updated.taxProfileId === 'tax-standard' ? updated : false;
}, 'additive field propagation');
await waitFor(async () => {
  const group = await pos.db.get(optionGroupId);
  return Array.isArray(group.values) && group.values.length === 2 ? group : false;
}, 'new entity propagation');
console.log('CHECK additive_schema_growth:pass engine_rewrite=false');

await closeClient(backoffice);
await closeClient(pos);
await remote.close();

console.log('RESULT PASS candidate=couchdb+pouchdb scope=linux-node-baseline');
console.log('LIMITATION browser-pwa-windows-authz-tenant-isolation-conflict-policy-not-yet-proved');
