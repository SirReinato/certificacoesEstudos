# Critic Review Report: Reestruturação SafeZone Studies

* **Target Document:** `00-anything/01 - reestruturacao supabase md notebooklm 2026-11-12/reestruturacao_supabase_notebooklm_30_70.md` (Linhas 1..267)  
* **Destino do Artefato:** `00-anything/01 - reestruturacao supabase md notebooklm 2026-11-12/critic_report.md`  
* **Contexto de Auditoria:** `AGENTS.md`  
* **Padrões Aplicados:** `feature-spec-standard` (Design & Estrutural) e `style-standard` (Estilo & Terminologia)  

---

## Reviewer Status

| Reviewer | Status | Escopo Auditado |
| :--- | :--- | :--- |
| `egm-design` | completed | Arquitetura de sistemas, RLS, segurança, concorrência, falhas distribuídas |
| `egm-structural` | completed | Consistência relacional, rastreabilidade de CUJs, completude de contratos |
| `egm-style` | completed | Eliminação de fluff/hype, precisão técnica e tom sóbrio de engenharia |

---

## Resumo Executivo de Severidade

* 🔴 **Blockers (4 apontamentos críticos):**
  1. Criação client-side de alunos por admin inviável sem vazamento da `service_role_key`.
  2. Risco de recursão infinita em políticas RLS e escalonamento de privilégios na tabela `public.profiles`.
  3. Desativação silenciosa de workflows do GitHub Actions aos 60 dias sem commits, ameaçando a garantia de uptime do Supabase.
  4. Mapeamento incorreto da escala SM-2 (`good` rotulado como 4 em vez de 3) e viés de sorte em questões de múltipla escolha.
* 🟡 **Majors (4 apontamentos técnicos):**
  1. Risco de bloqueio por CORS no browser com requisições diretas ao endpoint do NVIDIA NIM.
  2. Ausência de fila/concorrência e tratamento de rate limit (HTTP 429) no processamento em lote de chunks Markdown.
  3. Violação de regra de negócio em `flashcards.kind = 'theory'` (restringir a questões) e omissão de `content_id` em `study_sessions`.
  4. Chunker sem especificação de algoritmo de contagem de tokens e sem fallback para Markdown sem cabeçalhos.
* 🟢 **Nits (3 apontamentos):**
  1. Status prematuro como "Approved" no cabeçalho do documento enquanto sob revisão.
  2. Linguagem promocional e adjetivos vazios em seções descritivas.
  3. Timer de transição entre fase de leitura e questões não especificado no CUJ 2.

---

## Prioritized Findings (Blockers -> Major -> Nits)

### 1. Criação Client-Side de Alunos por Admin Inviável sem Vazamento de `service_role` - Severity: Blocker
* **Reviewer Lens:** `egm-design`
* **Affected Scope:** Linhas 36, 66–70 (CUJ 3), 123
* **Discrepancy Description:** O objetivo G2 e o CUJ 3 determinam que administradores convidem/adicionem novos estudantes a partir da interface SPA em `/admin/users`. No entanto, a API client-side do Supabase Auth (`@supabase/supabase-js`) não permite a criação de novos usuários nem o envio de convites administrativos sem a chave mestra `service_role`. A função `supabase.auth.signUp()` padrão realiza o login automático do novo usuário, desconectando imediatamente a sessão do administrador. O documento omite por completo como isso será executado de forma segura sem expor a `service_role` no bundle do frontend (o que anularia todo o RLS do banco).
* **Rationale & Recommendation:** Especificar uma rota segura no backend ou uma Supabase Edge Function (`admin-create-user`), protegida por verificação de JWT de administrador, que utilize a `service_role` em ambiente serverless isolado para invocar `supabaseAdmin.auth.admin.inviteUserByEmail()`, ou simplificar gerenciando os usuários diretamente via painel web do Supabase.

---

### 2. Recursão Infinita em Políticas RLS e Escalonamento de Privilégio em `public.profiles` - Severity: Blocker
* **Reviewer Lens:** `egm-design` & `egm-structural`
* **Affected Scope:** Linhas 120–125, 156–166
* **Discrepancy Description:** 
  1. A política de RLS em `contents` avalia `(select role from public.profiles where id = auth.uid()) = 'admin'`. Se a tabela `profiles` possuir RLS ativo consultando a si mesma para verificar se o usuário é admin, o PostgreSQL abortará as requisições com o erro fatal `infinite recursion detected in policy for relation "profiles"`.
  2. O documento não define as políticas de RLS para a tabela `public.profiles`. Sem uma restrição estrita de colunas no `WITH CHECK` de update, qualquer usuário autenticado pode executar `supabase.from('profiles').update({ role: 'admin' })` sobre seu próprio registro, obtendo escalonamento imediato de privilégios.
* **Rationale & Recommendation:**
  1. Implementar a verificação de admin através de uma função `is_admin()` declarada como `SECURITY DEFINER` com `SET search_path = public`, evitando disparar o ciclo de RLS da tabela `profiles`, ou gravar a role em `auth.users.raw_app_meta_data` lida diretamente via `(auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'`.
  2. Especificar explicitamente a política RLS de `profiles`: leitura liberada apenas para o dono ou admin; mutação da coluna `role` estritamente bloqueada para usuários comuns via trigger de validação ou restrição de update.

---

### 3. Desativação Silenciosa do GitHub Actions aos 60 Dias Ameaça Uptime do Supabase - Severity: Blocker
* **Reviewer Lens:** `egm-design`
* **Affected Scope:** Linhas 37, 209–231
* **Discrepancy Description:** O mecanismo de keep-alive a cada 48h baseia-se exclusivamente em um cron job do GitHub Actions (`schedule: - cron: '0 4 */2 * *'`). Pelas regras oficiais do GitHub, workflows agendados por cron são **desativados automaticamente de forma silenciosa** após 60 dias sem commits no repositório. Em períodos de estabilidade pós-lançamento, o ping deixará de ser disparado sem aviso, resultando na pausa involuntária do banco de dados no Supabase Free Tier (após 72h).
* **Rationale & Recommendation:** Não utilizar o GitHub Actions como garantia única de uptime. É indispensável documentar esse comportamento do GitHub e prever redundância com um monitor externo gratuito (como UptimeRobot, Better Uptime ou Cron-Job.org apontando para a rota de healthcheck).

---

### 4. Mapeamento Incorreto da Escala SM-2 e Viés de Sorte em Questões de Múltipla Escolha - Severity: Blocker
* **Reviewer Lens:** `egm-design`
* **Affected Scope:** Linhas 206–208
* **Discrepancy Description:** A linha 207 estabelece: *"em caso de acerto imediato, pré-seleciona nota `good` (4); em caso de erro, atribui nota `again` (1)"*.
  1. No SM-2 clássico de 4 notas adotado pelo projeto (`src/utils/sm2.ts`), a nota `good` é 3, enquanto a nota 4 é `easy`. Rotular `good` como 4 quebra o contrato matemático da função utilitária do sistema.
  2. Em questões simuladas de múltipla escolha com 4 alternativas, há 25% de probabilidade de acerto por chute puramente aleatório. Atribuir automaticamente a nota `good` no acerto imediato inflaciona o fator de facilidade (*ease factor*) e o intervalo de repetição de itens não consolidados na memória do estudante.
* **Rationale & Recommendation:** Corrigir a equivalência nominal da nota `good` para 3 (alinhando com `src/utils/sm2.ts`). Para questões de múltipla escolha acertadas, exigir que o estudante confirme se o acerto foi por domínio pleno (*Good* / *Easy*) ou por dúvida/chute (*Hard* - nota 2), antes de persistir o cálculo no SM-2.

---

### 5. Risco Crítico de CORS e Exposição de Chaves em Requisições Diretas ao NVIDIA NIM - Severity: Major
* **Reviewer Lens:** `egm-design`
* **Affected Scope:** Linhas 79–86, 107–109, 182–186
* **Discrepancy Description:** O diagrama arquitetural e o texto definem que o cliente React SPA chama diretamente `https://integrate.api.nvidia.com/v1/chat/completions`. Se o gateway do catálogo NVIDIA NIM não expuser cabeçalhos permissivos de CORS (`Access-Control-Allow-Origin: *` em requisições preflight `OPTIONS`), o navegador bloqueará sumariamente todas as requisições. Além disso, enviar a chave de API diretamente pelo navegador a expõe em texto puro na aba Network do DevTools.
* **Rationale & Recommendation:** Validar se a API pública da NVIDIA aceita preflight CORS de origens de browser ou rotear as chamadas através de uma Supabase Edge Function ou proxy reverso intermediário seguro.

---

### 6. Ausência de Mecanismo de Fila e Tratamento de Rate Limit no Chunker de Markdown - Severity: Major
* **Reviewer Lens:** `egm-design` & `egm-structural`
* **Affected Scope:** Linhas 56–60, 171–191
* **Discrepancy Description:** Documentos exportados do NotebookLM frequentemente contêm entre 15.000 e 40.000 palavras. Ao serem particionados em chunks de 1.200 tokens, serão gerados dezenas de blocos independentes. Se disparadas em paralelo, o navegador esgotará sockets e atingirá instantaneamente os limites de taxa (HTTP 429 - RPM/TPM) das APIs do Gemini ou NVIDIA NIM. Não há especificação de retry com exponential backoff ou persistência parcial em caso de falha.
* **Rationale & Recommendation:** Definir um executor de fila com concorrência limitada (ex: 2 chunks concorrentes), backoff exponencial para respostas 429 e salvamento incremental no Supabase.

---

### 7. Violação de Regra de Negócio em `flashcards.kind` e Omissão de `content_id` em `study_sessions` - Severity: Major
* **Reviewer Lens:** `egm-structural`
* **Affected Scope:** Linhas 141–149
* **Discrepancy Description:**
  1. A tabela `flashcards` define `kind text default 'question' check (kind in ('theory', 'question'))`. A Regra 5 do `AGENTS.md` determina categoricamente: *"Flashcards gerados por IA são destinados exclusivamente a questões... enquanto o conteúdo teórico compõe a apostila (studyGuide)"*. A existência do tipo `'theory'` em flashcards contraria a arquitetura oficial do domínio.
  2. A tabela `study_sessions` não possui a coluna `content_id`, impossibilitando métricas de retenção e tempo de estudo segregados por apostila/conteúdo. Adicionalmente, a unidade da coluna `time_spent` (segundos vs minutos) não foi explicitada.
* **Rationale & Recommendation:**
  1. Remover `'theory'` da restrição de `flashcards.kind`, mantendo apenas `'question'`.
  2. Adicionar `content_id uuid references public.contents(id) on delete set null` na tabela `study_sessions` e explicitar `time_spent_seconds integer not null default 0`.

---

### 8. Chunker Sem Especificação de Algoritmo de Tokenização e Sem Fallback Estrutural - Severity: Major
* **Reviewer Lens:** `egm-structural`
* **Affected Scope:** Linhas 171–176
* **Discrepancy Description:** O `HierarchicalMarkdownChunker` exige particionamento limitado a 1.200 tokens, mas não especifica qual biblioteca ou algoritmo fará essa contagem no browser. Ademais, o documento não define o comportamento de fallback caso o arquivo Markdown não possua cabeçalhos H1/H2/H3 ou contenha blocos únicos de código/tabelas que superem 1.200 tokens isoladamente.
* **Rationale & Recommendation:** Especificar uma estimativa leve de tokens baseada em caracteres/palavras (~4 caracteres por token) e definir fallback explícito para quebra por parágrafos duplos (`\n\n`) quando não houver cabeçalhos detectados.

---

### 9. Metadado de Status Incorreto no Cabeçalho do Documento - Severity: Nit
* **Reviewer Lens:** `egm-structural`
* **Affected Scope:** Linha 4
* **Discrepancy Description:** A linha 4 indica `* **Status:** Approved / Finalized`. No entanto, o documento está em pleno Stage 7 (Critic Review).
* **Rationale & Recommendation:** Alterar o status para `Draft / In Review`.

---

### 10. Linguagem Promocional e Adjetivos Hiperbólicos - Severity: Nit
* **Reviewer Lens:** `egm-style`
* **Affected Scope:** Linhas 17, 18, 29, 39, 187, 243, 248
* **Discrepancy Description:** O texto emprega termos hiperbólicos como *"formato de simulado idêntico ao exigido pela Microsoft"*, *"Expurgar o provedor OmniRoute"* e *"preparação incomparavelmente superior"*.
* **Rationale & Recommendation:** Higienizar o texto removendo adjetivos apelativos e adotando terminologia técnica sóbria e concisa.

---

### 11. Timer de Transição de Fase Não Especificado no CUJ 2 - Severity: Nit
* **Reviewer Lens:** `egm-structural`
* **Affected Scope:** Linha 64
* **Discrepancy Description:** O CUJ 2 cita *"Ao concluir ou transbordar o tempo, entra na Fase 2"*, porém o plano técnico não detalha se a transição é forçada por timer ou manual.
* **Rationale & Recommendation:** Definir claramente que a transição é sempre manual por botão ("Pronto para Praticar"), usando o tempo estimado como métrica puramente orientadora sem cronômetro punitivo.
