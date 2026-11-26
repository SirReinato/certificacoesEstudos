import { useState } from 'react';
import { flashcardService, sessionService } from '../storage';
import { calculateSM2, type CardRating } from '../utils/sm2';
import type { Flashcard } from '../types';

type StartResult =
  | { status: 'started' }
  | { status: 'scheduled'; nextReview: string }
  | { status: 'empty' };

export function useStudySession() {
  const [session, setSession] = useState<{
    id: string | null;
    practice: boolean;
    cards: Flashcard[];
    currentIndex: number;
    correctCount: number;
    againCount: number;
    startTime: number | null;
  }>({
    id: null,
    practice: false,
    cards: [],
    currentIndex: 0,
    correctCount: 0,
    againCount: 0,
    startTime: null,
  });

  const [isAnswerVisible, setIsAnswerVisible] = useState(false);

  const startSession = async (limit = 40, contentId?: string, practice = false): Promise<StartResult> => {
    const now = new Date().toISOString();
    const [dueCards, newCards] = await Promise.all([
      flashcardService.getDue(limit, contentId, now),
      flashcardService.getNewCards(contentId, limit),
    ]);
    const byId = new Map<string, Flashcard>();
    for (const card of [...dueCards, ...newCards]) {
      if (!byId.has(card.id)) byId.set(card.id, card);
    }
    let cards = Array.from(byId.values()).slice(0, limit);
    let isPractice = false;

    if (cards.length === 0 && contentId) {
      const upcoming = await flashcardService.getUpcoming(contentId, now, practice ? limit : 1);
      if (upcoming.length > 0) {
        if (!practice) return { status: 'scheduled', nextReview: upcoming[0].nextReview };
        cards = upcoming;
        isPractice = true;
      }
    }
    if (cards.length === 0) return { status: 'empty' };

    const sessionId = isPractice ? null : await sessionService.create({
      date: now.split('T')[0],
      cardsReviewed: 0,
      cardsCorrect: 0,
      cardsAgain: 0,
      timeSpent: 0,
      startedAt: now,
    });

    setSession({
      id: sessionId,
      practice: isPractice,
      cards,
      currentIndex: 0,
      correctCount: 0,
      againCount: 0,
      startTime: Date.now(),
    });
    setIsAnswerVisible(false);

    return { status: 'started' };
  };

  const handleAnswer = async (rating: CardRating) => {
    const currentCard = session.cards[session.currentIndex];
    if (!currentCard) return;

    if (!session.practice) {
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
    }

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
