# Meu Planner

App de organização pessoal (diário, hábitos, saúde, metas, finanças, leituras) — sem limite fixo de páginas, ao contrário do PDF original. Vite + Vanilla JS + Supabase.

## Setup

1. `npm install`
2. Copie `.env.example` pra `.env` e preencha com a URL e a anon key do seu projeto Supabase:
   ```
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   ```
3. Rode o `schema.sql` (que já criamos) no SQL Editor do Supabase, se ainda não rodou.
4. Em **Authentication → Providers**, confirme que **Email** está habilitado (é o método usado no login).
5. `npm run dev` pra testar local.

## Build / Deploy

`npm run build` gera a pasta `dist/`. Deploy via Vercel do mesmo jeito que o Totaliz/SigmaPEP — só lembrar de configurar as variáveis de ambiente `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no painel da Vercel também (não só no `.env` local).

## Estrutura

```
src/
  main.js          → bootstrap, auth guard, registro de rotas
  router.js         → roteador simples via hash (#/diario, #/metas...)
  state.js           → estado compartilhado (mês/ano/usuário atual)
  supabaseClient.js  → cliente único do Supabase
  auth.js            → login/signup/logout
  style.css          → tema "caderno de contabilidade"
  pages/
    login.js
    shell.js         → sidebar + fita marcadora de mês
    inicio.js
    diario.js        → mensal/semanal/diário
    habitos.js       → hábitos + consultas + medicações
    metas.js
    financas.js
    leituras.js      → livros + filmes/séries
```

## O que falta (próximos passos)

- Ícones do PWA (`public/icons/icon-192.png`, `icon-512.png`) — ainda não existem
- Mural dos sonhos / Figurinhas / Diário de gratidão (do PDF original) — não migrados ainda, dá pra adicionar depois seguindo o mesmo padrão de `metas.js`
- Editar consultas/medicações usa `prompt()` por enquanto — funcional, mas merece um formulário de verdade quando você for polir a UI
