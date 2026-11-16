/**
 * Tipos centrais da aplicação — SafeZone Studies (Supabase + NotebookLM + NVIDIA NIM + 30/70)
 */

// ============================================
// AUTENTICAÇÃO E PERFIL
// ============================================
export interface Profile {
  id: string;
  email: string;
  fullName?: string;
  createdAt: string;
}

// ============================================
// CONTEÚDO
// ============================================
export type ContentType = 'pdf' | 'link' | 'text' | 'markdown';

export interface ContentSource {
  type: ContentType;
  url?: string;           // para links
  fileName?: string;      // para PDFs ou Markdown
  fileSize?: number;      // em bytes
  pdfStored?: boolean;    // PDF original armazenado
  originalText?: string;  // para texto manual ou Markdown
}

export interface StudyGuideSection {
  id?: string;
  title: string;
  content: string;
  executiveSummary?: string;
  gotchas?: string[];
  comparisonTable?: {
    title?: string;
    headers: string[];
    rows: string[][];
  };
}

export interface Content {
  id: string;
  userId?: string;
  title: string;
  type: ContentType;
  source: ContentSource;
  tags: string[];
  flashcardsCount: number;
  reviewedCount: number;
  mastery: number;        // 0-100
  lastStudied?: string;   // ISO date
  storagePath?: string;   // Caminho do asset no Supabase Storage
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
  breadcrumb?: string;    // Ex: "AI-200 > Visão Computacional > Custom Vision"
}

// ============================================
// FLASHCARDS E QUESTÕES (SM-2)
// ============================================
export type CardRating = 'again' | 'hard' | 'good' | 'easy';
export type SM2Grade = CardRating;
export type FlashcardFormat = 'flip' | 'multiple-choice';

export interface MultipleChoiceOption {
  id: 'A' | 'B' | 'C' | 'D' | string;
  text: string;
  rationale?: string;
  explanation?: string;
  isCorrect: boolean;
}

export interface Flashcard {
  id: string;
  contentId: string;
  userId?: string;
  chunkId?: string;
  front: string;
  back: string;
  format?: FlashcardFormat;
  tags: string[];
  kind?: 'question';
  difficulty?: 'easy' | 'medium' | 'hard';
  importance?: number;
  // Múltipla escolha
  options?: MultipleChoiceOption[];
  explanation?: string;   // Justificativa detalhada dos distratores
  // SM-2 fields (escala 1 a 4)
  easeFactor: number;     // default 2.5
  interval: number;       // dias
  repetitions: number;    // quantas vezes revisado
  nextReview: string;     // ISO date
  lastReviewed?: string;  // ISO date
  lapses: number;         // quantas vezes errou
  createdAt: string;
  updatedAt: string;
}

// ============================================
// SESSÃO DE ESTUDO
// ============================================
export interface StudySession {
  id: string;
  userId?: string;
  contentId?: string;
  contentIds?: string[];
  date: string;           // ISO date (day only)
  cardsReviewed: number;
  cardsCorrect: number;
  cardsAgain: number;
  cardsHard?: number;
  cardsGood?: number;
  cardsEasy?: number;
  timeSpent: number;      // segundos (compatibilidade)
  timeSpentSeconds?: number;
  durationMinutes?: number;
  accuracy?: number;
  startedAt: string;
  startTime?: string;
  completedAt?: string;
  endTime?: string;
}

export interface DailyGoal {
  studyTimeMinutes: number;    // meta de tempo (45-90)
  newCardsLimit: number;       // limite de cards novos/dia
}

// ============================================
// CONFIGURAÇÕES DO USUÁRIO
// ============================================
export type AIProvider = 'gemini' | 'openai' | 'anthropic' | 'azure-openai' | 'local' | 'nvidia';

export interface AIConfig {
  provider: AIProvider;
  apiKey?: string;
  model: string;
  endpoint?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface UserSettings {
  id?: string;
  targetExam?: string;
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
    focusOnExam?: boolean;
    checkUpdates?: boolean;
    contentQuestionRatio?: { content: number; questions: number }; // 30/70
    provider?: AIProvider;
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
    format?: FlashcardFormat;
    options?: MultipleChoiceOption[];
    explanation?: string;
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
  id?: string;
  name?: string;
  title?: string;
  code: string; // AI-200, AI-103
  skills: ExamSkill[];
  lastUpdated?: string;
  lastChecked?: string;
  sourceUrl?: string;
  description?: string;
  passingScore?: number;
}
