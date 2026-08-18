import { PowerSyncDatabase, Schema, Table, column } from '@powersync/web';

const API_URL = 'http://127.0.0.1:8787';

const AppSchema = new Schema({
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

class BrowserProofConnector {
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
        'x-rifad-device': 'pwa-proof-device'
      },
      body: JSON.stringify({ crud })
    });
    if (!response.ok) {
      throw new Error(`upload rejected: ${response.status} ${await response.text()}`);
    }
    await batch.complete();
  }
}

const db = new PowerSyncDatabase({
  schema: AppSchema,
  database: { dbFilename: 'rifad-pwa-proof.sqlite' }
});

const status = document.getElementById('status');
window.rifadProof = { ready: false, error: null };

try {
  await db.init();
  await db.connect(new BrowserProofConnector());
  await db.waitForFirstSync();

  Object.assign(window.rifadProof, {
    ready: true,
    async getItem(id) {
      const rows = await db.getAll('SELECT * FROM catalog_items WHERE id = ?', [id]);
      return rows[0] ?? null;
    },
    async disconnect() {
      await db.disconnect();
      return true;
    },
    async insertSale({ id, totalMinor }) {
      await db.execute(
        'INSERT INTO sales(id, merchant_id, branch_id, device_id, business_id, total_minor, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, 'merchant-proof', 'branch-proof', 'pwa-proof-device', id, totalMinor, new Date().toISOString()]
      );
      return id;
    },
    async getSale(id) {
      const rows = await db.getAll('SELECT * FROM sales WHERE id = ?', [id]);
      return rows[0] ?? null;
    }
  });
  status.textContent = 'ready';
} catch (error) {
  window.rifadProof.error = error instanceof Error ? error.message : String(error);
  status.textContent = `error:${window.rifadProof.error}`;
  console.error(error);
}
