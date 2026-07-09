# World Legends — Design System

**Sprint 19 — Visual Identity.** Este documento descreve o sistema visual
que já está implementado no código (não uma aspiração) — cada seção cita
o arquivo real que o implementa, pra servir como referência viva, não um
documento que fica desatualizado no primeiro PR.

---

## 1. Princípios visuais

1. **Raridade se reconhece sem ler texto.** Cada raridade combina cor,
   material, moldura, glow e efeito de acabamento — dá pra saber a
   raridade de uma carta só pela silhueta, mesmo em miniatura (`xs`,
   62×84px) e mesmo pra quem tem baixa visão de cor.
2. **Luxo é contenção, não excesso.** Toda animação nova (Sprint 18.7:
   tilt, parallax, glow físico) tem rotação/deslocamento máximo definido
   e documentado — nunca "quanto mais, melhor". Common fica
   deliberadamente "chapada" (sem shimmer, sem partícula, sem respiração)
   pra criar contraste real com as raridades altas.
3. **A carta é física, não plana.** Desde a Sprint 19, cada raridade tem
   um **material** (plástico, metal, carbono, ouro, platina, cerâmica),
   não só uma cor de destaque. Isso é o que separa "card game genérico"
   de "objeto colecionável".
4. **Zero mudança quando parado.** Efeitos que reagem ao mouse (tilt,
   glass reflection) não aparecem nada até o usuário interagir — a magia
   é sempre uma resposta a uma ação, nunca ruído constante.
5. **Fallback sempre funcional.** Toda camada visual asset-capable tem um
   equivalente 100% CSS/procedural. O jogo nunca depende de uma arte
   externa pra funcionar — a arte só melhora o que já funciona.

## 2. Materiais

Fonte: `components/cards/card-materials.ts` + `app/globals.css` (seção
"CARD MATERIALS"). Cada raridade tem um `MaterialDef`: um material físico
real, renderizado como bezel na borda da carta.

| Raridade | Material | Reflexo | Luz ambiente |
|---|---|---|---|
| Common | Plástico Fosco | 0.08 (quase nenhum) | 0.15 |
| Rare | Metal Anodizado | 0.35 (médio, linhas escovadas) | 0.30 |
| Elite | Carbono Premium | 0.40 (trama cruzada) | 0.32 |
| Legendary | Ouro Lapidado | 0.60 (facetas) | 0.45 |
| Ultra | Platina Cromada | 0.85 (espelhado, feixe nítido) | 0.55 |
| World Champion | Cerâmica Branca Premium | 0.70 (difuso, amplo) | 0.60 |

`reflectionIntensity`/`ambientIntensity` não são só números decorativos —
alimentam `ReflectionLayer`/`AmbientLightLayer` via CSS custom properties
(`--reflection-intensity`, `--ambient-intensity`), então ajustar um
material nesse arquivo muda como ele reage à luz automaticamente, sem
tocar em CSS.

## 3. Iluminação

- **Ambient Light** (`CardAmbientLightLayer`): luz suave e constante vinda
  de cima (`radial-gradient` no topo da carta), intensidade por material.
  Sempre ligada, nunca reage a interação.
- **Reflection** (`CardReflectionLayer`): feixe de luz fixo que varre a
  carta em loop (`metallicSweep`, reusa a animação da Sprint 18.7),
  largura/velocidade por `reflectionSharpness` do material — platina
  cromada tem feixe estreito e rápido (2.8s, blur 1px); plástico fosco
  quase não aparece (blur 6px, intensidade 0.08).
- **Glow físico** (`CardGlowLayer`, Sprint 18.7): núcleo branco no centro
  difundindo pra cor de raridade + múltiplos `drop-shadow` — luz atrás da
  camisa, não uma mancha de cor plana.
- **Shine/Glass** (`CardShineLayer`, Sprint 18.7): único efeito que reage
  ao mouse — radial-gradient posicionado em `--px`/`--py`, opacidade 0 em
  repouso.

## 4. Profundidade

- **Tilt 3D** (`use-card-tilt.ts`): rotação máxima ±7° no mouse, via CSS
  custom properties escritas direto no DOM (zero re-render React).
- **Parallax por camada**: cada camada se desloca em velocidade diferente
  (`.card-parallax-bg` 1.5px → `.card-parallax-glow` 4px → camisa 7px →
  `.card-parallax-frame` 3px → `.card-parallax-hud` 9px) — 2D translate,
  não `translateZ`/`preserve-3d` (decisão deliberada: a carta usa
  `overflow: hidden` pra recortar cantos, e 3D verdadeiro com isso é
  historicamente frágil entre navegadores).
- **Respiração**: `scale(1 → 1.01 → 1)`, 5.5s, só legendary+ — dá
  presença sem ser hipnótico.
- **Z-order das camadas** (Sprint 24 — Card Composition Refactor, de trás
  pra frente): Background → Ambient (Material + Ambient Light + Efeito de
  raridade) → Partículas → Scene → Frame → Reflection → Shine → HUD →
  Glow. `Scene` é uma cadeia de fallback única (scene real > player art >
  pose > camisa) — não são mais camadas separadas competindo pelo mesmo
  espaço (era o resquício de "carta antiga" eliminado nesta sprint). Ver
  `components/cards/PlayerCard.tsx` pra ordem exata de composição e
  `components/cards/layers/CardSceneLayer.tsx` pra cadeia de fallback.

## 5. Glass

`.glass`/`.glass-card`/`.glass-dark`/`.glass-gold`/`.glass-surface` em
`app/globals.css` — `backdrop-filter: blur() saturate()` + borda
translúcida. Usado em toda superfície de UI que fica sobre conteúdo
(cards de stat, modais, headers) — não confundir com o "Glass" da carta
em si (`CardShineLayer`), que é um efeito de superfície reagindo à luz,
não um painel de UI.

## 6. Metal

`.card-metallic-{raridade}` (Sprint 18.7) — moldura com reflexo metálico
animado, técnica de borda com gradiente + `mask-composite: exclude`
(generaliza a borda animada que já existia só pra `ultra`). Cor por
raridade: rare (roxo→azul), elite (azul→gelo), legendary
(bronze→dourado→creme), ultra (rosa→roxo→azul, mais rápido), world
champion (prata→branco→prata). Common não recebe — fica sem esse efeito
de propósito.

## 7. Carbono

Material exclusivo de Elite (`.card-material-carbon`) — trama cruzada
clássica de fibra de carbono via dois `repeating-linear-gradient` em
ângulos opostos (45°/-45°), base escura azulada.

## 8. Glow

Ver seção "Iluminação" acima — glow físico (`CardGlowLayer`) e glow
externo da carta (`.glow-{raridade}`, box-shadow no container, aplicado
via classe CSS desde a Sprint 17/17.1/18 por depender de pseudo-elementos
ajustados naquelas sprints).

## 9. Safe zones

Baseado nas proporções reais usadas em `components/cards/card-tokens.ts`
(`SIZES`, proporção 0.744 = 148/199, a mesma documentada em
`docs/CARD_ASSETS_GUIDE.md` pra assets externos):

- **Moldura/bezel**: 4px de padding do bezel de material nas bordas —
  nenhum elemento de texto deve invadir essa faixa.
  frame/background/kit/player-art precisam ter alguma margem de
  segurança nesses 4px pra não conflitar com o bezel do material.
- **HUD**: OVR fica a `5% do width` do topo/esquerda; ribbon de raridade
  a `5.5%` do topo/direita; rodapé de nome ocupa os últimos ~19% da
  altura da carta (`dim.card.height * 0.19`, ver o bloco central da
  camisa em `PlayerCard.tsx`).
- **Camisa/pose**: a área central (6% a 81% da altura) é reservada pra
  Kit/Player Art/Pose — qualquer asset de Frame/Background que tenha
  elementos gráficos importantes nessa faixa vai competir visualmente com
  o jogador.

## 10. Grid

Tamanhos de carta fixos (`CardSize` em `card-tokens.ts`): `xs` (62×84,
Squad/grades densas), `sm` (92×124), `md` (116×156, Coleção/Pack Reveal
padrão), `lg` (148×199, Perfil/Card Preview). Todos mantêm a mesma
proporção 0.744 — um asset produzido pra `lg` funciona em qualquer
tamanho porque é a MESMA imagem escalada, nunca uma versão diferente por
tamanho.

## 11. Animações

Fonte única: `lib/motion-tokens.ts` (`DURATION`, `EASE`, `SPRING`,
`VARIANTS`, `PRESS`) — regra de código explícita nesse arquivo: "nunca
escreva durações ou beziers diretamente nos componentes". Isso vale pra
UI geral (botões, modais, toasts); os efeitos específicos da carta
(tilt, parallax, respiração, metallic sweep, partículas) vivem em
`app/globals.css` como `@keyframes` porque são acionados via classe CSS
ou CSS custom property, não via Framer Motion.

## 12. Tipografia

- **Display** (`.font-display`, Bebas Neue): números grandes (OVR),
  títulos, nome do jogador na carta.
- **Corpo** (Inter): todo o resto — labels, descrições, UI geral.
- Tamanhos de fonte da carta são todos tokenizados por `CardSize`
  (`OVR_FONT`, `POS_FONT`, `NAME_FONT`, `SUB_FONT`, `RIBBON_FONT` em
  `card-tokens.ts`) — nunca hardcoded por camada.

## 13. Motion (interação)

- **Hover/press de UI geral**: `PRESS.whileHover`/`whileTap` em
  `motion-tokens.ts` — scale 1.04/0.96, springs `snappy`.
- **Interação da carta**: tilt no mouse (rotação + parallax), tilt no
  clique (`cardPressBounce`: impacto 0.96 → rebote 1.015 → volta a 1,
  420ms) — ver Sprint 18.7.
- **Transição de página**: `PAGE_TRANSITION` em `motion-tokens.ts`
  (fade + y:8→0, `AnimatePresence` no layout raiz).

---

## Onde cada coisa vive (referência rápida)

| Conceito | Arquivo |
|---|---|
| Tokens de raridade (cor, ícone, label) | `components/cards/card-tokens.ts` |
| Material por raridade | `components/cards/card-materials.ts` |
| Contexto visual computado (`CardVisualCtx`) | `components/cards/card-types.ts` |
| Orquestrador de camadas | `components/cards/PlayerCard.tsx` |
| Cada camada individual | `components/cards/layers/*.tsx` |
| Tilt/parallax (mouse) | `components/cards/use-card-tilt.ts` |
| Todo CSS de carta (materiais, metallic, tilt, respiração, partículas) | `app/globals.css`, seções "CARD SYSTEM", "CARD AAA ENGINE", "CARD MATERIALS" |
| Motion tokens gerais (não-carta) | `lib/motion-tokens.ts` |
| Pipeline de assets (frames/backgrounds/kits/etc.) | `lib/card-asset-loader.ts`, `scripts/generate-card-asset-manifest.mts` |
| Inspetor/QA visual | `/dev/card-assets` (`components/dev/*`) |
