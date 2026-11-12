import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const PORT = Number(process.env.PORT || 3001);
const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'data', 'safezone.db');
const UPLOAD_DIR = path.join(path.dirname(DB_PATH), 'uploads');
const MAX_SOURCE_PDF_BYTES = 50 * 1024 * 1024;

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// ---------------- Schema ----------------
db.exec(`
CREATE TABLE IF NOT EXISTS contents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  tags TEXT NOT NULL DEFAULT '[]',
  flashcardsCount INTEGER NOT NULL DEFAULT 0,
  reviewedCount INTEGER NOT NULL DEFAULT 0,
  mastery REAL NOT NULL DEFAULT 0,
  lastStudied TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  extractedText TEXT,
  chunks TEXT NOT NULL DEFAULT '[]',
  studyGuide TEXT NOT NULL DEFAULT '[]',
  source TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS flashcards (
  id TEXT PRIMARY KEY,
  contentId TEXT NOT NULL,
  chunkId TEXT,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  tags TEXT NOT NULL DEFAULT '[]',
  kind TEXT,
  easeFactor REAL NOT NULL DEFAULT 2.5,
  interval INTEGER NOT NULL DEFAULT 0,
  repetitions INTEGER NOT NULL DEFAULT 0,
  nextReview TEXT NOT NULL,
  lastReviewed TEXT,
  lapses INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (contentId) REFERENCES contents(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS study_sessions (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  cardsReviewed INTEGER NOT NULL DEFAULT 0,
  cardsCorrect INTEGER NOT NULL DEFAULT 0,
  cardsAgain INTEGER NOT NULL DEFAULT 0,
  timeSpent INTEGER NOT NULL DEFAULT 0,
  startedAt TEXT NOT NULL,
  completedAt TEXT
);

CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS exams (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sync_meta (
  id TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`);

const contentColumns = new Set(db.prepare('PRAGMA table_info(contents)').all().map((column) => column.name));
if (!contentColumns.has('studyGuide')) {
  db.exec("ALTER TABLE contents ADD COLUMN studyGuide TEXT NOT NULL DEFAULT '[]'");
}

// Migração de exames: AZ-204 → AI-200, AI-102 → AI-103
const existingExams = new Set(db.prepare('SELECT id FROM exams').all().map((row) => row.id));
if (existingExams.has('AZ-204')) {
  db.prepare('DELETE FROM exams WHERE id = ?').run('AZ-204');
}
if (existingExams.has('AI-102')) {
  db.prepare('DELETE FROM exams WHERE id = ?').run('AI-102');
}

// ---------------- helpers ----------------
const now = () => new Date().toISOString();

function parseJson(value, fallback) {
  if (value == null) return fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}

function stringifyJson(value) {
  return JSON.stringify(value ?? null);
}

function sourcePdfPath(contentId) {
  const safeId = crypto.createHash('sha256').update(contentId).digest('hex');
  return path.join(UPLOAD_DIR, `${safeId}.pdf`);
}

function mapContent(row) {
  if (!row) return undefined;
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    tags: parseJson(row.tags, []),
    flashcardsCount: row.flashcardsCount,
    reviewedCount: row.reviewedCount,
    mastery: row.mastery,
    lastStudied: row.lastStudied || undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    extractedText: row.extractedText || undefined,
    chunks: parseJson(row.chunks, []),
    studyGuide: parseJson(row.studyGuide, []),
    source: parseJson(row.source, {}),
  };
}

function mapFlashcard(row) {
  if (!row) return undefined;
  return {
    id: row.id,
    contentId: row.contentId,
    chunkId: row.chunkId || undefined,
    front: row.front,
    back: row.back,
    tags: parseJson(row.tags, []),
    kind: row.kind || undefined,
    easeFactor: row.easeFactor,
    interval: row.interval,
    repetitions: row.repetitions,
    nextReview: row.nextReview,
    lastReviewed: row.lastReviewed || undefined,
    lapses: row.lapses,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapSession(row) {
  if (!row) return undefined;
  return {
    id: row.id,
    date: row.date,
    cardsReviewed: row.cardsReviewed,
    cardsCorrect: row.cardsCorrect,
    cardsAgain: row.cardsAgain,
    timeSpent: row.timeSpent,
    startedAt: row.startedAt,
    completedAt: row.completedAt || undefined,
  };
}

// ---------------- seed ----------------
function seedDefaults() {
  const settingsCount = db.prepare('SELECT COUNT(*) AS c FROM settings').get().c;
  if (settingsCount === 0) {
    const defaultSettings = {
      id: 'user-settings',
      theme: 'system',
      dailyGoal: { studyTimeMinutes: 60, newCardsLimit: 20 },
      sessionBehavior: { autoPlayAudio: false, showAnswerTimer: true },
      notifications: { enabled: true, reminderTime: '19:00' },
      ai: {
        provider: 'gemini',
        model: 'gemini-3.1-flash-lite',
        focusOnExam: true,
        checkUpdates: true,
        contentQuestionRatio: { content: 30, questions: 70 },
      },
      data: { retention: '1year' },
    };
    db.prepare('INSERT INTO settings (id, data) VALUES (?, ?)').run('user-settings', stringifyJson(defaultSettings));
  }

  const examsCount = db.prepare('SELECT COUNT(*) AS c FROM exams').get().c;
  if (examsCount === 0) {
    // Imports lazy via dynamic import to avoid ESM path issues? Inline minimal.
    const ai200 = {
      id: 'AI-200',
      name: 'Azure AI Engineer Associate',
      code: 'AI-200',
      sourceUrl: 'https://learn.microsoft.com/credentials/certifications/azure-ai-engineer/',
      lastUpdated: now(),
      skills: [
        { id: 'ai200-1', title: 'Planejar e gerenciar uma solução de IA do Azure', description: 'Recursos, security, deployment, responsible AI', weight: 25, subSkills: ['Selecionar serviços: Cognitive Services, Azure ML, OpenAI', 'Provisionar recursos: accounts, endpoints, deployments', 'Security: RBAC, private endpoints, managed identities', 'Responsible AI: content filtering, abuse monitoring, fairness'] },
        { id: 'ai200-2', title: 'Implementar soluções de processamento de linguagem natural', description: 'Language, Translator, Speech, OpenAI', weight: 30, subSkills: ['Azure AI Language: NER, sentiment, key phrases, custom models', 'Translator: real-time, document, custom terminology', 'Speech: STT, TTS, translation, custom speech', 'Azure OpenAI: completions, chat, embeddings, fine-tuning'] },
        { id: 'ai200-3', title: 'Implementar soluções de conhecimento e pesquisa', description: 'AI Search, Document Intelligence, QnA Maker', weight: 20, subSkills: ['AI Search: indexes, skillsets, semantic search, vector search', 'Document Intelligence: prebuilt/custom models, layout, tables', 'QnA / Custom Question Answering: knowledge bases, chit-chat'] },
        { id: 'ai200-4', title: 'Implementar soluções de visão computacional', description: 'Vision, Face, Video Indexer, Custom Vision', weight: 15, subSkills: ['Vision: OCR, image analysis, spatial analysis, background removal', 'Custom Vision: classification, object detection, model export', 'Video Indexer: insights, labels, transcripts, customization'] },
        { id: 'ai200-5', title: 'Implementar soluções de IA generativa', description: 'Azure OpenAI, prompt engineering, RAG, agents', weight: 10, subSkills: ['Prompt engineering: few-shot, chain-of-thought, system prompts', 'RAG: chunking, embeddings, retrieval, grounding', 'Agents: function calling, plugins, orchestration', 'Evaluation: metrics, red-teaming, content safety'] },
      ],
    };
    const ai103 = {
      id: 'AI-103',
      name: 'Azure AI Solutions Architect',
      code: 'AI-103',
      sourceUrl: 'https://learn.microsoft.com/credentials/certifications/azure-ai-solutions-architect/',
      lastUpdated: now(),
      skills: [
        { id: 'ai103-1', title: 'Projetar soluções de IA', description: 'Arquitetura, segurança e escalabilidade', weight: 30, subSkills: ['Projetar arquiteturas escaláveis', 'Segurança de ponta a ponta', 'Governança de dados'] },
        { id: 'ai103-2', title: 'Integração e Orquestração', description: 'Integração de serviços', weight: 40, subSkills: ['Orquestração de modelos', 'Integração com ecossistema Azure'] },
        { id: 'ai103-3', title: 'Monitoramento e Otimização', description: 'Performance e custos', weight: 30, subSkills: ['Otimização de custos', 'Monitoramento de performance'] },
      ],
    };
    db.prepare('INSERT INTO exams (id, data) VALUES (?, ?)').run('AI-200', stringifyJson(ai200));
    db.prepare('INSERT INTO exams (id, data) VALUES (?, ?)').run('AI-103', stringifyJson(ai103));
  }
}

seedDefaults();

// Clean orphans
const allContentIds = new Set(db.prepare('SELECT id FROM contents').all().map((r) => r.id));
const allFlashcards = db.prepare('SELECT id, contentId FROM flashcards').all();
for (const fc of allFlashcards) {
  if (!allContentIds.has(fc.contentId)) {
    db.prepare('DELETE FROM flashcards WHERE id = ?').run(fc.id);
  }
}

// ---------------- HTTP helpers ----------------
function send(res, status, body, headers = {}) {
  const data = body == null ? '' : (typeof body === 'string' ? body : JSON.stringify(body));
  res.writeHead(status, { 'Content-Type': typeof body === 'string' ? 'text/plain; charset=utf-8' : 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', ...headers });
  res.end(data);
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => { data += chunk; if (data.length > 20_000_000) reject(new Error('payload too large')); });
    req.on('end', () => {
      if (!data) return resolve(null);
      try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

function getQuery(url) {
  const u = new URL(url, 'http://localhost');
  return Object.fromEntries(u.searchParams.entries());
}

function route(req, res) {
  const u = new URL(req.url, 'http://localhost');
  const pathname = u.pathname;

  if (req.method === 'OPTIONS') return send(res, 204, '');

  // health
  if (pathname === '/api/health' && req.method === 'GET') return send(res, 200, { ok: true });

  // contents
  if (pathname === '/api/contents' && req.method === 'GET') {
    const q = getQuery(req.url).q;
    let rows;
    if (q) {
      const lower = `%${String(q).toLowerCase()}%`;
      rows = db.prepare('SELECT * FROM contents WHERE lower(title) LIKE ? OR lower(tags) LIKE ? ORDER BY updatedAt DESC').all(lower, lower);
    } else {
      rows = db.prepare('SELECT * FROM contents ORDER BY updatedAt DESC').all();
    }
    return send(res, 200, rows.map(mapContent));
  }

  if (pathname === '/api/contents' && req.method === 'POST') {
    return parseBody(req).then((body) => {
      const id = crypto.randomUUID();
      const c = body || {};
      const t = now();
      db.prepare(`INSERT INTO contents (id,title,type,tags,flashcardsCount,reviewedCount,mastery,lastStudied,createdAt,updatedAt,extractedText,chunks,studyGuide,source)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
        id,
        c.title ?? '',
        c.type ?? 'text',
        stringifyJson(c.tags ?? []),
        Number(c.flashcardsCount ?? 0),
        Number(c.reviewedCount ?? 0),
        Number(c.mastery ?? 0),
        c.lastStudied ?? null,
        c.createdAt ?? t,
        c.updatedAt ?? t,
        c.extractedText ?? null,
        stringifyJson(c.chunks ?? []),
        stringifyJson(c.studyGuide ?? []),
        stringifyJson(c.source ?? {})
      );
      const row = db.prepare('SELECT * FROM contents WHERE id = ?').get(id);
      send(res, 201, mapContent(row));
    }).catch((e) => send(res, 400, { error: e.message }));
  }

  const sourceMatch = pathname.match(/^\/api\/contents\/([^/]+)\/source$/);
  if (sourceMatch) {
    const row = db.prepare('SELECT source FROM contents WHERE id = ?').get(sourceMatch[1]);
    if (!row) return send(res, 404, { error: 'Conteúdo não encontrado' });
    const source = parseJson(row.source, {});
    if (!source || source.type !== 'pdf') return send(res, 415, { error: 'Este conteúdo não possui um PDF de origem' });
    const pdfPath = sourcePdfPath(sourceMatch[1]);

    if (req.method === 'GET') {
      if (!fs.existsSync(pdfPath)) return send(res, 404, { error: 'PDF original não encontrado' });
      const fileName = String(source.fileName || 'material.pdf')
        .replace(/[^\x20-\x7E]/g, '_')
        .replace(/["\\]/g, '_');
      res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Length': fs.statSync(pdfPath).size,
        'Content-Disposition': `inline; filename="${fileName}"`,
        'Access-Control-Allow-Origin': '*',
      });
      const stream = fs.createReadStream(pdfPath);
      stream.on('error', (error) => {
        if (!res.headersSent) send(res, 500, { error: error.message });
        else res.destroy(error);
      });
      stream.pipe(res);
      return;
    }

    if (req.method === 'POST') {
      if (req.headers['content-type']?.split(';')[0] !== 'application/pdf') {
        return send(res, 415, { error: 'O arquivo deve ser um PDF' });
      }
      const contentLength = Number(req.headers['content-length'] || 0);
      if (contentLength > MAX_SOURCE_PDF_BYTES) {
        return send(res, 413, { error: 'PDF maior que 50MB' });
      }

      let receivedBytes = 0;
      const limiter = new Transform({
        transform(chunk, _encoding, callback) {
          receivedBytes += chunk.length;
          if (receivedBytes > MAX_SOURCE_PDF_BYTES) {
            callback(new Error('PDF maior que 50MB'));
            return;
          }
          callback(null, chunk);
        },
      });
      const temporaryPath = `${pdfPath}.${crypto.randomUUID()}.tmp`;
      return pipeline(req, limiter, fs.createWriteStream(temporaryPath, { flags: 'wx' }))
        .then(() => {
          if (receivedBytes === 0) {
            fs.rmSync(temporaryPath, { force: true });
            return send(res, 400, { error: 'O PDF está vazio' });
          }
          fs.renameSync(temporaryPath, pdfPath);
          db.prepare('UPDATE contents SET source = ?, updatedAt = ? WHERE id = ?').run(
            stringifyJson({ ...source, pdfStored: true }),
            now(),
            sourceMatch[1]
          );
          send(res, 204, '');
        })
        .catch((error) => {
          fs.rmSync(temporaryPath, { force: true });
          const status = receivedBytes > MAX_SOURCE_PDF_BYTES ? 413 : 400;
          send(res, status, { error: error.message });
        });
    }
  }

  if (pathname === '/api/contents/stats' && req.method === 'GET') {
    const all = db.prepare('SELECT type FROM contents').all();
    const byType = all.reduce((acc, c) => { acc[c.type] = (acc[c.type] || 0) + 1; return acc; }, {});
    const fc = db.prepare('SELECT COUNT(*) AS c FROM flashcards').get().c;
    return send(res, 200, { total: all.length, byType, totalFlashcards: fc });
  }

  let m = pathname.match(/^\/api\/contents\/([^/]+)$/);
  if (m && req.method === 'GET') {
    const row = db.prepare('SELECT * FROM contents WHERE id = ?').get(m[1]);
    if (!row) return send(res, 404, { error: 'not found' });
    return send(res, 200, mapContent(row));
  }
  if (m && req.method === 'PATCH') {
    return parseBody(req).then((body) => {
      const changes = body || {};
      const fields = [];
      const params = [];
      const columnMap = {
        title: 'title', type: 'type', tags: 'tags', flashcardsCount: 'flashcardsCount',
        reviewedCount: 'reviewedCount', mastery: 'mastery', lastStudied: 'lastStudied',
        extractedText: 'extractedText', chunks: 'chunks', studyGuide: 'studyGuide',
        source: 'source', updatedAt: 'updatedAt',
      };
      for (const key of Object.keys(changes)) {
        if (columnMap[key]) {
          fields.push(`${columnMap[key]} = ?`);
          params.push(['tags','chunks','studyGuide','source'].includes(key) ? stringifyJson(changes[key]) : changes[key]);
        }
      }
      if (!fields.includes('updatedAt = ?')) {
        fields.push('updatedAt = ?');
        params.push(now());
      }
      params.push(m[1]);
      db.prepare(`UPDATE contents SET ${fields.join(', ')} WHERE id = ?`).run(...params);
      const row = db.prepare('SELECT * FROM contents WHERE id = ?').get(m[1]);
      if (!row) return send(res, 404, { error: 'not found' });
      send(res, 200, mapContent(row));
    }).catch((e) => send(res, 400, { error: e.message }));
  }
  if (m && req.method === 'DELETE') {
    db.prepare('DELETE FROM flashcards WHERE contentId = ?').run(m[1]);
    db.prepare('DELETE FROM contents WHERE id = ?').run(m[1]);
    fs.rmSync(sourcePdfPath(m[1]), { force: true });
    return send(res, 204, '');
  }

  // flashcards
  if (pathname === '/api/flashcards' && req.method === 'GET') {
    const { contentId, limit } = getQuery(req.url);
    let rows;
    if (contentId) rows = db.prepare('SELECT * FROM flashcards WHERE contentId = ?').all(contentId);
    else rows = db.prepare('SELECT * FROM flashcards').all();
    if (limit) rows = rows.slice(0, Number(limit));
    return send(res, 200, rows.map(mapFlashcard));
  }

  if (pathname === '/api/flashcards/due' && req.method === 'GET') {
    const { limit } = getQuery(req.url);
    const nowStr = now();
    let rows = db.prepare('SELECT * FROM flashcards WHERE nextReview <= ? ORDER BY nextReview ASC').all(nowStr);
    if (limit) rows = rows.slice(0, Number(limit));
    return send(res, 200, rows.map(mapFlashcard));
  }

  if (pathname === '/api/flashcards/new' && req.method === 'GET') {
    const { contentId, limit } = getQuery(req.url);
    let rows;
    if (contentId) {
      rows = db.prepare('SELECT * FROM flashcards WHERE contentId = ? AND repetitions = 0 ORDER BY createdAt ASC').all(contentId);
    } else {
      rows = db.prepare('SELECT * FROM flashcards WHERE repetitions = 0 ORDER BY createdAt ASC').all();
    }
    if (limit) rows = rows.slice(0, Number(limit));
    return send(res, 200, rows.map(mapFlashcard));
  }

  if (pathname === '/api/flashcards/stats' && req.method === 'GET') {
    const { contentId } = getQuery(req.url);
    let baseQuery = 'SELECT * FROM flashcards';
    const params = [];
    if (contentId) { baseQuery += ' WHERE contentId = ?'; params.push(contentId); }
    const all = db.prepare(baseQuery).all(...params);
    const nowStr = now();
    return send(res, 200, {
      total: all.length,
      due: all.filter((c) => c.nextReview <= nowStr && c.repetitions > 0).length,
      newCards: all.filter((c) => c.repetitions === 0).length,
      learning: all.filter((c) => c.repetitions > 0 && c.interval < 21).length,
      review: all.filter((c) => c.interval >= 21).length,
    });
  }

  if (pathname === '/api/flashcards/bulk' && req.method === 'POST') {
    return parseBody(req).then((body) => {
      const items = (body && body.flashcards) ? body.flashcards : (Array.isArray(body) ? body : []);
      const ids = [];
      const t = now();
      const stmt = db.prepare(`INSERT INTO flashcards (id,contentId,chunkId,front,back,tags,kind,easeFactor,interval,repetitions,nextReview,lastReviewed,lapses,createdAt,updatedAt)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
      for (const fc of items) {
        const id = crypto.randomUUID();
        stmt.run(
          id,
          fc.contentId,
          fc.chunkId ?? null,
          fc.front,
          fc.back,
          stringifyJson(fc.tags ?? []),
          fc.kind ?? null,
          Number(fc.easeFactor ?? 2.5),
          Number(fc.interval ?? 0),
          Number(fc.repetitions ?? 0),
          fc.nextReview ?? t,
          fc.lastReviewed ?? null,
          Number(fc.lapses ?? 0),
          fc.createdAt ?? t,
          fc.updatedAt ?? t
        );
        ids.push(id);
      }
      send(res, 201, ids);
    }).catch((e) => send(res, 400, { error: e.message }));
  }

  m = pathname.match(/^\/api\/flashcards\/([^/]+)$/);
  if (m && req.method === 'PATCH') {
    return parseBody(req).then((body) => {
      const changes = body || {};
      const fields = [];
      const params = [];
      const columnMap = {
        contentId: 'contentId', chunkId: 'chunkId', front: 'front', back: 'back',
        tags: 'tags', kind: 'kind', easeFactor: 'easeFactor', interval: 'interval',
        repetitions: 'repetitions', nextReview: 'nextReview', lastReviewed: 'lastReviewed',
        lapses: 'lapses', updatedAt: 'updatedAt',
      };
      for (const key of Object.keys(changes)) {
        if (columnMap[key]) {
          fields.push(`${columnMap[key]} = ?`);
          params.push(['tags'].includes(key) ? stringifyJson(changes[key]) : changes[key]);
        }
      }
      if (!fields.includes('updatedAt = ?')) {
        fields.push('updatedAt = ?');
        params.push(now());
      }
      params.push(m[1]);
      db.prepare(`UPDATE flashcards SET ${fields.join(', ')} WHERE id = ?`).run(...params);
      send(res, 204, '');
    }).catch((e) => send(res, 400, { error: e.message }));
  }
  if (m && req.method === 'DELETE') {
    db.prepare('DELETE FROM flashcards WHERE id = ?').run(m[1]);
    return send(res, 204, '');
  }

  if (pathname === '/api/flashcards/bulk-update' && req.method === 'POST') {
    return parseBody(req).then((body) => {
      const updates = body?.updates ?? [];
      for (const u of updates) {
        const fields = [];
        const params = [];
        const changes = u.changes || {};
        const columnMap = {
          contentId: 'contentId', chunkId: 'chunkId', front: 'front', back: 'back',
          tags: 'tags', kind: 'kind', easeFactor: 'easeFactor', interval: 'interval',
          repetitions: 'repetitions', nextReview: 'nextReview', lastReviewed: 'lastReviewed',
          lapses: 'lapses',
        };
        for (const key of Object.keys(changes)) {
          if (columnMap[key]) {
            fields.push(`${columnMap[key]} = ?`);
            params.push(['tags'].includes(key) ? stringifyJson(changes[key]) : changes[key]);
          }
        }
        if (fields.length === 0) continue;
        fields.push('updatedAt = ?');
        params.push(now());
        params.push(u.id);
        db.prepare(`UPDATE flashcards SET ${fields.join(', ')} WHERE id = ?`).run(...params);
      }
      send(res, 204, '');
    }).catch((e) => send(res, 400, { error: e.message }));
  }

  // sessions
  if (pathname === '/api/sessions' && req.method === 'POST') {
    return parseBody(req).then((body) => {
      const c = body || {};
      const id = crypto.randomUUID();
      const t = now();
      db.prepare(`INSERT INTO study_sessions (id,date,cardsReviewed,cardsCorrect,cardsAgain,timeSpent,startedAt,completedAt)
        VALUES (?,?,?,?,?,?,?,?)`).run(
        id,
        c.date ?? t.slice(0, 10),
        Number(c.cardsReviewed ?? 0),
        Number(c.cardsCorrect ?? 0),
        Number(c.cardsAgain ?? 0),
        Number(c.timeSpent ?? 0),
        c.startedAt ?? t,
        c.completedAt ?? null
      );
      send(res, 201, id);
    }).catch((e) => send(res, 400, { error: e.message }));
  }

  m = pathname.match(/^\/api\/sessions\/([^/]+)$/);
  if (m && req.method === 'PATCH') {
    return parseBody(req).then((body) => {
      const changes = body || {};
      const fields = [];
      const params = [];
      const columnMap = { date: 'date', cardsReviewed: 'cardsReviewed', cardsCorrect: 'cardsCorrect', cardsAgain: 'cardsAgain', timeSpent: 'timeSpent', startedAt: 'startedAt', completedAt: 'completedAt' };
      for (const key of Object.keys(changes)) {
        if (columnMap[key]) {
          fields.push(`${columnMap[key]} = ?`);
          params.push(changes[key] ?? null);
        }
      }
      if (fields.length === 0) return send(res, 204, '');
      params.push(m[1]);
      db.prepare(`UPDATE study_sessions SET ${fields.join(', ')} WHERE id = ?`).run(...params);
      send(res, 204, '');
    }).catch((e) => send(res, 400, { error: e.message }));
  }

  if (pathname === '/api/sessions/recent' && req.method === 'GET') {
    const { limit } = getQuery(req.url);
    const rows = db.prepare('SELECT * FROM study_sessions ORDER BY startedAt DESC LIMIT ?').all(Number(limit || 10));
    return send(res, 200, rows.map(mapSession));
  }

  if (pathname === '/api/sessions/by-date' && req.method === 'GET') {
    const { date } = getQuery(req.url);
    const rows = db.prepare('SELECT * FROM study_sessions WHERE date = ?').all(date);
    return send(res, 200, rows.map(mapSession));
  }

  if (pathname === '/api/sessions/streak' && req.method === 'GET') {
    const sessions = db.prepare('SELECT date FROM study_sessions ORDER BY date DESC').all();
    // simpler count distinct recent days
    let streak = 0;
    const today = new Date(); today.setHours(0,0,0,0);
    const dates = [...new Set(sessions.map((s) => s.date))].sort().reverse();
    for (let i = 0; i < dates.length; i++) {
      const d = new Date(dates[i]); d.setHours(0,0,0,0);
      const diff = Math.floor((today.getTime() - d.getTime()) / 86400000);
      if (diff === i || (i === 0 && diff === 1)) streak++;
      else break;
    }
    return send(res, 200, streak);
  }

  if (pathname === '/api/sessions/total-stats' && req.method === 'GET') {
    const sessions = db.prepare('SELECT * FROM study_sessions').all();
    return send(res, 200, {
      totalSessions: sessions.length,
      totalCards: sessions.reduce((s, x) => s + x.cardsReviewed, 0),
      totalTime: sessions.reduce((s, x) => s + x.timeSpent, 0),
      avgAccuracy: sessions.length > 0 ? sessions.reduce((s, x) => s + (x.cardsReviewed > 0 ? x.cardsCorrect / x.cardsReviewed : 0), 0) / sessions.length : 0,
    });
  }

  // settings
  if (pathname === '/api/settings' && req.method === 'GET') {
    const row = db.prepare('SELECT data FROM settings WHERE id = ?').get('user-settings');
    if (!row) return send(res, 404, { error: 'not found' });
    return send(res, 200, JSON.parse(row.data));
  }
  if (pathname === '/api/settings' && req.method === 'PATCH') {
    return parseBody(req).then((changes) => {
      const row = db.prepare('SELECT data FROM settings WHERE id = ?').get('user-settings');
      const current = row ? JSON.parse(row.data) : {};
      const merged = { ...current, ...(changes || {}) };
      if (changes?.dailyGoal) merged.dailyGoal = { ...current.dailyGoal, ...changes.dailyGoal };
      if (changes?.sessionBehavior) merged.sessionBehavior = { ...current.sessionBehavior, ...changes.sessionBehavior };
      if (changes?.notifications) merged.notifications = { ...current.notifications, ...changes.notifications };
      if (changes?.ai) merged.ai = { ...current.ai, ...changes.ai };
      if (changes?.data) merged.data = { ...current.data, ...changes.data };
      db.prepare('INSERT OR REPLACE INTO settings (id, data) VALUES (?, ?)').run('user-settings', stringifyJson({ ...merged, id: 'user-settings' }));
      send(res, 204, '');
    }).catch((e) => send(res, 400, { error: e.message }));
  }
  if (pathname === '/api/settings/reset' && req.method === 'POST') {
    db.prepare('DELETE FROM settings WHERE id = ?').run('user-settings');
    seedDefaults();
    return send(res, 204, '');
  }

  // exams
  if (pathname === '/api/exams' && req.method === 'GET') {
    const rows = db.prepare('SELECT data FROM exams').all();
    return send(res, 200, rows.map((r) => JSON.parse(r.data)));
  }
  m = pathname.match(/^\/api\/exams\/([^/]+)$/);
  if (m && req.method === 'GET') {
    const row = db.prepare('SELECT data FROM exams WHERE id = ?').get(m[1]);
    if (!row) return send(res, 404, { error: 'not found' });
    return send(res, 200, JSON.parse(row.data));
  }
  if (pathname === '/api/exams/last-checked' && req.method === 'PATCH') {
    return parseBody(req).then((body) => {
      const code = body?.code;
      const row = db.prepare('SELECT data FROM exams WHERE id = ?').get(code);
      if (row) {
        const data = JSON.parse(row.data);
        data.lastUpdated = now();
        db.prepare('UPDATE exams SET data = ? WHERE id = ?').run(stringifyJson(data), code);
      }
      send(res, 204, '');
    }).catch((e) => send(res, 400, { error: e.message }));
  }

  // sync meta
  if (pathname === '/api/sync/check' && req.method === 'GET') {
    const lastSyncRow = db.prepare('SELECT value FROM sync_meta WHERE id = ?').get('sync');
    const lastSync = lastSyncRow?.value || '1970-01-01';
    const tenDaysAgo = new Date(); tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    if (new Date(lastSync) > tenDaysAgo) return send(res, 200, { updated: false, reason: 'Recent sync' });

    const updatesNeeded = [];
    const manifest = {
      'AI-200': '2026.10.01',
      'AI-103': '2026.09.15',
    };
    for (const examId in manifest) {
      const local = db.prepare('SELECT value FROM sync_meta WHERE id = ?').get(`version_${examId}`);
      if (local?.value !== manifest[examId]) updatesNeeded.push(examId);
    }
    return send(res, 200, { updated: updatesNeeded.length > 0, exams: updatesNeeded });
  }
  if (pathname === '/api/sync/mark-synced' && req.method === 'POST') {
    db.prepare('INSERT OR REPLACE INTO sync_meta (id, value) VALUES (?, ?)').run('sync', now().slice(0, 10));
    return send(res, 204, '');
  }
  if (pathname === '/api/sync/update-version' && req.method === 'POST') {
    return parseBody(req).then((body) => {
      db.prepare('INSERT OR REPLACE INTO sync_meta (id, value) VALUES (?, ?)').run(`version_${body.examId}`, body.version);
      send(res, 204, '');
    }).catch((e) => send(res, 400, { error: e.message }));
  }

  // export/import
  if (pathname === '/api/export' && req.method === 'GET') {
    const contents = db.prepare('SELECT * FROM contents').all().map(mapContent);
    const flashcards = db.prepare('SELECT * FROM flashcards').all().map(mapFlashcard);
    const sessions = db.prepare('SELECT * FROM study_sessions').all().map(mapSession);
    const settingsRow = db.prepare('SELECT data FROM settings').all().map((r) => JSON.parse(r.data));
    const exams = db.prepare('SELECT data FROM exams').all().map((r) => JSON.parse(r.data));
    const syncMeta = db.prepare('SELECT * FROM sync_meta').all().map((r) => ({ id: r.id, value: r.value }));
    return send(res, 200, { contents, flashcards, sessions, settings: settingsRow, exams, syncMeta, exportedAt: now() });
  }
  if (pathname === '/api/import' && req.method === 'POST') {
    return parseBody(req).then((data) => {
      db.exec('BEGIN IMMEDIATE');
      try {
        if (data?.contents) for (const c of data.contents) {
          const importedSource = { ...(c.source ?? {}) };
          if (importedSource.type === 'pdf') {
            importedSource.pdfStored = fs.existsSync(sourcePdfPath(c.id));
          }
          db.prepare(`INSERT OR REPLACE INTO contents (id,title,type,tags,flashcardsCount,reviewedCount,mastery,lastStudied,createdAt,updatedAt,extractedText,chunks,studyGuide,source)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
            c.id, c.title, c.type, stringifyJson(c.tags ?? []), c.flashcardsCount ?? 0, c.reviewedCount ?? 0, c.mastery ?? 0,
            c.lastStudied ?? null, c.createdAt ?? now(), c.updatedAt ?? now(), c.extractedText ?? null,
            stringifyJson(c.chunks ?? []), stringifyJson(c.studyGuide ?? []), stringifyJson(importedSource)
          );
        }
        if (data?.flashcards) for (const f of data.flashcards) {
          db.prepare(`INSERT OR REPLACE INTO flashcards (id,contentId,chunkId,front,back,tags,kind,easeFactor,interval,repetitions,nextReview,lastReviewed,lapses,createdAt,updatedAt)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
            f.id, f.contentId, f.chunkId ?? null, f.front, f.back, stringifyJson(f.tags ?? []), f.kind ?? null,
            f.easeFactor ?? 2.5, f.interval ?? 0, f.repetitions ?? 0, f.nextReview ?? now(), f.lastReviewed ?? null,
            f.lapses ?? 0, f.createdAt ?? now(), f.updatedAt ?? now()
          );
        }
        if (data?.sessions) for (const s of data.sessions) {
          db.prepare(`INSERT OR REPLACE INTO study_sessions (id,date,cardsReviewed,cardsCorrect,cardsAgain,timeSpent,startedAt,completedAt)
            VALUES (?,?,?,?,?,?,?,?)`).run(
            s.id, s.date, s.cardsReviewed ?? 0, s.cardsCorrect ?? 0, s.cardsAgain ?? 0, s.timeSpent ?? 0,
            s.startedAt ?? now(), s.completedAt ?? null
          );
        }
        if (data?.settings) for (const s of data.settings) {
          db.prepare('INSERT OR REPLACE INTO settings (id, data) VALUES (?, ?)').run(s.id, stringifyJson(s));
        }
        if (data?.exams) for (const e of data.exams) {
          db.prepare('INSERT OR REPLACE INTO exams (id, data) VALUES (?, ?)').run(e.id, stringifyJson(e));
        }
        if (data?.syncMeta) for (const s of data.syncMeta) {
          db.prepare('INSERT OR REPLACE INTO sync_meta (id, value) VALUES (?, ?)').run(s.id, s.value);
        }
        db.exec('COMMIT');
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
      send(res, 204, '');
    }).catch((e) => send(res, 400, { error: e.message }));
  }

  if (pathname === '/api/reset' && req.method === 'POST') {
    db.exec('DELETE FROM contents; DELETE FROM flashcards; DELETE FROM study_sessions; DELETE FROM settings; DELETE FROM exams; DELETE FROM sync_meta;');
    seedDefaults();
    return send(res, 204, '');
  }

  send(res, 404, { error: 'Not found' });
}

const server = http.createServer((req, res) => {
  try {
    route(req, res);
  } catch (e) {
    send(res, 500, { error: e?.message || 'Internal error' });
  }
});

server.listen(PORT, () => {
  console.log(`SafeZone API listening on http://localhost:${PORT}`);
  console.log(`DB: ${DB_PATH}`);
});
