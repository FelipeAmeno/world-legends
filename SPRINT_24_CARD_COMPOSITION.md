# Sprint 24 — Card Composition Refactor

**Objetivo:** eliminar definitivamente o conceito de "carta antiga" — o
Card Engine renderizava uma composição híbrida (Frame novo + HUD React +
resquício da carta antiga por trás), com a camisa/arte do jogador vivendo
como cinco camadas irmãs (Scene + Kit + Pattern + Player Art + Pose)
competindo pelo mesmo espaço em vez de uma composição limpa.

---

## O bug real, comprovado com screenshot

Antes de mexer em qualquer código, testei o cenário exato que expõe o
problema: um jogador com asset de Scene real (Pelé, `scene-pelé.webp`) no
Dev Tool **antes** desta sprint.

**ANTES** (`components/cards/PlayerCard.tsx`, arquitetura Sprint 21-23):

O badge "Scene: asset real" aparecia verde — o asset resolvia
corretamente. Mas a carta renderizada mostrava a camisa amarela com o "10"
**cobrindo inteiramente** a cena real por trás — só uma fatia mínima do
céu dourado da Scene aparecia atrás do badge de OVR. A causa: `CardKitLayer`
(a camisa) renderizava numa `<div>` própria, sem z-index explícito, LOGO
DEPOIS de `CardSceneLayer` no DOM — então pintava por cima dela,
desperdiçando o asset caro que tinha acabado de resolver.

**DEPOIS** (Sprint 24): a mesma carta (Pelé) mostra a Scene real
inteira, sem nenhum resquício de camisa — porque agora só existe UMA
camada no centro, que decide internamente qual fonte usar.

*(Screenshots completos: `sprint24_before/01_pele_hybrid_old.png` vs.
`sprint24_after/02_pele_scene.png` — capturados via Playwright, mesmo
Dev Tool, mesma conta de teste, com os mesmos 3 assets de Scene reais
gerados externamente pelo usuário durante esta sprint.)*

## Nova composição — 9 camadas

```
1. Background
2. Ambient    (Material + Ambient Light + Efeito de raridade)
3. Particles
4. Scene      (fonte única: scene real > player art > pose > camisa)
5. Frame      (moldura por cima da Scene, como um frame físico de verdade)
6. Reflection
7. Shine
8. HUD        (100% React: OVR, Nome, Posição, Atributos)
9. Glow       (fonte de luz final, topo de tudo)
```

Ver `components/cards/PlayerCard.tsx` — cada camada é uma linha, sem
`<div>` de posicionamento manual solta no meio.

## `CardSceneLayer` — a fonte única do centro

Antes: `PlayerCard` renderizava `<CardSceneLayer>` + `<CardKitLayer>` +
`<CardPatternLayer>` + `<CardPlayerArtLayer>` + `<CardPoseLayer>` como
cinco irmãs, cada uma com seu próprio fallback, cada uma tentando ocupar o
mesmo espaço. Agora `CardSceneLayer.tsx` decide internamente, numa cadeia
de prioridade só (nunca duas renderizam ao mesmo tempo):

1. **Scene real** (`scene-{playerId}.webp`) — ocupa **toda** a área
   central da moldura (`inset-0`, `object-cover`), como pedido.
2. **Player Art real** — mesma área, `object-top`.
3. **Pose real** — mesma área, `object-bottom`.
4. **Fallback final: camisa** (Kit + Pattern) — visual **idêntico** ao de
   sempre (mesma área confinada, mesma escala, mesmo drop-shadow) —
   `JerseyArt` (SVG procedural da Sprint 17) continua sendo o fallback de
   fallback. Preservado pixel a pixel porque é isso que qualquer carta
   sem asset real ainda mostra hoje.

`CardKitLayer.tsx`, `CardPatternLayer.tsx`, `CardPlayerArtLayer.tsx` e
`CardPoseLayer.tsx` foram **deletados** — a lógica deles vive dentro de
`CardSceneLayer.tsx` agora, não em quatro arquivos separados.

## Z-index — renumerado por completo

Todo o z-index das 9 camadas foi renumerado numa escala limpa 0-10 (era
uma mistura de 0,1,2,3,4,5,6,7,8,9,10,11,13 espalhados sem padrão claro):

| Camada | Antes | Depois |
|---|---|---|
| Background | 0 | 0 |
| Ambient (Material/Luz/Raridade) | 1,2,6-7 | 1,2,3 |
| Particles | 9 | 4 |
| Scene | 4 | 5 |
| Frame | 11 | 6 |
| Reflection | 4 (colidia com Scene) | 7 |
| Shine | 13 | 8 |
| HUD (+ Atributos) | 8,9,10 | 9 |
| **Glow** | **sem z explícito, atrás da camisa** | **10 (topo de tudo)** |

**Mudança visual intencional**: Glow deixou de ser "luz atrás da camisa"
e passou a ser a fonte de luz final por cima de toda a composição — pedido
explícito do brief (Layer 9). Confirmado ao vivo que isso não atrapalha a
legibilidade do HUD (o glow fica centralizado, o OVR/nome ficam nas bordas
— sem sobreposição real na prática).

## Nome/OVR/Posição/Atributos — 100% React, confirmado

Nenhuma mudança aqui — já eram (e continuam sendo) `CardNameLayer`,
`CardOvrLayer`, `CardPositionLayer`, `CardAttributesLayer`, todos texto
puro renderizado do dado real da carta, nunca parte de nenhuma arte. A
Sprint 24 não tocou nesses arquivos.

## Scenes reais integradas (prioridade 3 do pedido)

O usuário gerou 3 assets de teste durante esta sprint
(`generate_world_legends_scenes.py`, procedural via PIL) — copiados e
renomeados pra bater com os `playerId` reais do catálogo:

| Arquivo original | `playerId` real | Renomeado para |
|---|---|---|
| `scene-pele.webp` | `pelé` (com acento — confirmado em `lib/collection-data.ts`) | `scene-pelé.webp` |
| `scene-messi.webp` | `lionel-messi` | `scene-lionel-messi.webp` |
| `scene-cristiano.webp` | `cristiano-ronaldo` | `scene-cristiano-ronaldo.webp` |

Testado ao vivo: os três resolvem corretamente via `resolveScene()`,
manifesto atualizado (12 → 15 assets), badge do Dev Tool mostra "Scene
(fonte ativa: scene real): asset real" pra esses três jogadores
especificamente, e "camisa (fallback SVG)" pra qualquer outro — provando a
cadeia de prioridade funcionando de ponta a ponta com conteúdo real, não
só teoricamente.

## Dev Tool atualizado

`components/dev/CardPreviewPanel.tsx`:
- `ALL_LAYERS` reescrito pra espelhar exatamente as 9 camadas novas
  (rótulos numerados: "1. Background", "2. Ambient — Material", etc.).
- Badge de status consolidado: em vez de "Camisa (kit)" + "Arte do
  jogador" separados, agora mostra "Scene (fonte ativa: X)" — X sendo
  `scene real` / `player art` / `pose` / `camisa (asset real)` / `camisa
  (fallback SVG)`, calculado pela mesma cadeia de prioridade de
  `CardSceneLayer.tsx` (helper `resolveActiveSceneSource`, extraído como
  função de módulo pra não estourar o limite de complexidade do lint).
- "Layer order" (referência somente-leitura) atualizado pra mostrar as 9
  camadas na ordem real.

## Validação — zero regressão

Testado ao vivo (Chrome real, mesma conta de teste), comparando contra
screenshots das Sprints 18.9/20.5/21/22/23 já capturados nesta sessão:

- **Perfil** (Melhor Carta, Lúcio Elite) — **pixel-idêntico** aos
  screenshots de sprints anteriores, mesmo com Glow agora no topo da
  composição.
- **Squad** (`xs`, 5 cartas com glow por raridade) — idêntico.
- **Coleção/Álbum** — carrega sem erro.
- **Packs** — lista carrega sem erro.
- **Dev Tool** — Ronaldo Fenômeno (sem Scene real) mostra o mesmo visual
  de camisa de sempre, antes e depois da sprint (comparado lado a lado).

Nenhum erro de console/página em nenhuma tela testada.

## QA

```
pnpm exec biome check .   → 464 warnings, 0 erros (mesmo baseline de sempre)
pnpm exec tsc --noEmit    → 0 erros
pnpm test                 → 204/204 testes passando
pnpm build                → sucesso, 24/24 páginas
git diff --stat -- packages/packs apps/web/lib/actions apps/web/lib/pack-logic.ts
  → (vazio — nenhum arquivo de economia/gameplay/Supabase tocado)
```

**Nota de complexidade**: `resolveActiveSceneSource` (Dev Tool) e a cadeia
de fallback de `CardSceneLayer.tsx` foram desenhadas desde o início como
early-returns simples especificamente pra não estourar o limite de
complexidade cognitiva do lint — confirmado que o baseline de 464
warnings não mudou.

## Arquivos criados/modificados

**Novos:** `SPRINT_24_CARD_COMPOSITION.md`,
`public/assets/cards/scenes/scene-pelé.webp`,
`public/assets/cards/scenes/scene-lionel-messi.webp`,
`public/assets/cards/scenes/scene-cristiano-ronaldo.webp`.

**Modificados:** `components/cards/PlayerCard.tsx` (nova ordem de 9
camadas), `components/cards/layers/CardSceneLayer.tsx` (cadeia de
fallback única, absorve Kit/Pattern/Player Art/Pose),
`components/cards/layers/CardGlowLayer.tsx` (movido pra topo, z=10),
`components/cards/layers/CardFrameLayer.tsx`,
`CardReflectionLayer`-relacionado (`app/globals.css`),
`CardShineLayer.tsx`-relacionado (`app/globals.css`),
`CardRarityEffectLayer.tsx`, `CardHudLayer.tsx`,
`CardParticleLayer.tsx` (renumeração de z-index),
`components/cards/card-types.ts` (`CardLayerName` reduzido a 9 valores),
`components/dev/CardPreviewPanel.tsx`, `WORLD_LEGENDS_DESIGN_SYSTEM.md`
(seção Z-order atualizada).

**Deletados:** `components/cards/layers/CardKitLayer.tsx`,
`CardPatternLayer.tsx`, `CardPlayerArtLayer.tsx`, `CardPoseLayer.tsx`.

**Não modificado:** economia, gameplay, Supabase, Match Engine, Pack
Engine — API pública do `PlayerCard` (`{ card, size, glow, attributes?,
hiddenLayers?, debugOverride? }`) permanece idêntica.
