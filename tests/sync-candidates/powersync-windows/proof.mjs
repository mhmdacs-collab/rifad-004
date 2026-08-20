import assert from 'node:assert/strict';
import { existsSync, rmSync } from 'node:fs';
import { PowerSyncDatabase, Schema, Table, column } from '@powersync/node';

const filename = 'rifad-windows-proof.db';
for (const suffix of ['', '-wal', '-shm', '-journal']) {
  if (existsSync(`${filename}${suffix}`)) rmSync(`${filename}${suffix}`, { force: true });
}

const schema = new Schema({
  sales: new Table({
    merchant_id: column.text,
    branch_id: column.text,
    device_id: column.text,
    business_id: column.text,
    total_minor: column.integer,
    completed_at: column.text
  })
});

async function openDatabase() {
  const db = new PowerSyncDatabase({
    database: { dbFilename: filename },
    schema
  });
  await db.init();
  return db;
}

console.log('CANDIDATE powersync-node windows-local');
console.log(`PLATFORM ${process.platform} ${process.arch}`);
assert.equal(process.platform, 'win32', 'this proof must execute on Windows');

let db = await openDatabase();
const saleId = 'sale-windows-offline-001';
await db.execute(
  'INSERT INTO sales(id, merchant_id, branch_id, device_id, business_id, total_minor, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
  [saleId, 'merchant-proof', 'branch-proof', 'windows-proof-device', saleId, 5150, new Date().toISOString()]
);

const firstBatch = await db.getCrudBatch();
assert.ok(firstBatch, 'offline local write must create a durable CRUD upload batch');
const firstSaleOperation = firstBatch.crud.find((op) => op.table === 'sales' && op.id === saleId);
assert.ok(firstSaleOperation, 'sale must be present in the pending upload queue before restart');
const firstClientId = firstSaleOperation.clientId;
console.log(`CHECK offline_write_queued:pass client_op_id=${firstClientId}`);

await Promise.resolve(db.close());
db = await openDatabase();

const rows = await db.getAll('SELECT * FROM sales WHERE id = ?', [saleId]);
assert.equal(rows.length, 1, 'sale row must survive database close/reopen');
assert.equal(rows[0].business_id, saleId);

const secondBatch = await db.getCrudBatch();
assert.ok(secondBatch, 'pending upload queue must survive database close/reopen');
const secondSaleOperation = secondBatch.crud.find((op) => op.table === 'sales' && op.id === saleId);
assert.ok(secondSaleOperation, 'sale operation must still be pending after restart');
assert.equal(secondSaleOperation.clientId, firstClientId, 'retry identity must stay stable across restart');
console.log(`CHECK windows_restart_queue_identity:pass client_op_id=${secondSaleOperation.clientId}`);

await Promise.resolve(db.close());
console.log('RESULT PASS candidate=powersync-node scope=windows-local-sqlite-offline-restart');
console.log('LIMITATION no-live-server-sync-in-this-windows-job');
