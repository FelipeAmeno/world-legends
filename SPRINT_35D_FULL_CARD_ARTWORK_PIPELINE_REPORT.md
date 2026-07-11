# Sprint 35D — Full Card Artwork Pipeline Reset (relatório final)

A estratégia artística da Sprint 35B (canais separados: player/
background/light/particles compostos com Sharp) foi **rejeitada pelo
product owner** — a arte aprovada é uma composição unificada, uma
imagem só, já com tudo (jogador+frame+background+luz+material+efeitos+
textura), sem nenhum texto dinâmico. Esta sprint adapta o pipeline
existente pra esse novo formato, sem apagar nada do que já existia.

## Arquitetura anterior (Sprint 35B, preservada — `sourceType: 'layered'`)

```
preset.source.{background,player,light,particles}  (arquivos separados)
        ↓ Sharp compositing (resize + composite + blend)
generated/<densidade>/<id>.webp
```

## Arquitetura nova (Sprint 35D — `sourceType: 'full-card-artwork'`)

```
preset.artwork  (UMA imagem, já pronta)
        ↓ Sharp — só resize + reencode WebP, ZERO composite/filtro
generated/<densidade>/<id>.webp
        ↓
FullArtworkWorldLegendsCard
  <CardRoot (tilt)>
    <ArtworkImage />          — next/image, a única fonte visual
    <HudReact />               — OVR/posição/nome/país/era/stats/trait,
                                  posicionados nas safe zones do preset
    <InteractionLayer />       — reservada pra feedback futuro
  </CardRoot>
```

Os dois `sourceType` coexistem no MESMO schema (`CardArtworkPreset`) e
no MESMO script de build — `sourceType` ausente = `'layered'` (default,
nenhum preset da Sprint 35B quebra).

## Schema

```ts
type CardArtworkPreset = {
  id: string;
  rarity: 'common'|'rare'|'elite'|'legendary'|'ultra'|'world-cup-hero'|'goat';
  sourceType?: 'layered' | 'full-card-artwork'; // ausente = 'layered'
  source: { background, player, light, particles };  // só 'layered'
  composition: { playerScale, playerOffsetX, playerOffsetY };  // só 'layered'
  artwork?: string | null;   // só 'full-card-artwork' — aceita nome puro
                              // OU caminho relativo completo (as duas
                              // convenções já apareceram em presets reais)
  hudLayout?: Partial<HudFieldsLayout> | null;  // só 'full-card-artwork'
  generated: { compact, standard, showcase };  // sempre, escrito pelo build
  frame: string | null;
};

type HudZone = { x: number; y: number; width?: number; height?: number }; // percentual
type HudFieldsLayout = {
  overall: HudZone; position: HudZone; name: HudZone;
  country?: HudZone; era?: HudZone;
  stats?: HudZone; statsTop?: HudZone; statsBottom?: HudZone;
  trait?: HudZone;
};
```

**Por que uma zona só (não 3 por densidade)**: coordenadas percentuais
já são independentes de tamanho — 17% da esquerda é 17% da esquerda em
qualquer densidade. O preset real entregue (`wl-goat-brazil-001.json`)
confirmou esse formato flat na prática. "3 layouts (compact/standard/
showcase)" (item 8 do brief) virou uma decisão de **densidade de
informação**, não de posição: o componente esconde `stats`/`trait` em
Compact (mesma filosofia do Card Engine v3, Sprint 33/34), não porque
um layout universal manda, mas por decisão de UX explícita — qualquer
preset pode, no futuro, forçar outro comportamento.

## Arquivos criados

```
apps/web/public/assets/cards/source/artworks/{common,rare,elite,legendary,ultra,world-cup-hero,goat}/
apps/web/public/assets/cards/metadata/wl-goat-brazil-001.json      (preset real, entregue durante a sprint)
apps/web/lib/card-static/hud-layout.ts        — HudZone/HudFieldsLayout, DEFAULT_HUD_LAYOUT, resolveHudLayout
apps/web/lib/card-static/full-artwork.ts      — checkCardAspectRatio, checkArtworkResolution (funções puras, testadas)
apps/web/lib/card-static/resolve-artwork.ts   — resolveGeneratedArtwork (lookup no manifesto, testado)
apps/web/components/dev/FullArtworkWorldLegendsCard.tsx
apps/web/components/dev/FullArtworkCardPage.tsx
apps/web/app/dev/full-artwork-card/page.tsx
apps/web/tests/lib/full-artwork.test.ts       — 17 testes novos
```

**Arquivos estendidos (não substituídos)**: `lib/card-static/types.ts`
(campos novos, nada removido), `scripts/cards/_shared.mts`
(`artworkPath` aceita as 2 convenções de caminho), `build-card-artworks.mts`
e `validate-card-assets.mts` (branch por `sourceType`, lógica `layered`
100% intacta), `generate-card-manifest.mts` (inclui `sourceType`/
`hudLayout` no manifesto).

## O preset sintético que eu tinha criado — removido

Antes de saber que um artwork real existia, criei um preset de teste
(`goat-full-artwork-001.json`) com um placeholder gerado por mim. Assim
que descobri `wl-goat-brazil-001.json` + o artwork real
(`wl-artwork-goat-brazil-001-v1.png`, entregue durante a sessão), apaguei
meu preset sintético e seu `.webp` — confirmado por auditoria própria
nesta mesma sprint (ver troca de mensagens). O preset real é o único
`full-card-artwork` em produção nesta ferramenta hoje.

## O player com checkerboard (Sprint 35B) — intocado

`goat-validation-001` (o preset `layered` da Sprint 35, com o player
cujo canal alpha é uniformemente opaco — o "xadrez" queimado nos
pixels) continua existindo, continua gerando seus 3 artworks, e o
validador continua emitindo o warning sobre ele a cada execução — não
foi apagado, não foi usado no novo pipeline, não bloqueou nada (item 11
do brief).

## Screenshots

`/private/tmp/.../scratchpad/sprint18_9/`:
- `s35d_full_artwork_page.png` — página completa: sem HUD, com HUD, 3
  densidades lado a lado, fallback procedural.
- `s35d_compact_zoom.png` — zoom na Compact: OVR "97" e nome legíveis
  mesmo no menor tamanho, stats corretamente ocultos.
- Confirmado visualmente: os números de OVR/stats caem EXATAMENTE
  dentro das caixas decorativas que a própria arte já desenha (badge
  de diamante, 6 caixinhas de stat) — a `hudLayout` do preset foi
  calibrada pra essa arte específica.

## Pesos

| Preset | Compact (alvo 80KB) | Standard (alvo 180KB) | Showcase (alvo 350KB) |
|---|---|---|---|
| `goat-validation-001` (layered) | 54KB ✓ | 113KB ✓ | 159KB ✓ |
| `wl-goat-brazil-001` (full-card-artwork) | 81KB ⚠ (+1KB) | 265KB ⚠ (+85KB) | 420KB ⚠ (+70KB) |

Os 3 tamanhos do artwork real passaram da meta — esperado: é uma
ilustração rica (filigrana dourada, partículas, textura), muito mais
detalhada que qualquer coisa sintética. `cards:build` **não falhou**
por isso (comportamento correto do brief: warning, não erro).
Otimização de compressão fica pra depois, não é o escopo desta sprint.

## DOM

- **Estrutura principal**: `CardRoot` → exatamente 3 filhos diretos
  (`ArtworkImage`, `HudReact`, `InteractionLayer`) — confirmado por
  leitura do componente, satisfaz o critério "no máximo três camadas
  DOM principais" (item 6 dos critérios de aceite) na sua forma
  arquitetural (estrutura de topo), não como contagem total de nós —
  os campos de HUD (OVR/posição/nome/país/era/6 stats) somam nós
  aninhados DENTRO de `HudReact`, isso é esperado e não viola o
  critério.
- **Total medido ao vivo** (grade de 200 cartas Compact,
  `querySelectorAll('*').length`): 2600 nós ÷ 200 = **13 nós/carta** —
  ainda assim ~4× menos que os 57 nós/carta do `PlayerCard` (Card
  Engine v3, Sprint 34).

## FPS (1/10/50/200 cartas, Compact, medido ao vivo — mesma técnica de `/dev/card-stress-test`)

| Cartas | FPS médio | FPS mínimo |
|---|---|---|
| 1 | 60 | 56 |
| 10 | 60 | 56 |
| 50 | 60 | 56 |
| 200 | 59 | 20 |

Praticamente idêntico ao resultado da Sprint 35B
(`StaticWorldLegendsCard`: 60/60/60/60) — o mínimo de 20fps em 200
cartas aparece só durante a rajada inicial de carregamento de 200
imagens `next/image` de uma vez (não é sustentado; a média continua em
59). Comparação: `PlayerCard` real caía pra 23fps médio em 200 cartas
(Sprint 34).

## Layout shift

Não medido via Web Vitals/CLS instrumentado (fora do escopo de uma
ferramenta dev), mas **estruturalmente prevenido**: `next/image` recebe
`width`/`height` nativos explícitos (400×600/800×1200/1200×1800) em
toda instância — o navegador reserva o espaço antes da imagem carregar,
que é exatamente o mecanismo que elimina CLS por imagem. Nenhum
elemento do HUD depende do tamanho da imagem carregada (posições são
percentuais fixas do container, não da imagem).

## Fallback

Confirmado ao vivo em 3 camadas:
1. **Artwork ausente** (preset/densidade sem `.webp` gerado) —
   `FullArtworkWorldLegendsCard` mostra um placeholder de texto, nunca
   quebra a tela (testado via `resolveGeneratedArtwork`, 4 testes).
2. **Preset sem `hudLayout`** — cai no `DEFAULT_HUD_LAYOUT` inteiro
   (testado, 3 testes).
3. **Fallback de produção** — o `PlayerCard` real (Card Engine
   procedural, Sprint 27/28) continua funcionando sem nenhuma mudança,
   demonstrado ao vivo na própria página `/dev/full-artwork-card`
   (última seção) com a mesma carta GOAT sem `v3CompositionId`.

## Riscos

- **Peso do artwork real** acima da meta em todas as 3 densidades —
  compressão/otimização é um próximo passo, não bloqueante hoje (a
  ferramenta é dev-only).
- **Resolução-fonte** (848px) abaixo do mínimo recomendado pro Showcase
  (1200px) — o validador já avisa disso; próximos assets devem vir em
  resolução maior.
- **Convenção de caminho dupla** (`artwork` aceita nome puro OU caminho
  relativo completo) — flexível hoje, mas pode confundir quem cria
  presets novos sem ler `CARD_V3_ASSET_SPEC.md`-equivalente; vale
  documentar/padronizar numa sprint futura.

## Plano de migração

1. Resolver peso/resolução do artwork real antes de qualquer carta de
   produção usar esse pipeline.
2. Adicionar mais presets `full-card-artwork` (uma raridade por vez),
   sempre validando com `cards:validate` antes de `cards:build`.
3. `StaticWorldLegendsCard` (Sprint 35B) e o pipeline `layered`
   continuam existindo — não remover até uma decisão explícita de
   consolidar tudo em `full-card-artwork`.
4. Card Engine (`PlayerCard`) continua sendo o único renderer de
   produção até uma sprint futura decidir promover qualquer um dos
   experimentais.

## QA

```
pnpm cards:validate            → 2 presets, 0 erros, 2 warnings (alpha do goat-validation-001, resolução do wl-goat-brazil-001 — ambos já documentados)
pnpm cards:build --force        → 2 presets, 6 artworks gerados (3 warnings de peso no full-card-artwork, esperado)
pnpm exec biome check .         → 461 warnings (+4 vs baseline 457, mesmas categorias já toleradas no resto do código), 0 erros
pnpm exec tsc --noEmit -p .     → 0 erros
pnpm test (apps/web)            → 243/243 (+17 novos: tests/lib/full-artwork.test.ts)
pnpm build (monorepo)           → sucesso, 34/34 tasks, 28/28 páginas (nova: /dev/full-artwork-card, 4,09kB/272kB)
```

## URL do deploy Vercel Ready

A confirmar após push+deploy (ver mensagem de fechamento).

## Nenhuma mudança em

Economia, odds, catálogo, gameplay, `PlayerCard`/Card Engine de
produção, `StaticWorldLegendsCard` (Sprint 35B, intocado), ou no
player-com-checkerboard (mantido como referência rejeitada, não
apagado, não usado).
