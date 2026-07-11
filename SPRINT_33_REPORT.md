# Sprint 33 — World Legends Card Engine V3 (relatório final)

Sprint de reconstrução visual do Card Engine, guiada pela referência
`docs/references/card-reference-v3.png` (usada só como referência de
proporção/composição/hierarquia — nunca recortada ou transformada em
asset). Ver `SPRINT_33_AUDIT.md` (auditoria + fix do timer do Pack
Reveal) e `SPRINT_33_2_RECONSTRUCTION.md` (reconstrução visual) para o
detalhamento técnico de cada etapa.

## O que foi feito

1. **Auditoria completa antes de qualquer código** (`SPRINT_33_AUDIT.md`)
   — respondeu as 4 perguntas do brief com evidência de teste ao vivo,
   não só leitura de código. Achado principal: o "espelhamento" relatado
   era na verdade um bug real de timer no Pack Reveal (`CardRevealScene.tsx`
   usava um único `timerRef` compartilhado entre 3 timers, cancelando o
   avanço automático depois da primeira carta).
2. **Fix do timer** — `phaseTimerRef`/`advanceTimerRef` separados.
   Verificado ao vivo: pacote real avança sozinho por todas as cartas,
   zero toque do usuário.
3. **Reconstrução do PlayerCard**: arte (pose+scene procedural) de ~60%
   pra ~88% da largura da carta; piso de intensidade levantado pra
   Common/Rare (estavam apagadas); atributos reposicionados pra tira
   horizontal sob o nome, dentro do rodapé do HUD.
4. **Três modos internos** (Compact/Standard/Showcase) derivados de
   `size`, zero prop nova — API pública do `PlayerCard` intacta.
5. **5 cartas de validação** (Common/Rare/Elite/Legendary/World Cup
   Hero) renderizadas e capturadas via `/dev/card-assets` — progressão
   de intensidade clara, pose muito mais presente em todas as raridades.
6. **Pack Reveal revalidado ao vivo pós-reconstrução** — mesmo teste
   passivo, zero espelhamento, zero layer duplicada, zero conteúdo atrás
   do frame.
7. **PackArt com exclusividade escalonada por tier** — Starter→GOAT
   ganham camadas visuais progressivas (facetas, anel de luz, raios,
   aura pulsante no GOAT), mesma silhueta de pouch premium nos 7 packs.
8. **QA sweep completo** — Squad (compact), Profile "Melhor Carta"
   (showcase), Pack Store, Pack Reveal, Museu/Coleção (cartas possuídas
   reais). Confirmado: Card Detail e Álbum usam componentes leves
   separados (não `PlayerCard`), fora de escopo, não afetados.
9. **Monte Carlo revalidado** — 190/190 testes (100k+ packs simulados
   por tipo) confirmam odds idênticas às de antes; nenhum arquivo de
   economia (`packages/packs`, `lib/pack-logic.ts`'s pity/raridade) foi
   tocado nesta sprint.

## Critérios de sucesso (do brief original)

| Critério | Status |
|---|---|
| Nenhuma camada antiga (jersey) | ✅ já removida nas Sprints 26-28, confirmado na auditoria |
| Nenhum texto invertido | ✅ confirmado — bug real era o timer, não espelhamento |
| Nenhuma carta quebrada | ✅ pack real testado ao vivo, 5/5 cartas OK |
| Screenshots antes/depois | ✅ capturados em `/private/tmp/.../scratchpad/sprint18_9/s33_*.png` |
| Deploy Ready | ✅ ver abaixo |
| Commit | ✅ 3 commits (`d5ef48f4` timer fix, `a3bd0ea6` reconstrução, `569f3c4a` PackArt) |

## QA final

```
pnpm exec tsc --noEmit -p .   → 0 erros
pnpm exec biome check .       → 457 warnings, 0 erros (baseline inalterado)
pnpm test (apps/web)          → 220/220
pnpm test (packages/packs)    → 190/190 (Monte Carlo, 100k+ packs/tipo)
pnpm build                    → sucesso, 24/24 páginas
```

Nenhuma mudança em economia, preços, odds, Supabase (schema/RLS), ou
gameplay/match engine.

---

## Auditoria final (solicitada após o fechamento da Sprint 33)

**Nota de transparência**: entre o fechamento da Sprint 33 e esta
auditoria, a Sprint 34 (Official Art Pack Integration) já foi executada
e deployada nesta mesma sessão, a pedido explícito do usuário (mensagem
separada, com brief completo, recebida enquanto a Sprint 33 ainda
estava em andamento). O deploy Ready mencionado abaixo reflete o estado
atual do `main` (Sprint 33 + 34). Nenhum trabalho novo foi iniciado por
conta desta auditoria — só verificação do que já existe.

### Arquivos criados/alterados/removidos — só o range da Sprint 33

`git diff --name-status d5ef48f4^..2c5ecd49` (os 4 commits da Sprint 33
isolados dos commits da Sprint 34):

**Criados:**
- `SPRINT_33_AUDIT.md`
- `SPRINT_33_2_RECONSTRUCTION.md`
- `SPRINT_33_REPORT.md`

**Alterados:**
- `apps/web/components/cards/card-tokens.ts`
- `apps/web/components/cards/card-types.ts`
- `apps/web/components/cards/layers/CardAttributesLayer.tsx`
- `apps/web/components/cards/layers/CardHudLayer.tsx`
- `apps/web/components/cards/layers/ProceduralSceneLayer.tsx`
- `apps/web/components/cards/PlayerCard.tsx`
- `apps/web/components/packs/CardRevealScene.tsx`
- `apps/web/components/packs/PackArt.tsx`
- `apps/web/lib/procedural-scene/BackgroundGenerator.ts`
- `apps/web/lib/procedural-scene/LightingGenerator.ts`
- `apps/web/lib/procedural-scene/ParticleGenerator.ts`

**Removidos:** nenhum (a remoção de camadas legadas — `JerseyArt.tsx`,
`resolveKit`/`resolvePlayerArt`/`resolvePattern` — já tinha acontecido
nas Sprints 26-28, antes da Sprint 33 começar).

14 arquivos, 475 inserções / 65 deleções no total.

### Screenshots

Capturados ao vivo (Playwright, conta de QA) em
`/private/tmp/claude-502/.../scratchpad/sprint18_9/`:

- **5 raridades** (`s33_card_common.png`, `s33_card_rare.png`,
  `s33_card_elite.png`, `s33_card_legendary_fullpage.png`,
  `s33_card_world_cup_hero_fullpage.png`) — via `/dev/card-assets`,
  jogador sem Scene real (Ronaldo Fenômeno), progressão de intensidade
  clara Common→WCH, pose sempre visível e proporcional.
- **3 densidades** — Compact (`s33_page_squad.png`, grade `/squad`,
  `size="xs"`), Standard (`s33_pr_passive_1.png`, Pack Reveal real,
  `RevealedCard.tsx` usa `size="md"`), Showcase (`s33_page_profile.png`,
  "Melhor Carta" do Perfil, `size="lg"`).
- **Pack Reveal** — mesmo `s33_pr_passive_1.png` acima, mais a série
  `s33_pr_passive_0..6.png` (observação passiva de 14s, zero toque,
  confirmando o auto-advance completo 1/5→5/5).

### Explicação do fallback procedural atual

`CardSceneLayer.tsx` resolve em ordem: (1) Scene real
(`scene-{playerId}.webp`, nenhuma existe hoje) → (2) Pose real
(asset fotográfico, nenhuma existe hoje) → (3) **Scene procedural**
(`ProceduralSceneLayer.tsx`, Sprint 27/28) — o único caminho que
qualquer carta do catálogo de fato usa hoje. É 100% determinístico
(seed = FNV-1a de `playerId:nationality:rarityCode:position`, PRNG
mulberry32, zero `Math.random`): a mesma carta sempre produz o mesmo
Background (paleta de estádio real via `getStadiumBg`), Country Pattern
(listras/xadrez reais via `getKitColors`), Lighting (raios
volumétricos), Particles (campo determinístico) e Pose (rig articulado
de 10 ângulos, `pose-engine/`, nunca uma foto). A Sprint 33 aumentou a
área da pose de ~60% pra ~88% da largura e levantou o piso de
intensidade de Common/Rare (estavam apagadas antes).

### Confirmação — JerseyLayer e renderizações legadas

`grep -rn "JerseyArt\|resolveKit\|resolvePlayerArt\|resolvePattern\b"`
no código de produção retorna **zero resultados de código** — a única
ocorrência é um comentário em `lib/card-asset-loader.ts` documentando
que essas funções foram removidas na Sprint 26. Confirmado visualmente
em todos os screenshots acima: nenhuma silhueta de camisa, nenhum
elemento atrás do frame, nenhum texto espelhado.

### Resultado de lint, typecheck, testes e build (re-executado agora)

```
pnpm exec tsc --noEmit -p .   → 0 erros
pnpm exec biome check .       → 457 warnings, 0 erros (baseline inalterado desde o início da sessão)
pnpm test (apps/web)          → 225/225 (220 da Sprint 33 + 5 novos da Sprint 34, lib/card-v3-resolver)
pnpm build (monorepo)         → sucesso, 34/34 tasks, 26/26 páginas
```

### URL do deploy Vercel Ready

**https://world-legends.vercel.app** — status `Ready`, produção,
deployment `world-legends-k4695dx9q-felipeamenos-projects.vercel.app`
(reflete `main` com Sprint 33 + 34, ver nota de transparência acima).

### Problemas visuais ainda existentes (lista objetiva)

1. Arte é 100% procedural (silhueta genérica) — nenhum jogador tem pose
   fotográfica/ilustrada real; a diferenciação visual entre jogadores
   vem de raridade/país/posição, não de uma arte única por atleta.
2. A silhueta do rig (`PoseFigure`) é a mesma forma de "boneco
   articulado" pra todo jogador — dois jogadores com mesma pose+
   raridade+país ficam quase idênticos visualmente, só a cor de
   destaque (`kit.primary`) muda como rim-light, não preenche a "roupa".
3. `/collection/[cardId]` (Card Detail) não renderiza o `PlayerCard`
   nenhuma vez — é uma página de stats/texto puro, sem nenhuma arte de
   carta visível. Pré-existente, fora do escopo da Sprint 33, mas é uma
   inconsistência visual real entre telas.
4. A aba "Álbum" da Coleção usa um componente de miniatura separado
   (`CollectionSetCard`-equivalente: bandeira + nome + OVR em caixa
   colorida) em vez do `PlayerCard` completo — outra inconsistência
   visual pré-existente, também fora do escopo desta sprint.
5. Common, mesmo com o piso de intensidade levantado, ainda é
   deliberadamente mais "quieto" que as raridades altas — mais
   discreto que o exemplo de Common na referência oficial (que mostra
   uma textura de rocha dramática mesmo na raridade mais baixa).
