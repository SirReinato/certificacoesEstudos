import { useRef, useState } from 'react';
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
  const [isGrading, setIsGrading] = useState(false);
  const grading = useRef(false);

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

  const handleAnswer = async (rating: CardRating): Promise<boolean> => {
    const currentCard = session.cards[session.currentIndex];
    if (!currentCard || grading.current) return false;
    grading.current = true;
    setIsGrading(true);

    try {
      let reviewedCard = currentCard;
      if (!session.practice) {
        const update = {
          ...calculateSM2(rating, currentCard.interval, currentCard.easeFactor, currentCard.repetitions),
          lastReviewed: new Date().toISOString(),
          lapses: currentCard.lapses + (rating === 'again' ? 1 : 0),
        };
        await flashcardService.update(currentCard.id, update);
        reviewedCard = { ...currentCard, ...update };
      }

      const correctCount = session.correctCount + (rating !== 'again' ? 1 : 0);
      const againCount = session.againCount + (rating === 'again' ? 1 : 0);
      if (session.id) {
        const timeSpent = Math.floor((Date.now() - (session.startTime ?? Date.now())) / 1000);
        await sessionService.update(session.id, {
          cardsReviewed: session.currentIndex + 1,
          cardsCorrect: correctCount,
          cardsAgain: againCount,
          timeSpent,
        });
      }

      // A segunda tentativa já tem uma ocorrência anterior na fila.
      const alreadyRepeated = session.cards.slice(0, session.currentIndex).some(card => card.id === currentCard.id);
      setSession({
        ...session,
        cards: rating === 'again' && !alreadyRepeated ? [...session.cards, reviewedCard] : session.cards,
        currentIndex: session.currentIndex + 1,
        correctCount,
        againCount,
      });
      setIsAnswerVisible(false);
      return true;
    } finally {
      grading.current = false;
      setIsGrading(false);
    }
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
    isGrading,
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
