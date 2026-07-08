# Sprint 18.5 — Card Rendering Engine (Foundation)

**Objetivo:** construir a fundação visual em camadas do `PlayerCard`, pronta
para receber arte real (Gemini), sem criar arte nova, sem tocar em
funcionalidade, economia, packs ou Supabase.

---

## O que foi feito

### 1. Estrutura de assets

```
public/assets/cards/
  frames/        (.gitkeep — vazio, aguardando arte)
  backgrounds/
  kits/
  player-art/
  effects/
  patterns/
```

### 2. Motor de camadas

`components/cards/PlayerCard.tsx` foi reescrito de um componente monolítico
de 397 linhas para um **orquestrador** que compõe 11 camadas nomeadas,
cada uma em seu próprio arquivo em `components/cards/layers/`. A API
pública não mudou: `{ card, size, glow }` — os 11 call sites existentes
(Coleção, Pack Opening, Squad Builder ×5, Perfil ×2, Hall of Legends,
Match MVP) não precisaram de nenhuma alteração.

| # | Camada | Arquivo | Asset-capable? |
|---|--------|---------|-----------------|
| 1 | Background | `CardBackgroundLayer.tsx` | Sim — `bg-{raridade}.png` |
| 2 | Efeito de raridade | `CardRarityEffectLayer.tsx` | Sim — `effect-{raridade}.png` |
| 3 | Frame | `CardFrameLayer.tsx` (aditiva) + classes CSS no container | Sim — `frame-{raridade}.png` |
| 4 | Camisa (kit) | `CardKitLayer.tsx` | Sim — `kit-{nacionalidade}-{raridade}.png` |
| 5 | Arte do jogador (Gemini) | `CardPlayerArtLayer.tsx` | Sim — `player-art/{playerId}.png` |
| 6 | Glow | `CardGlowLayer.tsx` + classe CSS externa | Sim — `glow-{raridade}.png` |
| 7 | HUD | `CardHudLayer.tsx` | Não — estrutural (ver nota abaixo) |
| 8 | OVR | `CardOvrLayer.tsx` | Nunca — sempre texto React |
| 9 | Nome | `CardNameLayer.tsx` | Nunca — sempre texto React |
| 10 | Posição | `CardPositionLayer.tsx` | Nunca — sempre texto React |
| 11 | Atributos | `CardAttributesLayer.tsx` | Nunca — sempre texto React, **nova, opcional, off por padrão** |

**Padrão imagem-com-fallback**: toda camada asset-capable usa a primitiva
compartilhada `components/cards/layers/ImageLayer.tsx` — tenta carregar o
PNG esperado (`lib/card-assets.ts` define os caminhos), e se der 404
(`onError`), cai automaticamente no visual procedural CSS/SVG que já
existia antes desta sprint. **Nenhum arquivo de arte existe ainda**, então
hoje toda carta do app renderiza exatamente como antes — confirmado
visualmente (Squad, Perfil, Pack Opening, Card Preview) e via
lint/typecheck/test/build. Quando um PNG real for colocado no caminho
certo, ele passa a aparecer automaticamente, sem nenhuma mudança de código.

**Nota de arquitetura — Frame e Glow externo**: a moldura/borda e o glow
externo da carta de hoje são aplicados via classes CSS no container
(`card-frame-*`, `glow-*`, `card-holo`, `legendary-aura` em
`app/globals.css`), porque dependem de pseudo-elementos (`::before`/
`::after`) cuidadosamente ajustados nas Sprints 17/17.1/18. Movê-los para
`<img>` separados arriscaria quebrar esse acabamento sem ganho nenhum
hoje. `CardFrameLayer`/`CardGlowLayer` existem como camadas **aditivas**:
só aparecem por cima de tudo quando um PNG real existir; até lá, a
moldura/glow CSS continuam sendo os reais.

**Nota de arquitetura — HUD (Layer 7)**: os "plates" de fundo dos blocos de
texto (badge de OVR, ribbon de raridade, rodapé de nome) precisam se
adaptar a texto de tamanho variável (nome do jogador etc.), então não têm
um asset PNG trocável — permanecem 100% React/CSS por design.
`CardHudLayer` existe como componente estrutural que recebe as Layers
8/9/10 como slots (`ovrSlot`, `positionSlot`, `nameSlot`).

**Regra dura respeitada**: nome, OVR, posição, atributos e bandeira nunca
vêm de imagem — são sempre texto React lido do objeto `PlayerCardData`
(`card.displayName`, `card.overall`, `card.position`, `card.flagEmoji`).
As camadas 8, 9, 10 e 11 não têm — e nunca terão — uma variante de imagem.

### 3. Performance

- Todas as camadas de imagem usam `loading="lazy"` por padrão.
- Apenas a Layer 3 (Frame) usa `loading="eager"` + `fetchPriority="high"`
  — são poucos arquivos (6, um por raridade) reusados em toda carta do
  app, então valem o pré-carregamento; o resto (kits, player-art, efeitos)
  varia por jogador/raridade e fica lazy.
- `PlayerCard` agora é `React.memo` com comparador customizado por campos
  primitivos (`cardId`, `rarityCode`, `overall`, `displayName`,
  `nationality`, `position`, `flagEmoji`, `era`, `size`, `glow`) — evita
  re-render quando o objeto `card` é recriado com o mesmo conteúdo (comum
  em listas/grids), que era um gap real (o componente não era memoizado
  antes desta sprint).

### 4. Compatibilidade

- **Coleção, Pack Opening, Squad Builder, Perfil, Hall of Legends, Match
  MVP**: já usavam `PlayerCard` antes desta sprint (nenhuma mudança de
  call site necessária) — confirmados visualmente sem regressão.
- **Card Preview**: `components/collection/CardDetailModal.tsx` mostrava
  um número de OVR gigante em texto/gradiente, sem a carta em si. Agora
  renderiza `<PlayerCard card={card} size="lg" glow />` de verdade,
  satisfazendo o requisito de usar exatamente o mesmo componente.
  Confirmado visualmente via QA.
- **Dream Team**: não existe uma visualização de cartas própria hoje — é
  só uma lista de IDs em `localStorage` com indicadores abstratos
  (`components/home/DreamTeamWidget.tsx` mostra pontos de progresso, sem
  nenhuma carta desenhada). Não havia nada para trocar.

### 5. Escopo deliberadamente fora desta sprint

- **`components/packs/GoatReveal.tsx`** (o momento cinematográfico do
  World Cup Hero no pack opening) usa uma implementação bespoke própria,
  sem `PlayerCard`/`JerseyArt`. Não foi tocado: é uma sequência coreografada
  com cuidado na Sprint 18 (timings específicos por raridade), e
  reescrevê-la para usar o motor de camadas é um trabalho de risco real
  não coberto pelo pedido desta sprint ("apenas trocar a renderização" do
  componente de carta, não recoreografar uma animação já ajustada).
- **`components/cards/CardTile.tsx`**: confirmado código morto (nenhum
  import em lugar nenhum do app) — não foi tocado nem removido, fora do
  escopo desta sprint.
- **`components/collection/CardFullPage.tsx`** (página de detalhe
  completa em `/collection/[cardId]`): não é literalmente "Card Preview"
  (é uma página de estatísticas dedicada, sem visual de carta física hoje)
  e não foi citada por nome no pedido — deixada como está.

### 6. Raridades — nenhuma nova criada

Confirmado: `RarityCode` continua com exatamente 6 valores —
`common | rare | elite | legendary | ultra | world_cup_hero`. O pedido
citou "GOAT" e "WORLD_CHAMPION" como nomes de exibição; no código, esses
já mapeiam para `ultra` → rótulo "GOAT" e `world_cup_hero` → rótulo
"CAMPEÃO" dentro de `PlayerCard`/`card-tokens.ts` (pré-existente desde a
Sprint 17.1, preservado como estava).

---

## Lista de assets esperados para integração com o Gemini

Convenção de nomes em `lib/card-assets.ts`. Nenhum arquivo foi criado —
esta é a lista do que o motor está pronto para receber.

**Prioridade 1 — molduras (6 arquivos, mais impacto por arquivo)**
`frames/frame-common.png`, `frame-rare.png`, `frame-elite.png`,
`frame-legendary.png`, `frame-ultra.png`, `frame-world_cup_hero.png`

**Prioridade 2 — fundos por raridade (6 arquivos)**
`backgrounds/bg-{raridade}.png` (as mesmas 6 raridades)

**Prioridade 3 — efeitos por raridade (12 arquivos)**
`effects/effect-{raridade}.png` (textura de acabamento) +
`effects/glow-{raridade}.png` (aura atrás da camisa/arte)

**Prioridade 4 — camisas (grande, priorizar por seleção)**
`kits/kit-{nacionalidade}-{raridade}.png` — 75 códigos de nacionalidade
já mapeados em `lib/kit-data.ts` × 6 raridades = até 450 combinações.
Recomendação: gerar primeiro só a versão `common` de cada nacionalidade
(75 arquivos) como base, e as variantes de raridade alta (`legendary`,
`ultra`, `world_cup_hero`) apenas para as ~15 seleções mais puxadas em
packs (Brasil, Argentina, França, Alemanha, Inglaterra, Portugal,
Espanha, Itália, Holanda, Croácia, Bélgica, Uruguai, Países Baixos,
Coreia do Sul, Japão) antes de cobrir o resto.

**Prioridade 5 — arte do jogador (Gemini, um por jogador)**
`player-art/{playerId}.png` — um arquivo por jogador único no catálogo
(574 cartas no catálogo atual; a contagem exata de `playerId` únicos pode
ser menor se houver múltiplas cartas do mesmo jogador em raridades
diferentes). Esta é a camada mais trabalhosa e a que dá o salto visual
"AAA" mais visível — recomendação: priorizar os jogadores que já
aparecem em `legendary`/`ultra`/`world_cup_hero` primeiro.

**Prioridade 6 — padrões reutilizáveis (opcional)**
`patterns/{chave}.png` — usados por dentro de composições de kit (listras,
xadrez), só necessário se a geração de kit não for uma imagem única por
nacionalidade.

---

## QA

```
pnpm exec biome check .  → 464 warnings (baseline pré-sprint: 465 — nenhum novo, uma correção incidental)
pnpm test                → 204/204 testes passando
pnpm build               → sucesso, sem erros de tipo, 24 rotas
```

Manual (Playwright, conta de teste real, screenshots comparados antes/depois):
- Pack Opening: abertura completa, reveal de carta comum renderiza
  idêntico ao pré-sprint (camisa verde, OVR, nome).
- Squad Builder: cartas no campo com glow/holo/jersey corretos.
- Perfil: "Melhor Carta" (`size="lg" glow`) idêntica ao pré-sprint.
- Card Preview: `CardDetailModal` agora mostra a carta real via
  `PlayerCard`, funcionando corretamente.
- Console: apenas 404s esperados (as camadas tentando carregar assets que
  ainda não existem, exatamente o comportamento desenhado) — zero erros
  de página/hidratação novos introduzidos por esta sprint.

## Arquivos criados/modificados

Novos: `lib/card-assets.ts`, `components/cards/card-tokens.ts`,
`components/cards/card-types.ts`, `components/cards/layers/{ImageLayer,
CardBackgroundLayer,CardRarityEffectLayer,CardFrameLayer,CardKitLayer,
CardPlayerArtLayer,CardGlowLayer,CardHudLayer,CardOvrLayer,CardNameLayer,
CardPositionLayer,CardAttributesLayer}.tsx`,
`public/assets/cards/{frames,backgrounds,kits,player-art,effects,patterns}/.gitkeep`.

Modificados: `components/cards/PlayerCard.tsx` (reescrito),
`components/collection/CardDetailModal.tsx`.

Não modificados (intencional): `JerseyArt.tsx`, `lib/kit-data.ts`,
`components/packs/GoatReveal.tsx`, `components/cards/CardTile.tsx`,
`components/collection/CardFullPage.tsx`, qualquer coisa em Supabase,
economia ou packs.
