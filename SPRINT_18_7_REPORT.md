# Sprint 18.7 — Premium Card Engine (AAA)

**Objetivo:** fazer o `PlayerCard` parecer um card AAA usando só CSS,
animações e os fallbacks já existentes — nenhuma arte nova, nenhum PNG,
nenhum SVG definitivo, arquitetura de camadas (Sprint 18.5/18.6) intacta.

---

## O que foi feito

### 1. Tilt 3D + parallax por camada

`components/cards/use-card-tilt.ts` — hook que rastreia o mouse via
`pointermove` no elemento raiz da carta e escreve direto no DOM
(`el.style.setProperty`), **sem `useState`, sem re-render React** (item 9).
Só ativa em desktop com ponteiro fino (`matchMedia('(hover: hover) and
(pointer: fine)')` — item 1 pede explicitamente "desktop"). O elemento
recebe `--px`/`--py` (posição do mouse, -1..1) e `--tilt-rx`/`--tilt-ry`
(rotação, no máximo ±7°, deliberadamente contido — "nunca exagerar").

Cada camada lê `--px`/`--py` com um peso de deslocamento diferente
(`card-parallax-bg` 1.5px → `card-parallax-glow` 4px → o grupo da camisa
7px → `card-parallax-frame` 3px → `card-parallax-hud` 9px), dando a
sensação de profundidade pedida no brief (Background → Glow → Player →
Frame → HUD se movendo em velocidades diferentes) sem depender de
`transform-style: preserve-3d` — decisão deliberada: a carta já usa
`overflow: hidden` pra recortar cantos arredondados, e misturar isso com
3D verdadeiro (`translateZ` + preserve-3d) é uma combinação historicamente
frágil entre navegadores. Um parallax 2D (`translate`) por camada, mais
uma rotação 3D rígida na carta inteira, dá o mesmo efeito visual sem esse
risco.

**Nota de engenharia**: a rotação e o scale de respiração (item 4) não
podem ficar na mesma propriedade `transform` do mesmo elemento — uma
animação CSS substitui o valor inteiro de `transform` enquanto roda, então
"respiração" e "tilt" ficariam brigando. Resolvido com um wrapper extra
(`display: inline-block`, sem nenhum efeito de layout) só pra respiração,
por fora do container que recebe o tilt.

### 2. Reflexo metálico na moldura

`.card-metallic-{raridade}` em `app/globals.css` — generaliza a técnica de
borda-com-gradiente-animado que já existia só pra `ultra`
(`.card-frame-ultra::before`) pras outras raridades, cada uma com sua cor:
rare (roxo→azul), elite (azul→gelo), legendary (bronze→dourado→creme),
ultra (rosa→roxo→azul, arco-íris, mais rápido), world_cup_hero
(prata→branco→prata). Common não recebe — fica "chapada" de propósito,
como já era o padrão de raridade no resto do arquivo.

### 3. Reflexo em vidro reagindo ao mouse

`CardShineLayer` (nova camada, ver item 8) — um radial-gradient
posicionado em `--px`/`--py`, `mix-blend-mode: overlay`, opacidade 0 em
repouso e 1 durante o hover (via a classe `card-tilt-active` que o hook
liga/desliga). Visualmente muito próximo do brilho de vidro do Marvel Snap
citado no brief.

### 4. Respiração

`@keyframes cardBreatheScale` (scale 1 → 1.01 → 1, 5.5s) aplicada só
quando `isLegendaryPlus` (legendary, ultra=GOAT, world_cup_hero — o mesmo
critério já usado pra holo/aura desde a Sprint 18.5, reaproveitado em vez
de inventar um novo).

### 5. Glow físico

`CardGlowLayer` — o fallback saiu de uma mancha de cor única pra um
núcleo branco no centro (`#ffffff 0%`) difundindo pra cor de raridade
(`{accent}dd 12%, {accent}55 38%`), mais `filter` com três
`drop-shadow` em raios crescentes quando `glow` está ativo — mais parecido
com uma fonte de luz real do que com uma mancha plana.

### 6. Partículas procedurais

`components/cards/CardParticles.tsx` — só legendary+ (mesmo critério do
item 4, pra não pesar em grades com muitas cartas comuns). Posição,
tamanho e atraso de cada partícula são determinísticos (hash do `cardId`,
não `Math.random()`) — evita divergência entre render do servidor e do
cliente e mantém o resultado estável entre re-renders do mesmo card. Reusa
as animações `float-y` e `twinkle` que já existiam em `globals.css` (Sprint
3) em vez de duplicar keyframes.

### 7. Tilt no clique

`@keyframes cardPressBounce` (impacto 0.96 → rebote 1.015 → volta a 1,
420ms) — disparado no `pointerdown` via classe, removido automaticamente
no `animationend` (permite cliques repetidos, cada um reinicia a
animação via um reflow forçado).

### 8. Shine Layer

Nova 12ª camada, `components/cards/layers/CardShineLayer.tsx`, seguindo
exatamente o padrão de imagem-com-fallback das Sprints 18.5/18.6
(`resolveShine(rarityCode)`, chave `shine-{raridade}`) — reservada pra
receber um asset de holo/shine real no futuro. Hoje, sem asset, o
fallback **é** o reflexo de vidro do item 3 — as duas coisas viraram a
mesma camada de propósito, pra não empilhar dois efeitos de brilho quase
idênticos na carta ao mesmo tempo. Pipeline completo atualizado:
`scripts/generate-card-asset-manifest.mts` (nova categoria `shine`),
`lib/card-asset-loader.ts`, `lib/dev/card-asset-expectations.ts`,
`lib/dev/card-asset-diagnostics.ts`, e `/dev/card-assets` (Sprint 18.6.5)
já mostra "Shine: fallback" no preview ao vivo e uma nova categoria no
resumo (0/6 hoje).

### 9. Performance

- Zero `useState`/re-render React no caminho de mouse — tudo via
  `style.setProperty` imperativo.
- Só propriedades GPU-compositáveis animadas (`transform`, `opacity`,
  `filter`, `background-position`) — nenhuma anima `width`/`height`/`top`/
  `left` (que forçam layout).
- `getBoundingClientRect()` só é chamado no `pointerenter` (uma vez por
  hover), não a cada `pointermove` — evita leitura de layout repetida.
- Partículas e respiração gated a `isLegendaryPlus` — a maioria das cartas
  numa grade (Coleção) não paga o custo extra.

### 10. Zero mudança quando parado

Confirmado via automação (Playwright): estado idle tem `--px: 0`,
`--py: 0`, `--tilt-rx: 0deg`, `--tilt-ry: 0deg`, classe `card-tilt-active`
ausente, `card-shine-glass` com `opacity: 0`. Os únicos efeitos visíveis
sem interação são os que o próprio brief pede como contínuos (respiração,
metálico, partículas — itens 2/4/6, que não são "mágica de interação", são
loops ambiente por design).

---

## QA

```
pnpm exec biome check .  → 464 warnings, 0 erros (mesmo baseline de antes da sprint)
pnpm test                → 204/204 testes passando
pnpm build               → sucesso, sem erros de tipo
```

Manual + automatizado (Playwright, conta de teste real):
- **Idle**: screenshot do Squad Builder idêntico ao das sprints anteriores
  — nenhuma regressão visual nas cartas comuns/elite.
- **Hover no canto**: `--px:-0.998 --py:-1.000`, `--tilt-rx:-6.99deg
  --tilt-ry:7.00deg` — dentro do limite de ±7°, sinal correto por canto.
- **Hover no centro**: `--px:0.000 --py:-0.018` — neutro, como esperado.
- **Clique**: classe `card-tilt-pressed` aplicada no `pointerdown`.
- **Saída do mouse**: tudo volta a `0`/`0deg`, `card-tilt-active` removida.
- Nenhum erro de página/console novo introduzido (só os 404 esperados de
  assets ainda inexistentes, mesmo comportamento desde a Sprint 18.5).

## Arquivos criados/modificados

Novos: `components/cards/use-card-tilt.ts`, `components/cards/CardParticles.tsx`,
`components/cards/layers/CardShineLayer.tsx`,
`public/assets/cards/shine/.gitkeep`.

Modificados: `app/globals.css` (seção "CARD AAA ENGINE"),
`components/cards/PlayerCard.tsx`, `components/cards/layers/CardGlowLayer.tsx`,
`components/cards/layers/CardBackgroundLayer.tsx`,
`components/cards/layers/CardFrameLayer.tsx`,
`components/cards/layers/CardHudLayer.tsx`, `lib/card-asset-loader.ts`,
`lib/dev/card-asset-expectations.ts`, `lib/dev/card-asset-diagnostics.ts`,
`components/dev/CardPreviewPanel.tsx`,
`scripts/generate-card-asset-manifest.mts`,
`lib/card-asset-manifest.generated.ts` (regenerado, ainda vazio).

Arquitetura de camadas (Sprint 18.5/18.6) não alterada — API pública do
`PlayerCard` continua `{ card, size, glow, attributes? }`, todos os 11
call sites existentes funcionam sem nenhuma mudança.
