/**
 * EstudoDiario — Sessão de estudo com flashcards (SM-2 real)
 * Implementação da Fase 4: Repetição Espaçada e Sessão Adaptativa
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import styled from 'styled-components';
import { Link, useSearchParams } from 'react-router-dom';
import { useTheme } from '../theme';
import { useStudySession } from '../hooks/useStudySession';
import { contentService, flashcardService } from '../storage';
import { ExamTrapCallout } from '../components/study/ExamTrapCallout';
import { DecisionMatrix } from '../components/study/DecisionMatrix';
import { MultipleChoiceCard } from '../components/study/MultipleChoiceCard';
import type { StudyGuideSection } from '../types';
import { calculateSM2, formatReviewInterval, type CardRating } from '../utils/sm2';

const PageHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[4]};
  margin-bottom: ${({ theme }) => theme.spacing[6]};
  padding-bottom: ${({ theme }) => theme.spacing[4]};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.primary};
`;

const Title = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes['3xl']};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
`;

const SessionStats = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[4]};
`;

const Stat = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
`;

const StatValue = styled.span<{ color?: string }>`
  font-size: ${({ theme }) => theme.fontSizes['2xl']};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme, color }) => color || theme.colors.text.primary};
`;

const StatLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.text.tertiary};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const ProgressContainer = styled.div`
  flex: 1;
  min-width: 200px;
  height: 8px;
  background: ${({ theme }) => theme.colors.background.tertiary};
  border-radius: ${({ theme }) => theme.radii.full};
  overflow: hidden;
  margin-bottom: ${({ theme }) => theme.spacing[8]};
`;

const ProgressFill = styled.div<{ $progress: number }>`
  height: 100%;
  width: ${({ $progress }) => $progress}%;
  background: ${({ theme }) => theme.gradients.brand.primary};
  border-radius: ${({ theme }) => theme.radii.full};
  transition: width ${({ theme }) => theme.transitions.normal};
`;

const FlashcardContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[6]};
  max-width: 960px;
  margin: 0 auto;
  width: 100%;
`;

const Flashcard = styled.div`
  width: 100%;
  max-width: 640px;
  min-height: 320px;
  perspective: 1000px;
  cursor: pointer;
`;

const FlashcardInner = styled.div<{ $flipped: boolean }>`
  width: 100%;
  height: 100%;
  min-height: 320px;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  transform: ${({ $flipped }) => ($flipped ? 'rotateY(180deg)' : 'rotateY(0deg)')};
  border-radius: ${({ theme }) => theme.radii.xl};
  box-shadow: ${({ theme }) => theme.shadows.lg};
`;

const FlashcardFace = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  min-height: 320px;
  backface-visibility: hidden;
  border-radius: ${({ theme }) => theme.radii.xl};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing[8]};
  text-align: center;
  background: ${({ theme }) => theme.colors.background.primary};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
`;

const FlashcardBack = styled(FlashcardFace)`
  transform: rotateY(180deg);
  background: ${({ theme }) => theme.gradients.surface.card};
`;

const CardTag = styled.div<{ bg?: string; color?: string }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  padding: ${({ theme }) => theme.spacing[1]} ${({ theme }) => theme.spacing[2]};
  border-radius: ${({ theme }) => theme.radii.full};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  background: ${({ theme, bg }) => bg || theme.colors.brand.light};
  color: ${({ theme, color }) => color || theme.colors.brand.primary};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
  text-transform: uppercase;
  letter-spacing: 0.02em;
`;

const CardContent = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  line-height: ${({ theme }) => theme.lineHeights.relaxed};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const CardSource = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.text.tertiary};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
`;

const FlipHint = styled.div`
  position: absolute;
  bottom: ${({ theme }) => theme.spacing[4]};
  left: 50%;
  transform: translateX(-50%);
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.text.tertiary};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  opacity: 0.7;
`;

const ModeHints = styled.div`
  margin: ${({ theme }) => theme.spacing[4]} auto 0;
  max-width: 480px;
  width: 100%;
  text-align: left;
  background: ${({ theme }) => theme.colors.background.secondary};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[4]};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.text.tertiary};
  line-height: ${({ theme }) => theme.lineHeights.relaxed};

  strong {
    color: ${({ theme }) => theme.colors.text.secondary};
    font-weight: ${({ theme }) => theme.fontWeights.medium};
  }
`;

const HintRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: ${({ theme }) => theme.spacing[2]};

  & + & {
    margin-top: ${({ theme }) => theme.spacing[2]};
  }
`;

const PhaseIndicator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[4]};
  max-width: 640px;
  width: 100%;
  margin: 0 auto;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  background: rgba(59, 130, 246, 0.1);
  color: #1d4ed8;
  border: 1px solid rgba(59, 130, 246, 0.35);
`;

const RatingButtons = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[3]};
  flex-wrap: wrap;
  justify-content: center;
  width: 100%;
  max-width: 640px;
`;

const RatingButton = styled.button<{ color: string }>`
  flex: 1;
  min-width: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[4]};
  border-radius: ${({ theme }) => theme.radii.lg};
  border: 2px solid ${({ color }) => color};
  background: transparent;
  color: ${({ color }) => color};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ color }) => color};
    color: white;
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.md};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const RatingLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.normal};
  opacity: 0.8;
`;

const SessionComplete = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing[12]} ${({ theme }) => theme.spacing[4]};
  max-width: 480px;
  margin: 0 auto;
`;

const CompleteIcon = styled.div`
  width: 96px;
  height: 96px;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme }) => theme.gradients.success.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ theme }) => theme.fontSizes['4xl']};
  margin: 0 auto ${({ theme }) => theme.spacing[6]};
  box-shadow: ${({ theme }) => theme.shadows.lg};
`;

const CompleteTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes['3xl']};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

const CompleteText = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: ${({ theme }) => theme.spacing[6]};
  line-height: ${({ theme }) => theme.lineHeights.relaxed};
`;

const CompleteStats = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${({ theme }) => theme.spacing[4]};
  margin-bottom: ${({ theme }) => theme.spacing[6]};
  padding: ${({ theme }) => theme.spacing[4]};
  background: ${({ theme }) => theme.colors.background.secondary};
  border-radius: ${({ theme }) => theme.radii.lg};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
`;

const CompleteStat = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
`;

const CompleteStatValue = styled.span<{ color?: string }>`
  font-size: ${({ theme }) => theme.fontSizes['2xl']};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme, color }) => color || theme.colors.text.primary};
`;

const CompleteStatLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.text.tertiary};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing[12]} ${({ theme }) => theme.spacing[4]};
`;

const EmptyIcon = styled.div`
  font-size: ${({ theme }) => theme.fontSizes['5xl']};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
  opacity: 0.5;
`;

const EmptyTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes['2xl']};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

const EmptyDesc = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.base};
  color: ${({ theme }) => theme.colors.text.tertiary};
  max-width: 400px;
  margin: 0 auto ${({ theme }) => theme.spacing[6]};
  line-height: ${({ theme }) => theme.lineHeights.relaxed};
`;

const StudyGuidePanel = styled.section`
  width: 100%;
  padding: ${({ theme }) => theme.spacing[8]};
  background: ${({ theme }) => theme.colors.background.primary};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.radii.xl};
  box-shadow: ${({ theme }) => theme.shadows.md};
`;

const StudyGuideIntro = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: ${({ theme }) => theme.lineHeights.relaxed};
  margin-bottom: ${({ theme }) => theme.spacing[6]};
`;

const TopicNavigationStl = styled.nav`
  margin-block: ${({ theme }) => theme.spacing[6]};
  padding: ${({ theme }) => theme.spacing[4]};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.radii.md};

  ol {
    padding-inline-start: ${({ theme }) => theme.spacing[5]};
    margin-block: ${({ theme }) => theme.spacing[2]} 0;
  }

  li + li {
    margin-top: ${({ theme }) => theme.spacing[2]};
  }
`;

const StudySection = styled.section`
  & > h3 { scroll-margin-top: 6rem; }
  & + & {
    margin-top: ${({ theme }) => theme.spacing[6]};
  }
`;

const StudySectionTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

const StudySectionText = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: ${({ theme }) => theme.lineHeights.relaxed};
  white-space: pre-wrap;
  overflow-wrap: anywhere;

  & + & {
    margin-top: ${({ theme }) => theme.spacing[3]};
  }
`;

const StudyActions = styled.div`
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[3]};
  margin-top: ${({ theme }) => theme.spacing[8]};
`;

const GuideActionsStl = styled(StudyActions)`
  justify-content: flex-start;
  margin: 0 0 ${({ theme }) => theme.spacing[6]};
`;

const PrimaryButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[6]};
  background: ${({ theme }) => theme.gradients.brand.primary};
  color: ${({ theme }) => theme.colors.text.inverse};
  border-radius: ${({ theme }) => theme.radii.md};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  font-size: ${({ theme }) => theme.fontSizes.base};
  border: none;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    box-shadow: ${({ theme }) => theme.shadows.md};
    transform: translateY(-1px);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.brand.light};
  }
`;

const AddButtonStyled = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[6]};
  background: ${({ theme }) => theme.gradients.brand.primary};
  color: ${({ theme }) => theme.colors.text.inverse};
  border-radius: ${({ theme }) => theme.radii.md};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  font-size: ${({ theme }) => theme.fontSizes.base};

  &:hover {
    color: ${({ theme }) => theme.colors.text.inverse};
    box-shadow: ${({ theme }) => theme.shadows.md};
    transform: translateY(-1px);
  }
`;

const ratings = [
  { key: 'again', label: 'Novamente', color: '#ef4444' },
  { key: 'hard', label: 'Difícil', color: '#f59e0b' },
  { key: 'good', label: 'Bom', color: '#22c55e' },
  { key: 'easy', label: 'Fácil', color: '#3b82f6' },
] as const;

export function EstudoDiario() {
  const [searchParams] = useSearchParams();
  const contentId = searchParams.get('content') || undefined;
  return <StudySessionPage key={contentId ?? 'daily'} contentId={contentId} />;
}

function StudySessionPage({ contentId }: { contentId?: string }) {
  const theme = useTheme();

  const { 
    session, 
    setIsAnswerVisible, 
    startSession, 
    handleAnswer,
    isGrading,
    historyPending,
    endSession, 
    currentCard, 
    progress, 
    isFinished 
  } = useStudySession();

  const [flipped, setFlipped] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [contentTitle, setContentTitle] = useState<string | null>(null);
  const [studyGuide, setStudyGuide] = useState<StudyGuideSection[]>([]);
  const [contentLoaded, setContentLoaded] = useState(!contentId);
  const [showGuide, setShowGuide] = useState(false);
  const [hasStoredPdf, setHasStoredPdf] = useState(false);
  const [noCards, setNoCards] = useState(false);
  const [nextReview, setNextReview] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState(false);
  const [answerError, setAnswerError] = useState(false);
  const [finalized, setFinalized] = useState(false);
  const [ending, setEnding] = useState(false);
  const [endError, setEndError] = useState(false);
  const finishing = useRef(false);

  useEffect(() => {
    if (!contentId) return;
    let active = true;
    void Promise.all([
      contentService.getById(contentId).catch(() => undefined),
      flashcardService.hasReviewed(contentId).catch(() => false),
    ]).then(([content, hasReviewed]) => {
      if (!active) return;
      setContentTitle(content?.title ?? null);
      setStudyGuide(content?.studyGuide ?? []);
      setHasStoredPdf(content?.source.type === 'pdf' && content.source.pdfStored === true);
      setShowGuide(!hasReviewed);
      setContentLoaded(true);
    });
    return () => {
      active = false;
    };
  }, [contentId]);

  const finishSession = useCallback(async () => {
    if (finishing.current || isGrading) return;
    finishing.current = true;
    setEnding(true);
    setEndError(false);
    try {
      await endSession();
      setFinalized(true);
      setIsSessionActive(false);
    } catch {
      setEndError(true);
    } finally {
      finishing.current = false;
      setEnding(false);
    }
  }, [endSession, isGrading]);

  useEffect(() => {
    if (!isSessionActive || !isFinished || isGrading || ending || endError) return;
    const timer = window.setTimeout(() => void finishSession(), 0);
    return () => window.clearTimeout(timer);
  }, [isFinished, isSessionActive, finishSession, isGrading, ending, endError]);

  const handleStart = async (practice = false) => {
    if (starting) return;
    setStarting(true);
    setStartError(false);
    try {
      const result = await startSession(40, contentId, practice);
      setNoCards(result.status === 'empty');
      setNextReview(result.status === 'scheduled' ? result.nextReview : null);
      if (result.status === 'scheduled' || result.status === 'started') setShowGuide(false);
      if (result.status === 'started') {
        setAnswerError(false);
        setEndError(false);
        setFinalized(false);
        setFlipped(false);
        setIsSessionActive(true);
      }
    } catch {
      setStartError(true);
    } finally {
      setStarting(false);
    }
  };

  const headerTitle = contentId
    ? `Estudo${contentTitle ? `: ${contentTitle}` : ''}`
    : 'Estudo Diário';

  const flipCard = useCallback(() => {
    setFlipped((prev) => {
      const next = !prev;
      setIsAnswerVisible(next);
      return next;
    });
  }, [setIsAnswerVisible]);

  const gradeCard = useCallback(async (rating: CardRating) => {
    setAnswerError(false);
    try {
      if (await handleAnswer(rating)) setFlipped(false);
    } catch {
      setAnswerError(true);
    }
  }, [handleAnswer]);

  const getReviewInterval = (rating: CardRating) => {
    if (!currentCard || session.practice) return undefined;
    const { interval } = calculateSM2(rating, currentCard.interval, currentCard.easeFactor, currentCard.repetitions);
    return formatReviewInterval(interval);
  };

  // Atalhos de teclado: Espaço vira a carta; 1-4 avaliam (somente com a resposta visível)
  useEffect(() => {
    if (!isSessionActive || isFinished || ending || !currentCard || currentCard.format === 'multiple-choice' && currentCard.options && currentCard.options.length >= 2) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (event.code === 'Space' || event.key === ' ') {
        if (target?.closest('button, a[href]') || isGrading) return;
        event.preventDefault();
        flipCard();
        return;
      }

      if (!flipped || event.repeat || isGrading) return;

      const ratingMap: Record<string, 'again' | 'hard' | 'good' | 'easy'> = {
        '1': 'again',
        '2': 'hard',
        '3': 'good',
        '4': 'easy',
      };
      const rating = ratingMap[event.key];
      if (rating) {
        event.preventDefault();
        void gradeCard(rating);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSessionActive, isFinished, currentCard, flipped, flipCard, gradeCard, isGrading, ending]);

  if (!isSessionActive && !finalized) {
    if (!contentLoaded) return <p role="status">Carregando tema...</p>;

    const openGuide = () => {
      setNoCards(false);
      setShowGuide(true);
    };

    if (nextReview && !showGuide) {
      return (
        <div>
          <PageHeader><Title>{headerTitle}</Title></PageHeader>
          <EmptyState>
            <EmptyTitle>Revisões em dia</EmptyTitle>
            <EmptyDesc>
              Próxima revisão: <time dateTime={nextReview}>{new Date(nextReview).toLocaleString('pt-BR', {
                dateStyle: 'short',
                timeStyle: 'short',
              })}</time>.
            </EmptyDesc>
            {startError && <p role="alert">Não foi possível carregar suas questões. Tente novamente.</p>}
            <StudyActions>
              <PrimaryButton disabled={starting} onClick={() => void handleStart(true)}>Praticar agora</PrimaryButton>
              {studyGuide.length > 0 && <PrimaryButton onClick={openGuide}>Ler apostila (30%)</PrimaryButton>}
              <Link to="/biblioteca">Voltar à biblioteca</Link>
            </StudyActions>
          </EmptyState>
        </div>
      );
    }

    if (contentId && noCards) {
      return (
        <div>
          <PageHeader>
            <Title>{headerTitle}</Title>
          </PageHeader>
          <EmptyState>
            <EmptyIcon>📭</EmptyIcon>
            <EmptyTitle>Nenhum flashcard para este conteúdo</EmptyTitle>
            <EmptyDesc>
              Este conteúdo ainda não tem cards disponíveis para estudar. Verifique se os flashcards foram gerados ou estude outro conteúdo.
            </EmptyDesc>
            {studyGuide.length > 0 && <PrimaryButton onClick={openGuide}>Ler apostila (30%)</PrimaryButton>}
            <AddButtonStyled to="/biblioteca" style={{ textDecoration: 'none' }}>📚 Voltar à Biblioteca</AddButtonStyled>
          </EmptyState>
        </div>
      );
    }

    if (contentId && showGuide && studyGuide.length > 0) {
      return (
        <div>
          <PageHeader>
            <Title>{headerTitle}</Title>
          </PageHeader>
          <StudyGuidePanel>
            <StudySectionTitle>Etapa 1 de 2 — Conteúdo (30%)</StudySectionTitle>
            <StudyGuideIntro>
              Reserve cerca de 30% do tempo da sessão para esta leitura; use os 70% restantes para praticar. A proporção é uma meta de estudo, sem cronômetro obrigatório. Somente as questões aparecem como flashcards.
            </StudyGuideIntro>
            {startError && <p role="alert">Não foi possível carregar suas questões. Tente novamente.</p>}
            <GuideActionsStl>
              <PrimaryButton disabled={starting} onClick={() => void handleStart()}>
                Continuar questões (70%)
              </PrimaryButton>
            </GuideActionsStl>
            {hasStoredPdf && (
              <p>
                <a href={`/api/contents/${encodeURIComponent(contentId)}/source`} target="_blank" rel="noreferrer">
                  Abrir PDF original
                </a>
              </p>
            )}
            {studyGuide.length > 1 && (
              <TopicNavigationStl aria-label="Tópicos da apostila">
                <strong>Tópicos</strong>
                <ol>
                  {studyGuide.map((section, index) => (
                    <li key={index}><a href={`#topico-${index + 1}`}>{section.title}</a></li>
                  ))}
                </ol>
              </TopicNavigationStl>
            )}
            {studyGuide.map((section, index) => (
              <StudySection key={index}>
                <StudySectionTitle id={`topico-${index + 1}`} tabIndex={-1}>{section.title}</StudySectionTitle>
                {section.executiveSummary && <StudySectionText><strong>{section.executiveSummary}</strong></StudySectionText>}
                {section.content.split(/\r?\n[ \t]*\r?\n/).filter(text => text.trim()).map((text, paragraph) => (
                  <StudySectionText key={paragraph}>{text.trim()}</StudySectionText>
                ))}
                {section.azureScenario && <StudySectionText><strong>Cenário no Azure. </strong>{section.azureScenario}</StudySectionText>}
                {section.decisionCriteria && <StudySectionText><strong>Critério de decisão. </strong>{section.decisionCriteria}</StudySectionText>}
                <ExamTrapCallout traps={section.gotchas || []} />
                <DecisionMatrix table={section.comparisonTable} />
              </StudySection>
            ))}
            <StudyActions>
              <Link to="/biblioteca" style={{ alignSelf: 'center', color: theme.colors.text.secondary }}>
                Voltar à biblioteca
              </Link>
            </StudyActions>
          </StudyGuidePanel>
        </div>
      );
    }

    return (
      <div>
        <PageHeader>
          <Title>{headerTitle}</Title>
        </PageHeader>
        <EmptyState>
          <EmptyIcon>🎯</EmptyIcon>
          <EmptyTitle>Pronto para a sessão de hoje?</EmptyTitle>
          <EmptyDesc>
            {contentId
              ? 'Sessão focada neste conteúdo: o sistema selecionará os cards vencidos e novos dele.'
              : 'Vamos revisar seus flashcards usando repetição espaçada. O sistema selecionará automaticamente os cards que você precisa revisar agora.'}
          </EmptyDesc>
          {startError && <p role="alert">Não foi possível carregar suas questões. Tente novamente.</p>}
          {noCards && <p role="status">Não há questões disponíveis para a revisão diária.</p>}
          <div style={{ display: 'flex', gap: theme.spacing[3], flexWrap: 'wrap', justifyContent: 'center' }}>
            <PrimaryButton disabled={starting} onClick={() => void handleStart()}>
              {studyGuide.length > 0 ? 'Continuar questões (70%)' : 'Iniciar revisão das questões'}
            </PrimaryButton>
            {studyGuide.length > 0 && <PrimaryButton onClick={openGuide}>Ler apostila (30%)</PrimaryButton>}
            {contentId && (
              <Link to="/biblioteca" style={{ alignSelf: 'center', fontSize: theme.fontSizes.sm, color: theme.colors.text.secondary }}>
                ← Voltar à biblioteca
              </Link>
            )}
          </div>
          <ModeHints>
            <HintRow>
              <span aria-hidden="true">📖</span>
              <span>
                <strong>Estudo por módulo:</strong> abra um tema da biblioteca para ler a apostila (~30%) ou continuar nas questões (~70%).
              </span>
            </HintRow>
            <HintRow>
              <span aria-hidden="true">⏭️</span>
              <span>
                <strong>Revisão diária:</strong> aqui você pratica os flashcards de questões disponíveis.
              </span>
            </HintRow>
          </ModeHints>
        </EmptyState>
      </div>
    );
  }

  if (finalized) {
    return (
      <div>
        <PageHeader>
          <Title>{headerTitle}</Title>
        </PageHeader>
        <SessionComplete>
          <CompleteIcon>✅</CompleteIcon>
          <CompleteTitle>Sessão finalizada!</CompleteTitle>
          <CompleteText>
            Avaliações registradas nesta sessão: <strong>{session.currentIndex}</strong>.
          </CompleteText>
          <CompleteStats>
            <CompleteStat>
              <CompleteStatValue color={theme.colors.success.main}>{session.correctCount}</CompleteStatValue>
              <CompleteStatLabel>Acertos</CompleteStatLabel>
            </CompleteStat>
            <CompleteStat>
              <CompleteStatValue color={theme.colors.warning.main}>{session.againCount}</CompleteStatValue>
              <CompleteStatLabel>Repetir</CompleteStatLabel>
            </CompleteStat>
            <CompleteStat>
              <CompleteStatValue color={theme.colors.brand.primary}>
                {session.currentIndex > 0
                  ? Math.round((session.correctCount / session.currentIndex) * 100)
                  : 0}%
              </CompleteStatValue>
              <CompleteStatLabel>Taxa de acerto</CompleteStatLabel>
            </CompleteStat>
          </CompleteStats>
          <PrimaryButton onClick={() => setFinalized(false)}>Voltar ao estudo</PrimaryButton>
        </SessionComplete>
      </div>
    );
  }

  if (!currentCard) {
    return (
      <EmptyState>
        <EmptyTitle>Encerramento da sessão</EmptyTitle>
        {endError ? (
          <>
            <EmptyDesc role="alert">Não foi possível encerrar a sessão. Tente novamente.</EmptyDesc>
            <PrimaryButton onClick={() => void finishSession()}>Tentar novamente</PrimaryButton>
          </>
        ) : <EmptyDesc role="status">Salvando o histórico...</EmptyDesc>}
      </EmptyState>
    );
  }

  return (
    <div>
      <PageHeader>
        <Title>{headerTitle}</Title>
        <SessionStats>
          <Stat>
            <StatValue color={theme.colors.brand.primary}>
              {session.currentIndex + 1} / {session.cards.length}
            </StatValue>
            <StatLabel>Progresso</StatLabel>
          </Stat>
          <Stat>
            <StatValue color={theme.colors.success.main}>{session.correctCount}</StatValue>
            <StatLabel>Acertos</StatLabel>
          </Stat>
          <Stat>
            <StatValue color={theme.colors.warning.main}>{session.againCount}</StatValue>
            <StatLabel>Repetir</StatLabel>
          </Stat>
        </SessionStats>
      </PageHeader>

      <ProgressContainer>
        <ProgressFill $progress={progress} />
      </ProgressContainer>

      <FlashcardContainer>
        <PhaseIndicator>
          {session.practice ? 'Treino extra · agendamento preservado' : '✍️ Etapa 2 de 2 — Questões (70%) · recuperação ativa'}
        </PhaseIndicator>

        {currentCard.format === 'multiple-choice' && currentCard.options && currentCard.options.length >= 2 ? (
          <MultipleChoiceCard
            key={session.currentIndex}
            card={currentCard}
            grading={isGrading || ending}
            getReviewInterval={getReviewInterval}
            onGrade={gradeCard}
          />
        ) : (
          <>
            <Flashcard onClick={flipCard} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && flipCard()} aria-label="Virar card">
              <FlashcardInner $flipped={flipped}>
                <FlashcardFace>
                  <CardTag bg="#dbeafe" color="#1d4ed8">
                    ❓ Questão
                    {currentCard.tags[0] ? ` · ${currentCard.tags[0]}` : ''}
                  </CardTag>
                  <CardContent>{currentCard.front}</CardContent>
                  <CardSource>📖 {currentCard.tags.join(', ') || 'Conteúdo'}</CardSource>
                  <FlipHint>💡 Clique ou pressione Espaço para virar</FlipHint>
                </FlashcardFace>
                <FlashcardBack>
                  <CardTag bg="#ede9fe" color="#7c3aed">Resposta</CardTag>
                  <CardContent>{currentCard.back}</CardContent>
                  <CardSource>📖 {currentCard.tags.join(', ') || 'Conteúdo'}</CardSource>
                  <FlipHint>💡 Clique para voltar</FlipHint>
                </FlashcardBack>
              </FlashcardInner>
            </Flashcard>

            <div style={{ textAlign: 'center', color: theme.colors.text.tertiary, fontSize: theme.fontSizes.xs, marginBottom: theme.spacing[2] }}>
              Atalhos: Espaço — virar carta · 1 Novamente · 2 Difícil · 3 Bom · 4 Fácil
            </div>

            {flipped && (
              <div style={{ textAlign: 'center', color: theme.colors.text.tertiary, fontSize: theme.fontSizes.sm, marginBottom: theme.spacing[2] }}>
                Como foi a resposta?
              </div>
            )}

            {flipped && (
              <RatingButtons role="group" aria-label="Avaliar dificuldade do card">
                {ratings.map((r) => (
                  <RatingButton
                    key={r.key}
                    color={r.color}
                    disabled={isGrading || ending}
                    onClick={() => void gradeCard(r.key)}
                  >
                    {r.label}
                    {!session.practice && <RatingLabel>{getReviewInterval(r.key)}</RatingLabel>}
                  </RatingButton>
                ))}
              </RatingButtons>
            )}
          </>
        )}
        {answerError && <p role="alert">Não foi possível salvar a avaliação. Tente novamente.</p>}
        {historyPending && <p role="status">Avaliação salva. O histórico será atualizado ao encerrar.</p>}
        {endError && <p role="alert">Não foi possível encerrar a sessão. Tente novamente.</p>}
        <PrimaryButton disabled={isGrading || ending} onClick={() => void finishSession()}>
          {ending ? 'Salvando o histórico...' : 'Encerrar por hoje'}
        </PrimaryButton>
      </FlashcardContainer>
    </div>
  );
}
