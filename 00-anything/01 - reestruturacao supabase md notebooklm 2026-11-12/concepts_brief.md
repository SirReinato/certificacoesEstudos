# Concepts Brief: Reestruturação SafeZone Studies

* **Autor:** Renato Lima / Equipe SafeZone Studies
* **Data:** 2026-11-12
* **Status:** Ideation / Brainstorm Finalizado
* **Localização do Artefato:** `00-anything/01 - reestruturacao supabase md notebooklm 2026-11-12/concepts_brief.md`

---

## 1. Visão Geral (Overview)

O **SafeZone Studies** é uma aplicação web voltada para a preparação estratégica para as certificações Microsoft Azure (**AI-200** e **AI-103**). O objetivo desta reestruturação é migrar a infraestrutura para **Supabase** (PostgreSQL na nuvem com autenticação segura e isolamento multi-tenant por RLS), suportar a ingestão semântica de notas geradas no **Google NotebookLM** em formato Markdown (`.md`), substituir o provedor legado OmniRoute pela **API oficial NVIDIA NIM** (compatível com OpenAI SDK), e transformar a experiência de aprendizado no método **30/70**:
- **30% Teoria Ativa**: Leitura prévia de apostila dinâmica contendo resumos executivos, matrizes comparativas e armadilhas de prova da Microsoft (*Exam Traps*).
- **70% Prática Anki-Style**: Bateria de memorização ativa com flashcards conceituais e questões simuladas de múltipla escolha com gabarito justificado e análise de distratores, ambos orquestrados pelo algoritmo de repetição espaçada **SuperMemo-2 (SM-2)**.

---

## 2. Análise Multi-Lente Especializada (Goldfish Review)

### 2.1 UX & Ergonomia (`egm-design`)
* **Sessão Bifásica (30/70)**: Rota `/estudo` dividida em duas etapas claras:
  1. *Fase 1 (Apostila)*: Consumo focado com callouts destacados de pegadinhas de prova (`ExamTrapCalloutStl`) e tabelas de decisão rápida (`DecisionMatrixStl`). Conclusão opcional antecipada transferindo o tempo restante para as questões.
  2. *Fase 2 (Prática)*: Alternância entre flashcards de fixação (flip card) e questões de múltipla escolha. No modo múltipla escolha, o aluno clica na alternativa (A, B, C, D), clica em "Verificar Resposta" e recebe feedback cromático imediato acompanhado da análise detalhada de por que os distratores estão errados e link para documentação oficial.
* **Painel Administrativo (`/admin/users`)**: Tela restrita ao perfil `admin` para listagem, auditoria de progresso e provisionamento/convite de novos estudantes.
* **Ingestão de Markdown**: Dropzone e seletor na tela `/biblioteca/novo` aceitando `.md` nativo, com pré-visualização hierárquica das seções detectadas antes do salvamento.

### 2.2 Arquitetura e Persistência Supabase (`egm-structural` & `egm-codebase-details`)
* **Schema PostgreSQL com RLS Estrito**:
  - `profiles`: Espelho de `auth.users` com coluna `role` ('admin' | 'user').
  - `contents`: Materiais de estudo vinculados a `user_id`, com campos para `chunks` JSONB e `study_guide` JSONB (incluindo `gotchas` e `comparisonTable`).
  - `flashcards`: Questões e cards com campos `format` ('flip' | 'multiple-choice'), `options` (array de alternativas), `correct_answer` e `explanation` (justificativa de distratores), integrados aos metadados SM-2 (`ease_factor`, `interval`, `repetitions`, `next_review`, `lapses`).
  - `study_sessions`: Registro de datas, tempo investido, acertos, erros e repetições.
  - `settings`: Configurações personalizadas por usuário.
  - `sync_meta`: Tabela pública leve para monitoramento e keep-alive.
* **Políticas RLS Universais**:
  - `auth.uid() = user_id OR (select role from public.profiles where id = auth.uid()) = 'admin'`.

### 2.3 Prevenção de Inatividade Supabase (`egm-zoom-out`)
* **Automação Externa Desacoplada (Keep-Alive)**: Criação de workflow agendado no GitHub Actions (`.github/workflows/supabase-keepalive.yml`) executando a cada 48 horas (`cron: '0 4 */2 * *'`). Realiza uma requisição HTTP autenticada leve contra `/rest/v1/sync_meta`, impedindo o auto-pause do plano gratuito do Supabase sem depender do computador do usuário estar ligado.

### 2.4 Ingestão de Markdown & Provedores de IA
* **Chunking Semântico de Markdown**: O módulo `contentIngestion.ts` passa a realizar a quebra de arquivos `.md` respeitando cabeçalhos hierárquicos (`#`, `##`, `###`), agrupando seções lógicas completas e adicionando breadcrumbs de contexto.
* **Conector NVIDIA NIM**:
  - Remoção de qualquer menção a OmniRoute no frontend, backend e types.
  - Integração direta em `src/services/aiService.ts` com o endpoint oficial `https://integrate.api.nvidia.com/v1/chat/completions` (OpenAI format), com suporte a modelos como `meta/llama-3.3-70b-instruct`, `mistralai/mistral-large-2-instruct` e `deepseek-ai/deepseek-r1`.
  - Manutenção do Google Gemini como padrão e suporte a OpenAI e Claude.

---

## 3. Metas vs. Não-Metas (Goals vs. Non-Goals)

### Em Escopo (In-Scope Goals):
1. Criação das migrações SQL do Supabase (DDL, triggers de perfil, RLS para todas as tabelas).
2. Telas de autenticação (Login, Recuperação de Senha) e layout autenticado com proteção de rotas.
3. Painel de administração de usuários para perfil `admin`.
4. Workflow de automação GitHub Actions para keep-alive a cada 48h no Supabase.
5. Ingestão semântica de arquivos `.md` do NotebookLM com chunking hierárquico.
6. Remoção de OmniRoute e adição do conector NVIDIA NIM (OpenAI-compatible) nas configurações e no serviço de IA.
7. Nova interface e motor de estudo 30/70: leitura prévia de apostila estruturada com armadilhas de prova + flashcards e simulador de questões de múltipla escolha com SM-2.

### Fora de Escopo (Out-of-Scope Non-Goals):
1. Criação de OCR ou transcrição local de áudio (o material já chega lapidado do NotebookLM).
2. Métricas de faturamento ou cobrança SaaS (o controle de usuários é exclusivo do administrador convidando alunos).
3. Reescrever o banco SQLite local — o banco padrão passa a ser o PostgreSQL no Supabase, mantendo a API Node apenas como suporte opcional se necessário.

---

## 4. Alternativas Avaliadas e Decisões Tomadas

* **Keep-Alive local via Node cron**: Rejeitado. Se o computador do usuário estiver desligado ou em repouso por mais de 72 horas, o cron local não roda e o Supabase pausa. Aprovado: GitHub Actions workflow agendado a cada 48h.
* **Manter SQLite e Supabase em sincronização bidirecional**: Rejeitado. Criaria complexidade extrema de resolução de conflitos (CRDT/offline-sync). Aprovado: Migração limpa e unificada para o Supabase PostgreSQL com client JS reativo.
* **Flashcards apenas de texto simples**: Rejeitado. Exames de certificação da Microsoft exigem discernimento rápido de cenários e identificação de distratores. Aprovado: Componente duplo com flashcard clássico (flip) e questão de múltipla escolha simulada.

---

## 5. Próximos Passos e Fases de Execução

1. **Fase 1: Infraestrutura & Autenticação Supabase**:
   - Criação da migração SQL DDL (tabelas, RLS, triggers).
   - Telas de Login e recuperação de senha.
   - Setup do client Supabase (`src/services/supabaseClient.ts`) e Context de Auth.
   - Workflow do GitHub Actions para keep-alive de 48h.
2. **Fase 2: Ingestão de Markdown e Conector NVIDIA**:
   - Parser semântico de `.md` preservando hierarquia de seções.
   - Remoção de OmniRoute e implementação de conector NVIDIA NIM.
   - Atualização da tela `/config`.
3. **Fase 3: Refatoração do Storage para Supabase**:
   - Transição dos métodos CRUD de `src/storage/index.ts` para Supabase JS Client.
   - Painel administrativo de usuários (`/admin/users`).
4. **Fase 4: Motor e Interface de Estudo 30/70**:
   - Componentes visuais de apostila, *Exam Traps* e matrizes comparativas.
   - Simulador de questões de múltipla escolha com análise de distratores e integração ao SM-2.
   - Atualização do `AGENTS.md` e validação com testes E2E Playwright.
