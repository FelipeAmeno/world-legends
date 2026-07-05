# SPRINT 07 — COLLECTION REPORT
**Data:** 2026-07-05  
**Objetivo:** Transformar a coleção no principal motivo de retenção do jogador  
**Referências:** Pokémon TCG Pocket · FIFA FUT · Panini Digital · Marvel Snap · Clash Royale

---

## Resumo Executivo

A coleção passou de uma lista de cartas com accordion de países para um **álbum lendário de futebol** com três abas distintas, navegação fullscreen por carta, Dream Team, Hall of Fame museal e filtros avançados. A base de código existente foi preservada — nenhuma mecânica de jogo, economia, engine ou Supabase foi alterada.

---

## Melhorias Implementadas

### 1. Header Premium — "WORLD LEGENDS COLLECTION"

**Antes:** Título "HALL OF LEGENDS", contador owned/total, barra de progresso básica.  
**Depois:**
- Título gradiente "COLEÇÃO" com eyebrow "World Legends"
- Row de stats inline: `📊 X%` · `🔍 N faltando` · `❤️ N favs` · `⭐ N/11 dream`
- Barra de progresso com glow dourado (`boxShadow: 0 0 10px rgba(201,168,76,0.6)`)
- Stats visíveis sem necessidade de abrir filtros
- Entrada animada com `initial={{ opacity: 0, y: -16 }}`

**Impacto:** Jogador vê imediatamente seu progresso e motivação para completar.

---

### 2. Sistema de Abas (3 abas)

Nova navegação por abas com indicador animado (`layoutId="tab-indicator"`):

| Aba | Ícone | Conteúdo |
|-----|-------|----------|
| ÁLBUM | 📖 | Accordion por países (existente + melhorias) |
| HALL OF FAME | 🏆 | Museu das raridades premium |
| DREAM TEAM | ⭐ | Time dos sonhos (até 11 cartas) |

Transição suave entre abas via spring animation.

---

### 3. Filtro "Faltando" (Missing Cards)

**Antes:** Sem filtro de cartas não possuídas.  
**Depois:**
- Pill `🔍 Faltando` na barra de filtros de posição
- Funciona em combinação com filtros de: Raridade · País · Posição · Favoritos
- Quando ativo, accordion mostra apenas slots vazios
- Empty state especial: "✅ Coleção completa!" quando todas foram obtidas

---

### 4. Progressão por Raridade (Melhorada)

**Antes:** Pills com label, %, barra, owned/total.  
**Depois:**
- Adicionado ✓ dourado quando 100% de uma raridade
- `whileTap={{ scale: 0.95 }}` em cada pill
- `boxShadow` glow quando ativo
- Showing owned/total com opacity reduzida no `/total`

---

### 5. Álbum Slot — Dual Action (❤️ + ⭐)

**Antes:** Coração de favorito no slot. Nenhuma navegação ao tocar.  
**Depois:**
- **Tap na carta** → navega para `/collection/[cardId]` (página fullscreen)
- **Botão ❤️** → toggle favorito (stopPropagation)
- **Botão ⭐** → toggle Dream Team (stopPropagation, max 11)
- `whileTap={{ scale: 0.92 }}` no slot inteiro
- `cursor-pointer` no container

---

### 6. Hall of Fame — Layout Museal

Nova aba com três seções:

**WORLD CUP HEROES (world_cup_hero):**
- Grid 2 colunas, cards `aspect-[3/4]` — os maiores
- Glow `rgba(226,232,240,0.4)` com borda branca
- OVR em 42px com gradiente branco→color

**ULTRA RARE:**
- Grid 3 colunas, cards `aspect-[2/3]`
- Glow `rgba(236,72,153,0.3)` com borda rosa

**LEGENDARY:**
- Grid 4 colunas, cards `aspect-[2/3]`
- Glow `rgba(201,168,76,0.25)` com borda dourada

Cada seção tem:
- Título com gradiente + `drop-shadow` glow
- Sub-título descritivo
- Linha decorativa gradiente
- Contador owned/total + %

Cartas não possuídas: silhueta animada com `?` pulsante.  
Cartas possuídas: OVR grande, flag, nome, botões de ação.

---

### 7. Dream Team Tab

**Antes:** Não existia.  
**Depois:**
- Header "MEU DREAM TEAM" com barra de progresso âmbar
- OVR médio calculado em tempo real
- Grid 3 colunas com glow por raridade
- Botão ✕ para remover card do Dream Team diretamente na aba
- Slots vazios exibidos com `⭐` fantasma + número
- Empty state animado quando nenhuma carta foi adicionada
- Banner "DREAM TEAM COMPLETO ⭐" quando 11/11 preenchidos
- Instrução contextual quando entre 1-10 cartas

**Armazenamento:** `localStorage['wl:dream-team']` (separado de `wl:collection:favorites`)

---

### 8. Página Fullscreen da Carta — `/collection/[cardId]`

**Antes:** Modal bottom-sheet (de `CollectionExperience`, não conectado ao Hall).  
**Depois:** Página completa `/collection/[cardId]` com:

**Server Component (`page.tsx`):**
- Busca carta via `getCollectionMap().get(cardId)` — O(1)
- Verifica `owned` via `getUserCollection`
- `notFound()` se cardId inválido

**Client Component (`CardFullPage.tsx`):**
- Background per-rarity com dois stops de gradiente
- Radial glow fixed no topo
- Botão ← Coleção com `router.back()`
- Hero: OVR 88px + nome font-display + flag + posição + era
- Rarity badge com glow point
- Bio (ou "???" se não possui)
- Atributos com barras animadas (stagger 80ms entre cada)
- Traits como pills com tier stars (★ / ★★ / ★★★)
- Grid de informações: Raridade · Edição · Época · Posição · País · Contratos
- CTA "Abrir Pack →" quando não possui
- Widget Dream Team (adicionar / remover / status)
- Botões ❤️ e ⭐ no header com spring animations

**UX não-possuída:** Atributos mostram "?" e barra a 0%, bio oculta, OVR com opacity 35%.

---

### 9. Microinterações

| Elemento | Interação |
|----------|-----------|
| AlbumSlot | `whileTap scale 0.92` |
| PosFilterPill | `whileTap scale 0.93` |
| RarityProgressPill | `whileTap scale 0.95` |
| MuseumCard | `whileTap scale 0.96` |
| Dream Team card | `whileTap scale` via motion.div |
| Tab indicator | `layoutId` spring transition |
| Atributos | stagger reveal 80ms, `duration: 0.7` ease-out |
| Traits | stagger scale spring entrada |
| Ações (❤️/⭐) | scale + rotate spring no click |
| Back button | `whileTap scale 0.92` |

---

### 10. Performance

| Técnica | Onde |
|---------|------|
| `useDeferredValue(search)` | Busca não bloqueia UI |
| `useMemo` | `hallData`, `filteredGroups`, `hallOfFameSlots`, `dreamTeamCards`, `posStats` |
| `useCallback` | Todos os handlers |
| `AnimatePresence` | Country sections, tabs |
| `delay: Math.min(index * 0.04, 0.4)` | Limita stagger máximo |
| `initial={false}` | AnimatePresence não reanima na montagem |
| `setTimeout(() => setShowAttrs(true), 600)` | Atributos renderizados após entrada da página |
| Accordion lazy | Cards só renderizados quando país aberto |
| `getCollectionMap()` | O(1) lookup por cardId |

---

## Componentes Criados

| Arquivo | Linhas | Descrição |
|---------|--------|-----------|
| `app/collection/[cardId]/page.tsx` | 20 | Server: busca carta + owned, passa para client |
| `components/collection/CardFullPage.tsx` | 310 | Client: fullscreen card detail |

---

## Componentes Alterados

| Arquivo | Mudança |
|---------|---------|
| `components/hall-of-legends/HallOfLegendsExperience.tsx` | Reescrito — abas, header, filtros, Dream Team, Hall of Fame |

---

## Antes / Depois

### Header
**Antes:** `HALL OF LEGENDS` · owned/total · progresso  
**Depois:** `COLEÇÃO` (gradiente dourado) · pills de stats · barra com glow · eyebrow "World Legends"

### Álbum Slot
**Antes:** Tap = nada, ❤️ favorito  
**Depois:** Tap = fullscreen card, ❤️ favorito, ⭐ Dream Team

### Filtros
**Antes:** Raridade + Posição + Favoritos  
**Depois:** Raridade + Posição + Favoritos + **Faltando** (combinável)

### Tabs
**Antes:** Sem abas — única visão  
**Depois:** ÁLBUM | HALL OF FAME | DREAM TEAM

### Carta individual
**Antes:** Modal bottom-sheet (componente legado desconectado)  
**Depois:** Página fullscreen `/collection/[cardId]` com todas as informações

---

## Problemas Encontrados e Resoluções

### `exactOptionalPropertyTypes` nos botões de ação
`motion.button` com `style` condicional exigiu cuidado com tipos — resolvido usando objetos `style` sempre definidos.

### `localStorage` SSR
`loadSet()` faz guard `typeof window === 'undefined'` para evitar erro no Server Component. `useEffect` inicializa o state client-side.

### Params assíncronos (Next.js 15)
`app/collection/[cardId]/page.tsx` usa `params: Promise<{ cardId: string }>` com `await params` para compatibilidade com Next 15 RC.

### Dream Team max 11
O `toggleDreamTeam` verifica `dream.size >= DREAM_MAX` antes de adicionar e retorna o estado anterior silenciosamente. O botão no `CardFullPage` desaparece visualmente quando o Dream Team está cheio.

---

## Métricas de Performance (estimadas)

| Métrica | Antes | Depois |
|---------|-------|--------|
| Bundle da rota `/collection` | ~42kb | ~48kb (+CardFullPage lazy) |
| Cards renderizados | Todos (flatten) | Apenas expandidos (accordion lazy) |
| Re-renders de busca | Bloqueantes | Não-bloqueantes (useDeferredValue) |
| Lookup de carta por ID | O(n) | O(1) (getCollectionMap) |

---

## Possíveis Melhorias Futuras

### Prioritárias

| Item | Impacto | Complexidade |
|------|---------|--------------|
| Compartilhar carta (Share API / screenshot) | Alto | Média |
| Animação de flip na entrada da carta quando recém-obtida | Alto | Média |
| Ordenar Dream Team por posição (GK→DEF→MID→FWD) | Médio | Baixa |
| Completar coleção de país: celebração com confetti | Médio | Baixa |
| Filtro de era (1980s, 1990s, etc.) | Médio | Baixa |

### Médio Prazo

| Item | Impacto | Complexidade |
|------|---------|--------------|
| Virtualização do Hall of Fame (react-window) | Alto | Alta |
| Swipe entre cartas no fullscreen (prev/next) | Alto | Média |
| Animação de "desbloqueio" quando carta é obtida | Alto | Média |
| Comparação de cartas (card A vs card B) | Médio | Alta |
| Exportar Dream Team como imagem | Médio | Alta |

### Longo Prazo

| Item | Impacto |
|------|---------|
| Wishlist de cartas faltando | Alto |
| Coleção de outro jogador (profile público) | Alto |
| Raridade GOAT separada de world_cup_hero | Médio |
| Achievements por completar país/raridade | Alto |

---

*Sprint 7 · 2026-07-05 · World Legends Collection v2.0*
