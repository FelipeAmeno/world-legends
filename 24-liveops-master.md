# World Legends — Live Ops Master
### Documento 24 · Versão 1.0 · Julho 2026

> **Propósito:** Plano completo de operações ao vivo — 5 anos de eventos, calendários, missões temporárias, cartas limitadas e ranking.  
> **Escopo:** Cadência de eventos, estrutura de Copa, eventos sazonais, calendário anual, métricas de engajamento.  
> **Nota:** Documento de design — não implementação.

---

## ÍNDICE

1. [Filosofia de Live Ops](#1-filosofia-de-live-ops)
2. [Cadência Semanal e Mensal](#2-cadência-semanal-e-mensal)
3. [Eventos de Copa Histórica](#3-eventos-de-copa-histórica)
4. [Eventos por Seleção Nacional](#4-eventos-por-seleção-nacional)
5. [Eventos Sazonais](#5-eventos-sazonais)
6. [Eventos Especiais e Surpresas](#6-eventos-especiais-e-surpresas)
7. [Missões Temporárias](#7-missões-temporárias)
8. [Cartas Temporárias e Limitadas](#8-cartas-temporárias-e-limitadas)
9. [Rankings e Temporadas](#9-rankings-e-temporadas)
10. [Calendário Anual — 5 Anos](#10-calendário-anual--5-anos)
11. [Métricas e KPIs de Live Ops](#11-métricas-e-kpis-de-live-ops)

---

## 1. FILOSOFIA DE LIVE OPS

### 1.1 O Mundo Nunca Para

O World Legends não é um jogo que você instala e esquece. É um mundo vivo que evolui semana a semana.

**A promessa:**
- Toda semana: algo novo para fazer
- Todo mês: algo grande acontecendo
- Todo trimestre: um evento histórico que para a comunidade
- Todo ano: uma Copa de referência como evento âncora

---

### 1.2 Tipos de Conteúdo Live Ops

**Permanente:** Catálogo base, modos de jogo padrão, ranking de divisão.

**Rotacional (volta toda temporada):** Eventos sazonais (Natal, Copa real), passe de temporada mensal.

**Limitado (nunca volta igual):** Eventos de Copa histórica, cartas "Hero Moment", missões de rivalidade.

**Único (one-time):** Eventos de lançamento, aniversários especiais, marcos comunitários.

---

### 1.3 Princípio FOMO Controlado

O FOMO (Fear of Missing Out) é uma ferramenta de engajamento — mas mal usado, vira frustração e churn.

**FOMO Saudável:**
- "Se eu jogar este mês, posso ter a carta do Romário da Copa 1994"
- O jogador sabe que a carta volta em uma forma diferente (não idêntica) na próxima vez

**FOMO Tóxico (evitar):**
- "Se não pagar agora, nunca mais vai ter essa carta"
- Pressão de tempo artificial em coisas essenciais ao jogo

**Regra:** Cartas de gameplay essencial nunca são exclusivas de evento. Cartas de evento são skins especiais ou variantes — não as únicas versões de um jogador.

---

### 1.4 Storytelling em Eventos

Cada evento conta uma história. Não é só "jogue X partidas para ganhar Y". É:

"Em 25 de junho de 1986, Diego Maradona marcou dois dos gols mais lendários da história da Copa do Mundo. Reviva o Clássico da Lenda. Monte o squad da Argentina de 1986. Dispute a Copa 1986. Conquiste a carta de Maradona — Copa 1986."

O contexto histórico é a diferença entre um evento genérico e um evento que as pessoas recomendam para os amigos.

---

## 2. CADÊNCIA SEMANAL E MENSAL

### 2.1 Ritmo Semanal

**Segunda-feira:**
- Missões semanais renovam
- Ranking semanal fecha (resultados do torneio)
- Novo evento semanal começa (se aplicável)
- Notificação: "Nova semana, novas lendas"

**Quarta-feira:**
- Meio da semana: lembrete de progresso de missões
- Mini-evento de 24h (se planejado): "Quarta Lendária" com boost de drops

**Sexta-feira:**
- Início do evento de fim de semana (se houver)
- Boost de créditos por partidas (+20%)
- Notificação: "O fim de semana é para jogar"

**Domingo:**
- Ranking fecha de manhã (às 12:00 UTC-3)
- Recompensas de ranking enviadas
- Preview do que vem na próxima semana

---

### 2.2 Ritmo Mensal (Temporada)

**Dia 1 da Temporada:**
- Nova temporada começa
- Passe de Temporada disponível para compra
- Tema da temporada anunciado
- Evento de abertura: mini-pack especial gratuito para todos

**Dia 7:**
- Milestone do Login Diário: Starter Pack grátis
- Primeira missão semanal da temporada já disponível há uma semana

**Dia 14:**
- Milestone do Login Diário: Country Pack
- Meio da temporada: preview das recompensas do D28

**Dia 21:**
- Milestone crítico: Lendário Pack
- "Sprint Final" começa: jogadores que ainda não completaram missões mensais têm 9 dias

**Dia 28:**
- Ultra Pack (maior recompensa de login)
- Notificação de urgência: "2 dias para o fim da temporada"

**Dia 30:**
- Temporada fecha às 23:59
- Recompensas finais distribuídas
- Preview da próxima temporada
- Carta exclusiva do D30 desbloqueada para quem chegou lá

---

### 2.3 Torneio Semanal

**Formato:** Torneio de eliminatória rápida, aberto a todos os jogadores.

**Estrutura:**
```
Inscrições: Segunda a Quarta (gratuito)
Fase 1: Quinta e Sexta — partidas de classificação (mínimo 5 partidas)
Fase Final: Sábado e Domingo — top 100 jogadores disputam eliminatória

Premiação:
  1º lugar: Ultra Pack + Emblema da Semana + 500 créditos
  Top 3: Lendário Pack + 300 créditos
  Top 10: Standard Pack + 200 créditos
  Top 50: Starter Pack + 100 créditos
  Top 100: Mini Pack + 50 créditos
  Participação (5+ partidas): 50 créditos
```

---

## 3. EVENTOS DE COPA HISTÓRICA

### 3.1 Estrutura Padrão

Todo evento de Copa Histórica segue a mesma estrutura de 21 dias:

```
Semana 1 — "Fase de Grupos" (D1-D7)
  Tema: fase de grupos histórica
  Missões: usar cartas do país-tema
  Drops: cartas comuns/raras do evento
  Recompensa principal: Carta Elite exclusiva do evento

Semana 2 — "As Semifinais" (D8-D14)
  Tema: jogos mata-mata históricos
  Missões: squads temáticos específicos
  Drops: cartas Elite/Legendary do evento
  Recompensa principal: Carta Legendary exclusiva

Semana 3 — "A Final" (D15-D21)
  Tema: a final histórica
  Missões: disputar "A Copa" — torneio especial do evento
  Drops: Cartas Ultra/WCH do evento
  Recompensa final: Carta WCH (conquistável por rank alto)

Ranking do Evento:
  Top 5%: Carta WCH do evento + emblema
  Top 15%: Ultra Pack
  Top 30%: Lendário Pack
  Top 50%: Starter Pack
  Participação (qualquer missão): Mini Pack
```

---

### 3.2 Copa 1930 — "O Começo de Tudo"

**País-tema:** Uruguai / Argentina
**Duração:** 21 dias
**Carta Final:** José Nasazzi (WCH, Uruguai, Copa 1930)
**Carta Bônus:** Guillermo Stábile (Elite, Argentina) — artilheiro da Copa

**Missões Especiais:**
- "Monte o squad do Uruguai 1930 com ao menos 5 cartas uruguaias"
- "Vença 5 partidas com cartas da era 1930" (qualquer país)

**Contexto Narrativo:**
"Era 30 de julho de 1930. Montevidéu. O primeiro gol da história da Copa do Mundo estava prestes a ser marcado. O futebol nunca seria o mesmo."

---

### 3.3 Copa 1950 — "O Maracanazo"

**País-tema:** Uruguai vs Brasil
**Duração:** 21 dias
**Carta Final:** Alcides Ghiggia (WCH, Uruguai, Copa 1950) — marcou o gol que silenciou o Maracanã
**Carta Bônus:** Obdulio Varela (WCH, Uruguai) — capitão

**Missões Especiais:**
- "Evento de Rivalidade: Brasil vs Uruguai — escolha um lado"
- "Monte o squad do Brasil 1950 com Ademir como titular"
- Missão Final: "Dispute A Final de 1950 — Brasil vs Uruguai em modo especial"

**Contexto Narrativo:**
"16 de julho de 1950. 199.854 pessoas no Maracanã. O Brasil precisava de um empate para ser campeão. O silêncio que se seguiu ao gol de Ghiggia ficou na história como o momento mais doloroso do futebol brasileiro."

---

### 3.4 Copa 1958 — "O Rei Nasce"

**País-tema:** Brasil
**Duração:** 21 dias
**Carta Final:** Pelé 1958 (WCH — edição jovem, 17 anos)
**Carta Bônus:** Garrincha (Ultra, Copa 1958)

**Missões:**
- "Use Pelé em 10 partidas esta semana"
- "Monte o ataque histórico: Pelé + Garrincha + Zagallo"

---

### 3.5 Copa 1966 — "A Geração de Eusébio"

**País-tema:** Portugal
**Duração:** 21 dias
**Carta Final:** Eusébio 1966 (WCH — artilheiro, 9 gols)
**Carta Bônus:** José Torres (Elite, Portugal)

**Contexto:** "9 gols. Uma Copa. Um homem. Eusébio de Moçambique transformou Portugal em potência do futebol em um único torneio."

---

### 3.6 Copa 1970 — "A Copa dos Deuses"

**País-tema:** Brasil
**Duração:** 21 dias — o evento mais longo e premiado
**Carta Final:** Carlos Alberto Torres (WCH — "O Capitão da Copa dos Deuses")
**Cartas Bônus:**
- Jairzinho (WCH — marcou em TODOS os jogos)
- Tostão (Ultra)
- Rivelino (Elite)
- Clodoaldo (Elite)

**Missões Especiais:**
- "Jairzinho Challenge: use Jairzinho em 7 jogos e vença todos" → Elite exclusiva
- "O Brasil de 70: escale os 11 titulares da final de 1970" → Bonus XP
- "A Final: dispute o modo 'Brasil 1970 vs Itália 1970'" → Carta WCH

**É o maior evento do ano.** Estádio lotado, sons de torcida, arte especial de estádio do México.

---

### 3.7 Copa 1974 — "Total Football"

**País-tema:** Holanda / Alemanha
**Carta Final:** Johan Cruyff 1974 (GOAT — edição especial da Copa 1974)
**Nota:** Esta seria a única vez em que um jogador GOAT tem uma carta de evento — Cruyff Copa 1974 é tão icônica que merece edição única.

---

### 3.8 Copa 1982 — "O Brasil que Não Ganhou"

**País-tema:** Brasil
**Duração:** 21 dias
**Carta Final:** Sócrates (WCH — ícone da derrota gloriosa)
**Carta Bônus:** Falcão (Ultra, 1982), Zico (Ultra, 1982)

**Contexto:** "Às vezes, o time mais bonito não ganha. O Brasil de 1982 perdeu para a Itália. Mas ficou na memória do futebol como o mais completo da história."

---

### 3.9 Copa 1986 — "A Copa de Maradona"

**País-tema:** Argentina
**Carta Final:** Maradona 1986 (GOAT — edição especial Copa 1986, arte do Gol do Século)
**Carta Bônus:** Jorge Valdano (Elite), Jorge Burruchaga (Elite)

**Modo Especial:** "Reviva o Gol do Século" — partida especial onde o jogador controla Maradona dribblando 5 adversários.

---

### 3.10 Copa 1994 — "O Tetra"

**País-tema:** Brasil
**Carta Final:** Romário (WCH, 1994, "O Baixinho do Tetra")
**Carta Bônus:** Bebeto (Ultra, 1994), Aldair (Elite, 1994), Mauro Silva (Elite)

---

### 3.11 Copa 1998 — "A Copa de Zidane"

**País-tema:** França
**Carta Final:** Zinedine Zidane 1998 (GOAT — edição Copa 1998, 2 gols na final)
**Carta Bônus:** Roberto Baggio (WCH — pênalti 1994 e herói 1998)

---

### 3.12 Copa 2002 — "O Penta"

**País-tema:** Brasil
**Carta Final:** Ronaldo Fenômeno 2002 (GOAT — edição Copa 2002, 2 gols na final)
**Carta Bônus:** Kaká 2002 (Legendary — era jovem, mas presente), Ronaldinho 2002 (Ultra)

---

### 3.13 Copa 2010 — "Gol de Iniesta"

**País-tema:** Espanha
**Carta Final:** Andrés Iniesta 2010 (WCH — gol na final, Copa 2010)
**Carta Bônus:** Xavi 2010 (Ultra), David Villa 2010 (Legendary)

---

### 3.14 Copa 2014 — "O 7-1"

**País-tema:** Alemanha
**Duração:** 21 dias com duas perspectivas — Alemanha (vencedora) e Brasil (a derrota)
**Carta Final:** Toni Kroos 2014 (Legendary — 2 gols em 2 minutos na semifinal)
**Carta da Derrota:** Carta especial de David Luiz 2014 (Elite — arte emocional)

**Evento Único:** Duas missões paralelas — jogadores escolhem o lado. Quem completar as missões de ambos os lados recebe bônus especial.

---

### 3.15 Copa 2022 — "Messi Campeão"

**País-tema:** Argentina
**Carta Final:** Lionel Messi 2022 (GOAT — Estrelas Atuais, Copa 2022)
**Carta Bônus:** Mbappé 2022 (WCH — hat-trick na final), Emi Martínez (WCH)

---

## 4. EVENTOS POR SELEÇÃO NACIONAL

Eventos focados em uma única seleção, sem Copa específica. Celebram a história completa do país.

### 4.1 "Semana do Brasil" (Setembro — mês do aniversário da independência)

**Duração:** 7 dias
**Foco:** Todas as Copas, todos os ídolos brasileiros
**Missões:**
- Use apenas jogadores brasileiros por 3 dias
- Forme o "All-Time Brasil" com as melhores cartas de cada posição
**Pack Especial:** "Seleção Canarinha" — 5 cartas garantidas brasileiras, sendo 1 Legendary+
**Recompensa Final:** Carta exclusiva "Brasil 5x" com os 5 troféus

---

### 4.2 "La Albiceleste" (Evento Argentina)

**Duração:** 7 dias
**Foco:** Maradona, Messi, a rivalidade com o Brasil
**Pack Especial:** "La Albiceleste" — cartas argentinas

---

### 4.3 "A Máquina Alemã" (Evento Alemanha)

**Duração:** 7 dias
**Foco:** Beckenbauer, Müller, Matthäus, Lahm, Kroos, a Copa 2014

---

### 4.4 "Les Bleus" (Evento França)

**Duração:** 7 dias
**Foco:** Platini, Zidane, Henry, Mbappé
**Especial:** Evento "1998 vs 2018" — dois campeões, um evento

---

### 4.5 "La Roja" (Evento Espanha)

**Duração:** 7 dias
**Foco:** Copa 2010, Xavi, Iniesta, David Villa, o tiki-taka
**Bônus:** Pack com garantia de carta da Copa 2010

---

### 4.6 "Gli Azzurri" (Evento Itália)

**Duração:** 7 dias
**Foco:** Mazzola, Baggio, Cannavaro, Totti

---

### 4.7 "Oranje" (Evento Holanda)

**Duração:** 7 dias
**Foco:** Cruyff, Gullit, Van Basten, Seedorf, o futebol total

---

## 5. EVENTOS SAZONAIS

### 5.1 Natal e Fim de Ano (20 de Dezembro — 2 de Janeiro)

**Duração:** 14 dias
**Nome:** "Presentes das Lendas"

**Atividades:**
- Calendário do Advento: 14 janelas, uma recompensa por dia
- Pack de Natal exclusivo: cartas com arte de neve/inverno/estrelas
- Modo "Troca de Presentes": sistema de gifting entre amigos
- Missão Especial: "Monte o squad dos sonhos de Natal" (qualquer combinação de 11 lendas)
- Competição de Squad Visual: comunidade vota nos squads mais criativos

**Recompensas Exclusivas:**
- Carta de Natal: jogador com arte especial de inverno (muda todo ano)
- Emblema "World Legends 202X" para quem completar o calendário
- Moldura de perfil temática

**Cartas com Arte Sazonal:**
Variantes visuais de cartas existentes com backgrounds de neve e estrelas. Mesmas stats, arte diferente. Não coletáveis novamente (únicas por ano).

---

### 5.2 Carnaval (5 dias antes do Carnaval)

**Duração:** 5 dias
**Nome:** "Seleção do Carnaval"

**Atividades:**
- Foco total no Brasil
- Pack "Canarinha de Carnaval": cartas brasileiras com arte colorida de carnaval
- Competição: "Escola de Samba" — squads por estado (SP, RJ, MG, etc.) competem coletivamente
- Missão: use ao menos 7 jogadores brasileiros em todas as partidas

**Recompensa:** Carta do Rei do Carnaval — um ícone brasileiro com arte de carnaval.

---

### 5.3 Copa do Mundo Real (Anos de Copa: 2026, 2030, 2034)

**Duração:** Todo o torneio (~1 mês)
**Nome:** "Copa ao Vivo"

**Como funciona:**
- O evento acompanha em tempo real a Copa real
- Quando um país é eliminado, as missões daquele país terminam
- Quando um país avança, bônus de packs para quem tem cartas do país

**Mecânica de Predição:**
- Antes de cada jogo, jogadores "apostam" (com créditos, sem dinheiro real) no resultado
- Quem acertar ganha bônus de créditos

**Cartas ao Vivo:**
- A cada grande gol da Copa real, uma carta temporária de 24h entra no jogo
- Exemplo: "Mbappé vs Argentina — Copa 2022" — carta por 24h após o hat-trick

**Recompensa Final:**
- Quem tiver o squad do país campeão na Copa real ao fim do torneio: Ultra Pack exclusivo

---

### 5.4 Aniversário do World Legends (Mês de Lançamento)

**Duração:** 7 dias
**Nome:** "Aniversário das Lendas"

**Atividades:**
- Pacote de aniversário gratuito para todos os jogadores
- Galeria de todos os eventos passados disponível para ver
- Modo "Melhor de [N] Anos" — veja as cartas mais abertas, mais colecionadas
- Pack especial "Aniversário" com 10 cartas garantidas (edição única)
- Carta comemorativa "World Legends [Ano]" — não reproduzida

**Recompensa dos Veteranos:**
- Quem estava presente no primeiro mês do jogo recebe emblema "Fundador" permanente
- Quem tem 1 ano de conta recebe carta "Veterano Ano 1" (Legendary exclusiva)

---

### 5.5 Copa Libertadores (Futuro — v3+)

**Status:** Planejado para Ano 3 se a licença for possível.

Evento focado em clubes sul-americanos e seus ídolos históricos. Abre o jogo para um segmento novo (torcedores de clube além de seleção).

---

### 5.6 UEFA Champions League Histórica (Futuro — v3+)

**Status:** Planejado para Ano 3-4.

Evento focado em jogadores que fizeram história na UCL — Maldini, Henry, Raúl, CR7, Messi, etc. com arte temática de UCL.

---

## 6. EVENTOS ESPECIAIS E SURPRESAS

### 6.1 Flash Events (24-48h)

Eventos rápidos, sem aviso prévio, 1-2 vezes por mês.

**Exemplos:**
- "Quinta Lendária": todas as Quintas-feiras de Fevereiro → +50% créditos por 24h
- "Revelação Surpresa": carta que nunca esteve disponível — 48h apenas
- "O Goleiro da Semana": pack com garantia de carta de goleiro
- "Artilheiro Flash": dobro de créditos em vitórias com pelo menos 1 gol marcado

**Comunicação:** apenas notificação push e in-game banner. Sem programação pública. Manter o "uau" da surpresa.

---

### 6.2 Marcos Comunitários

Eventos que se ativam quando toda a comunidade atinge um objetivo coletivo.

**Exemplos:**
- "1 Milhão de Packs Abertos": todos recebem 100 créditos de bônus + pack gratuito
- "100 Mil Jogadores Ativos": carta especial enviada a todos
- "Primeiro Jogador a Completar o Catálogo": evento especial de celebração com recompensa para todos

**Por que funciona:** Cria sentimento de comunidade e de que cada ação individual contribui para algo maior.

---

### 6.3 Eventos de Rivalidade

Duração: 5 dias | Acontece: 1x por mês

**O jogador escolhe um lado:**
- Brasil vs Argentina: cada partida com o squad escolhido contribui para o "placar da rivalidade"
- Europa vs América: seleções europeias vs sul-americanas
- A Geração dos GOATs (80s/90s) vs A Nova Geração (2000s/2010s)

**O lado com mais vitórias ao fim do evento:**
- Todos os jogadores do lado vencedor: pack exclusivo + emblema de rivalidade
- Lado perdedor: consolação de créditos

**Importante:** O placar é visível em tempo real. As pessoas recrutam amigos para o seu lado.

---

## 7. MISSÕES TEMPORÁRIAS

### 7.1 Missões de Evento (dentro de eventos)

Cada evento tem seu conjunto de missões exclusivas que:
- Só existem durante o evento
- Têm recompensas exclusivas (não disponíveis de outra forma)
- Progridem em dificuldade ao longo das semanas do evento
- Expiram quando o evento termina

**Exemplo completo — Copa 1970:**

```
Semana 1 — Missões de Aquecimento:
  □ Jogue 5 partidas com ao menos 5 brasileiros no squad → 200 créditos
  □ Vença 3 partidas com Pelé no time → Carta Elite Tostão (1970)
  □ Abra 1 pack de evento → 50 fragmentos

Semana 2 — Missões de Semifinal:
  □ Forme o "Meio de Campo do Brasil 1970" (Clodoaldo + Rivelino + Gerson) → 500 créditos
  □ Vença 5 partidas com o squad completo brasileiro → Carta Ultra Rivelino (1970)
  □ Complete as 3 missões da semana 1 → 150 gemas

Semana 3 — Missões da Final:
  □ Monte o XI titular do Brasil na final de 1970 → Lendário Pack do evento
  □ Dispute "A Final 1970" — modo especial PvP temático → Acesso ao torneio final
  □ Vença "A Final 1970" (rank top 20%) → Carta WCH Carlos Alberto Torres
```

---

### 7.2 Missões de Divisão (Competitivo)

Para jogadores em cada divisão, missões semanais específicas:

**Divisão Bronze (D5-D6):**
- "Ganhe 10 partidas nesta semana" → 300 créditos
- Foco em aprender mecânicas

**Divisão Prata (D3-D4):**
- "Suba de divisão" → Starter Pack
- Foco em progressão

**Divisão Ouro (D2):**
- "Chegue ao Top 1000 do ranking" → Standard Pack
- Foco em competição

**Divisão Diamante (D1):**
- "Top 100 do ranking semanal" → Lendário Pack + emblema
- Foco em excelência

---

### 7.3 Missões de Descoberta (Hall of Legends)

Ligadas ao progresso no Hall of Legends:

```
"Descubra sua primeira carta WCH" → 200 créditos
"Complete a seção Brasil (todas as cartas BR)" → Ultra Pack
"Descubra 50% do catálogo" → 500 créditos + emblema "Explorador"
"Descubra 100% do catálogo" → GOAT Pack + emblema "Completou o Catálogo" (único)
"Descubra todas as cartas de uma Copa específica" → Pack temático da Copa
```

---

## 8. CARTAS TEMPORÁRIAS E LIMITADAS

### 8.1 Cartas de Evento (Event Cards)

Disponíveis apenas durante o evento. Nunca retornam na mesma forma.

**Características:**
- Têm o badge do evento ("Copa 1970", "Brasil Week", "Natal 2026")
- Arte exclusiva (diferente da carta base do jogador)
- Podem ter OVR ligeiramente superior ao normal
- Não podem ser craftadas
- Podem ter serial limitado (ex: "2.000/10.000")

**Ciclo de vida:**
```
Evento começa → Carta disponível via missões e packs
Evento termina → Carta some dos packs
Carta permanece no inventário de quem ganhou → Para sempre
Próximo evento → Carta diferente do mesmo jogador (arte nova)
```

---

### 8.2 Cartas "Hero Moment"

Edições que representam um momento único:

```
Exemplos de cartas Hero Moment planejadas:
- Baggio — "Il Pênalti" (1994): arte do momento exato
- Maradona — "La Mano de Dios" (1986)
- Iniesta — "O Gol da Final" (2010)
- Carlos Alberto — "O Último Toque" (1970)
- Ghiggia — "O Silêncio do Maracanã" (1950)
```

**Como ganhar:** Exclusivamente via evento específico que recria aquele momento. Não disponível fora do contexto.

---

### 8.3 Cartas de Ranking Exclusivas

Conquistadas apenas por performance competitiva:

```
Mensais (1 por temporada):
  - Top 1 do ranking mensal → Carta Exclusive Ultra "Campeão da Temporada [N]"
  - Top 10 → Carta Exclusive Legendary "Elite da Temporada [N]"

Anuais:
  - Top 1 do ranking anual → Carta Hall of Fame (extremamente rara, serial 1/1)
```

Estas cartas têm número de série único visível na carta. Quem vê seu oponente com uma carta "Top 1 — Temporada 3 #001/001" sabe que está diante de um jogador extraordinário.

---

### 8.4 Cartas de Fundador (One-time, Não Retorna)

Cartas criadas uma única vez, nunca repetidas:

- "Fundador Alpha": para os primeiros 1.000 usuários da plataforma
- "Beta Tester": para quem participou do beta
- "World Legends Day 1": para quem criou conta nas primeiras 24h

Estas cartas não têm equivalente de gameplay — são puro valor de coleção e prestígio.

---

## 9. RANKINGS E TEMPORADAS

### 9.1 Sistema de Divisões

```
Divisão 6 — Bronze III (0-199 pontos de ranking)
Divisão 5 — Bronze II (200-499)
Divisão 4 — Bronze I (500-999)
Divisão 3 — Prata (1.000-2.499)
Divisão 2 — Ouro (2.500-4.999)
Divisão 1 — Diamante (5.000+)
Divisão 0 — Lenda (top 100 do servidor) — ranking nominativo
```

**Pontos de Ranking:**
- Vitória: +15-25 pontos (varia por força do oponente)
- Derrota: -10-15 pontos
- Empate: ±2 pontos

---

### 9.2 Matchmaking

**Algoritmo:** FBMM (Fair Bracket Matchmaking)

Critérios em ordem de prioridade:
1. Mesma divisão (primeiro)
2. OVR médio do squad (±5 OVR de diferença máxima)
3. Ping/latência (usuários próximos geograficamente)
4. Tempo de espera (se não encontrar oponente em 30s, relaxa os critérios)

**Por que OVR importa:** Evita que um Diamante com squad GOAT massacre um Bronze recente.

---

### 9.3 Seasons Competitivas

**Soft Reset:** No início de cada temporada, o ranking de todos os jogadores é reduzido em 30%.
- Um jogador no topo do Diamante (7.000 pts) começa a temporada com 4.900 pts
- Isso cria a jornada de re-escalada que é o núcleo do loop competitivo

**Por que soft reset e não hard reset:**
- Hard reset (zero) causa frustração e churn
- Soft reset mantém a sensação de progressão histórica
- O jogador bom continua Diamante; o jogador médio recua um pouco; o iniciante tem espaço

---

### 9.4 Recompensas de Fim de Temporada

Baseadas na divisão atingida no final da temporada:

| Divisão Final | Recompensa |
|---------------|-----------|
| Bronze | 500 créditos + Mini Pack |
| Prata | 1.500 créditos + Starter Pack |
| Ouro | 3.000 créditos + Standard Pack + 30 gemas |
| Diamante | 6.000 créditos + Lendário Pack + 100 gemas + emblema |
| Lenda (Top 100) | 15.000 créditos + Ultra Pack + 250 gemas + carta exclusiva + emblema permanente |
| Campeão (Top 1) | Carta Hall of Fame + 500 gemas + emblema + troféu no perfil |

---

## 10. CALENDÁRIO ANUAL — 5 ANOS

### Ano 1 (2026)

```
Janeiro: Lançamento do MVP. Founder Packs.
Fevereiro: Copa 1930 — "O Começo de Tudo"
Março: Semana do Brasil (Carnaval)
Abril: Copa 1958 — "O Rei Nasce" (Pelé)
Maio: Flash Events + Missões de Ranking
Junho: Copa do Mundo 2026 — Evento ao Vivo (se Copa for em Junho)
Julho: Copa 1970 — "A Copa dos Deuses" (MAIOR EVENTO DO ANO)
Agosto: Semana Argentina / La Albiceleste
Setembro: Copa 1986 — "A Copa de Maradona"
Outubro: Copa 2002 — "O Penta"
Novembro: Copa 1994 — "O Tetra"
Dezembro: Natal das Lendas + Revisão do Ano
```

---

### Ano 2 (2027)

```
Janeiro: Copa 1974 — "Total Football" (Cruyff)
Fevereiro: Evento de Carnaval
Março: Copa 1966 — "A Geração de Eusébio"
Abril: Semana da Alemanha
Maio: Copa 1998 — "Zidane"
Junho: Copa 1982 — "O Brasil que Não Ganhou"
Julho: Copa 2022 — "Messi Campeão" (EVENTO DO ANO)
Agosto: Semana de Portugal
Setembro: Copa 1950 — "O Maracanazo"
Outubro: Copa 2014 — "O 7-1"
Novembro: Copa 2010 — "Gol de Iniesta"
Dezembro: Natal das Lendas + Aniversário do Jogo
```

---

### Ano 3 (2028)

```
Janeiro: Copa 1978 — "Argentina Home" (Kempes)
Fevereiro: Carnaval + Novo Catálogo de Jogadores Adicionado
Março: Copa 1990 — "A Copa de Schillaci"
Abril: Semana da Holanda
Maio: Copa 1954 — "A Maravilhosa Hungria" (Puskás)
Junho: Copa 2006 — "Despedida de Zidane"
Julho: Copa 1970 — "Segunda Edição" (novos cards, novo conteúdo)
Agosto: Introdução de Libertadores Histórica (se licença aprovada)
Setembro: Copa 2018 — "Mbappé Jovem"
Outubro: Semana da África (Eto'o, Diouf, Roger Milla)
Novembro: Copa 1966 — remasterizada
Dezembro: Natal + Aniversário Ano 3
```

---

### Ano 4 (2029)

```
Janeiro: Copa 1962 — "Garrincha" (Brasil bicampeão)
Fevereiro: Novos Jogadores Clássicos Adicionados
Março: Champions League Histórica (se licença aprovada)
Abril-Junho: Copa do Mundo 2030 — Evento ao Vivo (Copa especial — centenária)
Julho: Copa 1938 — "Leônidas, o Diamante Negro"
Agosto: Semana da Ásia (Park Ji-Sung, Nakata)
Setembro: Copa do Século — Todos os GOATs do catálogo em modo especial
Outubro: Copa 2014 — Edição Especial (5 anos do 7-1)
Novembro-Dezembro: Evento de Encerramento de Ciclo + Natal
```

---

### Ano 5 (2030)

```
Janeiro-Março: Copa do Mundo 2030 pós-evento (recompensas finais)
Abril: Aniversário de 4 anos — maior evento de aniversário até agora
Maio: Segundo Ciclo de Eventos começa (Copas revisitadas com novos cards)
Junho: Copa 2030 ao vivo (se Copa for em Junho/Julho)
Julho: Super Event — "50 GOATs em Uma Semana" (1 GOAT revelado por dia)
Agosto-Dezembro: Expansão de Catálogo + Novos Países + Nova Família de Eventos
```

---

## 11. MÉTRICAS E KPIs DE LIVE OPS

### 11.1 Métricas de Eventos

**Por evento:**
| Métrica | Objetivo |
|---------|---------|
| Participação (% usuários ativos no evento) | > 60% |
| Conclusão (% participantes que completam o evento) | > 40% |
| Retenção durante o evento (DAU vs pré-evento) | > +20% |
| Receita do evento (vs semana normal) | > +50% |
| Conversão do evento (free → pague) | > 2% dos participantes free |

---

### 11.2 Métricas de Saúde de Live Ops

**Monitorar mensalmente:**

```
Events per month: 2-4 (semanal, mais 1-2 grandes)
Missões concluídas / usuário ativo: > 5/semana
% usuários com streak ativo: > 30%
% usuários que participam de torneio semanal: > 25%
Ranking semanal participants: > 20% dos MAU
```

---

### 11.3 Sinais de Alerta

**Red flags que exigem ação imediata:**
- DAU cai > 15% em uma semana sem manutenção
- Evento tem < 30% de participação
- Streak retention no D+7 cai abaixo de 25%
- Mais de 3 reclamações sobre fairness no mesmo evento

**Protocolo de resposta:**
- < 24h: notificação push personalizada
- < 48h: flash event de recuperação (créditos bônus, pack grátis)
- < 72h: post na comunidade reconhecendo e oferecendo correção
- < 1 semana: evento de compensação planejado

---

*Documento elaborado em Julho 2026. Próxima revisão: Janeiro 2027.*
