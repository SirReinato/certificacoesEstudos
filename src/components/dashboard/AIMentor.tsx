/**
 * AIMentor — Componente de insights inteligentes baseados em performance
 */

import styled from 'styled-components';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { aiMentorService, type MentorInsight } from '../../services/aiMentorService';

const MentorContainer = styled.div`
  background: ${({ theme }) => theme.colors.background.primary};
  border: 2px solid ${({ theme }) => theme.colors.brand.primary};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing[6]};
  box-shadow: ${({ theme }) => theme.shadows.md};
  position: relative;
  overflow: hidden;
`;

const Badge = styled.div<{ type: MentorInsight['type'] }>`
  position: absolute;
  top: 0;
  right: 0;
  padding: 4px 12px;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  text-transform: uppercase;
  color: white;
  border-bottom-left-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme, type }) => {
    if (type === 'success') return theme.colors.success.main;
    if (type === 'warning') return theme.colors.error.main;
    return theme.colors.brand.primary;
  }};
`;

const Title = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  margin-bottom: ${({ theme }) => theme.spacing[3]};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Message = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.6;
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const ActionButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  background: ${({ theme }) => theme.colors.brand.primary};
  color: white;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  text-decoration: none;
  transition: all ${({ theme }) => theme.transitions.fast};
  cursor: pointer;

  &:hover {
    filter: brightness(1.1);
    transform: translateY(-1px);
  }
`;

export function AIMentor() {
  const [insight, setInsight] = useState<MentorInsight | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsight = async () => {
      try {
        const insights = await aiMentorService.generateInsights();
        if (insights.length > 0) {
          // Pega o insight mais crítico (warning > suggestion > success)
          const priority = { warning: 0, suggestion: 1, success: 2 };
          const sorted = insights.sort((a, b) => 
            priority[a.type] - priority[b.type]
          );
          setInsight(sorted[0]);
        }
      } catch (err) {
        console.error('Error loading AI insights:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInsight();
  }, []);

  if (loading) return <MentorContainer style={{ height: '120px' }} />;
  if (!insight) return null;

  return (
    <MentorContainer>
      <Badge type={insight.type}>{insight.type === 'warning' ? 'Atenção' : insight.type === 'success' ? 'Conquista' : 'Sugestão'}</Badge>
      <Title>
        <span>🤖</span> {insight.title}
      </Title>
      <Message>{insight.message}</Message>
      {insight.action && (
        <ActionButton to={insight.action.path}>
          {insight.action.label}
        </ActionButton>
      )}
    </MentorContainer>
  );
}
