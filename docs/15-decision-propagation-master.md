# 15 — Decision Propagation Master Document (World Legends)

> Este documento **não edita** `09-match-engine-master.md`, `12-telemetria-instrumentacao-master.md` nem `13-acceptance-tests-qa-master.md`. Ele especifica, com precisão suficiente para incorporação posterior, exatamente o que precisa mudar em cada um desses três documentos para refletir DD-01 e DD-02, agora aprovadas em `14-design-decisions-open-issues-master.md`. A filosofia original do projeto (doc 01) permanece intacta — estas são extensões de regras já existentes (encerramento de partida, disputa de pênaltis), não funcionalidades novas.

## 1. Objetivo da Propagação

DD-01 e DD-02 foram aprovadas formalmente, satisfazendo as condições 1 e 2 da Seção 4 de `14-design-decisions-open-issues-master.md`. A condição 3 — incorporação aos documentos afetados — é, pela própria definição daquele documento, **um passo de trabalho separado e deliberado**, nunca automático. Este documento é exatamente esse passo: uma especificação completa do que precisa ser alterado, onde, e com qual texto/critério, para que uma futura sessão de edição possa aplicar essas mudanças a `09`, `12` e `13` sem ambiguidade e sem necessidade de reinterpretar a decisão original.

---

## 2. Alterações Necessárias em `09-match-engine-master.md`

### 2.1 Regra de encerramento da partida por menos de 7 jogadores

**Onde inserir:** nova subseção, sugerida como **"§12.1 — Regra de Interrupção por Insuficiência de Elenco"**, imediatamente após a Seção 12 (Lesões) e referenciada por cruzamento na Seção 10 (Cartões) e no loop principal (Seção 25, pseudocódigo).

**Texto normativo a incorporar:**

> A cada minuto simulado, o Match Engine verifica o número de jogadores em campo de cada equipe (titulares menos lesionados/expulsos, mais substituições já aplicadas). Se o número de jogadores em campo de qualquer uma das equipes cair abaixo de 7, a simulação é interrompida imediatamente, no minuto exato em que a condição se verifica. A equipe que permanece com 7 ou mais jogadores é declarada vencedora por W.O. (vitória técnica). Esta regra tem precedência sobre qualquer outro estado de partida (placar, fase de prorrogação, etc.) — uma partida interrompida por W.O. nunca avança para prorrogação ou disputa de pênaltis, independentemente do placar no momento da interrupção.

**Nota de borda registrada (não bloqueante para esta propagação):** o cenário em que ambas as equipes caem abaixo de 7 jogadores no mesmo evento simulado não foi coberto explicitamente por DD-01 como aprovada. Trata-se de uma ocorrência extraordinariamente improvável (duas equipes perdendo jogadores suficientes simultaneamente no mesmo minuto), mas, seguindo o processo da Seção 5 de `14-design-decisions-open-issues-master.md`, este caso específico deve ser registrado como candidato a uma futura `DD-03` caso a equipe julgue necessário formalizá-lo antes do Global Launch — não é resolvido unilateralmente aqui.

### 2.2 Evento de W.O.

**Onde inserir:** adicionar à taxonomia de eventos de partida (referenciada também em `02-modelagem-banco-dados.md`, tabela `match_events`, e em `12-telemetria-instrumentacao-master.md`, Seção 2.2) um novo tipo de evento: **`walkover`**.

**Payload normativo do evento:**

| Campo | Descrição |
|---|---|
| `motivo` | Fixo: `"insuficiência de elenco"` |
| `lado_afetado` | `home` ou `away` — a equipe que ficou abaixo de 7 jogadores |
| `minuto_da_interrupcao` | Minuto exato da simulação em que a condição se verificou |
| `jogadores_restantes` | Número de jogadores em campo da equipe afetada no momento da interrupção |

### 2.3 Registro no replay

**Onde inserir:** nota complementar na Seção 22 (Replay).

**Texto normativo a incorporar:**

> Uma partida encerrada por W.O. produz uma timeline truncada, terminando no evento `walkover` em vez de `full_time`/`penalty_shootout`. Nenhuma lógica especial de replay é necessária — o evento `walkover` é apenas mais um tipo de evento reconhecido na timeline append-only já existente (doc 02, `match_events`); a reprodução do replay simplesmente para no último evento gravado, exatamente como qualquer outra partida.

### 2.4 Fluxo da disputa de pênaltis com teto de 20 rodadas

**Onde alterar:** Seção 20 (Disputa de Pênaltis) — o critério de continuação do laço de morte súbita.

**Texto normativo a incorporar (substituindo a condição de continuação atual):**

> A morte súbita continua enquanto houver empate, até o limite de **20 rodadas adicionais** às 5 cobranças regulares (ou seja, no máximo 25 cobranças por lado no cenário extremo). Ao final da 20ª rodada de morte súbita, se a disputa permanecer empatada, a simulação não realiza uma 21ª cobrança — o desfecho é resolvido pelo mecanismo determinístico descrito em 2.5.

### 2.5 Desempate determinístico baseado na seed

**Onde inserir:** nova subseção dentro da Seção 20, imediatamente após o critério de teto (2.4).

**Texto normativo a incorporar:**

> Caso o teto de 20 rodadas de morte súbita seja atingido sem decisão, o desfecho é resolvido utilizando o stream de RNG já derivado do seed principal da partida (doc 09, Seção 21 — `derivarSeedDeStream`), sob o identificador de stream `"penalty_tiebreak"`. Um único valor determinístico é extraído desse stream para declarar o vencedor, sem simular uma nova cobrança. Esse desfecho é registrado como um evento `penalty_tiebreak_resolved` na timeline, com payload incluindo o lado vencedor e o total de rodadas efetivamente disputadas (sempre 20, neste cenário). Como o valor deriva do mesmo seed principal já persistido, a reprodutibilidade total (doc 09, Seção 21) e a compatibilidade com o sistema de Replay (Seção 22) são preservadas sem exceção — reexecutar a mesma partida com o mesmo seed produz exatamente o mesmo desfecho de desempate, em qualquer ambiente, em qualquer momento futuro.

---

## 3. Alterações Necessárias em `12-telemetria-instrumentacao-master.md`

### 3.1 Eventos de partida encerrada por falta de jogadores

**Onde inserir:** nova linha na tabela de eventos de Partidas, Seção 2.2.

| Evento | Disparado quando | Payload conceitual | Alimenta |
|---|---|---|---|
| `match_walkover` | Regra de §12.1 do doc 09 é acionada | `lado_afetado`, `minuto_da_interrupcao`, `jogadores_restantes` | Contador de ocorrências (3.2), Alertas (3.3) |

### 3.2 Contador de ocorrências

**Onde inserir:** nova linha na tabela de Métricas do Match Engine, Seção 4.

| Métrica | Definição/fórmula | Por que monitorar | Faixa-alvo de referência |
|---|---|---|---|
| Taxa de W.O. por insuficiência de elenco | Contagem de `match_walkover` / total de `match_ended` (incluindo W.O.), por janela | Deve ser extremamente rara por construção — frequência anômala indica problema de calibração upstream (probabilidade de lesão/cartão, doc 09 §10/§12), não um bug do próprio mecanismo de W.O. | Próxima de 0%; qualquer valor sustentado acima de 0,05% das partidas aciona alerta |

### 3.3 Métricas e alertas

**Onde inserir:** nova linha na tabela de Alertas Automáticos, Seção 10.

| Alerta | Gatilho | Severidade | Ação |
|---|---|---|---|
| Taxa de W.O. anormal | Taxa de W.O. (3.2) > 0,05% sustentada por 2+ ciclos de medição | Média | Revisão das probabilidades de cartão (doc 09 §10) e lesão (doc 09 §12) — não uma revisão do mecanismo de W.O. em si |
| Taxa de desempate por seed em pênaltis anormal | Ativação de `penalty_tiebreak_resolved` (3.4) acima do esperado estatístico para 1M+ disputas simuladas (doc 11 §14) | Média | Revisão das taxas de conversão de pênalti (doc 09 §18) — uma taxa de desempate muito acima de zero sugere conversões artificialmente próximas de 50/50 |

### 3.4 Registro do número de rodadas de pênaltis

**Onde alterar:** o evento `match_penalty_shootout` já existente (Seção 2.2) tem seu payload conceitual estendido.

| Campo adicional | Descrição |
|---|---|
| `rodadas_totais` | Número total de rodadas de morte súbita disputadas (0 a 20) |
| `desempate_por_seed` | Booleano — `true` se o desfecho foi resolvido pelo mecanismo determinístico de 2.5 (doc 09), `false` se decidido normalmente dentro do teto |

**Nova métrica associada (Seção 4):** "Distribuição do número de rodadas de morte súbita por disputa" — usada como teste de sanidade estatística (doc 11b, Seção 8): a esmagadora maioria das disputas deve resolver-se nas primeiras rodadas, com frequência decrescente acentuada conforme o número de rodadas aumenta, e uma frequência de `desempate_por_seed = true` estatisticamente próxima de zero em amostras grandes.

---

## 4. Alterações Necessárias em `13-acceptance-tests-qa-master.md`

### 4.1 Novos casos de teste cobrindo DD-01

| ID | Cenário | Resultado esperado |
|---|---|---|
| TC-WO-01 | Equipe reduzida a exatamente 7 jogadores em campo | Partida continua normalmente — 7 é o piso ainda jogável |
| TC-WO-02 | Equipe reduzida a 6 jogadores em campo | W.O. imediato no minuto exato da ocorrência; evento `walkover` gerado |
| TC-WO-03 | Partida encerrada por W.O. | Evento corretamente registrado em `match_events` (doc 02) e em `match_walkover` (doc 12, 3.1), com payload completo |
| TC-WO-04 | Partida encerrada por W.O. é incluída em análises agregadas de distribuição de placar (doc 11 §16) | Partidas W.O. são **excluídas** do cálculo de distribuição de placares e gols/jogo — são estatisticamente distintas de um resultado "jogado até o fim" e contaminariam a calibração se incluídas |
| TC-WO-05 | Ambas as equipes caem abaixo de 7 jogadores no mesmo evento simulado | **Cenário fora do escopo de DD-01 conforme aprovada** — teste marcado como `Conhecido/Pendente`, não bloqueante para esta suíte, candidato a registro como `DD-03` (ver nota de borda, Seção 2.1) |

### 4.2 Novos casos de teste cobrindo DD-02

| ID | Cenário | Resultado esperado |
|---|---|---|
| TC-PEN-CAP-01 | Disputa de pênaltis chega à 20ª rodada de morte súbita ainda empatada | Desempate determinístico via seed (`penalty_tiebreak_resolved`) é acionado; nenhuma 21ª cobrança é simulada |
| TC-PEN-CAP-02 | Mesma partida (mesmo seed, mesmo `engine_version`) reexecutada no cenário de TC-PEN-CAP-01 | Resultado do desempate idêntico em 100% das reexecuções |
| TC-PEN-CAP-03 | Replay de uma partida decidida por desempate de seed | Timeline reconstruída reproduz o evento `penalty_tiebreak_resolved` corretamente, sem necessidade de reexecutar o engine |
| TC-PEN-CAP-04 | Simulação em escala de 1M+ disputas de pênalti (doc 11 §14) | Frequência de disputas que atingem a 20ª rodada é extremamente baixa, consistente com a probabilidade teórica esperada de uma sequência tão longa de empates |
| TC-PEN-CAP-05 | Qualquer disputa, em qualquer escala de simulação | Nunca ocorre uma 21ª cobrança simulada de fato — o teto de 20 rodadas é absoluto |

### 4.3 Critérios de aprovação

Todos os casos `TC-WO-01` a `TC-WO-04` e `TC-PEN-CAP-01` a `TC-PEN-CAP-05` tornam-se **bloqueantes** na Regression Suite Permanente (doc 13, Seção 18) a partir da incorporação formal desta propagação — qualquer falha em qualquer um deles impede o deploy de um patch, com a única exceção de `TC-WO-05`, que permanece como item de conhecimento registrado, não como gate, até que `DD-03` (se aberta) seja resolvida.

---

## 5. Matriz de Rastreabilidade

| Decisão | Match Engine (`09`) | Telemetria (`12`) | QA (`13`) | Replay |
|---|---|---|---|---|
| DD-01 | §12.1 (nova regra), §2.2 (evento `walkover`), §22 (nota de replay) | §2.2 (`match_walkover`), §4 (taxa de W.O.), §10 (alerta) | §17/§18 (`TC-WO-01` a `TC-WO-05`) | Coberto via §22 do doc 09 — nenhuma lógica nova de replay, apenas novo tipo de evento reconhecido |
| DD-02 | §20 (teto de 20 rodadas), nova subseção 2.5 (desempate por seed), §21 (stream `"penalty_tiebreak"`) | §2.2 (extensão de payload de `match_penalty_shootout`), §4 (distribuição de rodadas) , §10 (alerta de desempate anormal) | §17/§18 (`TC-PEN-CAP-01` a `TC-PEN-CAP-05`) | Coberto via §22 do doc 09 — desempate determinístico é nativamente reproduzível pelo seed já persistido |

---

## 6. Status das Decisões

| ID | Tema | Status | Data de aprovação | Documento de aprovação |
|---|---|---|---|---|
| DD-01 | Número mínimo de jogadores em campo | **Aprovado** | 19/06/2026 | `14-design-decisions-open-issues-master.md`, aprovação formal recebida nesta sessão |
| DD-02 | Limite da disputa de pênaltis (morte súbita) | **Aprovado** | 19/06/2026 | `14-design-decisions-open-issues-master.md`, aprovação formal recebida nesta sessão |

---

Este documento é a especificação completa de propagação — `09`, `12` e `13` permanecem, neste momento, inalterados. A incorporação real do texto normativo das Seções 2 a 4 a cada um desses três arquivos é o próximo passo de trabalho natural, executável seção por seção (recomenda-se começar por `09`, já que `12` e `13` referenciam conceitos definidos lá). Quer que eu já aplique essas alterações diretamente aos três documentos agora, ou prefere revisar o texto normativo proposto antes da incorporação?
