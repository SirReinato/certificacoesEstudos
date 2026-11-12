/**
 * AIMentorService — Analisa métricas de estudo e gera insights personalizados
 */

import { flashcardService, sessionService } from '../storage';

export interface MentorInsight {
  id: string;
  type: 'warning' | 'success' | 'suggestion';
  title: string;
  message: string;
  skill?: string;
  action?: {
    label: string;
    path: string;
  };
}

export const aiMentorService = {
  /**
   * Analisa a performance do usuário para gerar insights de estudo
   */
  async generateInsights(): Promise<MentorInsight[]> {
    const insights: MentorInsight[] = [];
    
    // 1. Analisar cards com baixa taxa de acerto (estagnados)
    const allCards = await flashcardService.getAll();
    const skillStats: Record<string, { correct: number; total: number }> = {};

    allCards.forEach((card) => {
      const skill = card.tags[0] ?? 'Geral';
      if (!skillStats[skill]) {
        skillStats[skill] = { correct: 0, total: 0 };
      }
      // Consideramos "correto" se o interval for > 3 dias (estável)
      if (card.interval > 3) {
        skillStats[skill].correct++;
      }
      skillStats[skill].total++;
    });

    // Identificar skills com retenção < 60%
    for (const [skill, stats] of Object.entries(skillStats)) {
      const accuracy = (stats.correct / stats.total) * 100;
      if (accuracy < 60 && stats.total >= 3) {
        insights.push({
          id: `weakness-${skill}`,
          type: 'warning',
          title: 'Ponto de Atenção',
          message: `Notei que sua retenção em "${skill}" está abaixo de 60%. Sugiro revisar a documentação oficial ou gerar novos cards para este tópico.`,
          skill,
          action: {
            label: 'Reforçar Skill',
            path: '/biblioteca/novo'
          }
        });
      }
    }

    // 2. Analisar consistência (Streak)
    const sessions = await sessionService.getRecent(7);
    const uniqueDays = new Set(sessions.map(s => s.date)).size;

    if (uniqueDays >= 5) {
      insights.push({
        id: 'streak-success',
        type: 'success',
        title: 'Ritmo Excelente!',
        message: 'Você manteve uma consistência incrível nos últimos dias. Seu cérebro está no modo de aprendizado otimizado!',
      });
    } else if (uniqueDays < 2 && sessions.length > 0) {
      insights.push({
        id: 'streak-warning',
        type: 'suggestion',
        title: 'Não perca o ritmo',
        message: 'Você estudou pouco nos últimos dias. Uma sessão rápida de 15 minutos hoje ajudaria a consolidar a memória de longo prazo.',
        action: {
          label: 'Estudar Agora',
          path: '/estudo'
        }
      });
    }

    // 3. Sugestão de "Domínio"
    const masteredCount = allCards.filter(c => c.interval >= 90).length;
    if (masteredCount > 0 && masteredCount < 10) {
      insights.push({
        id: 'first-mastery',
        type: 'success',
        title: 'Conhecimento Consolidado',
        message: `Parabéns! Você já dominou ${masteredCount} conceitos permanentemente. Continue assim!`,
      });
    }

    return insights;
  }
};
