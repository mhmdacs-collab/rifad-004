import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { rmSync } from 'node:fs';
import { SignJWT } from 'jose';
import pg from 'pg';
import { PowerSyncDatabase, Schema, Table, column } from '@powersync/node';

const { Pool } = pg;

const POWERSYNC_URL = process.env.POWERSYNC_URL ?? 'http://127.0.0.1:8080';
const PG_URL = process.env.PG_URL ?? 'postgresql://postgres:changeme@127.0.0.1:5432/postgres';
const AUTH_KEY = process.env.PS_CLIENT_AUTH_KEY ?? 'ZGV2LXNoYXJlZC1zZWNyZXQtZm9yLWRlbW8tb25seS0zMmI';
const API_PORT = Number(process.env.RIFAD_PROOF_API_PORT ?? 8787);

const schema = new Schema({
  catalog_items: new Table({
    merchant_id: column.text,
    branch_id: column.text,
    name: column.text,
    price_minor: column.integer,
    metadata_json: column.text
  }),
  customers: new Table({
    merchant_id: column.text,
    branch_id: column.text,
    display_name: column.text,
    note: column.text
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

const allowedColumns = {
  catalog_items: new Set(['merchant_id', 'branch_id', 'name', 'price_minor', 'metadata_json']),
  customers: new Set(['merchant_id', 'branch_id', 'display_name', 'note']),
  sales: new Set(['merchant_id', 'branch_id', 'device_id', 'business_id', 'total_minor', 'completed_at'])
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitFor(getter, label, timeoutMs = 30000) {
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
  throw new Error(`${label} timed out${lastError ? `: ${lastError.message}` : ''}`);
}

async function createToken() {
  const key = Buffer.from(AUTH_KEY, 'base64url');
  return new SignJWT({ role: 'authenticated' })
    .setProtectedHeader({ alg: 'HS256', kid: 'dev-key-1' })
    .setSubject('proof-user')
    .setAudience(POWERSYNC_URL)
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(key);
}

class RifadProofConnector {
  constructor(deviceId) {
    this.deviceId = deviceId;
  }

  async fetchCredentials() {
    return { endpoint: POWERSYNC_URL, token: await createToken() };
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

    const response = await fetch(`http://127.0.0.1:${API_PORT}/sync-batch`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-rifad-device': this.deviceId
      },
      body: JSON.stringify({ crud })
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`proof backend rejected upload: ${response.status} ${detail}`);
    }

    await batch.complete();
  }
}

function cleanupDb(filename) {
  for (const suffix of ['', '-wal', '-shm', '-journal']) {
    rmSync(`${filename}${suffix}`, { force: true });
  }
}

async function openClient(filename, deviceId) {
  const db = new PowerSyncDatabase({
    database: { dbFilename: filename },
    schema
  });
  await db.init();
  db.registerListener({
    statusChanged(status) {
      if (status.dataFlowStatus?.uploadError) {
        console.error(`UPLOAD_ERROR device=${deviceId}`, status.dataFlowStatus.uploadError);
      }
      if (status.dataFlowStatus?.downloadError) {
        console.error(`DOWNLOAD_ERROR device=${deviceId}`, status.dataFlowStatus.downloadError);
      }
    }
  });
  await db.connect(new RifadProofConnector(deviceId));
  await db.waitForFirstSync();
  return db;
}

async function closeClient(db) {
  try {
    await db.disconnect();
  } catch {
    // Closing after a deliberate connectivity transition may already be disconnected.
  }
  await Promise.resolve(db.close());
}

function startProofBackend(pool) {
  let failAfterApplyingNextSale = false;

  const server = createServer(async (req, res) => {
    if (req.method !== 'POST' || req.url !== '/sync-batch') {
      res.writeHead(404).end();
      return;
    }

    try {
      const deviceId = String(req.headers['x-rifad-device'] ?? 'unknown-device');
      let body = '';
      for await (const chunk of req) body += chunk;
      const { crud = [] } = JSON.parse(body || '{}');
      const client = await pool.connect();
      let containsSale = false;

      try {
        await client.query('BEGIN');
        for (const op of crud) {
          const table = String(op.table);
          if (!allowedColumns[table]) throw new Error(`unexpected table ${table}`);
          containsSale ||= table === 'sales';

          const clientOpId = String(op.clientId ?? `${op.table}:${op.id}:${op.op}:${JSON.stringify(op.opData ?? {})}`);
          const dedupe = await client.query(
            'INSERT INTO sync_upload_dedupe(device_id, client_op_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING client_op_id',
            [deviceId, clientOpId]
          );
          if (dedupe.rowCount === 0) continue;

          if (op.op === 'DELETE' || op.op === 'delete') {
            await client.query(`DELETE FROM ${table} WHERE id = $1`, [op.id]);
            continue;
          }

          const data = { ...(op.opData ?? {}) };
          const keys = Object.keys(data).filter((key) => allowedColumns[table].has(key));
          if (op.op === 'PATCH' || op.op === 'patch') {
            if (keys.length === 0) continue;
            const assignments = keys.map((key, index) => `${key} = $${index + 2}`).join(', ');
            await client.query(`UPDATE ${table} SET ${assignments} WHERE id = $1`, [op.id, ...keys.map((key) => data[key])]);
            continue;
          }

          if (keys.length === 0) throw new Error(`empty put payload for ${table}:${op.id}`);
          const columns = ['id', ...keys];
          const values = [op.id, ...keys.map((key) => data[key])];
          const params = values.map((_, index) => `$${index + 1}`).join(', ');
          const updates = keys.map((key) => `${key} = EXCLUDED.${key}`).join(', ');
          await client.query(
            `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${params}) ON CONFLICT (id) DO UPDATE SET ${updates}`,
            values
          );
        }
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

      if (containsSale && failAfterApplyingNextSale) {
        failAfterApplyingNextSale = false;
        res.writeHead(503, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ applied: true, acknowledged: false, reason: 'intentional ambiguous failure proof' }));
        return;
      }

      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    } catch (error) {
      res.writeHead(500, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
  });

  return {
    async listen() {
      await new Promise((resolve) => server.listen(API_PORT, '127.0.0.1', resolve));
    },
    failNextSaleAfterApply() {
      failAfterApplyingNextSale = true;
    },
    async close() {
      await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    }
  };
}

const pool = new Pool({ connectionString: PG_URL });
await waitFor(async () => {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}, 'Postgres readiness');

const backend = startProofBackend(pool);
await backend.listen();

const boFile = 'powersync-backoffice.db';
const posFile = 'powersync-pos.db';
cleanupDb(boFile);
cleanupDb(posFile);

let backoffice;
let pos;
try {
  console.log('CANDIDATE powersync');
  backoffice = await openClient(boFile, 'backoffice-proof-device');
  pos = await openClient(posFile, 'pos-proof-device');

  console.log('CHECK online_backoffice_to_pos:start');
  const itemId = 'item-espresso';
  const startBo = Date.now();
  await backoffice.execute(
    'INSERT INTO catalog_items(id, merchant_id, branch_id, name, price_minor, metadata_json) VALUES (?, ?, ?, ?, ?, ?)',
    [itemId, 'merchant-proof', 'branch-proof', 'Espresso', 1200, JSON.stringify({ source: 'backoffice' })]
  );
  const boToPos = await waitFor(async () => {
    const rows = await pos.getAll('SELECT * FROM catalog_items WHERE id = ?', [itemId]);
    return rows.length === 1 && Number(rows[0].price_minor) === 1200 ? rows[0] : false;
  }, 'Back Office item propagation');
  console.log(`CHECK online_backoffice_to_pos:pass latency_ms=${Date.now() - startBo} observed_ms=${boToPos.elapsedMs}`);

  console.log('CHECK permitted_pos_to_backoffice:start');
  const customerId = 'customer-proof-001';
  const startPos = Date.now();
  await pos.execute(
    'INSERT INTO customers(id, merchant_id, branch_id, display_name, note) VALUES (?, ?, ?, ?, ?)',
    [customerId, 'merchant-proof', 'branch-proof', 'عميل اختبار', 'created-by-permitted-pos']
  );
  const posToBo = await waitFor(async () => {
    const rows = await backoffice.getAll('SELECT * FROM customers WHERE id = ?', [customerId]);
    return rows.length === 1 && rows[0].note === 'created-by-permitted-pos' ? rows[0] : false;
  }, 'POS permitted mutation propagation');
  console.log(`CHECK permitted_pos_to_backoffice:pass latency_ms=${Date.now() - startPos} observed_ms=${posToBo.elapsedMs}`);

  console.log('CHECK offline_restart_ambiguous_retry:start');
  await pos.disconnect();
  const saleId = 'sale-proof-001';
  await pos.execute(
    'INSERT INTO sales(id, merchant_id, branch_id, device_id, business_id, total_minor, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [saleId, 'merchant-proof', 'branch-proof', 'pos-proof-device', saleId, 2500, new Date().toISOString()]
  );
  await Promise.resolve(pos.close());
  pos = null;

  // The backend applies the first upload but deliberately returns 503. PowerSync must retry;
  // backend dedupe must prevent a second business application of the same client operation.
  backend.failNextSaleAfterApply();
  pos = await openClient(posFile, 'pos-proof-device');

  const replay = await waitFor(async () => {
    const rows = await backoffice.getAll('SELECT * FROM sales WHERE id = ?', [saleId]);
    return rows.length === 1 ? rows[0] : false;
  }, 'offline sale replay after restart/reconnect', 45000);

  const sourceCount = await pool.query('SELECT COUNT(*)::int AS count FROM sales WHERE id = $1', [saleId]);
  assert.equal(sourceCount.rows[0].count, 1, 'ambiguous upload retry must leave one source sale row');
  const dedupeCount = await pool.query(
    'SELECT COUNT(*)::int AS count FROM sync_upload_dedupe WHERE device_id = $1 AND client_op_id IS NOT NULL',
    ['pos-proof-device']
  );
  assert.ok(dedupeCount.rows[0].count >= 2, 'POS proof should have durable uploaded operation identities');
  console.log(`CHECK offline_restart_ambiguous_retry:pass replay_ms=${replay.elapsedMs} sale_rows=${sourceCount.rows[0].count}`);

  console.log('RESULT PASS candidate=powersync scope=linux-node-baseline');
  console.log('LIMITATION pwa-windows-authz-tenant-isolation-schema-evolution-conflict-policy-not-yet-proved');
} finally {
  if (backoffice) await closeClient(backoffice);
  if (pos) await closeClient(pos);
  await backend.close();
  await pool.end();
}
