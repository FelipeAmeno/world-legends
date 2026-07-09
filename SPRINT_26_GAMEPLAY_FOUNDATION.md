# Sprint 26 — Gameplay Foundation

**Objetivo:** transformar o modo Partida em um jogo de verdade — o time
que entra em campo passa a ser exatamente o Squad salvo pelo usuário
(nunca mais um XI fixo hardcoded), o intervalo vira um momento de decisão
real (substituições + tática), e a dificuldade da IA passa a afetar
comportamento, não só o OVR do adversário.

Nenhuma mudança em Card Engine, packs, economia, ou Supabase além do
necessário para ler squad/coleção e salvar partida (mesmas tabelas/campos
já usados antes desta sprint).

---

## Prioridade 0 — Squad real na partida

**O bug real, confirmado por leitura de código antes de qualquer mudança:**
`playMatchAction` já construía a `lineup` real a partir do squad salvo
(`getUserActiveSquad` + `getUserCollection`), mas passava ela pro terceiro
parâmetro de `runMatch(opponent, seed, lineup)` — parâmetro que a função
**nunca usava** (`_lineup`, prefixado com `_`, morto). `runMatch` sempre
reconstruía o time do zero a partir de `DEFAULT_LINEUP_433`, um XI fixo de
11 lendas (Taffarel, Cafu, Zico, Ronaldinho, Ronaldo...) hardcoded em
`lib/match-data.ts`. Ou seja: **todo usuário, com qualquer squad que
tivesse montado, sempre jogava com o mesmo time de lendas** — o squad
builder era cosmético pro modo Partida.

**A correção não foi "consertar o parâmetro"** — seria continuar
alimentando um `runMatch` que também não valida nada. Construí um novo
módulo, `lib/match-session.ts`, com `buildUserTeamSnapshot(activeSquad,
userCards)` que:

1. Reconstrói o `Squad` (packages/squad) diretamente do que está salvo no
   banco (`squads`/`squad_slots`).
2. Roda `validateSquad` (packages/squad, já existente e testado —
   TC-SQUAD-20..27): 11 titulares, exatamente 1 goleiro, banco 5-7,
   zero duplicata, todas as posições compatíveis com o slot, zero
   lesionado/suspenso titular.
3. Se inválido ou inexistente → **bloqueia**, sem fallback silencioso.
4. Se válido → `calculateChemistry` + `squadToTeamSnapshot`
   (`@world-legends/match-simulator`) → o `TeamSnapshot` que entra na
   simulação é literalmente o squad salvo.

**Bug de compatibilidade descoberto e corrigido durante a implementação:**
`packages/squad`'s `buildSquadSlots` gera slotIds com hífen (`CB-1`,
`CB-2`), mas o Squad Builder desta app (`lib/squad-data.ts`, dono real do
que é gravado em `squad_slots.slot_position`) usa slotIds sem hífen
(`CB1`, `CB2`) — os dois formatos nunca colidiam. Reconstruir o squad via
`createSquad`+`addPlayer` (que usa a convenção com hífen) teria feito
TODA busca de slot falhar silenciosamente. Resolvido construindo o objeto
`Squad` diretamente a partir de `lib/squad-data.ts`'s `FORMATIONS` (a
fonte de verdade real), sem depender de `buildSquadSlots`.

**Bloqueio confirmado ao vivo** (não só em teste unitário) — a conta de
QA tinha um squad incompleto (5/11 titulares, sem goleiro, banco vazio,
um zagueiro escalado fora de posição em RB). Ao tentar jogar:

> **SEU TIME NÃO ESTÁ PRONTO**
> Seu squad salvo tem pendências que impedem a partida:
> - Squad precisa de 11 titulares; preenchidos: 5
> - Exatamente 1 goleiro necessário; encontrado: 0
> - Banco mínimo: 5 jogadores; atual: 0
> - Jogador ...(CB) não pode atuar em RB
>
> [🛠️ Montar Time]  [← Voltar]

Erros reais, específicos, do `validateSquad` de verdade — não uma
mensagem genérica. Zero erro de console. Screenshot completo:
`sprint26/02_after_select.png`.

## Banco de reservas real

`HalftimeDisplay.homeBench` vem de `MatchProgressState.home.benchRemaining`
— os reservas REAIS do squad (nunca consumidos ainda), exibidos no
intervalo com posição/nome/OVR reais, prontos pra substituição.

## Intervalo jogável — a peça arquitetural central

Esta era a parte tecnicamente mais arriscada: o motor (`packages/engine`)
sempre rodou os 90 minutos numa chamada síncrona só, sem nenhum ponto de
pausa. Como os server actions do Next.js são *stateless* entre chamadas
(não dá pra "pausar" uma function no meio e retomar depois), refatorei o
engine pra expor um estado de progresso 100% serializável:

- `simulateFirstHalf(...)` roda só os minutos 1-45 e retorna um
  `MatchProgressState` — placar parcial, estatísticas, jogadores em
  campo/banco de cada lado (com fadiga/cartões/moral), e o estado bruto
  dos 6 streams de RNG (`RNGInstance.getState()`/`restoreRNG()`, também
  novo).
- Esse estado viaja: server → cliente (React state) → server de volta.
- `simulateRestOfMatch(state)` reconstrói o motor EXATAMENTE de onde
  parou (mesmo stream de RNG, sem pular nem repetir nenhum sorteio) e
  roda o resto — 2º tempo, prorrogação, pênaltis se necessário.
- `applyManualSubstitution`/`applyTacticalIntensity` são funções puras
  que recebem um `MatchProgressState` e devolvem um novo, com a
  substituição/tática aplicada — usadas entre as duas metades.

**Garantia crítica, testada e comprovada:** sem nenhuma intervenção do
usuário, `simulateFirstHalf` + `simulateRestOfMatch` produz o **mesmo
`MatchResult`, byte a byte**, que `simulateMatch` (a função antiga, ainda
existente e usada pelos 10 testes de regressão/determinismo do engine)
rodando de ponta a ponta. `simulateMatch` hoje é literalmente
`simulateFirstHalf` + `simulateRestOfMatch` por baixo — o refactor não
mudou nenhum comportamento existente, só expôs um ponto de pausa novo.
Confirmado por um novo teste dedicado (`match.halves.test.ts`, 6 testes,
5 seeds diferentes comparando os dois caminhos) + os 389 testes
pré-existentes do engine continuando 100% verdes.

### O que o jogador vê no intervalo (`HalftimeScreen.tsx`)

- Placar parcial, clima, árbitro.
- Posse, finalizações, finalizações no alvo, cartões amarelos/vermelhos
  (barras comparativas casa × fora).
- Melhor/pior em campo — calculado a partir dos eventos reais do 1º
  tempo (gols/assistências pontuam positivo, cartões pontuam negativo).
- **Fazer Substituições**: escolhe quem sai (titular real) → quem entra
  (reserva real do banco) → chama `applySubstitutionAction`, que aplica
  no motor e devolve o intervalo atualizado.
- **Alterar Tática**: escolhe uma das 5 mentalidades → `applyTacticAction`.
- **Continuar**: chama `continueMatchAction`, que roda o 2º tempo,
  credita recompensas, persiste a partida e atualiza missões — só agora,
  depois da decisão do usuário (antes, tudo isso rodava ANTES do jogador
  ver qualquer coisa).

## Substituições (até 5)

Reaproveitei o limite já existente no engine (`MAX_SUBSTITUTIONS = 5`,
`packages/engine/src/match/substitutions.ts` — o mesmo valor citado no
brief) e o mesmo contador que as substituições automáticas por
lesão/fadiga já usavam — uma substituição tática do usuário consome do
mesmo total, como nas regras reais de futebol. `applyManualSubstitution`
(novo, no engine) espelha `tryForcedSubstitution` mas deixa o CALLER
escolher quem entra (em vez de escolher automaticamente pelo melhor
reserva na posição) — é literalmente o mesmo código de troca de campo,
só com a fonte da decisão diferente.

## Táticas — 5 mentalidades com efeito real

`TacticalIntensity` (engine) já tinha 5 valores com efeito real
documentado (custo de fadiga + modificador de ataque/meio/defesa):
`ultra_defensivo`, `defensivo`, `equilibrado`, `ofensivo`,
`ultra_ofensivo`. Faltavam exatamente as 2 do brief que não existiam:
**Pressão Alta** e **Contra-Ataque** — adicionadas com os mesmos dois
efeitos (fadiga + setor):

| Tática | Custo de fadiga | Ataque | Meio | Defesa |
|---|---|---|---|---|
| Pressão Alta | 1.30 (mais alto que existe) | 1.10 | 1.15 | 0.90 |
| Contra-Ataque | 0.90 | 1.10 | 0.80 | 1.10 |

Escolhas documentadas no código com a mesma disciplina do resto do
engine ("decisão própria, sem tabela documentada — ver comentário").
`ultra_defensivo`/`ultra_ofensivo` continuam existindo como extremos
alcançados automaticamente via química muito baixa/alta — não aparecem
no seletor manual do usuário, que oferece as 5 do brief.

## Ritmo da partida

Antes: toda a simulação (90 min) tocava em ~11 segundos (`TICK_MS = 120`).
Agora cada TEMPO (45 min simulados) leva ~25s de replay ao vivo
(`TICK_MS = 550`), com o intervalo entre eles sendo uma pausa real
controlada pelo usuário (não mais um timeout fixo de 3.5s) — a partida
não termina mais tudo em 15 segundos, e tem uma cadência de: 1º tempo →
intervalo (duração do jogador) → 2º tempo → resultado.

## Dificuldade da IA — comportamento, não só OVR

Novo seletor no `SELECT` da tela de Partida: Fácil / Normal / Difícil /
Lendário. Diferente do `MatchOpponent.avgOvr` (que já definia a força
base do time adversário), a dificuldade agora aplica um
`AiDifficultyModifier` — um ajuste percentual direto sobre o Team Power
do lado IA, recalculado a cada minuto da simulação (não é um número
estático aplicado uma vez):

- **Fácil** (-10%): a IA comete mais erros — força efetiva reduzida
  significa mais chances desperdiçadas e marcação pior.
- **Normal** (0%): sem ajuste.
- **Difícil** (+8%): a IA pressiona/marca melhor.
- **Lendário** (+8%, igual Difícil) **+ reage no intervalo**: muda de
  tática conforme o placar (perdendo → Pressão Alta; ganhando →
  Contra-Ataque; empatando → Ofensivo) e usa 1 substituição real (troca
  o titular mais desgastado pelo reserva de maior stamina) — a mesma
  mecânica de substituição tática do usuário, só que decidida pela IA.

## QA

### Testado ao vivo (navegador real)

- **Squad sem estar pronto bloqueia a partida**: confirmado com a conta
  de QA (squad genuinamente incompleto) — mensagem de erro específica,
  botão "Montar Time", zero erro de console. Este é o cenário de
  Prioridade 0 e rodou de ponta a ponta contra o Supabase real.
- Seletor de dificuldade na tela de seleção de adversário — renderiza e
  alterna corretamente.
- Regressão: `/profile`, `/`, `/missions` — zero erro de console/página,
  nenhuma mudança visual inesperada.

### Limitação de ambiente, documentada com transparência

A conta de QA usada nesta sessão inteira não tem nenhum goleiro na
coleção e está com saldo 0 (sem condição de abrir pacotes) — não dá pra
montar um squad de 11 titulares válido (exige exatamente 1 GK) sem
creditar cartas/saldo diretamente via Supabase, ação que segue bloqueada
por instrução permanente desta sessão. Por isso o caminho "feliz"
completo (squad válido → 1º tempo → intervalo → substituição → tática →
2º tempo → resultado → recompensas) **não pôde ser demonstrado ao vivo
no navegador**.

Em vez disso, escrevi `tests/lib/match-session.test.ts` (6 testes) que
exercita EXATAMENTE o mesmo caminho de código que os server actions
chamam — só com um squad sintético construído no teste, sem depender de
nenhuma conta externa:

- `buildUserTeamSnapshot`: bloqueia sem squad (`NO_SQUAD`), bloqueia com
  squad incompleto (`INVALID_SQUAD` com a mensagem certa), constrói o
  `TeamSnapshot` corretamente a partir de um squad válido — confirmando
  que cada titular do snapshot é exatamente o `userCardId` salvo no slot.
- Fluxo completo: 1º tempo → intervalo (11 titulares, 5 substituições
  disponíveis) → substituição real (titular sai, reserva entra,
  confirmado nos dois lados) → tática (`pressao_alta` aplicada) → 2º
  tempo → `MatchDisplay` final com placar ≥ placar do intervalo,
  recompensas > 0, evento `full_time` presente.
  IA Lendária: muda de tática E tenta 1 substituição no intervalo.
  IA Normal: não reage (estado inalterado).

### QA automatizado (todos verdes)

```
packages/engine    → 395/395 testes (389 pré-existentes + 6 novos de
                      simulateFirstHalf/simulateRestOfMatch/substituição/
                      tática/determinismo)
packages/squad     → 144/144 (inalterado)
packages/match-simulator → 10/10 (inalterado)
packages/packs     → 278/278 (economia — zero mudança confirmada)
apps/web           → 210/210 (204 pré-existentes + 6 novos de match-session)

pnpm -w build      → 34/34 tasks (monorepo inteiro)
pnpm -w test       → 55/55 tasks
biome check .      → 460 warnings, 0 erros (baseline 463 antes desta
                      sprint — melhor, mesmo com arquivos novos)
tsc --noEmit       → 0 erros
```

`git diff --stat` confirma zero mudança em `packages/packs` (economia)
e nenhuma migration/tabela nova — `squads`/`squad_slots`/`matches`/
`match_events` já existiam e continuam com o mesmo schema.

## Arquivos criados

`SPRINT_26_GAMEPLAY_FOUNDATION.md`, `apps/web/lib/match-session.ts`,
`apps/web/components/match/premium/HalftimeScreen.tsx`,
`apps/web/components/match/premium/SquadRequiredScreen.tsx`,
`apps/web/tests/lib/match-session.test.ts`,
`packages/engine/tests/match/match.halves.test.ts`.

## Arquivos modificados

**Engine** (`packages/engine`): `src/match/match.ts` (refatorado —
`createRuntime` + `simulateFirstHalf`/`simulateRestOfMatch`/
`applyManualSubstitution`/`applyTacticalIntensity`, `simulateMatch`
inalterado em comportamento), `src/match/types.ts`
(`MatchProgressState`/`SerializedSideState`/`AiDifficultyModifier`/
`FirstHalfOutcome`, `MatchContext.awayAiDifficulty`), `src/rng/rng.ts`
(`getState()`/`restoreRNG()`), `src/fatigue/types.ts` (+
`pressao_alta`/`contra_ataque`), `src/fatigue/fatigue.ts`,
`src/match/team-power.ts` (tabelas das 2 novas táticas).

**Web** (`apps/web`): `lib/match-data.ts` (aditivo — `MatchDifficulty`/
`DIFFICULTY_DEFS`/`TACTIC_DEFS`, `MatchDisplay.userLineup/userBench`
opcionais, `transformEvents` generalizado com resolvers em vez de
Map fixo — `runMatch`/`DEFAULT_LINEUP_433` continuam existindo,
inalterados, usados só por ferramentas internas/demo),
`lib/actions/match.ts` (reescrito — 4 actions em vez de 1),
`lib/actions/match.types.ts`, `lib/actions/index.ts`,
`components/match/premium/{MatchExperience,LiveMatchView,PreMatchScreen,
StadiumIntro}.tsx`.

**Não modificado:** Card Engine, packs (loja/economia),
`packages/economy`, migrations/schema do Supabase, `components/match/
{MatchScreen,MatchResultView,...}.tsx` e `components/dashboard/
LogPanel.tsx` (árvore órfã/ferramenta de debug — continuam chamando o
`runMatch` antigo sem alteração, propositalmente preservados em vez de
deletados sem necessidade).
