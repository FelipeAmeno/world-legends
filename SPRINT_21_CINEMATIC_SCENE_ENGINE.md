# Sprint 21 — Cinematic Scene Engine

**Objetivo:** transformar o centro da carta em uma cena cinematográfica,
sem quebrar o sistema atual. Sem mudança de gameplay, economia, Supabase,
odds de packs ou API pública do `PlayerCard`.

---

## 1. SceneLayer criada

Nova camada `components/cards/layers/CardSceneLayer.tsx`, seguindo
exatamente o mesmo padrão de toda camada asset-capable do engine
(`ImageLayer` + resolver dedicado + `fallback={null}` quando ausente —
mesmo tratamento de Player Art/Pattern/Pose antes da primeira arte real):

```tsx
export function CardSceneLayer({ ctx }: { ctx: CardVisualCtx }) {
  if (ctx.hiddenLayers?.has('scene')) return null;
  return (
    <ImageLayer
      asset={resolveScene(ctx.card.playerId)}
      alt=""
      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      style={{ zIndex: 4 }}
      fallback={null}
    />
  );
}
```

## 2. Ordem das camadas

Composição real em `PlayerCard.tsx` (a fonte de verdade — ver "Layer
order" em `/dev/card-assets`, item 8):

```
1. Background   6. Scene        11. Pose
2. Material     7. Reflection   12. Partículas
3. Ambient      8. Glow         13. HUD
4. Efeito de    9. Kit (camisa) 14. Shine
   raridade    10. Player Art
5. Frame
```

Scene entra logo depois do Frame e antes do Reflection — ou seja, depois
de FX/Efeito-de-raridade e antes do bloco Kit/Player Art/Pose, exatamente
como pedido ("Scene, Kit/Pose fallback atual, Frame..." conceitualmente —
na composição real, Frame já rendeirzava antes do bloco Kit desde a
Sprint 18.5/19, então Scene entra no mesmo ponto relativo, sem reordenar
nenhuma das 13 camadas já existentes e caladamente ajustadas). `zIndex: 4`
— atrás de Kit/Pattern/Player Art/Pose (`zIndex: 5`) e do Efeito de
raridade (`zIndex: 6-7`), à frente de Material/Ambient/Background — Scene
funciona como pano de fundo do jogador, não compete visualmente com ele.

**Por que não reordenei tudo literalmente como no brief:** as camadas
existentes já usam `zIndex` explícito por posicionamento absoluto — quem
controla o empilhamento visual final é o `zIndex`, não a ordem no JSX/DOM
(para elementos posicionados, a ordem no DOM só desempata `zIndex`
iguais). Mover Frame/Reflection/Shine/HUD/Glow de lugar no JSX teria risco
real de regressão visual em camadas já calibradas nas Sprints 18.5–18.9,
sem nenhum ganho — o resultado visual final (o que importa) já bate com a
intenção do brief: Scene atrás do jogador, na frente do fundo/efeitos de
raridade.

## 3–5. Busca de asset, renderiza se existe, fallback se não

`resolveScene(playerId)` em `lib/card-asset-loader.ts` busca
`scenes/scene-{playerId}.webp` via o manifesto gerado automaticamente
(mesmo pipeline de sempre — `resolveCardAsset('scenes', 'scene-{id}')`).
Sem asset: `ImageLayer` recebe `asset=null`, renderiza `fallback={null}` —
zero DOM extra, zero mudança visual. Com asset: renderiza a imagem via
`<img>`, aplicando scale/offset/rotation/blendMode/blur/opacidade do
sidecar automaticamente (mesma primitiva `ImageLayer` de toda outra
camada — nenhum código novo de renderização precisou ser escrito pra
isso).

## 6. Metadata sidecar

Suportado integralmente, reaproveitando o schema já existente desde a
Sprint 18.9 (`ResolvedCardAsset`/`ImageLayer`) — nenhum campo novo
precisou ser criado:

| Campo pedido | Suportado via |
|---|---|
| `scale`, `offsetX`, `offsetY`, `rotation` | `ResolvedCardAsset` (desde Sprint 18.6) |
| `blendMode` | `ResolvedCardAsset.blendMode` (desde Sprint 18.6, agora com `plus-lighter` desde 18.9) |
| `blur` | `ResolvedCardAsset.blur` (Sprint 18.9) |
| `animationSpeed` | `ResolvedCardAsset.animationSpeed` (Sprint 18.9 — só relevante se Scene ganhar uma variante animada no futuro; suportado mas sem uso ainda, já que Scene é uma imagem estática) |
| `opacity` / `intensity` | Um único campo (`intensity`, 0–1) desde a Sprint 18.6 — "opacity" e "intensity" sempre foram o mesmo conceito no pipeline, não dois campos separados (mesma reconciliação já documentada na Sprint 18.9) |

## 7. Manifest automático

`scripts/generate-card-asset-manifest.mts`: `'scenes'` adicionado ao
array `CATEGORIES` — o manifesto (`predev`/`prebuild`) passa a varrer
`public/assets/cards/scenes/` automaticamente, mesmo mecanismo de sempre
(sidecar JSON opcional, `.webp`/`.png`/`.jpg`/`.svg` aceitos). Pasta
criada com `.gitkeep` (mesmo padrão de `poses/`).

## 8. `/dev/card-assets` atualizado

Tudo via o mecanismo genérico já existente (`buildAllCardAssetDiagnostics`
itera por categoria — só precisei registrar `scenes` nela e em
`card-asset-expectations.ts`, `expectedScenes()` gerando as 574 chaves
esperadas `scene-{playerId}`):

- **Contagem encontradas/faltando**: automática — nova seção "scenes" no
  "Resumo por categoria" e no "Diagnóstico por asset", mesma tabela de
  toda outra categoria.
- **Preview isolado**: modo Visual Debug já suporta isolar qualquer
  camada via ⭐ — `scene` adicionado a `ALL_LAYERS` em
  `CardPreviewPanel.tsx`, testado ao vivo (isola a camada, mostra só o
  Scene — hoje em branco, já que não existe asset).
- **Metadata**: coluna "Metadata" da tabela de diagnóstico já mostra o
  sidecar aplicado por asset, genérico pra qualquer categoria — funciona
  pra Scene sem nenhuma mudança extra.
- **Validação de resolução/proporção**: `diagnoseOne()` já roda essa
  checagem (tolerância ±5%, mínimo 512px) pra qualquer categoria — Scene
  incluída automaticamente.
- **Preview final com/sem scene**: o toggle on/off do Visual Debug já
  entrega exatamente isso — liga/desliga a camada Scene no preview ao
  vivo pra comparar visualmente.
- Badge "Scene: asset real / fallback" adicionado à seção "Camadas — asset
  real vs. fallback procedural" do preview ao vivo.

Confirmado ao vivo (Chrome real, screenshot): "Scene: fallback" aparece
corretamente, botão "Scene" no Visual Debug funciona, "6. Scene" aparece
na posição certa da lista "Layer order".

## 9. Documentação atualizada

- `WORLD_LEGENDS_ART_PIPELINE.md`: nova categoria "Scene" na tabela de 9
  categorias (era 8), seção "O que é Scene, exatamente", prioridade de
  produção atualizada, especificação técnica (formato/transparência)
  cobrindo Scene, tabela de metadata sidecar atualizada com `blur`/
  `animationSpeed`/`plus-lighter` (que já existiam desde a Sprint 18.9 mas
  não tinham sido documentados ali ainda — corrigido nesta passada).
- `apps/web/docs/CARD_ASSETS_GUIDE.md`: nota de redirecionamento
  atualizada pra citar Scene entre as categorias cobertas pelo guia atual.

## 10. Validação — zero regressão

Chrome real + conta de teste autenticada, sem nenhum asset de Scene
existente (confirma o critério de sucesso: "com 0 scenes reais, o app
fica visualmente idêntico"):

- **`/dev/card-assets`** — preview, diagnóstico, Visual Debug, tudo
  funcionando, Scene aparece em todas as seções esperadas.
- **Coleção** (`/collection`) — sem erro de console, sem regressão.
- **Squad** (`/squad`) — grade `xs` com 5 cartas, glow por raridade,
  idêntico a antes.
- **Perfil** (`/profile`) — carta "Melhor Carta" (`lg`, glow) idêntica
  pixel a pixel à screenshot da Sprint 20.5 (mesma carta Elite, mesmo
  glow azul, nenhuma diferença visível).
- **Packs** (`/packs`) — lista de 6 packs renderiza corretamente, badges
  "Mínimo X" (piso de garantia) refletem a economia corrigida na Sprint
  20.5 (Starter mostra "Mínimo 1 Rara", nunca menciona Legendary).
- **Card Detail**: não testado ao vivo nesta sprint (conta de teste com
  poucas cartas reais na aba padrão da Coleção) — garantia vem do
  componente `PlayerCard` compartilhado, já validado em `xs`/`sm`/`lg` nas
  outras telas.

## 11. Build gates

```
pnpm exec biome check .   → 464 warnings, 0 erros (mesmo baseline de sempre)
pnpm exec tsc --noEmit    → 0 erros
pnpm test                 → 204/204 testes passando
pnpm build                → sucesso, 24/24 páginas, bundles inalterados (/dev/card-assets 9.56→9.58kB, resto idêntico)
```

## Critério de sucesso

✅ Com 0 scenes reais, o app fica visualmente idêntico — confirmado
(fallback `null`, mesmo padrão comprovado em toda camada asset-capable
desde a Sprint 18.5).

✅ Com scenes reais adicionadas (`scenes/scene-{playerId}.webp`), o
`PlayerCard` passa a usar a cena cinematográfica automaticamente, sem
nenhuma mudança de código — mesmo pipeline "solte o arquivo, o jogo
encontra sozinho" já provado pelos 12 assets de Frame/Background
integrados nas Sprints 18.6–18.8.

## Arquivos criados/modificados

**Novos:** `components/cards/layers/CardSceneLayer.tsx`,
`public/assets/cards/scenes/.gitkeep`, `SPRINT_21_CINEMATIC_SCENE_ENGINE.md`.

**Modificados:** `lib/card-asset-loader.ts` (`resolveScene`),
`scripts/generate-card-asset-manifest.mts` (categoria `scenes`),
`lib/dev/card-asset-expectations.ts` (`expectedScenes`),
`lib/dev/card-asset-diagnostics.ts` (categoria `scenes` no diagnóstico),
`components/cards/card-types.ts` (`'scene'` em `CardLayerName`),
`components/cards/PlayerCard.tsx` (import + render de `CardSceneLayer`),
`components/dev/CardPreviewPanel.tsx` (Scene no Visual Debug + badge de
status), `WORLD_LEGENDS_ART_PIPELINE.md`, `apps/web/docs/CARD_ASSETS_GUIDE.md`.

**Não modificado:** gameplay, economia, Supabase, odds de packs, API
pública do `PlayerCard` (`{ card, size, glow, attributes?, hiddenLayers?,
debugOverride? }` continua idêntica — nenhum call site precisou mudar).
