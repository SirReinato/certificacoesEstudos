import { expect, test, type Page } from '@playwright/test';

const today = '2026-11-26T15:00:00.000Z';
const yesterday = '2026-11-25T15:00:00.000Z';
const tomorrow = '2026-11-27T15:00:00.000Z';

function card(id: string, front: string, fields = {}) {
  return {
    id, front, back: 'Explicação', content_id: 'tema', format: 'multiple-choice',
    repetitions: 0, last_reviewed: null, lapses: 0, interval: 0,
    next_review: yesterday, created_at: yesterday, importance: 5,
    options: [{ id: 'A', text: 'Opção correta', isCorrect: true }, { id: 'B', text: 'Outra opção', isCorrect: false }],
    ...fields,
  };
}

async function mockStudy(page: Page, cards: ReturnType<typeof card>[], guide: object[] = []) {
  const user = { id: 'test-user', email: 'local@example.test', aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: yesterday };
  const updates: Record<string, unknown>[] = [];
  const sessions: Record<string, unknown>[] = [];
  let rejectSessionUpdate = false;
  await page.clock.setFixedTime(new Date(today));
  await page.addInitScript(user => {
    localStorage.setItem('sb-study-test-auth-token', JSON.stringify({
      access_token: 'test-token', refresh_token: 'test-refresh', token_type: 'bearer',
      expires_at: Math.floor(Date.now() / 1000) + 86400 * 30, user,
    }));
  }, user);
  await page.route('https://study-test.supabase.co/**', async route => {
    const request = route.request();
    const { pathname, searchParams: params } = new URL(request.url());
    const method = request.method();
    let json: unknown = [];
    if (pathname.endsWith('/auth/v1/user')) json = { user };
    if (pathname.endsWith('/rest/v1/contents')) json = [{ id: 'tema', title: 'Azure', source: { type: 'text' }, study_guide: guide }];
    if (pathname.endsWith('/rest/v1/study_sessions')) {
      if (method === 'POST') {
        const id = String(sessions.length + 1);
        sessions.push({ id, ...request.postDataJSON() });
        json = { id };
      } else if (method === 'PATCH') {
        if (rejectSessionUpdate) {
          rejectSessionUpdate = false;
          return route.fulfill({ status: 500, json: { message: 'Falha simulada' } });
        }
        Object.assign(sessions.find(row => 'eq.' + row.id === params.get('id'))!, request.postDataJSON());
      } else {
        json = sessions;
      }
    }
    if (pathname.endsWith('/rest/v1/flashcards')) {
      if (method === 'PATCH') {
        const patch = request.postDataJSON();
        updates.push(patch);
        Object.assign(cards.find(row => 'eq.' + row.id === params.get('id'))!, patch);
      } else {
        const rows = cards.filter(row => {
          if (params.has('content_id') && params.get('content_id') !== 'eq.' + row.content_id) return false;
          if (params.has('repetitions') && params.get('repetitions') !== 'eq.' + row.repetitions) return false;
          if (params.has('lapses') && params.get('lapses') !== 'eq.' + row.lapses) return false;
          if (params.get('last_reviewed') === 'is.null' && row.last_reviewed !== null) return false;
          if (params.has('or') && !(row.last_reviewed || row.repetitions > 0 || row.lapses > 0)) return false;
          const nextReview = params.get('next_review');
          if (nextReview?.startsWith('lte.')) return row.next_review <= nextReview.slice(4);
          if (nextReview?.startsWith('gt.')) return row.next_review > nextReview.slice(3);
          return true;
        });
        const order = params.get('order')?.split(',') ?? [];
        json = rows.sort((a, b) => {
          for (const expression of order) {
            const [field, direction] = expression.split('.');
            const key = field as keyof typeof a;
            const comparison = String(a[key]).localeCompare(String(b[key]), undefined, { numeric: true });
            if (comparison) return direction === 'desc' ? -comparison : comparison;
          }
          return 0;
        }).slice(0, params.has('limit') ? Number(params.get('limit')) : undefined);
      }
    }
    await route.fulfill({ json, headers: { 'access-control-allow-origin': '*' } });
  });
  return { updates, sessions, failNextSessionUpdate: () => { rejectSessionUpdate = true; } };
}

async function startTopic(page: Page) {
  await page.goto('/estudo?content=tema');
  await page.getByRole('button', { name: /iniciar revisão|começar questões|continuar questões/i }).first().click();
}

async function gradeGood(page: Page) {
  await page.getByRole('button', { name: /opção correta/i }).click();
  await page.getByRole('button', { name: /bom/i }).click();
}

test('retoma o tema pelos vencidos em ordem e depois os inéditos', async ({ page }) => {
  await mockStudy(page, [
    card('1', 'Inédita', { created_at: '2026-11-26T14:00:00.000Z' }),
    card('2', 'Vencida recente', { next_review: today, last_reviewed: yesterday, repetitions: 1 }),
    card('3', 'Vencida mais antiga', { last_reviewed: yesterday, repetitions: 1 }),
    card('4', 'Erro futuro', { next_review: tomorrow, last_reviewed: yesterday, lapses: 1 }),
    card('5', 'Legado futuro', { next_review: tomorrow, repetitions: 2 }),
    card('6', 'Outro tema', { content_id: 'outro', last_reviewed: yesterday }),
  ]);
  await startTopic(page);
  await expect(page.getByRole('heading', { name: 'Vencida mais antiga' })).toBeVisible();
  await gradeGood(page);
  await expect(page.getByRole('heading', { name: 'Vencida recente' })).toBeVisible();
  await page.clock.setFixedTime(new Date(tomorrow));
  await startTopic(page);
  await expect(page.getByRole('heading', { name: 'Vencida recente' })).toBeVisible();
  await gradeGood(page);
  await expect(page.getByRole('heading', { name: 'Erro futuro' })).toBeVisible();
  await gradeGood(page);
  await expect(page.getByRole('heading', { name: 'Legado futuro' })).toBeVisible();
  await gradeGood(page);
  await expect(page.getByRole('heading', { name: 'Inédita' })).toBeVisible();
});

test('tema em dia mostra a próxima revisão e treino opcional preserva o agendamento', async ({ page }) => {
  const { updates } = await mockStudy(page, [card('1', 'Questão agendada', { last_reviewed: today, next_review: tomorrow, repetitions: 1 })]);
  await startTopic(page);
  await expect(page.getByRole('heading', { name: /revisões em dia/i })).toBeVisible();
  await expect(page.getByText(/próxima revisão/i)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Questão agendada' })).toHaveCount(0);
  await page.getByRole('button', { name: /praticar agora/i }).click();
  await expect(page.getByRole('heading', { name: 'Questão agendada' })).toBeVisible();
  await gradeGood(page);
  await expect(page.getByRole('heading', { name: 'Questão agendada' })).toHaveCount(0);
  expect(updates).toEqual([]);
});

test('revisão diária limita a fila e mantém o erro futuro fora', async ({ page }) => {
  await mockStudy(page, [
    ...Array.from({ length: 38 }, (_, index) => card('d' + index, 'Vencida ' + index, { last_reviewed: yesterday, repetitions: 1 })),
    ...Array.from({ length: 6 }, (_, index) => card('n' + index, 'Inédita ' + index)),
    card('1', 'Erro futuro', { next_review: tomorrow, last_reviewed: yesterday, lapses: 1 }),
  ]);
  await page.goto('/estudo');
  await page.getByRole('button', { name: /iniciar revisão/i }).click();
  await expect(page.getByRole('heading', { name: 'Vencida 0' })).toBeVisible();
  await expect(page.getByText('1 / 40', { exact: true })).toBeVisible();
});

test('tema sem cartões apresenta uma mensagem própria', async ({ page }) => {
  await mockStudy(page, []);
  await startTopic(page);
  await expect(page.getByRole('heading', { name: /nenhum flashcard para este conteúdo/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /praticar agora/i })).toHaveCount(0);
});
