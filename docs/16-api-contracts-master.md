# 16 — API Contracts Master Document (World Legends)

> Especificação pura de contrato — sem código, sem implementação. Transforma toda a documentação de `01` a `15.1` em uma superfície de contrato de dados e operações, para que `apps/web`, `packages/engine` e `packages/db` (doc 01, §5) tenham um acordo único e não-ambíguo antes de qualquer linha de implementação. Os nomes de campo aqui usados são, deliberadamente, os mesmos já fixados em `09`, `12` e `13` — nenhum contrato introduz um nome novo para um conceito já nomeado.

## 1. Objetivo e Princípios de Contrato

Este documento existe para que a tradução de design para implementação não exija reinterpretação. Quatro princípios:

**O servidor é a única fonte de verdade (doc 01, §2).** Todo contrato que envolve regra de jogo, economia ou simulação é uma operação mediada pelo servidor — nenhum contrato aqui descrito é uma escrita direta do cliente em dado de jogo.

**Todo campo aqui especificado já existe em algum documento anterior.** Onde `09-match-engine-master.md` define `lado_afetado`, `minuto_da_interrupcao`, `rodadas_totais`, `desempate_por_seed` (doc 15.1), este documento usa exatamente esses nomes — nunca um sinônimo.

**Toda operação mutável mapeia para pelo menos um evento de telemetria (doc 12, §2).** A Seção 13 deste documento formaliza esse mapeamento explicitamente — uma operação sem evento de telemetria correspondente é considerada contrato incompleto.

**Contratos são versionados por domínio, nunca por operação isolada** (Seção 15) — evita fragmentação de versão que tornaria a manutenção de longo prazo do jogo (doc 11, §26) inviável.

---

## 2. Convenções Gerais

| Convenção | Definição |
|---|---|
| Envelope de resposta | Toda operação retorna `{ data, error, meta: { requestId, timestamp, contractVersion } }` — sucesso e erro nunca coexistem no mesmo envelope |
| Autenticação | Sessão de usuário autenticado (Supabase Auth, doc 01 §5) exigida em toda operação, exceto leitura de Catálogo público (Seção 4) |
| Idempotência | Toda operação que afeta moeda, cartas ou estado de partida exige uma chave de idempotência gerada pelo cliente; o servidor deduplica por `(usuário, chave)` dentro de uma janela de validade (Seção 17; doc 13, TC-SEC-01/07/08) |
| Autorização por papel | Operações de Catálogo/Balanceamento (Seção 14) exigem papel de serviço (`service role`), nunca acessível à sessão padrão do jogador |
| Versionamento | Cada domínio de contrato (Seções 3–14) tem sua própria versão (`v1`, `v2`...), independente de `engine_version` (doc 09 §21) e de `season_id` (doc 02) — três eixos de versionamento que nunca se confundem |
| Erros | Taxonomia padronizada na Seção 18 — nenhuma operação retorna um erro fora dessa taxonomia |

---

## 3. Domínio: Identidade & Social

| Operação | Tipo | Input | Output | Regras |
|---|---|---|---|---|
| `atualizarPerfil` | Mutação | `display_name`, `avatar_url`, `country_code` | Perfil atualizado | Campos sensíveis (`elo_rating`, moedas) nunca editáveis por este contrato |
| `buscarPerfilPublico` | Leitura | `username` ou `profile_id` | Subconjunto público do perfil (doc 02 §2) | Sem autenticação obrigatória para perfis públicos |
| `enviarSolicitacaoAmizade` | Mutação | `addressee_username` | Solicitação criada (`status: pending`) | Bloqueada se já existir solicitação ou bloqueio mútuo |
| `responderSolicitacaoAmizade` | Mutação | `friendship_id`, `resposta` (`accepted`/`blocked`) | Status atualizado | Apenas o `addressee` pode responder |
| `listarAmigos` | Leitura | (nenhum, usa sessão) | Lista de perfis públicos com `status: accepted` | — |

---

## 4. Domínio: Catálogo (leitura pública, somente service role escreve)

| Operação | Tipo | Input | Output | Regras |
|---|---|---|---|---|
| `listarJogadores` | Leitura | filtros (`nationality_code`, `era`, `position`) | Lista de `players` (doc 02 §3) | Cacheável — catálogo muda raramente |
| `buscarJogador` | Leitura | `player_id` | Detalhe de jogador + lista das até 6 `cards` associadas (doc 10 §3) | — |
| `listarCartasPorRaridade` | Leitura | `rarity_code` | Lista de `cards` daquela raridade | — |
| `listarTraits` | Leitura | (nenhum) | Catálogo de traits com descrição mecânica (doc 09 §11, doc 10 §5) | Não expõe os tetos numéricos internos de balanceamento (doc 11) — apenas a descrição funcional voltada ao jogador |
| `listarCombosLendarios` | Leitura | (nenhum) | Catálogo de combos disponíveis e cartas exigidas (doc 10 §8) | — |

---

## 5. Domínio: Coleção & Elenco

| Operação | Tipo | Input | Output | Regras |
|---|---|---|---|---|
| `listarMinhasCartas` | Leitura | filtros (`posicao`, `raridade`, `nacao`, `lesionada`) | Lista de `user_cards` + dados de `cards`/`players` | Restrito a `auth.uid() = profile_id` (doc 02 §8) |
| `criarElenco` | Mutação | `nome`, `formacao` | Novo `squad` vazio | — |
| `atualizarElenco` | Mutação | `squad_id`, `formacao`, `slots[]`, `capitao_user_card_id` | Elenco atualizado, `chemistry_score` recalculado (doc 09 §4) | Rejeita slots com `user_card_id` lesionado/suspenso (doc 09 §12.1/§10) |
| `validarEscalacao` | Leitura (cálculo) | `squad_id` | Lista de problemas bloqueantes (menos de 11 titulares válidos, jogador suspenso escalado) | Chamado antes de iniciar qualquer partida — nunca a simulação valida isso silenciosamente |
| `fixarNaVitrine` | Mutação | `user_card_id`, `posicao_na_vitrine` (1–5) | Vitrine atualizada | Limite de 5 cartas fixadas (doc 13, TC-HOF-06) |

---

## 6. Domínio: Packs, Craft & Fragmentos

| Operação | Tipo | Input | Output | Regras |
|---|---|---|---|---|
| `listarPacotesDisponiveis` | Leitura | (nenhum) | Lista de `packs` ativos com preço e garantias (doc 10 §14) | Pacotes de evento só aparecem durante a janela ativa (doc 13, TC-EVT-01) |
| `abrirPacote` | Mutação, idempotente | `pack_id`, `chave_idempotencia` | Lista de cartas reveladas + duplicatas convertidas em fragmentos | Débito de moeda e geração de cartas são atômicos (doc 13, TC-PACK-10/11) |
| `consultarSaldoFragmentos` | Leitura | (nenhum) | Saldo atual | — |
| `solicitarCraft` | Mutação, idempotente | `card_id` alvo, `chave_idempotencia` | Carta entregue, fragmentos debitados | Bloqueado para World Cup Hero/GOAT (doc 13, TC-CRAFT-06/07); rejeitado integralmente se saldo insuficiente (TC-CRAFT-08) |
| `consultarHistoricoDeAberturas` | Leitura | paginação | Lista de `pack_openings` do usuário | — |

---

## 7. Domínio: Partidas & Match Engine

| Operação | Tipo | Input | Output | Regras |
|---|---|---|---|---|
| `simularPartidaAmistosa` | Mutação | `squad_id` próprio, `oponente` (IA ou squad de amigo) | `match_id`, processado de forma síncrona ou enfileirado conforme carga | Sempre roda no servidor com `rng_seed` gerado e persistido (doc 09 §21) |
| `buscarPartida` | Leitura | `match_id` | `homeScore`, `awayScore`, `status` (`scheduled`/`simulated`/`walkover`/`disputed`), `penaltyShootout` (com `rodadas_totais`, `desempate_por_seed` — doc 15.1) | Campos de W.O./pênaltis presentes apenas quando aplicável |
| `buscarEventosDaPartida` | Leitura, paginada | `match_id` | Lista ordenada de `match_events`, incluindo `walkover` e `penalty_tiebreak_resolved` quando existirem (doc 09 §12.1/§20.1) | Esta é a fonte de dados do Replay (doc 09 §22) — nenhuma resimulação necessária para esta leitura |
| `buscarEstatisticasDaPartida` | Leitura | `match_id` | `MatchStats` (doc 09 §24) | Partidas `walkover` retornam estatísticas parciais marcadas como tal (doc 13, TC-WO-04) |
| `resimularPartida` (uso interno/auditoria) | Mutação, restrita a service role | `match_id` | Resultado recomputado a partir do `rng_seed` e `engine_version` originais | Usado apenas para auditoria/disputa (doc 09 §22) — nunca substitui o resultado oficial já gravado |

---

## 8. Domínio: Multiplayer (Ligas e Draft)

| Operação | Tipo | Input | Output | Regras |
|---|---|---|---|---|
| `criarLiga` | Mutação | `nome`, `type`, `format`, `max_members` | Liga criada + `invite_code` | — |
| `entrarNaLigaViaCodigo` | Mutação | `invite_code` | Membro adicionado | Rejeitado se liga cheia ou já em `in_progress` |
| `iniciarDraft` | Mutação + broadcast Realtime | `league_id` | Estado inicial do draft transmitido a todos os membros | Apenas o owner da liga pode iniciar (doc 03 §3.3) |
| `realizarPick` | Mutação + broadcast Realtime, idempotente | `league_id`, `card_id` | Pick confirmado, broadcast a todos | Validado contra turno atual e disponibilidade no pool (doc 03 §3.3) |
| `buscarEstadoDoDraft` | Leitura | `league_id` | Snapshot atual do draft | Usado para reconexão sem perda de estado |
| `buscarClassificacaoDaLiga` | Leitura | `league_id` | Tabela de `league_members` ordenada | — |
| `buscarCalendarioDeRodadas` | Leitura | `league_id` | Lista de `league_rounds` e `matches` associadas | — |

---

## 9. Domínio: Ranking & Temporadas

| Operação | Tipo | Input | Output | Regras |
|---|---|---|---|---|
| `solicitarPartidaRanqueada` | Mutação | (nenhum, usa squad ativo do usuário) | `match_id` ou status de fila | Aplica Normalização Competitiva (doc 11 §10) na simulação resultante |
| `buscarRankingAtual` | Leitura | `division` (opcional) | Lista de `rankings` da temporada vigente | — |
| `buscarHistoricoDeTemporadas` | Leitura | (nenhum, usa sessão) | Lista de temporadas passadas e posição final do usuário | — |
| `buscarPosicaoDoUsuario` | Leitura | (nenhum, usa sessão) | Posição, `elo_rating`, divisão atual | — |

---

## 10. Domínio: Mercado & Trocas

| Operação | Tipo | Input | Output | Regras |
|---|---|---|---|---|
| `listarCartaNoMercado` | Mutação | `user_card_id`, `preco` | Listagem criada | Rejeitada se fora da faixa dinâmica de preço (doc 13, TC-MKT-03/04) |
| `comprarDoMercado` | Mutação, idempotente | `listing_id`, `chave_idempotencia` | Carta transferida, taxa de 5% aplicada (doc 10 §20) | — |
| `cancelarListagem` | Mutação | `listing_id` | Carta retorna ao vendedor | Sem cobrança de taxa (doc 13, TC-MKT-05) |
| `consultarHistoricoDePrecos` | Leitura | `card_id` | Série de preços médios por janela | — |
| `proporTroca` | Mutação | `card_id_oferecido`, `card_id_desejado`, `amigo_id` | Proposta criada | Bloqueada para cartas não-tradeable (GOAT, Event ativo — doc 13, TC-SOC-02) |
| `responderTroca` | Mutação | `trade_id`, `resposta` | Troca executada atomicamente ou recusada | Confirmação dupla obrigatória (doc 10 §19) |
| `consultarLimitesDiarios` | Leitura | (nenhum, usa sessão) | Contagem de trocas/listagens já usadas no dia | — |

---

## 11. Domínio: Hall da Fama & Conquistas

| Operação | Tipo | Input | Output | Regras |
|---|---|---|---|---|
| `listarConquistas` | Leitura | (nenhum) | Catálogo de conquistas disponíveis | — |
| `buscarProgressoDeConquista` | Leitura | `achievement_id` (opcional) | Progresso do usuário | — |
| `buscarRankingGlobalDePrestigio` | Leitura | `categoria` | Lista ordenada por categoria (doc 10 §21) | Apenas prestígio — nenhum dado aqui concede vantagem competitiva |
| `buscarVitrinePublica` | Leitura | `profile_id` | As até 5 cartas fixadas daquele perfil | — |

---

## 12. Domínio: Eventos (LiveOps)

| Operação | Tipo | Input | Output | Regras |
|---|---|---|---|---|
| `listarEventosAtivos` | Leitura | (nenhum) | Eventos com janela ativa no momento | Calculado por horário de servidor, nunca pelo cliente (doc 13, TC-SEC-06) |
| `buscarMissaoDeEvento` | Leitura | `event_id` | Progresso de missões do usuário naquele evento | — |
| `reivindicarRecompensaDeEvento` | Mutação, idempotente | `mission_id`, `chave_idempotencia` | Recompensa entregue exatamente uma vez | Doc 13, TC-EVT-06 |

---

## 13. Domínio: Telemetria — Contrato de Emissão

Telemetria não é uma API que o cliente chama diretamente em sua maioria — é uma **obrigação de emissão** vinculada a cada operação mutável acima. Tabela de mapeamento (parcial, ilustrativa do princípio — mapeamento completo deriva diretamente do catálogo do doc 12, §2):

| Operação (Seções 3–12) | Evento(s) de telemetria obrigatórios (doc 12) |
|---|---|
| `abrirPacote` | `pack_opened`, `pack_pity_triggered` (se aplicável), `card_duplicate_converted` (se aplicável) |
| `solicitarCraft` | `card_crafted`, `economy_fragments_spent` |
| `simularPartidaAmistosa` / processamento de rodada de liga | `match_started`, `match_ended`, `match_walkover` (se aplicável), `match_penalty_shootout` (se aplicável), `engine_*` (doc 12 §2.3) |
| `comprarDoMercado` | `market_listing_purchased`, `economy_credits_spent`, `economy_sink_applied` |
| `proporTroca` / `responderTroca` | `card_traded` |
| `reivindicarRecompensaDeEvento` | evento de recompensa de missão (doc 12 §2, categoria Eventos) |

Nenhuma operação mutável é considerada "contrato completo" sem sua linha correspondente nesta tabela de mapeamento.

---

## 14. Contratos Internos (Service Role / Balanceamento)

| Operação | Tipo | Input | Output | Regras |
|---|---|---|---|---|
| `aplicarCompetitiveModifier` | Mutação, service role | Estrutura de modifier (doc 11 §11) | Modifier ativado/atualizado | Nunca edita a carta histórica original (doc 11 §11) |
| `executarSimulacaoEmMassa` | Job, service role | Configuração de escala (10k/100k/1M/10M — doc 11 §14) | Relatório agregado de métricas | Usado pelo pipeline de patch (doc 11 §25) |
| `executarRegressionGuards` | Job, service role | `engine_version` candidata | Resultado dos 7+9 cenários obrigatórios (doc 12 §12, doc 13 §18) | Bloqueante — qualquer falha impede publicação do patch |
| `publicarBalancePatch` | Mutação, service role | `engine_version` aprovada, notas de patch | Patch publicado, `engine_version` incrementada | Exige aprovação prévia registrada (doc 11 §25, etapa de gate) |
| `gerenciarCatalogoDeCartas` | Mutação, service role | Dados de `players`/`cards` (seed ou correção) | Catálogo atualizado | Nunca altera `user_cards` já possuídas — apenas o catálogo (doc 10 §2) |

---

## 15. Versionamento e Compatibilidade

Três eixos de versão, independentes entre si e nunca confundidos:

| Eixo | O que versiona | Onde vive |
|---|---|---|
| `contractVersion` | A forma do contrato de API em si (campos, operações) | Envelope de resposta (Seção 2) |
| `engine_version` | As regras de simulação do Match Engine | `matches.engine_version` (doc 02, doc 09 §21) |
| `season_id` | O ciclo competitivo vigente (Ranked, Tier List) | `matches.league_round_id` → `league` → `season_id` |

Uma mudança em `engine_version` nunca exige uma mudança em `contractVersion` a menos que o **formato dos dados retornados** mude (ex: a adição de `rodadas_totais`/`desempate_por_seed` ao payload de `buscarPartida`, doc 15.1, é uma mudança de `contractVersion` aditiva e compatível — campos novos opcionais, nunca removendo ou renomeando campos existentes).

---

## 16. Segurança, Autorização e RLS

Mapeamento direto às diretrizes de RLS já fixadas em `02-modelagem-banco-dados.md`, §8:

| Categoria de contrato | Nível de acesso |
|---|---|
| Leitura de Catálogo (Seção 4) | Pública, sem necessidade de sessão |
| Leitura/escrita de Coleção e Elenco (Seção 5) | Sessão do próprio usuário (`auth.uid() = profile_id`) |
| Simulação de partida, abertura de pacote, craft (Seções 6–7) | Sessão do usuário para iniciar a operação, mas a **execução da regra de negócio** (débito de moeda, geração de carta, simulação) roda sob `service role`, nunca como escrita direta do cliente |
| Mercado e trocas (Seção 10) | Sessão do usuário, com validações de elegibilidade aplicadas no servidor antes de qualquer transferência |
| Contratos internos (Seção 14) | Exclusivamente `service role` — nunca exposto a sessão de jogador, mesmo administrador, através da mesma superfície de contrato do jogo |

---

## 17. Idempotência e Concorrência

Toda operação marcada "idempotente" nas tabelas anteriores segue o mesmo contrato:

| Regra | Comportamento |
|---|---|
| Chave de idempotência | Gerada pelo cliente, única por tentativa lógica da operação (não por retry automático) |
| Deduplicação | O servidor reconhece uma chave já processada e retorna o resultado original, sem reprocessar (doc 13, TC-SEC-01) |
| Janela de validade | Chaves expiram após um período definido — reuso fora da janela é tratado como nova operação, nunca como replay válido de uma operação antiga (doc 13, TC-SEC-08) |
| Concorrência | Duas requisições simultâneas com saldo suficiente apenas para uma resultam em exatamente uma aceita, garantido por verificação atômica no servidor (doc 13, TC-SEC-07) |

---

## 18. Taxonomia de Erros

| Código | Significado | Contratos onde aparece tipicamente |
|---|---|---|
| `UNAUTHORIZED` | Sessão ausente ou inválida | Qualquer operação não-pública |
| `VALIDATION_ERROR` | Input fora do formato/regra esperada | Qualquer mutação |
| `INSUFFICIENT_BALANCE` | Moeda/fragmentos insuficientes | `abrirPacote`, `solicitarCraft`, `comprarDoMercado` |
| `NOT_TRADEABLE` | Carta fora de regra de troca/mercado (GOAT, Event ativo) | `proporTroca`, `listarCartaNoMercado` |
| `ALREADY_OWNED` | Tentativa de craft de carta já possuída | `solicitarCraft` |
| `RATE_LIMITED` | Limite diário/de frequência excedido | `proporTroca`, `listarCartaNoMercado` |
| `IDEMPOTENT_REPLAY` | Chave de idempotência já processada — resultado original retornado, não um erro de fato | Todas as operações idempotentes |
| `CONCURRENT_CONFLICT` | Disputa de concorrência resolvida contra esta requisição | `solicitarCraft`, `comprarDoMercado` |
| `NOT_FOUND` | Recurso inexistente ou fora do escopo de acesso do usuário | Qualquer leitura por ID |
| `COMPETITION_RULE_VIOLATION` | Escalação invalida regra de partida (lesão/suspensão escalada, menos de 11 válidos) | `atualizarElenco`, `validarEscalacao` |

---

## 19. Matriz de Rastreabilidade Documento → Contrato

| Documento de origem | Seções deste documento que o expõem como contrato |
|---|---|
| `02` (Modelagem de Dados) | Seções 3–12 (toda entidade de banco tem ao menos uma operação de leitura/escrita correspondente) |
| `04`/`10` (Cartas, Raridade, Economia) | Seções 4, 5, 6, 10, 11 |
| `06` (Multiplayer, Ranking) | Seções 8, 9 |
| `07` (Packs e Colecionismo) | Seção 6 |
| `09` (Match Engine) | Seção 7, com mapeamento de campo exato para `walkover`/`penalty_tiebreak_resolved` (doc 15.1) |
| `11`/`11b` (Balanceamento) | Seção 14 (contratos internos) |
| `12` (Telemetria) | Seção 13 (contrato de emissão) |
| `13` (QA) | Seção 17 (idempotência/concorrência diretamente testável via TC-SEC-*), Seção 18 (taxonomia de erro testável) |
| `14`/`15`/`15.1` (Decisões e Propagação) | Seção 7 — únicos campos de contrato nascidos de uma decisão de design explícita, não de uma feature original |

---

Este documento fecha o ciclo completo de design-para-contrato de World Legends: toda regra de jogo, sistema de cartas, balanceamento, telemetria e processo de QA agora tem uma superfície de operação correspondente, sem que uma linha de implementação tenha sido escrita. O próximo passo natural é a estrutura de pastas e os primeiros arquivos reais de `packages/db` (tipos gerados, repositórios) e `packages/engine` (a primeira função pura testável, `calcularOverall`) — quer começar por aí?
