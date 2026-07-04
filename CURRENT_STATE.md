# World Legends — Estado Atual do Produto

**Data:** 2026-07-04  
**Branch:** main  
**Sprint concluída:** Sprint 1 — Hardening

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 15 App Router |
| Runtime | Node.js, Vercel Edge/Serverless |
| Banco de dados | Supabase (PostgreSQL) |
| Auth | Supabase Auth + `@supabase/ssr` |
| Monorepo | pnpm workspaces + Turborepo |
| Testes | Vitest (node environment) |
| Animações | Framer Motion + Canvas 2D (partículas) |
| Áudio | Web Audio API (`lib/sound-manager.ts`) |
| Haptics | Vibration API (`lib/haptics.ts`) |

---

## Fluxos Funcionais

### Pack Opening (`/packs`)
**Estado: FUNCIONAL + PRODUÇÃO-PRONTO**

- Abertura de packs conectada ao Supabase (Server Action `openPackAction`)
- Atomicidade garantida: cartas criadas antes do débito; compensação automática se débito falhar
- Pity system lendo e escrevendo na tabela `pity_counters` (limiares: 40 legendary, 120 ultra)
- Saldo exibido a partir do servidor (Supabase) — sem flash de crédito errado
- Feedback de saldo insuficiente: banner animado + haptic, auto-descarte em 3s
- Experiência de reveal: sons, partículas Canvas 2D, confetti, camera shake, GoatReveal para WCH
- Erros de background (missões, achievements, pity save) capturados via Sentry

### Home (`/`)
**Estado: FUNCIONAL**

- Saldo de créditos carregado do Supabase (Server Component) — fonte autoritativa
- `PlayerHeader` exibe créditos do servidor; fallback para `GameContext` se prop ausente
- Daily Login Trigger ativo

### Match (`/match`)
**Estado: FUNCIONAL**

- Erros de pós-jogo (missões, achievements) capturados via Sentry em vez de silenciados

### Dashboard (`/dashboard`)
**Estado: PROTEGIDA**

- Retorna 404 em produção (rota de debug apenas para desenvolvimento)

---

## Rotas Disponíveis

| Rota | Estado |
|------|--------|
| `/` | Funcional |
| `/login` | Funcional |
| `/packs` | Funcional + Produção-pronto |
| `/match` | Funcional |
| `/collection` | Funcional (UI) |
| `/team` | Funcional (UI) |
| `/missions` | Funcional (UI) |
| `/album` | Funcional (UI) |
| `/ranking` | Mock |
| `/events` | Mock |
| `/market` | Mock |
| `/craft` | Mock |
| `/profile` | Mock |
| `/dashboard` | Bloqueada em produção (404) |

---

## Schema Supabase (tabelas ativas)

| Tabela | Uso |
|--------|-----|
| `profiles` | Perfil do usuário, saldo `soft_currency`, `hard_currency`, `fragment_balance`, `elo_rating` |
| `pity_counters` | Contadores de pity por usuário: `legendary_plus` (limiar 40), `ultra_plus` (limiar 120) |
| `pack_openings` | Log de abertura de packs |
| `user_cards` | Cartas pertencentes ao usuário |
| `mission_progress` | Progresso de missões diárias/semanais |
| `achievement_progress` | Progresso de achievements |

---

## Componentes de Pack (ativos)

| Arquivo | Responsabilidade |
|---------|-----------------|
| `PackExperience.tsx` | Máquina de estados principal (SELECT → FLOAT → CHARGE → BURST → REVEAL → DONE) |
| `PackFloatScene.tsx` | Animação do pack flutuando antes da abertura |
| `PackSelector.tsx` | Grid de seleção de packs |
| `CardRevealScene.tsx` | Flip sequencial das cartas com efeitos por raridade |
| `RevealedCard.tsx` | Carta individual com animação de flip, som e haptic |
| `GoatReveal.tsx` | Sequência cinematográfica para carta World Cup Hero |
| `ExplosionOverlay.tsx` | Explosão de partículas Canvas 2D no BURST |
| `ConfettiCanvas.tsx` | Confetti por raridade (Canvas 2D) |
| `RevealSummary.tsx` | Tela de sumário após todas as cartas reveladas |

---

## Observabilidade

- **Sentry:** integrado via `lib/crash/sentry.ts`, captura erros de background em packs e match
- **Logs:** erros de abertura de pack logados via `console.error` (client-side fallback)

---

## Testes

| Arquivo | Cobertura | Resultado |
|---------|-----------|-----------|
| `tests/index.test.ts` | Bootstrap | ✓ 1/1 |
| `tests/mock-api.test.ts` | Contratos de dados/API | ✓ 23/23 |
| `tests/lib/pack-action.test.ts` | Pity system, atomicidade (P2, P4) | ✓ 26/26 |
| `tests/lib/mission-system.test.ts` | Sistema de missões | ⚠ 22/24 (2 pré-existentes) |
| `tests/lib/achievements.test.ts` | Achievements | ✓ 23/23 |
| `tests/lib/card-mastery.test.ts` | Card mastery | ✓ 33/33 |
| `tests/lib/collection-filters.test.ts` | Filtros de coleção | ✓ 15/15 |
| `tests/lib/collection-sets.test.ts` | Sets de coleção | ✓ 20/20 |
| `tests/lib/daily-login.test.ts` | Daily login | ✓ 23/23 |
| `tests/lib/match-experience.test.ts` | Experiência de match | ✓ 16/16 |

**Total:** 202 passando, 2 falhando (pré-existentes, não relacionados à Sprint 1).

---

## Problemas Conhecidos (pós-Sprint 1)

| ID | Descrição | Severidade |
|----|-----------|-----------|
| P3 | `GameContext` e Supabase ainda podem divergir para XP/level (apenas créditos foram unificados) | Média |
| P5 | Rotas mock sem fallback de loading state adequado | Baixa |
| P8 | Sem skeleton/loading state nas Server Components lentas | Baixa |
| MS-01 | `weekly_win20`, `achiev_first_goat` ausentes nas definições (testes falhando) | Baixa |

---

## Dependências de Ambiente

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...  # Não expor no cliente
SENTRY_DSN=...
```
