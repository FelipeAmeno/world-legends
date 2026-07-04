# Sprint 5 — Retention System

**Data:** 2026-07-04  
**Objetivo:** Criar o primeiro grande ciclo de retenção do jogo.  
**Regra:** Nenhuma mecânica, regra, economia, raridade, drop, balanceamento ou backend alterado.

---

## Arquitetura

```
retention-store.ts          ← localStorage (data, login, pack, win, mission, reward)
        ↓ markTodayAction()
RewardReveal                ← marca login + reward ao coletar daily login
MissionCard                 ← marca mission ao coletar missão
        ↓ wl:retention-update (DOM event)
ProgressTracker             ← reage e atualiza checklist em tempo real

DailyLoginTrigger           ← controla o modal, ouve wl:open-daily-login
        ↑ wl:open-daily-login
RetentionPanel              ← dispara o evento ao clicar no card de login

useDailyLogin (hook)        ← único ponto de dados do daily login (Supabase)
DailyLoginModal             ← calendário de 30 dias usando os mesmos dados
StreakBadge                 ← tiers visuais derivados de streakDays
```

### Fluxo do jogador

```
Entra no jogo
    │
    ├─ DailyLoginTrigger abre modal automaticamente (se canClaimToday)
    │       │
    │       └─ Claim → RewardReveal → haptic + sound + marca login/reward
    │
    ├─ Home mostra RetentionPanel
    │       ├─ Card esquerdo: daily login (pulsa quando há recompensa)
    │       └─ Card direito: missões (timer de reset)
    │
    ├─ Home mostra ProgressTracker
    │       └─ ✅ Login  ⬜ Pack  ⬜ Vitória  ⬜ Missão  ⬜ Recompensa
    │
    └─ Joga, abre pack, vence, coleta missão
            └─ Cada ação → markTodayAction() → ProgressTracker atualiza
```

---

## 1. Daily Login V2 — Calendário de 30 dias

**Arquivo modificado:** `components/daily-login/DailyLoginModal.tsx`  
**Reescrita completa — mesma interface `DailyLoginView`.**

### O que mudou

- **30 dias** em vez de 7: mapeados a partir do ciclo semanal de 7 dias (`(absoluteDay - 1) % 7`)
- **Scroll horizontal** com auto-scroll ao dia atual
- **Barras de progresso** mostrando `streakDays / 30`
- **Milestones** nos dias 7, 14, 21, 28 e 30 (marcador ★)
- **Próxima recompensa** sempre visível (slot seguinte ao atual sempre presente no scroll)
- **Streak interrompida**: mensagem de recuperação — "não desista!"
- **30 dias completos**: banner especial com 👑

### Geração dos 30 dias

```typescript
function build30Days(view: DailyLoginView): CalendarDay[] {
  return Array.from({ length: 30 }, (_, i) => {
    const absoluteDay = i + 1;
    const entry = view.schedule[i % 7]!;        // ciclo 7 dias
    const isMilestone = absoluteDay % 7 === 0 || absoluteDay === 30;
    return { absoluteDay, icon, label, extraCount, isMilestone, theme };
  });
}
```

### Estado de cada slot

| Condição | Visual |
|---------|--------|
| `absoluteDay ≤ streakDays` | ✓ verde, opacidade reduzida |
| `absoluteDay = streakDays + 1` (claimable) | glow dourado, animação pulse, anel pulsante |
| `absoluteDay = streakDays + 1` (já coletado) | ✓ verde, borda verde |
| `absoluteDay > streakDays + 1` | bloqueado, opacidade 45% |
| `isMilestone` | largura maior (68px vs 58px), ★ no label |

---

## 2. Streak Experience V2 — Multi-chama

**Arquivo modificado:** `components/daily-login/StreakBadge.tsx`  
**Reescrita completa — mesma interface `{ streakDays, nextMilestone }`.**

### Tiers visuais

| Dias | Exibição | Cor | Glow |
|------|---------|-----|------|
| 0 | "Comece hoje" | neutro | nenhum |
| 1–2 | 🔥 | âmbar | fraco |
| 3–6 | 🔥 (maior) | dourado | médio |
| 7–14 | 🔥🔥 | laranja | forte |
| 15–29 | 🔥🔥🔥 | laranja intenso | muito forte |
| 30+ | 👑 | amarelo dourado | arco-íris |

### Animações

- Chamas: `scale [1→1.12→1]` + `y [0→-3→0]` com delay escalonado por chama
- Coroa: `scale + rotate` oscilatório contínuo
- Barra de progresso: spring fill de 0 → pct ao montar

---

## 3. Daily Missions — Celebrações

**Arquivo modificado:** `components/missions/MissionCard.tsx`

**Adicionado no `handleClaim()`:**

```typescript
UI_HAPTIC.missionDone();          // padrão [50, 20, 80, 20, 120]
REWARD_SFX.missionDone();         // arpejo 440→550→660→880→1320 Hz
markTodayAction('mission');       // atualiza ProgressTracker
```

---

## 4. Weekly Missions

O sistema de missões semanais já existia e permanece intacto.  
O `RetentionPanel` no home agora direciona o jogador para `/missions` com um contador de reset visível.

---

## 5. Progress Tracker

**Arquivo criado:** `components/home/ProgressTracker.tsx`

Widget "Hoje você fez" com 5 ícones de status, exibido abaixo do `RetentionPanel` na home.

### Itens

| Chave | Ícone | Label | Quando marcado |
|-------|-------|-------|----------------|
| `login` | 📅 | Login | Ao coletar daily login (`RewardReveal`) |
| `pack` | 📦 | Pack | Quando abrir pack (futuro: marcar em PackExperience) |
| `win` | ⚽ | Vitória | Quando vencer partida (futuro: marcar em MatchResult) |
| `mission` | ✅ | Missão | Ao coletar missão (`MissionCard`) |
| `reward` | 🎁 | Recompensa | Junto com login |

### Comportamento

- Lê do `retention-store.ts` (localStorage)
- Escuta `wl:retention-update` e `storage` para atualizar sem reload
- Reset automático à meia-noite UTC (verificado a cada leitura)
- Quando todos 5 completos: `"🏆 Dia perfeito! Volte amanhã."`

---

## 6. Home Evolution

**Arquivo modificado:** `components/home/PremiumHome.tsx`  
**Arquivo criado:** `components/home/RetentionPanel.tsx`

### Nova ordem na home

```
PlayerHeader
EventBanner
QuickStats
RetentionPanel    ← NOVO: 2 cards lado a lado
ProgressTracker   ← NOVO: checklist de 5 ações
GameGrid
```

### RetentionPanel

Dois cards em grid 2 colunas:

**Card Esquerdo — Daily Login:**
- Ícone 🎁 pulsante + dot vermelho quando há recompensa
- Label "Coletar recompensa" vs "Login diário"
- Preview da próxima recompensa quando já coletou hoje
- Toque dispara `wl:open-daily-login` → DailyLoginTrigger abre modal

**Card Direito — Missões:**
- Label "Missões do dia" + badge DIÁRIAS
- Countdown até reset (atualiza a cada 30s)
- Barra de progresso placeholder (30%)
- Link para `/missions`

---

## 7. Celebrações

### Daily Login

Componente: `components/daily-login/RewardReveal.tsx`

| Elemento | Detalhe |
|---------|--------|
| 24 partículas | Douradas/brancas, burst radial a 55–140px |
| Haptic | `UI_HAPTIC.reward('large'|'medium')` |
| Som | `REWARD_SFX.missionDone()` |
| Rings expansivos | 2 ondas douradas a 1.0×→1.5×→2.2× |
| Chips de recompensa | Spring stagger, 0.5s + 0.1s/item |
| CTA | Spring, delay 0.7s |

### Missões

| Elemento | Detalhe |
|---------|--------|
| 20 partículas | 6 cores: gold, lime, white, blue, purple |
| Haptic | `UI_HAPTIC.missionDone()` |
| Som | `REWARD_SFX.missionDone()` |
| Toast | Spring bouncy, 3.5s auto-dismiss |
| Marcador | `markTodayAction('mission')` |

---

## 8. retention-store.ts

**Arquivo criado:** `lib/retention-store.ts`

Módulo puro (sem React) para rastrear ações diárias via localStorage.

```typescript
export type TodayAction = 'login' | 'pack' | 'win' | 'mission' | 'reward';

markTodayAction(action: TodayAction): void
getTodayProgress(): TodayProgress
```

- Chave de data: `wl_today_date` (ISO YYYY-MM-DD)
- Reset automático quando a data muda
- Dispatch de `wl:retention-update` ao marcar (sincroniza sem reload)

---

## Arquivos Criados

| Arquivo | Descrição |
|---------|-----------|
| `lib/retention-store.ts` | localStorage tracker diário |
| `components/home/ProgressTracker.tsx` | Checklist "hoje você fez" |
| `components/home/RetentionPanel.tsx` | Widget 2-colunas na home |

## Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| `components/daily-login/DailyLoginModal.tsx` | 30-day calendar, scroll, milestones |
| `components/daily-login/StreakBadge.tsx` | 4 tiers multi-chama com animações |
| `components/daily-login/RewardReveal.tsx` | Haptics + som + retention marks |
| `components/daily-login/DailyLoginTrigger.tsx` | Ouve `wl:open-daily-login` |
| `components/home/PremiumHome.tsx` | RetentionPanel + ProgressTracker adicionados |
| `components/missions/MissionCard.tsx` | Haptics + som + retention mark |
| `components/missions/ClaimToast.tsx` | 20 partículas coloridas |

---

## Checklist de Conformidade

- [x] Nenhuma mecânica de jogo nova adicionada
- [x] Nenhuma regra alterada
- [x] Economia intocada (créditos, XP, packs, drops)
- [x] Match Engine intocado
- [x] Raridades e drops intocados
- [x] Balanceamento intocado
- [x] **Zero server actions novas** — toda a lógica nova é client-side (localStorage)
- [x] Sistemas de Supabase do daily-login e missions: apenas lidos, nunca alterados
- [x] Build passa sem erros TypeScript (20/20 tasks)
- [x] Todos os sistemas são aditivos (backward compatible)

---

## Próximo Ciclo de Retenção (sugestões para Sprint 6)

- Marcar `pack` em `PackExperience` quando o jogador abre um pack
- Marcar `win` em `MatchResultScreen` quando o jogador vence
- Push notifications via PWA para lembrar o login diário
- Streak danger: notificação "Você vai perder sua sequência em X horas"
- Leaderboard de streaks entre amigos
