# AGENTS.md — Diretrizes para IA e Agentes Autônomos (SafeZone Studies)

> **🤖 LEIA ISTO PRIMEIRO.** Este arquivo é a fonte da verdade absoluta e o ponto de entrada único e obrigatório para qualquer modelo de IA ou agente autônomo (Cursor, Claude, Gemini, Copilot, Codex, ChatGPT etc.) que for analisar, criar ou modificar código neste projeto.
>
> Ele documenta a arquitetura, convenções, stack técnica, regras de negócio, contratos de API, persistência, estrutura de pastas, regras operacionais, testes e segurança. Leia-o **integralmente** antes de inspecionar ou alterar qualquer arquivo.

---

## ⚠️ REGRAS OBRIGATÓRIAS (ARQUIVO, GIT, GESTÃO & ESTRUTURAÇÃO)

### 1. Toda alteração estrutural DEVE atualizar este `AGENTS.md` no mesmo commit/tarefa

Considera-se "alteração estrutural" qualquer uma das seguintes ações (lista não exaustiva):

* Criar, renomear, mover ou remover arquivos e pastas em `src/`, `server/`, `data/`, `public/` ou na raiz.
* Criar, modificar ou remover **páginas, rotas, componentes, hooks, services, storage, contratos em `src/types/` ou testes**.
* Adicionar, atualizar ou remover **dependências** ou scripts no `package.json`.
* Adicionar ou alterar **variáveis de ambiente** ou configurações do servidor (`server/index.mjs`) e Vite (`vite.config.ts`).
* Implementar ou alterar **regras de negócio** (ex: repetição espaçada SM-2, parsing de IA, ingestão de PDFs/links, migrações de schema SQLite).
* Adotar novas convenções de arquitetura, padrões de estilo, bibliotecas, regras de segurança ou fluxos de build.

**Como atualizar este arquivo após uma alteração estrutural:**
1. Atualize a seção correspondente neste documento (árvore de pastas, rotas, stack, modelos de dados, etc.).
2. Registre uma nova entrada na tabela de [Histórico de alterações deste arquivo](#-histórico-de-alterações-deste-arquivo) contendo data (`YYYY-MM-DD`) e resumo conciso do que mudou.
3. Se a alteração afetar a experiência direta do usuário ou a configuração do projeto, atualize também o `README.md`.

> ⛔ **Atenção:** Se uma IA finalizar uma tarefa estrutural sem atualizar este arquivo e seu histórico de alterações, **a tarefa é considerada incompleta e inválida**.

---

### 2. Fluxo obrigatório de Git: Nova Feature/Fix Branch + Push ao GitHub

Para garantir rastreabilidade, isolamento de escopo e facilidade em code reviews e auditorias:

* **NUNCA desenvolva ou commite diretamente na branch `main` (ou `master`) no dia a dia**.
* Toda nova implementação, melhoria, refatoração ou correção DEVE ser desenvolvida em uma branch dedicada:
  ```bash
  git checkout -b feature/nome-da-funcionalidade   # Para novas funcionalidades
  git checkout -b fix/nome-da-correcao            # Para correção de bugs
  git checkout -b refactor/nome-do-ajuste         # Para refatorações estruturais
  git checkout -b docs/nome-da-documentacao       # Para ajustes de documentação
  ```
* **Commits atômicos, granulares e semânticos (Conventional Commits)**:
  * Nunca crie commits genéricos ou vagos (como `"wip"`, `"update"`, `"ajustes"`, `"fix"`).
  * Use o padrão semântico: `feat:`, `fix:`, `refactor:`, `style:`, `docs:`, `chore:`, `test:`, `sec:`.
  * Descreva com clareza o escopo da alteração no título e, sempre que aplicável, inclua no corpo o *o quê* e o *porquê* da mudança.
* **Push obrigatório ao repositório remoto ao concluir**:
  ```bash
  git push -u origin <nome-da-branch>
  ```
  Isso viabiliza a criação imediata de Pull Requests e acompanhamento de versão.

---

### 3. Gestão e Decomposição de Demandas em Issues (Linear / MCP & Modo Copiável)

Sempre que uma nova atualização, funcionalidade ou refatoração for solicitada, o agente DEVE organizar o plano de execução em etapas antes ou durante o desenvolvimento:

1. **Decomposição em Etapas Lógicas e Funcionais**:
   * Divida a solicitação em issues granulares, sequenciais e independentes (ex: *Fase 1: Configuração do Serviço/API*, *Fase 2: Criação do Hook/Estado*, *Fase 3: Interface e Componentes*, *Fase 4: Rota e Validação Funcional E2E*).
   * Cada issue deve ser autossuficiente e conter:
     - **Título claro e semântico** (ex: `feat(estudo): aprimorar suporte a leitura prévia de apostilas`).
     - **Objetivo funcional**: o que essa etapa entrega e por que é necessária.
     - **Passo a passo técnico**: arquivos exatos a criar/alterar e bibliotecas envolvidas.
     - **Critérios de aceitação (DoD)**: como validar que a etapa foi concluída com sucesso.

2. **Criação de Issues com Linear MCP Ativo**:
   * Se o ambiente possuir a integração do **Linear via MCP** habilitada, o agente deve criar e registrar essas issues no projeto/time correspondente do Linear, associando labels e prioridades.

3. **Formato Copiável para Agentes Sem Linear MCP**:
   * Em todas as respostas ou documentações de planejamento, forneça também um bloco claro com o conteúdo exato da **atividade do momento** e das etapas seguintes.
   * Esse bloco deve ser estruturado de forma que o desenvolvedor possa simplesmente **copiar e colar o texto em outro agente ou modelo de IA que não tenha o Linear MCP ativo**, entendendo perfeitamente o contexto, restrições e código esperado sem instruções adicionais.

4. **Replanejamento e Adaptação Dinâmica**:
   * Se durante o desenvolvimento surgirem novos requisitos ou bloqueios técnicos, o agente DEVE **atualizar imediatamente as issues e etapas futuras**.

---

### 4. Proibição de Arquivos Markdown, Relatórios EGM e Testes na Raiz (`00-anything/`)

* **PROIBIDO** gerar, salvar ou descarregar arquivos de rascunho, drafts, specs temporárias, testes avulsos, relatórios de auditoria/crítica/síntese de agentes EGM (`critic_report.md`, `goldfish_review_report.md`, `implementation_readiness_report.md`, `intermediate_zoom_out_report.md`, `concepts_brief.md`, `design_draft.md` etc.) ou anotações na raiz do repositório.
* A raiz do repositório deve conter **exclusivamente** os arquivos de governança e configuração estruturais (`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `README.md`, `package.json`, `vite.config.ts`, `tsconfig.json`, `.oxlintrc.json` e dotfiles essenciais).
* **Diretório Obrigatório (`00-anything/`)**: Todos os arquivos de ideação, design, reviews de EGM, relatórios de subagentes, artefatos de testes ou documentações exploratórias DEVEM ser alocados dentro do diretório `00-anything/` na raiz do projeto.
* **Padrão Obrigatório de Subpastas por Implementação**:
  ```text
  00-anything/{sequencial_2_digitos} - {nome-da-implementacao} {data-yyyy-mm-dd}/
  ```
  * Exemplo 1: `00-anything/01 - estudo guiado apostilas 2026-11-12/`
  * Exemplo 2: `00-anything/02 - otimizacao extracao pdf 2026-11-15/`
* **Isolamento Total do Escopo**: Todos os arquivos auxiliares produzidos por essa tarefa devem ser salvos exclusivamente dentro dessa subpasta correspondente.
* **Numeração Sequencial Contínua**: Verifique as subpastas já existentes em `00-anything/` e incremente o numeral sequencial de 2 dígitos (`01`, `02`, `03`...) em ordem cronológica crescente.

---

### 5. Regra de Fidelidade e Alinhamento com a Regra de Negócio (Anti-Alucinação)

Ao atuar no projeto **SafeZone Studies**:

* **NUNCA deduza ou altere o nicho do projeto de forma arbitrária**. Este projeto é especificamente um preparatório e gestor de estudos para certificações Microsoft Azure (**AI-200** e **AI-103**), com ingestão de conteúdos, geração de apostilas estruturadas e flashcards com repetição espaçada.
* **Respeite a arquitetura e fluxos existentes**:
  - A persistência oficial do projeto é em **Supabase BaaS (PostgreSQL + RLS + Supabase Auth por e-mail/senha)**.
  - Arquivos e apostilas são armazenados no Supabase Storage (bucket `study-assets`) com isolamento estrito via políticas `auth.uid() = user_id`.
  - Ingestão de notas Markdown (`.md`) do Google NotebookLM particionadas por tópicos e cabeçalhos (`#`, `##`, `###`).
  - Provedor de IA com Google Gemini (padrão) e conector para NVIDIA NIM (Llama 3.3 70B), sem dependência do legado OmniRoute.
  - O fluxo de estudo adota a **metodologia 30/70**: aproximadamente **30% leitura de apostila com armadilhas Microsoft e tabelas comparativas**, e **70% questões práticas em flashcards e múltipla escolha**, utilizando o algoritmo **SM-2** na escala nominal de 1 a 4.

---

### 6. Mapeamento de Arquitetura e Dependências (`madge` e `graphify`)

* **Mapeamento Contínuo**: O projeto conta com scripts de análise estática de dependências via `madge` e compatibilidade com `graphify` para manter a arquitetura visualizada e livre de ciclos.
* **Scripts no `package.json`**:
  - `npm run graph:generate`: Mapeia dependências completas do diretório `src/`.
  - `npm run graph:circular`: Identifica eventuais dependências circulares em `src/` (essencial para evitar problemas de HMR e travamentos).
  - `npm run graph:deps`: Resumo das dependências de `src/`.
* **Regra de Atualização e Higiene**:
  - Arquivos e pastas de saída como `graphify-out/` constam no `.gitignore` para evitar poluição do repositório.
  - Sempre que novos módulos estruturais forem criados em `src/`, valide a ausência de dependências circulares com `npm run graph:circular`.

---

## 1. Visão geral

**SafeZone Studies** é uma aplicação web completa voltada para a organização de materiais de estudo e preparação acelerada para exames de certificação Microsoft Azure (**AI-200** e **AI-103**).

* **Objetivo do projeto:** Permitir a importação ágil de notas estruturadas do Google NotebookLM (arquivos Markdown `.md`), PDFs, links ou textos, particionamento inteligente por cabeçalhos e tópicos, geração automatizada de apostilas teóricas (30%) com armadilhas de exame da Microsoft e matrizes comparativas de SKUs, e questões práticas (70%) em formato Anki e múltipla escolha via IA, além de sessões de estudo baseadas em repetição espaçada (SM-2) com isolamento multiusuário.
* **Público-alvo:** Estudantes, engenheiros e profissionais de tecnologia em preparação para certificações Microsoft Azure AI.
* **Modelo Arquitetural:** Single Page Application (SPA) reativa em React 19 servida pelo Vite 8, integrada diretamente ao Supabase BaaS (PostgreSQL com Row Level Security, Supabase Auth por e-mail/senha, Supabase Storage no bucket `study-assets`), com suporte a PWA (`vite-plugin-pwa`) para cache estático e offline.

---

## 2. Stack técnica

| Camada | Tecnologia | Observações |
| :--- | :--- | :--- |
| **Build & Dev Tool** | **Vite 8** | Servidor de desenvolvimento rápido, ESM nativo, proxy reverso `/api/nvidia` → `https://integrate.api.nvidia.com` |
| **Linguagem** | **TypeScript ~6.0 / JavaScript** | Tipagem estrita em contratos (`src/types/index.ts`) e ESM |
| **UI Framework** | **React 19** | Componentes funcionais, hooks nativos e React DOM |
| **Roteamento** | **React Router 7 (`react-router-dom`)** | Roteamento declarativo com `BrowserRouter`, rotas públicas (`/login`), rotas protegidas (`ProtectedRoute`) e `<MainLayout />` |
| **Estilização** | **styled-components v6** | **REGRA ESTRITA: ZERO CSS DENTRO DE `src/`**. Proibido importar `.css`, `.scss` em `src/`. Todo o reset, tokens e componentes visuais derivam do Design System centralizado em `src/theme/`. |
| **Nomenclatura de Estilos** | **Sufixo `Stl` Recomendado em novos componentes** | Componentes criados com styled-components devem preferencialmente adotar o sufixo `Stl` (ex: `MultipleChoiceCardStl`, `ExamTrapCalloutStl`, `DecisionMatrixStl`) para clareza visual. |
| **BaaS & Autenticação** | **Supabase (`@supabase/supabase-js`)** | Autenticação por e-mail e senha, JWT, perfis em `profiles` e isolamento estrito via RLS (`auth.uid() = user_id`) |
| **Persistência de Dados** | **PostgreSQL no Supabase** | Tabelas estruturadas (`profiles`, `contents`, `flashcards`, `study_sessions`, `settings`) com migração DDL em `supabase/migrations/` |
| **Armazenamento de Arquivos** | **Supabase Storage (`study-assets`)** | Upload de apostilas e PDFs originais em bucket privado com acesso controlado por usuário |
| **Keep-Alive BaaS** | **GitHub Actions (`supabase-keepalive.yml`)** | Disparo de ping a cada 48h para evitar a pausa de 72h no Supabase free tier |
| **Extração de Conteúdo** | **Markdown Parser, PDF.js (`pdfjs-dist`), Readability, Cheerio** | Ingestão e chunking semântico de `.md` do NotebookLM por títulos (`#`, `##`, `###`), PDFs e páginas web |
| **IA & LLMs** | **Multi-Provider (Gemini + NVIDIA NIM)** | Google Gemini (padrão via API oficial) e conector OpenAI-compatible para NVIDIA NIM (`meta/llama-3.3-70b-instruct`). Suporte a OpenAI, Anthropic, Azure OpenAI e Ollama local. |
| **Algoritmo de Aprendizado** | **SM-2 (SuperMemo 2)** | Cálculo de repetição espaçada em `src/utils/sm2.ts` com 4 notas (`again`, `hard`, `good`, `easy`) |
| **Qualidade & Linting** | **Oxlint (`oxlint`)** | Linter ultrarrápido configurado em `.oxlintrc.json` |
| **Análise de Grafo** | **Madge / graphify** | Detecção de ciclos e visualização de dependências |
| **Testes Funcionais / E2E** | **Playwright (`@playwright/test`)** | Suíte de testes funcionais E2E com Chromium headless integrado |

---

## 3. Comandos principais

| Comando | Descrição |
| :--- | :--- |
| `npm install` | Instala todas as dependências do projeto |
| `npm run dev` | Inicia o servidor frontend Vite da aplicação (porta 5173) |
| `npm run build` | Compila o TypeScript (`tsc -b`) e gera o bundle de produção via Vite em `dist/` |
| `npm run preview` | Executa um servidor local servindo a pasta de produção `dist/` na porta 4173 |
| `npm run lint` | Executa a verificação estática de código com Oxlint |
| `npm run test:e2e` | Executa a suíte de testes funcionais E2E com Playwright em modo headless |
| `npm run db:migrate-sqlite`| Executa a migração de dados do SQLite local legado (`data/safezone.db`) para o Supabase |
| `npm run graph:generate` | Gera o relatório de dependências de `src/` via Madge |
| `npm run graph:circular` | Varre `src/` em busca de dependências circulares |
| `npm run graph:deps` | Exibe o resumo quantitativo de dependências de `src/` |

### 3.1 Orquestração Dev Unificada (`npm run dev`)

O comando `npm run dev` gerencia a inicialização paralela da API backend e do servidor frontend do Vite:
* O backend roda em `http://localhost:3001`.
* O frontend Vite roda em `http://localhost:5173`.
* O Vite realiza o proxy transparente de qualquer chamada `/api/*` diretamente para a porta `3001`, eliminando problemas de CORS durante o desenvolvimento.

---

## 4. Variáveis de ambiente e configuração

* **Ambiente do Servidor Node**:
  - `PORT`: Porta de execução da API (padrão: `3001`).
  - `DB_PATH`: Caminho do arquivo SQLite (padrão: `data/safezone.db`). Se alterado, a pasta de uploads de PDF será alocada adjacente a esse caminho.
* **Ambiente Client-Side (Vite)**:
  - Quaisquer variáveis expostas ao frontend devem utilizar o prefixo `VITE_`.
* **Chaves de IA**:
  - Chaves de API (Gemini, OpenAI, Anthropic, Azure OpenAI, Ollama, OmniRoute) são configuradas pelo próprio usuário na tela `/config` da interface e persistidas com segurança na tabela `settings` do SQLite local.
  - **NUNCA** registre nem comite chaves de API, valores de `.env` locais ou dados confidenciais nos arquivos do repositório. O banco e o `.env` são dados locais.

---

## 5. Estrutura de pastas, arquivos e rotas

```text
certificacoesEstudos/
├── 00-anything/               # Diretório OBRIGATÓRIO para drafts, specs, relatórios EGM e testes
│   └── 01 - .../              # Subpasta de isolamento por tarefa/implementação
├── data/                      # Banco de dados e armazenamento local (ignorado pelo Git)
│   ├── safezone.db            # Banco SQLite local
│   └── uploads/               # Arquivos PDF originais salvos por conteúdo
├── server/                    # Backend nativo Node.js
│   └── index.mjs              # API HTTP, schema SQLite, migrações, rotas e handlers de arquivos
├── public/                    # Assets estáticos e manifest do PWA (ícones, favicons)
├── tests/                     # Testes funcionais e fluxos E2E com Playwright
│   └── e2e/                   # Especificações de rotas e fluxos críticos
├── AGENTS.md                  # Este arquivo (Diretrizes, governança e documentação viva para IAs)
├── CLAUDE.md, GEMINI.md       # Arquivos ponteiro leves redirecionando para AGENTS.md
├── .github/copilot-instructions.md # Ponteiro para GitHub Copilot
├── README.md                  # Visão geral e instruções para desenvolvedores humanos
├── package.json               # Dependências, scripts e metadados do projeto
├── vite.config.ts             # Configuração do Vite, PWA e proxy /api
├── tsconfig.json              # Configurações TypeScript
├── .oxlintrc.json             # Regras de linting do Oxlint
├── .gitignore                 # Arquivos ignorados (node_modules, data/*.db, data/uploads/, graphify-out/)
└── src/
    ├── main.tsx               # Bootstrap React com ThemeProvider, GlobalStyle e BrowserRouter
    ├── App.tsx                # Estrutura raiz e injeção de AppRoutes
    ├── routes/
    │   └── AppRoutes.tsx      # Configuração central de rotas com MainLayout
    ├── pages/                 # Telas da aplicação
    │   ├── Dashboard/         # Rota "/" — Visão geral, indicadores e metas
    │   ├── Biblioteca/        # Rota "/biblioteca" — Listagem, busca e gestão de conteúdos
    │   ├── NovoConteudo/      # Rota "/biblioteca/novo" — Ingestão de PDF, URL ou texto livre
    │   ├── EstudoDiario/      # Rota "/estudo" — Sessão de estudo (aceita ?content=<id>)
    │   ├── Configuracoes/     # Rota "/config" — Configuração de temas, metas, IA e backup
    │   └── Atividade/         # Rota "/atividade" — Histórico detalhado e métricas de desempenho
    ├── components/            # Componentes visuais organizados por domínio
    │   ├── layout/            # MainLayout, Sidebar, Header
    │   ├── dashboard/         # Mentoria, gráficos de retenção e heatmap de atividade
    │   ├── flashcard/         # Cartão interativo, controles e visualizadores
    │   └── ui/                # Botões, modais, inputs e feedbacks
    ├── hooks/                 # Custom React Hooks
    │   ├── index.ts           # Barrel de hooks de biblioteca, ingestão, config e IA
    │   └── useStudySession.ts # Hook principal de estudo diário e repetição espaçada
    ├── services/              # Lógica de integração externa e regras de IA
    │   ├── contentIngestion.ts# Extração de PDF com PDF.js, web crawler e chunking
    │   ├── aiService.ts       # Orquestração de prompts, provedores e balanceamento
    │   └── aiMentorService.ts # Geração de insights personalizados de estudo
    ├── storage/               # Cliente HTTP que consome a API /api
    │   ├── index.ts           # Métodos de CRUD para conteúdos, flashcards, sessões
    │   └── syncService.ts     # Sincronização e exportação/importação de backups
    ├── theme/                 # Design System centralizado styled-components
    │   ├── index.ts           # Barrel export do tema
    │   ├── tokens.ts          # Espaçamentos, raios, sombras, transições e fontes
    │   ├── colors.ts          # Paletas de cores para temas claro e escuro
    │   ├── typography.ts      # Escalas tipográficas
    │   ├── components.ts      # Tokens de botões, cards, badges e modais
    │   ├── GlobalStyle.ts     # Reset CSS e estilos base globais
    │   ├── ThemeProvider.tsx  # Context provider e hooks de tema
    │   └── themes/            # Definições de lightTheme e darkTheme
    ├── types/                 # Contratos TypeScript do projeto
    │   └── index.ts           # Interfaces de Content, Flashcard, StudySession, Exam etc.
    └── utils/                 # Funções utilitárias
        ├── sm2.ts             # Algoritmo de repetição espaçada SuperMemo-2
        └── uuid.ts            # Gerador de identificadores únicos
```

### 5.1 Arquivos Ponteiro Multi-IA (Zero Duplicação de Regras)

Para garantir consistência quando diferentes assistentes inspecionam o repositório:
* **`CLAUDE.md`**: Aponta para `AGENTS.md`.
* **`GEMINI.md`**: Aponta para `AGENTS.md`.
* **`.github/copilot-instructions.md`**: Aponta para `AGENTS.md`.

### 5.2 Sistema de Design e Tema (`src/theme/`)

* O sistema visual do SafeZone Studies é 100% gerenciado via `styled-components` através de `src/theme/`.
* Exporta temas completos (`lightTheme` e `darkTheme`), tokens estruturados (`spacing`, `radii`, `shadows`, `typography`) e configurações prontas para botões (`buttons.primary`, `buttons.secondary`, `buttons.outline`), inputs, cards, containers, badges, alertas e modais.
* **Proibido:** Importar CSS puro (`.css`, `.scss`) em componentes dentro de `src/`.

---

## 6. Arquitetura e fluxo de dados

O fluxo de dados da aplicação opera da seguinte maneira:

```text
React SPA (Frontend - porta 5173)
  │
  ├─ src/pages & components
  │    └─ src/hooks (useStudySession, useContentProcessor etc.)
  │         └─ src/storage/index.ts (fetch client para /api)
  │                 │
  ▼                 ▼
Vite Proxy (/api) → http://localhost:3001
                    │
                    ▼
          Node.js HTTP Server (server/index.mjs)
                    ├─ SQLite Local (data/safezone.db)
                    └─ Storage de PDFs (data/uploads/)
```

### Princípios de Responsabilidade:
1. **Componentes/Páginas**: Cuidam exclusivamente da renderização visual e captura de eventos do usuário.
2. **Hooks**: Encapsulam a lógica de estado, seleções de cartões e transições de tela.
3. **Storage (`src/storage/index.ts`)**: Centraliza as chamadas HTTP para `/api`, mantendo o frontend desacoplado da implementação do banco.
4. **Server (`server/index.mjs`)**: Controla integridade relacional, migrações de schema SQLite e gravação física de uploads.
5. **AI Services (`src/services/`)**: Processam PDFs e textos brutos, gerando chamadas estruturadas para LLMs.

---

## 7. Modelo de dados, persistência e rotas da API

O backend SQLite armazena as seguintes entidades centrais:

| Tabela / Recurso | Descrição | Onde é persistido / consumido |
| :--- | :--- | :--- |
| `contents` | Materiais de estudo (título, texto extraído, chunks, apostila `studyGuide` em JSON, exame associado) | SQLite (`data/safezone.db`) |
| `flashcards` | Questões de revisão vinculadas ao conteúdo (pergunta, resposta, explicação, métricas SM-2) | SQLite (`data/safezone.db`) |
| `study_sessions` | Histórico de sessões de estudo realizadas, quantidade de revisões e tempo investido | SQLite (`data/safezone.db`) |
| `settings` | Configurações do usuário (tema, metas diárias, provedores de IA, modelo e endpoints) | SQLite (`data/safezone.db`) |
| `exams` | Objetivos e matrizes de certificação (AI-200, AI-103) | SQLite (`data/safezone.db`) |
| `sync_meta` | Metadados de versão e integridade de dados para backup/restore | SQLite (`data/safezone.db`) |
| `data/uploads/` | Armazenamento de arquivos binários dos PDFs originais vinculados a cada `content.id` | Disco local |

> ⚠️ **Nota Importante sobre IndexedDB vs SQLite:** Comentários antigos ou textos residuais no código podem mencionar IndexedDB/Dexie. A persistência oficial e ativa do projeto é a **API SQLite via `server/index.mjs`**.

### Rotas da API Backend (`server/index.mjs`):

* **Conteúdos (`/api/contents`)**:
  - `GET /api/contents`: Listagem e busca de materiais com filtros e paginação.
  - `POST /api/contents`: Criação de novo material com texto e chunks fatiados.
  - `GET /api/contents/:id`: Detalhe do conteúdo (incluindo `studyGuide`).
  - `PUT /api/contents/:id`: Atualização de metadados e apostila.
  - `DELETE /api/contents/:id`: Remoção de conteúdo e exclusão em cascata de flashcards e PDF vinculado.
  - `GET /api/contents/stats`: Estatísticas agregadas de conteúdo.
* **Upload e Leitura de PDFs (`/api/uploads`)**:
  - `POST /api/uploads/:id`: Upload e gravação em disco (`data/uploads/`) do binário PDF original (até 50 MB).
  - `GET /api/uploads/:id`: Leitura e streaming do arquivo original associado ao conteúdo.
* **Flashcards (`/api/flashcards`)**:
  - `GET /api/flashcards`: Listagem completa.
  - `GET /api/flashcards/due`: Cartões vencidos agendados para revisão pelo SM-2.
  - `GET /api/flashcards/new`: Novos cartões ainda não revisados.
  - `POST /api/flashcards/batch`: Criação em lote de flashcards gerados por IA.
  - `PUT /api/flashcards/:id`: Atualização de cartão (notas SM-2, repetições, facilidade).
* **Sessões de Estudo (`/api/sessions`)**:
  - `POST /api/sessions`: Registro de nova sessão de estudo.
  - `PUT /api/sessions/:id`: Atualização de métricas e tempo da sessão.
  - `GET /api/sessions/recent`: Histórico recente e mapa de calor.
  - `GET /api/sessions/streak`: Contagem de dias consecutivos de estudo.
* **Configurações, Exames e Sincronização**:
  - `/api/settings`: Leitura e persistência de preferências e provedores de IA.
  - `/api/exams`: Objetivos e matrizes AI-200 / AI-103.
  - `/api/sync`: Exportação e importação completa em JSON (incluindo apostilas; arquivos de PDF originais em `data/uploads/` não entram no JSON) e reset geral.

---

## 8. Regras de negócio essenciais

1. **Ingestão de Conteúdos**:
   - PDFs de até 50 MB com texto selecionável são aceitos. O arquivo original é salvo em disco (`data/uploads/`), enquanto o texto extraído é fatiado em chunks e salvo no banco. (PDFs digitalizados sem OCR não extraem texto).
   - Links web utilizam prioritariamente o proxy `/api/fetch` do Vite em desenvolvimento, com fallbacks externos e tratamento de timeout (limite de 5 MB por página).
   - `useContentProcessor` salva o conteúdo, identifica o exame correspondente (AI-200 ou AI-103) e dispara a geração via IA; em caso de falha irreversível, tenta remover o conteúdo criado.
2. **Geração por Inteligência Artificial**:
   - `aiService` divide o material em até 30 chunks sequenciais por chamada para respeitar limites de contexto (com teto de ~1200 tokens por chunk na ingestão de Markdown e 6000 caracteres por requisição).
   - **Rotação e Fallback Multi-Provedor**: Quando chaves de Gemini e NVIDIA NIM estão configuradas (via Configurações ou `.env`), `aiService` alterna entre os modelos disponíveis em round-robin por chunk, aplica pausa entre requisições (`2,5s`) para permanecer dentro dos limites de RPM/TPM, coloca modelos com erro 429/503/timeout em cooldown temporário, desativa modelos 401/403/404 na sessão e faz fallback automático inclusive entre Google Gemini e NVIDIA NIM.
   - O modelo gera:
     a) Uma **Apostila Estruturada (`studyGuide`)** com um conceito por tópico e parágrafos curtos. Os campos opcionais `executiveSummary`, `azureScenario` e `decisionCriteria` só são gerados com respaldo na fonte. Apostilas anteriores continuam válidas.
     b) Flashcards **exclusivamente no formato de questões** (até 50 questões práticas deduplicadas). Cartões teóricos são descartados em favor da apostila.
3. **Sessão de Estudo Guiada**:
   - Conteúdos que possuem apostila abrem primeiro a etapa de leitura teórica.
   - Em seguida, o usuário pratica as questões nos flashcards. A proporção orientadora do sistema é de aproximadamente **30% de tempo de leitura para 70% de prática de questões** (meta orientadora, sem cronômetro punitivo).
   - A fila automática da revisão diária e por tema traz até 40 questões. Revisões vencidas vêm em ordem de vencimento, seguidas por inéditas em ordem de importância, criação e ID. Histórico, repetições ou lapsos identificam questões já avaliadas.
   - Um tema em dia informa a próxima revisão e oferece o treino extra **Praticar agora**, que preserva o agendamento dos cartões e fica fora do histórico de sessões.
   - **Encerrar por hoje** salva o início e o fim, o tempo em segundos, o tema da sessão focada e as contagens acumuladas no Supabase. A conclusão automática usa o mesmo fluxo. A tela Atividade aceita os campos legados de sessão.
4. **Algoritmo de Repetição Espaçada (SM-2)**:
   - Na revisão de flashcards, o usuário avalia o cartão entre quatro notas:
     - `again` (nota 0/1): Errou ou esqueceu completamente. O cartão volta uma vez no fim da fila da sessão, inclusive quando é o único.
     - `hard` (nota 2/3): Lembrou com grande dificuldade (intervalo curto).
     - `good` (nota 4): Lembrou no tempo adequado (padrão de avanço).
     - `easy` (nota 5): Dominou o conceito (avanço mais longo).
   - Os cálculos de repetição e intervalo encontram-se em `src/utils/sm2.ts`. Atalhos de teclado: `Espaço` vira o cartão, teclas `1`, `2`, `3` e `4` acionam a avaliação.

---

## 9. Convenções de código e boas práticas

* **Nomenclatura Obrigatória de Styled-Components (Sufixo `Stl`)**:
  - Em novos componentes estilizados, utilize sempre o sufixo `Stl` (ex: `ContainerGeralStl`, `BotaoEstudoStl`, `CardHeaderStl`) para imediata diferenciação visual entre componentes React de lógica e nós estilizados.
* **Componentes e Arquivos**:
  - Componentes e Páginas em pastas dedicadas com `index.ts` ou arquivos nominais em **PascalCase** (`NovoConteudo.tsx`).
  - Hooks em `camelCase` com prefixo `use` (ex: `useStudySession.ts`).
  - Funções puras e utilitários em `camelCase`.
* **TypeScript Rigoroso**:
  - Mantenha `src/types/index.ts` sincronizado com qualquer modificação de campos em `contents`, `flashcards` ou `settings`.
  - Evite tipagens frouxas com `any`; prefira tipos discriminados e interfaces bem definidas.
* **Zero CSS cru em `src/`**:
  - É proibido criar ou importar arquivos `.css` dentro de `src/`. Utilize as constantes e componentes estilizados de `src/theme/`.
* **Git e Commits**:
  - Adote **Conventional Commits**: `feat:`, `fix:`, `refactor:`, `style:`, `docs:`, `chore:`, `test:`.
  - Commits granulares e atômicos.
  - Desenvolva sempre em branches dedicadas (`feature/`, `fix/`, `refactor/`, `docs/`) e faça push ao remoto.

---

## 10. Estratégia de Testes Funcionais & E2E (Playwright Inteligente)

Para garantir estabilidade sem onerar o ciclo de desenvolvimento, adotamos testes funcionais pontuais e inteligentes via Playwright.

### 1. Protocolo de Verificação Dinâmica da Máquina Atual

| Parâmetro | Detecção da Máquina Atual |
| :--- | :--- |
| **Sistema Operacional** | Windows 10/11 (PowerShell) |
| **Variável `PLAYWRIGHT_BROWSERS_PATH`** | `C:\Users\renato.lima\AppData\Local\ms-playwright` |
| **Componentes Validados no Ambiente** | `chromium-1254`, `chromium_headless_shell-1254`, `ffmpeg-1013`, `winldd-1007` |
| **Reutilização Global Ativa** | Sim (não requer downloads redundantes dentro de `node_modules`) |

### 2. Quando Criar ou Executar Testes Funcionais

* ❌ **NÃO criar testes funcionais para:**
  - Ajustes cosméticos em temas, cores ou espaçamentos.
  - Correção de textos estáticos ou pequenos ajustes de labels.
*  **É OBRIGATÓRIO criar ou executar testes funcionais quando:**
  - Alterar rotas mestras ou o `MainLayout` em `src/routes/AppRoutes.tsx`.
  - Alterar o fluxo de ingestão e upload de conteúdos em `src/pages/NovoConteudo/`.
  - Modificar o fluxo de sessões de estudo em `src/pages/EstudoDiario/` ou o hook `useStudySession`.
  - Alterar contratos persistentes da API em `server/index.mjs` e `src/storage/index.ts`.

---

## 11. Estratégia de Segurança (SAST & Proteção de Dados)

1. **Zero Segredos no Client-Side**:
   - Chaves privadas, tokens mestres e segredos de infraestrutura jamais devem ser injetados em arquivos de `src/` ou expostos em variáveis públicas do Vite.
2. **Prevenção de XSS**:
   - Higienize qualquer extração de páginas web (via Readability/Cheerio) antes de renderizar em tela.
   - Evite `dangerouslySetInnerHTML` sem prévia sanitização rigorosa.
3. **Auditoria Contínua**:
   - Execute `npm audit` ao adicionar novas dependências ao projeto.
   - Mantenha o linter (`npm run lint`) limpo antes de concluir qualquer tarefa.

---

## 12. Cuidados e armadilhas comuns

1. **Arquivos soltos na raiz**: Nunca salve drafts, specs, notas ou relatórios de subagentes/EGM na raiz do repositório. Utilize sempre `00-anything/{sequencial} - {nome} {data}/`.
2. **IndexedDB residual no código**: Não confunda referências antigas a IndexedDB em textos ou comentários; a persistência real é o SQLite em `data/safezone.db`.
3. **Dois hooks `useStudySession`**: Existe uma implementação dentro de `src/hooks/index.ts` e outra em `src/hooks/useStudySession.ts` (esta última usada por `EstudoDiario`). Ao alterar a lógica de repetição ou estudo, confira ambas para evitar divergências.
4. **Pasta de Uploads (`data/uploads/`)**: Os PDFs originais ficam armazenados em disco no servidor e são ignorados pelo Git. Ao resetar ou mover o banco via `DB_PATH`, verifique o diretório de uploads.
5. **Esquecer de atualizar este `AGENTS.md`**: Toda alteração estrutural exige atualização deste documento e registro na tabela de histórico abaixo.

---

## 13. Checklist para agentes ao finalizar uma tarefa

Antes de considerar qualquer tarefa ou resposta como concluída, o agente DEVE verificar e marcar os itens abaixo:

* [ ] **Isolamento de artefatos na raiz**: Nenhum rascunho, spec, teste temporário ou relatório EGM solto na raiz do repositório (todos salvos dentro de `00-anything/{sequencial} - {nome} {data}/`).
* [ ] **Respeito à regra de negócio**: Nenhuma suposição incorreta sobre o domínio do projeto (SafeZone Studies: preparação para Azure AI-200/AI-103).
* [ ] **Sufixo `Stl` adotado**: Novos componentes criados com styled-components possuem o sufixo `Stl` (ex: `ContainerGeralStl`, `BotaoAcaoStl`).
* [ ] **Zero CSS cru em `src/`**: Nenhum arquivo `.css` foi criado ou importado diretamente em `src/` (estilização 100% via `src/theme/`).
* [ ] **Integridade do roteamento**: O arquivo `src/routes/AppRoutes.tsx` e as telas associadas permanecem íntegros.
* [ ] **Qualidade de código validada**: `npm run lint` executado sem erros ou alertas graves.
* [ ] **Grafo de dependências verificado**: `npm run graph:circular` validado sem dependências circulares caso novos módulos tenham sido adicionados.
* [ ] **Segurança e dependências**: Zero segredos ou tokens commitados no código, e `npm audit` executado em caso de novas bibliotecas.
* [ ] **Este `AGENTS.md` atualizado**: As seções deste arquivo refletem a realidade atualizada do projeto.
* [ ] **Histórico registrado**: A alteração realizada foi registrada na tabela de **Histórico de alterações deste arquivo** abaixo.
* [ ] **Fluxo de Git respeitado**: O trabalho foi desenvolvido em branch dedicada (`feature/`, `fix/`, `refactor/` ou `docs/`), com commits semânticos no padrão Conventional Commits e push ao repositório remoto.

---

## 📜 Histórico de alterações deste arquivo

| Data | Responsável | Alteração Realizada |
| :--- | :--- | :--- |
| 2026-11-12 | Agente IA | Padronização integral do `AGENTS.md` com base no Modelo Base Universal (`g:\Meu Drive\(00- DOCUMENTOS)\08 - Modelos_IA\00 - Agents\Agents.md`): inclusão das 6 regras mandatórias (atualização contínua de documentação, fluxo estrito de Git em branches, decomposição de issues em formato copiável/Linear, diretório obrigatório `00-anything/`, fidelidade ao domínio SafeZone Studies e mapeamento com Madge/graphify), detalhamento completo da stack técnica (React 19, Vite 8, Node.js SQLite nativo), mapeamento da árvore real de arquivos, documentação do sistema de tema (`src/theme/`), estratégia inteligente de testes com Playwright (detecção de navegadores locais no Windows), estratégia de segurança SAST e checklist de encerramento de tarefas. |
| 2026-11-12 | Agente IA | Consolidação unificada de todo o contexto técnico, rotas da API, regras de ingestão e detalhes de negócio de `contextoIa/README.md` exclusivamente para este `AGENTS.md`. Remoção do diretório `contextoIa/` tornando `AGENTS.md` a única fonte da verdade do projeto. |
| 2026-11-12 | Agente IA | Implementação completa da reestruturação arquitetural (Fases 1 a 4 do design doc em `00-anything/01 - reestruturacao supabase md notebooklm 2026-11-12/reestruturacao_supabase_notebooklm_30_70.md`): migração para Supabase BaaS (PostgreSQL + RLS + Supabase Auth e Storage), ingestão semântica de notas Markdown (.md) do Google NotebookLM particionadas por títulos (#, ##, ###), suporte a NVIDIA NIM (Llama 3.3 70B via OpenAI-compatible proxy /api/nvidia) mantendo Google Gemini como padrão e descontinuando OmniRoute, metodologia de estudo 30/70 bifásica com componentes `ExamTrapCallout`, `DecisionMatrix` e `MultipleChoiceCard` integrados ao algoritmo SM-2 na escala nominal de 1 a 4, automação de keep-alive a cada 48h via GitHub Actions, script de migração SQLite legado `scripts/migrate-sqlite-to-supabase.mjs` e testes E2E com Playwright. |
| 2026-11-16 | Agente IA | Criação do template `.env.example` versionado e geração do arquivo `.env` local com as variáveis estruturadas do Supabase (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) e provedores de IA (Gemini e NVIDIA NIM). |
| 2026-11-17 | Agente IA | Criação da migration incremental `supabase/migrations/20261117_align_columns.sql` e atualização de `20261112_init_schema.sql` e `src/storage/index.ts` para alinhar todas as colunas das tabelas (`tags`, `storage_path`, `difficulty`, `importance`, `study_sessions` e `settings`) com o Supabase PostgREST. |
| 2026-11-17 | Agente IA | Adição de `.npmrc` (`legacy-peer-deps=true`) para corrigir conflito ERESOLVE (`madge` vs `typescript@6`) no build da Vercel e criação de `vercel.json` com rewrites para SPA e proxy `/api/nvidia` em produção. |
| 2026-11-17 | Agente IA | Criação da identidade visual oficial SafeZone Studies (`public/favicon.svg`, `favicon-32x32.png`, `apple-touch-icon.png`, `pwa-192x192.png`, `pwa-512x512.png`, `pwa-maskable-512x512.png`), componente `src/components/ui/BrandLogo.tsx` (integrado em `Sidebar`, `Header` e `Login`) e ajuste completo do manifesto PWA/Workbox em `vite.config.ts` e `index.html`. |
| 2026-11-18 | Agente IA | Implementação de rotação de modelos, fallback cruzado entre Google Gemini e NVIDIA NIM (`providerKeys` em `src/types/index.ts`, `src/hooks/index.ts` e `src/pages/Configuracoes.tsx`), cooldown/pacing entre chunks em `src/services/aiService.ts` para respeitar limites de requisição em arquivos `.md` grandes e subdivisão de blocos gigantes em `chunkMarkdownByHeadings` (`src/services/contentIngestion.ts`). |
| 2026-11-18 | Agente IA | Atualização da lista ativa de modelos NVIDIA NIM (`google/gemma-4-31b-it`, `nvidia/nemotron-3.5-lightning-30b-a3b`, `mistralai/mistral-large-4-1t-a52b`, `z-ai/glm-5.3-flash`, etc.), remoção dos modelos Gemini/NVIDIA descontinuados (404/410) e desativação automática de modelos HTTP 410 na sessão. |
| 2026-11-26 | Agente IA | SIR-170: fila SM-2 por vencimento e histórico, treino extra sem reagendamento, testes Playwright com relógio controlado e servidor isolado. |
| 2026-11-26 | Agente IA | SIR-171: erros reapresentados uma vez na sessão, notas com intervalo calculado pelo SM-2 e proteção contra avaliações simultâneas. |
| 2026-11-26 | Agente IA | SIR-172: encerramento parcial e automático com resumo, nova tentativa em falha e histórico Supabase com duração em segundos e tema. |
| 2026-11-26 | Agente IA | SIR-173: geração de leitura curta com síntese, cenário Azure e critério de decisão opcionais, validada com fixtures para AI-200 e AI-103. |
