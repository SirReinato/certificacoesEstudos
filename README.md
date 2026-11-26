# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.

## Fila de estudo do SafeZone Studies

A revisão diária e a prática por tema colocam as questões vencidas antes das inéditas, com até 40 questões por sessão. Quando todas as questões do tema estão agendadas para o futuro, a tela mostra a próxima revisão. **Praticar agora** abre um treino extra sem alterar o agendamento ou o histórico.

Execute `npm run test:e2e` para verificar o fluxo no Chromium. A suíte usa um servidor Vite local exclusivo na porta 55173 e simula o Supabase no fluxo de estudo.

Uma questão marcada como **Errei** ou **Novamente** volta uma vez no fim da sessão. Os botões de nota mostram o intervalo calculado pelo SM-2. Você pode encerrar a prática mesmo com questões pendentes.

Use **Encerrar por hoje** para salvar uma sessão parcial. O histórico em **Atividade** mostra o tema, a duração e as contagens. Uma pergunta aberta sem avaliação continua disponível na próxima sessão.

As novas apostilas são geradas em tópicos curtos. Quando a fonte traz os detalhes necessários, cada tópico pode incluir uma síntese, um cenário Azure e um critério de decisão para a prova. As apostilas anteriores continuam disponíveis.
