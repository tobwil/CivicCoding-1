import { test } from 'node:test';
import assert from 'node:assert/strict';
import gate, { config } from '../netlify/edge-functions/password-gate.ts';

test('Netlify password gate fails closed and covers all paths', async () => {
  assert.equal(config.path, '/*');
  assert.equal(config.onError, 'fail');
  globalThis.Netlify = { env: { get: () => undefined } };
  const response = await gate(new Request('https://example.test/'), { next: () => { throw Error('Must not reach app'); } });
  assert.equal(response.status, 503);
});

test('Missing, malformed, incorrect and wrong-user credentials never reach the app', async () => {
  globalThis.Netlify = { env: { get: () => 'test-fixture-only' } };
  for (const path of ['/', '/api/coach', '/_next/static/app.js', '/.netlify/functions/server']) {
    for (const authorization of ['', 'Bearer token', 'Basic !!!', `Basic ${btoa('alba:wrong')}`, `Basic ${btoa('other:test-fixture-only')}`]) {
      const response = await gate(new Request(`https://example.test${path}`, { method: 'POST', headers: { authorization } }), { next: () => { throw Error('Must not reach app'); } });
      assert.equal(response.status, 401);
      assert.match(response.headers.get('WWW-Authenticate'), /^Basic /);
      assert.match(response.headers.get('Cache-Control'), /no-store/);
    }
  }
});

test('Valid login preserves streamed application responses without public caching', async () => {
  globalThis.Netlify = { env: { get: () => 'test-fixture-only' } };
  const request = new Request('https://example.test/api/coach', { headers: { authorization: `Basic ${btoa('alba:test-fixture-only')}` } });
  const response = await gate(request, { next: async () => new Response('chunk\n', { status: 202, headers: { 'Content-Type': 'application/x-ndjson' } }) });
  assert.equal(response.status, 202);
  assert.equal(response.headers.get('Content-Type'), 'application/x-ndjson');
  assert.equal(response.headers.get('Netlify-CDN-Cache-Control'), 'no-store');
  assert.equal(await response.text(), 'chunk\n');
});
