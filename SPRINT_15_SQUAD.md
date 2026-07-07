# Sprint 15 — Squad Builder Complete

**Objetivo:** Transformar a tela de Squad em nível Ultimate Team.

---

## 1. Fluxo de Seleção de Jogador (novo)

Antes: clicar num slot vazio apenas destacava o slot e o usuário tinha que tocar no card no `CardPoolSheet` abaixo.

Agora: clicar num slot vazio abre `PlayerSelectModal` — uma bottom sheet que sobe com spring animation cobrindo ~78% da tela.

**`PlayerSelectModal.tsx`** (novo componente):
- Pre-filtrado pelo setor do slot clicado (GK → chip GK ativo, DEF → chip DEF ativo, etc.)
- Cards ordenados: `natural fit` primeiro, depois `ok`, depois `awkward` — cada grupo por OVR desc
- Dot de compat no canto superior direito: verde (natural), amarelo (ok), vermelho (awkward)
- Cards com compat `awkward` ficam com opacity 40%
- Search por nome, posição, país
- Chips de setor: TODOS / GK / DEF / MID / ATT
- Tap → `PLACE_IN_SLOT` → modal fecha automaticamente → auto-save dispara (1.5s debounce)
- Backdrop click fecha o modal

---

## 2. Auto Build (5 modos)

O botão "auto-fill" foi substituído por "auto build" que abre `AutoBuildSheet`.

**`AutoBuildSheet.tsx`** (novo componente):
| Modo | Ícone | Lógica |
|------|-------|--------|
| Melhor Time | 🏆 | Greedy por OVR decrescente por posição |
| Melhor Química | ⚡ | Detecta a nacionalidade dominante no top-40, prioriza esses jogadores |
| Só Brasileiros | 🇧🇷 | Filtra `nationality === 'BR'` primeiro, completa com restantes |
| Só GOATs | 👑 | Filtra `rarityCode in ['ultra', 'world_cup_hero']` primeiro |
| Dream Team | ⭐ | Filtra favoritos primeiro (favoriteIds via DB), completa com restantes |

Modos desabilitados (disabled + texto "Sem jogadores disponíveis") quando:
- Dream Team: sem favoritos no card pool
- Só Brasileiros: sem jogadores BR na coleção
- Só GOATs: sem Ultra/WCH na coleção

**Algoritmo greedy** (`autoBuildSlots` em `squad-builder.ts`):
```
Para cada slot da formação, em ordem:
  → Pega o primeiro candidato compatível (não-'awkward') ainda não usado
  → Assign ao slot
```

---

## 3. Análise do Time (SquadOvrPanel)

Nova seção "Análise" na aba lateral (desktop) com 3 métricas calculadas em tempo real:

| Métrica | Cálculo |
|---------|---------|
| País | Nacionalidade mais frequente entre os 11 titulares (com flag + código) |
| Geração | Média das décadas de carreira (ex: média 1993→ "1990s") |
| Década | Era (`era` field) mais frequente entre os titulares |

---

## 4. Formações Confirmadas

Todas as 5 formações já estavam implementadas em `lib/squad-data.ts`:
- 4-3-3, 4-4-2, 4-2-3-1, 3-5-2, 5-3-2

---

## 5. Dados de Favoritos no Squad Builder

`apps/web/app/squad/page.tsx` agora fetcha `favoriteIds` em paralelo com a coleção do usuário e passa como `ReadonlySet<string>` para `PitchBuilder`. Isso permite o modo Dream Team no Auto Build.

---

## 6. Arquivos Modificados

| Arquivo | Tipo |
|---------|------|
| `apps/web/components/squad/premium/PlayerSelectModal.tsx` | NOVO |
| `apps/web/components/squad/premium/AutoBuildSheet.tsx` | NOVO |
| `apps/web/lib/squad-builder.ts` | MODIFICADO — AutoBuildMode + AUTO_BUILD action + autoBuildSlots() |
| `apps/web/components/squad/premium/PitchBuilder.tsx` | MODIFICADO — integra os 2 novos modais, favoriteIds prop |
| `apps/web/components/squad/premium/SquadOvrPanel.tsx` | MODIFICADO — seção Análise |
| `apps/web/app/squad/page.tsx` | MODIFICADO — fetcha favoriteIds server-side |

---

## 7. Build & Qualidade

```
pnpm --filter @world-legends/web build  → ✓ sucesso
biome check (arquivos modificados)      → 0 erros, 11 warnings (pré-existentes)
/squad bundle                           → 32.5 kB (293 kB first load JS)
```

Commit: `33778514`

---

## Próximos Passos

**Sprint 16 — Match Engine** — motor de partidas com OVR/Química/Traits influenciando resultado, AI profiles, eventos, MVP, XP para jogadores e usuário.
