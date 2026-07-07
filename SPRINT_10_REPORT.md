# SPRINT 10 — COLLECTION 2.0
**Data:** 2026-07-05  
**Objetivo:** Transformar a coleção no principal motivo para abrir packs  
**Foco:** Museu · Coleções temáticas · Conquistas · Animação de conclusão

---

## Comparação Visual

### Antes — 3 tabs
```
┌─────────────────────────────────┐
│  📖 ÁLBUM  │  🏆 HALL OF FAME  │  ⭐ DREAM TEAM  │
└─────────────────────────────────┘
```
Apenas organização por país. Sem conquistas. Sem categorias.

### Depois — 4 tabs
```
┌──────────────────────────────────────────────────────┐
│  🏛️ MUSEU  │  📖 ÁLBUM  │  🏆 HALL  │  ⭐ DREAM  │
└──────────────────────────────────────────────────────┘

MUSEU:
  ├── Coleções Temáticas (colapsáveis)
  │     ├── 🏆 Copa do Mundo (WCH cards)
  │     ├── ⏳ Anos 50-60
  │     ├── 🌟 Anos 70
  │     ├── ⭐ Anos 80
  │     ├── 🔥 Anos 90
  │     ├── 🧤 Goleiros
  │     ├── 🛡️ Defensores
  │     ├── 🎵 Meias
  │     └── ⚽ Atacantes
  └── Conquistas (10 badges)
        ├── 🃏 Primeira Carta
        ├── 📦 Colecionador (10 cartas)
        ├── 🎖️ Veterano (50 cartas)
        ├── 🏟️ Hall das Lendas (100 cartas)
        ├── ✨ Lendário (1 carta Legendary)
        ├── 💎 Ultra Raro (1 carta Ultra)
        ├── 🏆 Herói da Copa (1 WCH)
        ├── ⭐ Dream Team (11 lendas)
        ├── 🌍 Coleção Completa (1 país)
        └── 🌐 Multi-Nacional (3 países)
```

---

## Arquivos Criados

Nenhum arquivo novo criado — tudo integrado em `HallOfLegendsExperience.tsx`.

## Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| `apps/web/components/hall-of-legends/HallOfLegendsExperience.tsx` | +4° tab MUSEU · CategoryData · Conquistas · CompletionBurst upgrade |

---

## Funcionalidades Adicionadas

### 1. Tab MUSEU (nova)
- Tab padrão ao abrir `/collection` (mais impactante que o álbum)
- Header com contagem de conquistas desbloqueadas
- Computado por `useMemo` a partir dos mesmos `catalogCards` e `ownedCardIds`

### 2. Coleções Temáticas (CategorySection)
- 9 categorias computadas dinamicamente do catálogo
- Cada categoria mostra: nome, subtítulo, progresso (n/total), % completo, barra animada
- Badge "✓ COMPLETO" quando 100% com borda dourada
- Grid de cartas (AlbumSlot) igual ao álbum por país
- Colapsável — abre uma de cada vez
- Copa do Mundo abre por padrão

### 3. Conquistas (BadgeCard)
- 10 conquistas com desbloqueio dinâmico baseado nos dados do usuário
- Visual: ícone + nome + descrição + indicador "✓ DESBLOQUEADO"
- Bloqueadas mostradas em 50% opacidade (motivação para completar)
- Grid 2 colunas

### 4. Completion Burst Premium
- 36 partículas (antes: 20) com cores variadas (dourado, rosa, azul, verde)
- 14 tiras de confetti que caem de cima
- Som de conclusão via Web Audio API (acorde ascendente: C5→E5→G5→C6)
- Texto "✓ COMPLETO!" maior e com glow mais intenso

### 5. CategoryData (useMemo)
```typescript
const categoryData = useMemo(() => {
  // 9 categorias: copa, anos 50-60, 70, 80, 90, gk, def, mid, fwd
  // Filtra por rarityCode, era, position
  // Calcula completionPct, ownedCount por categoria
}, [catalogCards, ownedCardIds]);
```

### 6. Conquistas (useMemo)
```typescript
const conquistas = useMemo(() => {
  // 10 badges baseados em: ownedCards, isComplete countries, rarities, dreamTeamIds
}, [hallData, catalogCards, ownedCardIds, dreamTeamIds]);
```

---

## Sistema de Coleções por Categoria

| Categoria | Filtro | Cor |
|-----------|--------|-----|
| Copa do Mundo | `rarityCode === 'world_cup_hero'` | Dourado `#c9a84c` |
| Anos 50-60 | `era === '1950s' \|\| '1960s'` | Cinza `#94a3b8` |
| Anos 70 | `era === '1970s'` | Verde `#10b981` |
| Anos 80 | `era === '1980s'` | Âmbar `#f59e0b` |
| Anos 90 | `era === '1990s'` | Vermelho `#ef4444` |
| Goleiros | `position === 'GK'` | Índigo `#6366f1` |
| Defensores | DEF positions | Azul `#3b82f6` |
| Meias | MID positions | Verde `#10b981` |
| Atacantes | FWD positions | Vermelho `#ef4444` |

---

## Conquistas — Critérios de Desbloqueio

| Badge | Critério |
|-------|----------|
| Primeira Carta | `ownedCards >= 1` |
| Colecionador | `ownedCards >= 10` |
| Veterano | `ownedCards >= 50` |
| Hall das Lendas | `ownedCards >= 100` |
| Lendário | possui ≥ 1 carta Legendary |
| Ultra Raro | possui ≥ 1 carta Ultra |
| Herói da Copa | possui ≥ 1 WCH |
| Dream Team | `dreamTeamIds.size === 11` |
| Coleção Completa | ≥ 1 país com 100% |
| Multi-Nacional | ≥ 3 países com 100% |

---

## Pendências Conhecidas

| Item | Prioridade | Notas |
|------|-----------|-------|
| Animação sonora iOS | P1 | Web Audio API bloqueada sem gesto em alguns browsers iOS |
| Conquistas persistidas no Supabase | P1 | Hoje calculadas no cliente — sem histórico |
| Páginas premium por país (modal full-screen) | P2 | Clique na bandeira abre modal com stadium bg |
| Recompensa ao completar coleção (+200c) | P2 | Precisa de server action + invalidatePath |
| Capitães como categoria especial | P2 | Requer trait "Capitão" no catálogo |

---

*Sprint 10 · 2026-07-05 · World Legends Collection 2.0*
