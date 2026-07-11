# Sprint 35D.4 — Neymar and Mbappé Unique Artwork Integration

## Objetivo

Integrar Neymar e Mbappé ao mesmo `resolvePlayerCardRenderer` já existente desde a Sprint 35D.3, sem criar arquitetura paralela. Nenhum resolver novo, nenhum branch por jogador.

## Estado dos assets

| Jogador | Preset esperado | Artwork esperado | Encontrado? |
|---|---|---|---|
| Neymar | `wl-legendary-neymar-001` | `source/artworks/legendary/wl-artwork-legendary-neymar-001-v1.png` | ✅ sim (2.3MB) |
| Mbappé | `wl-elite-mbappe-001` | `source/artworks/elite/wl-artwork-elite-mbappe-001-v1.png` | ❌ não (pasta `elite/` só tinha `.gitkeep`) |

Como combinado ("se não achar as imagens, espera"): Neymar foi integrado de ponta a ponta porque o artwork já estava no disco. Mbappé **não** teve preset/artwork inventado — a identidade já existia na dev tool desde a Sprint 35D.3 (apontando pra `wl-elite-mbappe-001`, um ID que ainda não existe no manifesto), e continua caindo no fallback procedural corretamente. Assim que o PNG for entregue, basta criar `wl-elite-mbappe-001.json` (mesmo formato do Neymar/Ronaldinho) e rodar `cards:build` — nenhuma mudança de código é necessária.

## Preset criado — Neymar

`apps/web/public/assets/cards/metadata/wl-legendary-neymar-001.json` (era um placeholder de 0 bytes, gerado por ferramenta externa antes desta sprint). Mesmo formato do preset do Ronaldinho: `sourceType: "full-card-artwork"`, `hudLayouts` por densidade (nickname oculto em Compact, visível em Standard/Showcase com `align`/`fontScale` próprios), `experimental: false`, `productionEligible: true`.

## Remoção do ignore no biome.json

O `biome.json` tinha uma entrada de `files.ignore` específica para `wl-legendary-neymar-001.json`, adicionada na Sprint 35D.3 pra contornar o parse error do arquivo vazio. Como o arquivo agora tem conteúdo JSON válido, essa entrada foi removida — confirmado que `biome check` passa sem erros sem precisar dela.

**Bug lateral encontrado e corrigido**: `lib/card-static/manifest.generated.ts` (gerado via `JSON.stringify` por `generate-card-manifest.mts`) sempre produziu chaves com aspas duplas, o que o formatter do Biome rejeita (estilo do projeto usa chaves sem aspas). Esse erro já existia silenciosamente desde a Sprint 35D.3 — só não tinha sido pego porque o `biome check` final daquela sprint rodou *antes* do último `cards:build` regenerar o manifesto. Corrigido rodando `biome check --write` no arquivo gerado; recomenda-se sempre reformatar `manifest.generated.ts` depois de qualquer `cards:build`.

## Identidades na dev tool (`/dev/full-artwork-card`)

```json
{ "displayName": "NEYMAR", "shortName": "NEYMAR", "nickname": "O PRÍNCIPE", "nicknameType": "legend", "artworkPresetId": "wl-legendary-neymar-001", "rarity": "legendary", "overall": 94, "position": "LW" }
{ "displayName": "KYLIAN MBAPPÉ", "shortName": "MBAPPÉ", "nickname": "O DITADOR", "nicknameType": "event", "artworkPresetId": "wl-elite-mbappe-001", "rarity": "elite", "overall": 91, "position": "ST" }
```

Ambas já existiam no seletor desde a Sprint 35D.3; nesta sprint só foram atualizados `displayName`/`shortName`/`overall` pra bater exatamente com o brief.

## Outputs gerados (Neymar)

`pnpm cards:build` processou `wl-legendary-neymar-001` como `full-card-artwork` (resize puro, sem composição, sem filtro):

| Densidade | Peso | Alvo | Status |
|---|---|---|---|
| compact | 66KB | 80KB | ✓ dentro do alvo |
| standard | 183KB | 180KB | ⚠ 3KB acima (build não falha por isso) |
| showcase | 287KB | 350KB | ✓ dentro do alvo |

Manifest (`manifest.generated.ts`) regenerado — agora com **4 presets**: `goat-validation-001`, `wl-goat-brazil-001`, `wl-legendary-neymar-001`, `wl-legendary-ronaldinho-001`.

## Verificação ao vivo (Playwright, conta QA)

- **Neymar**: `resolver: full-artwork · nicknameType: lenda`. Artwork exclusivo renderizado (uniforme amarelo/verde do Brasil, cidade litorânea ao fundo, pose distinta) — visualmente diferente de Pelé e Ronaldinho, nenhum reaproveitamento. Compact esconde "O PRÍNCIPE"; Showcase mostra "NEYMAR" com "O PRÍNCIPE" em itálico logo abaixo.
- **Mbappé**: `resolver: procedural — artwork preset pending (preset-not-found) · nicknameType: evento`. Cai no Card Engine procedural sem quebrar a página; o fallback de produção (`PlayerCard`) mostra corretamente "O DITADOR" abaixo do nome (Standard), provando que a regra de nickname funciona independente do resolver de artwork.
- Nenhum erro de console relacionado ao trabalho desta sprint (os únicos 404s observados são de um placeholder de chave do PostHog, pré-existente e não relacionado).

## Testes

`tests/lib/resolve-player-card-renderer.test.ts` — 13 testes (eram 8), novo describe block `Sprint 35D.4 (Neymar e Mbappé)`:
- Neymar resolve `full-artwork` com preset elegível.
- Mbappé resolveria `full-artwork` pelo MESMO resolver (fixture sintética, prova a generalização sem branch por jogador).
- Artwork de Neymar nunca reutilizado por Mbappé (arquivos `.webp` distintos).
- **Estado real hoje**: manifesto de produção contém `wl-legendary-neymar-001` com `productionEligible: true` e resolve `full-artwork`.
- **Estado real hoje**: `wl-elite-mbappe-001` NÃO está no manifesto de produção ainda (asset pendente) e cai em `preset-not-found` sem quebrar.

Suite completa: **262/262 passando** (era 257).

## QA gate

- `pnpm exec biome check .` — 0 erros, 462 warnings (mesmo baseline).
- `pnpm exec tsc --noEmit -p .` — limpo.
- `pnpm test` — 262/262.
- `pnpm cards:validate` — 0 erros, 4 warnings pré-existentes (nenhum novo).
- `pnpm cards:build` — 4 presets processados, manifest regenerado e reformatado.
- `pnpm build` (monorepo) — 34/34 tasks, build limpo.

## Arquivos alterados/criados

**Modificados:**
- `apps/web/biome.json` (removido ignore específico do Neymar)
- `apps/web/components/dev/FullArtworkCardPage.tsx` (identidades Neymar/Mbappé atualizadas + comentário de topo)
- `apps/web/lib/card-static/manifest.generated.ts` (regenerado + reformatado)
- `apps/web/public/assets/cards/metadata/wl-legendary-neymar-001.json` (preenchido, era placeholder vazio)
- `apps/web/tests/lib/resolve-player-card-renderer.test.ts` (+5 testes)

**Criados:**
- `apps/web/public/assets/cards/generated/{compact,standard,showcase}/wl-legendary-neymar-001.webp`

**Não alterados** (confirmado): catálogo real, economia, odds, gameplay, artwork fonte (Neymar), `resolvePlayerCardRenderer.ts` (nenhum resolver novo, nenhuma lógica dedicada por jogador).

## Pendência — Mbappé

Assim que `wl-artwork-elite-mbappe-001-v1.png` for entregue em `source/artworks/elite/`:
1. Criar `wl-elite-mbappe-001.json` (mesmo formato do Neymar/Ronaldinho, `productionEligible: true`).
2. Rodar `pnpm cards:validate` e `pnpm cards:build`.
3. Rodar `biome check --write lib/card-static/manifest.generated.ts`.
Nenhuma mudança de código adicional necessária — a dev tool e o resolver já reconhecem `wl-elite-mbappe-001` automaticamente.

## Vercel Ready URL

_A confirmar após deploy._
