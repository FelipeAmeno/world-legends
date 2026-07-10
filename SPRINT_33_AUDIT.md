# Sprint 33 — Auditoria (antes de qualquer código)

Feita por leitura de código + teste ao vivo real (abrindo packs de
verdade com a conta de QA, não só análise estática) contra a referência
`docs/references/card-reference-v3.png`.

## 1. "Por que ainda existe jersey antiga?"

**Já não existe mais.** As Sprints 26/27/28 (executadas antes desta
auditoria, mesma sessão) eliminaram de vez o sistema de Kit/Jersey/
Player Art — `JerseyArt.tsx`, `resolveKit`/`resolvePlayerArt`/
`resolvePattern` foram removidos, e o centro da carta passou a ser
sempre uma Scene (real ou procedural — `lib/procedural-scene/` +
`lib/pose-engine/`). Ver `SPRINT_26_CARD_ENGINE_2_LEGACY_REMOVAL.md`
pro inventário completo do que foi removido.

O que a Sprint 33 herda desse trabalho: a arquitetura de 9 camadas já
está correta (`PlayerCard.tsx`), só falta POLIMENTO pra chegar no nível
da referência — poses/backgrounds/luz mais ricos, HUD reorganizado,
tamanho da arte maior.

## 2. "Por que aparece conteúdo atrás do frame?"

Não encontrei um caso reproduzível disso na composição atual de 9
camadas (`Background→Ambient→Particles→Scene→Frame→Reflection→Shine→
HUD→Glow`, z-index 0-10 estritamente crescente, confirmado por inspeção
do DOM renderizado ao vivo). A ordem z-index está correta.

**Hipótese mais provável, ainda a confirmar durante a reconstrução**: o
Pose Engine (Sprint 28) desenha a silhueta numa `<div>` com altura fixa
proporcional à largura da carta (`dim.card.width * 0.6 * 1.4`) — em
tamanhos muito pequenos (`xs`, squad grid) ou muito grandes (`lg`,
Spotlight), essa proporção pode não bater exatamente com a área útil
dentro do Frame, fazendo a pose "vazar" um pouco pra fora da moldura
visualmente (não atrás, mas além da borda). Vou corrigir isso como parte
da reconstrução do PlayerCard (item 4 do objetivo: "a arte deve ocupar
~70%... nunca atrás do frame").

## 3. "Por que algumas cartas ficam espelhadas?"

**Bug real encontrado, mas não é espelhamento (`scaleX(-1)`) — é o
reveal AUTOMÁTICO do Pack Reveal travando**, o que pode ser confundido
com "carta bugada" pelo usuário. Busquei `scaleX`/`mirror`/`flip` em
todo `components/cards/` e `components/packs/` e não achei nenhuma
transformação de espelhamento literal aplicada a uma carta em lugar
nenhum — o único `rotateY` de verdade é o flip 3D do Pack Reveal
(`RevealedCard.tsx`), que é geometricamente correto (confirmado por
inspeção do DOM: `transform: rotateY(180deg)` no container +
`transform: rotateY(180deg)` próprio na face frontal = 360° = de frente
pro usuário, sem espelhar texto).

**O bug real, confirmado ao vivo**: `CardRevealScene.tsx` usa um único
`timerRef` compartilhado entre 3 timers diferentes (entering→facedown,
facedown→flip automático, revealed→avançar pro próximo card). Quando
`doFlip()` roda automaticamente (sem o usuário tocar), ele agenda o
timer de "avançar pro próximo card" (`timerRef.current = setTimeout(goNext,
...)`) — mas a MUDANÇA DE FASE que `doFlip()` acabou de disparar
(`facedown` → `revealed`) faz o `useEffect` de "facedown→auto-flip"
(que já tinha terminado seu trabalho) rodar sua função de cleanup
(`clearTimer()`) *depois*, cancelando o timer que `doFlip()` ACABOU de
agendar — porque as duas partes do código leem/escrevem a MESMA
referência `timerRef.current`, sem saber qual timer é de quem.

**Efeito observável, reproduzido 3 vezes com pacotes reais (Starter/
Classic/Elite/Legend) sem nenhum toque do usuário**: a primeira carta
revela normalmente (flip funciona — esse timer não é afetado), mas o
pacote trava nela pra sempre — o avanço automático pro card 2/5 nunca
acontece. Só avança se o usuário tocar manualmente (que chama `goNext()`
direto, sem depender do timer quebrado). Isso é exatamente o tipo de
coisa que um usuário describeria como "a carta trava"/"parece quebrada"
— não é espelhamento, mas é um bug real de UX que corrompe a experiência
de abrir um pacote sozinho.

**Fix**: separar em refs independentes (`phaseTimerRef` pra
entering/facedown, `advanceTimerRef` pra avançar pós-reveal) — cada
cleanup só cancela o timer que é dele.

## 4. Quais layers ainda pertencem ao Card Engine antigo

Nenhuma — Sprints 26/27/28 já limparam isso. O que falta é polimento
visual (Sprint 33 propriamente dita), não remoção de código legado.

## 5. Quais componentes podem ser removidos

- `components/match/{MatchScreen,MatchResultView,MatchRewards,MatchStats,
  MatchTimeline,MatchAnimation,PreMatchView,OpponentSelector,ScoreBoard}.tsx`
  — árvore órfã confirmada (Sprint 26 Gameplay Foundation já documentou
  isso; mantida propositalmente porque não foi pedida explicitamente pra
  ser removida, e remoção de arquivo sem pedido explícito já foi barrada
  uma vez nesta sessão pelo classificador de segurança). Fora de escopo
  desta sprint (não mencionada no brief), não vou tocar.
- Nenhum outro componente do Card Engine em si está órfão — todos os 9
  layers, `pose-engine/`, `procedural-scene/` estão em uso ativo.

## Achados extras (fora das 4 perguntas, mas relevantes pro objetivo "AAA")

- **Legibilidade em Common**: raridade Common tem intensidade de luz
  (0.06 opacity), 4 partículas, pose num tom claro mas ainda sutil —
  numa carta pequena (116×156 no Pack Reveal) fica bem apagada/pálida.
  A referência mostra TODAS as raridades com presença visual forte
  (mesmo Common tem um fundo cinza dramático com textura de rocha) — vou
  aumentar o piso mínimo de intensidade pra Common/Rare.
- **Tamanho da pose**: hoje ~60% da largura do frame, centralizada
  na parte inferior — a referência mostra o jogador ocupando quase a
  carta inteira (~85-90% da altura), sangrando levemente pra fora das
  bordas em alguns exemplos. Vou aumentar a área da pose.
