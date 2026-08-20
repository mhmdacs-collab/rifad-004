import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const APP_URL = process.env.RIFAD_WEB_APP_URL ?? 'http://127.0.0.1:4173';
const API_URL = process.env.RIFAD_PROOF_API_URL ?? 'http://127.0.0.1:8787';

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
    await sleep(100);
  }
  throw new Error(`${label} timed out${lastError ? `: ${lastError.message}` : ''}`);
}

async function api(path, options) {
  const response = await fetch(`${API_URL}${path}`, options);
  if (!response.ok) throw new Error(`${path} returned ${response.status}: ${await response.text()}`);
  return response.json();
}

async function waitPageReady(page) {
  await page.waitForFunction(() => window.rifadProof?.ready === true || Boolean(window.rifadProof?.error), null, { timeout: 60000 });
  const state = await page.evaluate(() => ({ ready: window.rifadProof?.ready, error: window.rifadProof?.error }));
  assert.equal(state.error, null, `browser client initialization error: ${state.error}`);
  assert.equal(state.ready, true, 'browser proof client must become ready');
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
let page = await context.newPage();
page.on('console', (message) => console.log(`BROWSER_CONSOLE ${message.type()} ${message.text()}`));
page.on('pageerror', (error) => console.error('BROWSER_PAGE_ERROR', error));

try {
  console.log('CANDIDATE powersync-web chromium');
  await page.goto(APP_URL, { waitUntil: 'domcontentloaded' });
  await waitPageReady(page);

  console.log('CHECK source_to_pwa:start');
  const itemId = 'item-web-espresso';
  await api('/control/item', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ id: itemId, name: 'Web Espresso', priceMinor: 1350, metadata: { proof: 'pwa' } })
  });
  const sourceToPwa = await waitFor(async () => {
    const item = await page.evaluate((id) => window.rifadProof.getItem(id), itemId);
    return item?.name === 'Web Espresso' && Number(item.price_minor) === 1350 ? item : false;
  }, 'source item propagation to browser');
  console.log(`CHECK source_to_pwa:pass latency_ms=${sourceToPwa.elapsedMs}`);

  console.log('CHECK pwa_to_source:start');
  const onlineSaleId = 'sale-web-online';
  await page.evaluate(({ id, totalMinor }) => window.rifadProof.insertSale({ id, totalMinor }), {
    id: onlineSaleId,
    totalMinor: 3100
  });
  const pwaToSource = await waitFor(async () => {
    const result = await api(`/control/sale/${encodeURIComponent(onlineSaleId)}`);
    return result.row?.business_id === onlineSaleId ? result.row : false;
  }, 'browser sale upload to source');
  console.log(`CHECK pwa_to_source:pass latency_ms=${pwaToSource.elapsedMs}`);

  console.log('CHECK pwa_offline_reload_retry:start');
  const offlineSaleId = 'sale-web-offline-restart';
  await page.evaluate(() => window.rifadProof.disconnect());
  await page.evaluate(({ id, totalMinor }) => window.rifadProof.insertSale({ id, totalMinor }), {
    id: offlineSaleId,
    totalMinor: 4200
  });
  const beforeClose = await page.evaluate((id) => window.rifadProof.getSale(id), offlineSaleId);
  assert.equal(beforeClose?.business_id, offlineSaleId, 'offline browser sale must exist locally before page close');

  await api('/control/fail-next-sale', { method: 'POST' });
  await page.close();

  page = await context.newPage();
  page.on('console', (message) => console.log(`BROWSER_CONSOLE ${message.type()} ${message.text()}`));
  page.on('pageerror', (error) => console.error('BROWSER_PAGE_ERROR', error));
  await page.goto(APP_URL, { waitUntil: 'domcontentloaded' });
  await waitPageReady(page);

  const afterReloadLocal = await page.evaluate((id) => window.rifadProof.getSale(id), offlineSaleId);
  assert.equal(afterReloadLocal?.business_id, offlineSaleId, 'browser local database must survive page close/reopen');

  const replay = await waitFor(async () => {
    const result = await api(`/control/sale/${encodeURIComponent(offlineSaleId)}`);
    return result.count === 1 && result.row?.business_id === offlineSaleId ? result : false;
  }, 'offline browser sale replay after reopen');

  const attempts = await waitFor(async () => {
    const result = await api(`/control/attempts?device=pwa-proof-device&id=${encodeURIComponent(offlineSaleId)}`);
    return result.maxAttempts >= 2 ? result : false;
  }, 'ambiguous browser upload retry');
  assert.equal(replay.value.count, 1, 'ambiguous browser retry must leave one source sale row');
  console.log(`CHECK pwa_offline_reload_retry:pass replay_ms=${replay.elapsedMs} attempts=${attempts.value.maxAttempts} sale_rows=1`);

  console.log('RESULT PASS candidate=powersync-web scope=chromium-browser-baseline');
  console.log('LIMITATION service-worker-cold-offline-launch-ios-safari-windows-packaged-authz-tenant-isolation-schema-evolution-not-yet-proved');
} finally {
  await context.close();
  await browser.close();
}
