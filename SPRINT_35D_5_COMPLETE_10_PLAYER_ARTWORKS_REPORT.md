# Sprint 35D.5 — Complete the 10 Unique Player Artworks

## Resumo

Os 6 presets/artworks restantes (Messi, Cristiano, Ronaldo, Zidane, Beckenbauer, Maradona) já existiam prontos no disco. Esta sprint só terminou de conectá-los à arquitetura existente: seletor da dev tool, grade de QA nova, e testes — **nenhum resolver novo, nenhum renderer novo, nenhuma coordenada de HUD alterada sem necessidade, nenhum PNG/WebP modificado**.

## Os 10 jogadores

| Jogador | Preset ID | Rarity (pasta) | Nickname | renderer | productionEligible |
|---|---|---|---|---|---|
| PELÉ | `wl-goat-brazil-001` | goat | O REI | full-artwork | true |
| RONALDINHO GAÚCHO | `wl-legendary-ronaldinho-001` | legendary | O BRUXO | full-artwork | true |
| MESSI | `wl-goat-messi-001` | goat | GOAT | full-artwork | true |
| CRISTIANO RONALDO | `wl-goat-cristiano-001` | goat | PAPAI CRIS SIIIIU | full-artwork | true |
| KYLIAN MBAPPÉ | `wl-elite-mbappe-001` | elite | O DITADOR | full-artwork | true |
| ZIDANE | `wl-legendary-zidane-001` | legendary | O MAESTRO | full-artwork | true |
| RONALDO | `wl-goat-ronaldo-001` | goat | O FENÔMENO | full-artwork | true |
| BECKENBAUER | `wl-legendary-beckenbauer-001` | legendary | O KAISER | full-artwork | true |
| MARADONA | `wl-goat-maradona-001` | goat | ESCOBAR CHEIRADOR | full-artwork | true |
| NEYMAR | `wl-legendary-neymar-001` | legendary | O PRÍNCIPE | full-artwork | true |

Todos os 10 resolvem `full-artwork` — nenhum cai no procedural, verificado ao vivo na nova grade de QA (0 linhas vermelhas) e pelos testes automatizados contra o manifesto real.

## Outputs (30 arquivos, `pnpm cards:build`)

Todos os 30 outputs (10 presets × 3 densidades) gerados e confirmados válidos. Manifest regenerado e reformatado — **11 presets** (10 reais + `goat-validation-001`, fixture interna de validação).

## Seletor + grade de QA (`/dev/full-artwork-card`)

- Seletor único (dropdown) atualizado com os 10 (já existia desde 35D.3/35D.4; os 6 novos ganharam `shortName`, `overall` e `position` corrigidos pra bater exatamente com o brief).
- **Nova seção "Grade de QA — os 10 jogadores"**: tabela com Nome, Nickname, Preset ID, renderer, productionEligible, e miniaturas Compact/Standard/Showcase pra cada um dos 10, tudo calculado pelo mesmo `resolvePlayerCardRenderer` do seletor. Linha fica com fundo vermelho se: renderer ≠ full-artwork, preset não encontrado no manifesto, ou `productionEligible !== true`. Hoje: **0 linhas vermelhas**.

## Validação visual (Playwright, conta QA)

Screenshot da grade completa (topo — Pelé/Ronaldinho/Messi visíveis, as outras 7 linhas confirmadas rolando a página) e screenshots individuais de cada uma das 10 linhas (Cristiano, Mbappé, Zidane, Ronaldo, Beckenbauer, Maradona, Neymar incluídos) confirmam, pros 10:
- `renderer: full-artwork`, `productionEligible: true`, **0 linhas vermelhas**.
- Artwork exclusivo e visualmente distinto entre todos (nenhum reaproveitamento) — confirmado par a par nos testes automatizados e visualmente nos screenshots.
- **Compact**: nickname oculto (só nome).
- **Standard** e **Showcase**: nickname visível abaixo do nome.
- Nenhum erro de console além dos 404s pré-existentes do placeholder de chave do PostHog (não relacionados).

**Re-verificação** (após relato de uma tabela `preset-not-found` intermitente): confirmado que a causa foi cache stale do `.next` de uma execução concorrente de `pnpm build` durante o dev server — `.next` removido e `next dev` reiniciado do zero, e a grade de QA voltou a mostrar os 10 em verde imediatamente. Não é um problema do resolver nem dos presets.

## ⚠️ Issue de conteúdo encontrada (não corrigida, por instrução explícita)

3 dos 6 artworks novos têm **texto de placeholder desenhado dentro do próprio PNG** (não é bug de código — é conteúdo da imagem gerada):

| Jogador | Texto indevido no PNG |
|---|---|
| Messi | "POR" no badge de posição |
| Zidane | "POS" no badge de posição |
| Beckenbauer | "OVR" e "POS" nos badges de overall/posição |

Cristiano, Ronaldo e Maradona não têm esse problema (badges em branco, como Pelé/Ronaldinho/Neymar/Mbappé). Como o brief pede explicitamente **"não modificar os arquivos PNG"** e **"não modificar artisticamente os WebPs"**, nenhuma correção foi feita — o HUD React (OVR/posição reais) renderiza normalmente por cima, então o dado exibido está correto, mas o texto de placeholder do template continua visível ao fundo nesses 3 casos. Recomenda-se pedir uma nova exportação desses 3 artworks sem os badges de placeholder pré-preenchidos.

## Testes

`tests/lib/resolve-player-card-renderer.test.ts` — 24 testes (era 14), novo describe `Sprint 35D.5 (os 10 jogadores completos)`:
- 6 testes individuais (`it.each`): Messi, Cristiano, Ronaldo, Zidane, Beckenbauer, Maradona resolvem `full-artwork` com o próprio preset.
- Manifesto de produção contém os 10 presets reais.
- Todos os 10 retornam `full-artwork` num loop único (sem exceção).
- Nenhum artwork é reutilizado — os 10 arquivos `showcase` gerados são todos distintos (`Set` de tamanho 10).
- Nickname respeita densidade num preset real dos 6 novos (Messi): oculto em Compact, visível em Standard/Showcase.

Suite completa: **273/273 passando**.

## QA gate

- `pnpm cards:validate` — 0 erros, 11 warnings (todos pré-existentes: resolução 848px abaixo do ideal em todos os 8 full-card-artwork, alpha inválido no fixture `goat-validation-001` — nenhum novo, nenhum corrigido nesta sprint por instrução explícita).
- `pnpm cards:build` — 11 presets processados, 30 outputs válidos.
- `pnpm exec biome check .` — 0 erros, 462 warnings (baseline).
- `pnpm exec tsc --noEmit -p .` — limpo.
- `pnpm test` — 273/273.
- `pnpm build` (monorepo) — 34/34 tasks.

`"type": "module"` **não** foi adicionado ao `package.json`, conforme instrução explícita.

## Arquivos alterados/criados

**Criados:** 6 artworks fonte (`goat/wl-artwork-goat-{messi,cristiano,ronaldo,maradona}-001-v1.png`, `legendary/wl-artwork-legendary-{zidane,beckenbauer}-001-v1.png` — já existiam, entregues externamente), 6 presets JSON (já existiam), 18 outputs `generated/{compact,standard,showcase}/*.webp` (gerados nesta sprint).
**Modificados:** `manifest.generated.ts` (regenerado + reformatado), `components/dev/FullArtworkCardPage.tsx` (6 identidades corrigidas + nova `QaGrid`), `tests/lib/resolve-player-card-renderer.test.ts` (+10 testes).

Nenhuma mudança de arquitetura, catálogo real, economia, odds ou gameplay. Nenhum PNG/WebP modificado artisticamente.

## URL de produção

**Status: Ready.** https://world-legends.vercel.app (deployment `world-legends-3nbe2xi93`, commit `40021577`).
