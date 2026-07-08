# Sprint 19 — World Legends Visual Identity

> **Nota de nomenclatura**: já existe um `SPRINT_19_REPORT.md` de uma
> sprint anterior, sem relação ("Game Feel & Immersion"). Pra não
> sobrescrever esse histórico, este relatório usa o nome
> `SPRINT_19_VISUAL_IDENTITY_REPORT.md`.

**Objetivo:** transformar o Card Engine num sistema cinematográfico
modular — não gameplay novo, não mudança de economia/Supabase/Match
Engine/Packs. Só UX e Card Experience.

---

## Entregáveis

- [`WORLD_LEGENDS_DESIGN_SYSTEM.md`](./WORLD_LEGENDS_DESIGN_SYSTEM.md)
- [`WORLD_LEGENDS_ART_PIPELINE.md`](./WORLD_LEGENDS_ART_PIPELINE.md)
- Este relatório

## O que foi feito

### 1. Sistema de materiais (não só cor)

`components/cards/card-materials.ts` — cada raridade agora tem um
`MaterialDef` real: Common (plástico fosco), Rare (metal anodizado),
Elite (carbono premium), Legendary (ouro lapidado), Ultra (platina
cromada), World Champion (cerâmica branca premium). Cada material define
`reflectionIntensity`, `reflectionSharpness` e `ambientIntensity` — não
são só paletas de cor, alimentam o comportamento de luz das novas
camadas (item 3).

Implementado como um "bezel" na borda da carta (`.card-material-layer`
em `app/globals.css`, técnica de máscara/borda igual ao `.card-metallic`
da Sprint 18.7) — textura real via CSS (trama cruzada pro carbono,
facetas diagonais pro ouro, gradiente espelhado pra platina), não só
troca de cor de destaque.

### 2. PlayerCard refatorado — 3 camadas novas, API pública intacta

- **`CardMaterialLayer`** — renderiza o material da raridade.
- **`CardReflectionLayer`** — feixe de luz fixo (não reage ao mouse —
  isso já era o Shine da Sprint 18.7) cuja intensidade/nitidez/
  velocidade vêm do material: platina reflete forte e nítido (blur 1px,
  2.8s), plástico quase não reflete (blur 6px, intensidade 0.08).
- **`CardAmbientLightLayer`** — luz suave constante, mais forte em
  materiais polidos (cerâmica 0.6, plástico 0.15).

A prop pública do `PlayerCard` continua `{ card, size, glow, attributes?
}` — as 3 camadas novas leem `ctx.material` (computado uma vez, dentro
do próprio componente, a partir da raridade) e não exigem nenhuma
mudança nos 11+ call sites existentes (Coleção, Pack Opening, Squad,
Perfil, Hall of Legends, Match).

### 3. Pontos de integração — Pattern e Pose

Kit já tinha pipeline completo desde a Sprint 18.5. Dois novos:

- **Pattern** (`CardPatternLayer`, `resolvePattern(nationality)`, chave
  `pattern-{nacionalidade}`) — textura pra sobrepor o Kit (listras,
  xadrez). Categoria nova no manifesto, com universo esperado calculado
  (65 nacionalidades) em vez de "achar e listar" como antes.
- **Pose** (`CardPoseLayer`, `resolvePose(playerId)`, chave
  `pose-{playerId}`) — alternativa a Player Art pra corpo inteiro em vez
  de retrato. Universo esperado: 574 jogadores.

Nenhum asset existe ainda pra nenhum dos dois — fallback `null` (mesmo
padrão de Player Art/Shine antes da primeira entrega de arte).

### 4. Modo Visual Debug

`/dev/card-assets` → painel "Preview ao vivo" agora tem uma seção
"Visual Debug — ligar/desligar camadas" com um botão por camada (14 ao
todo: Background, Material, Ambient Light, Efeito de raridade, Frame,
Reflection, Glow, Kit, Pattern, Player Art, Pose, Partículas, HUD,
Shine). Implementado via uma prop nova e **opcional** no `PlayerCard`
(`hiddenLayers?: ReadonlySet<CardLayerName>`) — `undefined` por padrão
(todas as camadas ligadas), então nenhum call site existente precisa
saber que essa prop existe.

Testado ao vivo: desligar Kit + Frame + HUD numa carta `legendary` remove
exatamente a camisa, a moldura do escudo e todo o texto (OVR/nome/
posição), deixando só fundo/material/ambient/glow/partículas visíveis —
confirma isolamento correto de cada camada.

### 5. Documentação

- `WORLD_LEGENDS_DESIGN_SYSTEM.md` — princípios, materiais, iluminação,
  profundidade, glass, metal, carbono, glow, safe zones, grid,
  animações, tipografia, motion — cada seção referenciando o arquivo
  real que implementa (não é um documento aspiracional desconectado do
  código).
- `WORLD_LEGENDS_ART_PIPELINE.md` — substitui/atualiza
  `docs/CARD_ASSETS_GUIDE.md` (que ganhou uma nota apontando pro
  documento novo). Cobre as 8 categorias agora existentes, incluindo
  Pattern/Pose (novos) e a calibração de tolerância de proporção da
  Sprint 18.8.

## Validação sem regressão

Confirmado sem erro de página/console em todas as telas pedidas:

- **Squad** (`xs`) — screenshot comparado, idêntico ao das sprints
  anteriores.
- **Perfil** (`lg`, "Melhor Carta") — idêntico.
- **Card Preview/Card Detail** (`lg`, `CardDetailModal`) — testado ao
  vivo com o Visual Debug (screenshots antes/depois de desligar
  camadas).
- **Pack Reveal** (`md`) — abertura completa sem erro de console.
- **Coleção/Hall of Legends** (`sm`, via `/collection`) — carrega sem
  erro; `HallOfLegendsExperience.tsx` importa o mesmo `PlayerCard`
  compartilhado já validado nos outros tamanhos.
- **Match** (`MatchResultScreen`, MVP) — não testado com uma partida ao
  vivo nesta sprint (mesma decisão de escopo da Sprint 18.8); garantia
  vem do componente compartilhado, já confirmado em `xs`/`sm`/`md`/`lg`.

## QA

```
pnpm exec biome check .  → 464 warnings, 0 erros (mesmo baseline de sempre)
pnpm test                → 204/204 testes passando
pnpm build               → sucesso (build do Next.js já inclui checagem de tipos)
```

## Arquivos criados/modificados

Novos: `WORLD_LEGENDS_DESIGN_SYSTEM.md`, `WORLD_LEGENDS_ART_PIPELINE.md`,
`components/cards/card-materials.ts`,
`components/cards/layers/{CardMaterialLayer,CardReflectionLayer,
CardAmbientLightLayer,CardPatternLayer,CardPoseLayer}.tsx`,
`public/assets/cards/poses/.gitkeep`.

Modificados: `app/globals.css` (seções "CARD MATERIALS", "REFLECTION &
AMBIENT LIGHT"), `components/cards/PlayerCard.tsx`,
`components/cards/card-types.ts` (novo `CardLayerName`, `material` e
`hiddenLayers` em `CardVisualCtx`), as 8 camadas existentes (guard de
`hiddenLayers`), `lib/card-asset-loader.ts` (`resolvePattern`/
`resolvePose`), `lib/dev/card-asset-{expectations,diagnostics}.ts`,
`components/dev/CardPreviewPanel.tsx` (seção Visual Debug),
`scripts/generate-card-asset-manifest.mts` (categoria `poses`),
`docs/CARD_ASSETS_GUIDE.md` (nota de redirecionamento).

Não modificados: gameplay, economia, Supabase, Match Engine, Packs — a
API pública do `PlayerCard` continua compatível com todos os call sites
existentes.
