# Sprint 27 — Procedural Scene Engine

**Objetivo:** todas as cartas do jogo devem ter aparência cinematográfica
mesmo sem uma Scene exclusiva — hoje isso é 571 de 574 jogadores do
catálogo. Substitui de vez o fallback de "camisa" removido na Sprint 26
(`SPRINT_26_CARD_ENGINE_2_LEGACY_REMOVAL.md`).

## Determinismo — a exigência central do brief

"Não quero geração aleatória. Quero um sistema determinístico." —
implementado literalmente: zero `Math.random()` em qualquer módulo.

`lib/procedural-scene/seed.ts` computa um único seed (FNV-1a hash de
`playerId:nationality:rarityCode:position`, a ordem exata pedida no
brief) e deriva um sub-seed independente por "canal" (background,
lighting, particles, countryPattern, pose) via `deriveChannelSeed` — cada
gerador roda seu próprio PRNG (mulberry32) isolado, então mudar quantos
números um gerador consome nunca desalinha os outros (mesmo princípio
dos streams de RNG nomeados do motor de partida, `packages/engine`, só
que implementado localmente aqui — ver nota abaixo sobre por que não
reaproveitei aquele RNG diretamente).

**Provado por teste, não só por design** —
`tests/lib/procedural-scene.test.ts` (10 testes):
- mesma carta → mesma cena, byte a byte (`toEqual`).
- carta diferente (`playerId` diferente) → seed diferente, cena
  diferente.
- país influencia Background/Country Pattern com os dados REAIS de
  `lib/kit-data.ts` (Argentina = listras reais, El Monumental = estádio
  real da Argentina).
- raridade mais alta = mais partículas/raios de luz.
- Rng com mesmo seed sempre gera a mesma sequência.

## Por que um RNG local, não o do `packages/engine`

O RNG do motor de partida é determinístico por partida (mesmo seed de
jogo → mesmo resultado), um domínio completamente diferente (simulação
esportiva) do de apresentação visual da carta (que não tem NENHUMA
relação com uma partida específica — a mesma carta parece igual dentro
ou fora de uma partida). Acoplar os dois bounded contexts só pra
reaproveitar um mulberry32 não trazia benefício nenhum e criava uma
dependência estranha (`apps/web` → `packages/engine` só pelo RNG). O
algoritmo é o mesmo (FNV-1a + mulberry32, já comprovado no projeto), a
implementação é uma cópia pequena e independente.

## Os 5 módulos

```
lib/procedural-scene/
  seed.ts                    — hash/PRNG determinístico (a base de tudo)
  BackgroundGenerator.ts     — paleta de estádio da seleção (getStadiumBg) + boost por raridade
  LightingGenerator.ts       — raios volumétricos (mesma técnica de VolumetricLight, Sprint 22)
  ParticleGenerator.ts       — campo de partículas, contagem/cor por raridade
  CountryPatternGenerator.ts— listras/xadrez REAIS da seleção (getKitColors), 100% CSS
  SceneGenerator.ts          — orquestrador único, chamado por CardSceneLayer
```

Cada arquivo tem seu próprio comentário de cabeçalho explicando a
decisão de design (por que aquela fórmula, o que é decisão própria vs.
reaproveitamento de dado real já existente no projeto).

### Reaproveitamento de dado real, não invenção

- **Background**: `getStadiumBg(nationality)` — já existia em
  `lib/kit-data.ts`, escrito numa sprint anterior e **nunca consumido em
  lugar nenhum**. A Scene Procedural é o primeiro uso real.
- **Country Pattern**: `getKitColors(nationality).pattern`/
  `patternColor` — os padrões reais (`stripes` da Argentina/Paraguai,
  `checker` da Croácia) já estavam certos em `lib/kit-data.ts`; o
  gerador só aplica isso em CSS (`repeating-linear-gradient`) em vez de
  esperar um PNG que nunca existiu.
- **Lighting/Particles**: cor vem de `RARITY_ACCENT`
  (`components/cards/card-tokens.ts`), a mesma paleta de raridade usada
  no resto do Card Engine — nenhuma cor nova inventada.

## Bug real encontrado e corrigido durante o QA ao vivo

Testando no navegador (não só localmente), um hydration mismatch real
apareceu: `Math.sin`/`Math.cos` produzem floats com dezenas de casas
decimais cuja serialização pra string diverge entre o SSR (Node) e a
hidratação no navegador (`106.9129873451272` vs `106.91298734512719` —
mesmo valor, string diferente por 1 dígito). Corrigido arredondando pra
2 casas decimais em `rngRange()` (`seed.ts`) e em `polarOffset()`
(`pose-engine/rig.ts`, ver relatório da Sprint 28) — 2 casas decimais são
mais que suficientes visualmente e eliminam a divergência de string por
completo. Confirmado ao vivo, depois da correção: zero erro de console
em `/collection`, `/squad`, `/profile`.

## Integração — zero mudança na API pública do PlayerCard

`CardSceneLayer.tsx` ganhou um terceiro branch (`ProceduralSceneLayer`)
só quando Scene real E Pose real não existem — `PlayerCard`'s props
(`{ card, size, glow, attributes?, hiddenLayers?, debugOverride? }`)
continuam idênticas. Nenhum call site (Coleção, Squad, Perfil, Pack
Reveal, Match) precisou de nenhuma mudança.

## Visualização em `/dev/card-assets`

Nova seção "Scene Procedural" no `CardPreviewPanel`: swatch de
Background (com nome do estádio), swatch de Lighting (cor + contagem de
raios + duração do giro), swatch de Particles (cor + contagem), swatch
de Country Pattern (listras/xadrez reais), e a Pose resolvida — tudo
recalculado ao vivo conforme raridade/país/jogador mudam nos seletores
já existentes. O badge "Scene (fonte ativa)" mostra qual das 3
prioridades está realmente renderizando na carta (`scene real` / `pose
(asset real)` / `scene procedural`).

## QA

```
tests/lib/procedural-scene.test.ts → 10/10 (novo)
pnpm exec tsc --noEmit -p .        → 0 erros
pnpm exec biome check .            → 457 warnings, 0 erros
pnpm test                          → 210/210
pnpm build                         → sucesso, 24/24 páginas (/dev/card-assets: 9.6kB → 10.2kB)
```

Testado ao vivo: `/dev/card-assets` com jogador sem Scene real (Ronaldo
Fenômeno) em raridade Common e Legendary — cena procedural visível,
determinística (mesmo seed exibido, muda só quando raridade/país/jogador
mudam), zero erro de console. Regressão confirmada em `/collection`,
`/squad`, `/profile` com dados reais de produção.

Nenhuma mudança em economia, packs, Supabase, ou gameplay/match engine.
