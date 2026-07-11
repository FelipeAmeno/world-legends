# Sprint 35 — First Real Asset Integration (relatório final)

Primeira integração de arte real no pipeline v3 (Sprint 34), usando o
resolver/composição já existentes — sem reinventar o motor, sem alterar
direção visual, sem processar os assets artisticamente.

## O que existia antes de eu tocar em qualquer coisa

Os dois arquivos de metadata (`wl-bg-goat-stadium-gold-001-v1.json`,
`wl-player-goat-brazil-001-v1.json`) e as imagens reais já estavam no
repositório — mas as imagens estavam salvas com nomes de rascunho
(`goat-background-concept-v1.png`, `goat-player-concept-v1.png`) dentro
de `v3/backgrounds/` (as duas, mesmo a de player estando na pasta
errada). Confirmei visualmente o conteúdo de cada uma antes de mexer:
`goat-background-concept-v1.png` é o estádio dourado noturno descrito
no metadata (`wl-bg-goat-stadium-gold-001-v1`); `goat-player-concept-v1.png`
é o jogador brasileiro ilustrado (camisa amarela, comemorando, fundo
transparente) descrito no outro metadata (`wl-player-goat-brazil-001-v1`,
`country: brazil`, `era: 1970s`).

## Arquivos alterados

**Movidos (sem alteração de pixel, `mv` puro):**
- `v3/backgrounds/goat-background-concept-v1.png` → `v3/backgrounds/wl-bg-goat-stadium-gold-001-v1.png`
- `v3/backgrounds/goat-player-concept-v1.png` → `v3/players/wl-player-goat-brazil-001-v1.png`

**Criados:**
- `v3/metadata/ultra-validation-01.json` — a composição (preset) que amarra os dois assets acima.

**Código alterado (resolver estendido pra metadata genuinamente por canal):**
- `lib/card-v3/types.ts` — `CardV3Composition` agora resolve cada canal
  como `{ src, meta } | null` (`CardV3ResolvedChannel`), não mais um
  `meta` único compartilhado pra composição inteira.
- `lib/card-v3/resolver.ts` — `resolveChannel()` busca o metadata
  PRÓPRIO de cada asset (mesmo mapa `CARD_V3_COMPOSITIONS`, chave =
  o `*Id` do canal), com fallback pro default por canal.
- `components/cards/layers/ProceduralSceneLayer.tsx` — consome
  `v3.background.src`/`v3.background.meta` em vez de `v3.background`/`v3.meta`
  (idem pattern/light/player/particles); parallax por canal via nova
  classe `.card-v3-parallax` + `--v3-parallax-weight`.
- `components/cards/layers/CardFrameLayer.tsx` — mesmo ajuste pro canal `frame`.
- `app/globals.css` — nova regra `.card-v3-parallax` (reaproveita `--px`/`--py` do `useCardTilt` existente).
- `components/dev/CardV3Gallery.tsx` — adicionado GOAT (rarityCode `ultra`) às cartas de validação (as outras 5 continuam intactas).
- `components/dev/PackRevealQaHarness.tsx` — a raridade "Ultra (GOAT)" agora anexa `v3CompositionId: 'ultra-validation-01'` na primeira carta sorteada.
- `tests/lib/card-v3-resolver.test.ts` — reescrito pra provar metadata por canal (6/6 testes).

**Por que o resolver precisou mudar** (não estava no plano original, mas
era necessário): os dois metadata reais têm `parallaxDepth` DIFERENTE
(`0.15` no background, `0.65` no player) — um `meta` único por
composição (o design original da Sprint 34) não conseguiria expressar
isso. A extensão faz o motor genuinamente ter "metadata por canal", que
é o que o brief da Sprint 35 já assumia existir.

## Preset criado

`v3/metadata/ultra-validation-01.json`:
```json
{
  "backgroundId": "wl-bg-goat-stadium-gold-001-v1",
  "playerId": "wl-player-goat-brazil-001-v1"
}
```
Reutiliza a convenção já existente da Sprint 34
(`${rarityCode}-validation-01`) — `CardV3Gallery.tsx` já monta esse ID
automaticamente pra qualquer raridade na lista de validação, então
adicionar `ultra` à lista foi a única mudança necessária ali.

## IDs registrados

| Canal | ID | Arquivo |
|---|---|---|
| background | `wl-bg-goat-stadium-gold-001-v1` | `v3/backgrounds/wl-bg-goat-stadium-gold-001-v1.png` |
| player | `wl-player-goat-brazil-001-v1` | `v3/players/wl-player-goat-brazil-001-v1.png` |

## Metadata aplicada

| Campo | Background | Player |
|---|---|---|
| scale | 1 | 1 |
| offsetX / offsetY | 0 / 0 | 0 / 0 |
| opacity | 1 | 1 |
| blendMode | normal | normal |
| parallaxDepth | 0.15 | 0.65 |

Ambos aplicados via `ImageLayer` (scale/offset/rotation/blendMode/blur/
intensity) + a nova classe `.card-v3-parallax` (parallaxDepth,
reagindo ao tilt do mouse já existente, `--px`/`--py`).

## Screenshots

Capturados ao vivo (Playwright, conta de QA), `/private/tmp/.../scratchpad/sprint18_9/`:
- **3 densidades** — `s35_gallery_compact.png` (6 cartas lado a lado,
  Compact), `s35_gallery_standard.png` (Standard), zoom individual da
  carta GOAT em Showcase (`s35_goat_zoom.png`) — jogador ilustrado
  (camisa amarela, comemorando) visivelmente renderizado em todas.
- **Pack Reveal** — `s35_pack_reveal_goat2.png`: carta GOAT (OVR 96)
  revelada dentro do `CardRevealScene`/`RevealedCard` real de produção,
  com a arte real do jogador visível.
- **Confirmação de fallback** — `s35_fallback_test.png`: com o arquivo
  de background temporariamente removido do disco, o canal volta pro
  gradiente procedural enquanto o player (ainda presente) continua
  mostrando a arte real — provado por inspeção do DOM
  (`wl-bg-goat` ausente do HTML, `wl-player-goat` presente) antes do
  screenshot. Arquivo restaurado logo em seguida, manifest regenerado.

## Confirmação de fallback

Teste explícito: `mv` do PNG de background pra fora da pasta →
`node scripts/generate-card-asset-manifest.mts` (7→6 assets) → DOM
inspecionado ao vivo confirma zero `<img>` com `wl-bg-goat` no card,
enquanto o `<img>` do player permanece — prova que os canais são
independentes (não é tudo-ou-nada) e que a ausência de um asset nunca
quebra a carta. Arquivo restaurado, manifest regenerado de volta pra
7 assets / 3 composições.

## QA

```
pnpm exec biome check .        → 457 warnings, 0 erros (baseline inalterado)
pnpm exec tsc --noEmit -p .    → 0 erros
pnpm test (apps/web)           → 226/226 (6 no resolver v3, reescritos pra metadata por canal)
pnpm build (monorepo)          → sucesso, 34/34 tasks, 26/26 páginas
```

## URL do deploy Vercel Ready

A confirmar após push+deploy (ver final do relatório / mensagem de fechamento).

## Observações / próximos passos

- Os dois arquivos reais estão em PNG (~2.1MB cada), não WEBP como o
  brief original sugeria — não fiz conversão de formato nesta sprint
  (evitar qualquer processamento não pedido); o resolver casa por nome
  de arquivo sem extensão, então funciona igual, mas os arquivos são
  pesados pra entrega web. Recomendo compressão/conversão pra WEBP como
  tarefa separada, futura, puramente técnica (sem alterar pixels
  visíveis).
- `v3/backgrounds/` também tem 5 imagens de exploração/referência
  (`Gemini_Generated_Image_*.png`, `nano-banana-*.png`) não usadas por
  nenhuma composição — ficaram no manifesto gerado (entradas órfãs,
  inofensivas) mas não foram tocadas nem usadas.
- Nenhuma mudança em economia, odds, catálogo ou gameplay.
