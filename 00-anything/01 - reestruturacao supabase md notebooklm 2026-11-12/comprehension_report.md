# Stage 6: Comprehension Test — Naive Reader Audit Report

* **Target Document:** `00-anything/01 - reestruturacao supabase md notebooklm 2026-11-12/reestruturacao_supabase_notebooklm_30_70.md`  
* **Auditor:** Naive Reader (`egm-comprehension`)  
* **Perspective:** Plain Comprehension, Self-Containment, Acronym Discovery & Mental Model Integrity  
* **Location:** `00-anything/01 - reestruturacao supabase md notebooklm 2026-11-12/comprehension_report.md`

---

## Feature Spec Paraphrase

**What this proposes:**
O documento propõe modernizar o SafeZone Studies migrando sua persistência e autenticação para o Supabase (PostgreSQL na nuvem com isolamento por usuário via Row Level Security e perfis de acesso RBAC), além de manter o banco sempre ativo no plano gratuito por meio de um ping agendado via GitHub Actions a cada 48 horas. No pipeline pedagógico e de IA, o projeto substitui o provedor legado OmniRoute pela API da NVIDIA NIM e adiciona suporte à ingestão direta de resumos Markdown (.md) gerados no Google NotebookLM, particionados respeitando a hierarquia de cabeçalhos. Na experiência de estudo, adota a metodologia 30/70, combinando leitura teórica ativa (focada em pegadinhas de prova e matrizes de decisão de serviços da nuvem) com 70% de prática em flashcards tradicionais e simulador de questões de múltipla escolha com distratores justificados, gerenciados pelo algoritmo de repetição espaçada SuperMemo-2 (SM-2).

**How the existing system works, per this document:**
Atualmente, o SafeZone Studies é uma aplicação local sem autenticação ou suporte a múltiplos usuários, onde os dados são gravados em um banco SQLite (`data/safezone.db`) gerenciado por um servidor Node.js local (`server/index.mjs`). A ingestão de conteúdo dependia de PDFs brutos processados via PDF.js (sujeito a perdas de estrutura em tabelas e colunas), os flashcards gerados por IA eram restritos a perguntas e respostas simples em formato flip (sem suporte a questões de múltipla escolha nem destaque para pegadinhas de certificação), e o sistema mantinha suporte legado a chamadas para o serviço descontinuado OmniRoute.

---

## Implementation Plan Paraphrase

**What this proposes:**
O plano de implementação estabelece a execução sequencial em 4 fases: primeiro, a configuração da infraestrutura Supabase com scripts SQL declarativos, cliente JS tipado, contexto global de autenticação React, telas de login e administração (`/admin/users`), e o workflow de keep-alive no GitHub Actions. Em seguida, implementa o analisador semântico de Markdown para processar notas do NotebookLM, refatora os contratos em `src/types/index.ts` e integra o novo conector da NVIDIA NIM no serviço de IA, expurgando o OmniRoute das configurações. Na sequência, refatora a camada de armazenamento (`src/storage/index.ts`) para operar diretamente sobre o Supabase e cria o script de migração do SQLite local para a nuvem. Por fim, desenvolve os componentes visuais de estudo (callouts de armadilhas, matrizes de decisão e cartões de múltipla escolha), conecta a experiência bifásica no hook de estudo diário e valida o ecossistema com TypeScript, Oxlint, Madge e testes ponta a ponta no Playwright, sincronizando o `AGENTS.md`.

---

## Findings & Comprehension Audit

### Finding 1: Vague Workflow for Student Invitation / Provisioning
* **Severity**: Major
* **Affected Scope**: CUJ 3 & Detailed Implementation Plan (Seções 1 e 2).
* **Discrepancy Description & Rationale**:
  O documento afirma que o administrador pode adicionar ou convidar novos estudantes através da tela `/admin/users`, criando o perfil e credenciais do novo usuário. No entanto, o plano arquitetural adota exclusivamente a biblioteca `@supabase/supabase-js` no frontend com a chave pública anônima (`VITE_SUPABASE_ANON_KEY`). No Supabase, criar programaticamente outro usuário autenticado com senha ou convite administrativo direto (via `supabase.auth.admin.createUser` ou `inviteUserByEmail`) exige a **Service Role Key**, que jamais pode ser exposta no cliente por violar as diretrizes de segurança. Se o fluxo for baseado no registro padrão (`signUp`), o navegador loga o novo usuário no lugar do administrador logado. O documento não especifica o mecanismo técnico exato: se haverá uma rota protegida no servidor/Edge Function com a Service Role Key, ou se o fluxo é baseado no cadastro público do aluno com aprovação/liberação posterior do administrador.
* **Recomendação**: Alinhar o mecanismo: como o Finding 1 do Stage 5 (Zoom Out) recomendou remover o painel customizado `/admin/users` em favor do console web nativo do Supabase, acolher essa simplificação elimina automaticamente a complexidade da Service Role Key no frontend.

### Finding 2: Undefined Term & Service: "NotebookLM"
* **Severity**: Nit
* **Affected Scope**: Overview, Problem e CUJ 1.
* **Discrepancy Description & Rationale**:
  O termo "NotebookLM" ou "Google NotebookLM" é citado como a origem do arquivo Markdown a ser ingerido, mas não há definição inline indicando que se trata da ferramenta de anotações e síntese do Google nem quais convenções de Markdown ela exporta.
* **Recomendação**: Adicionar uma nota contextual de que os arquivos do NotebookLM seguem Markdown padrão com cabeçalhos H1/H2/H3 (`#`, `##`, `###`).

### Finding 3: Undefined Domain Acronym: "SKU"
* **Severity**: Nit
* **Affected Scope**: Seção 5.1 (*"realce de SKUs e limites operacionais"*).
* **Discrepancy Description & Rationale**:
  O termo "SKU" (Stock Keeping Unit / camadas comerciais de serviços em nuvem) foi introduzido sem definição prévia no contexto das tabelas comparativas da Azure.
* **Recomendação**: Contextualizar no texto como "planos e camadas de serviço (SKUs)".
