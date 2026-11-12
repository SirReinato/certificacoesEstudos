/**
 * RetentionChart — Visualização da distribuição de aprendizado dos flashcards
 */

import styled from 'styled-components';
import { useEffect, useState } from 'react';

const ChartContainer = styled.div`
  background: ${({ theme }) => theme.colors.background.primary};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing[6]};
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing[6]};
`;

const Title = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  margin: 0;
`;

const TotalCount = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text.tertiary};
  background: ${({ theme }) => theme.colors.background.secondary};
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radii.full};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
`;

const BarGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[4]};
`;

const BarRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const BarLabelRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
`;

const LabelText = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;

const LabelValue = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const ProgressBar = styled.div`
  height: 10px;
  background: ${({ theme }) => theme.colors.background.tertiary};
  border-radius: ${({ theme }) => theme.radii.full};
  overflow: hidden;
`;

const ProgressFill = styled.div<{ progress: number; color: string }>`
  height: 100%;
  width: ${({ progress }) => progress}%;
  background: ${({ color }) => color};
  border-radius: ${({ theme }) => theme.radii.full};
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
`;

export function RetentionChart() {
  const [stats, setStats] = useState({
    new: 0,
    learning: 0,
    review: 0,
    mastered: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const { exportAllData } = await import('../../storage');
        const data = JSON.parse(await exportAllData());
        const allCards = data.flashcards ?? [];
        
        const total = allCards.length;
        const newCards = allCards.filter((c: any) => c.repetitions === 0).length;
        const learningCards = allCards.filter((c: any) => c.repetitions > 0 && c.interval < 21).length;
        const masteredCards = allCards.filter((c: any) => c.interval >= 90).length;
        const reviewCards = total - newCards - learningCards - masteredCards;

        setStats({
          new: newCards,
          learning: learningCards,
          review: reviewCards,
          mastered: masteredCards,
          total,
        });
      } catch (err) {
        console.error('Error loading retention stats:', err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const categories = [
    { label: 'Novos', value: stats.new, color: '#94a3b8', desc: 'Nunca revisados' },
    { label: 'Aprendendo', value: stats.learning, color: '#fbbf24', desc: 'Intervalo curto' },
    { label: 'Revisão', value: stats.review, color: '#3b82f6', desc: 'Estáveis' },
    { label: 'Dominados', value: stats.mastered, color: '#22c55e', desc: 'Longo prazo' },
  ];

  if (loading) return <ChartContainer style={{ height: '200px' }} />;

  return (
    <ChartContainer>
      <Header>
        <Title>Retenção de Conhecimento</Title>
        <TotalCount>{stats.total} cards</TotalCount>
      </Header>
      
      <BarGroup>
        {categories.map(cat => {
          const progress = stats.total > 0 ? (cat.value / stats.total) * 100 : 0;
          return (
            <BarRow key={cat.label}>
              <BarLabelRow>
                <LabelText>{cat.label}</LabelText>
                <LabelValue>{cat.value} ({Math.round(progress)}%)</LabelValue>
              </BarLabelRow>
              <ProgressBar>
                <ProgressFill progress={progress} color={cat.color} />
              </ProgressBar>
            </BarRow>
          );
        })}
      </BarGroup>
    </ChartContainer>
  );
}
