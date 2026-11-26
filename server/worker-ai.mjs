const responseError = (status, error, headers = {}) =>
  Response.json({ error }, { status, headers: { 'Cache-Control': 'no-store', ...headers } });

async function readInput(request) {
  if (!request.body) return null;
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let text = '';
  let bytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > 65_536) {
      await reader.cancel();
      return null;
    }
    text += decoder.decode(value, { stream: true });
  }
  return JSON.parse(text + decoder.decode());
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    const provider = pathname === '/api/ai/gemini' ? 'gemini'
      : pathname === '/api/ai/nvidia' ? 'nvidia' : null;
    if (!provider) return responseError(404, 'Rota de IA inexistente.');
    if (request.method !== 'POST') return responseError(405, 'Use POST.', { Allow: 'POST' });

    const Authorization = request.headers.get('Authorization');
    if (!/^Bearer [A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(Authorization ?? '')) return responseError(401, 'Entre no SafeZone para usar a IA.');

    try {
      const auth = await fetch(new URL('/auth/v1/user', env.SUPABASE_URL).href, {
        headers: { Authorization, apikey: env.SUPABASE_ANON_KEY },
        redirect: 'manual',
        signal: AbortSignal.timeout(8000),
      });
      if (auth.status === 401 || auth.status === 403) return responseError(401, 'Sessão inválida ou expirada.');
      if (!auth.ok) return responseError(503, 'Não foi possível validar a sessão.');
      const { id } = await auth.json();
      if (!id) return responseError(401, 'Sessão inválida ou expirada.');
      const { success } = await env.AI_RATE_LIMIT.limit({ key: id });
      if (!success) return responseError(429, 'Limite temporário de geração atingido.', { 'Retry-After': '60' });

      const input = await readInput(request).catch(() => null);
      if (typeof input?.prompt !== 'string' || !input.prompt.trim() || input.prompt.length > 24_000
        || typeof input.model !== 'string' || !/^[\w.-]+(?:\/[\w.-]+)?$/.test(input.model) || input.model.length > 100
        || (provider === 'gemini' && !/^gemini-[\w.-]+$/.test(input.model))) {
        return responseError(400, 'Modelo ou texto de geração inválido.');
      }

      const gemini = provider === 'gemini';
      const key = gemini ? env.GEMINI_API_KEY : env.NVIDIA_API_KEY;
      if (!key) return responseError(503, 'Provedor de IA indisponível.');
      const maxTokens = Math.min(Math.max(Number(input.maxTokens) || 4096, 1), 4096);
      const temperature = Math.min(Math.max(Number(input.temperature) || 0.3, 0), 1);
      const endpoint = gemini
        ? `https://generativelanguage.googleapis.com/v1beta/models/${input.model}:generateContent`
        : 'https://integrate.api.nvidia.com/v1/chat/completions';
      const body = gemini
        ? { contents: [{ parts: [{ text: input.prompt }] }], generationConfig: { temperature, maxOutputTokens: maxTokens, responseMimeType: 'application/json' } }
        : { model: input.model, messages: [{ role: 'user', content: input.prompt }], temperature, max_tokens: maxTokens };
      const providerHeaders = gemini ? { 'x-goog-api-key': key } : { Authorization: `Bearer ${key}` };
      const result = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...providerHeaders },
        body: JSON.stringify(body),
        redirect: 'manual',
        signal: AbortSignal.timeout(55_000),
      });
      if (!result.ok) {
        const retryAfter = result.headers.get('Retry-After');
        return responseError(result.status, 'O provedor recusou a geração.', retryAfter ? { 'Retry-After': retryAfter } : {});
      }
      const data = await result.json();
      const text = gemini
        ? data.candidates?.[0]?.content?.parts?.filter((part) => !part.thought).map((part) => part.text ?? '').join('')
        : data.choices?.[0]?.message?.content;
      if (!text) return responseError(502, 'O provedor devolveu uma resposta vazia.');
      return Response.json({ text }, { headers: { 'Cache-Control': 'no-store' } });
    } catch (error) {
      console.error('safezone_ai_request_failed', { provider, errorType: error?.name });
      return responseError(502, 'Falha ao comunicar com o serviço de IA ou autenticação.');
    }
  },
};
