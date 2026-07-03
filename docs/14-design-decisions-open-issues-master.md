# 14 — Design Decisions & Open Issues Master Document (World Legends)

> Este documento não implementa nada e não altera nenhum documento anterior. Seu único propósito é registrar formalmente as lacunas identificadas pelo processo de QA em `13-acceptance-tests-qa-master.md` (itens TC-EXT-07 e TC-EXT-09), transformando-as em decisões de design explícitas, com alternativas e recomendação técnica, para aprovação. Nenhuma regra aqui descrita passa a valer para o jogo até que a Seção 4 (Critérios de Aprovação) seja satisfeita.

## 1. Objetivo

O papel deste documento é registrar **decisões de design abertas** identificadas pelo processo de QA — situações em que a auditoria de regras existentes revelou um comportamento de sistema não definido em nenhum documento anterior (`09`, `10`, `11`, `11b`, `12`, `13`).

Essa formalização existe para evitar um risco específico e comum em projetos de simulação complexa: que a **implementação "invente" a regra ausente** no momento de escrever o código, sem registro, sem alternativas consideradas e sem aprovação — o que produziria uma regra de jogo real surgida de uma decisão de engenharia não-intencional, não de design deliberado.

A partir do momento em que uma decisão aqui registrada é aprovada (Seção 4), ela passa a ter o mesmo peso de um contrato oficial de design — equivalente, em força, a qualquer regra já presente nos documentos `09` a `13`.

---

## 2. Problema A — Número Mínimo de Jogadores em Campo

**Contexto.** Lesões (doc 09, §12), expulsões (doc 09, §10) e, em tese, uma combinação extrema de ambas ao longo de uma única partida podem reduzir o número de jogadores disponíveis de uma equipe a um nível muito baixo. Nenhum documento atual define o que ocorre quando uma equipe fica sem jogadores suficientes para continuar a partida — o caso foi identificado como `TC-EXT-07` em `13-acceptance-tests-qa-master.md`, Seção 17, e marcado explicitamente como lacuna pendente de decisão.

### Opção A — Regra real do futebol

Partida encerrada quando uma equipe fica com menos de 7 jogadores em campo. Vitória automática do adversário. Motivo da interrupção registrado no evento de partida.

| Prós | Contras |
|---|---|
| Simplicidade de especificação e implementação — resultado binário, sem ambiguidade | Pode ser percebido como anticlimático: a partida termina por circunstância de simulação, não por desempenho ao longo dos 90 minutos |
| Alinhado à autenticidade histórica e ao realismo que são pilares do produto (doc 01, filosofia de produto) | Em formatos de liga/temporada, pode gerar percepção de injustiça ("perdi por lesão, não por desempenho") |
| Fácil de auditar — qualquer revisor humano entende a regra sem explicação adicional, pois é uma regra real e conhecida do futebol | Exige decisão complementar simples (mas não nova lacuna): como contabilizar estatísticas parciais já gravadas até o momento da interrupção |
| Diretamente testável (`TC-EXT-07` passa a ter critério de aceitação objetivo) | — |

### Opção B — Jogadores reservas genéricos de emergência

O sistema gera jogadores genéricos com overall mínimo para preencher vagas além do banco de reservas regular. A partida continua normalmente até o fim dos 90 minutos (ou prorrogação/pênaltis, se aplicável).

| Prós | Contras |
|---|---|
| A partida nunca é interrompida — preserva a experiência de "ver o jogo até o fim" | Introduz uma entidade nova no sistema (jogador genérico sem jogador histórico real associado) — conflito direto com o pilar de design "toda carta vem de um jogador histórico real" (doc 10, §1) |
| Reduz frustração imediata do jogador afetado pela lesão/expulsão | Comportamento indefinido em cálculos de química histórica e combos (doc 09 §4, doc 10 §7-8) — um jogador sem nacionalidade/era real não tem como participar desses sistemas de forma coerente |
| — | Overall e atributos do "jogador genérico" precisariam de uma nova faixa de definição, fora da escala de raridade já fixada (doc 04/10 §4) — risco de abrir uma nova frente de balanceamento não solicitada |
| — | Aumenta superfície de teste e de bug sem necessidade clara de valor de produto |

### Opção C — Encerramento com resultado parcial

O placar no momento da interrupção é mantido como resultado final. A partida é encerrada sem vitória automática atribuída.

| Prós | Contras |
|---|---|
| Simples de implementar tecnicamente — apenas interromper a simulação e congelar o estado | Ambíguo sobre justiça: o time prejudicado por lesões pode estar na frente no placar no momento exato da interrupção, e travar o jogo nesse ponto recompensa o timing do evento, não o desempenho competitivo |
| Evita introduzir qualquer entidade nova | Contamina estatisticamente as métricas de gols/jogo e distribuição de placares (doc 11, §16) com partidas artificialmente truncadas, exigindo segmentação especial em toda análise futura |
| — | Sem analogia com nenhuma regra real conhecida — exigiria explicação de UX nova para o jogador, aumentando a carga cognitiva sem ganho de autenticidade |

### Recomendação

**Opção A — Regra real do futebol.**

Justificativa: é a alternativa com menor superfície de risco simultaneamente em três dimensões — **simplicidade** (nenhuma entidade nova, nenhum cálculo novo, resultado binário e diretamente testável via `TC-EXT-07`), **autenticidade** (coerente com o pilar central de produto de que o jogo replica fielmente a lógica do futebol real, doc 01) e **facilidade de auditoria** (qualquer pessoa, dentro ou fora da equipe, entende a regra sem necessidade de documentação adicional, pois é uma regra real e amplamente conhecida). As Opções B e C resolvem o problema imediato ao custo de introduzir nova complexidade estrutural (B) ou nova ambiguidade estatística (C) — exatamente o tipo de trade-off que o processo de QA (doc 13, §1) existe para evitar.

---

## 3. Problema B — Disputa de Pênaltis Potencialmente Infinita

**Contexto.** O algoritmo de morte súbita da disputa de pênaltis (doc 09, §20) não define um limite formal de rodadas. Uma sequência indefinidamente longa é estatisticamente improvável, mas um sistema de produção não pode depender de probabilidade para garantir encerramento — o caso foi identificado como `TC-EXT-09` em `13-acceptance-tests-qa-master.md`, Seção 17.

### Opção A — Sem limite

A morte súbita continua indefinidamente até que haja um vencedor.

| Prós | Contras |
|---|---|
| Conceitualmente "correto" no sentido de nunca interromper artificialmente o desempate real | Depende de uma garantia estatística, não de uma garantia de engenharia — viola diretamente o princípio de QA de que "todo bug deve ser reproduzível" e, por extensão, de que todo processo deve ser **finito por construção** (doc 13, §1) |
| Simples de descrever conceitualmente | Risco real de timeout em ambientes de execução com limite de tempo (ex: Edge Functions com timeout curto, doc 01 §3/§5) — um caso extremo (ainda que improvável) pode causar falha de infraestrutura, não apenas uma partida "longa" |
| — | Não testável de forma determinística em `TC-EXT-09` — não há como provar "isso sempre termina" sem um limite explícito |

### Opção B — Limite máximo de rodadas (10, 15 ou 20)

A morte súbita é limitada a um número fixo de rodadas adicionais às 5 cobranças regulares.

| Prós | Contras |
|---|---|
| Garante término finito com certeza absoluta, independentemente de qualquer sequência de resultados | Não resolve completamente o problema por si só — é necessário definir o que ocorre se o teto for atingido sem decisão (a "rodada seguinte" não pode simplesmente não existir) |
| Fácil de testar diretamente (`TC-EXT-09` passa a ter critério de aceitação objetivo: "nunca excede N rodadas") | Escolher o valor do teto (10/15/20) é uma decisão isolada sem critério técnico próprio — precisa de uma regra complementar para ser uma solução completa |
| Compatível com qualquer ambiente de execução, incluindo os com timeout restrito | — |

### Opção C — Limite máximo de rodadas + desempate probabilístico controlado via seed

A morte súbita é limitada a um número fixo de rodadas. Caso o teto seja atingido sem decisão, o **seed da partida** (já existente e persistido, doc 09 §21) é usado para resolver o desempate de forma determinística.

| Prós | Contras |
|---|---|
| Resolve completamente a lacuna que a Opção B deixa aberta — define exatamente o que ocorre no teto | Levemente mais elaborado de especificar do que apenas "a disputa para" — exige definir qual regra determinística específica é aplicada no desfecho (detalhe de implementação, a ser refinado **após** a aprovação desta decisão, não um contra estrutural) |
| Usa exclusivamente uma fonte de aleatoriedade já existente e auditável (o seed da partida) — não introduz nenhuma nova fonte de não-determinismo | — |
| Garante reprodutibilidade total: a mesma partida, reexecutada com o mesmo seed, produz exatamente o mesmo desfecho mesmo no caso extremo (doc 09 §21-22) | — |
| Compatível nativamente com o sistema de Replay (doc 09, §22) — o desfecho do teto é parte da timeline gravada, auditável como qualquer outro evento | — |

### Recomendação

**Opção C, com os seguintes parâmetros específicos:**

- Teto de **20 rodadas** de morte súbita (além das 5 cobranças regulares).
- O seed da partida é persistido normalmente, como já ocorre para toda a simulação (doc 09, §21).
- Se a disputa permanecer empatada após a 20ª rodada de morte súbita, um **desempate determinístico baseado no seed da partida** resolve o resultado final, sem nenhuma nova fonte de aleatoriedade.

Justificativa: esta combinação atende simultaneamente aos quatro critérios que mais importam para um sistema de produção de longo prazo — **impossibilidade de loop infinito** (o teto de 20 rodadas garante término matemático sempre), **reprodutibilidade** (o desfecho do teto deriva do mesmo seed já usado em toda a partida, não de uma nova chamada de aleatoriedade fora do controle do sistema determinístico), **compatibilidade com Replay** (o desfecho do teto é apenas mais um evento na timeline já persistida, doc 09 §22, reproduzível como qualquer outro) e **facilidade de auditoria** (qualquer disputa sobre o resultado de uma partida nesse cenário extremo pode ser verificada reexecutando o mesmo seed, exatamente como qualquer outra partida do jogo).

---

## 4. Critérios de Aprovação

Uma decisão registrada neste documento é considerada **aprovada** somente quando as três condições abaixo forem satisfeitas, nesta ordem:

1. **Documentada** — a decisão, com suas alternativas e recomendação, está registrada neste documento (condição já satisfeita para os Problemas A e B acima).
2. **Concordância explícita recebida** — uma aprovação direta e inequívoca da pessoa responsável pelo projeto (ex: "Aprovo DD-01 conforme recomendado" ou "Aprovo DD-02 com o teto de 15 rodadas em vez de 20"), registrada como atualização do `Status` na tabela da Seção 6.
3. **Incorporação posterior aos documentos afetados** — somente *após* a concordância explícita, a regra aprovada é propagada, em um passo de trabalho separado e deliberado, aos documentos impactados (`09-match-engine-master.md`, `13-acceptance-tests-qa-master.md`, `12-telemetria-instrumentacao-master.md` e a futura especificação de API/contrato de dados). Essa propagação nunca ocorre automaticamente como efeito colateral da aprovação — é um passo distinto, executado e confirmado separadamente.

Enquanto a condição 2 não for satisfeita, o `Status` de uma decisão permanece `Pendente`, e nenhum documento anterior é alterado.

---

## 5. Processo para Futuras Lacunas

Política permanente, válida para qualquer lacuna futura descoberta em qualquer fase do projeto (Alpha, Beta, Soft Launch, Global Launch ou LiveOps, doc 13 §20):

**QA pode identificar problemas.** Qualquer auditoria, teste de caso extremo (doc 13, §17) ou processo de regressão (doc 13, §18) que revele um comportamento de sistema não definido em nenhum documento existente é, por definição, uma lacuna válida a ser registrada.

**QA não pode criar funcionalidades novas.** A identificação de uma lacuna nunca é seguida, pelo próprio processo de QA, de uma implementação ou de uma regra definitiva — apenas de alternativas documentadas e uma recomendação técnica, exatamente como nas Seções 2 e 3 deste documento.

**Toda lacuna descoberta deve gerar um documento de decisão.** Novas lacunas são registradas como novas linhas na tabela da Seção 6 deste mesmo documento (mantendo um único registro centralizado de decisões de design ao longo da vida do projeto, em vez de fragmentar decisões em múltiplos arquivos novos a cada ocorrência), cada uma com seu próprio identificador sequencial (`DD-03`, `DD-04`, ...) e, quando a complexidade justificar, sua própria seção de alternativas detalhadas neste arquivo.

**Somente após aprovação formal uma regra passa a fazer parte do jogo.** Nenhuma lacuna identificada é tratada como regra válida de produção antes de completar as três condições da Seção 4.

---

## 6. Registro das Decisões Aprovadas

| ID | Tema | Status | Impacta |
|---|---|---|---|
| DD-01 | Número mínimo de jogadores em campo | **Aprovado** (19/06/2026) | Match Engine (doc 09), Replay (doc 09 §22), QA (doc 13), Telemetria (doc 12) |
| DD-02 | Limite da disputa de pênaltis (morte súbita) | **Aprovado** (19/06/2026) | Match Engine (doc 09), Replay (doc 09 §22), QA (doc 13), Telemetria (doc 12) |

Concordância explícita recebida para ambas as decisões, satisfazendo a condição 2 da Seção 4. A condição 3 (incorporação aos documentos afetados) está especificada em detalhe em `15-decision-propagation-master.md`, mas ainda não foi aplicada aos arquivos `09`, `12` e `13` — esse é o próximo passo de trabalho separado, conforme a própria condição 3 exige.

---

Este documento não altera `09`, `10`, `11`, `11b`, `12` ou `13`. Assim que houver concordância explícita sobre DD-01 e/ou DD-02 (com ou sem ajuste de parâmetros, como o número exato de rodadas de morte súbita), o próximo passo será um passo de trabalho separado para propagar a regra aprovada aos documentos afetados listados na coluna "Impacta" — apenas então, e apenas para a regra especificamente aprovada.
