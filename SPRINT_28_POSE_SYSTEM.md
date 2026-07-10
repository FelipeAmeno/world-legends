# Sprint 28 — Pose System

**Objetivo:** hoje praticamente todas as cartas têm a mesma postura (a
camisa genérica removida na Sprint 26). Criar um Pose Engine onde cada
jogador recebe uma pose baseada em posição + raridade + estilo, nada
hardcoded, preparado pra centenas de poses futuras.

## Decisão de arquitetura: ângulos, não desenhos

A exigência "nada hardcoded, preparado pra centenas de poses futuras"
significa que adicionar uma pose nova precisa ser BARATO. Se cada pose
fosse um SVG desenhado à mão (como o antigo `JerseyArt`), centenas de
poses = centenas de desenhos vetoriais mantidos à mão — o oposto de
"preparado pra escalar".

Em vez disso: um **rig articulado** (`lib/pose-engine/rig.ts`) desenha
QUALQUER pose a partir de 10 ângulos (tronco, cabeça, ombro/cotovelo
esquerdo e direito, quadril/joelho esquerdo e direito) via cinemática
direta (forward kinematics — cada osso é um segmento de reta a partir do
ponto de ancoragem do osso anterior, na direção do ângulo configurado).
Uma pose nova = um objeto de 10 números em `poseCatalog.ts`, nunca um
desenho novo. O mesmo componente (`PoseFigure.tsx`) desenha as 14 poses
de hoje e as centenas de amanhã sem nenhuma mudança de código.

## Os 5 pedaços do brief

| Pedido | Onde |
|---|---|
| PoseLayer | `components/cards/pose/PoseFigure.tsx` — desenha um `PoseDef` como silhueta articulada (SVG, cinemática direta) |
| Pose Resolver | `lib/pose-engine/poseResolver.ts` — `positionToPoseCategory`, `candidatePoses`, `resolvePose` |
| Pose Metadata | `lib/pose-engine/types.ts` (`PoseDef`) + `lib/pose-engine/poseCatalog.ts` (14 poses) |
| Pose Preview | `/dev/card-assets` → "Pose (Pose Engine)" (pose ativa) |
| Pose Debug | `/dev/card-assets` → "Pose Gallery" (todas as candidatas pra posição+raridade atuais, a ativa em destaque) |

## Catálogo — 14 poses, 4 categorias (exatamente as do brief)

- **Atacante** (5): Correndo, Chutando, Comemorando, Voleio*, Bicicleta**
- **Meia** (3): Dominando, Girando, Passando
- **Defensor** (3): Carrinho, Interceptação, Disputa Aérea
- **Goleiro** (3): Defesa, Salto, Espalmando

`*` Voleio exige raridade Elite+, `**` Bicicleta exige Legendary+ — as
poses mais espetaculares não aparecem em cartas Common/Rare (decisão de
design própria: uma bicicleta clássica só faz sentido pra uma lenda,
mecanicamente análogo a como raridades altas já ganham mais
partículas/luz na Scene Procedural, Sprint 27).

## Resolução — determinística, reaproveitando o mesmo seed da Scene

`resolvePose(position, rarityCode, rng)` recebe um `Rng` já derivado do
MESMO seed procedural da Scene (`SceneGenerator.ts` deriva um canal
`'pose'` dedicado) — a pose de uma carta nunca muda entre renders, e é
resolvida no mesmo lugar/seed que o resto da cena, nunca um sistema
paralelo. `positionToPoseCategory` mapeia as 15 posições reais do jogo
pras 4 categorias (CDM → defender, CAM → midfielder, por papel tático
real).

## Bug real corrigido (mesma raiz da Sprint 27)

`resolveRigJoints`/`polarOffset` usam `Math.sin`/`Math.cos`, que também
sofriam do mesmo hydration mismatch de float-pra-string documentado no
relatório da Sprint 27 — corrigido com o mesmo arredondamento (`round2`,
2 casas decimais) na fonte (`rig.ts`), confirmado ao vivo sem erro de
console depois da correção.

## Segundo bug real corrigido — contraste

Primeira versão renderizava a silhueta em tom escuro (`#12131c`) sobre um
fundo de estádio também escuro (`getStadiumBg` é sempre um tom noturno)
— a pose ficava efetivamente invisível na carta, mesmo com os dados
corretos no painel de debug. Corrigido pra uma silhueta CLARA
(`#dfe1ea`, efeito "atleta contra-luz" em vez de sombra) + `drop-shadow`
com a cor de raridade como rim-light — confirmado visualmente ao vivo
(antes/depois) que a pose passou a aparecer com clareza em qualquer
raridade/país.

## Integração — zero mudança na API pública do PlayerCard

O Pose Engine só é consumido internamente por
`SceneGenerator`/`ProceduralSceneLayer` (Sprint 27) — nenhum call site
externo, nenhuma prop nova em `PlayerCard`.

## QA

```
tests/lib/procedural-scene.test.ts (seção "Pose Engine") → 5/5
  - mapeamento posição → categoria
  - poses espetaculares só Elite+/Legendary+
  - resolvePose determinístico (mesmo seed → mesma pose)
  - todas as 10 posições resolvem sem erro
pnpm exec tsc --noEmit -p .   → 0 erros
pnpm exec biome check .       → 457 warnings, 0 erros
pnpm test                     → 210/210
```

Testado ao vivo: Pose Gallery em `/dev/card-assets` mostra as poses
distintas lado a lado (Correndo/Chutando/Comemorando/Voleio/Bicicleta
pra atacante) — silhuetas visualmente diferenciadas, não variações
triviais umas das outras. Confirmado em `/squad` (grade de cartas reais)
e `/profile` (Melhor Carta) que cada jogador mostra uma pose coerente
com sua posição.

Nenhuma mudança em economia, packs, Supabase, ou gameplay/match engine.
