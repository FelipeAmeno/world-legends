# Sprint 34 — World Legends Official Art Pack Integration (relatório final)

Objetivo do brief: integrar um primeiro conjunto controlado de arte
oficial (5 cartas) alimentando o Card Engine reconstruído na Sprint 33,
sem reinventar o motor. Ver `CARD_V3_ASSET_SPEC.md` (contrato de
assets/metadata) e `CARD_V3_GALLERY_GUIDE.md` (como usar as ferramentas
novas).

## Assets integrados: nenhum ainda — decisão tomada com o usuário

Antes de escrever qualquer código, auditei `docs/references/` e
`public/assets/cards/` e confirmei que **não existe nenhum arquivo de
arte real no repositório** — só a imagem de referência única
(`card-reference-v3.png`). Eu não tenho como gerar arte de jogo real
(fotos/ilustrações licenciadas). Perguntei ao usuário como proceder;
ele escolheu **construir a infraestrutura agora**, usando o sistema
procedural da Sprint 33 como conteúdo de validação até arte real ser
fornecida.

Por isso esta sprint entregou o **pipeline completo** (estrutura de
pastas, resolver por ID, schema de metadata, integração canal-a-canal
no motor existente, duas ferramentas de QA) — mas as "5 cartas
completas" pedidas pelo brief hoje renderizam via fallback procedural
(Sprint 27/28), não arte real. No dia em que os arquivos chegarem (ver
`CARD_V3_ASSET_SPEC.md`), essas mesmas 5 composições passam a usar arte
real sem nenhuma mudança de código — confirmado por teste (5 testes em
`tests/lib/card-v3-resolver.test.ts` provam a resolução por ID
funcionando com dados reais mockados).

## O que foi construído

### 1. Estrutura de assets + metadata (`CARD_V3_ASSET_SPEC.md`)

`public/assets/cards/v3/{backgrounds,players,patterns,lights,particles,
frames,metadata}/` — escaneada automaticamente por
`scripts/generate-card-asset-manifest.mts` (estendido, não duplicado —
mesma função `scanCategory` reaproveitada com um `baseDir` novo). Uma
composição (`metadata/<id>.json`) referencia os 6 canais por ID
explícito + o schema de transform exato do brief (scale/offsetX/
offsetY/rotation/opacity/blendMode/blur/intensity/parallaxDepth) — zero
"exceção específica direto no JSX", tudo dado.

### 2. Integração canal-a-canal, não tudo-ou-nada

`ProceduralSceneLayer.tsx` (Sprint 27/28) ganhou um prop `v3` opcional
— cada canal (background/pattern/light/player/particles) checa a
composição primeiro, cai pro procedural individualmente se ausente.
`CardFrameLayer.tsx` ganhou o mesmo tratamento pro canal de frame. Uma
composição pode trazer só um background real e deixar o resto
procedural — decisão deliberada (mais flexível que decidir tudo-ou-nada
por carta).

### 3. Ordem de composição corrigida

O brief especifica `04 Player Pose → 05 Front Particles` (partículas
NA FRENTE do jogador). A implementação da Sprint 27 renderizava
partículas ANTES da pose (atrás). Corrigido — partículas (procedurais
ou v3) agora renderizam depois da pose no DOM, confirmado visualmente
ao vivo (Squad, `/dev/card-v3-gallery`).

### 4. HUD — goleiro com rótulos próprios

`CardAttributesLayer` mostrava sempre RIT/FIN/PAS/DRI/DEF/FIS. Goleiros
agora mostram DIV/HAN/KIC/REF/SPD/POS (mesmos 6 slots numéricos —
`CardAttributes` não tem um segundo conjunto de campos por posição,
isso é puramente sobre rótulo).

### 5. Performance (item 9 do brief)

- **`prefers-reduced-motion`**: regra global nova em `globals.css`
  (achata toda `animation`/`transition` da árvore inteira quando o SO
  pede menos movimento — técnica padrão, não remove elementos).
- **Cards fora da viewport não animam**: `useCardInViewport`
  (`IntersectionObserver`, `rootMargin: 200px`) + classe `.card-offscreen`
  que pausa (`animation-play-state: paused`) todos os descendentes
  animados do card.
- **Compact reduz partículas**: metade da contagem (arredondado pra
  cima) quando `ctx.mode === 'compact'`.
- **Zero re-render por movimento de ponteiro**: já era verdade antes
  desta sprint — `use-card-tilt.ts` usa `style.setProperty` direto no
  DOM, nunca `useState` (confirmado por leitura de código, nenhuma
  mudança necessária).

**Medição real** (`/dev/card-stress-test`, estendida pra usar a
densidade certa por tier — 1 Showcase/10 Standard/50 Compact/200
Compact, antes fixo em "sm" pra tudo):

| Cartas | Densidade | FPS médio | FPS mínimo | Amostras |
|---|---|---|---|---|
| 1 | Showcase (lg) | 60 | 53 | 240 |
| 10 | Standard (md) | 60 | 53 | 240 |
| 50 | Compact (sm) | 30 | 19 | 119 |
| 200 | Compact (sm) | 23 | 15 | 91 |

50/200 cartas ficam abaixo de 60fps — esperado (grid com centenas de
elementos animados simultâneos é o pior caso de propósito da
ferramenta), mas o viewport-gating desta sprint já reduz o custo real
(a maioria das 200 cartas fica fora da viewport de 1000px de altura
numa grade 9-por-linha). Sem essa otimização os números seriam piores.

### 6. Duas ferramentas de QA novas

- **`/dev/card-v3-gallery`** — 5 cartas de validação, 3 densidades,
  toggle de camada, reroll procedural, scale/offset temporário,
  comparação lado a lado com `card-reference-v3.png` (copiada pra
  `public/dev-reference/` só pra essa comparação interna — nunca vira
  asset de carta, nunca é consumida pelo motor).
- **`/dev/pack-reveal-qa`** — abre o `CardRevealScene` real de produção
  com raridade escolhida manualmente (Common/Rare/Elite/Legendary/
  Ultra/World Cup Hero), sem chamar `openPack()` (odds intactas) e sem
  nenhuma escrita no Supabase (nenhuma server action é invocada).

## Comparação com a referência oficial

Testado ao vivo em `/dev/card-v3-gallery` com as 5 raridades lado a
lado da referência: a progressão de intensidade (luz/partículas/brilho
do frame) e a proporção da pose (~88% da largura, igual à Sprint 33)
já batem com o espírito da referência. A diferença que resta é
puramente de **arte** (silhueta procedural vs. arte final) — a
composição/hierarquia/proporção do motor já está alinhada, é questão
de "alimentar" quando os arquivos chegarem, exatamente como o brief
pediu.

## Problemas encontrados

- Composição original (Sprint 27) tinha partículas atrás da pose —
  corrigido (ver item 3 acima).
- `/dev/card-stress-test` media todas as densidades como "Compact"
  (`size="sm"` fixo) — não permitia medir Showcase/Standard como o
  brief pede. Estendido pra mapear por tier.
- Nenhum bug de mirroring/layer duplicada/conteúdo atrás do frame foi
  encontrado nesta sprint — a Sprint 33 já tinha resolvido isso.

## Ajustes de metadata

Nenhum — não há composição real ainda pra ajustar. O schema em si
(`CardV3Metadata`) está fixado e testado (`tests/lib/
card-v3-resolver.test.ts`, 5/5).

## Próximos passos

1. Produzir os 5 primeiros assets reais (background/player/pattern/
   light/particles/frame por raridade de validação) seguindo
   `CARD_V3_ASSET_SPEC.md`.
2. Validar em `/dev/card-v3-gallery` antes de promover pra cartas de
   produção.
3. Considerar estender `v3CompositionId` pra jogadores reais do
   catálogo (hoje só as 5 cartas de validação usam).

## QA

```
pnpm exec tsc --noEmit -p .   → 0 erros
pnpm exec biome check .       → 457 warnings, 0 erros (baseline inalterado)
pnpm test (apps/web)          → 225/225 (5 novos: lib/card-v3-resolver)
pnpm build                    → sucesso, 26/26 páginas (2 rotas novas: /dev/card-v3-gallery, /dev/pack-reveal-qa)
```

Testado ao vivo (Playwright, conta de QA): `/dev/card-v3-gallery` (5
raridades × 3 densidades × toggle de camada), `/dev/pack-reveal-qa`
(reveal real por raridade, Legendary e World Cup Hero confirmados),
`/squad`, `/profile`, Pack Reveal real (auto-advance passivo,
reconfirmado pós-refactor de composição), `/dev/card-stress-test`
(medição completa). Nenhuma mudança em economia, odds, preços,
Supabase (schema/RLS), ou gameplay/match engine.
