const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(process.argv[2] || path.join(__dirname, 'sw.js'), 'utf8');
const handlers = {};
const stale = new Response(JSON.stringify({ status: 'LIVE', active: true, data: [{ id: 'stale-storm' }] }));
const requests = [];
const deleted = [];
let cacheReads = 0;
let cacheWrites = 0;
let skipWaiting = 0;
let mode = 'offline';
const caches = {
  keys: async () => ['cyclone-ai-static-v1', 'cyclone-ai-dynamic-v1', 'cyclone-ai-offline-v1', 'cyclone-ai-static-v2'],
  delete: async name => { deleted.push(name); return true; },
  open: async () => ({
    // Deliberately offer a valid old LIVE response to any cache lookup.
    match: async () => { cacheReads++; return stale.clone(); },
    put: async () => { cacheWrites++; },
    addAll: async () => { throw new Error('optional icon missing'); },
  }),
};
vm.runInNewContext(source, {
  self: {
    addEventListener: (name, handler) => { handlers[name] = handler; },
    skipWaiting: async () => { skipWaiting++; },
    clients: { claim: async () => {} },
  },
  caches, URL, Response, console,
  fetch: async (request, options) => {
    requests.push({ request, options });
    if (mode === 'offline') throw new TypeError('Failed to fetch');
    return new Response(JSON.stringify({ status: 'REPLAY', active: true, data: [{ id: 'current-case' }] }), {
      status: mode === 'server-error' ? 409 : 200,
      headers: { 'Content-Type': 'application/json' },
    });
  },
}, { filename: 'sw.js' });

function fetchEvent(url, destination = '') {
  let response;
  handlers.fetch({ request: { url, method: 'GET', destination }, respondWith: promise => { response = promise; } });
  assert.ok(response, `SW must handle ${url}`);
  return response;
}

(async () => {
  const failed = await fetchEvent('http://127.0.0.1:8000/api/cyclone/active');
  assert.equal(failed.status, 503);
  assert.equal(failed.headers.get('Cache-Control'), 'no-store');
  const unavailable = await failed.json();
  assert.equal(unavailable.status, 'OFFLINE');
  assert.equal(unavailable.unavailable, true);
  assert.equal(unavailable.active, false);
  assert.deepEqual(unavailable.data, []);
  assert.equal(cacheReads, 0, 'Failed API request must never read old LIVE cache data');

  mode = 'online';
  const fresh = await fetchEvent('http://127.0.0.1:8000/api/cyclone/active');
  assert.equal((await fresh.json()).data[0].id, 'current-case');
  assert.equal(cacheWrites, 0, 'Current API responses must not enter the SW cache');

  mode = 'server-error';
  assert.equal((await fetchEvent('http://127.0.0.1:8000/api/cyclone/ACTIVE/predictions')).status, 409, 'Preserve real API error status');

  mode = 'online';
  await fetchEvent('http://127.0.0.1:3000/src/pages/DataForecast.tsx?t=123', 'script');
  await fetchEvent('http://127.0.0.1:3000/@vite/client', 'script');
  assert.equal(cacheReads, 0, 'Dev modules must not read stable-URL cached code');
  assert.equal(cacheWrites, 0, 'Dev modules must not be cached');
  assert.ok(requests.every(call => call.options?.cache === 'no-store'), 'API and dev requests must bypass HTTP cache');

  let activation;
  handlers.activate({ waitUntil: promise => { activation = promise; } });
  await activation;
  assert.deepEqual(deleted.sort(), ['cyclone-ai-dynamic-v1', 'cyclone-ai-offline-v1', 'cyclone-ai-static-v1']);

  let installation;
  handlers.install({ waitUntil: promise => { installation = promise; } });
  await installation;
  assert.equal(skipWaiting, 1, 'A missing optional asset must not block freshness-policy installation');
  console.log('PASS: unavailable API cannot be masked by cached LIVE data; fresh/error responses, no-store dev assets, cache invalidation and install fallback verified.');
})().catch(error => { console.error(error); process.exitCode = 1; });
