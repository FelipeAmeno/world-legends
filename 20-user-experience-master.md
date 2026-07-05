# World Legends — User Experience Master
### Documento 20 · Versão 1.0 · Julho 2026

> **Propósito:** Blueprint completo da experiência do jogador, do primeiro acesso ao jogador veterano de 1 ano.  
> **Escopo:** Jornada, fluxos, gargalos, melhorias e referências de UX premium.  
> **Nota:** Documento de design — não implementação.

---

## ÍNDICE

1. [Jornada Completa do Jogador](#1-jornada-completa-do-jogador)
2. [Fluxo Mermaid](#2-fluxo-mermaid)
3. [Análise de Gargalos](#3-análise-de-gargalos)
4. [Melhorias Propostas](#4-melhorias-propostas)
5. [UX Premium — Referências e Blueprint](#5-ux-premium--referências-e-blueprint)

---

## 1. JORNADA COMPLETA DO JOGADOR

---

### 1.1 PRIMEIRA VISITA

**Contexto:** Jogador descobre o World Legends — via anúncio, indicação de amigo, ou busca orgânica. Está no celular. Tem 2 minutos de atenção disponível.

**O que acontece hoje:**
- Landing page ou App Store listing
- Decide baixar/acessar
- Vê a tela de login

**O que o jogador sente:**
Curiosidade + ceticismo. "Mais um jogo de futebol?"

**Objetivo desta etapa:**
Converter curiosidade em convicção em menos de 30 segundos. O jogador deve ver algo que nunca viu antes.

**Momento crítico:**
A primeira tela depois de acessar. Ela responde a pergunta: "Por que isso é diferente de tudo que eu já joguei?"

**Proposta de tela de entrada:**
```
[Fundo escuro, partículas douradas caindo]
[Carta de Pelé pulsando no centro]

WORLD LEGENDS
A história do futebol. Nas suas mãos.

[ENTRAR COM GOOGLE]  [EXPLORAR SEM CONTA]
```

A carta de Pelé respondeu a pergunta antes de qualquer texto.

---

### 1.2 LOGIN / CADASTRO

**Contexto:** O jogador decidiu entrar. Agora precisa criar conta.

**Fluxo atual:**
1. Tela de login com opção Google
2. OAuth flow
3. Redirect para home

**Problemas:**
- Sem contexto do que o jogador vai receber após cadastro
- Sem promise de valor explícita ("Ao entrar, você recebe um Founder Pack")
- Sem feedback de que o cadastro foi bem-sucedido antes de chegar na home

**Estado ideal:**
1. Tela de login com promise clara: "**Entre e receba seu Founder Pack**"
2. OAuth simplificado — um toque, sem emails
3. Loading screen temática (não spinner genérico)
4. Ao entrar pela primeira vez: micro-animação "Bem-vindo, [Nome]" com a carta de boas-vindas pulsando

**Regras de UX:**
- Máximo 2 telas antes do jogador ver algo do jogo
- Nunca pedir dados além do mínimo (nome e email via OAuth)
- Nunca mensagem de erro genérica

---

### 1.3 ONBOARDING

**Contexto:** Primeiro contato real com o produto. O jogador é novo usuário.

**O objetivo do onboarding não é ensinar o jogo.**

O objetivo do onboarding é criar **apego emocional** nos primeiros 3 minutos. O ensinamento vem depois, naturalmente.

**Sequência proposta:**

**Etapa 1 — A Promessa (30 segundos)**
```
Tela: NewUserWelcome

[Carta de Pelé, parcialmente visível, brilhando]

"Bienvenido, [Nome]."
"Você acabou de entrar no maior arquivo
 de lendas do futebol."

[ABRIR MEU PRIMEIRO PACK →]
```

Sem tutorial. Sem "clique aqui para isso, agora clique aqui para aquilo." A ação é abrir o pack — e o pack é o professor.

**Etapa 2 — O Pack (2 minutos)**
O jogador abre o Founder Pack. 8 cartas. Inclui garantias:
- 1 Legendary ou superior
- Representação mista de países e eras
- 1 carta "surpreendente" (pode ser um WCH)

O pack abre como ritual — não como transação. Sons, luzes, revelação progressiva.

**Etapa 3 — A Escolha (30 segundos)**
Após o pack: "Monte seu primeiro squad."
Auto-fill disponível como botão primário. O jogador que não sabe o que fazer escolhe auto-fill e continua. O jogador que sabe monta manualmente.

**Etapa 4 — A Primeira Partida (5 minutos)**
Jogador vai para sua primeira partida. Só então, contextos emergem: tooltips mínimos, apenas quando relevantes.

**O que o onboarding nunca faz:**
- Tutorial obrigatório passo a passo antes de qualquer ação
- Mascotes ou personagens falando pela tela
- Textos longos
- Mais de 3 decisões antes da primeira partida

---

### 1.4 TUTORIAL

**Filosofia:** O World Legends não tem tutorial. Tem **contextual learning.**

**Como funciona:**

| Momento | Aprendizado |
|---------|-------------|
| Primeira abertura de pack | Tooltip sobre raridades aparece uma vez |
| Primeira escalação | Highlight nos slots com sugestão de auto-fill |
| Primeira partida | 3 tooltips sequenciais sobre mecânicas básicas — dispensáveis com um toque |
| Primeira missão completada | Explicação de como missões funcionam |
| Primeiro Hall of Legends aberto | Contextualização sobre silhuetas e descobertas |

**Regras do contextual learning:**
- Cada tooltip aparece uma vez. Nunca repete.
- Sempre dispensável com um único toque.
- Máximo 2 tooltips simultâneos na tela.
- Linguagem direta: "Isso é um pack. Toque para abrir." Sem metáforas.

---

### 1.5 PRIMEIRO PACK

**O momento mais importante do onboarding.**

**Sequência detalhada:**

```
[1] Tela de packs — o Founder Pack está destacado, com brilho
    Badge: "GRÁTIS · APENAS 1 VEZ"
    [ABRIR FOUNDER PACK]

[2] Animação de entrada — escurece a tela, partículas douradas
    [500ms de antecipação]

[3] Cartas viradas — 8 slots escuros, todos fechados
    Vibração sutil no haptic

[4] Reveal sequencial — uma a uma, da menos para a mais rara
    Cada carta: flip, sound, glow
    
[5] A carta especial — quando chega a Legendary ou WCH:
    - Tela escurece completamente
    - Surge o glow da raridade
    - Som específico da raridade (diferente de todos os outros)
    - Nome do jogador aparece em grande
    - OVR e raridade confirmam
    
[6] Resumo — todas as cartas em grid
    Opção de "ver detalhes" em cada uma
    CTA principal: "⚽ MONTAR MEU SQUAD"
```

**O que não pode acontecer:**
- Reveal simultâneo de todas as cartas
- Som genérico para todas as raridades
- Skip sem ver pelo menos 3 cartas individualmente

---

### 1.6 PRIMEIRA ESCALAÇÃO

**Contexto:** Jogador vai para /squad pela primeira vez.

**Estado vazio do squad:**
- 11 slots vazios no campo
- Banner de orientação: "Toque em um slot · Escolha sua lenda"
- Botão de auto-fill proeminente
- Tooltip: "Você tem 8 cartas — montamos o melhor time automaticamente"

**Fluxo ao escolher auto-fill:**
1. Animação de cards voando para os slots
2. Cada slot preenche com haptic sutil
3. Squad formado: 4-3-3 ou formação ótima com as cartas disponíveis
4. Banner: "Seu squad está pronto. Vamos jogar?"

**Fluxo ao montar manualmente:**
1. Toca em um slot
2. Gaveta desliza com as cartas disponíveis para aquela posição
3. Toca em uma carta: ela vai para o slot com animação
4. Continua até completar

**O que nunca acontece:**
- Tela de escalação confusa sem orientação
- Cartas incompatíveis com posições sem feedback
- Squad com menos de 11 sem aviso claro

---

### 1.7 PRIMEIRA PARTIDA

**Contexto:** O jogador vai jogar pela primeira vez.

**Antes da partida:**
```
[Tela de confronto]

Seu squad [formação] vs. Oponente [formação]

Força estimada: ▓▓▓▓▓░░░░░ 52%

[JOGAR]
```

**Durante a partida:**
- 3 tooltips contextuais máximos
- Primeiro: "Use os Traits dos seus jogadores"
- Segundo: (apenas se perder gol) "Ajuste a defesa aqui"
- Terceiro: (ao marcar gol) "Gol! Continue pressionando"

**Após a partida:**
```
[VITÓRIA] / [DERROTA] com animação e som distintos

Resultado: 2-1

+120 créditos
+250 XP
Missão: "1ª vitória" ✓ → +50 créditos

[VER DETALHES]  [JOGAR DE NOVO]
```

---

### 1.8 PRIMEIRA RECOMPENSA

**Contexto:** Após a primeira partida, o jogador recebe recompensas múltiplas.

**Princípio:** Nunca dar uma recompensa quando pode dar três.

**Camadas de recompensa no primeiro dia:**
1. Recompensa de partida (créditos + XP)
2. Missão diária completada
3. Progresso no passe de temporada
4. Achievement "Primeira partida" desbloqueado

**Como apresentamos:**
```
[Reveal sequencial, não simultâneo]

1. Resultado: +120 créditos ✓
2. Missão "Jogar 1 partida": +50 créditos ✓
3. XP: +250 → Nível 2 [Barra de progresso]
4. Achievement: "Estreia" desbloqueado
5. "Volte amanhã: Login diário libera recompensas exclusivas"
```

A última mensagem planta a semente do retorno no dia seguinte.

---

### 1.9 RETORNO NO DIA SEGUINTE (D+1)

**Contexto:** Jogador retorna após 24 horas. A primeira semana é crítica para retenção.

**O que acontece:**

**Notificação (se habilitadas):**
"🎁 Sua recompensa de login está esperando, [Nome]"

**Ao abrir o app:**
- Modal de daily login abre automaticamente se não coletou
- Calendário mostrando dia 2 de 30
- Recompensa visível: 150 créditos
- CTA: "COLETAR"

**Após coletar:**
- RewardReveal animation
- Streak badge atualizado: "🔥 2 dias"
- Progress Tracker visível: ✓ Login ⬜ Pack ⬜ Partida ⬜ Missão

**Missão nova do dia:**
"Vença 2 partidas hoje → +200 créditos"

**O que o D+1 deve comunicar:**
- "Você voltou — ótimo."
- "Tem coisas novas te esperando."
- "Hoje é diferente de ontem."

---

### 1.10 RETORNO APÓS UMA SEMANA (D+7)

**Contexto:** Jogador completa 7 dias. Streaks são críticos neste momento.

**Milestone do dia 7:**
- Daily login mostra a recompensa especial do dia 7: Pack especial + créditos bônus
- Streak badge evolui: "🔥🔥 7 dias"
- Achievement: "Semana perfeita" (se não perdeu nenhum dia)

**Estado esperado do jogador:**
- 20-30 cartas na coleção
- Divisão 3 ou 4 no ranking
- 3-5 missões completadas
- Progresso no passe de temporada: ~30%

**O que o D+7 comunica:**
- Visibilidade de progresso: "Você já coletou X cartas"
- Preview do que vem: "Na semana que vem: evento especial Brasil 1970"
- Senso de pertencimento: "Você está no top X% dos jogadores desta semana"

---

### 1.11 RETORNO APÓS UM MÊS (D+30)

**Contexto:** O jogador chegou ao final do primeiro mês. Esse é o momento de converter engajamento em fidelidade de longo prazo.

**O que acontece no D+30:**
- Passe de temporada encerra: recompensas finais liberadas
- Calendário de 30 dias completo: carta especial "Veterano Mês 1" (não retorna)
- Stats do mês: partidas jogadas, cartas coletadas, ranking alcançado
- Preview da próxima temporada: "Amanhã começa a Temporada 2"

**Mensagem emocional:**
```
[Tela de celebração]

"[Nome], você completou seu primeiro mês."

Partidas: 47
Cartas coletadas: 31
Melhor posição: #1.247

[Medalha animada]

"Temporada 2 começa amanhã.
 Suas cartas continuam. Seu progresso continua.
 O World Legends te espera."

[VER RECOMPENSAS DA TEMPORADA]
```

**O que o D+30 deve fazer:**
- Celebrar, não só registrar
- Mostrar que o progresso é permanente (anti-churn)
- Criar expectativa para o próximo ciclo

---

## 2. FLUXO MERMAID

```mermaid
flowchart TD
    A([Usuário descobre o app]) --> B[Tela de entrada]
    B --> C{Tem conta?}
    
    C -->|Não| D[Login/Cadastro OAuth]
    C -->|Sim| E[Login existente]
    
    D --> F[Loading screen temática]
    E --> F
    
    F --> G{É novo usuário?}
    
    G -->|Sim| H[NewUserWelcome]
    G -->|Não| I{Recompensa diária disponível?}
    
    H --> J[Starter Pack auto-claim]
    J --> K[/packs?welcome=1]
    
    K --> L[Founder Pack Opening]
    L --> M[RevealSummary]
    M --> N[/squad - Primeira escalação]
    N --> O{Auto-fill ou manual?}
    O -->|Auto-fill| P[Squad formado automaticamente]
    O -->|Manual| Q[Seleção de cartas por slot]
    P --> R[/match - Primeira partida]
    Q --> R
    
    I -->|Sim| S[Modal de daily login]
    I -->|Não| T[Home - PremiumHome]
    
    S --> U[RewardReveal]
    U --> T
    
    T --> V{O que o jogador quer?}
    
    V -->|Jogar| R
    V -->|Coleção| W[/collection - Hall of Legends]
    V -->|Packs| X[/packs]
    V -->|Missões| Y[/missions]
    V -->|Álbum| Z[/album]
    V -->|Ranking| AA[/ranking]
    V -->|Perfil| BB[/profile]
    
    R --> CC[MatchResultScreen]
    CC --> DD[Recompensas: créditos + XP]
    DD --> EE{Missão completada?}
    EE -->|Sim| FF[MissionCard claim + celebração]
    EE -->|Não| GG[Progress update]
    FF --> GG
    GG --> HH{Pack disponível?}
    HH -->|Sim| X
    HH -->|Não| T
    
    X --> II[PackExperience]
    II --> L
    
    W --> JJ[Exploração por país]
    JJ --> KK{Carta descoberta?}
    KK -->|Sim| LL[Carta revelada com glow]
    KK -->|Não| MM[Silhueta - descobrir]
    LL --> T
    MM --> T
    
    Y --> NN[Lista de missões]
    NN --> OO{Missão claimable?}
    OO -->|Sim| FF
    OO -->|Não| PP[Progresso visível]
    PP --> T
    
    style A fill:#1a1400,color:#c9a84c
    style L fill:#1a0020,color:#ec4899
    style CC fill:#001a2e,color:#3b82f6
    style S fill:#1a1400,color:#c9a84c
    style H fill:#0d0021,color:#a855f7
```

---

## 3. ANÁLISE DE GARGALOS

### Gargalo 1 — A Decisão de Cadastro (Crítico)

**Onde:** Tela de entrada, antes do login.

**O problema:** O jogador não sabe o que vai receber ao criar conta. A promessa de valor é vaga ("o maior jogo de lendas do futebol") sem concretude imediata.

**Impacto:** Alta taxa de abandono antes do cadastro. Estimativa: 40-60% dos visitantes não chegam ao onboarding.

**Causa raiz:** A tela de entrada não responde "O que eu ganho se entrar agora?"

**Solução:** Promise explícita na tela de login. "Entre agora e receba **8 lendas históricas** no seu Founder Pack — de graça." Mostrar a carta mais rara do pack (Legendary) em preview.

---

### Gargalo 2 — O Gap Pós-Pack (Crítico)

**Onde:** Entre o RevealSummary e a primeira partida.

**O problema:** Após abrir o pack, o jogador está com adrenalina alta mas não sabe o que fazer com as cartas. Montar um squad pela primeira vez pode ser confuso.

**Impacto:** Abandono antes da primeira partida. Estimativa: 20-35% dos novos usuários não chegam à primeira partida.

**Causa raiz:** A transição de "coletei cartas" para "sei usar as cartas" não é guiada adequadamente.

**Solução:** CTA único e claro no RevealSummary para novos usuários: "⚽ MONTAR MEU SQUAD" com auto-fill que funciona com um toque. Remover todas as outras opções nesse momento.

---

### Gargalo 3 — O D+2 / D+3 (Importante)

**Onde:** Segundo e terceiro dia de uso.

**O problema:** A magia do primeiro dia (novo pack, primeira partida, primeira recompensa) não se repete. O D+2 é significativamente menos emocionante.

**Impacto:** Drop de retenção no D+2 e D+3 tipicamente é de 20-30%.

**Causa raiz:** Falta de novidade e progresso visível no segundo dia.

**Solução:**
- D+2: Missão especial "Segunda partida conta duplo"
- D+2: Notificação com preview do que vem no D+7 (milestone de 7 dias)
- D+3: Primeiro ranking visível — jogador vê onde está em relação a outros

---

### Gargalo 4 — Complexidade do Squad Builder (Médio)

**Onde:** /squad — primeira e segunda semanas.

**O problema:** Jogadores sem experiência em card games não sabem quais cartas são melhores para cada posição, o que os traits fazem, como a formação afeta o jogo.

**Impacto:** Squads subótimos → derrotas consecutivas → frustração → abandono. Estimativa: 15-20% dos jogadores que chegam à semana 2 abandonam por frustração competitiva.

**Causa raiz:** O Squad Builder é poderoso mas não é didático.

**Solução:**
- "Squad Rating" visível e explicado ("Seu squad está em 78 OVR médio")
- Sugestão contextual: "Substituir Hernanes por Ronaldinho eleva seu OVR em 8 pontos"
- Tutorial opcional de squad avançado, disponível mas não obrigatório

---

### Gargalo 5 — Falta de Objetivo Claro na Semana 2+ (Médio)

**Onde:** D+7 a D+21.

**O problema:** O jogador completou o onboarding, tem um squad razoável, mas não sabe para onde evoluir. Missões diárias ficam repetitivas.

**Impacto:** Drop de engajamento após primeira semana. O jogador começa a "usar por hábito" sem propósito — o que precede abandono.

**Causa raiz:** Falta de um objetivo de médio prazo que seja visível e empolgante.

**Solução:**
- "Objetivo da Semana" proeminente na home
- Progresso no Hall of Legends por país visível na home ("Você tem 8/16 lendas do Brasil")
- Preview da carta mais desejada que o jogador ainda não tem

---

### Gargalo 6 — Sessão Sem Direção (Menor)

**Onde:** Home, a qualquer momento.

**O problema:** O jogador abre o app, coletou a recompensa diária, e agora? A home tem múltiplas opções sem hierarquia clara de "o que fazer agora."

**Impacto:** Sessões curtas sem profundidade. O jogador usa 2-3 minutos em vez de 10-15.

**Causa raiz:** A home não guia o jogador para a ação mais relevante no momento.

**Solução:** "Ação Recomendada" — um único CTA dinâmico na home que muda baseado no contexto:
- "Você tem créditos para 2 packs" → [ABRIR PACK]
- "Missão diária: faltam 2 vitórias" → [JOGAR]
- "Evento especial em 4 horas" → [VER EVENTO]

---

## 4. MELHORIAS PROPOSTAS

### Melhoria A — Promise Screen (Alta Prioridade)

**O que é:** Tela de entrada que mostra explicitamente o que o novo usuário vai receber.

**Conteúdo:**
```
[Animação: 8 cartas voando para a mão do jogador]

JUNTE-SE AO WORLD LEGENDS

Ao entrar você recebe:
✦ 8 lendas históricas do futebol (grátis)
✦ Inclui ao menos 1 carta Legendary
✦ Representando 5 seleções diferentes

[ENTRAR COM GOOGLE — GRÁTIS]
[VER O JOGO PRIMEIRO]
```

**Impacto esperado:** +25-35% na conversão de entrada.

---

### Melhoria B — Contextual Moments (Alta Prioridade)

**O que é:** Sistema de "histórias" que aparecem em momentos específicos, como stories do Instagram mas dentro do jogo.

**Exemplos:**
- Ao abrir a carta de Yashin: "Você sabia? Lev Yashin foi o único goleiro a vencer a Bola de Ouro, em 1963." → [VER MAIS]
- Ao completar o squad Brasil 1970: "Você montou o Brasil de 1970 — considerado o melhor time da história."
- Ao vencer com o squad inteiro de uma seleção: "Vitória com a [Seleção] completa! +20% de bônus histórico."

**Impacto esperado:** +40% no tempo de sessão. Alta probabilidade de compartilhamento orgânico.

---

### Melhoria C — Squad Story Mode (Média Prioridade)

**O que é:** Modo narrativo onde o jogador "revive" Copas históricas.

**Exemplo:**
"Copa 1970 — Brasil vs. Itália"
O jogador monta o Brasil de 1970 com as cartas disponíveis e disputa a final histórica. Se vencer, recebe a carta de Carlos Alberto Torres.

**Impacto esperado:** Alto engajamento de jogadores nostálgicos. Motivo único de coleção ("Preciso ter as cartas da Copa 1970 para desbloquear o modo").

---

### Melhoria D — Desbloqueio de Lore (Média Prioridade)

**O que é:** Cada carta tem um "lado B" — quando você a usa em 10 partidas, desbloqueia uma narração histórica, uma imagem histórica ou um vídeo curto do momento icônico.

**Como funciona:**
- Carta de Iniesta: após 10 partidas, desbloqueia clipe de 15s do gol na final de 2010 (ou animação recriada)
- Carta de Roger Milla: desbloqueia a dança da comemoração

**Impacto esperado:** Aprofundamento da conexão emocional com as cartas. Incentivo para usar cartas diferentes.

---

### Melhoria E — Smart Notifications (Alta Prioridade)

**O que é:** Sistema de notificações inteligente que só manda mensagem quando é relevante.

**Regras:**
- Máximo 1 notificação por dia (não 3-5 como a maioria dos jogos)
- Timing personalizado: baseado em quando o jogador geralmente joga
- Conteúdo contextual: não "Você tem recompensas!" mas "🎁 Pelé te espera — sua recompensa do dia 7 está pronta"
- Respeito: se o jogador não abriu em 7 dias, reduzir para 1 por semana

**Impacto esperado:** Taxa de abertura de notificações 3-4x maior que padrão de mercado.

---

## 5. UX PREMIUM — REFERÊNCIAS E BLUEPRINT

### Referência 1 — EA FC Ultimate Team

**O que aprendemos:**

✅ **Pack Opening como ritual:** A EA entende que abrir um pack não é uma transação — é um evento emocional. A tela fica preta, o pack brilha, o reveal acontece com camadas de progressão. Copiamos e melhoramos.

✅ **Squad Building como identidade:** O squad é uma extensão do ego do jogador. "Este é o meu time." Valorizamos isso criando composições históricas com bônus.

❌ **Não copiamos:** O modelo P2W, a rotação de cartas que torna a coleção obsoleta, a complexidade excessiva (SBCs, chemistry, links), e o custo proibitivo de entrada.

**Nossa versão:**
Pack opening com ritual equivalente mas mais focado em narrativa histórica. Squad building mais intuitivo, sem chemistry links obrigatórios.

---

### Referência 2 — Clash Royale

**O que aprendemos:**

✅ **Chests timed:** A antecipação da recompensa cria engajamento passivo. Não precisamos implementar timers, mas a mecânica de "algo está sendo desbloqueado" é valiosa.

✅ **Progression clarity:** O jogador sempre sabe onde está (troféus, divisão) e o que precisa fazer para avançar.

✅ **Session depth without complexity:** Uma partida de Clash Royale tem 3-5 minutos. É simples de aprender, difícil de dominar. Mesma ambição para o World Legends.

❌ **Não copiamos:** A sensação de P2W no alto nível, o salt das derrotas por deck inferior, a repetitividade de metas de curto prazo.

**Nossa versão:**
Partidas de 5-8 minutos com clareza de resultado. Progressão de divisão transparente e honesta.

---

### Referência 3 — Pokémon TCG Pocket

**O que aprendemos:**

✅ **Abertura de pack como arte:** O TCG Pocket transformou a abertura de pack em algo que as pessoas assistem no YouTube. A câmera lenta, o brilho, a raridade construída visualmente. Aprendemos que a estética do reveal é tão importante quanto o conteúdo.

✅ **Coleção como identidade:** A Pokédex completa é um objetivo que pessoas perseguem por anos. O Hall of Legends do World Legends tem o mesmo potencial.

✅ **Pack temporário por mês:** A rotação de packs criou conversas e colecionamento urgente. Eventos temáticos mensais criam o mesmo FOMO saudável.

❌ **Não copiamos:** O modelo de apenas 2 packs por dia gratuitos, a falta de competição real.

**Nossa versão:**
Pack opening com produção visual equivalente. Hall of Legends como versão futebolística da Pokédex.

---

### Referência 4 — Marvel Snap

**O que aprendemos:**

✅ **Partidas rápidas com profundidade:** Uma partida de Marvel Snap tem 6 turnos e 3-4 minutos. É extremamente acessível mas tem um meta profundo. Esse é o equilíbrio que buscamos.

✅ **Coleção como vantagem sem ser P2W:** Em Snap, conhecimento do meta > tamanho da coleção. Jogadores novos com deck focado batem jogadores veteranos mal posicionados.

✅ **Variants como cosméticos:** Cartas alternativas com arte diferente não mudam stats mas são cobiçadas. No World Legends, edições especiais de carta (Copa Especial, Arte Vintage) servem ao mesmo propósito.

✅ **Snap mechanic:** A aposta durante a partida é um elemento de tensão perfeito. No World Legends, poderia ser "Aposta de Glória" — durante a partida, o jogador pode dobrar as recompensas com risco de dobrar a perda.

❌ **Não copiamos:** A sensação de que o jogo é puro sobre deck building, sem identidade de coleção.

**Nossa versão:**
Mecânica de partida com sessões de 5-8 minutos. Profundidade vem do uso correto dos traits, não da memorização de combos.

---

### Referência 5 — Brawl Stars

**O que aprendemos:**

✅ **Brawlers com personalidade:** Cada Brawler tem identidade visual e mecânica únicas. No World Legends, cada jogador tem traits únicos que mudam como ele joga.

✅ **Season pass acessível:** O Brawl Pass custa US$4.99 e entrega valor percebido enorme. Nosso passe deve ter o mesmo equity de preço.

✅ **Múltiplos modos:** Diferentes modos de jogo mantêm o interesse a longo prazo. Uma Copa 1970 mode e uma Copa 2022 mode têm audiências diferentes.

✅ **Clubes como comunidade:** Os Clubes de Brawl Stars criam o engajamento social que retém por anos. Nossas "Nações" têm o mesmo potencial.

❌ **Não copiamos:** A fragmentação excessiva de moedas (Gems, Coins, Tokens, Star Points...), que cria confusão deliberada.

**Nossa versão:**
Economia simplificada (máximo 3 moedas). Passe de temporada com custo-benefício claro. Modo de Copa anual como evento âncora.

---

### Blueprint de UX Premium — O Padrão World Legends

**Hierarquia de qualidade em cada tela:**

```
1. CLAREZA: O que é esta tela? O que posso fazer aqui?
   [Resposta em menos de 2 segundos]

2. DIREÇÃO: O que devo fazer agora?
   [Uma ação primária clara. Sempre.]

3. PROGRESSO: Estou avançando?
   [Alguma barra, contador ou indicador sempre visível]

4. EMOÇÃO: Isso me faz sentir algo?
   [Som, animação ou copy que cria conexão]

5. CONVITE: O que vem depois?
   [Preview do próximo objetivo ou reward]
```

**Regras de animação:**
- Toda carta que revela tem um momento de pausa antes do reveal
- Toda recompensa coletada tem partículas
- Toda vitória tem haptic
- Toda nova carta no Hall of Legends tem glow progressivo
- Zero animações decorativas sem propósito emocional

**Regras de copy:**
- Nunca "erro ao processar" — sempre "Algo deu errado. Tente de novo."
- Nunca "success" em inglês — sempre "Pronto!" ou equivalente
- Sempre o nome do jogador quando possível ("Parabéns, [Nome]!")
- Números grandes sempre formatados: 1.000, não 1000
- Datas e eras sempre contextualizadas: "Copa 1970 · México"

**Regras de feedback:**
- Tudo que o jogador faz tem feedback imediato (< 100ms)
- Ações lentas têm indicadores de progresso (loading não é aceitável sem context)
- Erros têm solução sugerida — nunca apenas informam o problema

---

*Documento elaborado em Julho 2026. Próxima revisão: Outubro 2026.*
