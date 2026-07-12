# Sprint 35D.5 — Finalize Mbappé Artwork Integration

## Asset usado

- `apps/web/public/assets/cards/source/artworks/elite/wl-artwork-elite-mbappe-001-v1.png` (entregue nesta sprint; a pasta `elite/` só tinha `.gitkeep` até então).
- Preset já existente: `apps/web/public/assets/cards/metadata/wl-elite-mbappe-001.json` (`sourceType: "full-card-artwork"`, `hudLayouts` por densidade, `productionEligible: true`) — nenhuma mudança de arquitetura, mesmo formato do Neymar/Ronaldinho.

## Outputs gerados (`pnpm cards:build`)

| Densidade | Peso | Alvo | Status |
|---|---|---|---|
| compact | 69KB | 80KB | ✓ |
| standard | 193KB | 180KB | ⚠ 13KB acima (não falha o build) |
| showcase | 306KB | 350KB | ✓ |

Manifest (`manifest.generated.ts`) regenerado e reformatado — **5 presets**: `goat-validation-001`, `wl-elite-mbappe-001`, `wl-goat-brazil-001`, `wl-legendary-neymar-001`, `wl-legendary-ronaldinho-001`.

## Resolver

`resolvePlayerCardRenderer({ artworkPresetId: 'wl-elite-mbappe-001', ... }, CARD_STATIC_MANIFEST)` agora retorna `full-artwork` (antes: `procedural` / `preset-not-found`). Confirmado ao vivo na dev tool: `resolver: full-artwork · nicknameType: evento`. Fallback procedural não aparece mais para Mbappé.

## Validação visual (Playwright, conta QA)

- **Compact**: só "MBAPPÉ", sem nickname.
- **Standard**: "MBAPPÉ" + "O DITADOR" visível abaixo.
- **Showcase**: "MBAPPÉ" + "O DITADOR" visível, maior.
- Artwork exclusivo (uniforme azul da França, pose correndo, fundo estádio/pôr-do-sol) — visualmente distinto de Pelé, Ronaldinho e Neymar; nenhum reaproveitamento.
- Zero erros de console além dos 404s pré-existentes do placeholder de chave do PostHog (não relacionados).

## Testes

`tests/lib/resolve-player-card-renderer.test.ts` — 14 testes (era 13). O teste que documentava "Mbappé ainda não está no manifesto" foi substituído por dois testes contra o manifesto real (`CARD_STATIC_MANIFEST`): confirma que `wl-elite-mbappe-001` agora está presente com `productionEligible: true` e resolve `full-artwork`, e que seu artwork gerado nunca coincide com o de Neymar/Pelé/Ronaldinho. Suite completa: **263/263 passando**.

## QA gate

- `pnpm cards:validate` — 0 erros, 5 warnings pré-existentes (resolução abaixo do ideal pro Showcase, mesmo padrão dos outros 3 artworks reais).
- `pnpm exec biome check .` — 0 erros, 462 warnings (baseline).
- `pnpm exec tsc --noEmit -p .` — limpo.
- `pnpm test` — 263/263.
- `pnpm build` (monorepo) — 34/34 tasks.

Nenhuma mudança de arquitetura, catálogo real, economia, odds ou gameplay.

## Arquivos alterados/criados

**Criados:** `wl-artwork-elite-mbappe-001-v1.png` (fonte, entregue externamente), `wl-elite-mbappe-001.json` (preset, já existia), outputs `generated/{compact,standard,showcase}/wl-elite-mbappe-001.webp`.
**Modificados:** `manifest.generated.ts` (regenerado), `FullArtworkCardPage.tsx` (comentário de topo atualizado), `tests/lib/resolve-player-card-renderer.test.ts`.

## URL de produção

**Status: Ready.** https://world-legends.vercel.app (deployment `world-legends-pik5n3g04`, commit `06a387b5`).
