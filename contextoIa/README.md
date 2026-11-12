# Contexto do projeto para agentes de IA

> **Início obrigatório:** antes de qualquer análise ou alteração, leia este arquivo. Ele resume o projeto e aponta onde confirmar cada detalhe no código.

## Regra obrigatória de atualização

Sempre que uma alteração modificar algo importante para entender, executar ou manter o projeto — como arquitetura, rotas, fluxos, modelos de dados, API, persistência, integrações, configuração ou comandos — atualize este contexto no mesmo trabalho. Não espere o usuário pedir.

**Comando para solicitar a revisão explicitamente:** `ATUALIZAR CONTEXTO IA`

Ao receber esse comando, percorra as mudanças relevantes, confira os arquivos afetados, atualize este documento e valide que as instruções continuam corretas. Se o comando vier junto com uma implementação, faça essa atualização antes de encerrar a tarefa. Não registre segredos, dados pessoais ou conteúdo do banco.

## Visão geral

**SafeZone Studies** é uma aplicação web para organizar materiais de estudo e preparar para as certificações Microsoft Azure **AI-200** e **AI-103**. O usuário importa conteúdo, gera flashcards com IA, estuda com repetição espaçada e acompanha métricas.

É uma SPA em React servida pelo Vite, com uma API HTTP em Node.js e banco SQLite. O PWA pode armazenar recursos estáticos para uso offline; operações de dados dependem da API disponível.

## Tecnologias e execução

- React 19, TypeScript 6, React Router 7 e `styled-components`.
- Vite 8 para desenvolvimento e build; `vite-plugin-pwa` para manifest e cache de recursos.
- API sem framework em `server/index.mjs`, usando `node:http` e `node:sqlite`.
- Banco padrão em `data/safezone.db`; `DB_PATH` altera o caminho e `PORT` a porta da API (padrão `3001`).
- O runtime do Node deve oferecer `node:sqlite`.

Comandos definidos em `package.json`:

| Comando | Uso |
|---|---|
| `npm install` | Instalar dependências |
| `npm run dev` | Iniciar API e Vite; frontend em `5173`, API em `3001` |
| `npm run server` | Iniciar somente a API |
| `npm run build` | Executar `tsc -b` e gerar build de produção |
| `npm run preview` | Servir o build localmente em `4173` |
| `npm run lint` | Executar Oxlint |
| `npm run graph:generate` | Gerar relatório de dependências de `src/` com Madge |
| `npm run graph:circular` | Procurar dependências circulares em `src/` |
| `npm run graph:deps` | Resumir dependências de `src/` |

Não há script de testes configurado no `package.json`.

## Arquitetura e caminhos principais

```text
src (React SPA)
  ├─ pages/components/hooks
  ├─ services (extração de conteúdo e geração de flashcards)
  └─ storage (cliente HTTP /api)
          │
          ├─ Vite proxy /api → localhost:3001
          └─ server/index.mjs → SQLite (data/safezone.db)
```

- `src/main.tsx`: montagem React; `src/App.tsx`: tema, roteamento e layout.
- `src/pages/`: telas:
  - `/` — dashboard e indicadores.
  - `/biblioteca` — busca, filtros e gerenciamento de conteúdos.
  - `/biblioteca/novo` — importação de PDF, link ou texto.
  - `/estudo` — sessão de flashcards; aceita `?content=<id>` para focar conteúdo.
  - `/config` — tema, metas, IA, backup e privacidade.
  - `/atividade` — histórico e estatísticas de estudo.
- `src/components/layout/`: cabeçalho, menu lateral e layout da aplicação.
- `src/components/dashboard/`: mentor, mapa de atividade e distribuição de retenção.
- `src/hooks/index.ts`: hooks de biblioteca, ingestão, configurações e inicialização da API; também contém outra implementação de `useStudySession`.
- `src/hooks/useStudySession.ts`: implementação usada por `EstudoDiario` para sessão, seleção/ordenação de cartões e cálculo de repetição. Ao alterar estudo, confira também o hook paralelo em `src/hooks/index.ts`.
- `src/services/contentIngestion.ts`: extração de PDF com PDF.js, captura e limpeza de links, validação e divisão do texto em chunks.
- `src/services/aiService.ts`: prompts, provedores de IA, parsing e balanceamento de flashcards.
- `src/services/aiMentorService.ts`: insights derivados do histórico e dos cartões.
- `src/storage/index.ts`: cliente HTTP e serviços para dados; `src/storage/syncService.ts`: chamadas de sincronização.
- `src/types/index.ts`: contratos centrais de conteúdo, chunks, flashcards, sessões, configurações e exames.
- `src/utils/sm2.ts`: algoritmo SM-2; `src/utils/uuid.ts`: geração de IDs.
- `src/theme/`: tokens, cores, tipografia, temas claro/escuro e provider.
- `server/index.mjs`: schema, carga inicial, rotas da API e armazenamento dos PDFs originais em `data/uploads/` (ignorado pelo Git).
- `vite.config.ts`: configuração Vite, proxy de extração de links e PWA.
- `public/`: ícones PWA e favicon.

## Fluxos e regras de negócio

### Entrada de conteúdo e geração de cartões

1. A tela `NovoConteudo` valida e recebe um PDF, URL ou texto.
2. A ingestão extrai texto, normaliza e cria chunks; PDFs de até 50 MB com texto selecionável têm seu original salvo pelo servidor em `data/uploads/` e seu conteúdo extraído no SQLite. PDFs digitalizados não são processados por OCR.
3. Links tentam primeiro o proxy `/api/fetch` do Vite (dev/preview), depois serviços externos de fallback e, por fim, acesso direto. O proxy local aceita HTTP/HTTPS, limita resposta a 5 MB e usa timeout.
4. `useContentProcessor` salva o conteúdo, identifica AI-200/AI-103 e chama a IA; em erro, tenta remover o conteúdo criado.
5. `aiService` gera chamadas sequenciais com limite de 30 chunks, consolida uma apostila estruturada por conteúdo e cria flashcards somente para questões (até 50, deduplicadas).

Provedores suportados: Gemini (padrão), OpenAI, Anthropic, Azure OpenAI, local/Ollama e OmniRoute. Há configurações de chave/modelo/endpoint na tela de configurações; não leia nem registre valores secretos. Consulte `src/hooks/index.ts`, `src/services/aiService.ts` e `src/pages/Configuracoes.tsx` para nomes e comportamento atuais.

### Estudo

Flashcards são selecionados por vencimento/novidade e podem ser filtrados por conteúdo. Conteúdos com apostila abrem primeiro uma etapa de leitura e depois a sessão pratica questões com flashcards. A proporção 30% leitura / 70% questões é uma meta de tempo orientadora, sem cronômetro obrigatório. Revisões diárias sem módulo focado mostram apenas questões; o hook de estudo exclui cartões antigos marcados como teoria. O usuário avalia cada cartão como `again`, `hard`, `good` ou `easy`; o algoritmo de repetição está em `src/utils/sm2.ts`. Atalhos da tela: Espaço para virar o cartão e teclas 1–4 para avaliar.

### Persistência e API

O cliente em `src/storage/index.ts` usa `/api`; os dados persistentes atuais ficam no SQLite do servidor, não em IndexedDB. Há textos da interface e comentários antigos que ainda citam IndexedDB; confirme o código antes de assumir o mecanismo de persistência.

O servidor cria/usa tabelas para `contents`, `flashcards`, `study_sessions`, `settings`, `exams` e `sync_meta`; semeará configurações e objetivos AI-200/AI-103 se necessário. `contents.studyGuide` guarda em JSON as seções da apostila; uma migração adiciona essa coluna a bancos já existentes. Os PDFs originais ficam como arquivos em `data/uploads/` (ou ao lado do banco definido por `DB_PATH`); não são incluídos no backup JSON. Exportação e importação JSON incluem o material de estudo. As rotas cobrem:

- conteúdos: listagem/busca, criação, detalhe, atualização, exclusão e estatísticas;
- PDFs de origem: envio e leitura do original por conteúdo;
- flashcards: listagem, novos, vencidos, estatísticas, criação em lote e atualização;
- sessões: criação, atualização, histórico recente/por data, streak e totais;
- configurações e exames;
- sincronização de versões, exportação/importação JSON e reset dos dados.

Ao alterar contratos ou comportamento persistente, mantenha `src/types/index.ts`, `src/storage/index.ts` e `server/index.mjs` coerentes.

## Convenções de manutenção

- Confirme o estado real no código; este documento é um mapa, não substitui a implementação.
- Preserve TypeScript e os padrões existentes de componentes e estilos com `styled-components`.
- Mudanças de API/dados normalmente exigem revisar o cliente, tipos e servidor em conjunto.
- Antes de encerrar mudanças funcionais, rode ao menos `npm run build` e `npm run lint` quando aplicável.
- Nunca coloque chaves, valores de `.env`, dados pessoais ou conteúdo do banco neste arquivo. O banco e a pasta `.env` são dados locais; use apenas variáveis de ambiente documentadas pelo código.
