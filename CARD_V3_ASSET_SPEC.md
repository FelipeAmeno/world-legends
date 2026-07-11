# Card V3 Asset Spec (Sprint 34)

Especificação de como soltar arte real no motor v3 — este documento é o
contrato entre quem produz a arte e o código. Ninguém deve precisar ler
`ProceduralSceneLayer.tsx` pra saber onde colocar um arquivo.

## Estrutura de pastas

```
public/assets/cards/v3/
├── backgrounds/   — fundo cinematográfico (webp/png/jpg/svg)
├── players/       — pose do jogador (corpo inteiro, fundo transparente)
├── patterns/      — padrão nacional (textura, fundo transparente)
├── lights/        — luz traseira/raios (textura, geralmente com blend "screen")
├── particles/     — partículas frontais (textura, geralmente com blend "screen")
├── frames/        — moldura por raridade
└── metadata/      — um JSON por composição (ver abaixo)
```

Cada categoria é escaneada automaticamente por
`scripts/generate-card-asset-manifest.mts` (roda no `predev`/`prebuild`,
igual o pipeline v2 já existente em `public/assets/cards/{backgrounds,
frames,poses,scenes,shine}` — `lib/card-asset-loader.ts`). Não precisa
rodar nada manualmente depois de soltar um arquivo; `pnpm dev`/`pnpm
build` regeneram o manifesto sozinhos.

## Composições — o que amarra os 6 canais numa carta

Uma **composição** é um JSON em `v3/metadata/<id>.json` que referencia
explicitamente o arquivo de cada canal (nunca por convenção de nome —
sempre por ID) mais o transform compartilhado:

```json
{
  "backgroundId": "bg-common-validation-01",
  "playerId": "player-common-validation-01",
  "patternId": "pattern-validation-br",
  "lightId": "light-common-validation-01",
  "particlesId": "particles-common-validation-01",
  "frameId": "frame-common-v3",

  "scale": 1,
  "offsetX": 0,
  "offsetY": 0,
  "rotation": 0,
  "opacity": 1,
  "blendMode": "normal",
  "blur": 0,
  "intensity": 1,
  "parallaxDepth": 0
}
```

Cada `*Id` é opcional — se ausente, ou se não existir na pasta
correspondente, aquele canal específico cai pro sistema procedural
(Sprint 27/28) automaticamente. **Nunca tudo-ou-nada**: uma composição
pode trazer só um background real e deixar o resto (pose/luz/
partículas/frame) 100% procedural, e vice-versa.

O ID do arquivo `metadata/<id>.json` (sem `.json`) é o `compositionId`
usado por `PlayerCardData.v3CompositionId` — ver a próxima seção.

## Como uma carta usa uma composição

`PlayerCardData` (`components/cards/card-types.ts`) tem um campo opcional:

```ts
v3CompositionId?: string;
```

`undefined` em toda carta real hoje — só as 5 cartas de validação de
`/dev/card-v3-gallery` setam isso (`common-validation-01`,
`rare-validation-01`, etc). Quando setado, `CardSceneLayer.tsx` e
`CardFrameLayer.tsx` chamam `resolveCardV3(id)`
(`lib/card-v3/resolver.ts`) e passam o resultado pra
`ProceduralSceneLayer`, que decide canal por canal entre arte real e
procedural.

## Resolver — `lib/card-v3/resolver.ts`

```ts
resolveCardV3(compositionId: string): CardV3Composition | null
```

Retorna `null` se o `compositionId` não existir em
`CARD_V3_COMPOSITIONS` (o manifesto gerado). Cada canal resolvido
(`background`/`player`/`pattern`/`light`/`particles`/`frame`) é `string
| null` — `null` quando o `*Id` referenciado não existe no manifesto de
assets (arquivo não encontrado em disco).

## Estado atual — zero arte real

Nenhum arquivo real existe em `public/assets/cards/v3/` hoje (só
`.gitkeep`) — `CARD_V3_ASSET_MANIFEST`/`CARD_V3_COMPOSITIONS`
(`lib/card-v3/manifest.generated.ts`) são gerados vazios. Toda
composição resolve `null` pra todo canal, e o motor cai 100% no
procedural — nenhuma carta fica sem conteúdo. No dia em que alguém
soltar arquivos reais + um `metadata/<id>.json`, o próximo `pnpm dev`/
`pnpm build` regenera o manifesto e as cartas com aquele
`v3CompositionId` passam a usar a arte real automaticamente, sem
nenhuma mudança de código.

## Convenção de nomenclatura (recomendada, não obrigatória)

O resolver não exige nenhum padrão de nome — os `*Id` no JSON de
metadata podem ser qualquer string que exista na pasta certa. Ainda
assim, recomendamos:

```
backgrounds/bg-<raridade>-<slug>.webp
players/player-<raridade>-<slug>.png
patterns/pattern-<país>.png
lights/light-<raridade>-<slug>.png
particles/particles-<raridade>-<slug>.png
frames/frame-<raridade>-v3.png
metadata/<raridade>-<slug>.json
```

## Limites de tamanho/formato (recomendado)

- `webp`/`png` pra qualquer canal com transparência (players/patterns/
  lights/particles/frames).
- `jpg` aceitável só pra `backgrounds` (nunca precisa de alpha).
- Sem limite físico imposto pelo resolver — mas como toda arte é
  `object-cover`/`object-contain` numa carta de ~150-450px de largura,
  arquivos acima de ~800px de lado mais longo são desperdício de
  banda sem ganho visual.
