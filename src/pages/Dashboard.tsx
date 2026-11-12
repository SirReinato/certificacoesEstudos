/**
 * Dashboard — Página inicial com visão geral do progresso
 * Versão aprimorada com layout moderno e cards corrigidos
 */

import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useTheme } from '../theme';
import { useLibrary } from '../hooks';
import { sessionService } from '../storage';
import { ActivityHeatmap } from '../components/dashboard/ActivityHeatmap';
import { RetentionChart } from '../components/dashboard/RetentionChart';
import { AIMentor } from '../components/dashboard/AIMentor';

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
  max-width: 600px;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: ${({ theme }) => theme.spacing[4]};
  margin-bottom: ${({ theme }) => theme.spacing[8]};
`;

const StatCard = styled.div`
  background: ${({ theme }) => theme.colors.background.primary};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing[6]};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  transition: all ${({ theme }) => theme.transitions.normal};

  &:hover {
    box-shadow: ${({ theme }) => theme.shadows.md};
    border-color: ${({ theme }) => theme.colors.border.secondary};
    transform: translateY(-2px);
  }
`;

const StatIcon = styled.div<{ bg?: string }>`
  width: 48px;
  height: 48px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme, bg }) => bg || theme.gradients.brand.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ theme }) => theme.fontSizes.xl};
  margin-bottom: ${({ theme }) => theme.spacing[3]};
`;

const StatValue = styled.div`
  font-size: ${({ theme }) => theme.fontSizes['3xl']};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  line-height: ${({ theme }) => theme.lineHeights.tight};
`;

const StatLabel = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text.tertiary};
  margin-top: ${({ theme }) => theme.spacing[1]};
`;

const Section = styled.section`
  margin-bottom: ${({ theme }) => theme.spacing[8]};
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes['2xl']};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
`;

const SectionLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.brand.primary};
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const QuickActions = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: ${({ theme }) => theme.spacing[4]};
`;

const ActionCard = styled(Link)`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[6]};
  background: ${({ theme }) => theme.colors.background.primary};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.radii.lg};
  text-decoration: none;
  color: inherit;
  box-shadow: ${({ theme }) => theme.shadows.sm};
  transition: all ${({ theme }) => theme.transitions.normal};

  &:hover {
    box-shadow: ${({ theme }) => theme.shadows.md};
    border-color: ${({ theme }) => theme.colors.brand.primary};
    transform: translateY(-2px);
    text-decoration: none;
    color: inherit;
  }
`;

const ActionIcon = styled.div<{ bg?: string }>`
  width: 56px;
  height: 56px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme, bg }) => bg || theme.gradients.brand.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ theme }) => theme.fontSizes['2xl']};
`;

const ActionContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
`;

const ActionTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;
`;

const ActionDesc = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.base};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0;
  line-height: ${({ theme }) => theme.lineHeights.relaxed};
`;

const ProgressSection = styled.div`
  background: ${({ theme }) => theme.colors.background.primary};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing[6]};
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

const ProgressHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const ProgressTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  margin: 0;
`;

const ProgressBar = styled.div`
  height: 8px;
  background: ${({ theme }) => theme.colors.background.tertiary};
  border-radius: ${({ theme }) => theme.radii.full};
  overflow: hidden;
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

const ProgressFill = styled.div<{ progress: number }>`
  height: 100%;
  width: ${({ progress }) => progress}%;
  background: ${({ theme }) => theme.gradients.brand.primary};
  border-radius: ${({ theme }) => theme.radii.full};
  transition: width ${({ theme }) => theme.transitions.normal};
`;

const ProgressStats = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text.tertiary};
`;

const RecentActivity = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[3]};
`;

const ActivityItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[3]};
  background: ${({ theme }) => theme.colors.background.secondary};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
`;

const ActivityIcon = styled.div<{ bg?: string; color?: string }>`
  width: 40px;
  height: 40px;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme, bg }) => bg || theme.colors.brand.light};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme, color }) => color || theme.colors.brand.primary};
  font-size: ${({ theme }) => theme.fontSizes.lg};
`;

const ActivityContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
`;

const ActivityTitle = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const ActivityMeta = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.text.tertiary};
`;

const LoadingSkeleton = styled.div`
  background: linear-gradient(90deg, ${({ theme }) => theme.colors.background.tertiary} 25%, ${({ theme }) => theme.colors.background.secondary} 50%, ${({ theme }) => theme.colors.background.tertiary} 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: ${({ theme }) => theme.radii.md};
  
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
`;

export function Dashboard() {
  const theme = useTheme();
  const { contents, stats } = useLibrary();
  const [streak, setStreak] = useState(0);
  const [totalStats, setTotalStats] = useState({ totalSessions: 0, totalCards: 0, totalTime: 0, avgAccuracy: 0 });
  const [recentActivity, setRecentActivity] = useState<Array<{title: string; time: string; icon: string; bg: string; color: string}>>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [dashboardLoading, setDashboardLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      setDashboardLoading(true);
      try {
        const [streakData, totalStatsData] = await Promise.all([
          sessionService.getStreak(),
          sessionService.getTotalStats(),
        ]);
        setStreak(streakData);
        setTotalStats(totalStatsData);

        if (contents.length > 0) {
          const avgMastery = contents.reduce((sum, c) => sum + c.mastery, 0) / contents.length;
          setOverallProgress(Math.round(avgMastery));
        }

        const sessions = await sessionService.getRecent(5);
        const activity = sessions.map((s) => ({
          title: "Completou sessão de revisão (" + s.cardsReviewed + " cards)",
          time: new Date(s.startedAt).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          icon: '✅',
          bg: theme.colors.success.light,
          color: theme.colors.success.main,
        }));
        setRecentActivity(activity.length > 0 ? activity : [
          { title: 'Nenhuma atividade recente', time: '—', icon: '📭', bg: theme.colors.background.tertiary, color: theme.colors.text.tertiary },
        ]);
      } catch (err) {
        console.error('Erro ao carregar dashboard:', err);
      } finally {
        setDashboardLoading(false);
      }
    };

    loadDashboardData();
  }, [contents, theme]);

  const statsData = stats || { total: 0, byType: { pdf: 0, link: 0, text: 0 }, totalFlashcards: 0 };

  const statsCards = [
    { label: 'Conteúdos salvos', value: statsData.total.toString(), icon: '📄', bg: theme.gradients.ai.primary },
    { label: 'Flashcards gerados', value: statsData.totalFlashcards.toString(), icon: '🎴', bg: theme.gradients.success.primary },
    { label: 'Dias de streak', value: streak.toString(), icon: '🔥', bg: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)' },
    { label: 'Taxa de acerto', value: (Math.round(totalStats.avgAccuracy * 100) + '%'), icon: '📈', bg: theme.gradients.brand.primary },
  ];

  const quickActions = [
    {
      path: '/biblioteca/novo',
      title: 'Adicionar Conteúdo',
      desc: 'Faça upload de PDF, adicione link ou cole texto para gerar flashcards',
      icon: '➕',
      bg: theme.gradients.brand.primary,
    },
    {
      path: '/estudo',
      title: 'Iniciar Sessão de Estudo',
      desc: 'Revise seus flashcards com repetição espaçada (SM-2)',
      icon: '🎯',
      bg: theme.gradients.success.primary,
    },
    {
      path: '/biblioteca',
      title: 'Gerenciar Biblioteca',
      desc: 'Organize, edite ou remova seus conteúdos e flashcards',
      icon: '📚',
      bg: theme.gradients.ai.primary,
    },
    {
      path: '/config',
      title: 'Configurações',
      desc: 'Ajuste tema, metas diárias, preferências de IA e mais',
      icon: '⚙️',
      bg: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
    },
  ];

  const renderSkeleton = (count: number) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: theme.spacing[4] }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ background: theme.colors.background.primary, border: '1px solid ' + theme.colors.border.primary, borderRadius: theme.radii.lg, padding: theme.spacing[6] }}>
          <LoadingSkeleton style={{ width: '48px', height: '48px', borderRadius: theme.radii.md, marginBottom: theme.spacing[3] }} />
          <LoadingSkeleton style={{ width: '80px', height: '32px', borderRadius: theme.radii.sm }} />
          <LoadingSkeleton style={{ width: '120px', height: '16px', borderRadius: theme.radii.sm, marginTop: theme.spacing[2] }} />
        </div>
      ))}
    </div>
  );

  if (dashboardLoading) {
    return (
      <div>
        <PageHeader>
          <Title>Dashboard</Title>
          <Subtitle>Acompanhe seu progresso nas certificações Microsoft Azure</Subtitle>
        </PageHeader>
        {renderSkeleton(4)}
      </div>
    );
  }

  return (
    <div>
      <PageHeader>
        <Title>Dashboard</Title>
        <Subtitle>Acompanhe seu progresso nas certificações Microsoft Azure</Subtitle>
      </PageHeader>

      <StatsGrid>
        {statsCards.map((stat) => (
          <StatCard key={stat.label}>
            <StatIcon bg={stat.bg}>{stat.icon}</StatIcon>
            <StatValue>{stat.value}</StatValue>
            <StatLabel>{stat.label}</StatLabel>
          </StatCard>
        ))}
      </StatsGrid>

      <Section>
        <SectionHeader>
          <SectionTitle>Ações Rápidas</SectionTitle>
        </SectionHeader>
        <QuickActions>
          {quickActions.map((action) => (
            <ActionCard key={action.path} to={action.path}>
              <ActionIcon bg={action.bg}>{action.icon}</ActionIcon>
              <ActionContent>
                <ActionTitle>{action.title}</ActionTitle>
                <ActionDesc>{action.desc}</ActionDesc>
              </ActionContent>
            </ActionCard>
          ))}
        </QuickActions>
      </Section>

      <AIMentor />

<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: theme.spacing[6], marginBottom: theme.spacing[8] }}>
        <ProgressSection>
          <ProgressHeader>
            <ProgressTitle>Progresso Geral AI-200</ProgressTitle>
            <span style={{ fontSize: theme.fontSizes.lg, fontWeight: theme.fontWeights.bold, color: theme.colors.brand.primary }}>
              {overallProgress}%
            </span>
          </ProgressHeader>
          <ProgressBar>
            <ProgressFill progress={overallProgress} />
          </ProgressBar>
          <ProgressStats>
            <span>Módulos concluídos: {Math.round(overallProgress / 10)} de 12</span>
            <span>Próxima meta: {Math.ceil(overallProgress / 10) * 10}%</span>
          </ProgressStats>
        </ProgressSection>

        <div style={{ background: theme.colors.background.primary, border: '1px solid ' + theme.colors.border.primary, borderRadius: theme.radii.lg, padding: theme.spacing[6], boxShadow: theme.shadows.sm }}>
          <ProgressHeader>
            <ProgressTitle>Próxima Revisão</ProgressTitle>
            <span style={{ fontSize: theme.fontSizes.sm, color: theme.colors.text.tertiary }}>
              {0} cards vencidos
            </span>
          </ProgressHeader>
          <div style={{ marginBottom: theme.spacing[4] }}>
            <div style={{ fontSize: theme.fontSizes.sm, color: theme.colors.text.secondary, marginBottom: theme.spacing[1] }}>
              Azure App Service - Conceitos fundamentais
            </div>
            <ProgressBar>
              <ProgressFill progress={40} />
            </ProgressBar>
          </div >
          <div>
            <div style={{ fontSize: theme.fontSizes.sm, color: theme.colors.text.secondary, marginBottom: theme.spacing[1] }}>
              Azure Functions - Triggers e Bindings
            </div>
            <ProgressBar>
              <ProgressFill progress={15} />
            </ProgressBar>
          </div>
        </div>
      </div>

      <AIMentor />

<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: theme.spacing[6], marginBottom: theme.spacing[8] }}>
        <ActivityHeatmap />
        <RetentionChart />
      </div>

      <Section>
        <SectionHeader>
          <SectionTitle>Atividade Recente</SectionTitle>
          <SectionLink to="/atividade">Ver tudo</SectionLink>
        </SectionHeader>
        <RecentActivity>
          {recentActivity.map((activity, index) => (
            <ActivityItem key={index}>
              <ActivityIcon bg={activity.bg} color={activity.color}>{activity.icon}</ActivityIcon>
              <ActivityContent>
                <ActivityTitle>{activity.title}</ActivityTitle>
                <ActivityMeta>{activity.time}</ActivityMeta>
              </ActivityContent>
            </ActivityItem>
          ))}
        </RecentActivity>
      </Section>
    </div>
  );
}
