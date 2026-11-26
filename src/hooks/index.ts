/**
 * Custom Hooks — Fase 2
 * Integração dos serviços com React
 */

import { useState, useCallback, useEffect } from 'react';
import {
  processPDFContent,
  processLinkContent,
  processTextContent,
  processMarkdownContent,
  validateContentInput,
} from '../services/contentIngestion';
import {
  defaultAIConfig,
  managedAI,
  generateFlashcardsFromContent,
  type AIConfig,
} from '../services/aiService';
import {
  contentService,
  flashcardService,
  examService,
  settingsService,
  initDB,
} from '../storage';
import type { Content, Flashcard, UserSettings } from '../types';
import { useThemeControl } from '../theme';

// ============================================
// HELPERS DE IA
// ============================================

function defaultModelFor(provider: AIConfig['provider']): string {
  switch (provider) {
    case 'nvidia':
      return 'nvidia/nemotron-3.5-lightning-30b-a3b';
    case 'openai':
      return 'gpt-4o-mini';
    case 'azure-openai':
      return 'gpt-4o-mini';
    case 'anthropic':
      return 'claude-3-5-sonnet-latest';
    case 'local':
      return 'llama3.1';
    case 'gemini':
    default:
      return 'gemini-3.1-flash-lite';
  }
}

function envKeyFor(provider: AIConfig['provider']): string | undefined {
  switch (provider) {
    case 'nvidia':
      return import.meta.env.VITE_NVIDIA_API_KEY;
    case 'openai':
      return import.meta.env.VITE_OPENAI_API_KEY;
    case 'anthropic':
      return import.meta.env.VITE_ANTHROPIC_API_KEY;
    case 'azure-openai':
      return import.meta.env.VITE_AZURE_OPENAI_API_KEY;
    case 'local':
      return undefined;
    case 'gemini':
    default:
      return import.meta.env.VITE_GEMINI_API_KEY;
  }
}

async function resolveAIConfig(): Promise<{ config: AIConfig; hasCredentials: boolean }> {
  const settings = await settingsService.get();
  const prefs: UserSettings['ai'] | undefined = settings?.ai;

  const provider: AIConfig['provider'] = prefs?.provider ?? 'gemini';
  const savedKeys = prefs?.providerKeys ?? {};
  const primaryKey = prefs?.apiKey?.trim() || savedKeys[provider]?.trim() || envKeyFor(provider)?.trim() || undefined;

  const providerKeys: AIConfig['providerKeys'] = {
    gemini: (provider === 'gemini' ? primaryKey : savedKeys.gemini?.trim()) || envKeyFor('gemini')?.trim() || undefined,
    nvidia: (provider === 'nvidia' ? primaryKey : savedKeys.nvidia?.trim()) || envKeyFor('nvidia')?.trim() || undefined,
    openai: (provider === 'openai' ? primaryKey : savedKeys.openai?.trim()) || envKeyFor('openai')?.trim() || undefined,
    anthropic: (provider === 'anthropic' ? primaryKey : savedKeys.anthropic?.trim()) || envKeyFor('anthropic')?.trim() || undefined,
    'azure-openai': (provider === 'azure-openai' ? primaryKey : savedKeys['azure-openai']?.trim()) || envKeyFor('azure-openai')?.trim() || undefined,
  };

  const config: AIConfig = {
    ...defaultAIConfig,
    provider,
    model: prefs?.model?.trim() || defaultModelFor(provider),
    endpoint: prefs?.endpoint?.trim() || undefined,
    apiKey: primaryKey,
    providerKeys,
  };

  const hasAnyKey = Boolean(
    primaryKey ||
    providerKeys.gemini ||
    providerKeys.nvidia ||
    providerKeys.openai ||
    providerKeys.anthropic ||
    providerKeys['azure-openai']
  );

  return { config, hasCredentials: managedAI || hasAnyKey || provider === 'local' };
}

function detectExamCode(content: Content): 'AI-200' | 'AI-103' {
  const meta = `${content.title} ${content.tags.join(' ')}`.toLowerCase();
  if (/ai[\s-]?103/.test(meta)) return 'AI-103';
  if (/ai[\s-]?200/.test(meta)) return 'AI-200';

  const body = content.extractedText?.slice(0, 3000).toLowerCase() ?? '';
  return /ai[\s-]?103/.test(body) ? 'AI-103' : 'AI-200';
}

// ============================================
// HOOK PARA PROCESSAMENTO de CONTEÚDO
// ============================================
export function useContentProcessor() {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState<{ stage: string; percent: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateProgress = useCallback((stage: string, percent: number) => {
    setProgress({ stage, percent: Math.min(100, Math.max(0, percent)) });
  }, []);

  const processAndSaveFlashcards = useCallback(
    async (
      contentId: string,
      content: Content,
      onAIProgress?: (percent: number, stage?: string) => void
    ): Promise<{ content: Content }> => {
      const { config, hasCredentials } = await resolveAIConfig();

      if (!hasCredentials) {
        throw new Error(
          'Provedor de IA não configurado. Adicione uma chave em Configurações > IA e Flashcards.'
        );
      }

      const examCode = detectExamCode(content);
      const exam = await examService.get(examCode);
      const aiResult = await generateFlashcardsFromContent(
        content,
        examCode,
        exam?.skills ?? [],
        config,
        onAIProgress
      );

      if (aiResult.studyGuide.length === 0) {
        throw new Error('A IA não gerou conteúdo de estudo para este material. Tente novamente.');
      }

      const flashcardsToCreate = aiResult.flashcards
        .filter((fc) => fc.front.trim() && fc.back.trim())
        .map((fc) => ({
          contentId,
          front: fc.front,
          back: fc.back,
          format: fc.format || 'flip',
          options: fc.options,
          explanation: fc.explanation,
          tags: fc.tags,
          kind: 'question' as const,
          easeFactor: 2.5,
          interval: 0,
          repetitions: 0,
          nextReview: new Date().toISOString(),
          lapses: 0,
        }));

      if (flashcardsToCreate.length === 0) {
        throw new Error('Nenhum flashcard válido foi gerado para este conteúdo.');
      }
      await flashcardService.createMany(flashcardsToCreate);
      await contentService.update(contentId, {
        flashcardsCount: flashcardsToCreate.length,
        studyGuide: aiResult.studyGuide,
      });
      return {
        content: {
          ...content,
          flashcardsCount: flashcardsToCreate.length,
          studyGuide: aiResult.studyGuide,
        },
      };
    },
    []
  );

  const processPDF = useCallback(
    async (
      file: File,
      title: string,
      tags: string[]
    ): Promise<{ content: Content }> => {
      setProcessing(true);
      setError(null);
      updateProgress('Preparando PDF...', 5);

      let contentId: string | null = null;
      try {
        const { content } = await processPDFContent(file, title, tags, (percent, stage) =>
          updateProgress(stage ?? 'Extraindo texto do PDF...', 5 + percent * 0.35)
        );

        updateProgress('Salvando conteúdo...', 45);
        contentId = await contentService.create(content);
        await contentService.uploadSourceFile(contentId, file);
        await contentService.update(contentId, {
          source: { ...content.source, pdfStored: true },
        });

        const savedContent = await contentService.getById(contentId);
        if (!savedContent) throw new Error('Falha ao salvar conteúdo');

        return await processAndSaveFlashcards(contentId, savedContent, (percent, stage) =>
          updateProgress(stage ?? 'Gerando flashcards com IA...', 50 + percent * 0.5)
        );
      } catch (err) {
        if (contentId) {
          await contentService.delete(contentId).catch(() => undefined);
        }
        const msg = err instanceof Error ? err.message : 'Erro desconhecido';
        setError(msg);
        throw err;
      } finally {
        setProcessing(false);
        setProgress(null);
      }
    },
    [updateProgress, processAndSaveFlashcards]
  );

  const processLink = useCallback(
    async (
      url: string,
      title: string,
      tags: string[]
    ): Promise<{ content: Content }> => {
      setProcessing(true);
      setError(null);
      updateProgress('Buscando conteúdo do link...', 10);

      let contentId: string | null = null;
      try {
        const { content } = await processLinkContent(url, title, tags, (percent, stage) =>
          updateProgress(stage ?? 'Extraindo conteúdo...', 10 + percent * 0.3)
        );

        updateProgress('Salvando conteúdo...', 45);
        contentId = await contentService.create(content);

        const savedContent = await contentService.getById(contentId);
        if (!savedContent) throw new Error('Falha ao salvar conteúdo');

        return await processAndSaveFlashcards(contentId, savedContent, (percent, stage) =>
          updateProgress(stage ?? 'Gerando flashcards com IA...', 50 + percent * 0.5)
        );
      } catch (err) {
        if (contentId) {
          await contentService.delete(contentId).catch(() => undefined);
        }
        const msg = err instanceof Error ? err.message : 'Erro desconhecido';
        setError(msg);
        throw err;
      } finally {
        setProcessing(false);
        setProgress(null);
      }
    },
    [updateProgress, processAndSaveFlashcards]
  );

  const processText = useCallback(
    async (
      text: string,
      title: string,
      tags: string[]
    ): Promise<{ content: Content }> => {
      setProcessing(true);
      setError(null);
      updateProgress('Processando texto...', 20);

      let contentId: string | null = null;
      try {
        const { content } = await processTextContent(text, title, tags);

        updateProgress('Salvando conteúdo...', 45);
        contentId = await contentService.create(content);

        const savedContent = await contentService.getById(contentId);
        if (!savedContent) throw new Error('Falha ao salvar conteúdo');

        return await processAndSaveFlashcards(contentId, savedContent, (percent, stage) =>
          updateProgress(stage ?? 'Gerando flashcards com IA...', 50 + percent * 0.5)
        );
      } catch (err) {
        if (contentId) {
          await contentService.delete(contentId).catch(() => undefined);
        }
        const msg = err instanceof Error ? err.message : 'Erro desconhecido';
        setError(msg);
        throw err;
      } finally {
        setProcessing(false);
        setProgress(null);
      }
    },
    [updateProgress, processAndSaveFlashcards]
  );

  const processMarkdown = useCallback(
    async (
      fileOrText: File | string,
      title: string,
      tags: string[]
    ): Promise<{ content: Content }> => {
      setProcessing(true);
      setError(null);
      updateProgress('Processando notas Markdown do NotebookLM...', 20);

      let contentId: string | null = null;
      try {
        const { content } = await processMarkdownContent(fileOrText, title, tags);

        updateProgress('Salvando conteúdo...', 45);
        contentId = await contentService.create(content);

        if (typeof fileOrText !== 'string' && fileOrText instanceof File) {
          await contentService.uploadSourceFile(contentId, fileOrText);
        }

        const savedContent = await contentService.getById(contentId);
        if (!savedContent) throw new Error('Falha ao salvar conteúdo');

        return await processAndSaveFlashcards(contentId, savedContent, (percent, stage) =>
          updateProgress(stage ?? 'Gerando flashcards e metodologia 30/70 com IA...', 50 + percent * 0.5)
        );
      } catch (err) {
        if (contentId) {
          await contentService.delete(contentId).catch(() => undefined);
        }
        const msg = err instanceof Error ? err.message : 'Erro desconhecido';
        setError(msg);
        throw err;
      } finally {
        setProcessing(false);
        setProgress(null);
      }
    },
    [updateProgress, processAndSaveFlashcards]
  );

  return {
    processing,
    progress,
    error,
    processMarkdown,
    processPDF,
    processLink,
    processText,
    validate: validateContentInput,
  };
}

// ============================================
// HOOK PARA BIBLIOTECA
// ============================================
export function useLibrary() {
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{ total: number; byType: Record<string, number>; totalFlashcards: number } | null>(null);

  const loadContents = useCallback(async () => {
    setLoading(true);
    try {
      const [data, statData] = await Promise.all([
        contentService.getAll(),
        contentService.getStats(),
      ]);
      setContents(data);
      setStats(statData);
    } catch (err) {
      console.error('Erro ao carregar biblioteca:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContents();
  }, [loadContents]);

  const deleteContent = useCallback(async (id: string) => {
    await contentService.delete(id);
    await loadContents();
  }, [loadContents]);

  const refresh = useCallback(() => {
    loadContents();
  }, [loadContents]);

  return {
    contents,
    loading,
    stats,
    deleteContent,
    refresh,
  };
}

// ============================================
// HOOK PARA SESSÃO DE ESTUDO (SRS)
// ============================================
export function useStudySession(contentId?: string) {
  const [dueCards, setDueCards] = useState<Flashcard[]>([]);
  const [newCards, setNewCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionStats, setSessionStats] = useState({
    reviewed: 0,
    correct: 0,
    again: 0,
    timeSpent: 0,
  });

  const loadCards = useCallback(async () => {
    setLoading(true);
    try {
      const [due, newC] = await Promise.all([
        flashcardService.getDue(contentId ? 20 : 50, contentId),
        flashcardService.getNewCards(contentId, contentId ? 10 : 20),
      ]);
      setDueCards(due);
      setNewCards(newC);
    } catch (err) {
      console.error('Erro ao carregar cards:', err);
    } finally {
      setLoading(false);
    }
  }, [contentId]);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  const rateCard = useCallback(
    async (card: Flashcard, rating: 'again' | 'hard' | 'good' | 'easy') => {
      const now = new Date();
      let newInterval: number;
      let newEaseFactor = card.easeFactor;

      switch (rating) {
        case 'again':
          newInterval = 0;
          newEaseFactor = Math.max(1.3, card.easeFactor - 0.2);
          break;
        case 'hard':
          newInterval = card.repetitions === 0 ? 1 : Math.round(card.interval * 1.2);
          newEaseFactor = Math.max(1.3, card.easeFactor - 0.15);
          break;
        case 'good':
          if (card.repetitions === 0) newInterval = 1;
          else if (card.repetitions === 1) newInterval = 6;
          else newInterval = Math.round(card.interval * card.easeFactor);
          break;
        case 'easy':
          if (card.repetitions === 0) newInterval = 4;
          else if (card.repetitions === 1) newInterval = 7;
          else newInterval = Math.round(card.interval * card.easeFactor * 1.3);
          newEaseFactor = card.easeFactor + 0.1;
          break;
      }

      const nextReview = new Date(now);
      nextReview.setDate(now.getDate() + newInterval);

      await flashcardService.update(card.id, {
        interval: newInterval,
        easeFactor: newEaseFactor,
        repetitions: card.repetitions + 1,
        nextReview: nextReview.toISOString(),
        lastReviewed: now.toISOString(),
        lapses: card.lapses + (rating === 'again' ? 1 : 0),
      });

      setSessionStats((prev) => ({
        reviewed: prev.reviewed + 1,
        correct: prev.correct + (rating !== 'again' ? 1 : 0),
        again: prev.again + (rating === 'again' ? 1 : 0),
        timeSpent: prev.timeSpent,
      }));

      loadCards();
    },
    [contentId, loadCards]
  );

  return {
    dueCards,
    newCards,
    loading,
    sessionStats,
    setSessionStats,
    rateCard,
    refresh: loadCards,
  };
}

// ============================================
// HOOK PARA CONFIGURAÇÕES
// ============================================
export function useSettings() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { setTheme } = useThemeControl();

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await settingsService.get();
      if (data) setSettings(data);
    } catch (err) {
      console.error('Erro ao carregar configurações:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const updateSettings = useCallback(async (changes: Partial<UserSettings>) => {
    await settingsService.update(changes);
    setSettings((prev) => (prev ? { ...prev, ...changes } : null));
  }, []);

  const updateTheme = useCallback(
    (theme: 'light' | 'dark' | 'system') => {
      if (theme === 'system') {
        try {
          localStorage.removeItem('app-theme-preference');
        } catch {
          // localStorage indisponível (modo privado) — ignora
        }
        window.dispatchEvent(new Event('storage'));
      } else {
        setTheme(theme);
      }
      updateSettings({ theme });
    },
    [setTheme, updateSettings]
  );

  return {
    settings,
    loading,
    updateSettings,
    updateTheme,
  };
}

// ============================================
// INICIALIZAÇÃO DO DB
// ============================================
export function useDBInit() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initDB()
      .then(() => setReady(true))
      .catch((err) => setError(err.message));
  }, []);

  return { ready, error };
}
