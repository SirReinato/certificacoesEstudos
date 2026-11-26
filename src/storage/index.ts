/**
 * Storage Layer — Supabase BaaS (PostgreSQL + RLS + Storage)
 * Persistência unificada com controle de acesso por usuário via auth.uid()
 */

import { supabase } from '../services/supabaseClient';
import type {
  Content,
  Flashcard,
  StudySession,
  UserSettings,
  Exam,
} from '../types';

// ============================================
// CONVERSÃO DE ENTIDADES (camelCase <-> snake_case)
// ============================================

function toContent(row: Record<string, unknown>): Content {
  return {
    id: String(row.id),
    title: String(row.title),
    type: (row.type as Content['type']) || 'text',
    source: (row.source as Content['source']) || { type: 'text' },
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    flashcardsCount: Number(row.flashcards_count ?? 0),
    reviewedCount: Number(row.reviewed_count ?? 0),
    mastery: Number(row.mastery ?? 0),
    extractedText: row.extracted_text ? String(row.extracted_text) : undefined,
    chunks: Array.isArray(row.chunks) ? (row.chunks as Content['chunks']) : undefined,
    studyGuide: Array.isArray(row.study_guide) ? (row.study_guide as Content['studyGuide']) : undefined,
    storagePath: row.storage_path ? String(row.storage_path) : undefined,
    createdAt: row.created_at ? String(row.created_at) : new Date().toISOString(),
    updatedAt: row.updated_at ? String(row.updated_at) : new Date().toISOString(),
  };
}

function fromContent(content: Partial<Content>, userId: string): Record<string, unknown> {
  const row: Record<string, unknown> = { user_id: userId };
  if (content.title !== undefined) row.title = content.title;
  if (content.type !== undefined) row.type = content.type;
  if (content.source !== undefined) row.source = content.source;
  if (content.tags !== undefined) row.tags = content.tags;
  if (content.flashcardsCount !== undefined) row.flashcards_count = content.flashcardsCount;
  if (content.reviewedCount !== undefined) row.reviewed_count = content.reviewedCount;
  if (content.mastery !== undefined) row.mastery = content.mastery;
  if (content.extractedText !== undefined) row.extracted_text = content.extractedText;
  if (content.chunks !== undefined) row.chunks = content.chunks;
  if (content.studyGuide !== undefined) row.study_guide = content.studyGuide;
  if (content.storagePath !== undefined) row.storage_path = content.storagePath;
  return row;
}

function toFlashcard(row: Record<string, unknown>): Flashcard {
  return {
    id: String(row.id),
    contentId: String(row.content_id),
    front: String(row.front),
    back: String(row.back),
    format: (row.format as 'flip' | 'multiple-choice') || 'flip',
    options: Array.isArray(row.options) ? (row.options as Flashcard['options']) : undefined,
    explanation: row.explanation ? String(row.explanation) : undefined,
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    difficulty: (row.difficulty as Flashcard['difficulty']) || 'medium',
    importance: Number(row.importance ?? 5),
    kind: 'question',
    easeFactor: Number(row.ease_factor ?? 2.5),
    interval: Number(row.interval ?? 0),
    repetitions: Number(row.repetitions ?? 0),
    nextReview: row.next_review ? String(row.next_review) : new Date().toISOString(),
    lastReviewed: row.last_reviewed ? String(row.last_reviewed) : undefined,
    lapses: Number(row.lapses ?? 0),
    createdAt: row.created_at ? String(row.created_at) : new Date().toISOString(),
    updatedAt: row.updated_at ? String(row.updated_at) : new Date().toISOString(),
  };
}

function fromFlashcard(fc: Partial<Flashcard>, userId: string): Record<string, unknown> {
  const row: Record<string, unknown> = { user_id: userId };
  if (fc.contentId !== undefined) row.content_id = fc.contentId;
  if (fc.front !== undefined) row.front = fc.front;
  if (fc.back !== undefined) row.back = fc.back;
  if (fc.format !== undefined) row.format = fc.format;
  if (fc.options !== undefined) row.options = fc.options;
  if (fc.explanation !== undefined) row.explanation = fc.explanation;
  if (fc.tags !== undefined) row.tags = fc.tags;
  if (fc.difficulty !== undefined) row.difficulty = fc.difficulty;
  if (fc.importance !== undefined) row.importance = fc.importance;
  if (fc.easeFactor !== undefined) row.ease_factor = fc.easeFactor;
  if (fc.interval !== undefined) row.interval = fc.interval;
  if (fc.repetitions !== undefined) row.repetitions = fc.repetitions;
  if (fc.nextReview !== undefined) row.next_review = fc.nextReview;
  if (fc.lastReviewed !== undefined) row.last_reviewed = fc.lastReviewed;
  if (fc.lapses !== undefined) row.lapses = fc.lapses;
  return row;
}

function toSession(row: Record<string, unknown>): StudySession {
  const startTime = String(row.start_time || new Date().toISOString());
  return {
    id: String(row.id),
    date: startTime.split('T')[0],
    startedAt: startTime,
    startTime,
    endTime: row.end_time ? String(row.end_time) : undefined,
    timeSpent: Number(row.duration_minutes ?? 0) * 60,
    durationMinutes: Number(row.duration_minutes ?? 0),
    cardsReviewed: Number(row.cards_reviewed ?? 0),
    cardsCorrect: Number(row.cards_correct ?? 0),
    cardsAgain: Number(row.cards_again ?? 0),
    cardsHard: Number(row.cards_hard ?? 0),
    cardsGood: Number(row.cards_good ?? 0),
    cardsEasy: Number(row.cards_easy ?? 0),
    accuracy: Number(row.accuracy ?? 0),
    contentIds: Array.isArray(row.content_ids) ? (row.content_ids as string[]) : [],
  };
}

async function requireUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado.');
  return user.id;
}

// ============================================
// INICIALIZAÇÃO
// ============================================

export async function initDB(): Promise<void> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    console.info('[Supabase] Sessão não ativa. Usuário redirecionado para login.');
  }
}

export async function initDefaultSettings(): Promise<void> {}
export async function initDefaultExams(): Promise<void> {}

// ============================================
// CONTENT SERVICE
// ============================================

export const contentService = {
  async getAll(): Promise<Content[]> {
    const { data, error } = await supabase
      .from('contents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Falha ao buscar conteúdos: ${error.message}`);
    return (data || []).map(toContent);
  },

  async getById(id: string): Promise<Content | undefined> {
    const { data, error } = await supabase
      .from('contents')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) return undefined;
    return toContent(data);
  },

  async create(content: Omit<Content, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const userId = await requireUserId();
    const row = fromContent(content, userId);

    const { data, error } = await supabase
      .from('contents')
      .insert(row)
      .select('id')
      .single();

    if (error) throw new Error(`Falha ao criar conteúdo: ${error.message}`);
    return data.id;
  },

  async uploadSourceFile(id: string, file: File): Promise<void> {
    const userId = await requireUserId();
    const filePath = `${userId}/${id}/${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from('study-assets')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      throw new Error(`Falha no upload do arquivo para Supabase Storage: ${uploadError.message}`);
    }

    await this.update(id, { storagePath: filePath });
  },

  async update(id: string, changes: Partial<Content>): Promise<void> {
    const userId = await requireUserId();
    const row = fromContent(changes, userId);
    row.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('contents')
      .update(row)
      .eq('id', id);

    if (error) throw new Error(`Falha ao atualizar conteúdo: ${error.message}`);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('contents')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Falha ao excluir conteúdo: ${error.message}`);
  },

  async search(query: string): Promise<Content[]> {
    const { data, error } = await supabase
      .from('contents')
      .select('*')
      .ilike('title', `%${query}%`)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Falha na busca de conteúdos: ${error.message}`);
    return (data || []).map(toContent);
  },

  async getByType(type: Content['type']): Promise<Content[]> {
    const { data, error } = await supabase
      .from('contents')
      .select('*')
      .eq('type', type)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Falha ao filtrar conteúdos: ${error.message}`);
    return (data || []).map(toContent);
  },

  async getStats(): Promise<{ total: number; byType: Record<string, number>; totalFlashcards: number }> {
    const all = await this.getAll();
    const byType: Record<string, number> = {};
    let totalFlashcards = 0;

    for (const c of all) {
      byType[c.type] = (byType[c.type] || 0) + 1;
      totalFlashcards += c.flashcardsCount || 0;
    }

    return {
      total: all.length,
      byType,
      totalFlashcards,
    };
  },
};

// ============================================
// FLASHCARD SERVICE
// ============================================

export const flashcardService = {
  async getAll(): Promise<Flashcard[]> {
    const { data, error } = await supabase
      .from('flashcards')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Falha ao buscar flashcards: ${error.message}`);
    return (data || []).map(toFlashcard);
  },

  async getByContentId(contentId: string): Promise<Flashcard[]> {
    const { data, error } = await supabase
      .from('flashcards')
      .select('*')
      .eq('content_id', contentId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Falha ao buscar flashcards: ${error.message}`);
    return (data || []).map(toFlashcard);
  },

  async getDue(limit?: number, contentId?: string, now = new Date().toISOString()): Promise<Flashcard[]> {
    let query = supabase
      .from('flashcards')
      .select('*')
      .or('last_reviewed.not.is.null,repetitions.gt.0,lapses.gt.0')
      .lte('next_review', now)
      .order('next_review', { ascending: true })
      .order('id', { ascending: true });

    if (contentId) query = query.eq('content_id', contentId);

    if (limit) query = query.limit(limit);

    const { data, error } = await query;
    if (error) throw new Error(`Falha ao buscar flashcards para revisão: ${error.message}`);
    return (data || []).map(toFlashcard);
  },

  async getNewCards(contentId?: string, limit?: number): Promise<Flashcard[]> {
    let query = supabase
      .from('flashcards')
      .select('*')
      .is('last_reviewed', null)
      .eq('repetitions', 0)
      .eq('lapses', 0)
      .order('importance', { ascending: false })
      .order('created_at', { ascending: true })
      .order('id', { ascending: true });

    if (contentId) query = query.eq('content_id', contentId);
    if (limit) query = query.limit(limit);

    const { data, error } = await query;
    if (error) throw new Error(`Falha ao buscar novos flashcards: ${error.message}`);
    return (data || []).map(toFlashcard);
  },

  async getUpcoming(contentId: string, now: string, limit: number): Promise<Flashcard[]> {
    const { data, error } = await supabase
      .from('flashcards')
      .select('*')
      .eq('content_id', contentId)
      .gt('next_review', now)
      .order('next_review', { ascending: true })
      .order('id', { ascending: true })
      .limit(limit);

    if (error) throw new Error(`Falha ao buscar próximas revisões: ${error.message}`);
    return (data || []).map(toFlashcard);
  },

  async createMany(flashcards: Omit<Flashcard, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<string[]> {
    if (flashcards.length === 0) return [];
    const userId = await requireUserId();
    const rows = flashcards.map((fc) => fromFlashcard(fc, userId));

    const { data, error } = await supabase
      .from('flashcards')
      .insert(rows)
      .select('id');

    if (error) throw new Error(`Falha ao criar flashcards: ${error.message}`);
    return (data || []).map((r) => r.id);
  },

  async update(id: string, changes: Partial<Flashcard>): Promise<void> {
    const userId = await requireUserId();
    const row = fromFlashcard(changes, userId);
    row.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('flashcards')
      .update(row)
      .eq('id', id);

    if (error) throw new Error(`Falha ao atualizar flashcard: ${error.message}`);
  },

  async bulkUpdate(updates: { id: string; changes: Partial<Flashcard> }[]): Promise<void> {
    for (const update of updates) {
      await this.update(update.id, update.changes);
    }
  },

  async getStats(contentId?: string): Promise<{ total: number; due: number; newCards: number; learning: number; review: number }> {
    const all = contentId ? await this.getByContentId(contentId) : await this.getAll();
    const now = new Date();

    let due = 0;
    let newCards = 0;
    let learning = 0;
    let review = 0;

    for (const card of all) {
      if (card.repetitions === 0) {
        newCards++;
      } else if (card.interval < 21) {
        learning++;
      } else {
        review++;
      }

      if (new Date(card.nextReview) <= now) {
        due++;
      }
    }

    return { total: all.length, due, newCards, learning, review };
  },
};

// ============================================
// SESSION SERVICE
// ============================================

export const sessionService = {
  async create(session: Omit<StudySession, 'id'>): Promise<string> {
    const userId = await requireUserId();
    const row = {
      user_id: userId,
      start_time: session.startTime,
      end_time: session.endTime,
      duration_minutes: session.durationMinutes,
      cards_reviewed: session.cardsReviewed,
      cards_correct: session.cardsCorrect,
      cards_again: session.cardsAgain,
      cards_hard: session.cardsHard,
      cards_good: session.cardsGood,
      cards_easy: session.cardsEasy,
      accuracy: session.accuracy,
      content_ids: session.contentIds,
    };

    const { data, error } = await supabase
      .from('study_sessions')
      .insert(row)
      .select('id')
      .single();

    if (error) throw new Error(`Falha ao salvar sessão de estudo: ${error.message}`);
    return data.id;
  },

  async update(id: string, changes: Partial<StudySession>): Promise<void> {
    const row: Record<string, unknown> = {};
    if (changes.endTime !== undefined) row.end_time = changes.endTime;
    if (changes.durationMinutes !== undefined) row.duration_minutes = changes.durationMinutes;
    if (changes.cardsReviewed !== undefined) row.cards_reviewed = changes.cardsReviewed;
    if (changes.cardsCorrect !== undefined) row.cards_correct = changes.cardsCorrect;
    if (changes.cardsAgain !== undefined) row.cards_again = changes.cardsAgain;
    if (changes.cardsHard !== undefined) row.cards_hard = changes.cardsHard;
    if (changes.cardsGood !== undefined) row.cards_good = changes.cardsGood;
    if (changes.cardsEasy !== undefined) row.cards_easy = changes.cardsEasy;
    if (changes.accuracy !== undefined) row.accuracy = changes.accuracy;
    if (changes.contentIds !== undefined) row.content_ids = changes.contentIds;

    const { error } = await supabase
      .from('study_sessions')
      .update(row)
      .eq('id', id);

    if (error) throw new Error(`Falha ao atualizar sessão: ${error.message}`);
  },

  async getByDate(date: string): Promise<StudySession[]> {
    const { data, error } = await supabase
      .from('study_sessions')
      .select('*')
      .gte('start_time', `${date}T00:00:00.000Z`)
      .lte('start_time', `${date}T23:59:59.999Z`)
      .order('start_time', { ascending: false });

    if (error) throw new Error(`Falha ao buscar sessões da data: ${error.message}`);
    return (data || []).map(toSession);
  },

  async getRecent(limit: number): Promise<StudySession[]> {
    const { data, error } = await supabase
      .from('study_sessions')
      .select('*')
      .order('start_time', { ascending: false })
      .limit(limit);

    if (error) throw new Error(`Falha ao buscar sessões recentes: ${error.message}`);
    return (data || []).map(toSession);
  },

  async getStreak(): Promise<number> {
    const { data } = await supabase
      .from('study_sessions')
      .select('start_time')
      .order('start_time', { ascending: false });

    if (!data || data.length === 0) return 0;

    const uniqueDays = new Set(
      data.map((s) => new Date(s.start_time).toISOString().split('T')[0])
    );

    const sortedDays = Array.from(uniqueDays).sort().reverse();
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (!sortedDays.includes(today) && !sortedDays.includes(yesterday)) {
      return 0;
    }

    let streak = 0;
    let checkDate = sortedDays.includes(today) ? new Date() : new Date(Date.now() - 86400000);

    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (sortedDays.includes(dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  },

  async getTotalStats(): Promise<{ totalSessions: number; totalCards: number; totalTime: number; avgAccuracy: number }> {
    const { data } = await supabase.from('study_sessions').select('*');
    if (!data || data.length === 0) {
      return { totalSessions: 0, totalCards: 0, totalTime: 0, avgAccuracy: 0 };
    }

    let totalCards = 0;
    let totalTime = 0;
    let sumAccuracy = 0;

    for (const s of data) {
      totalCards += Number(s.cards_reviewed || 0);
      totalTime += Number(s.duration_minutes || 0);
      sumAccuracy += Number(s.accuracy || 0);
    }

    return {
      totalSessions: data.length,
      totalCards,
      totalTime,
      avgAccuracy: Math.round(sumAccuracy / data.length),
    };
  },
};

// ============================================
// SETTINGS SERVICE
// ============================================

export const settingsService = {
  async get(): Promise<UserSettings | undefined> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return undefined;

    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error || !data) return undefined;
    return {
      theme: data.theme || 'system',
      dailyGoal:
        typeof data.daily_goal === 'object' && data.daily_goal !== null
          ? data.daily_goal
          : { studyTimeMinutes: Number(data.daily_goal || 60), newCardsLimit: 20 },
      targetExam: data.target_exam || 'AI-200',
      sessionBehavior: data.session_behavior || { autoPlayAudio: false, showAnswerTimer: true },
      notifications: data.notifications || { enabled: true, reminderTime: '19:00' },
      data: data.data_retention || { retention: '1year' },
      ai: data.ai || {
        provider: 'gemini',
        model: 'gemini-3.1-flash-lite',
        temperature: 0.3,
        maxTokens: 4096,
      },
    };
  },

  async update(changes: Partial<UserSettings>): Promise<void> {
    const userId = await requireUserId();
    const existing = await this.get();

    const merged = {
      theme: changes.theme ?? existing?.theme ?? 'system',
      daily_goal: changes.dailyGoal ?? existing?.dailyGoal ?? { studyTimeMinutes: 60, newCardsLimit: 20 },
      target_exam: changes.targetExam ?? existing?.targetExam ?? 'AI-200',
      session_behavior: changes.sessionBehavior ?? existing?.sessionBehavior ?? { autoPlayAudio: false, showAnswerTimer: true },
      notifications: changes.notifications ?? existing?.notifications ?? { enabled: true, reminderTime: '19:00' },
      data_retention: changes.data ?? existing?.data ?? { retention: '1year' },
      ai: changes.ai ? { ...(existing?.ai || {}), ...changes.ai } : (existing?.ai || {}),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('settings')
      .upsert({ user_id: userId, ...merged });

    if (error) throw new Error(`Falha ao salvar configurações: ${error.message}`);
  },

  async reset(): Promise<void> {
    const userId = await requireUserId();
    await supabase.from('settings').delete().eq('user_id', userId);
  },
};

// ============================================
// EXAM SERVICE (Certificações Azure AI-200 / AI-103)
// ============================================

const DEFAULT_EXAMS: Exam[] = [
  {
    code: 'AI-200',
    title: 'Microsoft Certified: Azure AI Engineer Associate (AI-200)',
    description: 'Projetar e implementar soluções de IA com serviços de Azure AI Foundry, Visão, Linguagem, Fala e IA Generativa.',
    passingScore: 700,
    skills: [
      {
        id: 'ai200-plan',
        title: 'Planejar e gerenciar soluções de Azure AI',
        description: 'Provisionar e proteger recursos de Azure AI Foundry, gerenciar identidades gerenciadas e custos.',
        weight: 20,
        subSkills: ['Azure AI Foundry', 'Segurança e RBAC', 'Monitoramento e Diagnóstico'],
      },
      {
        id: 'ai200-vision',
        title: 'Implementar soluções de visão computacional',
        description: 'Usar Azure AI Vision e Custom Vision para análise de imagem e detecção de objetos.',
        weight: 25,
        subSkills: ['OCR e Read API', 'Detecção de Faces', 'Modelos Customizados de Imagem'],
      },
      {
        id: 'ai200-language',
        title: 'Implementar processamento de linguagem natural',
        description: 'Azure AI Language, CLU (Conversational Language Understanding) e tradução.',
        weight: 30,
        subSkills: ['Análise de Sentimento', 'Extração de Entidades', 'CLU e Orquestração'],
      },
      {
        id: 'ai200-genai',
        title: 'Implementar soluções de IA generativa',
        description: 'Azure OpenAI, RAG, embeddings e salvaguardas de IA responsável.',
        weight: 25,
        subSkills: ['Azure OpenAI Service', 'RAG e Azure AI Search', 'Filtros de Conteúdo e Segurança'],
      },
    ],
    lastChecked: new Date().toISOString(),
  },
  {
    code: 'AI-103',
    title: 'Designing and Implementing an Azure AI Solution (AI-103)',
    description: 'Exame de legado para serviços cognitivos e de pesquisa do Azure.',
    passingScore: 700,
    skills: [
      {
        id: 'ai103-services',
        title: 'Desenvolver soluções de IA cognitivas',
        description: 'Integrar APIs de visão, fala e compreensão de linguagem.',
        weight: 50,
        subSkills: ['Computer Vision', 'Speech SDK', 'LUIS'],
      },
      {
        id: 'ai103-knowledge',
        title: 'Implementar soluções de Knowledge Mining',
        description: 'Indexação e enrichments cognitivos com Azure Cognitive Search.',
        weight: 50,
        subSkills: ['Cognitive Search', 'Skillsets customizados', 'Armazenamento de conhecimento'],
      },
    ],
    lastChecked: new Date().toISOString(),
  },
];

export const examService = {
  async get(code: 'AI-200' | 'AI-103'): Promise<Exam | undefined> {
    return DEFAULT_EXAMS.find((e) => e.code === code);
  },
  async getAll(): Promise<Exam[]> {
    return DEFAULT_EXAMS;
  },
  async updateLastChecked(code: 'AI-200' | 'AI-103'): Promise<void> {
    const exam = DEFAULT_EXAMS.find((e) => e.code === code);
    if (exam) exam.lastChecked = new Date().toISOString();
  },
};

export async function exportAllData(): Promise<string> {
  const [contents, flashcards, sessions, settings] = await Promise.all([
    contentService.getAll(),
    flashcardService.getAll(),
    sessionService.getRecent(1000),
    settingsService.get(),
  ]);

  return JSON.stringify({ contents, flashcards, sessions, settings, exportedAt: new Date().toISOString() }, null, 2);
}

export async function importAllData(json: string): Promise<void> {
  const data = JSON.parse(json);
  if (Array.isArray(data.contents)) {
    for (const c of data.contents) {
      await contentService.create(c);
    }
  }
}

// Compatibilidade
export const db = {
  studySessions: {
    async update(id: string, changes: Partial<StudySession>) {
      await sessionService.update(id, changes);
    },
  },
  flashcards: {},
  contents: {},
  settings: {},
  exams: {},
};
