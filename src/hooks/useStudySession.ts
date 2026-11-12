import { useState } from 'react';
import { flashcardService, sessionService } from '../storage';
import { calculateSM2, type CardRating } from '../utils/sm2';
import type { Flashcard } from '../types';

export function useStudySession() {
  const [session, setSession] = useState<{
    id: string | null;
    cards: Flashcard[];
    currentIndex: number;
    correctCount: number;
    againCount: number;
    startTime: number | null;
  }>({
    id: null,
    cards: [],
    currentIndex: 0,
    correctCount: 0,
    againCount: 0,
    startTime: null,
  });

  const [isAnswerVisible, setIsAnswerVisible] = useState(false);

  const startSession = async (limit = 40, contentId?: string) => {
    let allCards: Flashcard[];

    if (contentId) {
      // Sessão focada em um conteúdo específico da biblioteca:
      // prioriza cards vencidos e novos; se nada estiver vencido,
      // permite antecipar a revisão de todos os cards do conteúdo.
      const contentCards = await flashcardService.getByContentId(contentId);
      const nowMs = Date.now();
      const dueOrNew = contentCards.filter((card) => {
        const isNew = card.repetitions === 0;
        const isDue = !card.nextReview || new Date(card.nextReview).getTime() <= nowMs;
        return isNew || isDue;
      });
      allCards = (dueOrNew.length > 0 ? dueOrNew : contentCards).slice(0, limit);
    } else {
      const dueCards = await flashcardService.getDue(limit);
      const newCards = await flashcardService.getNewCards(undefined, limit);

      // Evita duplicar cards recém-criados que também aparecem como "due"
      const byId = new Map<string, Flashcard>();
      for (const card of [...dueCards, ...newCards]) {
        byId.set(card.id, card);
      }
      allCards = Array.from(byId.values());
    }

    if (allCards.length === 0) return null;

    const questionCards = allCards.filter((card) => card.kind !== 'theory');
    if (questionCards.length === 0) return null;

    const sessionId = await sessionService.create({
      date: new Date().toISOString().split('T')[0],
      cardsReviewed: 0,
      cardsCorrect: 0,
      cardsAgain: 0,
      timeSpent: 0,
      startedAt: new Date().toISOString(),
    });

    setSession({
      id: sessionId,
      cards: questionCards,
      currentIndex: 0,
      correctCount: 0,
      againCount: 0,
      startTime: Date.now(),
    });

    return sessionId;
  };

  const handleAnswer = async (rating: CardRating) => {
    const currentCard = session.cards[session.currentIndex];
    if (!currentCard) return;

    // 1. Calculate SM-2 update
    const sm2Update = calculateSM2(
      rating,
      currentCard.interval,
      currentCard.easeFactor,
      currentCard.repetitions
    );

    // 2. Update card in DB
    await flashcardService.update(currentCard.id, {
      ...sm2Update,
      lastReviewed: new Date().toISOString(),
      lapses: rating === 'again' ? currentCard.lapses + 1 : currentCard.lapses,
    });

    // 3. Update session stats
    const isCorrect = rating !== 'again';
    const newCorrectCount = isCorrect ? session.correctCount + 1 : session.correctCount;
    const newAgainCount = !isCorrect ? session.againCount + 1 : session.againCount;

    // 4. Update session in DB
    if (session.id) {
      const timeSpent = Math.floor((Date.now() - (session.startTime || Date.now())) / 1000);
      await sessionService.update(session.id, {
        cardsReviewed: session.currentIndex + 1,
        cardsCorrect: newCorrectCount,
        cardsAgain: newAgainCount,
        timeSpent: timeSpent,
      });
    }

    // 5. Move to next card
    setSession(prev => ({
      ...prev,
      currentIndex: prev.currentIndex + 1,
      correctCount: newCorrectCount,
      againCount: newAgainCount,
    }));
    setIsAnswerVisible(false);
  };

  const endSession = async () => {
    if (!session.id) return;
    const timeSpent = Math.floor((Date.now() - (session.startTime || Date.now())) / 1000);
    await sessionService.update(session.id, {
      completedAt: new Date().toISOString(),
      timeSpent,
    });
  };

  return {
    session,
    isAnswerVisible,
    setIsAnswerVisible,
    startSession,
    handleAnswer,
    endSession,
    currentCard: session.cards[session.currentIndex],
    progress: session.cards.length > 0 
      ? (session.currentIndex / session.cards.length) * 100 
      : 0,
    isFinished: session.cards.length > 0 && session.currentIndex >= session.cards.length,
  };
}
