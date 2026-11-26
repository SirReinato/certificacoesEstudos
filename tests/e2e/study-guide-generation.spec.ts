import { expect, test } from '@playwright/test';
import type { AIConfig, AIGeneratedFlashcards, Content } from '../../src/types';

const samples = [
  {
    exam: 'AI-200',
    title: 'Autenticação em Azure',
    source: 'Uma aplicação hospedada no Azure pode usar identidade gerenciada para acessar recursos compatíveis sem armazenar segredos.',
    executiveSummary: 'Identidade gerenciada evita armazenar segredos na aplicação.',
    azureScenario: 'Uma aplicação hospedada no Azure precisa acessar um recurso compatível.',
    decisionCriteria: 'Use identidade gerenciada quando a aplicação e o recurso de destino oferecerem suporte.',
  },
  {
    exam: 'AI-103',
    title: 'Limites do modelo',
    source: 'Dividir documentos longos em trechos ajuda a respeitar o limite de contexto do modelo.',
    executiveSummary: 'Divida documentos longos conforme o limite de contexto.',
    azureScenario: 'Uma aplicação envia trechos de um documento ao modelo em vez do texto completo.',
    decisionCriteria: 'Se o documento exceder o limite de contexto, envie trechos.',
  },
] as const;

for (const sample of samples) {
  test(`gera uma apostila para ${sample.exam} e preserva o formato legado`, async ({ page }) => {
    const legacySection = {
      title: 'Formato legado',
      content: 'Material gravado no formato anterior.',
      gotchas: ['Atenção à condição descrita na fonte.'],
      comparisonTable: { headers: ['Critério', 'Opção'], rows: [['Contexto', 'Compatível']] },
    };
    const flashcard = { front: 'Qual decisão atende ao requisito?', back: sample.decisionCriteria, format: 'flip' };
    const response = {
      studyGuide: [
        {
          title: sample.title,
          content: `${sample.source}\n\nAplique a regra ao requisito apresentado.`,
          executiveSummary: ` ${sample.executiveSummary} `,
          azureScenario: ` ${sample.azureScenario} `,
          decisionCriteria: ` ${sample.decisionCriteria} `,
        },
        legacySection,
        {
          title: 'Campos sem evidência',
          content: sample.source,
          executiveSummary: ' ',
          azureScenario: { text: 'Inválido' },
          decisionCriteria: null,
        },
      ],
      flashcards: [flashcard],
    };
    let prompt = '';
    await page.route('**/api/nvidia/v1/chat/completions', async route => {
      const payload = route.request().postDataJSON() as { messages: { content: string }[] };
      prompt = payload.messages.map(message => message.content).join('\n');
      await route.fulfill({
        json: { choices: [{ message: { content: JSON.stringify(response) } }] },
      });
    });
    await page.goto('/login');

    const now = '2026-11-26T15:00:00.000Z';
    const content: Content = {
      id: 'conteudo-fixture',
      title: sample.title,
      type: 'text',
      source: { type: 'text' },
      tags: [],
      flashcardsCount: 0,
      reviewedCount: 0,
      mastery: 0,
      createdAt: now,
      updatedAt: now,
      chunks: [{ id: 'trecho-fixture', contentId: 'conteudo-fixture', text: sample.source, order: 0 }],
    };
    const config: AIConfig = { provider: 'nvidia', model: 'fixture-model', apiKey: 'test-placeholder' };
    const result = await page.evaluate(async ({ content, exam, config }): Promise<AIGeneratedFlashcards> => {
      const modulePath = '/src/services/aiService.ts';
      const { generateFlashcardsFromContent } = await import(modulePath);
      return generateFlashcardsFromContent(content, exam, [], config);
    }, { content, exam: sample.exam, config });

    expect(prompt).toContain(`EXAME ALVO: ${sample.exam}`);
    expect(prompt).toContain(sample.source);
    expect(prompt).toContain('"executiveSummary"');
    expect(prompt).toContain('"azureScenario"');
    expect(prompt).toContain('"decisionCriteria"');
    expect(result.studyGuide[0]).toMatchObject({
      title: sample.title,
      content: response.studyGuide[0].content,
      executiveSummary: sample.executiveSummary,
      azureScenario: sample.azureScenario,
      decisionCriteria: sample.decisionCriteria,
    });
    expect(result.studyGuide[1]).toMatchObject(legacySection);
    for (const section of result.studyGuide.slice(1)) {
      expect(section).not.toHaveProperty('executiveSummary');
      expect(section).not.toHaveProperty('azureScenario');
      expect(section).not.toHaveProperty('decisionCriteria');
    }
    expect(result.flashcards).toHaveLength(1);
    expect(result.flashcards[0]).toMatchObject({ ...flashcard, kind: 'question' });
  });
}
