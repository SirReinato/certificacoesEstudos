/**
 * Content Ingestion Services — PDF, Link, Text processing
 * Extração de texto, chunking, preparação para IA
 */

import * as pdfjs from 'pdfjs-dist';
// Worker local (bundled pelo Vite): essencial para funcionar offline / PWA
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import type { Content, ContentSource, TextChunk } from '../types';
import { createId } from '../utils/uuid';

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export type ProgressCallback = (percent: number, stage?: string) => void;

const MIN_EXTRACTED_TEXT_LENGTH = 200;

// ============================================
// UTILS
// ============================================

function normalizeWhitespace(input: string): string {
  return input
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t\f\v]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ============================================
// PDF PROCESSING (Real Browser Implementation)
// ============================================

export interface PDFExtractionResult {
  text: string;
  pages: number;
  info: { fileName: string; fileSize: number };
}

export async function extractTextFromPDF(
  file: File,
  onProgress?: ProgressCallback
): Promise<PDFExtractionResult> {
  if (file.type && file.type !== 'application/pdf') {
    throw new Error('O arquivo selecionado não é um PDF válido.');
  }

  const arrayBuffer = await file.arrayBuffer();

  let loadingTask: pdfjs.PDFDocumentLoadingTask;
  let pdf: pdfjs.PDFDocumentProxy;
  try {
    loadingTask = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) });
    pdf = await loadingTask.promise;
  } catch (error) {
    console.error('Erro ao abrir PDF:', error);
    throw new Error(
      'Não foi possível abrir o PDF. O arquivo pode estar corrompido ou protegido por senha.'
    );
  }

  const totalPages = pdf.numPages;
  const pageTexts: string[] = [];

  try {
    for (let i = 1; i <= totalPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();

      const pageText = textContent.items
        .map((item) => {
          if (!('str' in item)) return '';
          const str = item.str ?? '';
          return item.hasEOL ? `${str}\n` : `${str} `;
        })
        .join('');

      pageTexts.push(normalizeWhitespace(pageText));
      onProgress?.(Math.round((i / totalPages) * 100), `Extraindo página ${i} de ${totalPages}`);
    }
  } finally {
    await loadingTask.destroy();
  }

  const text = normalizeWhitespace(pageTexts.filter(Boolean).join('\n\n'));

  if (text.length < MIN_EXTRACTED_TEXT_LENGTH) {
    throw new Error(
      'Este PDF não possui texto selecionável (provavelmente é digitalizado como imagem). ' +
        'Copie o conteúdo e use a aba "Texto", ou use um PDF com texto.'
    );
  }

  return {
    text,
    pages: totalPages,
    info: { fileName: file.name, fileSize: file.size },
  };
}

// ============================================
// LINK FETCHING & EXTRACTION (CORS-aware)
// ============================================

export interface FetchedContent {
  title: string;
  text: string;
  html: string;
  url: string;
  metadata: {
    description?: string;
    image?: string;
    author?: string;
    publishedTime?: string;
  };
}

const FETCH_TIMEOUT_MS = 20_000;

interface ProxyAttempt {
  name: string;
  url: string;
  kind: 'html' | 'text';
}

function buildProxyAttempts(targetUrl: string): ProxyAttempt[] {
  const encoded = encodeURIComponent(targetUrl);
  return [
    // Proxy same-origin do Vite (dev/preview) — sem CORS, mais confiável
    { name: 'local', kind: 'html', url: `/api/fetch?url=${encoded}` },
    // Jina Reader devolve texto/markdown já limpo e libera CORS por origem
    { name: 'jina', kind: 'text', url: `https://r.jina.ai/${targetUrl}` },
    // Proxies públicos de fallback (podem estar indisponíveis)
    { name: 'allorigins', kind: 'html', url: `https://api.allorigins.win/raw?url=${encoded}` },
    { name: 'codetabs', kind: 'html', url: `https://api.codetabs.com/v1/proxy?quest=${encoded}` },
    // Última tentativa: direto (funciona apenas com CORS liberado)
    { name: 'direto', kind: 'html', url: targetUrl },
  ];
}

async function fetchOnce(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

interface RawFetch {
  html?: string;
  text?: string;
  source: string;
}

async function fetchRawContent(targetUrl: string): Promise<RawFetch> {
  const attempts = buildProxyAttempts(targetUrl);
  const errors: string[] = [];

  for (const attempt of attempts) {
    try {
      const response = await fetchOnce(attempt.url);

      // O proxy local só é válido se responder com o header do plugin.
      // (em hospedagem estática o /api/fetch cai no fallback do SPA)
      if (attempt.name === 'local' && response.headers.get('x-safezone-proxy') !== '1') {
        errors.push('local: indisponível neste servidor');
        continue;
      }

      if (!response.ok) {
        let detail = `HTTP ${response.status}`;
        if (attempt.name === 'local') {
          try {
            const payload = (await response.json()) as { error?: string };
            if (payload?.error) detail = payload.error;
          } catch {
            // corpo não-JSON: mantém o status
          }
        }
        errors.push(`${attempt.name}: ${detail}`);
        continue;
      }

      const body = await response.text();
      if (!body || body.length < 100) {
        errors.push(`${attempt.name}: resposta vazia`);
        continue;
      }

      if (attempt.kind === 'text') {
        console.info(`[Ingest] conteúdo obtido via ${attempt.name}`);
        return { text: body, source: attempt.name };
      }

      const looksLikeHtml = /<\/?(html|body|main|article|div|p|section)\b/i.test(
        body.slice(0, 2000)
      );

      console.info(`[Ingest] conteúdo obtido via ${attempt.name}`);

      if (!looksLikeHtml) {
        return { text: body, source: attempt.name };
      }

      return { html: body, source: attempt.name };
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'falha desconhecida';
      errors.push(`${attempt.name}: ${reason}`);
    }
  }

  throw new Error(
    `Não foi possível acessar o link (${errors.join(' | ')}). ` +
      'Verifique sua conexão, ou copie o texto e use a aba "Texto".'
  );
}

const NOISE_SELECTORS = [
  'script',
  'style',
  'noscript',
  'nav',
  'header',
  'footer',
  'aside',
  'form',
  'iframe',
  'button',
  'svg',
  '[aria-hidden="true"]',
  '.header',
  '.footer',
  '.navigation',
  '.breadcrumb',
  '.feedback',
  '.metadata',
].join(',');

function metaContent(doc: Document, selector: string): string | undefined {
  const value = doc.querySelector(selector)?.getAttribute('content')?.trim();
  return value || undefined;
}

const NOISE_LINES = new Set([
  'read in english',
  'ler em inglês',
  'edit',
  'editar',
  'observação',
  'skip to main content',
  'feedback',
  'was this page helpful?',
  'esta página foi útil?',
  'additional resources',
  'in this article',
  'show 2 more',
]);

function stripNoiseLines(text: string): string {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => {
      if (!line) return false;
      if (NOISE_LINES.has(line.toLowerCase())) return false;
      if (/^access to this page requires authorization/i.test(line)) return false;
      if (/^(o )?acesso a (essa|esta) página exige autorização/i.test(line)) return false;
      return true;
    })
    .join('\n');
}

function extractTextFromHtml(html: string): {
  title: string;
  description?: string;
  text: string;
} {
  const doc = new DOMParser().parseFromString(html, 'text/html');

  const title =
    metaContent(doc, 'meta[property="og:title"]') ||
    doc.querySelector('title')?.textContent?.trim() ||
    '';
  const description =
    metaContent(doc, 'meta[property="og:description"]') ||
    metaContent(doc, 'meta[name="description"]');

  doc.querySelectorAll(NOISE_SELECTORS).forEach((el) => el.remove());

  const main =
    doc.querySelector('main') ||
    doc.querySelector('article') ||
    doc.querySelector('[role="main"]') ||
    doc.querySelector('#main') ||
    doc.querySelector('#content') ||
    doc.body;

  // Quebra linhas em blocos para preservar parágrafos no chunking
  main
    ?.querySelectorAll('h1,h2,h3,h4,h5,h6,p,li,pre,blockquote,tr')
    .forEach((el) => el.append('\n'));

  const text = stripNoiseLines(normalizeWhitespace(main?.textContent ?? ''));

  return { title: title.replace(/\s+/g, ' ').trim(), description, text };
}

function cleanMarkdown(markdown: string): { title: string; text: string } {
  const withoutFrontMatter = markdown
    .replace(/^(Title|URL Source|Published Time|Markdown Content):.*$/gm, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');

  const text = stripNoiseLines(normalizeWhitespace(withoutFrontMatter));
  const headingMatch = text.match(/^#{1,3}\s+(.+)$/m);

  return {
    title: headingMatch?.[1]?.trim() ?? '',
    text: text.replace(/^#{1,6}\s*/gm, ''),
  };
}

function fallbackTitleFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const lastSegment = parsed.pathname.split('/').filter(Boolean).pop();
    return lastSegment
      ? decodeURIComponent(lastSegment).replace(/[-_]+/g, ' ')
      : parsed.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export async function fetchAndExtractLink(url: string): Promise<FetchedContent> {
  const raw = await fetchRawContent(url);

  let title = '';
  let description: string | undefined;
  let text = '';

  if (raw.html) {
    const extracted = extractTextFromHtml(raw.html);
    title = extracted.title;
    description = extracted.description;
    text = extracted.text;
  } else if (raw.text) {
    const cleaned = cleanMarkdown(raw.text);
    title = cleaned.title;
    text = cleaned.text;
  }

  if (text.length < MIN_EXTRACTED_TEXT_LENGTH) {
    throw new Error(
      'Conteúdo insuficiente extraído do link (a página pode ser dinâmica ou exigir login). ' +
        'Copie o texto e use a aba "Texto".'
    );
  }

  return {
    title: title || fallbackTitleFromUrl(url),
    text: text.slice(0, 200_000),
    html: raw.html?.slice(0, 200_000) ?? '',
    url,
    metadata: { description },
  };
}

// ============================================
// TEXT CHUNKING
// ============================================

export interface ChunkOptions {
  maxTokens?: number; // ~4 chars per token for Portuguese/English
  overlapTokens?: number; // overlap between chunks
  minChunkSize?: number; // minimum chunk size
}

const DEFAULT_OPTIONS: Required<ChunkOptions> = {
  maxTokens: 500, // ~2000 chars
  overlapTokens: 50, // ~200 chars overlap
  minChunkSize: 50, // ~200 chars
};

export function chunkText(text: string, options: ChunkOptions = {}): TextChunk[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const maxChars = opts.maxTokens * 4;
  const overlapChars = opts.overlapTokens * 4;
  const minChars = opts.minChunkSize * 4;

  const cleaned = normalizeWhitespace(text);

  if (cleaned.length <= maxChars) {
    return [{ id: createId(), contentId: '', text: cleaned, order: 0 }];
  }

  const chunks: TextChunk[] = [];
  let start = 0;
  let order = 0;

  while (start < cleaned.length) {
    let end = Math.min(start + maxChars, cleaned.length);

    // Tentar quebrar em fim de frase/parágrafo
    if (end < cleaned.length) {
      const sentenceEnd = cleaned.lastIndexOf('. ', end);
      const paragraphEnd = cleaned.lastIndexOf('\n\n', end);
      const breakPoint = Math.max(sentenceEnd, paragraphEnd);

      if (breakPoint > start + minChars) {
        end = breakPoint + 1; // Inclui o ponto final
      }
    }

    const chunkContent = cleaned.slice(start, end).trim();

    if (chunkContent.length >= minChars) {
      chunks.push({
        id: createId(),
        contentId: '',
        text: chunkContent,
        order,
      });
      order++;
    }

    // Último pedaço do texto: encerra o laço. Sem isso, `start` volta para
    // `cleaned.length - overlapChars` e o while nunca termina (loop infinito
    // que travava a aba ao importar qualquer conteúdo > maxChars).
    if (end >= cleaned.length) break;

    const nextStart = end - overlapChars;
    // Garante progresso do cursor mesmo quando o corte por frase aconteceu
    // logo após `start + minChars` (chunk pequeno + overlap grande).
    start = nextStart > start ? nextStart : end;
  }

  return chunks;
}

export function chunkByParagraphs(text: string, maxTokens: number = 500): TextChunk[] {
  const paragraphs = normalizeWhitespace(text)
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const chunks: TextChunk[] = [];
  let currentChunk = '';
  let order = 0;
  const maxChars = maxTokens * 4;

  for (const para of paragraphs) {
    if (currentChunk.length + para.length + 2 <= maxChars) {
      currentChunk += (currentChunk ? '\n\n' : '') + para;
    } else {
      if (currentChunk) {
        chunks.push({
          id: createId(),
          contentId: '',
          text: currentChunk,
          order: order++,
        });
      }
      currentChunk = para;
    }
  }

  if (currentChunk) {
    chunks.push({
      id: createId(),
      contentId: '',
      text: currentChunk,
      order: order++,
    });
  }

  return chunks;
}

// ============================================
// MARKDOWN / NOTEBOOKLM CHUNKING
// ============================================

export function chunkMarkdownByHeadings(
  markdownText: string,
  contentId: string = ''
): TextChunk[] {
  const normalized = normalizeWhitespace(markdownText);
  if (!normalized) return [];

  // Verificar se o texto contém cabeçalhos markdown (#, ##, ###)
  const hasHeadings = /^#{1,3}\s+.+$/m.test(normalized);
  if (!hasHeadings) {
    const fallback = chunkByParagraphs(normalized, 1200);
    return fallback.map((c, idx) => ({ ...c, contentId, order: idx }));
  }

  const lines = normalized.split('\n');
  const sections: { breadcrumb: string; lines: string[] }[] = [];
  const hierarchy: { [level: number]: string } = {};

  let currentLines: string[] = [];
  let currentBreadcrumb = 'Geral';

  const formatBreadcrumb = () => {
    const parts = [hierarchy[1], hierarchy[2], hierarchy[3]].filter(Boolean);
    return parts.length > 0 ? parts.join(' > ') : 'Geral';
  };

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      if (currentLines.length > 0) {
        sections.push({
          breadcrumb: currentBreadcrumb,
          lines: [...currentLines],
        });
        currentLines = [];
      }

      const level = headingMatch[1].length;
      const title = headingMatch[2].trim();
      hierarchy[level] = title;
      // Limpa níveis inferiores
      for (let l = level + 1; l <= 3; l++) {
        delete hierarchy[l];
      }

      currentBreadcrumb = formatBreadcrumb();
      currentLines.push(line);
    } else {
      currentLines.push(line);
    }
  }

  if (currentLines.length > 0) {
    sections.push({
      breadcrumb: currentBreadcrumb,
      lines: currentLines,
    });
  }

  const chunks: TextChunk[] = [];
  let order = 0;
  const MAX_CHUNK_TOKENS = 1200; // ~4800 caracteres

  for (const section of sections) {
    const sectionText = section.lines.join('\n').trim();
    if (!sectionText) continue;

    const estimatedTokens = Math.ceil(sectionText.length / 4);

    if (estimatedTokens <= MAX_CHUNK_TOKENS) {
      chunks.push({
        id: createId(),
        contentId,
        text: `[${section.breadcrumb}]\n${sectionText}`,
        order: order++,
      });
    } else {
      // Subdividir por parágrafos duplos mantendo o breadcrumb
      const paragraphs = sectionText.split(/\n\n+/).filter(Boolean);
      let buffer = '';

      for (const p of paragraphs) {
        if (Math.ceil((buffer.length + p.length + 2) / 4) <= MAX_CHUNK_TOKENS) {
          buffer += (buffer ? '\n\n' : '') + p;
        } else {
          if (buffer) {
            chunks.push({
              id: createId(),
              contentId,
              text: `[${section.breadcrumb}]\n${buffer}`,
              order: order++,
            });
          }
          buffer = p;
        }
      }

      if (buffer) {
        chunks.push({
          id: createId(),
          contentId,
          text: `[${section.breadcrumb}]\n${buffer}`,
          order: order++,
        });
      }
    }
  }

  return chunks.length > 0
    ? chunks
    : [{ id: createId(), contentId, text: normalized, order: 0 }];
}

// ============================================
// CONTENT PROCESSOR (Orquestrador)
// ============================================

export interface ProcessedContent {
  content: Omit<Content, 'id' | 'createdAt' | 'updatedAt'>;
  chunks: TextChunk[];
}

function buildContent(
  type: ContentSource['type'],
  title: string,
  text: string,
  source: ContentSource,
  tags: string[]
): Omit<Content, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    title,
    type,
    source,
    tags,
    flashcardsCount: 0,
    reviewedCount: 0,
    mastery: 0,
    extractedText: text,
    chunks: chunkText(text),
  };
}

export async function processPDFContent(
  file: File,
  title: string,
  tags: string[] = [],
  onProgress?: ProgressCallback
): Promise<ProcessedContent> {
  const { text } = await extractTextFromPDF(file, onProgress);
  const content = buildContent(
    'pdf',
    title,
    text,
    { type: 'pdf', fileName: file.name, fileSize: file.size },
    tags
  );

  return { content, chunks: content.chunks ?? [] };
}

export async function processLinkContent(
  url: string,
  title: string,
  tags: string[] = [],
  onProgress?: ProgressCallback
): Promise<ProcessedContent> {
  const fetched = await fetchAndExtractLink(url);
  onProgress?.(80, 'Conteúdo extraído');

  const content = buildContent(
    'link',
    title || fetched.title,
    fetched.text,
    { type: 'link', url: fetched.url },
    tags
  );

  return { content, chunks: content.chunks ?? [] };
}

export async function processTextContent(
  text: string,
  title: string,
  tags: string[] = []
): Promise<ProcessedContent> {
  const content = buildContent(
    'text',
    title,
    text,
    { type: 'text', originalText: text },
    tags
  );

  return { content, chunks: content.chunks ?? [] };
}

export async function processMarkdownContent(
  fileOrText: File | string,
  title: string,
  tags: string[] = []
): Promise<ProcessedContent> {
  let text = '';
  let fileName: string | undefined;
  let fileSize: number | undefined;

  if (typeof fileOrText === 'string') {
    text = fileOrText;
  } else {
    fileName = fileOrText.name;
    fileSize = fileOrText.size;
    text = await fileOrText.text();
  }

  const chunks = chunkMarkdownByHeadings(text);

  const content: Omit<Content, 'id' | 'createdAt' | 'updatedAt'> = {
    title,
    type: 'markdown',
    source: {
      type: 'markdown',
      fileName,
      fileSize,
      originalText: text,
    },
    tags,
    flashcardsCount: 0,
    reviewedCount: 0,
    mastery: 0,
    extractedText: text,
    chunks,
  };

  return { content, chunks };
}

// ============================================
// VALIDATION
// ============================================

export function validateContentInput(
  type: ContentSource['type'],
  data: { title?: string; url?: string; file?: File; text?: string }
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.title?.trim()) {
    errors.push('Título é obrigatório');
  }

  switch (type) {
    case 'markdown':
      if (data.file) {
        if (!data.file.name.endsWith('.md') && data.file.type !== 'text/markdown' && data.file.type !== 'text/plain') {
          errors.push('Arquivo deve ser uma nota Markdown (.md)');
        } else if (data.file.size > 20 * 1024 * 1024) {
          errors.push('Arquivo Markdown deve ter no máximo 20MB');
        }
      } else if (!data.text?.trim()) {
        errors.push('Arquivo Markdown ou texto é obrigatório');
      } else if (data.text.trim().length < 50) {
        errors.push('Texto deve ter pelo menos 50 caracteres');
      }
      break;
    case 'pdf':
      if (!data.file) {
        errors.push('Arquivo PDF é obrigatório');
      } else if (data.file.type && data.file.type !== 'application/pdf') {
        errors.push('Arquivo deve ser um PDF');
      } else if (data.file.size > 50 * 1024 * 1024) {
        errors.push('Arquivo deve ter no máximo 50MB');
      }
      break;
    case 'link':
      if (!data.url?.trim()) {
        errors.push('URL é obrigatória');
      } else {
        try {
          new URL(data.url);
        } catch {
          errors.push('URL inválida');
        }
      }
      break;
    case 'text':
      if (!data.text?.trim()) {
        errors.push('Conteúdo do texto é obrigatório');
      } else if (data.text.trim().length < 50) {
        errors.push('Texto deve ter pelo menos 50 caracteres');
      }
      break;
  }

  return { valid: errors.length === 0, errors };
}
