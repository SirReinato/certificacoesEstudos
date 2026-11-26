import assert from 'node:assert/strict';
import test from 'node:test';
import worker from '../server/worker-ai.mjs';

const request = (token) => new Request('https://safezone.francalabs.dev/api/ai/gemini', {
  method: 'POST',
  headers: token ? { Authorization: `Bearer ${token}` } : {},
  body: JSON.stringify({ model: 'gemini-3.1-flash-lite', prompt: 'Gere questões de estudo.' })
});

test('recusa requisição sem sessão antes de chamar um provedor', async () => {
  const response = await worker.fetch(request(), {});
  assert.equal(response.status, 401);
});

test('valida o JWT no Supabase e usa a chave Gemini apenas no servidor', async (t) => {
  const fetchMock = t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(options.redirect, 'manual');
    if (String(url).endsWith('/auth/v1/user')) {
      assert.equal(options.headers.Authorization, 'Bearer header.payload.signature');
      return Response.json({ id: 'study-user', email: 'Owner@example.com', email_confirmed_at: '2026-11-26' });
    }
    assert.equal(new URL(url).hostname, 'generativelanguage.googleapis.com');
    assert.equal(options.headers['x-goog-api-key'], 'fixture-secret');
    assert.equal(new URL(url).search, '');
    return Response.json({ candidates: [{ content: { parts: [{ text: '{"studyGuide":[],"flashcards":[]}' }] } }] });
  });
  const response = await worker.fetch(request('header.payload.signature'), {
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_ANON_KEY: 'publishable-fixture',
    GEMINI_API_KEY: 'fixture-secret',
    AI_ALLOWED_EMAILS: ' other@example.com, owner@example.com ',
    AI_RATE_LIMIT: { limit: async () => ({ success: true }) },
  });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { text: '{"studyGuide":[],"flashcards":[]}' });
  assert.equal(fetchMock.mock.callCount(), 2);
});

for (const [scenario, user, allowedEmails] of [
  ['e-mail fora da lista', { id: 'new-user', email: 'new@example.com', email_confirmed_at: '2026-11-26' }, 'owner@example.com'],
  ['e-mail ainda não verificado', { id: 'new-user', email: 'owner@example.com' }, 'owner@example.com'],
  ['lista não configurada', { id: 'new-user', email: 'owner@example.com', email_confirmed_at: '2026-11-26' }, undefined],
]) {
  test(`bloqueia ambas as rotas com ${scenario} antes de consumir a cota`, async (t) => {
    const fetchMock = t.mock.method(globalThis, 'fetch', async () => Response.json(user));
    const env = {
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_ANON_KEY: 'publishable-fixture',
      AI_ALLOWED_EMAILS: allowedEmails,
      GEMINI_API_KEY: 'fixture-secret',
      NVIDIA_API_KEY: 'fixture-secret',
    };
    for (const provider of ['gemini', 'nvidia']) {
      const input = new Request(`https://safezone.francalabs.dev/api/ai/${provider}`, {
        method: 'POST',
        headers: { Authorization: 'Bearer header.payload.signature' },
      });
      assert.equal((await worker.fetch(input, env)).status, 403);
    }
    assert.equal(fetchMock.mock.callCount(), 2);
  });
}
