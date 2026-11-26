/**
 * Atividade — Histórico detalhado de sessões de estudo
 */

import styled from 'styled-components';
import { useState, useEffect } from 'react';
import { useTheme } from '../theme';
import { contentService, sessionService } from '../storage';
import type { StudySession } from '../types';

const PageHeader = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[8]};
`;

const Title = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes['4xl']};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
  background: ${({ theme }) => theme.gradients.brand.primary};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Subtitle = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: ${({ theme }) => theme.spacing[4]};
  margin-bottom: ${({ theme }) => theme.spacing[8]};
`;

const SummaryCard = styled.div`
  background: ${({ theme }) => theme.colors.background.primary};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing[6]};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const SummaryLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text.tertiary};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const SummaryValue = styled.div`
  font-size: ${({ theme }) => theme.fontSizes['2xl']};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const HistorySection = styled.section`
  margin-bottom: ${({ theme }) => theme.spacing[8]};
`;

const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes['2xl']};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const SessionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[3]};
`;

const SessionItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing[4]};
  background: ${({ theme }) => theme.colors.background.primary};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.radii.md};
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.brand.primary};
    transform: translateX(4px);
  }
`;

const SessionInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
`;

const SessionDate = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const SessionMeta = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.text.tertiary};
`;

const SessionStats = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[6]};
  align-items: center;
`;

const StatPill = styled.div<{ color?: string }>`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
`;

const StatPillValue = styled.span<{ color?: string }>`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme, color }) => color || theme.colors.text.primary};
`;

const StatPillLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.text.tertiary};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing[12]};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

export function Atividade() {
  const theme = useTheme();
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [contentTitles, setContentTitles] = useState<Record<string, string>>({});
  const [totals, setTotals] = useState({
    cards: 0,
    time: 0,
    accuracy: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const allSessions = await sessionService.getRecent(100);
        setSessions(allSessions);
        const ids = [...new Set(allSessions.flatMap(session => session.contentIds ?? []))];
        try {
          setContentTitles(await contentService.getTitles(ids));
        } catch (error) {
          console.error('Erro ao carregar temas das sessões:', error);
        }

        const totalStats = await sessionService.getTotalStats();
        setTotals({
          cards: totalStats.totalCards,
          time: totalStats.totalTime,
          accuracy: Math.round(totalStats.avgAccuracy * 100),
        });
      } catch (err) {
        console.error('Error loading activity:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <p>Carregando histórico...</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader>
        <div>
          <Title>Histórico de Atividade</Title>
          <Subtitle>Seu caminho rumo à certificação Microsoft Azure</Subtitle>
        </div>
      </PageHeader>

      <SummaryGrid>
        <SummaryCard>
          <SummaryLabel>Total de Cards</SummaryLabel>
          <SummaryValue>{totals.cards}</SummaryValue>
        </SummaryCard>
        <SummaryCard>
          <SummaryLabel>Tempo Total</SummaryLabel>
          <SummaryValue>
            {Math.floor(totals.time / 3600)}h {Math.floor((totals.time % 3600) / 60)}m
          </SummaryValue>
        </SummaryCard>
        <SummaryCard>
          <SummaryLabel>Taxa de Acerto Global</SummaryLabel>
          <SummaryValue color={theme.colors.brand.primary}>{totals.accuracy}%</SummaryValue>
        </SummaryCard>
      </SummaryGrid>

      <HistorySection>
        <SectionTitle>Sessões Recentes</SectionTitle>
        {sessions.length === 0 ? (
          <EmptyState>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📅</div>
            <p>Você ainda não realizou nenhuma sessão de estudo.</p>
          </EmptyState>
        ) : (
          <SessionList>
            {sessions.map((s) => (
              <SessionItem key={s.id}>
                <SessionInfo>
                  <SessionDate>
                    {new Date(s.startedAt).toLocaleDateString('pt-BR', { 
                      day: '2-digit', month: 'long', year: 'numeric' 
                    })}
                  </SessionDate>
                  <SessionMeta>
                    Início: {new Date(s.startedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </SessionMeta>
                  {(s.contentIds ?? []).map(id => contentTitles[id] && <SessionMeta key={id}>{contentTitles[id]}</SessionMeta>)}
                </SessionInfo>
                
                <SessionStats>
                  <StatPill>
                    <StatPillValue>{s.cardsReviewed}</StatPillValue>
                    <StatPillLabel>Cards</StatPillLabel>
                  </StatPill>
                  <StatPill color={theme.colors.success.main}>
                    <StatPillValue color={theme.colors.success.main}>{s.cardsCorrect}</StatPillValue>
                    <StatPillLabel>Acertos</StatPillLabel>
                  </StatPill>
                  <StatPill color={theme.colors.error.main}>
                    <StatPillValue color={theme.colors.error.main}>{s.cardsAgain}</StatPillValue>
                    <StatPillLabel>Repetir</StatPillLabel>
                  </StatPill>
                  <StatPill>
                    <StatPillValue>{Math.floor(s.timeSpent / 60)}m {s.timeSpent % 60}s</StatPillValue>
                    <StatPillLabel>Duração</StatPillLabel>
                  </StatPill>
                </SessionStats>
              </SessionItem>
            ))}
          </SessionList>
        )}
      </HistorySection>
    </div>
  );
}
