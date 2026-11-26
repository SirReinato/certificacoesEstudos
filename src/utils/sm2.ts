/**
 * SM-2 Algorithm Implementation
 * Based on the SuperMemo-2 spaced repetition system.
 */

export type CardRating = 'again' | 'hard' | 'good' | 'easy';

export interface SM2Result {
  interval: number;
  easeFactor: number;
  repetitions: number;
  nextReview: string;
}

/**
 * Calculates the next review date and ease factor based on the user's rating.
 * 
 * @param rating - User's self-assessment of the card ('again', 'hard', 'good', 'easy')
 * @param currentInterval - Current interval in days
 * @param currentEaseFactor - Current ease factor (default 2.5)
 * @param currentRepetitions - Number of successful consecutive reviews
 * @returns SM2Result containing updated values
 */
export function calculateSM2(
  rating: CardRating,
  currentInterval: number,
  currentEaseFactor: number,
  currentRepetitions: number
): SM2Result {
  let interval: number;
  let easeFactor = currentEaseFactor;
  let repetitions = currentRepetitions;

  // Map our ratings to SM-2 quality scores (0-5)
  // again: 0 (forgot)
  // hard: 3 (correct but difficult)
  // good: 4 (correct)
  // easy: 5 (perfect)
  const qualityMap: Record<CardRating, number> = {
    again: 0,
    hard: 3,
    good: 4,
    easy: 5,
  };

  const q = qualityMap[rating];

  if (q < 3) {
    // Incorrect response or very hard
    repetitions = 0;
    interval = 1;
  } else {
    // Correct response
    repetitions++;
    
    if (repetitions === 1) {
      interval = 1;
    } else if (repetitions === 2) {
      interval = 6;
    } else {
      interval = Math.round(currentInterval * currentEaseFactor);
    }

    // Update Ease Factor: EF' = EF + (0.1 - (5-q)*(0.08 + (5-q)*0.02))
    easeFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    if (easeFactor < 1.3) easeFactor = 1.3; // Minimum EF
  }

  // Calculate next review date
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);
  
  return {
    interval,
    easeFactor,
    repetitions,
    nextReview: nextReviewDate.toISOString(),
  };
}

/** Exibe o intervalo usado pelo agendamento. */
export function formatReviewInterval(interval: number): string {
  return interval === 1 ? '1 dia' : `${interval} dias`;
}
