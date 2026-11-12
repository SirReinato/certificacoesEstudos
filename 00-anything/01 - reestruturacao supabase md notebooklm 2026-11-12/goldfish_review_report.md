# Goldfish Annotated Review Report

**Target:** `00-anything/01 - reestruturacao supabase md notebooklm 2026-11-12/reestruturacao_supabase_notebooklm_30_70.md` (`full file`)  
**Context:** `AGENTS.md`  
**Destino do Artefato:** `00-anything/01 - reestruturacao supabase md notebooklm 2026-11-12/goldfish_review_report.md`  
**Status:** resolved (All PROPOSE FIX items accepted and verified in target document)  

---

## Prioritized Findings & AI Suggestions

### Issue 1: Criação Client-Side de Alunos por Admin Inviável sem Vazamento de `service_role` [`egm-design`] - Severity: Blocker
* **Affected Scope:** Linhas 36, 66–70 (CUJ 3), 123
* **Discrepancy Description:** O objetivo G2 e o CUJ 3 determinavam a criação ou convite de novos estudantes via SPA no frontend em `/admin/users`. O client Supabase com chave anônima não permite criar contas de terceiros sem a `service_role_key`, cuja exposição no browser comprometeria toda a segurança.
* **Rationale:** Expor a `service_role_key` no bundle client-side viola as diretrizes mandatórias de segurança. Criar uma infraestrutura de Edge Functions para isso adiciona complexidade acidental (YAGNI).
* ***AI Suggestion:*** PROPOSE FIX
* ***Justification:*** Acolher a recomendação minimalista dos estágios 8 e 9: remover o painel customizado `/admin/users` do escopo do frontend. O administrador gerencia convites e acessos diretamente através do console web nativo do Supabase (Authentication > Users), mantendo o código do app focado exclusivamente no estudante e nas sessões de estudo.
* ***Proposed Edit:***
  * Location: Goals (G2), Non-Goals (NG3), CUJs e Detailed Implementation Plan.
  * Change: Substituir o objetivo G2 por "Gestão Enxuta de Usuários via Console Supabase" e incluir NG3 "Sem painel customizado de IAM no frontend".

---

### Issue 2: Recursão Infinita em Políticas RLS e Escalonamento de Privilégio em `public.profiles` [`egm-design` & `egm-structural`] - Severity: Blocker
* **Affected Scope:** Linhas 120–125, 156–166
* **Discrepancy Description:** A checagem `(select role from public.profiles where id = auth.uid()) = 'admin'` dentro das policies de RLS causa recursão infinita se `profiles` tiver RLS ativo. Além disso, sem bloqueio de UPDATE na coluna `role`, qualquer usuário poderia alterar seu próprio papel para `admin`.
* **Rationale:** Erro de recursão no PostgreSQL aborta transações e quebra o acesso aos dados.
* ***AI Suggestion:*** PROPOSE FIX
* ***Justification:*** Com a simplificação do acesso, remove-se a coluna `role` e o conceito de admin no banco da aplicação. O RLS passa a ser estritamente baseado no proprietário do dado: `auth.uid() = user_id`. Isso anula a recursão e o risco de escalonamento pela raiz.
* ***Proposed Edit:***
  * Location: Seção 2.1 (DDL do PostgreSQL).
  * Change: Remover `role` de `public.profiles` e simplificar as políticas para `using (auth.uid() = user_id)`.

---

### Issue 3: Desativação Silenciosa do GitHub Actions aos 60 Dias Ameaça Uptime do Supabase [`egm-design`] - Severity: Blocker
* **Affected Scope:** Linhas 37, 209–231
* **Discrepancy Description:** O workflow agendado por cron no GitHub Actions é desativado automaticamente após 60 dias sem commits no repositório, o que faria o Supabase pausar sem aviso prévio.
* **Rationale:** O plano gratuito do Supabase pausa instâncias sem atividade após 72 horas.
* ***AI Suggestion:*** PROPOSE FIX
* ***Justification:*** Manter o workflow do GitHub Actions (`.github/workflows/supabase-keepalive.yml`) rodando a cada 48h, remover a tabela artificial `sync_meta` com brecha de segurança pública, e documentar no `README.md` a recomendação de configurar um monitor HTTP externo gratuito (UptimeRobot ou Cron-Job.org) como redundância após 60 dias de estabilidade sem commits.
* ***Proposed Edit:***
  * Location: Seção 6 e Workflow YAML.
  * Change: O ping consulta a rota REST padrão `/rest/v1/` com chave anônima, sem criar tabelas fictícias no banco.

---

### Issue 4: Mapeamento Incorreto da Escala SM-2 e Viés de Sorte em Questões de Múltipla Escolha [`egm-design`] - Severity: Blocker
* **Affected Scope:** Linhas 206–208
* **Discrepancy Description:** O design original mapeou a nota `good` como 4, quando a convenção de `src/utils/sm2.ts` é `1 = again`, `2 = hard`, `3 = good`, `4 = easy`. Além disso, atribuir avanço automático no acerto de múltipla escolha inflaciona o fator de facilidade para chutes acidentais.
* **Rationale:** Preservar a consistência matemática do algoritmo SuperMemo-2 e a eficácia pedagógica.
* ***AI Suggestion:*** PROPOSE FIX
* ***Justification:*** Corrigir a equivalência nominal para a escala 1 a 4. Em caso de acerto na múltipla escolha, o aluno escolhe se foi com domínio (*Good: 3* / *Easy: 4*) ou com incerteza (*Hard: 2*). Em caso de erro, o sistema atribui automaticamente *Again: 1*.
* ***Proposed Edit:***
  * Location: Seção 5 (Motor de Estudo 30/70).
  * Change: Atualizar a regra de transição do `MultipleChoiceCard` e a descrição da escala SM-2.

---

### Issue 5: Omissão de `@playwright/test` nas Dependências e Scripts do `package.json` [`egm-implementation-readiness`] - Severity: Blocker
* **Affected Scope:** Linhas 297, 328–329, 356–360
* **Discrepancy Description:** O plano exigia testes E2E com Playwright no *Verification Plan*, mas `@playwright/test` não constava no `package.json` nem havia arquivo `playwright.config.ts`.
* **Rationale:** O implementador ficaria bloqueado ao tentar rodar `npm run test:e2e`.
* ***AI Suggestion:*** PROPOSE FIX
* ***Justification:*** Incluir `@playwright/test` nas `devDependencies`, adicionar o script `"test:e2e": "playwright test"` e incluir `playwright.config.ts` na lista de arquivos a criar.
* ***Proposed Edit:***
  * Location: Detailed Implementation Plan (Fase 1 e Target Files).
  * Change: Adicionar `@playwright/test` e `playwright.config.ts`.

---

### Issue 6: Risco de Bloqueio por CORS com Endpoint NVIDIA NIM no Browser [`egm-design`] - Severity: Major
* **Affected Scope:** Linhas 79–86, 182–186
* **Discrepancy Description:** Requisições `fetch` diretas do navegador para `https://integrate.api.nvidia.com` podem ser barradas por CORS preflight `OPTIONS`.
* **Rationale:** Bloqueios de CORS impedem a geração de apostilas no frontend.
* ***AI Suggestion:*** PROPOSE FIX
* ***Justification:*** O Google Gemini permanece como provedor nativo no browser (com suporte pleno a CORS). Para chamadas à NVIDIA NIM, adicionar um proxy reverso no `vite.config.ts` (`/api/nvidia` -> `https://integrate.api.nvidia.com`).
* ***Proposed Edit:</a>***
  * Location: Seção 4 e Detailed Implementation Plan.
  * Change: Adicionar alteração do `vite.config.ts` com proxy reverso `/api/nvidia`.

---

### Issue 7: Violação de Regra de Negócio em `flashcards.kind = 'theory'` e Omissão em `study_sessions` [`egm-structural`] - Severity: Major
* **Affected Scope:** Linhas 141–149
* **Discrepancy Description:** `flashcards.kind` aceitava `'theory'`, violando a Regra 5 do `AGENTS.md` (teoria é exclusivamente apostila `studyGuide`, flashcards são exclusivamente questões). Além disso, `study_sessions` omitia `content_id` e a unidade de tempo.
* **Rationale:** Alinhamento estrito com os princípios de domínio do projeto.
* ***AI Suggestion:*** PROPOSE FIX
* ***Justification:*** Restringir `flashcards.kind` exclusivamente a `'question'`. Adicionar `content_id uuid references public.contents(id)` e `time_spent_seconds` na tabela `study_sessions`.
* ***Proposed Edit:***
  * Location: Seção 2.1 (DDL do PostgreSQL) e tipos TypeScript.
  * Change: Restringir `kind` para `check (kind = 'question')`, adicionar `content_id` e `time_spent_seconds`.

---

### Issue 8: Fragmentação no Chunker de Markdown e Ausência de Tokenizador [`egm-codebase-details`] - Severity: Major
* **Affected Scope:** Linhas 171–176, 314–315
* **Discrepancy Description:** Criação de arquivo isolado `markdownParser.ts` fragmentando `contentIngestion.ts`, e falta de especificação do algoritmo de contagem de tokens.
* **Rationale:** Evitar dependências pesadas como `tiktoken` e reutilizar o pipeline consolidado de ingestão.
* ***AI Suggestion:*** PROPOSE FIX
* ***Justification:*** Implementar `chunkMarkdownByHeadings` diretamente em `src/services/contentIngestion.ts`, utilizando a heurística leve de `Math.ceil(length / 4)` já validada no projeto, com fallback para parágrafos duplos caso não haja cabeçalhos.
* ***Proposed Edit:***
  * Location: Seção 3 e Detailed Implementation Plan.
  * Change: Remover `markdownParser.ts` da lista de arquivos a criar; adicionar a função em `src/services/contentIngestion.ts`.

---

### Issue 9: Omissão de Contratos TypeScript e Estados de Sessão [`egm-codebase-details`] - Severity: Major
* **Affected Scope:** Linhas 282–283, 330–332
* **Discrepancy Description:** Contratos TypeScript incompletos para `MultipleChoiceOption`, `gotchas` e máquina de estados da sessão de estudo.
* **Rationale:** Garantir que o implementador não tome decisões improvisadas de tipos.
* ***AI Suggestion:*** PROPOSE FIX
* ***Justification:*** Explicitar as interfaces completas em `src/types/index.ts` e a máquina de estados `currentPhase: 'reading' | 'practice' | 'finished'` em `useStudySession.ts`.
* ***Proposed Edit:***
  * Location: Seção 2 (Contratos TypeScript) do Implementation Plan.
  * Change: Inserir bloco de tipos literal e formal.

---

### Issue 10: Nomenclatura com Sufixo `Stl` e Estilo Zero CSS [`egm-style`] - Severity: Nit
* **Affected Scope:** Linhas 277, 310–321
* **Discrepancy Description:** Lembrete de convenção de styled-components conforme `AGENTS.md`.
* ***AI Suggestion:*** PROPOSE FIX
* ***Justification:*** Adicionar instrução explícita de que todos os novos componentes de estilo devem terminar com `Stl` (`ExamTrapCalloutStl`, `DecisionMatrixStl`, etc.) e consumir tokens de `src/theme/`.
* ***Proposed Edit:***
  * Location: Target Files to Create.
  * Change: Inserir nota de conformidade de styled-components.
