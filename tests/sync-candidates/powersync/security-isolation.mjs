import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { rmSync } from 'node:fs';
import { SignJWT, jwtVerify } from 'jose';
import pg from 'pg';
import { PowerSyncDatabase, Schema, Table, column } from '@powersync/node';

const { Pool } = pg;
const POWERSYNC_URL = process.env.POWERSYNC_URL ?? 'http://127.0.0.1:8080';
const PG_URL = process.env.PG_URL ?? 'postgresql://postgres:changeme@127.0.0.1:5432/postgres';
const AUTH_KEY = process.env.PS_CLIENT_AUTH_KEY ?? 'ZGV2LXNoYXJlZC1zZWNyZXQtZm9yLWRlbW8tb25seS0zMmI';
const API_PORT = Number(process.env.RIFAD_SECURITY_API_PORT ?? 8788);
const signingKey = Buffer.from(AUTH_KEY, 'base64url');

const schema = new Schema({
  catalog_items: new Table({
    merchant_id: column.text,
    branch_id: column.text,
    name: column.text,
    price_minor: column.integer,
    metadata_json: column.text,
    kitchen_label: column.text
  })
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function waitFor(getter, label, timeoutMs = 30000) {
  const started = Date.now();
  let lastError;
  while (Date.now() - started < timeoutMs) {
    try {
      const value = await getter();
      if (value) return value;
    } catch (error) {
      lastError = error;
    }
    await sleep(100);
  }
  throw new Error(`${label} timed out${lastError ? `: ${lastError.message}` : ''}`);
}

async function createToken({ subject, merchantId, branchId, role = 'cashier' }) {
  return new SignJWT({
    role,
    merchant_id: merchantId,
    branch_id: branchId
  })
    .setProtectedHeader({ alg: 'HS256', kid: 'dev-key-1' })
    .setSubject(subject)
    .setAudience(POWERSYNC_URL)
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(signingKey);
}

class ScopedReadConnector {
  constructor(scope) {
    this.scope = scope;
  }

  async fetchCredentials() {
    return {
      endpoint: POWERSYNC_URL,
      token: await createToken(this.scope)
    };
  }

  async uploadData() {
    throw new Error('download isolation clients are read-only in this proof');
  }
}

function cleanup(filename) {
  for (const suffix of ['', '-wal', '-shm', '-journal']) rmSync(`${filename}${suffix}`, { force: true });
}

async function openScopedClient(filename, scope) {
  cleanup(filename);
  const db = new PowerSyncDatabase({ database: { dbFilename: filename }, schema });
  await db.init();
  await db.connect(new ScopedReadConnector(scope));
  await db.waitForFirstSync();
  return db;
}

async function closeClient(db) {
  await db.disconnect();
  await Promise.resolve(db.close());
}

function json(res, status, value) {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(value));
}

async function readJson(req) {
  let body = '';
  for await (const chunk of req) body += chunk;
  return JSON.parse(body || '{}');
}

async function authenticate(req) {
  const header = String(req.headers.authorization ?? '');
  if (!header.startsWith('Bearer ')) {
    const error = new Error('missing bearer token');
    error.status = 401;
    throw error;
  }
  const { payload } = await jwtVerify(header.slice(7), signingKey, {
    audience: POWERSYNC_URL,
    algorithms: ['HS256']
  });
  if (!payload.merchant_id || !payload.branch_id) {
    const error = new Error('missing merchant/branch scope');
    error.status = 403;
    throw error;
  }
  return payload;
}

function startSecureUploadApi(pool) {
  const server = createServer(async (req, res) => {
    if (req.method !== 'POST' || req.url !== '/catalog-item') {
      json(res, 404, { error: 'not found' });
      return;
    }

    try {
      const auth = await authenticate(req);
      const item = await readJson(req);
      if (item.merchantId !== auth.merchant_id || item.branchId !== auth.branch_id) {
        const error = new Error('scope mismatch');
        error.status = 403;
        throw error;
      }
      if (!['owner', 'manager'].includes(String(auth.role))) {
        const error = new Error('catalog mutation permission denied');
        error.status = 403;
        throw error;
      }

      await pool.query(
        `INSERT INTO catalog_items(id, merchant_id, branch_id, name, price_minor, metadata_json, kitchen_label)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           price_minor = EXCLUDED.price_minor,
           metadata_json = EXCLUDED.metadata_json,
           kitchen_label = EXCLUDED.kitchen_label
         WHERE catalog_items.merchant_id = EXCLUDED.merchant_id
           AND catalog_items.branch_id = EXCLUDED.branch_id`,
        [item.id, item.merchantId, item.branchId, item.name, item.priceMinor, '{}', item.kitchenLabel ?? null]
      );
      json(res, 200, { ok: true });
    } catch (error) {
      json(res, Number(error.status ?? 500), { error: error.message });
    }
  });

  return {
    async listen() {
      await new Promise((resolve) => server.listen(API_PORT, '127.0.0.1', resolve));
    },
    async close() {
      await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    }
  };
}

const scopeA1 = { subject: 'user-a1', merchantId: 'merchant-A', branchId: 'branch-1', role: 'manager' };
const scopeA2 = { subject: 'user-a2', merchantId: 'merchant-A', branchId: 'branch-2', role: 'manager' };
const scopeB1 = { subject: 'user-b1', merchantId: 'merchant-B', branchId: 'branch-1', role: 'manager' };
const pool = new Pool({ connectionString: PG_URL });
const uploadApi = startSecureUploadApi(pool);
let clientA1;
let clientA2;
let clientB1;

try {
  await uploadApi.listen();

  await pool.query('DELETE FROM catalog_items WHERE id LIKE $1', ['security-%']);
  await pool.query(
    `INSERT INTO catalog_items(id, merchant_id, branch_id, name, price_minor, metadata_json, kitchen_label)
     VALUES
       ('security-a1', 'merchant-A', 'branch-1', 'A1 Item', 1000, '{}', 'A1'),
       ('security-a2', 'merchant-A', 'branch-2', 'A2 Item', 1100, '{}', 'A2'),
       ('security-b1', 'merchant-B', 'branch-1', 'B1 Item', 1200, '{}', 'B1')`
  );

  console.log('CHECK signed_claim_download_isolation:start');
  clientA1 = await openScopedClient('powersync-security-a1.db', scopeA1);
  clientA2 = await openScopedClient('powersync-security-a2.db', scopeA2);
  clientB1 = await openScopedClient('powersync-security-b1.db', scopeB1);

  await waitFor(async () => (await clientA1.getAll('SELECT id FROM catalog_items WHERE id = ?', ['security-a1'])).length === 1, 'A1 own row');
  await waitFor(async () => (await clientA2.getAll('SELECT id FROM catalog_items WHERE id = ?', ['security-a2'])).length === 1, 'A2 own row');
  await waitFor(async () => (await clientB1.getAll('SELECT id FROM catalog_items WHERE id = ?', ['security-b1'])).length === 1, 'B1 own row');

  assert.equal((await clientA1.getAll("SELECT id FROM catalog_items WHERE id IN ('security-a2','security-b1')")).length, 0, 'A1 must not receive another branch or merchant');
  assert.equal((await clientA2.getAll("SELECT id FROM catalog_items WHERE id IN ('security-a1','security-b1')")).length, 0, 'A2 must not receive another branch or merchant');
  assert.equal((await clientB1.getAll("SELECT id FROM catalog_items WHERE id IN ('security-a1','security-a2')")).length, 0, 'B1 must not receive another merchant');
  console.log('CHECK signed_claim_download_isolation:pass merchant=true branch=true');

  console.log('CHECK server_mutation_authorization:start');
  const managerToken = await createToken(scopeA1);
  const cashierToken = await createToken({ ...scopeA1, subject: 'cashier-a1', role: 'cashier' });

  const allowedResponse = await fetch(`http://127.0.0.1:${API_PORT}/catalog-item`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${managerToken}` },
    body: JSON.stringify({ id: 'security-authorized', merchantId: 'merchant-A', branchId: 'branch-1', name: 'Authorized', priceMinor: 1300 })
  });
  assert.equal(allowedResponse.status, 200, 'manager in matching scope should mutate catalog');

  const crossMerchantResponse = await fetch(`http://127.0.0.1:${API_PORT}/catalog-item`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${managerToken}` },
    body: JSON.stringify({ id: 'security-cross-merchant', merchantId: 'merchant-B', branchId: 'branch-1', name: 'Blocked', priceMinor: 1 })
  });
  assert.equal(crossMerchantResponse.status, 403, 'signed token must not mutate another merchant');

  const crossBranchResponse = await fetch(`http://127.0.0.1:${API_PORT}/catalog-item`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${managerToken}` },
    body: JSON.stringify({ id: 'security-cross-branch', merchantId: 'merchant-A', branchId: 'branch-2', name: 'Blocked', priceMinor: 1 })
  });
  assert.equal(crossBranchResponse.status, 403, 'signed token must not mutate another branch');

  const permissionResponse = await fetch(`http://127.0.0.1:${API_PORT}/catalog-item`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${cashierToken}` },
    body: JSON.stringify({ id: 'security-cashier-denied', merchantId: 'merchant-A', branchId: 'branch-1', name: 'Blocked', priceMinor: 1 })
  });
  assert.equal(permissionResponse.status, 403, 'cashier without catalog permission must be denied');

  const unauthorizedRows = await pool.query("SELECT id FROM catalog_items WHERE id IN ('security-cross-merchant','security-cross-branch','security-cashier-denied')");
  assert.equal(unauthorizedRows.rowCount, 0, 'denied mutations must leave no source rows');
  console.log('CHECK server_mutation_authorization:pass signed_scope=true role_permission=true denied_writes=0');

  console.log('RESULT PASS candidate=powersync scope=tenant-branch-authz-baseline');
} finally {
  if (clientA1) await closeClient(clientA1);
  if (clientA2) await closeClient(clientA2);
  if (clientB1) await closeClient(clientB1);
  await uploadApi.close();
  await pool.end();
}
