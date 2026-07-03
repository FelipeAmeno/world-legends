# 13 — Acceptance Tests & QA Master Document (World Legends)

> Especificação pura de QA — sem código. Traduz cada regra de `09-match-engine-master.md`, `10-card-system-master.md`, `11-balance-competitive-validation-master.md`, `11-balanceamento-plano-de-testes-master.md` e `12-telemetria-instrumentacao-master.md` em casos de teste verificáveis. Nenhuma funcionalidade nova é proposta — onde a auditoria revela uma lacuna de regra (seção 17), ela é sinalizada para decisão de design, não resolvida unilateralmente aqui.

## 1. Filosofia de QA

**Nada é considerado pronto sem testes.** Definição de "feito" para qualquer sistema de World Legends inclui, obrigatoriamente, cobertura de teste nos níveis aplicáveis da pirâmide (seção 2) — uma fórmula implementada sem teste correspondente é, por definição, trabalho incompleto.

**Toda fórmula precisa ser validada.** Cada equação presente nos documentos de Match Engine, Cartas e Balanceamento tem ao menos um caso de teste unitário e, quando aplicável, um teste de propriedade (seção 2) que prove que a fórmula se comporta corretamente em todo o domínio de entrada, não apenas no caso feliz.

**Todo bug deve ser reproduzível.** Um defeito relatado sem `seed` e `engine_version` associados (doc 12, seção 3) é tratado como não-investigável até que essa informação seja recuperada — reprodutibilidade não é um luxo de debug, é pré-requisito de abertura de ticket.

**Seeds garantem replays auditáveis.** A capacidade de reconstruir exatamente uma partida específica, anos depois, a partir de `seed` + `engine_version` (doc 09, seção 22) é tratada como uma propriedade de sistema crítica, testada isoladamente (seção 4).

**Nenhum patch entra em produção sem passar pelos gates.** A suíte de regressão permanente (seção 18) e o pipeline de aprovação (doc 11, seção 25) são bloqueantes, não recomendações — uma falha em qualquer teste marcado como gate impede o deploy, sem excelência técnica do restante do patch.

---

## 2. Pirâmide de Testes

| Nível | Função | Quando usar | Quem executa | Frequência |
|---|---|---|---|---|
| Unit Tests | Validar uma única fórmula/função isolada (ex: curva de compressão, cálculo de overall) com entradas e saídas fixas | Toda fórmula nova ou alterada | Engenharia | A cada commit |
| Property Tests | Validar invariantes que devem se manter verdadeiras para **qualquer** entrada dentro do domínio válido (ex: "a saída da curva de compressão nunca excede 90") | Fórmulas com domínio de entrada amplo, especialmente tetos/clamps | Engenharia | A cada commit |
| Integration Tests | Validar a interação correta entre múltiplos módulos (ex: pacote → carta → duplicata → fragmento → craft) | Funcionalidades que cruzam fronteiras de sistema | Engenharia/QA | A cada build |
| Simulation Tests | Validar propriedades estatísticas emergentes em larga escala (ex: distribuição de gols, winrate por raridade) | Qualquer mudança no Match Engine ou em probabilidades | QA + Data Analyst | Antes de todo patch (doc 11, seção 14) |
| Regression Tests | Confirmar que uma mudança não afetou métricas não-relacionadas | Todo patch, sem exceção | QA automatizado | Todo patch (seção 18) |
| Acceptance Tests | Validar uma regra de negócio/produto completa do ponto de vista do jogador (ex: "completar álbum entrega a recompensa correta") | Toda feature antes de ser considerada concluída | QA | Por feature/release |
| Manual Exploratory Tests | Investigação humana livre, fora de roteiro, caça a exploits e problemas de UX que testes automatizados não cobrem | Antes de cada fase de lançamento (seção 19) | QA humano dedicado | Por fase |

---

## 3. Match Engine — Casos de Teste

| ID | Sistema | Setup/Entrada | Saída esperada | Referência |
|---|---|---|---|---|
| TC-ME-01 | Geração de gols | Squad A com Team Power +20 sobre Squad B, 1M partidas, seed variando | Winrate de A dentro da curva logística esperada (doc 11b, seção 8); média global de gols entre 2,6–2,8 | Doc 09 §17; Doc 11 §16 |
| TC-ME-02 | xG individual | Finalizador com atributos conhecidos vs. defesa/goleiro conhecidos | `xg` calculado bate com a fórmula exata do doc 09 §17, sempre dentro de [0,03; 0,55] mesmo em extremos de atributo (0 ou 99) | Doc 09 §17 |
| TC-ME-03 | Posse | Partida completa simulada | Soma de minutos favorecidos = duração total (90 ou 90+ET); nenhuma partida resulta em 100%/0% de posse exceto mismatch de Team Power extremo e documentado | Doc 09 §16, §24 |
| TC-ME-04 | Assistências | Par de jogadores com link de química 4 envolvidos na mesma jogada de gol | Bônus de +5% de chance de assistência aplicado somente quando ambos participam e estão adjacentes na formação | Doc 09 §4; Doc 10 §7 |
| TC-ME-05 | Cartões | Mesma falta simulada sob os 3 perfis de árbitro (permissivo/normal/rigoroso) | Chance de cartão escala proporcionalmente aos multiplicadores 0,7x/1,0x/1,4x (doc 09 §10) | Doc 09 §10 |
| TC-ME-06 | Cartões — 2º amarelo | Jogador já com 1 amarelo na partida comete nova falta | Vermelho automático, sem novo roll de probabilidade | Doc 09 §10 |
| TC-ME-07 | Faltas na área | Falta simulada dentro da área | Probabilidade de pênalti avaliada conforme doc 09 §18, nunca confundida com falta fora da área | Doc 09 §18 |
| TC-ME-08 | Lesões | 100k faltas simuladas com vítima aleatória | Distribuição de severidade observada ≈ 60% leve / 30% moderada / 10% grave (doc 09 §12) | Doc 09 §12 |
| TC-ME-09 | Lesões — Fast Recovery | Mesma lesão simulada com e sem o trait | Duração reduzida em até 30%, nunca mais | Doc 11 §7 |
| TC-ME-10 | Substituições | Partida completa | Nunca mais de 5 substituições nem mais de 3 janelas formais utilizadas (exceto força maior) | Doc 09 §13 |
| TC-ME-11 | Substituições forçadas | Lesão/vermelho ocorre após as 3 janelas formais esgotadas | Substituição forçada por lesão/expulsão é permitida mesmo assim, sem contar como 4ª janela | Doc 09 §13 |
| TC-ME-12 | Pênaltis — conversão | 10k cobranças simuladas com cobradores/goleiros de overall médio | Taxa de conversão agregada entre 70%–85% | Doc 09 §18; Doc 11 §16 |
| TC-ME-13 | Pênaltis — Gelo nas Veias | Mesma cobrança com e sem o trait | Conversão aumenta em até +10%, nunca mais | Doc 11 §7 |
| TC-ME-14 | Prorrogação — gatilho | Partida de liga (não exige vencedor) termina empatada | Prorrogação **não** é acionada | Doc 09 §19 |
| TC-ME-15 | Prorrogação — gatilho | Partida de mata-mata termina empatada | Prorrogação é acionada, com +1 janela extra de substituição liberada | Doc 09 §19 |
| TC-ME-16 | Desempate por pênaltis | Prorrogação termina empatada | Disputa de pênaltis inicia, 5 cobranças por lado, morte súbita se necessário | Doc 09 §20 |

---

## 4. Reprodutibilidade

| ID | Cenário | Validação |
|---|---|---|
| TC-REPRO-01 | Mesmo `seed` + mesmo `engine_version`, executado N vezes | Resultado idêntico byte-a-byte em 100% das execuções — placar, eventos, estatísticas, MVP |
| TC-REPRO-02 | Seeds diferentes, mesmo `engine_version`, mesmos squads | Resultados individuais podem diferir; a distribuição agregada em larga escala (doc 11 §14) permanece estável dentro da margem de erro esperada |
| TC-REPRO-03 | Mesmo `seed`, `engine_version` diferente (após patch documentado) | Resultado pode diferir intencionalmente; a mudança deve ser rastreável a um Competitive Modifier ou alteração de versão registrada (doc 11 §11), nunca silenciosa |
| TC-REPRO-04 | Reconstrução de replay a partir de `match_events` persistido | Timeline reconstruída corresponde exatamente à simulação original, sem necessidade de reexecutar o engine (doc 09 §22) |
| TC-REPRO-05 | Reexecução do `simulateMatch` com o seed gravado, anos depois, em ambiente de auditoria | Resultado idêntico ao gravado originalmente, confirmando a cadeia de auditoria completa |

---

## 5. Traits — Matriz de Testes

| Trait | Teste de Ativação | Teste de Probabilidade | Teste de Stack | Teste de Limite |
|---|---|---|---|---|
| Matador | Bônus só se aplica em chances do próprio portador, dentro da área | Bônus medido converge a +12% do xG da jogada, nunca mais | N cópias em campo não multiplicam o bônus — cada uma só afeta sua própria finalização | Em atributos extremos (finishing=99), bônus permanece ≤ +12% |
| Maestro | Bônus só se aplica em jogadas de criação com link de química ativo | Bônus medido converge a +10% de chance de assistência | Idem — efeito por jogador, não por time | Combinado a química link 4, soma respeita o Teto Absoluto de Assistência de +18% (doc 11b §4) |
| Capitão | Bônus de moral só ativo enquanto a carta está em campo | +6 moral inicial / −30% queda medidos corretamente | **Exclusividade obrigatória** — tentativa de escalar 2 Capitães simultâneos deve ser bloqueada na validação de elenco | Removido do campo (substituição/expulsão), o bônus cessa imediatamente |
| Muralha | Bônus só se aplica em jogadas defensivas do próprio portador | xG do adversário reduzido em até −10% na jogada específica | Efeito por jogador, sem stacking global | Mesmo com múltiplas cartas Muralha, nenhuma jogada individual sofre redução além de −10% |
| Clutch Player | Bônus só ativo a partir do minuto 76 | +8% de desempenho efetivo medido | Efeito por jogador | Janela fixa de 14 minutos nunca se expande |
| Big Game Player | Bônus só ativo em partidas marcadas como alta importância | +8% medido | Efeito por jogador | Classificação de "alta importância" é determinada pelo formato da competição, não editável por elenco |
| Iron Man | Redução de risco de lesão/fadiga só ativa para o próprio portador | −25% risco de lesão / −20% fadiga de calendário medidos | Efeito por jogador | Disponibilidade ao longo de uma temporada inteira monitorada (doc 12 §5) para detectar composição estrutural anômala |
| Fast Recovery | Redução de duração de lesão só ativa quando o portador é lesionado | −30% de duração medida | Efeito por jogador | Nunca reduz uma lesão "grave" para um valor abaixo do piso da faixa "leve" |
| Super Sub | Bônus só ativo nos 15 minutos após entrar como substituto | +10% medido | Múltiplas entradas simultâneas de cartas Super Sub não somam bônus entre si — cada uma é independente | Bônus expira exatamente no minuto 16 após a entrada |
| Dead Ball Specialist | Bônus só ativo em cobranças de bola parada do próprio portador | +15% medido | Efeito por jogador | Frequência-base de eventos de bola parada permanece fixa, não escalável pelo trait |
| Hero Moment | Evento raro só pode ser atribuído ao portador em contexto de pressão | Frequência adicional de +0,5pp por carta medida | Soma agregada de múltiplas cartas Hero Moment no mesmo time respeita teto de +2pp agregado (doc 11b §3) | Acima do teto agregado, o excedente é descartado (clamp), não soma linearmente |
| Gelo nas Veias | Bônus só ativo em disputas de pênalti | +10% de conversão medida | Efeito por jogador | Não vaza para cobranças normais durante os 90 minutos |
| Leader | Bônus ativo sempre que 1+ cópia está em campo | Bônus de consistência mensurável | Empilhamento segue exatamente `Σ base × (0,5)^(i−1)` | Teto absoluto de `2× base` nunca excedido, mesmo com 5+ cópias simultâneas |

---

## 6. Química — Casos de Teste

| ID | Cenário | Resultado esperado |
|---|---|---|
| TC-QUIM-01 | Dois jogadores adjacentes, mesma seleção, mesma edição de Copa | Link = +4 |
| TC-QUIM-02 | Mesma seleção, eras sobrepostas, Copas diferentes | Link = +2 |
| TC-QUIM-03 | Mesma seleção, eras não sobrepostas | Link = +1 |
| TC-QUIM-04 | Nações diferentes, eras sobrepostas | Link = 0 |
| TC-QUIM-05 | Nações diferentes, eras totalmente distintas | Link = −1 |
| TC-QUIM-06 | Time com química mínima possível (todos os links em −1) | Bônus de Team Power = −3 exatamente (piso, doc 09 §4) |
| TC-QUIM-07 | Time com química máxima possível (todos os links em +4) | Bônus de Team Power = +4 exatamente (teto, doc 09 §4) |
| TC-QUIM-08 | Química máxima (+4) somada a combo Onze Completo (+8) simultaneamente | Soma bruta = +12; clamp do Orçamento Global de Sinergia reduz para +10 efetivo (doc 11b, Caso 6) |
| TC-QUIM-09 | Time "Onze Histórico Reconhecido" (escalação idêntica a uma campanha real) | Bônus adicional de reconhecimento ativado corretamente, sem duplicar o bônus de química já calculado pelos links individuais |

---

## 7. Combos Lendários — Casos de Teste

| ID | Tipo | Cenário | Resultado esperado |
|---|---|---|---|
| TC-COMBO-01 | Dupla | As duas cartas exigidas, adjacentes na formação | Combo ativa, +2 de Team Power |
| TC-COMBO-02 | Dupla | Uma das duas cartas ausente do elenco | Combo não ativa |
| TC-COMBO-03 | Dupla | As duas cartas presentes, mas não adjacentes na formação escolhida | Combo não ativa (regra de adjacência respeitada) |
| TC-COMBO-04 | Trio | Três cartas exigidas presentes e nas posições corretas | Combo ativa, +2 de Team Power |
| TC-COMBO-05 | Onze Completo | Escalação idêntica ao elenco histórico real exigido | Combo ativa, +8 fixo |
| TC-COMBO-06 | Onze Completo | 10 de 11 posições corretas, 1 divergente | Combo **não** ativa — sem crédito parcial |
| TC-COMBO-07 | Conflito | Combo Dupla pequeno compartilha 1 jogador com Onze Completo já ativo | Apenas o Onze Completo é considerado; o combo pequeno é desativado pela regra de não-sobreposição |
| TC-COMBO-08 | Stack | Dois combos Dupla/Trio simultâneos, sem sobreposição de jogadores | Ambos ativam, bônus somado (até o teto do Orçamento Global) |
| TC-COMBO-09 | Limite | Combinação teórica que somaria mais de +10 entre química e combos | Orçamento Global de Sinergia clampa em +10 |

---

## 8. Normalização Competitiva — Simulação

| Carta (overall casual) | Overall competitivo calculado | Verificação |
|---|---|---|
| 88 | 85,75 | `85 + (88−85)×0,25` ✓ |
| 90 | 86,25 | `85 + (90−85)×0,25` ✓ |
| 92 | 86,75 | `85 + (92−85)×0,25` ✓ |
| 95 | 87,50 | `85 + (95−85)×0,25` ✓ |
| 99 | 88,50 | `85 + (99−85)×0,25` ✓ |

**Verificações obrigatórias adicionais:**

| ID | Verificação | Resultado esperado |
|---|---|---|
| TC-NORM-01 | Teto absoluto | Nenhum valor competitivo, mesmo somando bônus de química/combo/trait, excede 90 |
| TC-NORM-02 | Compressão proporcional | Gap bruto entre carta 88 e carta 99 (12,5%) comprime para gap competitivo de 88,5 vs. 85,75 (≈3,2%) |
| TC-NORM-03 | Ausência de pay-to-win | Teste de Contribuição Individual (doc 11b §1): substituir qualquer carta normalizada por uma equivalente genérica nunca move o winrate esperado em mais de +6pp |
| TC-NORM-04 | Modo casual inalterado | As mesmas 5 cartas, em modo casual/liga privada, mantêm seus overalls brutos sem qualquer compressão |
| TC-NORM-05 | Atributos abaixo do limiar | Qualquer atributo ≤ 85 permanece idêntico em ambos os modos, sem distorção |

---

## 9. Packs — Casos de Teste

| ID | Pacote | Validação |
|---|---|---|
| TC-PACK-01 | Clássico | Mínimo 1 carta Rare-ou-melhor garantida por abertura, em 100% das amostras |
| TC-PACK-02 | Elite | Mínimo 2 cartas Elite-ou-melhor garantidas |
| TC-PACK-03 | Lenda | Slot de "hit" garante 1 Legendary-ou-melhor em 100% das amostras |
| TC-PACK-04 | Prime | Mínimo 1 carta em edição Prime garantida |
| TC-PACK-05 | Evento | 1 carta World Cup Hero ou Event daquele evento específico garantida, nunca de outro evento |
| TC-PACK-06 | Distribuição estatística | Em amostra de 1M+ aberturas, frequência observada por raridade desvia no máximo 0,1pp da tabela declarada (doc 10 §15) |
| TC-PACK-07 | Pity — Legendary+ | Após exatamente 40 pacotes sem Legendary-ou-melhor, o 41º garante a raridade |
| TC-PACK-08 | Pity — Ultra+ | Após exatamente 120 pacotes sem Ultra-ou-melhor, o pacote seguinte garante a raridade |
| TC-PACK-09 | Pity — exclusão de World Cup Hero | Contador de pity nunca força a entrega de uma carta World Cup Hero | 
| TC-PACK-10 | Duplicatas | Sorteio de carta já possuída converte automaticamente em fragmentos, conforme tabela do doc 10 §16, sem criar uma segunda instância jogável |
| TC-PACK-11 | Primeira cópia | A primeira vez que uma carta é sorteada, ela é sempre entregue como carta jogável, nunca convertida em fragmento |

---

## 10. Craft — Casos de Teste

| ID | Cenário | Resultado esperado |
|---|---|---|
| TC-CRAFT-01 | Craft de carta Common | Custo debitado = 50 fragmentos exatamente |
| TC-CRAFT-02 | Craft de carta Rare | Custo debitado = 200 fragmentos |
| TC-CRAFT-03 | Craft de carta Elite | Custo debitado = 600 fragmentos |
| TC-CRAFT-04 | Craft de carta Legendary | Custo debitado = 1.500 fragmentos |
| TC-CRAFT-05 | Craft de carta Ultra | Custo debitado = 4.000 fragmentos |
| TC-CRAFT-06 | Tentativa de craft de World Cup Hero | Operação bloqueada, nenhuma rota possível, sem exceção |
| TC-CRAFT-07 | Tentativa de craft de GOAT | Operação bloqueada, nenhuma rota possível, sem exceção |
| TC-CRAFT-08 | Saldo insuficiente | Tentativa de craft com fragmentos abaixo do custo é rejeitada integralmente, sem débito parcial |
| TC-CRAFT-09 | Saldo negativo | Nenhuma sequência de operações resulta em saldo de fragmentos negativo, sob nenhuma circunstância |
| TC-CRAFT-10 | Alvo já possuído | Tentativa de craftar uma carta que o usuário já possui é bloqueada (craft é exclusivo para preencher lacunas de coleção) |

---

## 11. Mercado — Casos de Teste

| ID | Cenário | Resultado esperado |
|---|---|---|
| TC-MKT-01 | Compra concluída | Carta transferida ao comprador, Créditos debitados, taxa de 5% retida e "queimada" (doc 10 §20) |
| TC-MKT-02 | Venda concluída | Vendedor recebe o valor da venda menos a taxa |
| TC-MKT-03 | Preço abaixo do piso dinâmico | Listagem rejeitada na criação |
| TC-MKT-04 | Preço acima do teto dinâmico | Listagem rejeitada na criação |
| TC-MKT-05 | Cancelamento | Carta retorna ao vendedor sem cobrança de taxa |
| TC-MKT-06 | Limite diário de listagens | Tentativa de exceder o limite por conta é bloqueada |
| TC-MKT-07 | Histórico de preços | Snapshot de preço médio por carta atualizado corretamente a cada transação |
| TC-MKT-08 | Moeda usada | Apenas Créditos ou Fragmentos aceitos; tentativa de listar/comprar com moeda premium é rejeitada |

---

## 12. Economia — Casos de Teste

| ID | Cenário | Resultado esperado |
|---|---|---|
| TC-ECO-01 | Sources registrados | Toda fonte de Créditos/Fragmentos gera evento `economy_*_earned` correspondente (doc 12 §2.7) |
| TC-ECO-02 | Sinks registrados | Toda remoção de moeda gera evento `economy_sink_applied` correspondente |
| TC-ECO-03 | Índice de Inflação | Cálculo `(Sources − Sinks) / TotalEmCirculação` reproduzível a partir dos eventos brutos |
| TC-ECO-04 | Fragmentos — propósito único | Não existe nenhuma rota, direta ou indireta, que converta Fragmentos em moeda premium |
| TC-ECO-05 | Moeda premium — restrição | Moeda premium nunca compra cartas diretamente, apenas pacotes/cosméticos elegíveis |
| TC-ECO-06 | Impossibilidade de arbitragem | Nenhuma sequência de operações legais (comprar pacote → vender cartas obtidas no mercado → recomprar pacote) gera lucro líquido de moeda a partir do nada — a taxa de mercado (5%) e o custo de craft garantem perda líquida esperada em qualquer ciclo fechado |
| TC-ECO-07 | Saldo negativo impossível | Nenhuma operação econômica permite saldo de Créditos, Fragmentos ou moeda premium abaixo de zero |

---

## 13. Hall da Fama — Casos de Teste

| ID | Cenário | Resultado esperado |
|---|---|---|
| TC-HOF-01 | Conquista de coleção | Completar um álbum de seleção dispara a conquista exatamente uma vez, mesmo se o usuário reabrir a tela do álbum múltiplas vezes |
| TC-HOF-02 | Selo exibido | Selo de conquista aparece corretamente na vitrine pessoal após o desbloqueio |
| TC-HOF-03 | GOAT — única rota | Carta GOAT só é concedida via marco de Hall da Fama explicitamente definido — nenhuma rota de pack/craft/troca jamais entrega uma carta GOAT |
| TC-HOF-04 | GOAT — não-tradeable | Tentativa de listar ou trocar uma carta GOAT é bloqueada |
| TC-HOF-05 | Ranking global | Ordenação correta por categoria de prestígio, com critério de desempate definido e consistente |
| TC-HOF-06 | Vitrine pessoal | Limite de 5 cartas fixadas é respeitado; tentativa de fixar uma 6ª é rejeitada ou substitui a mais antiga, conforme regra definida na UX |

---

## 14. Eventos — Casos de Teste

| ID | Cenário | Resultado esperado |
|---|---|---|
| TC-EVT-01 | Início | Pacotes/missões do evento tornam-se disponíveis exatamente no horário programado, nem antes nem depois |
| TC-EVT-02 | Fim | Pacotes do evento deixam de ser compráveis imediatamente após o término |
| TC-EVT-03 | Expiração de cartas Event | Cartas Event tornam-se intradeable apenas durante a janela ativa; após o fim do evento, tornam-se tradeable normalmente (se a política do evento assim definir) |
| TC-EVT-04 | Retorno de evento | Uma rotação futura de evento já anunciado não altera retroativamente registros de posse de quem já obteve a carta na janela original |
| TC-EVT-05 | Missões | Progresso de missão de evento é registrado corretamente e não se perde ao encerrar a sessão no meio de uma partida |
| TC-EVT-06 | Recompensas | Recompensa de missão/evento é entregue exatamente uma vez, mesmo sob nova tentativa de reivindicação (idempotência) |

---

## 15. Social — Casos de Teste

| ID | Cenário | Resultado esperado |
|---|---|---|
| TC-SOC-01 | Troca válida | Ambas as contas confirmam, cartas trocam de mãos atomicamente (nunca um lado recebe sem o outro perder) |
| TC-SOC-02 | Troca de carta não-tradeable | Tentativa envolvendo GOAT ou Event ativo é bloqueada antes da confirmação |
| TC-SOC-03 | Limite diário de trocas | Tentativa de exceder o limite por conta é bloqueada |
| TC-SOC-04 | Amizade | Fluxo de solicitação/aceite/bloqueio funciona nos dois sentidos sem estado inconsistente |
| TC-SOC-05 | Detecção de fraude — farming coordenado | Padrão de trocas repetidas e desbalanceadas entre o mesmo par de contas é sinalizado para Anti-fraude (doc 12 §10) |
| TC-SOC-06 | Contas alternativas | Sinais de múltiplas contas controladas pela mesma origem (dispositivo/rede) trocando recursos entre si são sinalizados, não bloqueados automaticamente sem revisão |

---

## 16. Segurança — Casos de Teste

| ID | Categoria | Cenário | Resultado esperado |
|---|---|---|---|
| TC-SEC-01 | Duplicação | Reenvio duplicado da mesma requisição de craft/abertura de pack | Operação processada exatamente uma vez (idempotência por chave de requisição) |
| TC-SEC-02 | Rollback | Patch revertido após detecção de regressão em produção | Estado restaurado exatamente ao anterior, sem resíduo de dados do patch revertido |
| TC-SEC-03 | Exploit de stacking | Tentativa de reproduzir qualquer combinação dos Casos Extremos (seção 17) | Nenhuma combinação excede os tetos já documentados |
| TC-SEC-04 | Manipulação de mercado | Padrão de wash trading (mesmas contas comprando/vendendo repetidamente entre si) | Detectado e sinalizado dentro de uma janela de monitoramento definida |
| TC-SEC-05 | Bots | Padrão de sessão com timing impossivelmente regular ou atividade ininterrupta 24/7 | Sinalizado para Anti-fraude |
| TC-SEC-06 | Clock tampering | Cliente reporta horário local alterado | Toda janela de tempo relevante (pity, cooldown de troca, expiração de evento) é calculada exclusivamente por horário de servidor, nunca pelo cliente |
| TC-SEC-07 | Race condition | Duas requisições de craft simultâneas, saldo suficiente apenas para uma | Exatamente uma é aceita, a outra rejeitada por saldo insuficiente — nunca as duas aceitas |
| TC-SEC-08 | Replay attack | Requisição válida antiga reenviada fora de ordem/tempo | Rejeitada por verificação de unicidade/janela de validade da requisição |

---

## 17. Casos Extremos

| ID | Cenário | Resultado esperado / Observação |
|---|---|---|
| TC-EXT-01 | 11 Ultras vs. 11 Elite, Ranked | WinrateDelta competitivo ≤ +6pp (doc 11b, Caso 1) |
| TC-EXT-02 | 11 World Cup Hero vs. 11 Elite, Ranked | Mesmo critério, validado no extremo absoluto da escala (doc 11b, Caso 2) |
| TC-EXT-03 | Química perfeita (todos os links +4) | Bônus = +4 exato, nunca mais |
| TC-EXT-04 | Combo máximo (Onze Completo + química perfeita) | Clamp do Orçamento Global em +10 (doc 11b, Caso 6) |
| TC-EXT-05 | 11 cartas em edição Prime | Regra de retorno decrescente por atributo aplicada corretamente quando combinada a trait do mesmo atributo |
| TC-EXT-06 | Todos os 11 titulares com traits no máximo simultaneamente | Nenhum stacking global indevido — cada trait dispara apenas no evento do próprio portador (doc 11b, Caso 4) |
| TC-EXT-07 | Todos os 11 titulares lesionados simultaneamente | **Gap resolvido por `DD-01`** (ver `14-design-decisions-open-issues-master.md` e `15-decision-propagation-master.md`): regra real do futebol adotada — abaixo de 7 jogadores em campo, W.O. técnico. Casos de teste detalhados na nova subseção 17.1 |
| TC-EXT-08 | Fadiga máxima acumulada (calendário congestionado + 90+ minutos) | Atributo efetivo nunca cai abaixo do piso de clamp (1, doc 09 §7); nenhum valor negativo ou indefinido é produzido |
| TC-EXT-09 | Disputa de pênaltis prolongada (morte súbita) | **Gap resolvido por `DD-02`** (ver `14-design-decisions-open-issues-master.md` e `15-decision-propagation-master.md`): teto de 20 rodadas de morte súbita + desempate determinístico via seed. Casos de teste detalhados na nova subseção 17.2 |
| TC-EXT-10 | Temporada inteira simulada de ponta a ponta | Classificação final, promoção/rebaixamento e distribuição de recompensas (doc 06 §3.2) ocorrem corretamente sem intervenção manual |
| TC-EXT-11 | 1.000 partidas em sequência (mesmo par de squads, seeds variando) | Nenhuma falha de execução; distribuição agregada compatível com as metas do doc 11b §8 mesmo em amostra pequena (dentro da margem de erro de ±0,98pp) |
| TC-EXT-12 | 1 milhão de pacotes abertos | Drop rates convergem para os pesos declarados dentro de 0,1pp (doc 11 §14); nenhuma ocorrência indevida de World Cup Hero via pity (TC-PACK-09) |

### 17.1 Casos de Teste — W.O. por Insuficiência de Elenco [DD-01]

| ID | Cenário | Resultado esperado |
|---|---|---|
| TC-WO-01 | Equipe reduzida a exatamente 7 jogadores em campo | Partida continua normalmente — 7 é o piso ainda jogável |
| TC-WO-02 | Equipe reduzida a 6 jogadores em campo | W.O. imediato no minuto exato da ocorrência (doc 09 §12.1); evento `walkover` gerado |
| TC-WO-03 | Partida encerrada por W.O. | Evento corretamente registrado em `match_events` e em `match_walkover` (doc 12, §2.2), com payload completo (`lado_afetado`, `minuto_da_interrupcao`, `jogadores_restantes`, `motivo`) |
| TC-WO-04 | Partida encerrada por W.O. é considerada em análises agregadas de distribuição de placar (doc 11 §16) | Partidas W.O. são **excluídas** do cálculo de distribuição de placares e gols/jogo — são estatisticamente distintas de um resultado "jogado até o fim" e contaminariam a calibração se incluídas |
| TC-WO-05 | Ambas as equipes caem abaixo de 7 jogadores no mesmo evento simulado | **Conhecido/Pendente, não bloqueante** — cenário fora do escopo de `DD-01` conforme aprovada (ver nota de borda em doc 09 §12.1). Não resolvido neste ciclo de sincronização; permanece registrado para eventual futura decisão de design, sem bloquear a Regression Suite (seção 18) |

### 17.2 Casos de Teste — Desempate em Disputa de Pênaltis [DD-02]

| ID | Cenário | Resultado esperado |
|---|---|---|
| TC-PEN-CAP-01 | Disputa de pênaltis chega à 20ª rodada de morte súbita ainda empatada | Desempate determinístico via seed (`penalty_tiebreak_resolved`, doc 09 §20.1) é acionado; nenhuma 21ª cobrança é simulada |
| TC-PEN-CAP-02 | Mesma partida (mesmo seed, mesmo `engine_version`) reexecutada no cenário de TC-PEN-CAP-01 | Resultado do desempate idêntico em 100% das reexecuções |
| TC-PEN-CAP-03 | Replay de uma partida decidida por desempate de seed | Timeline reconstruída reproduz o evento `penalty_tiebreak_resolved` corretamente, sem necessidade de reexecutar o engine |
| TC-PEN-CAP-04 | Simulação em escala de 1M+ disputas de pênalti (doc 11 §14) | Frequência de disputas que atingem a 20ª rodada é extremamente baixa, consistente com a probabilidade teórica esperada de uma sequência tão longa de empates |
| TC-PEN-CAP-05 | Qualquer disputa, em qualquer escala de simulação | Nunca ocorre uma 21ª cobrança simulada de fato — o teto de 20 rodadas é absoluto |

---

## 18. Regression Suite Permanente

**Categorias obrigatórias em todo patch, sem exceção — falha em qualquer uma bloqueia o deploy:**

| Categoria | Testes obrigatórios | Gate |
|---|---|---|
| Reprodutibilidade | TC-REPRO-01 a 05 | Bloqueante |
| Normalização Competitiva | TC-NORM-01 a 05 | Bloqueante |
| Regression Guards de elenco extremo | TC-EXT-01 a 06 (doc 12, §12) | Bloqueante |
| Traits — limites | Todas as colunas "Teste de Limite" da seção 5 | Bloqueante |
| Combos — orçamento de sinergia | TC-COMBO-09 | Bloqueante |
| Economia — arbitragem | TC-ECO-06, TC-ECO-07 | Bloqueante |
| Packs — drop rates | TC-PACK-06 (em escala de pelo menos 100k para iteração, 1M para gate final) | Bloqueante |
| Segurança — idempotência e race conditions | TC-SEC-01, TC-SEC-07, TC-SEC-08 | Bloqueante |
| Métricas globais não-visadas pelo patch | Desvio ≤ ±2% em relação ao baseline pré-patch (doc 11, §13) | Bloqueante |
| W.O. por insuficiência de elenco [DD-01] | TC-WO-01 a TC-WO-04 | Bloqueante (TC-WO-05 permanece não-bloqueante, "Conhecido/Pendente", §17.1) |
| Teto e desempate de disputa de pênaltis [DD-02] | TC-PEN-CAP-01 a TC-PEN-CAP-05 | Bloqueante |

Qualquer patch que falhe em uma categoria bloqueante retorna automaticamente para diagnóstico (doc 11, §25), independentemente da urgência percebida da mudança original.

---

## 19. Critérios de Aprovação por Fase

| Fase | Taxa máxima de bugs aceitável | Taxa de falhas na suíte de testes | Cobertura mínima de regras testadas | Métricas estatísticas exigidas |
|---|---|---|---|---|
| Alpha | Alta tolerância — bugs críticos de gameplay ainda esperados | Até 30% de falhas em testes não-bloqueantes | 60% das regras críticas/altas | Sanity check em escala de 10k (doc 11b §8) |
| Beta | Bugs críticos não-toleráveis; bugs menores aceitáveis | Até 10% de falhas em não-bloqueantes | 85% das regras críticas/altas, 100% das bloqueantes (seção 18) | Validação em escala de 100k |
| Soft Launch | Apenas bugs cosméticos/menores tolerados | 0% de falhas bloqueantes, até 3% em não-bloqueantes | 95% de todas as regras documentadas | Validação em escala de 1M (gate obrigatório) |
| Global Launch | Tolerância zero para bugs críticos/altos | 0% de falhas bloqueantes, até 1% em não-bloqueantes | 100% de regras críticas/altas, 95%+ geral | Auditoria de 10M antes do lançamento (doc 11 §14) |

---

## 20. Roadmap de QA

| Fase | Foco |
|---|---|
| Pré-MVP | Unit e Property Tests sobre as fórmulas isoladas (overall, curva de compressão, xG) — nenhuma integração ainda |
| MVP | Integration Tests do loop principal (pack → coleção → elenco → partida → resultado); início dos testes exploratórios manuais |
| Alpha | Simulation Tests em escala 10k–100k; primeira versão da Regression Suite (seção 18); critérios de aprovação de Alpha (seção 19) |
| Beta | Simulation Tests obrigatórios em 100k–1M; primeira rodada completa de testes de Segurança (seção 16); critérios de Beta |
| Soft Launch | Regression Suite completa obrigatória em todo patch; Auditoria de Casos Extremos (seção 17) mandatória; critérios de Soft Launch |
| Global Launch | Auditorias de 10M (doc 11 §14) antes do lançamento; cobertura 100% de regras críticas; critérios de Global Launch |
| LiveOps | Regressão obrigatória em todo patch sazonal (doc 11 §26); reexecução periódica completa dos Casos Extremos a cada mudança de constante de balanceamento (doc 12 §12) |

---

Com este documento, a cadeia `09` → `10` → `11`/`11b` → `12` → `13` cobre desde a regra de design até o critério de aceitação verificável. As duas lacunas originalmente identificadas na seção 17 (TC-EXT-07 e TC-EXT-09) foram resolvidas via `DD-01` e `DD-02` (ver `14-design-decisions-open-issues-master.md` e `15-decision-propagation-master.md`); o único item residual conhecido é `TC-WO-05`, explicitamente não-bloqueante.

---

**Changelog de sincronização:** Seção 17 (TC-EXT-07, TC-EXT-09, novas subseções 17.1 e 17.2) e Seção 18 (Regression Suite) atualizadas para incorporar `DD-01` e `DD-02`. Nenhum outro caso de teste, critério de aprovação ou fase de roadmap foi alterado. `TC-WO-05` permanece deliberadamente "Conhecido/Pendente, não bloqueante" — nenhuma `DD-03` foi criada. Ver `15.1-sync-report-dd01-dd02.md` para o relatório completo desta sincronização.
