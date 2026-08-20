import { PowerSyncDatabase, Schema, Table, column } from '@powersync/web';

const params = new URLSearchParams(location.search);
const requestedDevice = params.get('device');
const storedDevice = localStorage.getItem('rifad-field-device');
const DEVICE_ID = (requestedDevice || storedDevice || `browser-${Math.random().toString(16).slice(2, 8)}`).replace(/[^a-zA-Z0-9_-]/g, '-');
localStorage.setItem('rifad-field-device', DEVICE_ID);

const API_URL = `${location.protocol}//${location.hostname}:8787`;

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

class FieldBrowserConnector {
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

    if (!response.ok) throw new Error(`upload rejected: ${response.status} ${await response.text()}`);
    await batch.complete();
  }
}

const db = new PowerSyncDatabase({
  schema,
  database: { dbFilename: `rifad-field-${DEVICE_ID}.sqlite` }
});

const el = (id) => document.getElementById(id);
const setStatus = (text) => { el('status').textContent = text; };
const makeId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`;

async function refreshLocal() {
  const [items, sales] = await Promise.all([
    db.getAll('SELECT id, name, price_minor FROM catalog_items ORDER BY id DESC LIMIT 20'),
    db.getAll('SELECT id, device_id, total_minor, completed_at FROM sales ORDER BY completed_at DESC LIMIT 20')
  ]);

  el('items').innerHTML = items.length
    ? items.map((item) => `<li><code>${item.id}</code> — ${item.name} — ${(Number(item.price_minor) / 100).toFixed(2)}</li>`).join('')
    : '<li>لا توجد أصناف بعد</li>';

  el('sales').innerHTML = sales.length
    ? sales.map((sale) => `<li><code>${sale.id}</code> — ${(Number(sale.total_minor) / 100).toFixed(2)} — ${sale.device_id}</li>`).join('')
    : '<li>لا توجد مبيعات بعد</li>';
}

async function connect() {
  setStatus('جارٍ الاتصال...');
  await db.connect(new FieldBrowserConnector());
  await db.waitForFirstSync();
  setStatus('متصل والمزامنة تلقائية');
  await refreshLocal();
}

async function disconnect() {
  await db.disconnect();
  setStatus('المزامنة متوقفة محليًا — يمكن إنشاء بيع Offline');
}

el('device').innerHTML = `الجهاز: <code>${DEVICE_ID}</code>`;
el('endpoint').textContent = `API: ${API_URL}`;

db.registerListener({
  statusChanged(status) {
    const uploadError = status.dataFlowStatus?.uploadError;
    const downloadError = status.dataFlowStatus?.downloadError;
    if (uploadError || downloadError) {
      setStatus(`مشكلة اتصال/مزامنة: ${uploadError?.message ?? downloadError?.message ?? 'غير معروف'}`);
      return;
    }
    if (status.connected) {
      setStatus(status.hasSynced ? 'متصل والمزامنة تلقائية' : 'متصل — جارٍ أول Sync');
    }
    refreshLocal().catch(() => {});
  }
});

el('disconnect').addEventListener('click', () => disconnect().catch((error) => setStatus(error.message)));
el('reconnect').addEventListener('click', () => connect().catch((error) => setStatus(error.message)));
el('refresh').addEventListener('click', () => refreshLocal().catch((error) => setStatus(error.message)));

el('source-item').addEventListener('click', async () => {
  try {
    const id = makeId('field-item');
    const response = await fetch(`${API_URL}/control/item`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        id,
        name: `صنف اختبار ${new Date().toLocaleTimeString('ar-SA')}`,
        priceMinor: 1250,
        metadata: { source: 'field-browser-control' }
      })
    });
    if (!response.ok) throw new Error(await response.text());
    el('source-result').textContent = `تم إرسال الصنف ${id}. انتظر ظهوره تلقائيًا على كل الأجهزة.`;
  } catch (error) {
    el('source-result').textContent = `فشل: ${error.message}`;
  }
});

el('local-sale').addEventListener('click', async () => {
  try {
    const id = makeId('field-sale');
    await db.execute(
      'INSERT INTO sales(id, merchant_id, branch_id, device_id, business_id, total_minor, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, 'merchant-proof', 'branch-proof', DEVICE_ID, id, 2500, new Date().toISOString()]
    );
    setStatus(`تم حفظ البيع محليًا: ${id}`);
    await refreshLocal();
  } catch (error) {
    setStatus(`فشل البيع المحلي: ${error.message}`);
  }
});

el('source-summary').addEventListener('click', async () => {
  try {
    const response = await fetch(`${API_URL}/control/source-summary`);
    if (!response.ok) throw new Error(await response.text());
    el('summary').textContent = JSON.stringify(await response.json(), null, 2);
  } catch (error) {
    el('summary').textContent = `ERROR: ${error.message}`;
  }
});

try {
  await db.init();
  await connect();
} catch (error) {
  console.error(error);
  setStatus(`تعذر بدء العميل: ${error instanceof Error ? error.message : String(error)}`);
}
