/**
 * Tipos centrais da aplicação — Fase 2
 */

// ============================================
// CONTEÚDO
// ============================================
export type ContentType = 'pdf' | 'link' | 'text';

export interface ContentSource {
  type: ContentType;
  url?: string;           // para links
  fileName?: string;      // para PDFs
  fileSize?: number;      // para PDFs
  pdfStored?: boolean;    // PDF original armazenado no servidor
  originalText?: string;  // para texto manual
}

export interface StudyGuideSection {
  title: string;
  content: string;
}

export interface Content {
  id: string;
  title: string;
  type: ContentType;
  source: ContentSource;
  tags: string[];
  flashcardsCount: number;
  reviewedCount: number;
  mastery: number;        // 0-100
  lastStudied?: string;   // ISO date
  createdAt: string;      // ISO date
  updatedAt: string;      // ISO date
  // Metadados extraídos
  extractedText?: string; // texto completo extraído
  chunks?: TextChunk[];   // chunks para IA
  studyGuide?: StudyGuideSection[];
}

export interface TextChunk {
  id: string;
  contentId: string;
  text: string;
  order: number;
  tokens?: number;
}

// ============================================
// FLASHCARDS (SM-2)
// ============================================
export type CardRating = 'again' | 'hard' | 'good' | 'easy';

export interface Flashcard {
  id: string;
  contentId: string;
  chunkId?: string;
  front: string;
  back: string;
  tags: string[];
  // Cartões novos são questões; theory permanece por compatibilidade com dados antigos.
  kind?: 'theory' | 'question';
  // SM-2 fields
  easeFactor: number;     // default 2.5
  interval: number;       // dias
  repetitions: number;    // quantas vezes revisado
  nextReview: string;     // ISO date
  lastReviewed?: string;  // ISO date
  // Stats
  lapses: number;         // quantas vezes errou
  createdAt: string;
  updatedAt: string;
}

// ============================================
// SESSÃO DE ESTUDO
// ============================================
export interface StudySession {
  id: string;
  date: string;           // ISO date (day only)
  cardsReviewed: number;
  cardsCorrect: number;
  cardsAgain: number;
  timeSpent: number;      // segundos
  startedAt: string;
  completedAt?: string;
}

export interface DailyGoal {
  studyTimeMinutes: number;    // meta de tempo (45-90)
  newCardsLimit: number;       // limite de cards novos/dia
}

// ============================================
// CONFIGURAÇÕES DO USUÁRIO
// ============================================
export interface UserSettings {
  id: string;
  theme: 'light' | 'dark' | 'system';
  dailyGoal: DailyGoal;
  sessionBehavior: {
    autoPlayAudio: boolean;
    showAnswerTimer: boolean;
  };
  notifications: {
    enabled: boolean;
    reminderTime: string; // HH:MM
  };
  ai: {
    focusOnExam: boolean;
    checkUpdates: boolean;
    contentQuestionRatio: { content: number; questions: number }; // 30/70
    // Configuração do provedor (chave fica apenas no IndexedDB local)
    provider?: 'gemini' | 'openai' | 'anthropic' | 'azure-openai' | 'local' | 'omniroute';
    model?: string;
    endpoint?: string;
    apiKey?: string;
  };
  data: {
    retention: '6months' | '1year' | '2years' | 'forever';
  };
}

// ============================================
// IA / PROMPTS
// ============================================
export interface AIPromptContext {
  exam: 'AI-200' | 'AI-103';
  skills: string[];       // lista de skills do Microsoft Learn
  content: string;        // texto do conteúdo
  chunkIndex: number;
  totalChunks: number;
}

export interface AIGeneratedFlashcards {
  studyGuide: StudyGuideSection[];
  flashcards: {
    front: string;
    back: string;
    tags: string[];
    difficulty: 'easy' | 'medium' | 'hard';
    importance: number; // 1-10
    kind: 'question';
  }[];
}

// ============================================
// EXAMES MICROSOFT
// ============================================
export interface ExamSkill {
  id: string;
  title: string;
  description: string;
  weight: number; // porcentagem no exame
  subSkills: string[];
}

export interface Exam {
  id: string;
  name: string;
  code: string; // AI-200, AI-103
  skills: ExamSkill[];
  lastUpdated: string;
  sourceUrl: string;
}