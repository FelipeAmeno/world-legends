# Sprint 35D.3 — Unique Player Artwork and Card Identity System

## Objetivo

Cada jogador (ou versão especial) pode ter uma arte exclusiva completa (`FullArtworkWorldLegendsCard`), com nickname/título de dados exibido de forma density-aware no HUD. Sem gerar arte nova, sem redesenhar existentes, sem substituir o boneco procedural por padrão — só rotear pra arte exclusiva quando ela realmente existe e está pronta pra produção.

## Modelo de identidade

`apps/web/components/cards/card-types.ts`:

```ts
export type PlayerNicknameType = 'legend' | 'official' | 'event' | 'meme';

export type PlayerCardData = {
  // ...campos existentes
  shortName?: string;
  nickname?: string;
  nicknameType?: PlayerNicknameType;
  artworkPresetId?: string;
};
```

Nickname vem sempre dos dados do jogador (`card.nickname`), nunca é inserido na imagem/artwork. Se ausente, nenhum espaço é reservado — o layout colapsa normalmente (comprovado em teste e ao vivo no Squad, onde nenhuma carta real tem `nickname` hoje).

## HUD — regras de densidade (Card Engine produção e Full Artwork)

- **Compact**: nickname oculto.
- **Standard**: nickname opcional, abaixo do nome.
- **Showcase**: nickname visível.

Produção (`CardNameLayer.tsx`): `showNickname = mode !== 'compact' && Boolean(card.nickname)`.

Full Artwork (`lib/card-static/hud-layout.ts`): schema `hudLayouts` por densidade, cada zona aceita `x, y, width?, height?, fontScale?, align?, visible?`. `resolveHudLayout(preset, density)` resolve por prioridade: `hudLayouts[density]` → `hudLayout` legado (flat) → `DEFAULT_HUD_LAYOUT[density]`. `isZoneVisible(zone)` combina existência da zona com `visible !== false`. Nenhuma coordenada é hardcoded no JSX — tudo vem do preset JSON.

## Resolver central

`apps/web/lib/card-static/resolve-player-card-renderer.ts`:

```ts
resolvePlayerCardRenderer(
  { artworkPresetId, cardId, playerId, rarity },
  manifest,
): { renderer: 'full-artwork'; preset } | { renderer: 'procedural'; fallbackReason }
```

Ordem de decisão:
1. Sem `artworkPresetId` → procedural (`missing-artwork-preset-id`)
2. Preset não existe no manifesto → procedural (`preset-not-found`)
3. Preset existe mas nenhuma densidade foi gerada → procedural (`artwork-output-not-found`)
4. `productionEligible !== true` → procedural (`preset-not-production-eligible`)
5. Caso contrário → `full-artwork` com o preset resolvido

Toda tela (dev tool hoje; Pack Reveal/Squad/Collection numa migração futura) chamaria a mesma função — comprovado por teste que simula o shape de uma carta sorteada (`DrawnCard.card`-like) passando pelo resolver sem adaptação.

## Exemplo Pelé (piloto)

Preset real único usado: `wl-goat-brazil-001` (`productionEligible: true`). Identidade de dev:

```json
{ "displayName": "PELÉ", "nickname": "O REI", "nicknameType": "legend", "artworkPresetId": "wl-goat-brazil-001" }
```

Resultado: `resolvePlayerCardRenderer` retorna `full-artwork`, `FullArtworkWorldLegendsCard` renderiza a arte exclusiva do Pelé, "O REI" aparece abaixo do nome em Standard/Showcase e some em Compact. Catálogo real não foi alterado — o piloto vive só na dev tool.

## Integração Ronaldinho

Segundo preset real habilitado nesta sprint: `wl-legendary-ronaldinho-001` (`productionEligible: true`, artwork `source/artworks/legendary/wl-artwork-legendary-ronaldinho-001-v1.png`, formato `hudLayouts` por densidade já com `nickname.visible` explícito por density). Identidade de dev:

```json
{ "displayName": "RONALDINHO GAÚCHO", "shortName": "RONALDINHO", "nickname": "O BRUXO", "nicknameType": "legend", "artworkPresetId": "wl-legendary-ronaldinho-001" }
```

Verificado ao vivo: arte do Ronaldinho é visualmente distinta da do Pelé (nenhum reaproveitamento), "O BRUXO" some em Compact e aparece em Standard/Showcase.

## Fallback (jogadores pendentes)

Messi, Cristiano, Mbappé, Zidane, Ronaldo, Beckenbauer, Maradona e Neymar têm `artworkPresetId` apontando pra presets que ainda não existem/não estão prontos no manifesto — todos caem automaticamente no Card Engine procedural, exibindo `resolver: procedural — artwork preset pending (preset-not-found)` na dev tool, sem quebrar nada e sem inventar arte. `wl-legendary-neymar-001.json` é um placeholder externo de 0 bytes; `loadPresets()` (scripts) e `biome.json` (`files.ignore`) tratam esse arquivo vazio sem derrubar validação/lint.

## Testes

- `tests/lib/full-artwork.test.ts` — 23 testes, incluindo 4 novos cobrindo nickname por densidade no formato real (Compact oculto, Showcase/Standard visível com `align`/`fontScale`, colapso sem espaço reservado quando o dado não existe).
- `tests/lib/resolve-player-card-renderer.test.ts` — 8 testes novos: preset válido/elegível → full-artwork; sem `artworkPresetId` → procedural; preset inexistente → procedural; preset sem output gerado → procedural; `productionEligible: false` → procedural; arte nunca reaproveitada entre Pelé e Ronaldinho; goleiro (sem preset) continua caindo no procedural; shape de Pack Reveal funciona sem adaptação.
- Suite completa: **257/257 passando**.

## QA gate

- `pnpm exec biome check .` — **0 erros**, 462 warnings (mesma categoria/baseline já aceita antes desta sprint).
- `pnpm exec tsc --noEmit -p .` — limpo.
- `pnpm test` — 257/257.
- `pnpm cards:validate` — 0 erros, 3 warnings pré-existentes (resolução de upscaling, placeholder Neymar vazio, canal alpha queimado do fixture de validação).
- `pnpm cards:build` — 3 presets processados, manifest regenerado.
- `pnpm build` (monorepo) — 34/34 tasks, build limpo.

## Arquivos alterados/criados

**Modificados:**
- `apps/web/biome.json`
- `apps/web/components/cards/card-types.ts`
- `apps/web/components/cards/layers/CardNameLayer.tsx`
- `apps/web/components/dev/FullArtworkCardPage.tsx`
- `apps/web/components/dev/FullArtworkWorldLegendsCard.tsx`
- `apps/web/lib/card-static/hud-layout.ts`
- `apps/web/lib/card-static/resolve-artwork.ts`
- `apps/web/lib/card-static/types.ts`
- `apps/web/lib/card-static/manifest.generated.ts` (regenerado)
- `apps/web/public/assets/cards/metadata/wl-goat-brazil-001.json` (zona de nickname + flags de elegibilidade)
- `apps/web/scripts/cards/_shared.mts`
- `apps/web/scripts/cards/generate-card-manifest.mts`
- `apps/web/scripts/cards/validate-card-assets.mts`
- `apps/web/tests/lib/full-artwork.test.ts`

**Criados:**
- `apps/web/lib/card-static/resolve-player-card-renderer.ts`
- `apps/web/tests/lib/resolve-player-card-renderer.test.ts`
- `apps/web/public/assets/cards/metadata/wl-legendary-ronaldinho-001.json`
- `apps/web/public/assets/cards/metadata/wl-legendary-neymar-001.json` (placeholder vazio)
- `apps/web/public/assets/cards/source/artworks/legendary/wl-artwork-legendary-ronaldinho-001-v1.png`
- `apps/web/public/assets/cards/source/artworks/legendary/wl-artwork-legendary-neymar-001-v1.png` (ainda sem preset válido associado)
- `apps/web/public/assets/cards/generated/{compact,standard,showcase}/wl-legendary-ronaldinho-001.webp`

## Plano de migração para os demais 8 jogadores

Para cada jogador pendente (Messi, Cristiano, Mbappé, Zidane, Ronaldo, Beckenbauer, Maradona, Neymar):
1. Receber a arte exclusiva final (fora do escopo deste código).
2. Criar `wl-<raridade>-<jogador>-001.json` seguindo o formato do Ronaldinho (`hudLayouts` por densidade, `productionEligible: true` só quando aprovado).
3. Rodar `pnpm cards:validate` e `pnpm cards:build` para gerar as 3 densidades e atualizar o manifest.
4. Nenhuma mudança de código é necessária — o resolver e a dev tool já reconhecem qualquer `artworkPresetId` presente no manifesto automaticamente.
5. Migração do catálogo real (associar `artworkPresetId` às cartas de produção) fica para uma sprint futura, fora deste escopo (`Não alterar catálogo`).

## Vercel Ready URL

_A confirmar após deploy._
