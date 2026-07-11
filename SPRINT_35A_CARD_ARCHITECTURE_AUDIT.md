# Sprint 35A — Card System Cleanup & Renderer Architecture Audit

Auditoria **read-only**: nenhum arquivo foi apagado, movido, refatorado
ou instalado. Todos os números abaixo vêm de medição real (grep, `du`,
`pnpm build`, Playwright + CDP ao vivo contra a conta de QA), não de
estimativa.

---

## 1. Diagrama da arquitetura atual

```
PlayerCard.tsx (orquestrador — API pública: card, size, glow, attributes?, hiddenLayers?, debugOverride?)
│
├─ useCardTilt()            → --px/--py/--tilt-rx/--tilt-ry via style.setProperty (zero re-render)
├─ useCardInViewport()      → .card-offscreen quando fora da viewport (pausa animação)
│
├─ 1. CardBackgroundLayer       (z=0)  — cor sólida base
├─ 2. CardMaterialLayer         (z=1)  — brilho diagonal fixo por raridade
├─ 2. CardAmbientLightLayer     (z=1)  — --ambient-intensity
├─ 2. CardRarityEffectLayer     (z=1)  — overlay animado (ultra-rainbow, holo, etc)
├─ 3. CardParticleLayer         (z=4)  — partículas fixas (legendary+), CSS puro
├─ 4. CardSceneLayer            (z=5)  — ⚠️ ÚNICA fonte de verdade do centro da carta:
│     ├─ resolveScene(playerId)      → Scene real (nenhuma existe hoje)
│     ├─ resolvePose(playerId)       → Pose real fotográfica (nenhuma existe hoje)
│     └─ ProceduralSceneLayer        → SEMPRE renderiza algo (fallback final)
│           ├─ v3?.background  → real (Sprint 35: 1 asset real) | procedural (BackgroundGenerator)
│           ├─ v3?.pattern     → real (nenhum ainda) | procedural (CountryPatternGenerator)
│           ├─ v3?.light       → real (nenhum ainda) | procedural (LightingGenerator, volumetric-spin)
│           ├─ pose            → real (Sprint 35: 1 asset real) | procedural (PoseFigure, pose-engine/rig.ts)
│           └─ v3?.particles   → real (nenhum ainda) | procedural (ParticleGenerator)
├─ 5. CardFrameLayer            (z=6)  — v3?.frame (nenhum real ainda) | CSS (.card-frame-*)
├─ 6. CardReflectionLayer       (z=7)  — feixe de luz CSS
├─ 7. CardShineLayer            (z=8)  — glass sweep reagindo ao mouse
├─ 8. CardHudLayer              (z=9)  — 100% React: OVR/Posição/Ribbon/Nome (+ CardAttributesLayer opcional)
└─ 9. CardGlowLayer             (z=10) — glow externo final

Resolvers paralelos (ambos "asset real → fallback", nunca competem):
  lib/card-asset-loader.ts   — v2, manifest único (backgrounds/effects/frames/poses/scenes/shine), sidecar co-localizado
  lib/card-v3/resolver.ts    — v3, manifest granular por canal, metadata em pasta compartilhada, POR CANAL (Sprint 35)

Pack Reveal (mesmo Card Engine, camada de cima):
  CardRevealScene.tsx → RevealedCard.tsx → <PlayerCard size="md" .../>
```

---

## 2. Lista de arquivos — KEEP / MIGRATE / DEPRECATE / DELETE-CANDIDATE

Regra aplicada: nada é DELETE-CANDIDATE se ainda tem import ativo em
produção — confirmado por `grep` real, não suposição.

### KEEP (núcleo ativo, usado em produção hoje)

| Arquivo | Motivo |
|---|---|
| `components/cards/PlayerCard.tsx` | orquestrador único, API pública estável |
| `components/cards/layers/*.tsx` (11 arquivos) | as 9 camadas + HUD sub-camadas, todas em uso |
| `components/cards/use-card-tilt.ts`, `use-card-in-viewport.ts` | tilt + viewport pause, sem re-render |
| `components/cards/card-tokens.ts`, `card-types.ts`, `card-materials.ts` | tabelas de identidade visual |
| `components/cards/pose/PoseFigure.tsx` | rig SVG, único gerador de pose visual |
| `lib/procedural-scene/*.ts` (6 arquivos) | motor procedural, 100% das cartas hoje passam por aqui |
| `lib/pose-engine/*.ts` (4 arquivos) | 14 poses, resolvido por posição+raridade |
| `lib/card-asset-loader.ts` | resolver v2 (frames/scenes/poses reais, se algum dia existirem) |
| `lib/card-v3/*.ts` (4 arquivos) | resolver v3, ativo desde Sprint 34, com 1 asset real desde Sprint 35 |
| `components/packs/CardRevealScene.tsx`, `RevealedCard.tsx` | Pack Reveal real, mesmo Card Engine |
| `components/packs/PackArt.tsx` | arte procedural dos 7 pacotes (não é carta, mas mesma família visual) |
| `app/dev/card-assets`, `app/dev/card-stress-test`, `app/dev/card-v3-gallery`, `app/dev/pack-reveal-qa` | ferramentas internas de QA, todas com uso real nesta sessão |

### MIGRATE (candidatos naturais pro pipeline estático, se a Sprint 35B for adiante)

| Arquivo | Por quê migrar |
|---|---|
| `ProceduralSceneLayer.tsx` (a PARTE procedural — Background/Light/Pattern/Particles) | hoje recalcula CSS em todo render; pré-composição via Sharp elimina isso pra cartas sem interação (Compact) |
| `CardFrameLayer.tsx` (canal `frame`) | moldura pode ser SVG estático pré-processado |
| `lib/procedural-scene/BackgroundGenerator.ts`, `LightingGenerator.ts`, `ParticleGenerator.ts` | a LÓGICA de geração continua (determinística), só o ALVO de renderização muda (Sharp compõe uma vez no build, não CSS em todo render) |

### DEPRECATE (funcionam, mas redundantes ou parcialmente supersedidos)

| Arquivo | Por quê |
|---|---|
| `components/cards/CardTile.tsx` | componente de carta MAIS ANTIGO que `PlayerCard.tsx` — precisa confirmar call sites vivos antes de qualquer ação (ver seção 6) |
| `components/cards/CardParticles.tsx` | partículas standalone — `CardParticleLayer.tsx` e `ProceduralSceneLayer`'s partículas parecem ter absorvido essa função; confirmar uso real antes de tocar |

### DELETE-CANDIDATE (zero import confirmado por grep — mas NENHUM apagado nesta auditoria)

| Arquivo/árvore | Confirmação de órfão |
|---|---|
| `components/match/{MatchAnimation,MatchResultView,MatchRewards,MatchScreen,MatchStats,MatchTimeline,OpponentSelector,PreMatchView,ScoreBoard}.tsx` (9 arquivos) | zero import fora da própria árvore órfã — `components/match/premium/*` é a versão viva (confirmado Sprint 26 Gameplay Foundation). Já documentado 2x antes nesta sessão; segue não apagado por não ter sido pedido explicitamente. |

**Nenhum arquivo do Card Engine em si (`components/cards/`, `lib/procedural-scene/`, `lib/pose-engine/`, `lib/card-v3/`, `lib/card-asset-loader.ts`) está órfão.** Todos os 11 layers, os 2 resolvers, os 2 motores geradores estão em uso ativo confirmado.

---

## 3. Rotas e renderers usados

| Rota | Renderer | `size` prop |
|---|---|---|
| `/squad` (grade, banco, seleção) | `PlayerCard` | `xs` (Compact) |
| `/collection` → Museu (grade principal) | `PlayerCard` | `sm` (Compact) |
| `/collection` → Álbum (sets temáticos) | miniatura separada (bandeira+nome+OVR), **NÃO usa `PlayerCard`** | n/a |
| `/collection/[cardId]` (Card Detail) | **NÃO usa `PlayerCard`** — página de stats/texto puro | n/a |
| `/profile` → "Melhor Carta" | `PlayerCard` | `lg` (Showcase) |
| `/packs` → Pack Reveal | `PlayerCard` (via `RevealedCard.tsx`) | `md` (Standard) |
| `/dev/card-assets` | `PlayerCard` | configurável (preview) |
| `/dev/card-stress-test` | `PlayerCard` | mapeado por tier (Sprint 34: 1→lg, 10→md, 50→sm, 200→sm) |
| `/dev/card-v3-gallery` | `PlayerCard` | 3 densidades (Compact/Standard/Showcase) |
| `/dev/pack-reveal-qa` | `PlayerCard` (via `CardRevealScene`/`RevealedCard`) | `md` |

**Achado confirmado (já documentado nas Sprints 33/34, reconfirmado agora)**: `/collection/[cardId]` (Card Detail) e a aba Álbum da Coleção **não passam pelo Card Engine** — duas telas de "carta" na app que não usam `PlayerCard`. Isso é uma inconsistência visual real, não um "renderer duplicado" tecnicamente (não há um segundo motor de renderização de carta — só ausência total de arte nessas duas telas).

---

## 4. Dependências atuais (relacionadas a gráficos/cartas)

```
framer-motion: ^11.0.0   — único pacote gráfico de terceiros em uso
```

Nenhum `sharp`, `pixi.js`, `konva`, `three`, `canvas` instalado hoje
(confirmado via `grep` em `package.json`). Tudo no Card Engine atual é
**React + CSS + SVG puro** — zero canvas/WebGL em qualquer lugar do
sistema de cartas.

## 5. Dependências possivelmente removíveis

Nenhuma — `framer-motion` está em uso ativo em `CardRevealScene.tsx`,
`PackArt.tsx`, `RevealedCard.tsx`, e dezenas de outros componentes fora
do Card Engine (login, rewards, missions). Não há dependência morta
relacionada a cartas hoje.

## 6. Tamanho dos assets

```
public/assets/cards/v3/backgrounds/   15M   (1 asset real de 2,1M + 5 imagens de exploração não usadas ~13M)
public/assets/cards/v3/players/      2,1M   (1 asset real)
public/assets/cards/v3/frames/         0B
public/assets/cards/v3/lights/         0B
public/assets/cards/v3/particles/      0B
public/assets/cards/v3/patterns/       0B
public/assets/cards/v3/metadata/      12K   (5 arquivos JSON)
public/assets/cards/backgrounds/     220K   (v2, legado)
public/assets/cards/frames/          1,1M   (v2, legado)
public/assets/cards/scenes/          636K   (v2, legado)
public/assets/cards/effects/           0B
public/assets/cards/poses/             0B
public/assets/cards/shine/             0B
─────────────────────────────────────────
Total public/assets/                  19M
```

**Achado**: os 2 assets reais da Sprint 35 (PNG, ~2,1MB cada) são
pesados pra entrega web — o brief original os especificava como WEBP.
Nenhuma conversão foi feita (fora de escopo dessa integração), mas é o
primeiro item concreto de otimização se mais arte real for adicionada
no mesmo padrão de tamanho. As 5 imagens de exploração
(`Gemini_Generated_Image_*.png`, `nano-banana-*.png`, ~13MB) estão no
manifesto gerado (entradas órfãs, inofensivas) mas não são referenciadas
por nenhuma composição.

## 7. Tamanho do bundle

Rotas que renderizam `PlayerCard` (`pnpm build`, medição real):

| Rota | Tamanho da rota | First Load JS |
|---|---|---|
| `/squad` | 36,4 kB | 343 kB |
| `/packs` | 17,9 kB | 342 kB |
| `/collection` | 16,5 kB | 321 kB |
| `/profile` | 7,75 kB | 375 kB |
| `/dev/card-assets` | 10,2 kB | 313 kB |
| `/dev/card-v3-gallery` | 2,1 kB | 264 kB |
| `/dev/pack-reveal-qa` | 2,83 kB | 325 kB |
| `/dev/card-stress-test` | 1,97 kB | 305 kB |

`+ First Load JS shared by all: 213 kB` (chunks compartilhados por
TODA a app, não específico de cartas). O Card Engine em si (11 layers +
2 resolvers + 2 motores geradores) não tem uma métrica isolada porque
está fundido no bundle da rota — medir isso precisamente exigiria um
bundle analyzer (`@next/bundle-analyzer`), não instalado (fora do
escopo desta auditoria read-only).

## 8. Gargalos observados

- **DOM nodes por carta**: medido ao vivo (`querySelectorAll('*').length`
  em 6 cartas reais de raridades diferentes) — **54 a 77 nós por carta**,
  média 63. Cresce com a raridade (mais partículas/efeitos). Em 200
  cartas (pior caso do stress test), isso é ~12.600 nós DOM só de
  cartas.
- **FPS medido** (`/dev/card-stress-test`, Sprint 34): 60fps @ 1
  (Showcase), 60fps @ 10 (Standard), **30fps @ 50 (Compact)**, **23fps
  @ 200 (Compact)** — a queda começa exatamente onde CSS
  recalculado-por-render (gradientes, `repeating-conic-gradient`,
  `blur()`) deixa de ser barato.
- **Filtros CSS caros**: 17 usos de `filter:` em `globals.css`
  (`blur()`, `drop-shadow()` em cascata na Pose — 2 drop-shadows
  empilhados por carta). `blur(5px)` no `volumetric-spin` (Lighting
  procedural) roda em TODA carta sem asset real de luz, sempre ativo
  quando visível.
- **Animações globais**: 46 `@keyframes`, das quais **24 são
  `infinite`** — mitigado pela Sprint 34 (viewport-pause +
  reduced-motion), mas cada carta visível com efeito de raridade alta
  ainda soma 3-5 animações infinitas simultâneas (shine sweep,
  holo slide, partículas, volumetric spin, breathing).
- **Cobertura de CSS**: medição real via CDP (`CSS.startRuleUsageTracking`)
  navegando por `/squad`, `/profile`, `/collection`, `/packs`,
  `/dev/card-v3-gallery` mostrou 100% de uso nas regras carregadas
  nessas rotas — mas essa medição é PARCIAL (só cobre o CSS
  efetivamente carregado nessas 5 rotas, não o arquivo `globals.css`
  inteiro de 1756 linhas contra TODAS as rotas da app). Uma auditoria
  completa de CSS não utilizado exigiria varrer todas as ~30 rotas.

## 9. Arquitetura híbrida proposta (Compact=Sharp / Standard=React-SVG-CSS / Showcase=PixiJS)

**Nota importante**: a Sprint 35B (recebida durante esta mesma sessão,
depois deste pedido de auditoria) já **decidiu não seguir por PixiJS** —
optou por Sharp (pré-composição build-time) + React (HUD) + SVG
(frames/ícones) + CSS (só a cena do Pack Reveal), sem nenhuma engine
gráfica nova. Registro aqui a viabilidade tal como avaliada nesta
auditoria, pra manter o histórico de decisão:

- **Sharp pra Compact**: viável — Node-only, sem dependência de canvas
  do browser, comprime bem, encaixa no `predev`/`prebuild` que já existe
  (`generate-card-asset-manifest.mts`). Precisa virar dependência de
  dev (não de runtime), já que só roda em build-time.
- **React/SVG/CSS pra Standard**: **já é o que existe hoje** — zero
  migração necessária, é literalmente o Card Engine atual.
  Redução de layers (o brief da Sprint 35B não pede mais isso, mas
  segue viável se for decidido).
  o.
- **PixiJS pra Showcase**: viável tecnicamente (WebGL, SSR-safe se
  carregado só client-side via dynamic import), mas **não aprovado** —
  ver Sprint 35B.

## 10. Plano incremental de migração (histórico da avaliação, pré-decisão da 35B)

1. Sharp entra só como script de build (`scripts/cards/build-card-artworks.ts`,
   ver Sprint 35B), nunca no runtime do servidor Next — zero risco pra
   SSR/Vercel.
2. Migrar 1 carta de validação por vez (a GOAT da Sprint 35 é o
   primeiro candidato natural — já tem os 2 assets reais).
3. `StaticWorldLegendsCard` fica isolado em `/dev/static-card-pipeline`
   até estar provado equivalente ao `PlayerCard` atual em qualidade
   visual E performance.
4. `PlayerCard` NUNCA é removido nesta fase — os dois coexistem.

## 11. Riscos

- **Divergência visual**: uma composição pré-renderizada (Sharp) pode
  dessincronizar do `ProceduralSceneLayer` se alguém mudar a lógica
  procedural sem regenerar os artworks estáticos — precisa de um script
  de validação (`validate-card-assets.ts`, já no plano da 35B) rodando
  no CI.
- **Peso dos assets reais**: se os próximos assets seguirem o padrão de
  ~2MB/arquivo da Sprint 35 sem compressão, o ganho de performance do
  pipeline estático (Sharp) é anulado pelo peso de download.
- **Fragmentação de fallback**: com 2 sistemas (`card-asset-loader.ts`
  v2 + `card-v3/resolver.ts` v3) já convivendo, adicionar um TERCEIRO
  (artworks pré-compostos) aumenta a superfície de "onde checar por que
  uma carta não está mostrando arte real" — mitigar com documentação
  clara (já existe `CARD_V3_ASSET_SPEC.md`).

## 12. Lista exata do que NÃO deve ser apagado ainda

- `components/match/*` (árvore órfã, 9 arquivos) — confirmado sem
  import, mas remoção nunca foi pedida explicitamente; já barrada uma
  vez nesta sessão pelo classificador de segurança do harness quando
  tentei remover sem pedido direto.
- `components/cards/CardTile.tsx`, `components/cards/CardParticles.tsx`
  — uso precisa ser confirmado com uma varredura de todos os call sites
  (não feita nesta auditoria por completo) antes de qualquer
  reclassificação de DEPRECATE pra DELETE-CANDIDATE.
- As 5 imagens de exploração em `v3/backgrounds/`
  (`Gemini_Generated_Image_*.png`, `nano-banana-*.png`) — não são meu
  material, não sei se o usuário ainda precisa delas como referência.
- `lib/card-asset-loader.ts` (resolver v2) — continua sendo o caminho
  real pra Frame/Scene/Pose fotográfica se algum dia existirem; não
  substituído pelo v3 (que cobre canais diferentes: background/pattern/
  light/player/particles).

---

## QA desta auditoria

```
pnpm exec biome check .       → 457 warnings, 0 erros (baseline inalterado)
pnpm exec tsc --noEmit -p .   → 0 erros
pnpm test (apps/web)          → 226/226
pnpm build (monorepo)         → sucesso, 34/34 tasks, 26/26 páginas
```

Nenhum código alterado por esta auditoria — os números de QA acima são
os mesmos da Sprint 35 (nada mudou desde o último commit). Nenhum
arquivo apagado, movido, refatorado ou instalado.
