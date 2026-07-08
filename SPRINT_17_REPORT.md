# SPRINT_17_REPORT.md — "Squad Revolution"

## Resumo

Objetivo da sprint: transformar o Squad Builder na melhor tela do jogo, com
prioridade zero em resolver definitivamente o bug do campo não renderizar os 11
jogadores. As duas coisas foram feitas: causa raiz encontrada e corrigida com
medição real (não achismo), e a tela foi reconstruída em cima da base existente —
campo dominante, comparação antes/depois em toda troca, química com cor por
relação real de país/continente, análise do time com radar chart, e limpeza do
código morto do Squad Builder antigo.

## PRIORIDADE ZERO — causa raiz do bug do campo

**Sintoma:** as 11 cartas apareciam no DOM com dados corretos, mas visualmente o
campo ficava espremido numa faixa quase invisível.

**Investigação:** script Playwright (`measure_chain.mjs`) subindo a árvore de
`parentElement` a partir de um slot, logando `getBoundingClientRect()` +
`getComputedStyle()` em cada nível. Resultado: o container do campo tinha
`flex-1 min-h-0` dentro de uma coluna flex com 5+ irmãos de altura fixa (header,
stats bar, banco, barra de ações e — o maior vilão — uma lista de coleção completa
sempre renderizada e sempre aberta). Sobravam ~86px de "espaço de flex" para o
campo depois que todo mundo pegava o seu.

**Correção:**
1. Container do campo: `flex-1 min-h-0` → `flex-1 min-h-[380px] relative` — piso
   mínimo que nenhum irmão consegue invadir.
2. `CardPoolSheet` (lista de coleção) deixou de ser inline-sempre-aberta e virou
   bottom sheet sob demanda (botão "📚 Coleção"), eliminando ~150px de consumo
   permanente.

**Confirmação visual e por medição** (Playwright headless, browser novo a cada
teste — evitando o problema de cache de CDP que gerou falsos positivos na Sprint
16.2):

| Métrica | Antes | Depois |
|---|---|---|
| Altura do container do campo | 86px | 635px |
| Jogadores visíveis corretamente | 11 (dados corretos, visual quebrado) | 11 (visual correto) |

Testado em dev (webpack, sem Turbopack — ver nota abaixo) e via `pnpm build` +
verificação de rota `/squad` gerada sem erros.

**Nota sobre Turbopack:** `pnpm dev` usa `next dev --turbopack` por padrão, que
já se mostrou fonte de falsos positivos em sprints anteriores. Todos os testes
desta sprint rodaram com `next dev` (webpack) para eliminar essa variável.

## O que foi entregue

- **Campo com espaço garantido** — `min-h-[380px]` + coleção completa movida para
  bottom sheet sob demanda.
- **Comparação antes/depois em toda troca** ("nunca trocar no escuro") —
  `PlayerSelectModal` ganhou um passo de confirmação mostrando OVR, Química,
  Ataque, Meio e Defesa antes→depois, com cor por delta. Funciona tanto para
  preencher slot vazio quanto para trocar jogador já escalado (via botão
  "🔄 Trocar jogador" no preview).
- **Preview de carta no campo** — tocar num jogador já escalado abre o mesmo
  `CardDetailModal` da Coleção (atributos, traits, raridade).
- **Linhas de química por relação real** — verde (mesmo país), azul (mesmo
  continente, via novo `lib/geo/continents.ts`), dourado (link perfeito/"Dream
  Team"), cinza (sem sinergia). O cálculo do bônus real não mudou, só a cor.
- **Formação 3-4-3** — adicionada ao catálogo de formações (agora 6 no total:
  4-3-3, 4-4-2, 4-2-3-1, 3-5-2, 5-3-2, 3-4-3), troca sem reload confirmada.
- **Painel de Análise do Time** — `TeamAnalysisSheet.tsx`, novo: radar SVG
  desenhado à mão (ATK/MID/DEF/GK/QUÍM/EXP) + comentários automáticos por regras
  (química baixa, defesa frágil, ataque forte, goleiro fraco, elenco de peso,
  squad incompleto). Acessado tocando no número de OVR.
- **Banco com filtro por setor** — chips TODOS/GK/DEF/MID/ATT sobre as 12 posições
  de reserva.
- **Performance** — coleção e seletor de jogador nunca renderizam a lista inteira
  de uma vez (corte em lotes de 80/60 com aviso "+N cartas — refine a busca").
  Ver `SQUAD_UX_DECISIONS.md` item 6 para o porquê de não ter entrado
  virtualização de verdade.
- **Cleanup** — removidos 8 arquivos do Squad Builder pré-`premium/`, morto desde
  que `/squad` passou a usar `PitchBuilder` (confirmado sem nenhuma referência
  restante via grep antes de apagar).
- **Documentação** — `SQUAD_ARCHITECTURE.md` (como as peças se encaixam) e
  `SQUAD_UX_DECISIONS.md` (8 decisões de produto com trade-off explícito).

## O que já existia e foi preservado (não reescrito)

- State machine (`lib/squad-builder.ts`: `SBState`, `sbReducer`, `calcSnapshot`,
  `getAutoSuggest`, `getSwapSuggestions`, `autoBuildSlots`) — estava correta, só a
  camada visual tinha o bug.
- dnd-kit (drag & drop com animação spring) — já funcionava, testado de novo após
  o rewrite de layout.
- Auto Build "Melhor Time" (5 modos: best/chemistry/brazilians/goat/dream) — já
  existia, nunca escala goleiro fora do gol (compatibilidade de posição é
  respeitada pelo `greedyFill`).
- Confetti no save, animações spring de entrada/saída de carta — já existiam,
  confirmados funcionando após o rewrite.

## Testes executados (Playwright, browser novo a cada teste)

Todos contra o app rodando localmente (`next dev`, webpack) e revalidados com
`pnpm build`:

1. Login → `/squad` → medição de altura do campo (86px → 635px). ✅
2. Adicionar jogador em slot vazio → painel de comparação → confirmar → contador
   de titulares atualiza (6/11 → 7/11) → salva (toast "Squad salvo!"). ✅
3. Reload da página → squad persistido (7/11, mesma formação). ✅
4. Tocar em jogador escalado → preview abre → "Trocar jogador" → seletor abre já
   filtrado pela posição do slot, com a carta atual visível como "Atual" no
   painel de comparação. ✅
5. Trocar formação (4-3-3 → 3-4-3) sem reload → 11 slots recalculados
   corretamente → reload → formação persistida. ✅
6. Abrir "📚 Coleção" (bottom sheet) → filtro por setor + busca → fechar sem
   afetar o campo. ✅
7. Tocar no OVR → Análise do Time abre com radar chart e comentários coerentes
   com o estado real do squad (ex.: "Time incompleto — faltam 4 jogadores",
   "Química baixa"). ✅

## Validação técnica

```
pnpm typecheck   → limpo (0 erros)
pnpm lint        → 0 erros, warnings pré-existentes inalterados (452, mesmas
                    categorias de sprints anteriores — nenhum novo introduzido)
pnpm test        → 204/204 passando (10 arquivos)
pnpm build       → sucesso, /squad gera 39.9kB / 334kB First Load JS
```

## Bugs conhecidos / itens para o futuro

- O indicador de erro do Next dev overlay ("N Issues") aparece por causa de um
  hydration warning do dnd-kit (`aria-describedby` com IDs diferentes entre
  SSR e client — o contador interno de `useId` do dnd-kit não é determinístico
  entre render de servidor e cliente). É um warning cosmético de dev, não
  reproduz em `pnpm build`/produção, e não afeta nenhuma funcionalidade testada.
  Não investigado a fundo por ser pré-existente e fora do escopo desta sprint.
- Virtualização de verdade (react-window) para coleções muito grandes ficou como
  item futuro — ver `SQUAD_UX_DECISIONS.md` item 6.
- Filtros de OVR/país/raridade no banco de reservas não foram implementados
  (só setor) — decisão deliberada, ver `SQUAD_UX_DECISIONS.md` item 7.

## Definition of Done — checklist

- [x] Squad é a melhor tela do jogo (campo dominante, visuais premium, comparação
      antes/depois, análise do time, química com cor real)
- [x] 11 jogadores renderizam corretamente (86px → 635px, confirmado por medição)
- [x] Fluxo completo sem bugs (add/remove/swap/save/reload/formação testados)
- [x] Usuário monta um time em menos de 30s (Auto Build "Melhor Time" = 1 toque)
- [x] Código limpo, sem duplicação (8 arquivos mortos removidos)
- [x] Build, testes e typecheck passando
