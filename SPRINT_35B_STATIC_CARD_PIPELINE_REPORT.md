# Sprint 35B — Static Card Pipeline Foundation (relatório final)

Fundação de um pipeline de composição offline (Sharp, build-time) pras
cartas finais serem artworks estáticos leves — sem PixiJS/Konva/Three,
sem substituir o Card Engine atual. Um único preset de validação (GOAT),
exposto só em `/dev/static-card-pipeline`.

## Estrutura criada

```
public/assets/cards/
├── source/backgrounds/wl-bg-goat-stadium-gold-001-v1.png   (cópia do asset real da Sprint 35, v3/backgrounds/)
├── source/players/wl-player-goat-brazil-001-v1.png         (idem, v3/players/)
├── source/{lights,particles,frames}/                       (vazias — nenhum asset real ainda)
├── generated/compact/goat-validation-001.webp     (400×600,  56KB total na pasta)
├── generated/standard/goat-validation-001.webp    (800×1200, 116KB total na pasta)
├── generated/showcase/goat-validation-001.webp    (1200×1800, 160KB total na pasta)
└── metadata/goat-validation-001.json              (o preset)

apps/web/lib/card-static/
├── types.ts                  — schema CardArtworkPreset
└── manifest.generated.ts     — gerado por `cards:manifest`, consumido só em runtime (nunca lê disco)

apps/web/scripts/cards/
├── _shared.mts                  — helpers (loadPresets, sourcePath, dimensões, metas de peso)
├── validate-card-assets.mts     — valida existência/dimensão/alpha de cada canal
├── build-card-artworks.mts      — compõe com Sharp, gera os 3 WebP, atualiza `generated` no preset
└── generate-card-manifest.mts   — varre generated/ + metadata/, escreve manifest.generated.ts

apps/web/components/dev/
├── StaticWorldLegendsCard.tsx          — renderer experimental (artwork + frame CSS + HUD React + tilt)
└── StaticCardPipelineComparison.tsx    — comparação lado a lado + stress test

apps/web/app/dev/static-card-pipeline/page.tsx   — única rota que expõe o novo renderer
```

**Por que `source/` é uma cópia, não um link pro `v3/`**: o pipeline
estático (Sprint 35B) e o Card Engine v3 (Sprint 34/35) são dois
sistemas paralelos por design — o brief explicitly não pede pra
reestruturar o v3. Uma cópia mantém os dois desacoplados; os arquivos
`source/` nunca são sobrescritos pelo pipeline (só lidos).

## Dependências

- **Adicionado**: `sharp` (`^0.35.3`, devDependency) — não estava
  presente nem direta nem transitivamente (`require.resolve('sharp')`
  falhava antes da instalação). Só roda em build-time (scripts Node),
  nunca no runtime do servidor Next — zero risco pra SSR/Vercel.
- **Não instalado**: PixiJS, Konva, Three.js — conforme instrução
  explícita do brief.

## Preset usado

`goat-validation-001.json` (`rarity: "goat"`) — reaproveita os DOIS
assets reais da Sprint 35 (`wl-bg-goat-stadium-gold-001-v1`,
`wl-player-goat-brazil-001-v1`), sem `light`/`particles`/`frame` (não
existem ainda — a composição os omite, não inventa).

## Imagens geradas

| Densidade | Resolução | Peso real | Meta | Status |
|---|---|---|---|---|
| Compact | 400×600 | 54KB | 80KB | ✓ dentro da meta |
| Standard | 800×1200 | 113KB | 180KB | ✓ dentro da meta |
| Showcase | 1200×1800 | 159KB | 350KB | ✓ dentro da meta |

Nenhum warning de peso — todas as 3 saídas vieram folgadas em relação
à meta (qualidade WebP 82, sem ajuste fino ainda necessário).

## Warning real encontrado pela validação (não escondido, não corrigido no asset)

```
⚠ [goat-validation-001] player: canal alpha existe mas é uniformemente
  opaco (min=max=255) — provavelmente o "xadrez de transparência" está
  QUEIMADO nos pixels RGB, não é transparência de verdade. A composição
  vai mostrar o xadrez em vez de recortar o jogador. Precisa de um novo
  export com alpha real antes de ir pra produção.
```

`sharp(...).stats()` confirmou: o PNG do jogador tem 4 canais
(`hasAlpha: true`) mas o canal alpha é uniformemente 255 (totalmente
opaco) — o padrão de xadrez que parece "transparência" está pintado
nos próprios pixels RGB, não recortado de verdade. Isso é visível no
artwork gerado (ver screenshots) e é **um problema do asset de origem**,
não do pipeline — o script fez exatamente o que deveria: compor o que
recebeu, sem tentar "consertar" a imagem sozinho (isso seria
processamento artístico não pedido). O validador (`cards:validate`)
detecta isso antes do build rodar, com uma mensagem acionável.

## Screenshots

`/private/tmp/.../scratchpad/sprint18_9/`:
- `s35b_comparison_standard.png`, `s35b_comparison_showcase.png` —
  `PlayerCard` (Card Engine v3) vs `StaticWorldLegendsCard` lado a
  lado, mesma carta GOAT, 2 densidades. O xadrez do warning acima
  aparece visivelmente no artwork estático — confirmando que o pipeline
  não maquiou o problema.
- `s35b_stress_results.png` — grade de 200 `StaticWorldLegendsCard`
  (Compact) + tabela de FPS por tier.

## Benchmark — Card Engine atual vs pipeline estático

Medido ao vivo (Playwright, mesma técnica de `/dev/card-stress-test`,
janela de 4s por tier):

| Cartas | `PlayerCard` (Card Engine v3, Sprint 34) | `StaticWorldLegendsCard` (Sprint 35B) |
|---|---|---|
| 1 | 60 fps (min 53) | 60 fps (min 53) |
| 10 | 60 fps (min 53) | 60 fps (min 53) |
| 50 | **30 fps** (min 19) | **60 fps** (min 53) |
| 200 | **23 fps** (min 15) | **60 fps** (min 53) |

**DOM nodes por carta** (medido ao vivo, mesma carta GOAT, Standard):
`PlayerCard` = **57 nós** · `StaticWorldLegendsCard` = **7 nós** — 8×
menos.

**Tempo até 1º paint** (medido ao vivo): ambos ~1,3-1,4ms — sem
diferença perceptível nessa métrica isolada (o ganho real aparece em
escala, não numa carta só).

**Impacto no bundle**: rota nova `/dev/static-card-pipeline` = 8,8kB /
271kB First Load JS — comparável às outras ferramentas de dev
(`/dev/card-v3-gallery` = 2,1kB/264kB), nenhum peso extra de biblioteca
gráfica no bundle do cliente (Sharp só existe em Node/build-time).

## Warnings (gerais, não só o de alpha)

Nenhum outro warning emitido pelos scripts nesta execução — 1 preset,
0 erros, 1 warning (o de alpha, documentado acima).

## Recomendação de migração

O ganho de FPS em escala (200 cartas: 23→60fps, DOM nodes: 57→7) é
grande o bastante pra justificar seguir adiante, mas **não migrar tudo
de uma vez**:

1. Resolver o problema de alpha do asset de origem ANTES de qualquer
   coisa (senão toda arte estática nasce com o mesmo xadrez).
2. Migrar primeiro as telas de MAIOR contagem de cartas simultâneas
   (Squad grid, Coleção — Compact) — é onde o ganho de FPS/DOM importa
   de verdade; Showcase (1 carta por vez, Perfil/Card Detail) já roda
   a 60fps nos dois sistemas, ganho marginal.
3. Manter Pack Reveal 100% no Card Engine atual — o brief da Sprint 34
   já pede "Pack Reveal usa o mesmo Card Engine", e a emoção do reveal
   depende da composição em camadas (partículas na frente, flip 3D)
   que um artwork estático único não reproduz.

## Arquivos candidatos à remoção posterior (se a migração avançar)

Nenhum agora — o pipeline estático é aditivo, o Card Engine continua
100% funcional e é a única coisa em produção. Se um dia toda carta de
Compact migrar pro artwork estático, os candidatos naturais seriam as
partes PROCEDURAIS de `ProceduralSceneLayer.tsx` (Background/Light/
Particles geradas em CSS todo render) — não os resolvers em si, que
continuam necessários pro Standard/Showcase.

## QA

```
pnpm cards:validate            → 1 preset, 0 erros, 1 warning (alpha do source, documentado acima)
pnpm cards:build                → 3 artworks gerados, todos dentro da meta de peso
pnpm exec biome check .         → 458 warnings (+1 vs baseline 457 — noArrayIndexKey na grade de stress test,
                                   mesmo padrão já aceito em outros lugares do código), 0 erros
pnpm exec tsc --noEmit -p .     → 0 erros
pnpm test (apps/web)            → 226/226 (inalterado — nenhum teste novo pro pipeline estático nesta fundação)
pnpm build (monorepo)           → sucesso, 34/34 tasks, 27/27 páginas (nova: /dev/static-card-pipeline, 8,8kB/271kB)
```

## URL do deploy Vercel Ready

A confirmar após push+deploy (ver mensagem de fechamento).

## Nenhuma mudança em

Economia, odds, catálogo, gameplay, ou no `PlayerCard`/Card Engine de
produção — `StaticWorldLegendsCard` é 100% aditivo, isolado em
`/dev/static-card-pipeline`.
