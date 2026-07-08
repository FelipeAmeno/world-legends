# Sprint 18.6 — Pipeline de Assets (Claude)

Continuação direta da Sprint 18.5. A fundação em camadas já existia; esta
sprint trocou a descoberta de asset "caminho fixo + tentativa de fetch" por
um **pipeline real**: leitura automática do diretório, metadados por asset
(scale/offset/rotation/blendMode/intensity) e um carregador único para
todas as categorias.

---

## O que foi feito

### 1. Leitura automática do diretório

`scripts/generate-card-asset-manifest.mts` varre `public/assets/cards/`
(backgrounds, effects, frames, kits, patterns, player-art), lista os
arquivos de imagem que existem de verdade, e gera
`lib/card-asset-manifest.generated.ts` — um manifesto estático importado
pelos componentes client. Roda **automaticamente** via `predev`/`prebuild`
(hooks do pnpm em `package.json`) — ninguém precisa lembrar de rodar nada
depois de soltar uma arte nova. Também disponível via
`pnpm generate:card-assets` para rodar à mão durante o desenvolvimento.

Por que gerar um arquivo estático em vez de ler o disco em runtime: os
componentes de camada são `'use client'`, sem acesso a `fs`; gerar uma vez
no build evita I/O de disco a cada render e mantém o app funcionando igual
em dev, build e Vercel (serverless) sem depender de como cada ambiente
expõe `public/` em runtime.

### 2. Metadados por asset (scale, offset, rotation, blendMode, intensity)

Cada imagem pode ter um sidecar opcional `<nome>.json` na mesma pasta:

```json
{
  "scale": 1.08,
  "offsetX": 3,
  "offsetY": -2,
  "rotation": 1.5,
  "blendMode": "screen",
  "intensity": 0.85
}
```

Todos os campos são opcionais — sem sidecar, usa os valores-padrão
(identidade: scale 1, offset 0, rotation 0, blendMode normal, intensity 1).
O gerador lê o sidecar e embute só os campos customizados no manifesto; os
padrões ficam centralizados no carregador (`DEFAULT_META` em
`lib/card-asset-loader.ts`), não duplicados por asset.

`ImageLayer.tsx` foi atualizado para receber um `ResolvedCardAsset`
(em vez de um `src` cru) e aplicar os metadados como CSS real:
`transform: scale() translate() rotate()`, `mixBlendMode`, `opacity`.

### 3. Carregador único

`lib/card-asset-loader.ts` — uma função central,
`resolveCardAsset(kind, key)`, que consulta o manifesto gerado. As 6
camadas asset-capable (frames, backgrounds, effects, glow, kits,
player-art) usam wrappers finos e tipados em cima dela
(`resolveFrame`, `resolveBackground`, `resolveRarityEffect`, `resolveGlow`,
`resolveKit`, `resolvePlayerArt`, `resolvePattern`) — um só ponto de
verdade para "esse asset existe? qual o caminho? quais os metadados?",
substituindo as 6 funções `getXAssetPath` independentes da Sprint 18.5
(`lib/card-assets.ts`, removido nesta sprint).

### 4. Prova real do pipeline (não só teoria)

Para validar de ponta a ponta, um asset de teste foi colocado
temporariamente (`frame-elite.png` + `frame-elite.json` com os valores do
exemplo acima), o manifesto foi regenerado, e o app rodando confirmou via
DOM real:

```
style="z-index:11;transform:scale(1.08) translate(3px, -2px) rotate(1.5deg);
       mix-blend-mode:screen;opacity:0.85"
```

Todos os 5 metadados aplicados corretamente no `<img>` renderizado. O
asset de teste foi removido antes do commit — o manifesto voltou ao estado
vazio (nenhuma arte real existe ainda, como na Sprint 18.5).

---

## Correção durante o QA

O manifesto gerado (`lib/card-asset-manifest.generated.ts`) inicialmente
não batia com a formatação do Biome (`JSON.stringify` cru gera chaves
sempre entre aspas, sem vírgula final) — `pnpm exec biome check` reportava
1 erro de formatação. Corrigido fazendo o próprio gerador chamar
`biome format --write` no arquivo logo depois de escrevê-lo (com fallback
silencioso se o Biome não estiver disponível no ambiente, para nunca
quebrar `predev`/`prebuild`).

---

## Compatibilidade com a Sprint 18.5

Nada mudou na API pública de `PlayerCard` ou nos 11 call sites. As 4
camadas de texto puro (OVR, Nome, Posição, Atributos) continuam sem
nenhuma capacidade de imagem — não fazem parte deste pipeline, por design
(regra dura: texto nunca vem de arte).

## QA

```
pnpm exec biome check .  → 464 warnings, 0 erros (mesmo baseline da Sprint 18.5)
pnpm test                → 204/204 testes passando
pnpm build               → sucesso, prebuild gera o manifesto automaticamente antes do build
```

Manual: confirmado que `pnpm build` dispara o `prebuild` e regenera o
manifesto sozinho; confirmado visualmente (Squad, screenshot) que um
asset com metadados customizados renderiza com o transform/blend/opacity
corretos, sem quebrar layout; confirmado que removendo o asset de teste o
app volta a cair no fallback procedural, exatamente como na Sprint 18.5.

## Arquivos criados/modificados

Novos: `scripts/generate-card-asset-manifest.mts`,
`lib/card-asset-manifest.generated.ts` (gerado, committed vazio),
`lib/card-asset-loader.ts`.

Modificados: `package.json` (scripts `predev`/`prebuild`/
`generate:card-assets`), `components/cards/layers/ImageLayer.tsx`,
`components/cards/layers/{CardBackgroundLayer,CardRarityEffectLayer,
CardFrameLayer,CardKitLayer,CardPlayerArtLayer,CardGlowLayer}.tsx`.

Removidos: `lib/card-assets.ts` (Sprint 18.5) — substituído pelo
carregador único.
