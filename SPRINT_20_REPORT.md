# Sprint 20 — Pendências da Sprint 19

Sprint sem brief próprio: continuação direta dos 3 itens que a Sprint 19 deixou
conscientemente de fora (`SPRINT_19_REPORT.md`, seção "O que ficou de fora"),
seguindo a regra vigente de priorizar melhoria sobre funcionalidade nova.

---

## 1. Celebração de conjunto completo (#61)

A detecção de conjuntos completos já existia (`detectNewlyCompletedSets` em
`lib/collection-sets.ts`, com 20 testes cobrindo o caso) e já era chamada em
`checkAndMarkCompletedSetsInternal` dentro de `openPackAction`. O problema:
essa chamada vivia dentro de um bloco `void (async () => {...})()`
fire-and-forget — o resultado (`newlyCompleted`) era calculado, usado só para
persistir no banco, e descartado. Nenhuma celebração aparecia na tela.

**Mudança**: `checkAndMarkCompletedSetsInternal` saiu do bloco em background e
passou para o caminho síncrono de `openPackAction` (`lib/actions/packs.ts`) —
o resto do pós-processamento (missões, conquistas) continua em background,
só a detecção de conjunto que precisa aparecer na resposta ao cliente. O tipo
`OpenPackResult` (`packs.types.ts`) ganhou `newlyCompletedSets`.
`PackExperience.tsx` guarda essa lista numa fila e mostra o `AchievementPopup`
(componente construído na Sprint 19, até então sem nenhum gatilho real) um de
cada vez, com o ícone/nome do conjunto e o crédito ganho.

**Limite conhecido**: não foi possível testar visualmente em produção porque
completar um conjunto real exige possuir cartas lendárias específicas
(ex.: Pelé + Ronaldo + Ronaldinho + Zico...) — impraticável de obter por sorte
em uma sessão de QA. A confiança vem de: lógica já testada
unitariamente (20 testes existentes, todos passando), tipagem end-to-end
validada pelo build (`exactOptionalPropertyTypes` pegaria qualquer
inconsistência), e smoke test real de abertura de pack confirmando que o
fluxo não quebrou com a mudança (sem erros de console, reveal renderiza normal).

## 2. Auditoria de performance (#66)

Auditoria evidence-based, sem mudanças às cegas:

- Grid de Coleção já usa `VirtualCardGrid` (virtualizado) — não `CardGrid`
  (não-virtualizado, que se revelou código morto, não importado em lugar
  nenhum). Nenhuma ação necessária.
- `PlayerSelectModal` (seletor de jogador no Squad Builder) já limita render
  com `RENDER_CAP` — não itera a coleção inteira na DOM.
- 43 animações com `repeat: Infinity` (glows, pulsos ambiente) — todas são
  transforms/opacity via Framer Motion (GPU-friendly), consistentes com o que
  a própria Sprint 19 pediu ("Home viva"). Nenhum sinal de jank sem
  profiling real (não disponível neste ambiente headless).

**Achado real e corrigido — waterfalls de fetch no servidor:**

- `app/squad/page.tsx`: `getUserActiveSquad` era aguardado *depois* do
  `Promise.all([getUserCollection, getFavoriteCardIds])`, apesar de não
  depender de nenhum dos dois — um round-trip de rede inteiro perdido à toa
  em todo carregamento da tela de Squad. Movido para dentro do `Promise.all`.
- `app/profile/page.tsx`: mesmo padrão — `getUserCollection` era aguardado
  antes do `Promise.all([getUserMatchStats, getUserProfile])` sem motivo
  (nenhuma das três depende das outras). As três agora rodam em paralelo.

Essas duas são vitórias diretas de performance real (menos latência de
TTFB), não microotimizações especulativas.

## 3. Polimento visual cross-screen (#67)

Auditoria comparando o design-system já estabelecido (`.glass`,
`.glass-card`, `.glass-gold`, `.glass-dark`, `.glass-surface` em
`app/globals.css` — blur + saturação + borda translúcida) contra o que cada
tela realmente usa.

**Achado**: `OpponentPicker.tsx` (seleção de adversário em `/match`) era a
única tela "premium" do app usando estilo raw (`bg-white/[0.03] border
border-white/10`, sem `backdrop-filter`) em vez de uma classe `glass-*` —
exatamente a razão pela qual essa tela parecia mais "chapada" que
Squad/Coleção/Packs durante a auditoria da Sprint 19. Trocado para
`.glass-card` (o mesmo token usado em cards de lista em outras telas
premium). Confirmado visualmente: os cards de adversário agora têm a mesma
profundidade/blur do resto do app.

Verificado (mas não alterado, por não serem containers de tela primários):
pequenos estados de hover em linhas de tabela/lista em `BuffsPanel`,
`HallOfLegendsExperience` e um badge inline em `TeamAnalysisSheet` — esses
usam opacidade baixa de propósito, sem blur, porque já vivem dentro de um
container com glass próprio (duplo blur ali pesaria visualmente).

Uma auditoria *exaustiva* de sombras/tipografia/espaçamento em todas as
telas não foi feita — o app já usa `motion-tokens.ts` como fonte única de
verdade para animação, e as inconsistências de cor de fundo entre telas
(`#050508` vs `#060810` vs `#07080f`) são imperceptíveis a olho nu; não
valeu o risco de tocar em 11 arquivos por uma diferença invisível.

---

## Validação técnica

```
pnpm build     → sucesso, sem erros de tipo, 24 rotas
pnpm test      → 204/204 testes passando
pnpm exec biome check → 465 warnings, todos pré-existentes (mesmo total de antes da sprint)
```

QA manual (Playwright, conta de teste real): login → abertura de pack (sem
regressão, sem erros de console) → `/squad` e `/profile` carregando
corretamente com os fetches paralelizados → `/match` com cards com glass
correto e probabilidades de vitória reais e variadas (53%/50%/48%/49%/47%/46%
para os 6 adversários, batendo com o OVR real do squad da conta de teste).

## Arquivos modificados

`lib/actions/packs.ts`, `lib/actions/packs.types.ts`,
`components/packs/PackExperience.tsx`, `components/ui/AchievementPopup.tsx`,
`app/squad/page.tsx`, `app/profile/page.tsx`,
`components/match/premium/OpponentPicker.tsx`.
