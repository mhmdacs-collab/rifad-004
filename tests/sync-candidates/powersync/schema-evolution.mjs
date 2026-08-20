import assert from 'node:assert/strict';
import { rmSync } from 'node:fs';
import { SignJWT } from 'jose';
import pg from 'pg';
import { PowerSyncDatabase, Schema, Table, column } from '@powersync/node';

const { Pool } = pg;
const POWERSYNC_URL = process.env.POWERSYNC_URL ?? 'http://127.0.0.1:8080';
const PG_URL = process.env.PG_URL ?? 'postgresql://postgres:changeme@127.0.0.1:5432/postgres';
const AUTH_KEY = process.env.PS_CLIENT_AUTH_KEY ?? 'ZGV2LXNoYXJlZC1zZWNyZXQtZm9yLWRlbW8tb25seS0zMmI';

const baseColumns = {
  merchant_id: column.text,
  branch_id: column.text,
  name: column.text,
  price_minor: column.integer,
  metadata_json: column.text
};

const oldSchema = new Schema({ catalog_items: new Table(baseColumns) });
const newSchema = new Schema({ catalog_items: new Table({ ...baseColumns, kitchen_label: column.text }) });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function waitFor(getter, label, timeoutMs = 30000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const value = await getter();
      if (value) return value;
    } catch {
      // Sync startup/update can transiently race the source change.
    }
    await sleep(100);
  }
  throw new Error(`${label} timed out`);
}

async function createToken() {
  return new SignJWT({ role: 'authenticated' })
    .setProtectedHeader({ alg: 'HS256', kid: 'dev-key-1' })
    .setSubject('schema-proof-user')
    .setAudience(POWERSYNC_URL)
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(Buffer.from(AUTH_KEY, 'base64url'));
}

class ReadOnlyProofConnector {
  async fetchCredentials() {
    return { endpoint: POWERSYNC_URL, token: await createToken() };
  }
  async uploadData() {
    throw new Error('schema evolution proof performs no local writes');
  }
}

function cleanup(filename) {
  for (const suffix of ['', '-wal', '-shm', '-journal']) rmSync(`${filename}${suffix}`, { force: true });
}

async function open(filename, schema) {
  cleanup(filename);
  const db = new PowerSyncDatabase({ database: { dbFilename: filename }, schema });
  await db.init();
  await db.connect(new ReadOnlyProofConnector());
  await db.waitForFirstSync();
  return db;
}

async function close(db) {
  await db.disconnect();
  await Promise.resolve(db.close());
}

const pool = new Pool({ connectionString: PG_URL });
let oldClient;
let newClient;
try {
  console.log('CHECK additive_schema_old_new_clients:start');
  oldClient = await open('powersync-schema-old.db', oldSchema);
  newClient = await open('powersync-schema-new.db', newSchema);

  const itemId = 'item-schema-evolution-001';
  await pool.query(
    `INSERT INTO catalog_items(id, merchant_id, branch_id, name, price_minor, metadata_json, kitchen_label)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price_minor = EXCLUDED.price_minor, kitchen_label = EXCLUDED.kitchen_label`,
    [itemId, 'merchant-proof', 'branch-proof', 'Schema Item', 1900, '{}', 'BAR-A']
  );

  const oldRow = await waitFor(async () => {
    const rows = await oldClient.getAll('SELECT * FROM catalog_items WHERE id = ?', [itemId]);
    return rows[0]?.name === 'Schema Item' ? rows[0] : false;
  }, 'old client receives row with unknown additive source column');
  assert.equal(Object.hasOwn(oldRow, 'kitchen_label'), false, 'old client schema must remain valid without the new column');

  await waitFor(async () => {
    const rows = await newClient.getAll('SELECT * FROM catalog_items WHERE id = ?', [itemId]);
    return rows[0]?.kitchen_label === 'BAR-A' ? rows[0] : false;
  }, 'new client receives additive column');

  await pool.query('UPDATE catalog_items SET name = $2, kitchen_label = $3 WHERE id = $1', [itemId, 'Schema Item Updated', 'BAR-B']);

  await waitFor(async () => {
    const rows = await oldClient.getAll('SELECT * FROM catalog_items WHERE id = ?', [itemId]);
    return rows[0]?.name === 'Schema Item Updated' ? rows[0] : false;
  }, 'old client keeps receiving compatible updates');
  await waitFor(async () => {
    const rows = await newClient.getAll('SELECT * FROM catalog_items WHERE id = ?', [itemId]);
    return rows[0]?.name === 'Schema Item Updated' && rows[0]?.kitchen_label === 'BAR-B' ? rows[0] : false;
  }, 'new client receives updated additive field');

  console.log('CHECK additive_schema_old_new_clients:pass sync_engine_rewrite=false old_client_survives=true new_client_field=true');
} finally {
  if (oldClient) await close(oldClient);
  if (newClient) await close(newClient);
  await pool.end();
}
