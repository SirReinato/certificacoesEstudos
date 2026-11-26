/**
 * MultipleChoiceCard — Cartão interativo para questões de múltipla escolha
 * Padrão Styled-Components com sufixo Stl e tokens de tema
 * Integrado ao algoritmo SM-2 (1=again, 2=hard, 3=good, 4=easy)
 */

import { useState } from 'react';
import styled from 'styled-components';
import type { Flashcard, SM2Grade } from '../../types';

interface MultipleChoiceCardProps {
  card: Flashcard;
  onGrade: (grade: SM2Grade) => void;
  getReviewInterval: (grade: SM2Grade) => string | undefined;
  grading: boolean;
}

const CardWrapperStl = styled.div`
  background: ${({ theme }) => theme.colors.background.primary};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.radii.xl};
  padding: ${({ theme }) => theme.spacing[8]};
  box-shadow: ${({ theme }) => theme.shadows.md};
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
  animation: fadeIn 0.3s ease-out;
`;

const QuestionHeaderStl = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const QuestionBadgeStl = styled.span`
  padding: ${({ theme }) => theme.spacing[1]} ${({ theme }) => theme.spacing[3]};
  background: ${({ theme }) => theme.colors.brand.light || 'rgba(37, 99, 235, 0.1)'};
  color: ${({ theme }) => theme.colors.brand.primary};
  border-radius: ${({ theme }) => theme.radii.full};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const QuestionTitleStl = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
  line-height: 1.5;
  margin-bottom: ${({ theme }) => theme.spacing[6]};
`;

const OptionsContainerStl = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[3]};
  margin-bottom: ${({ theme }) => theme.spacing[6]};
`;

const OptionButtonStl = styled.button<{
  $isSelected: boolean;
  $isCorrect?: boolean;
  $hasAnswered: boolean;
}>`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[4]};
  border-radius: ${({ theme }) => theme.radii.lg};
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-family: inherit;
  text-align: left;
  cursor: ${({ $hasAnswered }) => ($hasAnswered ? 'default' : 'pointer')};
  transition: all ${({ theme }) => theme.transitions.fast};

  background: ${({ theme, $isSelected, $isCorrect, $hasAnswered }) => {
    if (!$hasAnswered) {
      return theme.colors.background.secondary;
    }
    if ($isCorrect) {
      return theme.colors.success.light || 'rgba(16, 185, 129, 0.12)';
    }
    if ($isSelected && !$isCorrect) {
      return theme.colors.error.light || 'rgba(239, 68, 68, 0.12)';
    }
    return theme.colors.background.tertiary;
  }};

  border: 2px solid ${({ theme, $isSelected, $isCorrect, $hasAnswered }) => {
    if (!$hasAnswered) {
      return theme.colors.border.primary;
    }
    if ($isCorrect) {
      return theme.colors.success.main || '#10b981';
    }
    if ($isSelected && !$isCorrect) {
      return theme.colors.error.main || '#ef4444';
    }
    return theme.colors.border.secondary;
  }};

  color: ${({ theme }) => theme.colors.text.primary};

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.brand.primary};
    background: ${({ theme }) => theme.colors.background.tertiary};
  }
`;

const OptionIdBadgeStl = styled.span<{ $isSelected: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme, $isSelected }) =>
    $isSelected ? theme.colors.brand.primary : theme.colors.background.primary};
  color: ${({ theme, $isSelected }) =>
    $isSelected ? theme.colors.text.inverse : theme.colors.text.secondary};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  flex-shrink: 0;
`;

const OptionTextStl = styled.div`
  flex: 1;
  line-height: 1.5;
`;

const ExplanationBoxStl = styled.div<{ $isSuccess: boolean }>`
  padding: ${({ theme }) => theme.spacing[5]};
  border-radius: ${({ theme }) => theme.radii.lg};
  margin-bottom: ${({ theme }) => theme.spacing[6]};
  background: ${({ theme, $isSuccess }) =>
    $isSuccess
      ? theme.colors.success.light || 'rgba(16, 185, 129, 0.08)'
      : theme.colors.error.light || 'rgba(239, 68, 68, 0.08)'};
  border: 1px solid
    ${({ theme, $isSuccess }) =>
      $isSuccess
        ? theme.colors.success.main || '#10b981'
        : theme.colors.error.main || '#ef4444'};
`;

const ExplanationTitleStl = styled.h4<{ $isSuccess: boolean }>`
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme, $isSuccess }) =>
    $isSuccess ? theme.colors.success.main || '#059669' : theme.colors.error.main || '#dc2626'};
  margin: 0 0 ${({ theme }) => theme.spacing[2]};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const DistractorsListStl = styled.div`
  margin-top: ${({ theme }) => theme.spacing[3]};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const GradeButtonsRowStl = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing[3]};
  flex-wrap: wrap;
`;

const GradeButtonStl = styled.button<{ $colorType: 'again' | 'hard' | 'good' | 'easy' }>`
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[5]};
  border-radius: ${({ theme }) => theme.radii.lg};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-family: inherit;
  cursor: pointer;
  border: none;
  transition: all ${({ theme }) => theme.transitions.fast};
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};

  background: ${({ theme, $colorType }) => {
    switch ($colorType) {
      case 'again':
        return theme.colors.error.main || '#ef4444';
      case 'hard':
        return theme.colors.warning.main || '#f59e0b';
      case 'good':
        return theme.colors.brand.primary;
      case 'easy':
        return theme.colors.success.main || '#10b981';
    }
  }};

  color: #ffffff;
  box-shadow: ${({ theme }) => theme.shadows.sm};

  &:hover {
    filter: brightness(1.1);
    transform: translateY(-1px);
    box-shadow: ${({ theme }) => theme.shadows.md};
  }

  &:active {
    transform: translateY(0);
  }
`;

export function MultipleChoiceCard({ card, onGrade, getReviewInterval, grading }: MultipleChoiceCardProps) {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  const options = card.options || [];
  const hasAnswered = selectedOptionId !== null;
  const selectedOption = options.find((o) => o.id === selectedOptionId);
  const isCorrect = selectedOption?.isCorrect ?? false;

  const reviewHint = (grade: SM2Grade) => {
    const interval = getReviewInterval(grade);
    return interval ? ` · ${interval}` : '';
  };

  const handleSelect = (id: string) => {
    if (hasAnswered) return;
    setSelectedOptionId(id);
  };

  return (
    <CardWrapperStl>
      <QuestionHeaderStl>
        <QuestionBadgeStl>Questão Prática — AI Exam</QuestionBadgeStl>
        {card.tags && card.tags.length > 0 && (
          <span style={{ fontSize: '12px', opacity: 0.7 }}>🏷️ {card.tags.slice(0, 3).join(', ')}</span>
        )}
      </QuestionHeaderStl>

      <QuestionTitleStl>{card.front}</QuestionTitleStl>

      <OptionsContainerStl>
        {options.map((option) => (
          <OptionButtonStl
            key={option.id}
            type="button"
            $isSelected={selectedOptionId === option.id}
            $isCorrect={option.isCorrect}
            $hasAnswered={hasAnswered}
            disabled={hasAnswered}
            onClick={() => handleSelect(option.id)}
          >
            <OptionIdBadgeStl $isSelected={selectedOptionId === option.id}>
              {option.id}
            </OptionIdBadgeStl>
            <OptionTextStl>{option.text}</OptionTextStl>
          </OptionButtonStl>
        ))}
      </OptionsContainerStl>

      {hasAnswered && (
        <>
          <ExplanationBoxStl $isSuccess={isCorrect}>
            <ExplanationTitleStl $isSuccess={isCorrect}>
              <span>{isCorrect ? '✅ Resposta Correta!' : '❌ Resposta Incorreta'}</span>
            </ExplanationTitleStl>
            <p style={{ margin: '0 0 8px 0', lineHeight: 1.5 }}>
              {card.explanation || card.back}
            </p>

            <DistractorsListStl>
              {options.map((opt) => (
                <div key={opt.id}>
                  <strong>{opt.id}:</strong> {opt.explanation || opt.rationale || (opt.isCorrect ? 'Opção correta.' : 'Incorreta.')}
                </div>
              ))}
            </DistractorsListStl>
          </ExplanationBoxStl>

          <GradeButtonsRowStl>
            {!isCorrect ? (
              <GradeButtonStl $colorType="again" disabled={grading} onClick={() => onGrade('again')}>
                🔄 Errei{reviewHint('again')}
              </GradeButtonStl>
            ) : (
              <>
                <GradeButtonStl $colorType="hard" disabled={grading} onClick={() => onGrade('hard')}>
                  ⚡ Difícil{reviewHint('hard')}
                </GradeButtonStl>
                <GradeButtonStl $colorType="good" disabled={grading} onClick={() => onGrade('good')}>
                  👍 Bom{reviewHint('good')}
                </GradeButtonStl>
                <GradeButtonStl $colorType="easy" disabled={grading} onClick={() => onGrade('easy')}>
                  🎯 Fácil{reviewHint('easy')}
                </GradeButtonStl>
              </>
            )}
          </GradeButtonsRowStl>
        </>
      )}
    </CardWrapperStl>
  );
}
