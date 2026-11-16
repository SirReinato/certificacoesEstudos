# Implementation Readiness Review Report: Reestruturação SafeZone Studies

* **Target Document:** `00-anything/01 - reestruturacao supabase md notebooklm 2026-11-12/reestruturacao_supabase_notebooklm_30_70.md` (Linhas 268–363)
* **Destino do Artefato:** `00-anything/01 - reestruturacao supabase md notebooklm 2026-11-12/implementation_readiness_report.md`
* **Contexto de Auditoria:** `AGENTS.md`
* **Padrão Aplicado:** `implementation-readiness-standard` (Tech Lead & Pedantic Auditor)

---

## Reviewer Status

| Reviewer | Status | Escopo Auditado |
| :--- | :--- | :--- |
| `egm-implementation-readiness` | completed | Clareza das instruções, acionabilidade sem decisões em aberto, determinismo |
| `egm-codebase-details` | completed | Compatibilidade com arquivos existentes, scripts `package.json`, dependências, TypeScript |
| `egm-style` | completed | Convenções de styled-components (sufixo `Stl`), regra Zero CSS, tom sóbrio |

---

## Resumo Executivo de Severidade

* 🔴 **Blockers (3 apontamentos críticos):**
  1. Omissão de `@playwright/test` nas dependências e scripts do `package.json`, inviabilizando o plano de verificação.
  2. Indefinição técnica e risco de segurança na criação de usuários em `/admin/users` (impossível no client-side sem expor a `service_role_key`).
  3. Arquitetura híbrida indefinida quanto ao destino do servidor local (`server/index.mjs`), uploads de PDF e script `npm run dev`.
* 🟡 **Majors (5 apontamentos técnicos):**
  1. Falta de especificação dos contratos TypeScript exatos para opções de múltipla escolha e seções de apostila em `src/types/index.ts`.
  2. Omissão do mecanismo de execução das migrações do Supabase (`supabase/migrations/20261112_init_schema.sql`).
  3. Indefinição da máquina de estados e integração com SM-2 na transição 30/70 em `useStudySession.ts`.
  4. Configuração incompleta de rotas e aninhamento de layout em `src/routes/AppRoutes.tsx` para `/login` vs `MainLayout`.
  5. Risco de bloqueio por CORS e ausência de configuração de proxy no Vite para chamadas diretas ao NVIDIA NIM.
* 🟢 **Nits (3 apontamentos de padronização):**
  1. Omissão da recomendação mandatória de nomenclatura com sufixo `Stl` para novos styled-components.
  2. Parâmetros, secrets e endpoint exato de ping do workflow GitHub Actions Keepalive indefinidos.
  3. Ausência de script no `package.json` para execução do script utilitário de migração SQLite.

---

## Prioritized Findings (Blockers -> Major -> Nits)

### 1. Omissão de `@playwright/test` nas Dependências e Scripts do `package.json` - Severity: Blocker
* **Reviewer Lens:** `egm-codebase-details` & `egm-implementation-readiness`
* **Affected Scope:** Linhas 297, 328–329, 356–360
* **Discrepancy Description:** A Seção 3 (*Verification Plan*) estabelece a execução de testes funcionais E2E com Playwright para 3 fluxos críticos. Contudo, `@playwright/test` não consta nas `devDependencies` do `package.json`, e não existe script de teste configurado.
* **Recomendação:** Incluir no `package.json` a instalação de `@playwright/test`, o script `"test:e2e": "playwright test"` e adicionar `playwright.config.ts` à lista de arquivos a criar.

---

### 2. Indefinição Técnica e Risco de Segurança na Criação de Usuários em `/admin/users` - Severity: Blocker
* **Reviewer Lens:** `egm-implementation-readiness`
* **Affected Scope:** Linhas 278, 290, 312–313
* **Discrepancy Description:** A criação de usuários por terceiros exige privilégios de `service_role`, o que é impossível diretamente no client SPA sem vazar a chave mestra.
* **Recomendação:** Acolher a diretriz do Stage 8: remover o painel customizado `/admin/users`, gerenciando novos usuários e convites diretamente pelo console web do Supabase (Authentication > Users), mantendo o RLS simples e o código do frontend 100% seguro.

---

### 3. Arquitetura Híbrida Indefinida para o Servidor Node (`server/index.mjs`) e Upload de PDFs - Severity: Blocker
* **Reviewer Lens:** `egm-codebase-details` & `egm-implementation-readiness`
* **Affected Scope:** Linhas 272–279, 288–292, 334–335
* **Discrepancy Description:** O plano migra dados para o Supabase, mas não detalha se `server/index.mjs` é descontinuado e como arquivos de PDF em `data/uploads/` são tratados.
* **Recomendação:** Definir que o SafeZone Studies se torna uma SPA pura com Vite (`npm run dev` rodando apenas `vite`), descontinuando `server/index.mjs` e migrando o armazenamento de arquivos binários para o Supabase Storage (bucket `study-assets`).

---

### 4. Falta de Especificação dos Contratos TypeScript em `src/types/index.ts` - Severity: Major
* **Reviewer Lens:** `egm-codebase-details`
* **Affected Scope:** Linhas 282–283, 330–332
* **Discrepancy Description:** O plano menciona genericamente adições de campos sem fornecer as interfaces literais.
* **Recomendação:** Incluir no plano os contratos tipados exatos:
  ```typescript
  export type UserRole = 'admin' | 'user';
  export interface Profile { id: string; email: string; role: UserRole; full_name?: string; }
  export interface MultipleChoiceOption { id: string; text: string; rationale: string; isCorrect: boolean; }
  export interface Flashcard {
    id: string; contentId: string; format: 'flip' | 'multiple-choice';
    front: string; back: string; explanation?: string; options?: MultipleChoiceOption[];
    interval: number; repetition: number; easeFactor: number; nextReview: string;
  }
  export interface StudyGuideSection {
    title: string; content: string; gotchas?: string[];
    comparisonTable?: { headers: string[]; rows: string[][] };
  }
  ```

---

### 5. Omissão do Mecanismo de Execução de Migrações do Supabase - Severity: Major
* **Reviewer Lens:** `egm-implementation-readiness` & `egm-codebase-details`
* **Affected Scope:** Linhas 274, 304–305
* **Discrepancy Description:** Não há indicação de como o DDL `supabase/migrations/20261112_init_schema.sql` será aplicado.
* **Recomendação:** Documentar a execução direta via Supabase Dashboard SQL Editor durante o setup inicial ou via `npx supabase db push`.

---

### 6. Indefinição da Máquina de Estados e Integração SM-2 na Transição 30/70 - Severity: Major
* **Reviewer Lens:** `egm-implementation-readiness`
* **Affected Scope:** Linhas 293–296, 336–337
* **Discrepancy Description:** Falta explicitar os estados de `useStudySession.ts` (`currentPhase: 'reading' | 'practice' | 'finished'`) e o fluxo de notas SM-2 nas questões de múltipla escolha.
* **Recomendação:** Documentar que a Fase 1 termina por clique explícito em "Pronto para Praticar". No `MultipleChoiceCard`, resposta errada atribui nota `again` (1) e reinsere o item no fim da fila; resposta correta libera autoavaliação entre `hard` (2), `good` (3) e `easy` (4).

---

### 7. Configuração Incompleta de Rotas e Layout em `src/routes/AppRoutes.tsx` - Severity: Major
* **Reviewer Lens:** `egm-codebase-details` & `egm-style`
* **Affected Scope:** Linhas 278, 338–339
* **Discrepancy Description:** A tela `/login` não pode ficar dentro do `<Route element={<MainLayout />}>` para não herdar Sidebar e Header.
* **Recomendação:** Especificar a divisão entre rotas públicas e rotas autenticadas:
  ```tsx
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
      <Route path="/" element={<Dashboard />} />
      <Route path="/biblioteca" element={<Biblioteca />} />
      <Route path="/biblioteca/novo" element={<NovoConteudo />} />
      <Route path="/estudo" element={<EstudoDiario />} />
      <Route path="/config" element={<Configuracoes />} />
      <Route path="/atividade" element={<Atividade />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
  ```

---

### 8. Risco de Bloqueio por CORS e Ausência de Proxy para NVIDIA NIM API - Severity: Major
* **Reviewer Lens:** `egm-codebase-details` & `egm-implementation-readiness`
* **Affected Scope:** Linhas 283–284, 332–333
* **Discrepancy Description:** Chamadas diretas do browser para a API da NVIDIA podem ser bloqueadas por CORS preflight.
* **Recomendação:** Adicionar `vite.config.ts` à lista de arquivos a modificar para incluir o proxy reverso `/api/nvidia` apontando para `https://integrate.api.nvidia.com`.

---

### 9. Convenção Mandatória de Nomenclatura com Sufixo `Stl` - Severity: Nit
* **Reviewer Lens:** `egm-style`
* **Affected Scope:** Linhas 277, 294, 310–321
* **Discrepancy Description:** O `AGENTS.md` exige o sufixo `Stl` para novos styled-components e proíbe CSS cru.
* **Recomendação:** Incluir lembrete de que componentes estilizados novos devem utilizar o sufixo `Stl` (ex: `CalloutContainerStl`, `OptionButtonStl`, `LoginCardStl`).

---

### 10. Secrets e Sintaxe no Workflow Keepalive - Severity: Nit
* **Reviewer Lens:** `egm-codebase-details`
* **Affected Scope:** Linhas 279, 322–323
* **Recomendação:** Especificar no plano as secrets `SUPABASE_URL` e `SUPABASE_ANON_KEY` para o job de ping a cada 48h.

---

### 11. Script no `package.json` para Migração SQLite - Severity: Nit
* **Reviewer Lens:** `egm-codebase-details` & `egm-style`
* **Affected Scope:** Linhas 291, 324–325, 328–329
* **Recomendação:** Adicionar o script `"db:migrate-sqlite": "node scripts/migrate-sqlite-to-supabase.mjs"` no `package.json`.
