import { test, expect } from '@playwright/test';

test.describe('Fluxo de Autenticação e Rotas Protegidas', () => {
  test('deve redirecionar usuário não autenticado para /login ao tentar acessar rotas privadas', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/.*\/login/);
    await expect(page.locator('h1')).toContainText('SafeZone Studies');
    await expect(page.getByRole('button', { name: /entrar/i })).toBeVisible();
  });

  test('deve alternar entre abas de Login e Cadastro', async ({ page }) => {
    await page.goto('/login');
    const tabCadastro = page.getByRole('tab', { name: /criar conta/i });
    await tabCadastro.click();
    await expect(page.getByRole('button', { name: /cadastrar/i })).toBeVisible();

    const tabLogin = page.getByRole('tab', { name: /entrar/i });
    await tabLogin.click();
    await expect(page.getByRole('button', { name: /entrar na plataforma/i })).toBeVisible();
  });
});
