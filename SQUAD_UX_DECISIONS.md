# SQUAD_UX_DECISIONS.md — Sprint 17 "Squad Revolution"

Decisões de UX/produto tomadas durante a sprint, com o trade-off explícito de cada
uma. Objetivo: se alguém discordar de uma escolha depois, o motivo está registrado
aqui em vez de precisar arqueologia de código.

## 1. Coleção completa vira bottom sheet sob demanda, não lista inline

**Decisão:** o botão "📚 Coleção" abre a lista completa de cartas disponíveis como
bottom sheet (overlay, com backdrop). Antes ela ficava sempre visível, ocupando
~150px fixos na tela.

**Trade-off:** perde-se um pouco de conveniência (antes dava pra arrastar uma carta
da lista pro campo sem abrir nada). Ganha-se o espaço que faltava para o campo ser
"a tela mais bonita do jogo" — que era o requisito explícito e inegociável da
sprint. Drag-and-drop continua funcionando dentro do sheet aberto; a forma primária
de adicionar/trocar continua sendo tocar num slot, que já abre o seletor com busca e
filtro.

## 2. Toque num slot vazio → seletor. Toque num slot ocupado → preview + botão trocar

**Decisão:** os dois casos têm affordances diferentes de propósito. Slot vazio: o
usuário claramente quer adicionar alguém, então vai direto pro seletor. Slot
ocupado: o usuário pode só querer *ver* a carta (atributos, traits) — então abre
preview, com um botão explícito "🔄 Trocar jogador" para quem quer substituir.

**Trade-off:** troca em slot ocupado agora leva 2 toques em vez de 1 (toca no slot →
toca em "trocar" → escolhe → confirma). Optamos por isso porque um toque único que
já abrisse o seletor removeria a possibilidade de só inspecionar a carta sem risco
de trocar sem querer — e "nunca trocar no escuro" foi requisito explícito da sprint.

## 3. Comparação antes/depois é sempre um passo intermediário, nunca instantâneo

**Decisão:** mesmo para preencher um slot vazio (sem carta "antiga" pra comparar), a
troca passa por uma tela de confirmação mostrando OVR/Química/setores antes→depois.

**Trade-off:** monta o time do zero fica um pouco mais lento (mais toques por
jogador). Compensado pelo botão "⚡ Melhor Time" (auto-build), que resolve o caso de
"quero montar rápido" sem passar pela comparação manual jogador a jogador — a
comparação manual é para quando o usuário está *decidindo*, não para o caminho
rápido.

## 4. Cor da linha de química reflete a relação real (país/continente), não só o score

**Decisão:** verde = mesmo país, azul = mesmo continente, dourado = link perfeito
("Dream Team"), cinza = sem sinergia — em vez de 4 faixas de cor mapeadas
arbitrariamente no score 0–4.

**Trade-off:** nenhum real. É estritamente mais informativo: o jogador entende *por
quê* duas cartas têm química, não só *quanto*. O cálculo do bônus em si (que decide
o OVR final) não mudou — só a cor.

## 5. Análise do Time é acessível tocando no número de OVR, não um botão dedicado

**Decisão:** a barra de ações já tinha 4 posições (Melhor Time / Coleção /
Sugestões / Jogar-Opções) em um grid 2×2. Um quinto botão quebraria essa grade ou
forçaria ícones menores. Em vez disso, o próprio número gigante de OVR — que já é o
elemento mais chamativo da tela — vira o gatilho.

**Trade-off:** descoberta menos óbvia que um botão rotulado (mitigado: o OVR já
recebe destaque visual central, e é um padrão comum em jogos de cartas esportivas
tocar no rating pra ver detalhes).

## 6. Virtualização (react-window) foi adiada, não implementada

**Decisão:** em vez de adicionar uma dependência nova para virtualizar listas de
centenas de cartas, cortamos o render em lotes fixos (80 cartas na Coleção, 60 no
seletor de jogador) com uma mensagem "+N cartas — refine a busca".

**Trade-off:** com busca/filtro ativos isso é invisível (a lista filtrada raramente
passa de 20–30). Sem filtro, num usuário com coleção muito grande, as últimas
cartas por OVR ficam ocultas até ele buscar. Escolhido deliberadamente: a real
mudança de performance desta sprint foi tirar a coleção do render permanente
(sheet sob demanda) — isso sozinho já elimina o cenário mais caro (renderizar a
coleção inteira em toda interação no campo). Virtualização de verdade fica como
item futuro se o teto de 80/60 se mostrar insuficiente na prática.

## 7. Banco (reservas) ganhou filtro por setor, não por OVR/país/raridade

**Decisão:** o banco tem no máximo 12 cartas — um filtro de setor (TODOS/GK/DEF/
MID/ATT) já cobre o caso de uso real ("cadê meu zagueiro reserva"). Filtros por
OVR/país/raridade existem na Coleção completa (onde fazem diferença, com dezenas ou
centenas de cartas) mas não no banco.

**Trade-off:** não segue a especificação da sprint ao pé da letra (que pedia os 4
filtros também no banco). Decisão consciente de não construir 3 filtros adicionais
para uma lista de no máximo 12 itens, onde olhar rapidamente já resolve — filtro
por setor dá o essencial (achar goleiro/defensor/meio/atacante reserva rápido) sem
adicionar chrome de UI que não se paga em uma lista tão pequena.

## 8. Reaproveitar `CardDetailModal` da Coleção em vez de criar um preview próprio

**Decisão:** o preview de carta no campo usa o mesmo componente da tela de Coleção
(`components/collection/CardDetailModal.tsx`), passando `onFav`/`onCompare` como
no-ops.

**Trade-off:** o coração (favoritar) e a balança (comparar) aparecem no preview do
Squad mas não fazem nada lá — pequena inconsistência visual. Preferível a duplicar
~230 linhas de UI de card detail só para desabilitar 2 botões; e mantém os dois
preview (Coleção e Squad) visualmente idênticos, o que é bom para consistência de
produto.
