/**
 * ActivityHeatmap — Visualização de consistência de estudos (estilo GitHub)
 */

import styled from 'styled-components';
import { useEffect, useState } from 'react';
import { sessionService } from '../../storage';

const HeatmapContainer = styled.div`
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
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const Title = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  margin: 0;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, 12px);
  grid-auto-flow: column;
  grid-template-rows: repeat(7, 12px);
  gap: 3px;
  overflow-x: auto;
  padding-bottom: ${({ theme }) => theme.spacing[2]};
  
  &::-webkit-scrollbar {
    height: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.border.primary};
    border-radius: 3px;
  }
`;

const Day = styled.div<{ intensity: number }>`
  width: 12px;
  height: 12px;
  border-radius: 2px;
  background: ${({ theme, intensity }) => {
    if (intensity === 0) return theme.colors.background.tertiary;
    if (intensity === 1) return '#c6e48b'; // Light green
    if (intensity === 2) return '#7bc96f'; // Medium green
    if (intensity === 3) return '#239a3b'; // Dark green
    return '#1b5e20'; // Deepest green
  }};
  transition: transform 0.1s ease;
  cursor: pointer;

  &:hover {
    transform: scale(1.3);
    z-index: 10;
    outline: 1px solid ${({ theme }) => theme.colors.text.primary};
  }
`;

const Legend = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  justify-content: flex-end;
  margin-top: ${({ theme }) => theme.spacing[3]};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.text.tertiary};
`;

const LegendBox = styled.div<{ intensity: number }>`
  width: 12px;
  height: 12px;
  border-radius: 2px;
  background: ${({ theme, intensity }) => {
    if (intensity === 0) return theme.colors.background.tertiary;
    if (intensity === 1) return '#c6e48b';
    if (intensity === 2) return '#7bc96f';
    if (intensity === 3) return '#239a3b';
    return '#1b5e20';
  }};
`;

export function ActivityHeatmap() {
  const [data, setData] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadActivity = async () => {
      try {
        const sessions = await sessionService.getRecent(1000);
        const activityMap: Record<string, number> = {};
        
        sessions.forEach(s => {
          const date = s.date; // YYYY-MM-DD
          activityMap[date] = (activityMap[date] || 0) + s.cardsReviewed;
        });
        
        setData(activityMap);
      } catch (err) {
        console.error('Error loading heatmap:', err);
      } finally {
        setLoading(false);
      }
    };

    loadActivity();
  }, []);

  const generateDays = () => {
    const days = [];
    const today = new Date();
    // Generate last 365 days
    for (let i = 364; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const count = data[dateStr] || 0;
      
      // Intensity mapping
      let intensity = 0;
      if (count > 0 && count <= 5) intensity = 1;
      else if (count > 5 && count <= 15) intensity = 2;
      else if (count > 15 && count <= 30) intensity = 3;
      else if (count > 30) intensity = 4;
      
      days.push({ dateStr, intensity });
    }
    return days;
  };

  if (loading) return <HeatmapContainer style={{ height: '150px' }} />;

  return (
    <HeatmapContainer>
      <Header>
        <Title>Consistência de Estudos</Title>
      </Header>
      
      <Grid>
        {generateDays().map(day => (
          <Day 
            key={day.dateStr} 
            intensity={day.intensity} 
            title={`${day.dateStr}: ${data[day.dateStr] || 0} cards`}
          />
        ))}
      </Grid>
      
      <Legend>
        <span>Menos</span>
        <LegendBox intensity={0} />
        <LegendBox intensity={1} />
        <LegendBox intensity={2} />
        <LegendBox intensity={3} />
        <LegendBox intensity={4} />
        <span>Mais</span>
      </Legend>
    </HeatmapContainer>
  );
}
