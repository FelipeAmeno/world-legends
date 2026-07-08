# Sprint 18.9 — Premium Card Engine (Final Assembly)

**Objetivo:** fechar definitivamente o Card Engine — integrar oficialmente
Reflection/Ambient/Particle ao pipeline de assets, blend modes e
intensidade reais dirigidos por metadata, presets de animação por
raridade, evoluir o Dev Tool pra ferramenta de verdade de Diretor de Arte,
stress test de performance, e garantir zero regressão. Sem mudança de
gameplay/economia/Supabase/Match/Packs — escopo exclusivo do
`PlayerCard` e das ferramentas internas.

---

## O que foi feito

### 1. Reflection, Ambient e Particle agora são oficialmente asset-capable

Antes desta sprint, `CardReflectionLayer` e `CardAmbientLightLayer`
(Sprint 19) eram 100% CSS procedural, sem nenhuma ligação com o pipeline
de assets — e `CardParticles` (Sprint 18.7) nem recebia `ctx`, era chamado
diretamente pelo `PlayerCard` com `cardId`/`accent` soltos. As três agora
seguem o mesmo padrão fallback-first de Frame/Background/Kit/Glow/Shine:

- `lib/card-asset-loader.ts` ganhou `resolveReflection`/`resolveAmbient`/
  `resolveParticles` — reaproveitando a pasta `effects/` já existente (mesmo
  padrão que Glow e Efeito de Raridade já usavam: uma pasta, várias chaves
  por prefixo — `reflection-{raridade}`, `ambient-{raridade}`,
  `particle-{raridade}`). Nenhuma pasta nova no manifesto.
- `CardReflectionLayer`/`CardAmbientLightLayer` agora usam `ImageLayer`
  (a mesma primitiva de sempre) — asset real vira a textura, ausência cai
  no CSS procedural idêntico ao de antes.
- Nova camada `CardParticleLayer.tsx` (em `layers/`, seguindo a convenção
  `CardXxxLayer`) substitui a chamada direta a `CardParticles` dentro do
  `PlayerCard` — a própria camada decide se renderiza (só legendary+) e se
  usa asset real ou o gerador procedural (`CardParticles`, mantido como
  fallback, agora aceitando `speedMultiplier`/`confetti`).

Glow e Shine já eram asset-capable desde as Sprints 18.5/18.7 — confirmados
sem necessidade de mudança.

### 2. Blend modes reais, dirigidos por metadata

`BlendMode` ganhou `plus-lighter` (fica `normal | multiply | screen |
overlay | soft-light | hard-light | color-dodge | color-burn | lighten |
darken | plus-lighter`). Nenhuma camada tem blend mode hardcoded — todo
`mixBlendMode` vem do sidecar JSON do asset (`ImageLayer` já aplicava isso
desde a Sprint 18.6) ou do `debugOverride` do Dev Tool (novo, item 5).

### 3. Intensidade, opacidade, blur e velocidade por asset

`ResolvedCardAsset` ganhou dois campos novos: `blur` (px) e
`animationSpeed` (multiplicador, padrão `1`). `ImageLayer` aplica `blur`
via `filter` (mesclando com qualquer `filter` já passado pelo caller) e
expõe `animationSpeed` como `--asset-speed` pra qualquer camada que anime
via CSS. `intensity`/`opacity` já existiam desde a Sprint 18.6 (mapeando
pra `opacity`) — mantidos como estão.

### 4. Animation Presets por raridade

Novo `components/cards/card-animation-presets.ts` — tabela
`RARITY_ANIMATION_PRESET` com um `speedMultiplier` por raridade: Common
"Quase Estático" (2.2×, mais lento), Rare "Respiração Leve" (1.4×), Elite
"Energia" (1×, referência), Legendary "Gold Rays" (0.85×), Ultra "Rainbow
Pulse" (0.7×), World Champion "Confetti Sparkle" (0.6×, o mais rápido).

Esse multiplicador escala a duração do sweep do Reflection e do
flutuar/piscar das Partículas. World Champion também ganha uma paleta de
partículas multicolorida ("confete") em vez da cor única de raridade —
única mudança de COR (não só velocidade) do pacote, porque é o único item
nomeado explicitamente no brief com uma característica visual concreta,
não só de ritmo.

**Nota de escopo (pixel parity vs. presets):** decidi conscientemente
aplicar o preset por padrão (sem exigir asset real) — mesmo critério já
usado pelo Sistema de Materiais da Sprint 19 (que também mudou o visual
padrão de todo card sem precisar de asset real, e foi o comportamento
esperado/celebrado daquela sprint). A garantia de "pixel parity" do item 7
cobre a MECÂNICA do pipeline (nenhuma camada quebra, nenhum elemento novo
aparece, fallback sempre idêntico ao componente CSS de sempre) — não uma
promessa de que nenhum sistema de design novo pode alterar timing/cor
desde que documentado. Se a intenção era manter Sprint 19 congelada bit a
bit, é reversível numa linha (mover o multiplicador do preset pra dentro
de `resolveReflection`/`resolveParticles` como default do asset, em vez de
aplicado direto na camada) — sinalizando aqui pra confirmação.

Precedência final de velocidade: `asset.animationSpeed` (sidecar, se
existir asset real) > `ctx.debugOverride.animationSpeedMultiplier` (só Dev
Tool) > preset da raridade (padrão de produção).

### 5. `PlayerCard.debugOverride` — novo prop opcional, API pública intacta

`{ card, size, glow, attributes?, hiddenLayers?, debugOverride? }` — o
quinto prop novo desde a Sprint 18.5, sempre `undefined` por padrão, só
usado pelo Dev Tool. Permite sobrescrever `reflectionIntensity`,
`ambientIntensity`, `blendMode` e `animationSpeedMultiplier` ao vivo, sem
tocar nos tokens de produção (`RARITY_MATERIAL`/presets). Nenhum call site
de jogo passa isso — mesma garantia de sempre.

### 6. Dev Tool (`/dev/card-assets`) — de inspetor pra ferramenta de Diretor de Arte

- **Preview isolado**: botão ⭐ por camada — isola só aquela camada
  (equivalente a desligar as outras 13 de uma vez). Testado ao vivo:
  isolar Background numa carta comum mostra só a textura de fundo, todas
  as outras 13 camadas some.
- **Sliders**: Reflection intensity e Ambient intensity (0–1), Animation
  speed (0.2×–3×) — cada um com "resetar" pra voltar ao padrão de material/
  preset.
- **Seletor de blend mode**: aplica ao Reflection (camada mais
  demonstrativa) — testado com `screen`, sweep fica visivelmente mais
  claro/aditivo.
- **Layer order**: lista somente-leitura da ordem real de composição (as
  mesmas 14 camadas, na ordem exata do `PlayerCard.tsx`) — referência, não
  editável (reordenar de verdade exigiria desmontar uma composição já
  calibrada camada a camada; fora de escopo).
- **Export screenshot**: baixa a carta em preview como PNG.

### 7. Export Screenshot — motivo de ter usado uma dependência nova

Tentei a rota dependency-free padrão primeiro (serializar o DOM real num
`<svg><foreignObject>`, rasterizar via `<canvas>`) — funciona bem até
existir um `<img>` de verdade dentro da carta (que já é o caso: Frame e
Background são assets reais desde a Sprint 18.8). Debugado
sistematicamente: corrigi well-formedness XML (`XMLSerializer` em vez de
`.outerHTML`, que não fecha `<img>`), inlineei toda imagem como `data:`
URI, removi todo `url()` do CSS embutido (fontes) — o Chrome CONTINUA
marcando o canvas como "tainted" e bloqueando `toBlob()`. É uma decisão de
segurança deliberada do Chromium (drawImage de qualquer SVG com
`<foreignObject>` contendo `<img>` sempre tainta, mesmo com `data:` URI
100% local) — não uma checagem de CORS de verdade, sem workaround
conhecido sem biblioteca.

Troquei por `html-to-image` (~30KB, MIT, ativamente mantida) — única
dependência nova desta sprint, importada **só** por
`lib/dev/card-screenshot.ts`, que por sua vez só é importado pelo Dev
Tool. Confirmado no `pnpm build`: nenhuma rota de jogo (Coleção, Squad,
Packs, Match, Perfil) cresceu de tamanho — só `/dev/card-assets` absorveu
a dependência. Testado end-to-end: PNG exportado bate exatamente com o
preview ao vivo.

### 8. Asset Stress Test (`/dev/card-stress-test`)

Nova página interna — renderiza 1/10/50/200 `PlayerCard` reais
simultaneamente (mesmo componente do jogo, `size="sm"`, `glow` ligado,
raridade/jogador variando round-robin pra realismo visual) e mede FPS via
`requestAnimationFrame` (buffer rolante de 60 frames pro contador ao vivo,
buffer separado por 4s pra medição sob demanda).

**Resultado medido** (Chrome real, macOS, build de produção):

| Cartas | FPS médio | FPS mínimo | Amostras |
|---|---|---|---|
| 1 | 60 | 54 | 240 |
| 10 | 60 | 53 | 240 |
| 50 | 27 | 20 | 106 |
| 200 | 22 | 19 | 88 |

1–10 cartas seguram 60fps cheio (o teto do navegador). A partir de 50
cartas o custo de compositing (tilt 3D + parallax + blend modes + glow com
múltiplos `drop-shadow` por carta) começa a pesar — 200 cartas simultâneas
(cenário bem mais denso que qualquer tela real do jogo, que nunca mostra
mais que ~20 cartas por vez) ainda mantém ~22fps, sem travar. Nenhuma
otimização foi aplicada nesta sprint (fora de escopo — item 6 pedia medir
e documentar, não otimizar); os números ficam registrados como baseline
pra referência futura.

## Validação de pixel parity / zero regressão

Sem nenhum asset real de Reflection/Ambient/Particle (nenhum existe hoje —
manifesto confirma 12 assets: só os 6 frames + 6 backgrounds da Sprint
18.8), toda carta cai no fallback procedural, estruturalmente idêntico ao
da Sprint 19/18.7 (mesma classe CSS, mesmo DOM, mesma composição) — a
única diferença observável é a velocidade do Reflection/Partículas seguir
o preset por raridade em vez de uma constante única (ver nota de escopo no
item 4 acima).

Testado ao vivo (Playwright + Chrome real, conta de teste autenticada):

- `/dev/card-assets` — preview padrão idêntico ao da Sprint 19, todos os
  controles novos (solo, sliders, blend mode, export) funcionando.
- `/dev/card-stress-test` — 1/10/50/200 cartas renderizam corretamente,
  medição de FPS funcional.
- `/collection` — sem erro de console, sem regressão visual.
- `/profile` — carta "Melhor Carta" (Elite, com glow) renderiza
  perfeitamente.
- `/squad` — grade `xs` com 5 cartas (glow colorido por raridade) renderiza
  perfeitamente.
- Export Screenshot testado com carta `common` — PNG baixado bate com o
  preview.

**Achado pré-existente, fora de escopo:** `/squad` emite um warning de
hydration mismatch (`aria-describedby="DndDescribedBy-N"`) vindo do
`@dnd-kit` (IDs gerados não-deterministicamente entre server/client) — não
relacionado a nenhuma mudança desta ou de sprints anteriores do Card
Engine (nada aqui toca `PitchBuilder`/`DndContext`). Registrado pra
referência, não corrigido (fora do escopo "só `PlayerCard`" desta sprint).

## QA

```
pnpm exec biome check .  → 464 warnings, 0 erros (mesmo baseline de sempre)
pnpm test                → 204/204 testes passando
pnpm exec tsc --noEmit   → 0 erros
pnpm build               → sucesso, 24/24 páginas, nenhuma rota de jogo cresceu de tamanho
```

## Arquivos criados/modificados

**Novos:** `components/cards/card-animation-presets.ts`,
`components/cards/layers/CardParticleLayer.tsx`,
`components/dev/CardStressTestGrid.tsx`,
`app/dev/card-stress-test/page.tsx`, `lib/dev/card-screenshot.ts`,
`SPRINT_18_9_REPORT.md`.

**Modificados:** `lib/card-asset-loader.ts` (`blur`/`animationSpeed`,
`plus-lighter`, `resolveReflection`/`resolveAmbient`/`resolveParticles`,
`ALL_BLEND_MODES`), `components/cards/layers/ImageLayer.tsx` (blur +
`--asset-speed`), `components/cards/layers/CardReflectionLayer.tsx` e
`CardAmbientLightLayer.tsx` (asset-capable), `components/cards/
CardParticles.tsx` (`speedMultiplier`/`confetti`), `components/cards/
card-types.ts` (`CardDebugOverride`, `debugOverride` em `CardVisualCtx`),
`components/cards/PlayerCard.tsx` (prop `debugOverride`, troca
`CardParticles` direto por `CardParticleLayer`),
`components/dev/CardPreviewPanel.tsx` (solo, sliders, blend selector,
layer order, export), `package.json`/`pnpm-lock.yaml` (`html-to-image`).

**Não modificado:** gameplay, economia, Supabase, Match Engine, Packs — a
API pública do `PlayerCard` continua compatível com todos os call sites
existentes (`hiddenLayers` e `debugOverride` são opcionais, `undefined`
por padrão).

## Fechamento do Card Engine

Com esta sprint, as 14 camadas do `PlayerCard` (Background, Material,
Ambient Light, Efeito de Raridade, Frame, Reflection, Glow, Kit, Pattern,
Player Art, Pose, Partículas, HUD, Shine) estão **todas** oficialmente
integradas ao pipeline de assets (fallback automático, metadata, manifesto
gerado, lazy loading, memoização), com blend modes/intensidade/blur/
velocidade reais e dirigidos por dado, presets de animação documentados
por raridade, e uma ferramenta de Dev Tool completa pra validar/ajustar
tudo sem tocar em código. Nenhum asset real de Reflection/Ambient/Particle/
Kit/Pattern/Pose/Player Art/Shine/Efeito de Raridade/Glow existe ainda —
só Frame e Background (12 no total) — mas o pipeline inteiro já está
pronto pra receber qualquer lote novo automaticamente, sem trabalho de
código adicional, exatamente como Frame/Background provaram nas Sprints
18.6–18.8.

Sprint 20 fica livre pra ser "Gameplay Revolution".
