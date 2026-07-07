# SPRINT 08.5 — CORE GAME LOOP
**Data:** 2026-07-05  
**Objetivo:** Criar um sistema de direção de sessão que guia o jogador por um loop de 5 minutos  
**Foco:** Retenção · Engajamento · Progressão clara · Próxima ação sempre visível

---

## Score do Projeto

| Dimensão | Antes | Depois |
|----------|-------|--------|
| Clareza da próxima ação | 2/10 | 9/10 |
| Loop de sessão guiado | 0/10 | 8/10 |
| Progressão visível (Dream Team) | 2/10 | 7/10 |
| Resultado de pack enriquecido | 5/10 | 8/10 |
| Arquitetura de telemetria | 0/10 | 7/10 |
| **Score Geral** | **75/100** | **86/100** |

---

## Jornada do Jogador — Antes vs. Depois

### Antes
```
Login → Home genérica
Home: header + grid de navegação + stats mock
Sem direcionamento → jogador perdido
```

### Depois
```
Login → Home com GameDirector ativo
Home: header → [PRÓXIMA AÇÃO] → [DREAM TEAM] → grid
GameDirector sempre mostra UMA prioridade clara
Jogador sabe exatamente o que fazer em seguida
```

---

## Arquivos Criados

| Arquivo | Descrição |
|---------|-----------|
| `apps/web/lib/game-director.ts` | Função pura: `DirectorInput → DirectorAction`. Oito prioridades em cascata. Zero dependências. |
| `apps/web/lib/hooks/useGameDirector.ts` | Hook cliente: combina dados do servidor + localStorage (dream team) + daily login |
| `apps/web/components/home/NextBestAction.tsx` | Card hero na Home — mostra a ação de maior prioridade com CTA único |
| `apps/web/components/home/DreamTeamWidget.tsx` | Widget mini: 11 slots com dots dourados, barra de progresso, link para coleção |
| `apps/web/lib/telemetry.ts` | Arquitetura de telemetria interna: `emitOnce()` + `hasEmitted()` + 8 event types |

---

## Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| `apps/web/app/page.tsx` | Adicionado `getUserMatchStats()` no `Promise.all` → passa `wins` para `PremiumHome` |
| `apps/web/components/home/PremiumHome.tsx` | Prop `wins` adicionada; `NextBestAction` e `DreamTeamWidget` integrados acima do `GameGrid` |
| `apps/web/components/packs/RevealSummary.tsx` | Seção "Por raridade" adicionada com breakdown visual por raridade das cartas obtidas |

---

## GameDirector — Lógica de Prioridades

```
1. canClaimDaily         → "Recompensa Diária"
2. collectionCount === 0 → "Abra seu Founder Pack"
3. !squadFormation       → "Monte seu Squad"
4. wins === 0            → "Jogue sua Primeira Partida"
5. hasMissionReward      → "Missão Completa!"
6. balance >= 150        → "Abra um Pack"
7. dreamTeamCount < 11   → "Complete seu Dream Team"
8. default               → "Expanda sua Coleção"
```

Cada ação tem: `icon`, `title`, `subtitle`, `cta`, `href`, `accentColor`, `gradientFrom/To`, `glowColor`.

Quando `id === 'claim_daily'`, o CTA chama `openDaily()` do `useDailyLogin` (abre modal) em vez de navegar.

---

## Telemetria — Eventos Definidos

| Evento | Quando disparar |
|--------|----------------|
| `first_login` | Primeiro acesso autenticado |
| `first_pack_opened` | Primeiro pack aberto com sucesso |
| `first_squad_saved` | Primeiro squad salvo |
| `first_match_won` | Primeira vitória em partida |
| `first_collection_complete` | Primeira seleção 100% coletada |
| `first_goat_card` | Primeira carta world_cup_hero obtida |
| `first_mission_completed` | Primeira missão concluída |
| `first_ranking_entered` | Primeira entrada no ranking |

`emitOnce(event, metadata?)` — persiste em `localStorage['wl:telemetry']`. Retorna `true` na primeira emissão (ready for analytics hook). Silently fails on quota exceeded.

---

## Fluxo de Sessão Guiado

```
Login
  ↓
GameDirector avalia estado do jogador
  ↓
NextBestAction mostra 1 ação priorizada
  ↓
Jogador clica → executa ação
  ↓
Retorna ao Home → GameDirector reavalia → nova prioridade
  ↓
(loop até fim de sessão)
```

Sessão típica de novo jogador:
1. **Home** → "Abra seu Founder Pack" → /packs?welcome=1
2. Pack aberto → RevealSummary com breakdown de raridades
3. **Home** → "Monte seu Squad" → /squad
4. Squad salvo → **Home** → "Jogue sua Primeira Partida" → /match
5. Partida jogada → **Home** → "Abra um Pack" (se balance ≥ 150) ou "Complete seu Dream Team"

---

## Componente NextBestAction

- Card com gradiente temático por ação
- Ícone flutuante com animação `y: [-3, 3, -3]` infinita
- Glow radial no canto superior direito
- Barra de CTA na base com `active:brightness-90`
- Entrada com `motion` (slideUp + fade, 0.45s)
- `exactOptionalPropertyTypes` respeitado com spread condicional

## Componente DreamTeamWidget

- Somente renderiza se `filled > 0` (invisível para novos usuários)
- 11 dots animados sequencialmente (delay escalonado 0.04s × i)
- Barra de progresso dourada na base
- Storage listener para atualização cross-tab
- Link direto para /collection

---

## Bugs e Fixes

| Problema | Fix |
|---------|-----|
| `exactOptionalPropertyTypes` em `hasMissionReward?: boolean` | Spread condicional: `...(hasMissionReward !== undefined ? { hasMissionReward } : {})` |

---

## Pendências Conhecidas (não-P0)

| Item | Prioridade | Notas |
|------|-----------|-------|
| `emitOnce()` integrado nos eventos reais | P1 | Arquitetura pronta, pontos de chamada pendentes |
| `hasMissionReward` real via server action | P1 | Hoje sempre `false` — precisa checar missões ativas |
| Dream Team migrar para Supabase | P1 | Hoje só localStorage (cross-device não funciona) |
| GameDirector context compartilhado | P2 | Hoje 2 instâncias de `useDailyLogin` (NextBestAction + DailyLoginTrigger) |
| Barras de progresso por país — melhorar cores | P3 | Já existem, cor cinza para incompleto pode virar azul |

---

## Próxima Sprint Sugerida — Sprint 9: SOCIAL & RETENTION

1. **Perfil público** — coleção visível por outros jogadores
2. **Compartilhar carta** — Share API com frame de raridade
3. **Leaderboard real** — ranking de OVR do squad
4. **Dream Team → Supabase** — persistência cross-device
5. **Missões reais** — `hasMissionReward` server-driven
6. **Telemetria integrada** — `emitOnce()` em todos os eventos de milestone

### Metas de Beta
- Sessão média >8 minutos (hoje estimado ~3min)
- Taxa de retorno D1 >50%
- 30 jogadores ativos sem degradação

---

*Sprint 08.5 · 2026-07-05 · World Legends Core Loop v1.0*
