# SQUAD_ARCHITECTURE.md — Sprint 17 "Squad Revolution"

Arquitetura do Squad Builder após a reescrita da Sprint 17. Documenta como as peças se
encaixam para quem for mexer nesta tela depois.

## Camadas

```
app/squad/page.tsx                         Server Component — busca coleção + squad salvo
  └─ components/squad/premium/PitchBuilder.tsx   Client — orquestrador (state machine + layout)
       ├─ PremiumPitch.tsx                  Campo (SVG + cartas + linhas de química)
       ├─ BenchStrip.tsx                    Banco (12 slots, filtro por setor)
       ├─ CardPoolSheet.tsx                 Bottom sheet sob demanda — coleção completa
       ├─ PlayerSelectModal.tsx             Bottom sheet — escolher/trocar jogador (com comparação)
       ├─ TeamAnalysisSheet.tsx             Bottom sheet — radar chart + comentários
       ├─ AutoBuildSheet.tsx                Bottom sheet — modos de "Melhor Time"
       ├─ SwapSuggestionsSheet.tsx          Bottom sheet — sugestões de troca
       ├─ FormationSelect.tsx               Seletor de formação (6 opções)
       └─ CardDetailModal.tsx (reused)      Preview de carta (mesmo componente da Coleção)

lib/squad-builder.ts                        Lógica pura: reducer, snapshot, química, sugestões
lib/squad-data.ts                           Formações, slots, tipos base (SquadSlots, SlotDef)
lib/geo/continents.ts                       Mapa nacionalidade → continente (cor das linhas)
```

`PitchBuilder` é o único componente com estado. Tudo abaixo dele é apresentacional ou
recebe callbacks — a lógica de squad (química, OVR, sugestões, auto-build) vive inteira em
`lib/squad-builder.ts`, que não importa React. Isso já existia antes da Sprint 17 e foi
mantido de propósito: a state machine (`SBState` + `sbReducer`) estava correta, o problema
era só a camada visual.

## O que mudou nesta sprint

### 1. Layout — pitch com espaço garantido

Antes, o campo vivia dentro de `<div className="flex-1 min-h-0">`, competindo por
espaço com: header, stats bar, banco, barra de ações e uma lista de coleção **sempre
renderizada e sempre visível** (`CardPoolSheet` com `open=true` por padrão). Com todos
esses irmãos flex somados, sobravam ~86px para o campo — as 11 cartas existiam no DOM
com dados corretos, mas ficavam espremidas numa faixa quase invisível.

A correção tem duas partes:

- `PremiumPitch` já usava `absolute inset-0` (raiz do bug de renderização — corrigido
  na Sprint 16.2, confirmado aqui via medição de bounding box em produção/dev).
- O `<div>` que envolve `PremiumPitch` em `PitchBuilder.tsx` agora é
  `flex-1 min-h-[380px] relative` — um piso mínimo que nenhum irmão consegue invadir.
- A lista de coleção (`CardPoolSheet`) deixou de ser inline. Vira um bottom sheet que
  só monta quando o usuário toca em "📚 Coleção", com backdrop e animação de entrada
  (`AnimatePresence` + `motion.div` deslizando de baixo). Isso resolve o problema de
  espaço **e** a diretriz do sprint de não ter listas gigantes ocupando a tela.

Resultado medido (viewport 390×780, Playwright headless, sem cache de browser):
altura do campo passou de **86px → 635px**.

### 2. Comparação "antes/depois" (nunca trocar no escuro)

`PlayerSelectModal` ganhou um passo intermediário. Antes: tocar numa carta chamava
`onSelect` imediatamente. Agora: tocar numa carta define `pendingCard` e renderiza
`ComparePanel` — carta atual vs. carta nova, com `DeltaRow` para OVR, Química, Ataque,
Meio e Defesa (verde/vermelho conforme o delta). Só ao tocar "Confirmar" a troca é
aplicada.

O delta é calculado por `getSlotPreview` em `PitchBuilder.tsx`, que constrói um
`SBState` hipotético (clona `state.slots`, substitui o slot em questão) e roda
`calcSnapshot` nele — a mesma função pura usada para o snapshot real. Não existe
lógica de cálculo duplicada entre "preview" e "aplicado".

Tocar numa carta **já no campo** abre `CardDetailModal` (o mesmo modal da Coleção,
reaproveitado) com um botão flutuante "🔄 Trocar jogador" que redireciona para o
mesmo fluxo de comparação, agora com `currentCard` preenchido — é o caminho de swap.

### 3. Linhas de química com cor por relação real

`buildChemLines` (em `lib/squad-builder.ts`) comparava apenas o `total` do link
(0–4) contra faixas fixas. Agora a cor é decidida pela relação real entre as duas
cartas: mesma nacionalidade → verde, mesmo continente (via `lib/geo/continents.ts`)
→ azul, link perfeito (`total >= 4`) → dourado ("Dream Team"), sinergia parcial
(competição/era) → amarelo, nada → cinza. O `total` continua sendo a fonte de
verdade para o bônus real de química — a mudança é só a cor, não o cálculo.

### 4. Painel de Análise do Time

`TeamAnalysisSheet.tsx` é novo. Radar SVG desenhado à mão (sem lib externa — 6 eixos:
ATK/MID/DEF/GK/QUÍM/EXP) mais uma lista de comentários gerados por regras simples
(`buildComments`) reagindo a química baixa, defesa frágil, ataque forte, goleiro
fraco, elenco "de peso" (proxy por raridade média) e squad incompleto. Aberto ao
tocar no número gigante de OVR — decisão deliberada de não adicionar mais um botão
na barra de ações, que já estava cheia.

### 5. Cleanup

Removidos `components/squad/{PitchField,CardPool,SquadStatsPanel,FormationPicker,
BenchRow,Pitch,SquadBuilder,types}.tsx|ts` — a versão pré-`premium/` do Squad
Builder, morta desde que `/squad` passou a usar `PitchBuilder`. Confirmado via grep
que nada fora desse cluster os importava.

## Por que não uma reescrita total

A state machine (`squad-builder.ts`), o dnd-kit (`useDraggable`/`useDroppable` em
`PremiumPitch`/`BenchStrip`/`CardPoolSheet`) e o visual do campo (SVG de gramado,
cartas com jersey art, linhas de química animadas) já estavam bem construídos — o
bug era estrutural (CSS/layout), não de lógica ou de visual base. Reescrever do zero
teria jogado fora código correto e testado para resolver um problema de `min-height`.
A sprint pedia "a melhor tela do jogo", não necessariamente "código novo" — as duas
coisas não são sinônimas aqui.
