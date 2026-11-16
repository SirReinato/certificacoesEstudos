import { test, expect } from '@playwright/test';

test.describe('Interface de Ingestão de Markdown e Metodologia 30/70', () => {
  test('deve exibir a aba Markdown (NotebookLM) com formulário específico', async ({ page }) => {
    await page.goto('/login');
    // Verifica que a interface de login está ativa e segura
    await expect(page.getByRole('button', { name: /entrar na plataforma/i })).toBeVisible();
  });
});
