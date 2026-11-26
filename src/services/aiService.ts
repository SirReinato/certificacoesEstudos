/**
 * AI Service — Geração de apostilas e questões via IA
 * Integração com APIs (Gemini, NVIDIA NIM, OpenAI, Anthropic, Azure OpenAI, Local)
 * Prompts otimizados para AI-200 / AI-103 e Metodologia 30/70
 */

import type {
  Content,
  TextChunk,
  AIGeneratedFlashcards,
  ExamSkill,
  AIConfig,
} from '../types';

export { type AIConfig };

export const defaultAIConfig: AIConfig = {
  provider: 'gemini',
  model: 'gemini-3.1-flash-lite',
  temperature: 0.3,
  maxTokens: 4096,
};

// ============================================
// PROMPTS ESPECIALIZADOS (30% Teoria / 70% Prática)
// ============================================

const SYSTEM_PROMPT = `Você é um especialista sênior em certificações Microsoft Azure (AI-200 e AI-103).
Gere material de estudo de alta precisão e questões práticas rigorosas em formato JSON puro.
Use estritamente as informações do conteúdo fornecido; não invente fatos nem mencione dados não suportados.

Diretrizes da metodologia 30/70:
1. ETAPA DE CONTEÚDO (30% do estudo): Gere uma apostila estruturada em seções.
   - Trabalhe um conceito por seção, com um título específico e uma explicação de um ou dois parágrafos curtos em "content".
   - Quando a fonte trouxer evidências, inclua "executiveSummary" com uma frase sobre o ponto principal, "azureScenario" com uma situação breve de aplicação e "decisionCriteria" com a condição que muda a escolha na prova.
   - Omita qualquer campo opcional sem apoio no trecho. Não invente serviços, SKUs, limites ou requisitos.
   - Identifique e extraia armadilhas de exame da Microsoft (gotchas) e pegadinhas de prova frequentes no array "gotchas".
   - Quando houver comparação entre 2 ou mais tecnologias ou SKUs (ex: Custom Vision vs Computer Vision, LUIS vs Conversational Language Understanding, etc.), gere uma tabela comparativa com "headers" e "rows" em "comparisonTable".

2. ETAPA DE PRÁTICA (70% do estudo): Gere questões práticas no array "flashcards".
   - Flashcards devem conter SOMENTE questões práticas ou cenários de exame da Microsoft. NUNCA gere cartões de mera definição ou teoria.
   - Pelo menos metade das questões geradas devem ser do formato "multiple-choice" (múltipla escolha com 4 opções A, B, C, D), com distratores plausíveis e justificativa detalhada para cada alternativa.
   - As demais podem ser "flip" (pergunta direta e resposta explicada).

ESTRUTURA JSON OBRIGATÓRIA (em cada seção, "title" e "content" são obrigatórios; os demais campos são opcionais):
{
  "studyGuide": [
    {
      "title": "Título da Seção",
      "content": "Explicação em parágrafos curtos.",
      "executiveSummary": "Ponto principal em uma frase.",
      "azureScenario": "Situação breve no Azure sustentada pela fonte.",
      "decisionCriteria": "Condição para escolher uma opção na prova.",
      "gotchas": [
        "Atenção: O serviço X exige formato Y, diferente do serviço Z."
      ],
      "comparisonTable": {
        "headers": ["Critério", "Serviço A", "Serviço B"],
        "rows": [
          ["Finalidade", "Classificação personalizada", "Detecção geral pré-treinada"]
        ]
      }
    }
  ],
  "flashcards": [
    {
      "front": "Cenário de arquitetura ou pergunta terminada em ?",
      "back": "Resposta correta e raciocínio técnico",
      "format": "multiple-choice",
      "options": [
        { "id": "A", "text": "Texto da alternativa A", "isCorrect": true, "explanation": "Por que esta opção atende ao requisito." },
        { "id": "B", "text": "Texto da alternativa B", "isCorrect": false, "explanation": "Por que esta opção é incorreta." },
        { "id": "C", "text": "Texto da alternativa C", "isCorrect": false, "explanation": "Por que esta opção é incorreta." },
        { "id": "D", "text": "Texto da alternativa D", "isCorrect": false, "explanation": "Por que esta opção é incorreta." }
      ],
      "explanation": "Explicação técnica detalhada baseada na documentação oficial.",
      "tags": ["azure-ai", "visao-computacional"],
      "difficulty": "medium",
      "importance": 8,
      "kind": "question"
    }
  ]
}`;

function buildExamContextPrompt(examCode: 'AI-200' | 'AI-103', skills: ExamSkill[]): string {
  const skillList = skills
    .map((s) => `- ${s.title} (${s.weight}%): ${s.description}\n  Sub-tópicos: ${s.subSkills.join(', ')}`)
    .join('\n\n');

  return `EXAME ALVO: ${examCode}
OBJETIVOS OFICIAIS (pesos aproximados):
${skillList}

INSTRUÇÃO: Priorize na apostila e nas questões os tópicos de maior peso e os sub-tópicos listados.
Não inclua na apostila assuntos que não estejam na fonte.`;
}

const MAX_CHUNK_TEXT_CHARS = 6_000;

function buildContentPrompt(chunk: TextChunk, chunkIndex: number, totalChunks: number): string {
  const safeText =
    chunk.text.length > MAX_CHUNK_TEXT_CHARS
      ? `${chunk.text.slice(0, MAX_CHUNK_TEXT_CHARS)}\n[...trecho limitado para caber na janela de requisição]`
      : chunk.text;

  return `CONTEXTO DO CONTEÚDO (parte ${chunkIndex + 1} de ${totalChunks}):
---
${safeText}
---

INSTRUÇÕES ESPECÍFICAS:
- Este é um pedaço de um conteúdo maior. Use apenas o que está neste trecho.
- Preserve o contexto e as relações entre conceitos em parágrafos curtos. Separe parágrafos com duas quebras de linha no valor JSON de "content".
- Gere questões que exijam aplicação do conhecimento; perguntas devem terminar em "?" e as respostas devem explicar o raciocínio.
- Inclua tags relevantes (ex: "azure-functions", "app-service", "cosmos-db", "security").
- Atribua importance 8-10 para conceitos core do exame, 5-7 para detalhes, 1-4 para contexto.`;
}

// ============================================
// GERAÇÃO DE FLASHCARDS
// ============================================

/**
 * Teto de chunks enviados à IA por conteúdo. Cada chunk vira uma chamada
 * sequencial ao provedor; sem limite, um texto longo geraria centenas de
 * requisições (custo alto e minutos de espera).
 */
const MAX_CHUNKS_PER_CONTENT = 30;
const CHUNK_PACE_DELAY_MS = 2_500;

export async function generateFlashcardsFromContent(
  content: Content,
  examCode: 'AI-200' | 'AI-103',
  examSkills: ExamSkill[],
  config: AIConfig = defaultAIConfig,
  onProgress?: (percent: number, stage?: string) => void
): Promise<AIGeneratedFlashcards> {
  if (!content.chunks || content.chunks.length === 0) {
    throw new Error('Conteúdo não tem chunks para processar');
  }

  const pool = buildCandidatePool(config);
  if (pool.length === 0) {
    throw new Error('Nenhum provedor ou chave de IA configurado.');
  }

  const poolState: ModelPoolState = {
    disabled: new Set(),
    cooldownUntil: new Map(),
    cursor: 0,
  };

  const allFlashcards: AIGeneratedFlashcards['flashcards'] = [];
  const studyGuide: AIGeneratedFlashcards['studyGuide'] = [];
  const chunks = content.chunks.slice(0, MAX_CHUNKS_PER_CONTENT);

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const basePercent = Math.round((i / chunks.length) * 100);
    const result = await generateFlashcardsFromChunk(
      chunk,
      i,
      chunks.length,
      examCode,
      examSkills,
      config,
      pool,
      poolState,
      (candidate) => {
        onProgress?.(
          basePercent,
          `Analisando parte ${i + 1} de ${chunks.length} (${candidate.provider}: ${candidate.model})`
        );
      }
    );
    allFlashcards.push(...result.flashcards);
    studyGuide.push(
      ...result.studyGuide.map((section) => ({
        ...section,
        title: chunks.length > 1 ? `Parte ${i + 1} — ${section.title}` : section.title,
      }))
    );
    onProgress?.(
      Math.round(((i + 1) / chunks.length) * 100),
      `Parte ${i + 1} de ${chunks.length} concluída`
    );

    if (i < chunks.length - 1) {
      await sleep(CHUNK_PACE_DELAY_MS);
    }
  }

  const uniqueFlashcards = deduplicateFlashcards(allFlashcards);

  if (uniqueFlashcards.length === 0) {
    throw new Error(
      'A IA não retornou flashcards válidos. Verifique a chave/modelo configurado e tente novamente.'
    );
  }

  return {
    flashcards: uniqueFlashcards.sort((a, b) => b.importance - a.importance).slice(0, 50),
    studyGuide,
  };
}

async function generateFlashcardsFromChunk(
  chunk: TextChunk,
  chunkIndex: number,
  totalChunks: number,
  examCode: 'AI-200' | 'AI-103',
  examSkills: ExamSkill[],
  config: AIConfig,
  pool: ModelCandidate[],
  poolState: ModelPoolState,
  onAttempt?: (candidate: ModelCandidate) => void
): Promise<AIGeneratedFlashcards> {
  const prompt = `${SYSTEM_PROMPT}

${buildExamContextPrompt(examCode, examSkills)}

${buildContentPrompt(chunk, chunkIndex, totalChunks)}

Lembre-se: retorne APENAS o JSON válido, sem markdown ou texto extra.`;

  return callWithModelRotation(prompt, config, pool, poolState, onAttempt);
}

// ============================================
// PROVIDER CALLS
// ============================================

const AI_TIMEOUT_MS = 60_000;
const COOLDOWN_TRANSIENT_MS = 35_000;
const MAX_COOLDOWN_WAIT_MS = 20_000;

interface ModelCandidate {
  provider: AIConfig['provider'];
  model: string;
  apiKey?: string;
  endpoint?: string;
}

interface ModelPoolState {
  disabled: Set<string>;
  cooldownUntil: Map<string, number>;
  cursor: number;
}

class AIHttpError extends Error {
  status?: number;
  retryAfterMs?: number;

  constructor(message: string, status?: number, retryAfterMs?: number) {
    super(message);
    this.name = 'AIHttpError';
    this.status = status;
    this.retryAfterMs = retryAfterMs;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRetryAfterMs(response: Response): number | undefined {
  const header = response.headers.get('retry-after');
  if (!header) return undefined;
  const seconds = Number(header);
  if (!Number.isNaN(seconds) && seconds > 0) {
    return Math.min(seconds * 1000, 60_000);
  }
  const dateMs = Date.parse(header);
  if (!Number.isNaN(dateMs)) {
    const diff = dateMs - Date.now();
    return diff > 0 ? Math.min(diff, 60_000) : undefined;
  }
  return undefined;
}

async function readHttpErrorDetail(response: Response): Promise<string> {
  let detail = response.statusText;
  try {
    const error = await response.json();
    detail = error?.error?.message || error?.message || detail;
  } catch {
    try {
      detail = (await response.text()).slice(0, 300) || detail;
    } catch {
      // mantém statusText
    }
  }
  return detail;
}

function candidateKey(c: ModelCandidate): string {
  return `${c.provider}:${c.model}`;
}

const GEMINI_MODEL_POOL = [
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-3.7-flash',
  'gemini-3.8-flash',
  'gemini-3.1-pro-preview',
];

const NVIDIA_MODEL_POOL = [
  'google/gemma-4-31b-it',
  'nvidia/nemotron-3.5-lightning-30b-a3b',
  'mistralai/mistral-large-4-1t-a52b',
  'z-ai/glm-5.3-flash',
  'nvidia/nemotron-3.5-super-vl-120b-a12b',
  'minimaxai/minimax-m3.1-flash',
  'google/gemma-3-12b-it',
];

function uniqueStrings(items: Array<string | undefined>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const trimmed = item?.trim();
    if (trimmed && !seen.has(trimmed)) {
      seen.add(trimmed);
      out.push(trimmed);
    }
  }
  return out;
}

function buildCandidatePool(config: AIConfig): ModelCandidate[] {
  const geminiKey =
    (config.provider === 'gemini' ? config.apiKey : config.providerKeys?.gemini)?.trim() ||
    import.meta.env.VITE_GEMINI_API_KEY?.trim();
  const nvidiaKey =
    (config.provider === 'nvidia' ? config.apiKey : config.providerKeys?.nvidia)?.trim() ||
    import.meta.env.VITE_NVIDIA_API_KEY?.trim();

  const geminiModels = geminiKey
    ? uniqueStrings([config.provider === 'gemini' ? config.model : undefined, ...GEMINI_MODEL_POOL]).map(
        (model): ModelCandidate => ({ provider: 'gemini', model, apiKey: geminiKey })
      )
    : [];

  const nvidiaEndpoint =
    config.provider === 'nvidia' && config.endpoint?.trim()
      ? config.endpoint.trim()
      : '/api/nvidia/v1/chat/completions';

  const nvidiaModels = nvidiaKey
    ? uniqueStrings([config.provider === 'nvidia' ? config.model : undefined, ...NVIDIA_MODEL_POOL]).map(
        (model): ModelCandidate => ({
          provider: 'nvidia',
          model,
          apiKey: nvidiaKey,
          endpoint: nvidiaEndpoint,
        })
      )
    : [];

  const interleaved: ModelCandidate[] = [];
  const primaryFirst = config.provider === 'nvidia' ? [nvidiaModels, geminiModels] : [geminiModels, nvidiaModels];
  const maxLen = Math.max(primaryFirst[0].length, primaryFirst[1].length);
  for (let i = 0; i < maxLen; i++) {
    if (i < primaryFirst[0].length) interleaved.push(primaryFirst[0][i]);
    if (i < primaryFirst[1].length) interleaved.push(primaryFirst[1][i]);
  }

  if (config.provider === 'gemini' || config.provider === 'nvidia') {
    return interleaved;
  }

  const primaryCandidate: ModelCandidate = {
    provider: config.provider,
    model: config.model,
    apiKey: config.apiKey || config.providerKeys?.[config.provider],
    endpoint: config.endpoint,
  };

  return [primaryCandidate, ...interleaved];
}

/**
 * `fetch` com timeout. Sem isso uma requisição pendurada deixa o overlay de
 * processamento travado indefinidamente, sem erro visível ao usuário.
 */
async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number = AI_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function callWithModelRotation(
  prompt: string,
  config: AIConfig,
  pool: ModelCandidate[],
  state: ModelPoolState,
  onAttempt?: (candidate: ModelCandidate) => void
): Promise<AIGeneratedFlashcards> {
  const indexed = pool.map((candidate, index) => ({ candidate, index }));
  const rotated = [
    ...indexed.slice(state.cursor % pool.length),
    ...indexed.slice(0, state.cursor % pool.length),
  ].filter(({ candidate }) => !state.disabled.has(candidateKey(candidate)));

  if (rotated.length === 0) {
    throw new Error('Todos os modelos configurados falharam permanentemente (verifique chaves e permissões).');
  }

  const now = Date.now();
  const ready = rotated.filter(({ candidate }) => (state.cooldownUntil.get(candidateKey(candidate)) ?? 0) <= now);
  const cooling = rotated
    .filter(({ candidate }) => (state.cooldownUntil.get(candidateKey(candidate)) ?? 0) > now)
    .sort(
      (a, b) =>
        (state.cooldownUntil.get(candidateKey(a.candidate)) ?? 0) -
        (state.cooldownUntil.get(candidateKey(b.candidate)) ?? 0)
    );

  let lastError: unknown = null;

  const tryCandidate = async (candidate: ModelCandidate, index: number): Promise<AIGeneratedFlashcards | null> => {
    const key = candidateKey(candidate);
    onAttempt?.(candidate);

    try {
      const raw = await callCandidate(prompt, candidate, config);
      const parsed = parseAIResponse(raw);
      state.cooldownUntil.delete(key);
      state.cursor = (index + 1) % pool.length;
      return parsed;
    } catch (error) {
      lastError = error;
      const status = error instanceof AIHttpError ? error.status : undefined;
      const retryAfterMs = error instanceof AIHttpError ? error.retryAfterMs : undefined;

      if (status === 401 || status === 403 || status === 404 || status === 410) {
        console.warn(`Modelo ${key} indisponível (${status}), desativando nesta sessão.`);
        state.disabled.add(key);
        return null;
      }

      if (status === 429 || status === 503 || status === 500 || status === 502 || status === 504 || !status) {
        const waitMs = retryAfterMs ?? COOLDOWN_TRANSIENT_MS;
        state.cooldownUntil.set(key, Date.now() + waitMs);
        console.warn(
          `Modelo ${key} falhou (${status ?? 'rede/parse'}), alternando para próximo modelo...`
        );
        await sleep(1200);
        return null;
      }

      console.warn(`Modelo ${key} falhou (${status}), tentando próximo modelo...`);
      await sleep(800);
      return null;
    }
  };

  for (const { candidate, index } of ready) {
    const result = await tryCandidate(candidate, index);
    if (result) return result;
  }

  if (cooling.length > 0) {
    const soonest = state.cooldownUntil.get(candidateKey(cooling[0].candidate)) ?? Date.now();
    const waitMs = Math.min(Math.max(soonest - Date.now(), 2_000), MAX_COOLDOWN_WAIT_MS);
    console.info(`Todos os modelos em cooldown; aguardando ${Math.round(waitMs / 1000)}s para nova tentativa...`);
    await sleep(waitMs);

    for (const { candidate, index } of cooling) {
      const result = await tryCandidate(candidate, index);
      if (result) return result;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Nenhum modelo de IA disponível respondeu com sucesso.');
}

async function callCandidate(
  prompt: string,
  candidate: ModelCandidate,
  config: AIConfig
): Promise<string> {
  const effectiveConfig: AIConfig = {
    ...config,
    provider: candidate.provider,
    model: candidate.model,
    apiKey: candidate.apiKey,
    endpoint: candidate.endpoint ?? config.endpoint,
    maxTokens: Math.min(config.maxTokens ?? 4096, 4096),
  };

  switch (candidate.provider) {
    case 'nvidia':
      return callNvidia(prompt, effectiveConfig);
    case 'openai':
      return callOpenAI(prompt, effectiveConfig);
    case 'anthropic':
      return callAnthropic(prompt, effectiveConfig);
    case 'azure-openai':
      return callAzureOpenAI(prompt, effectiveConfig);
    case 'gemini':
      return callGeminiSingle(prompt, effectiveConfig);
    case 'local':
      return callLocal(prompt, effectiveConfig);
    default:
      throw new Error(`Provider não suportado: ${candidate.provider}`);
  }
}

export async function callOpenAICompatible(options: {
  endpoint: string;
  apiKey: string;
  model: string;
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  useJsonFormat?: boolean;
}): Promise<string> {
  const useJsonFormat = options.useJsonFormat ?? true;
  const payload: Record<string, unknown> = {
    model: options.model,
    messages: [{ role: 'user', content: options.prompt }],
    temperature: options.temperature ?? 0.3,
    max_tokens: options.maxTokens ?? 4096,
  };
  if (useJsonFormat) {
    payload.response_format = { type: 'json_object' };
  }

  const response = await fetchWithTimeout(options.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${options.apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    if (response.status === 400 && useJsonFormat) {
      return callOpenAICompatible({ ...options, useJsonFormat: false });
    }
    const detail = await readHttpErrorDetail(response);
    throw new AIHttpError(
      `API error (${response.status}): ${detail}`,
      response.status,
      parseRetryAfterMs(response)
    );
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

async function callNvidia(prompt: string, config: AIConfig): Promise<string> {
  const apiKey = config.apiKey || import.meta.env.VITE_NVIDIA_API_KEY;
  if (!apiKey) throw new AIHttpError('NVIDIA NIM API key não configurada', 401);

  // Em dev/preview usa o proxy do Vite para evitar bloqueio de CORS no browser
  const endpoint = config.endpoint
    ? config.endpoint
    : '/api/nvidia/v1/chat/completions';

  return callOpenAICompatible({
    endpoint,
    apiKey,
    model: config.model || 'google/gemma-4-31b-it',
    prompt,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
  });
}

async function callOpenAI(prompt: string, config: AIConfig): Promise<string> {
  const apiKey = config.apiKey || import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) throw new AIHttpError('OpenAI API key não configurada', 401);

  return callOpenAICompatible({
    endpoint: 'https://api.openai.com/v1/chat/completions',
    apiKey,
    model: config.model,
    prompt,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
  });
}

async function callAnthropic(prompt: string, config: AIConfig): Promise<string> {
  const apiKey = config.apiKey || import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey) throw new AIHttpError('Anthropic API key não configurada', 401);

  const response = await fetchWithTimeout('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: config.temperature,
      max_tokens: config.maxTokens,
    }),
  });

  if (!response.ok) {
    const detail = await readHttpErrorDetail(response);
    throw new AIHttpError(`Anthropic error: ${detail}`, response.status, parseRetryAfterMs(response));
  }

  const data = await response.json();
  return data.content[0]?.text || '';
}

async function callAzureOpenAI(prompt: string, config: AIConfig): Promise<string> {
  const apiKey = config.apiKey || import.meta.env.VITE_AZURE_OPENAI_API_KEY;
  const endpoint = config.endpoint || import.meta.env.VITE_AZURE_OPENAI_ENDPOINT;
  if (!apiKey || !endpoint) throw new AIHttpError('Azure OpenAI config incompleta', 401);

  const url = `${endpoint}/openai/deployments/${config.model}/chat/completions?api-version=2024-02-15-preview`;

  const response = await fetchWithTimeout(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({
      messages: [{ role: 'user', content: prompt }],
      temperature: config.temperature,
      max_tokens: config.maxTokens,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const detail = await readHttpErrorDetail(response);
    throw new AIHttpError(`Azure OpenAI error: ${detail}`, response.status, parseRetryAfterMs(response));
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

async function callGeminiSingle(prompt: string, config: AIConfig): Promise<string> {
  const apiKey = config.apiKey || import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new AIHttpError('Gemini API key não configurada', 401);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${apiKey}`;

  const response = await fetchWithTimeout(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: config.temperature,
        maxOutputTokens: config.maxTokens,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    const detail = await readHttpErrorDetail(response);
    throw new AIHttpError(
      `Gemini error (${response.status}): ${detail}`,
      response.status,
      parseRetryAfterMs(response)
    );
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function callLocal(prompt: string, config: AIConfig): Promise<string> {
  const endpoint = config.endpoint || 'http://localhost:11434/api/generate';

  const response = await fetchWithTimeout(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: config.model,
      prompt,
      temperature: config.temperature,
      format: 'json',
      stream: false,
    }),
  });

  if (!response.ok) {
    const detail = await readHttpErrorDetail(response);
    throw new AIHttpError(`Local AI error: ${detail}`, response.status);
  }

  const data = await response.json();
  return data.response || '';
}

// ============================================
// PARSING & UTILS (30/70 Engine)
// ============================================

function optionalSectionText(value: unknown): string | undefined {
  return typeof value === 'string' ? value.trim() || undefined : undefined;
}

function parseAIResponse(response: string): AIGeneratedFlashcards {
  try {
    // 1. Limpeza básica
    let jsonStr = response.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '');

    // 2. Tenta fechar estruturas abertas se o JSON estiver cortado
    const lastQuote = jsonStr.lastIndexOf('"');
    const lastClosing = Math.max(jsonStr.lastIndexOf('}'), jsonStr.lastIndexOf(']'));
    if (lastQuote > lastClosing) {
      jsonStr = jsonStr.slice(0, lastQuote + 1);
    }

    const stack: string[] = [];
    let inString = false;
    let escapeNext = false;
    for (let i = 0; i < jsonStr.length; i++) {
      const ch = jsonStr[i];
      if (inString) {
        if (escapeNext) {
          escapeNext = false;
        } else if (ch === '\\\\') {
          escapeNext = true;
        } else if (ch === '"') {
          inString = false;
        }
      } else if (ch === '"') {
        inString = true;
      } else if (ch === '{' || ch === '[') {
        stack.push(ch);
      } else if (ch === '}' && stack.length && stack[stack.length - 1] === '{') {
        stack.pop();
      } else if (ch === ']' && stack.length && stack[stack.length - 1] === '[') {
        stack.pop();
      }
    }
    if (inString) jsonStr += '"';
    for (let i = stack.length - 1; i >= 0; i--) {
      jsonStr += stack[i] === '{' ? '}' : ']';
    }

    // 3. Extrai o conteúdo entre a primeira e última chave
    const firstBrace = jsonStr.indexOf('{');
    const lastBrace = jsonStr.lastIndexOf('}');

    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error('Nenhum objeto JSON válido encontrado');
    }

    jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);

    // 4. Reparo de vírgulas e quebras
    jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1');
    jsonStr = jsonStr.replace(/\r\n|\r/g, '\n');

    const parsed = JSON.parse(jsonStr);
    
    if (!Array.isArray(parsed.studyGuide) || !Array.isArray(parsed.flashcards)) {
      throw new Error('Resposta inválida: apostila ou questões ausentes');
    }

    return {
      studyGuide: parsed.studyGuide
        .map((section: Record<string, unknown>) => {
          const title = String(section.title || '').trim();
          const content = String(section.content || '').trim();
          const executiveSummary = optionalSectionText(section.executiveSummary);
          const azureScenario = optionalSectionText(section.azureScenario);
          const decisionCriteria = optionalSectionText(section.decisionCriteria);
          const gotchas = Array.isArray(section.gotchas)
            ? section.gotchas.map((g: unknown) => String(g).trim()).filter(Boolean)
            : undefined;

          let comparisonTable = undefined;
          if (
            section.comparisonTable &&
            typeof section.comparisonTable === 'object' &&
            Array.isArray((section.comparisonTable as Record<string, unknown>).headers) &&
            Array.isArray((section.comparisonTable as Record<string, unknown>).rows)
          ) {
            const table = section.comparisonTable as { headers: unknown[]; rows: unknown[][] };
            comparisonTable = {
              headers: table.headers.map((h) => String(h).trim()),
              rows: table.rows.map((r) => (Array.isArray(r) ? r.map((cell) => String(cell).trim()) : [])),
            };
          }

          return {
            title,
            content,
            ...(executiveSummary && { executiveSummary }),
            ...(azureScenario && { azureScenario }),
            ...(decisionCriteria && { decisionCriteria }),
            gotchas: gotchas && gotchas.length > 0 ? gotchas : undefined,
            comparisonTable,
          };
        })
        .filter((section: { title: string; content: string }) => section.title && section.content),

      flashcards: parsed.flashcards
        .map((fc: Record<string, unknown>) => {
          const front = String(fc.front || '').trim();
          const back = String(fc.back || '').trim();
          const explanation = fc.explanation ? String(fc.explanation).trim() : undefined;

          let options = undefined;
          if (Array.isArray(fc.options) && fc.options.length >= 2) {
            options = fc.options.map((opt: Record<string, unknown>, idx: number) => ({
              id: (opt.id || ['A', 'B', 'C', 'D'][idx] || String(idx + 1)) as 'A' | 'B' | 'C' | 'D',
              text: String(opt.text || opt.label || '').trim(),
              isCorrect: Boolean(opt.isCorrect || opt.correct),
              explanation: opt.explanation ? String(opt.explanation).trim() : '',
            }));
          }

          const format = options && options.length >= 2 ? 'multiple-choice' : (fc.format === 'multiple-choice' ? 'multiple-choice' : 'flip');

          return {
            front,
            back,
            explanation,
            format: format as 'flip' | 'multiple-choice',
            options,
            tags: Array.isArray(fc.tags) ? fc.tags.map(String) : [],
            difficulty: ['easy', 'medium', 'hard'].includes(String(fc.difficulty))
              ? (fc.difficulty as 'easy' | 'medium' | 'hard')
              : 'medium',
            importance: typeof fc.importance === 'number' ? Math.max(1, Math.min(10, fc.importance)) : 5,
            kind: 'question' as const,
          };
        })
        .filter((fc: { front: string; back: string }) => fc.front && fc.back),
    };
  } catch (error) {
    console.error('Erro ao parsear resposta da IA:', error);
    throw new Error(`Falha ao parsear resposta da IA: Erro de sintaxe.`);
  }
}

function deduplicateFlashcards(flashcards: AIGeneratedFlashcards['flashcards']): AIGeneratedFlashcards['flashcards'] {
  const seen = new Set<string>();
  return flashcards.filter((fc) => {
    const key = fc.front.toLowerCase().replace(/[^\w]/g, '');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ============================================
// HOOK PARA USO EM COMPONENTES
// ============================================
export function useAIService() {
  const generateFlashcards = async (
    content: Content,
    examCode: 'AI-200' | 'AI-103',
    examSkills: ExamSkill[]
  ): Promise<AIGeneratedFlashcards> => {
    return generateFlashcardsFromContent(content, examCode, examSkills);
  };

  return { generateFlashcards };
}
