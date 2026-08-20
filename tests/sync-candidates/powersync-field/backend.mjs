import { createServer } from 'node:http';
import { SignJWT } from 'jose';
import pg from 'pg';

const { Pool } = pg;

const POWERSYNC_URL = process.env.POWERSYNC_URL ?? 'http://127.0.0.1:8080';
const PG_URL = process.env.PG_URL ?? 'postgresql://postgres:changeme@127.0.0.1:5432/postgres';
const AUTH_KEY = process.env.PS_CLIENT_AUTH_KEY ?? 'ZGV2LXNoYXJlZC1zZWNyZXQtZm9yLWRlbW8tb25seS0zMmI';
const PORT = Number(process.env.RIFAD_PROOF_API_PORT ?? 8787);
const BIND_HOST = process.env.RIFAD_BIND_HOST ?? '0.0.0.0';

const pool = new Pool({ connectionString: PG_URL });
const uploadAttempts = new Map();
let failAfterApplyingNextSale = false;

const allowedColumns = {
  catalog_items: new Set(['merchant_id', 'branch_id', 'name', 'price_minor', 'metadata_json']),
  sales: new Set(['merchant_id', 'branch_id', 'device_id', 'business_id', 'total_minor', 'completed_at'])
};

async function token() {
  return new SignJWT({ role: 'authenticated' })
    .setProtectedHeader({ alg: 'HS256', kid: 'dev-key-1' })
    .setSubject('rifad-field-proof')
    .setAudience(POWERSYNC_URL)
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(Buffer.from(AUTH_KEY, 'base64url'));
}

function cors(res) {
  res.setHeader('access-control-allow-origin', '*');
  res.setHeader('access-control-allow-methods', 'GET,POST,OPTIONS');
  res.setHeader('access-control-allow-headers', 'content-type,x-rifad-device');
  res.setHeader('cache-control', 'no-store');
}

function json(res, status, value) {
  cors(res);
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(value));
}

async function readJson(req) {
  let body = '';
  for await (const chunk of req) body += chunk;
  return JSON.parse(body || '{}');
}

async function applyCrud(deviceId, crud) {
  const client = await pool.connect();
  let containsSale = false;

  try {
    await client.query('BEGIN');

    for (const op of crud) {
      const table = String(op.table);
      const columnsForTable = allowedColumns[table];
      if (!columnsForTable) throw new Error(`unexpected table ${table}`);
      containsSale ||= table === 'sales';

      const clientOpId = String(op.clientId ?? `${table}:${op.id}:${op.op}:${JSON.stringify(op.opData ?? {})}`);
      const attemptKey = `${deviceId}:${table}:${op.id}:${clientOpId}`;
      uploadAttempts.set(attemptKey, (uploadAttempts.get(attemptKey) ?? 0) + 1);

      const dedupe = await client.query(
        'INSERT INTO sync_upload_dedupe(device_id, client_op_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING client_op_id',
        [deviceId, clientOpId]
      );
      if (dedupe.rowCount === 0) continue;

      const operation = String(op.op).toUpperCase();
      if (operation === 'DELETE') {
        await client.query(`DELETE FROM ${table} WHERE id = $1`, [op.id]);
        continue;
      }

      const data = { ...(op.opData ?? {}) };
      const keys = Object.keys(data).filter((key) => columnsForTable.has(key));

      if (operation === 'PATCH') {
        if (keys.length === 0) continue;
        const assignments = keys.map((key, index) => `${key} = $${index + 2}`).join(', ');
        await client.query(`UPDATE ${table} SET ${assignments} WHERE id = $1`, [op.id, ...keys.map((key) => data[key])]);
        continue;
      }

      if (keys.length === 0) throw new Error(`empty put payload for ${table}:${op.id}`);
      const insertColumns = ['id', ...keys];
      const values = [op.id, ...keys.map((key) => data[key])];
      const params = values.map((_, index) => `$${index + 1}`).join(', ');
      const updates = keys.map((key) => `${key} = EXCLUDED.${key}`).join(', ');

      await client.query(
        `INSERT INTO ${table} (${insertColumns.join(', ')}) VALUES (${params}) ON CONFLICT (id) DO UPDATE SET ${updates}`,
        values
      );
    }

    await client.query('COMMIT');
    return { containsSale };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

const server = createServer(async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') {
    res.writeHead(204).end();
    return;
  }

  try {
    if (req.method === 'GET' && req.url === '/health') {
      await pool.query('SELECT 1');
      json(res, 200, { ok: true, powersyncEndpoint: POWERSYNC_URL });
      return;
    }

    if (req.method === 'GET' && req.url === '/token') {
      json(res, 200, { endpoint: POWERSYNC_URL, token: await token() });
      return;
    }

    if (req.method === 'POST' && req.url === '/sync-batch') {
      const deviceId = String(req.headers['x-rifad-device'] ?? 'unknown-device');
      const { crud = [] } = await readJson(req);
      const { containsSale } = await applyCrud(deviceId, crud);

      if (containsSale && failAfterApplyingNextSale) {
        failAfterApplyingNextSale = false;
        json(res, 503, { applied: true, acknowledged: false, reason: 'intentional ambiguous field-proof failure' });
        return;
      }

      json(res, 200, { ok: true });
      return;
    }

    if (req.method === 'POST' && req.url === '/control/item') {
      const item = await readJson(req);
      await pool.query(
        `INSERT INTO catalog_items(id, merchant_id, branch_id, name, price_minor, metadata_json)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           price_minor = EXCLUDED.price_minor,
           metadata_json = EXCLUDED.metadata_json`,
        [
          item.id,
          'merchant-proof',
          'branch-proof',
          item.name,
          Number(item.priceMinor),
          JSON.stringify(item.metadata ?? {})
        ]
      );
      json(res, 200, { ok: true, id: item.id });
      return;
    }

    if (req.method === 'POST' && req.url === '/control/fail-next-sale') {
      failAfterApplyingNextSale = true;
      json(res, 200, { ok: true });
      return;
    }

    if (req.method === 'GET' && req.url?.startsWith('/control/sale/')) {
      const id = decodeURIComponent(req.url.slice('/control/sale/'.length));
      const result = await pool.query('SELECT * FROM sales WHERE id = $1', [id]);
      json(res, 200, { row: result.rows[0] ?? null, count: result.rowCount });
      return;
    }

    if (req.method === 'GET' && req.url?.startsWith('/control/attempts')) {
      const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
      const device = url.searchParams.get('device') ?? '';
      const id = url.searchParams.get('id') ?? '';
      const prefix = `${device}:sales:${id}:`;
      const matching = [...uploadAttempts.entries()]
        .filter(([key]) => key.startsWith(prefix))
        .map(([, count]) => count);
      json(res, 200, { maxAttempts: matching.length ? Math.max(...matching) : 0 });
      return;
    }

    if (req.method === 'GET' && req.url === '/control/source-summary') {
      const [items, sales] = await Promise.all([
        pool.query('SELECT id, name, price_minor FROM catalog_items ORDER BY id DESC LIMIT 20'),
        pool.query('SELECT id, device_id, total_minor, completed_at FROM sales ORDER BY completed_at DESC LIMIT 20')
      ]);
      json(res, 200, { items: items.rows, sales: sales.rows });
      return;
    }

    json(res, 404, { error: 'not found' });
  } catch (error) {
    json(res, 500, { error: error instanceof Error ? error.message : String(error) });
  }
});

server.listen(PORT, BIND_HOST, () => {
  console.log(`RIFAD_FIELD_BACKEND_READY host=${BIND_HOST} port=${PORT} powersync=${POWERSYNC_URL}`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, async () => {
    server.close();
    await pool.end();
    process.exit(0);
  });
}
