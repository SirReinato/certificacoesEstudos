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
   - Em cada seção, forneça explicação teórica densa, clara e didática.
   - Identifique e extraia armadilhas de exame da Microsoft (gotchas) e pegadinhas de prova frequentes no array "gotchas".
   - Quando houver comparação entre 2 ou mais tecnologias ou SKUs (ex: Custom Vision vs Computer Vision, LUIS vs Conversational Language Understanding, etc.), gere uma tabela comparativa com "headers" e "rows" em "comparisonTable".

2. ETAPA DE PRÁTICA (70% do estudo): Gere questões práticas no array "flashcards".
   - Flashcards devem conter SOMENTE questões práticas ou cenários de exame da Microsoft. NUNCA gere cartões de mera definição ou teoria.
   - Pelo menos metade das questões geradas devem ser do formato "multiple-choice" (múltipla escolha com 4 opções A, B, C, D), com distratores plausíveis e justificativa detalhada para cada alternativa.
   - As demais podem ser "flip" (pergunta direta e resposta explicada).

ESTRUTURA JSON EXATA OBRIGATÓRIA:
{
  "studyGuide": [
    {
      "title": "Título da Seção",
      "content": "Explicação teórica aprofundada.",
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

function buildContentPrompt(chunk: TextChunk, chunkIndex: number, totalChunks: number): string {
  return `CONTEXTO DO CONTEÚDO (parte ${chunkIndex + 1} de ${totalChunks}):
---
${chunk.text}
---

INSTRUÇÕES ESPECÍFICAS:
- Este é um pedaço de um conteúdo maior. Use apenas o que está neste trecho.
- Escreva a apostila como explicação contínua, com contexto, exemplos e relações entre conceitos. Não transforme a apostila em perguntas e respostas ou cartões.
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

  const allFlashcards: AIGeneratedFlashcards['flashcards'] = [];
  const studyGuide: AIGeneratedFlashcards['studyGuide'] = [];
  const chunks = content.chunks.slice(0, MAX_CHUNKS_PER_CONTENT);

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const result = await generateFlashcardsFromChunk(
      chunk,
      i,
      chunks.length,
      examCode,
      examSkills,
      config
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
      `Analisando parte ${i + 1} de ${chunks.length}`
    );
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
  config: AIConfig
): Promise<AIGeneratedFlashcards> {
  const prompt = `${SYSTEM_PROMPT}

${buildExamContextPrompt(examCode, examSkills)}

${buildContentPrompt(chunk, chunkIndex, totalChunks)}

Lembre-se: retorne APENAS o JSON válido, sem markdown ou texto extra.`;

  const response = await callAIProvider(prompt, config);
  return parseAIResponse(response);
}

// ============================================
// PROVIDER CALLS
// ============================================

const AI_TIMEOUT_MS = 45_000;

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

async function callAIProvider(prompt: string, config: AIConfig): Promise<string> {
  switch (config.provider) {
    case 'nvidia':
      return callNvidia(prompt, config);
    case 'openai':
      return callOpenAI(prompt, config);
    case 'anthropic':
      return callAnthropic(prompt, config);
    case 'azure-openai':
      return callAzureOpenAI(prompt, config);
    case 'gemini':
      return callGemini(prompt, config);
    case 'local':
      return callLocal(prompt, config);
    default:
      throw new Error(`Provider não suportado: ${config.provider}`);
  }
}

export async function callOpenAICompatible(options: {
  endpoint: string;
  apiKey: string;
  model: string;
  prompt: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<string> {
  const response = await fetchWithTimeout(options.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${options.apiKey}`,
    },
    body: JSON.stringify({
      model: options.model,
      messages: [{ role: 'user', content: options.prompt }],
      temperature: options.temperature ?? 0.3,
      max_tokens: options.maxTokens ?? 4096,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
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
    throw new Error(`API error (${response.status}): ${detail}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

async function callNvidia(prompt: string, config: AIConfig): Promise<string> {
  const apiKey = config.apiKey || import.meta.env.VITE_NVIDIA_API_KEY;
  if (!apiKey) throw new Error('NVIDIA NIM API key não configurada');

  // Em dev/preview usa o proxy do Vite para evitar bloqueio de CORS no browser
  const endpoint = config.endpoint
    ? config.endpoint
    : '/api/nvidia/v1/chat/completions';

  return callOpenAICompatible({
    endpoint,
    apiKey,
    model: config.model || 'meta/llama-3.3-70b-instruct',
    prompt,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
  });
}

async function callOpenAI(prompt: string, config: AIConfig): Promise<string> {
  const apiKey = config.apiKey || import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) throw new Error('OpenAI API key não configurada');

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
  if (!apiKey) throw new Error('Anthropic API key não configurada');

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
    const error = await response.json();
    throw new Error(`Anthropic error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.content[0]?.text || '';
}

async function callAzureOpenAI(prompt: string, config: AIConfig): Promise<string> {
  const apiKey = config.apiKey || import.meta.env.VITE_AZURE_OPENAI_API_KEY;
  const endpoint = config.endpoint || import.meta.env.VITE_AZURE_OPENAI_ENDPOINT;
  if (!apiKey || !endpoint) throw new Error('Azure OpenAI config incompleta');

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
    const error = await response.json();
    throw new Error(`Azure OpenAI error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

// Lista de fallback para o provedor Gemini.
// Modelos testados com a chave real: 3.1-flash-lite e 3.5-flash-lite são os
// estáveis com responseMimeType JSON. Os demais entram como última tentativa.
const GEMINI_MODEL_FALLBACKS = [
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash-lite',
  'gemini-3.1-pro-preview',
  'gemini-3.5-flash',
  'gemini-3.7-flash',
  'gemini-3.8-flash',
];

async function callGemini(prompt: string, config: AIConfig, modelIndex = 0): Promise<string> {
  const apiKey = config.apiKey || import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error('Gemini API key não configurada');

  // Usa o modelo da config atual, ou percorre a lista de fallbacks
  const modelToUse = modelIndex === 0 ? config.model : GEMINI_MODEL_FALLBACKS[modelIndex - 1];
  
  if (!modelToUse) throw new Error('Nenhum modelo de IA disponível');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:generateContent?key=${apiKey}`;

  try {
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
      // Sobrecarga/limite: tenta o próximo modelo da lista de fallback
      if (
        [503, 500, 429, 404].includes(response.status) &&
        modelIndex < GEMINI_MODEL_FALLBACKS.length
      ) {
        console.warn(`Modelo ${modelToUse} falhou (${response.status}), tentando próximo modelo...`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return callGemini(prompt, config, modelIndex + 1);
      }
      
      const error = await response.json();
      throw new Error(`Gemini error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.candidates[0]?.content?.parts[0]?.text || '';
  } catch (error) {
    if (modelIndex < GEMINI_MODEL_FALLBACKS.length) {
      console.warn(`Erro de rede no modelo ${modelToUse}, tentando fallback...`);
      return callGemini(prompt, config, modelIndex + 1);
    }
    throw error;
  }
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
    throw new Error(`Local AI error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.response || '';
}

// ============================================
// PARSING & UTILS (30/70 Engine)
// ============================================

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
