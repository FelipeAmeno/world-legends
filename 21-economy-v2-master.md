# World Legends — Economy v2 Master
### Documento 21 · Versão 2.0 · Julho 2026

> **Propósito:** Redesenho completo da economia do World Legends — moedas, recompensas, passe, mercado, pacotes.  
> **Princípio-guia:** Fair-to-Play. Pagar não compra vantagem; pagar compra velocidade e estética.  
> **Nota:** Documento de design — não implementação.

---

## ÍNDICE

1. [Filosofia Econômica](#1-filosofia-econômica)
2. [Moedas e Recursos](#2-moedas-e-recursos)
3. [Economia de Packs](#3-economia-de-packs)
4. [Economia de Recompensas](#4-economia-de-recompensas)
5. [Missões e Objetivos](#5-missões-e-objetivos)
6. [Passe de Temporada](#6-passe-de-temporada)
7. [Eventos e Live Ops](#7-eventos-e-live-ops)
8. [Economia de Cartas](#8-economia-de-cartas)
9. [Mercado e Trocas](#9-mercado-e-trocas)
10. [Hall of Fame Economy](#10-hall-of-fame-economy)
11. [Balanceamento e Saúde Econômica](#11-balanceamento-e-saúde-econômica)

---

## 1. FILOSOFIA ECONÔMICA

### 1.1 Princípios Inegociáveis

**Fair-to-Play, não Pay-to-Win:**
Um jogador que nunca paga deve ser capaz de construir um squad competitivo completo dentro de 3-6 meses de jogo regular. O jogador que paga chega lá em 1-2 meses. A diferença é tempo, não teto.

**Cartas não caducam:**
Nenhum sistema de rotação que invalide coleções. Uma carta Legendary coletada hoje vale o mesmo em 2 anos. O colecionamento é permanente.

**Transparência total:**
Todo pack mostra as probabilidades exatas de cada raridade antes da compra. Sem "taxa de drop" escondida. Sem percentuais enganosos.

**Pior experiência possível:**
Um jogador que nunca pagou um centavo deve ter uma experiência boa. Não ótima — boa. O jogo deve ser jogável, divertido e progressivo sem pagamento. Pagamento melhora, não desbloqueia o jogo.

---

### 1.2 Objetivos Econômicos

| Objetivo | Métrica | Prazo |
|----------|---------|-------|
| ARPPU (Avg Revenue Per Paying User) | R$ 45/mês | 12 meses |
| Conversão free → paying | 4-8% | 6 meses |
| Churn mensal | < 15% | 6 meses |
| LTV médio (payer) | R$ 250 | 18 meses |
| % jogadores sem pagamento satisfeitos | > 70% | Permanente |

---

### 1.3 Posicionamento de Preço

**Referência de mercado:**
- Clash Royale Pass: US$4.99/mês → R$28/mês
- EA FC Points pacote menor: US$4.99 → R$28
- Brawl Stars Pass: US$4.99/mês → R$28/mês
- Pokémon TCG Pocket: US$9.99/mês premium → R$55/mês

**Posicionamento World Legends:**
- Passe de Temporada: **R$19.90/mês** (abaixo da concorrência, alta percepção de valor)
- Pack de entrada: **R$9.90** (acessível para conversão inicial)
- Pack premium: **R$49.90** (para momento de festa ou gifting)
- Gems (moeda premium): pacotes de R$9.90 / R$19.90 / R$49.90 / R$99.90

---

## 2. MOEDAS E RECURSOS

### 2.1 Arquitetura de Moedas

O World Legends usa **3 moedas** — o mínimo necessário para suportar todos os sistemas.

```
CRÉDITOS (💰) — Moeda de jogo primária
  Ganho: partidas, missões, login diário, eventos
  Uso: comprar packs básicos, missões recorrentes, mercado

GEMAS (💎) — Moeda premium
  Ganho: compra real, Passe de Temporada, conquistas especiais
  Uso: packs premium, aceleração, cosméticos, espaço extra

FRAGMENTOS (🧩) — Moeda de crafting
  Ganho: reciclar cartas duplicadas, missões especiais, eventos
  Uso: craft de cartas específicas, upgradar cartas (v3+)
```

**Por que 3 e não mais:**

Cada moeda adicional aumenta a confusão cognitiva do jogador. EA FC tem 5+ moedas/recursos (FUT Coins, FIFA Points, FUT Champions Points, Division Rivals Points, Season XP) e os próprios jogadores reclamam de confusão. Manteremos 3.

---

### 2.2 Créditos — Especificações

**Taxa de geração:**

| Fonte | Quantidade |
|-------|-----------|
| Vitória em partida | 100-150 créditos |
| Derrota em partida | 40-60 créditos |
| Login diário D1-D7 | 50-200 créditos (escala) |
| Login diário D8-D21 | 100-300 créditos (escala) |
| Login diário D22-D30 | 150-500 créditos (escala) |
| Missão diária simples | 50-100 créditos |
| Missão diária avançada | 150-300 créditos |
| Missão semanal | 500-1.000 créditos |
| Missão mensal | 2.000-5.000 créditos |
| Evento especial | 200-2.000 créditos |

**Custo de packs em créditos:**

| Pack | Custo |
|------|-------|
| Mini Pack (3 cartas, 50% Common, 50% Rare) | 500 créditos |
| Starter Pack (5 cartas, 60% Rare, 30% Elite, 10% Legendary+) | 1.200 créditos |
| Standard Pack (5 cartas, 70% Elite, 25% Legendary, 5% Ultra+) | 2.500 créditos |
| Country Pack (5 cartas de uma seleção específica) | 2.000 créditos |

**Meta de equilíbrio:**
- Jogador casual (2-3 partidas/dia, login diário): ~1.500-2.000 créditos/dia
- Pode comprar ~1 Starter Pack a cada 3-4 dias sem pagar nada
- Pode comprar ~1 Standard Pack por semana com login e missões diárias

---

### 2.3 Gemas — Especificações

**Geração gratuita:**

| Fonte | Gemas |
|-------|-------|
| Conquista "Completar Tutorial" | 50 |
| Conquista "Primeira Vitória" | 20 |
| Conquista "Primeira Semana" | 30 |
| Conquista "Completar seleção [qualquer]" | 100 |
| Conquista "Top 1000 do ranking semanal" | 50/semana |
| Passe de Temporada (track gratuita) | 80 total no mês |
| Evento especial (rank alto) | 20-100 |
| Total máximo gratuito/mês | ~400-500 gemas |

**Pacotes pagos:**

| Pacote | Preço | Gemas | Bônus |
|--------|-------|-------|-------|
| Toque de Ouro | R$9,90 | 160 | — |
| Bolsa do Craque | R$19,90 | 360 | +40 bônus |
| Baú da Copa | R$49,90 | 1.000 | +100 bônus |
| Cofre das Lendas | R$99,90 | 2.200 | +300 bônus |

**Uso de gemas:**

| Item | Custo em Gemas |
|------|---------------|
| Pack Lendário (5 cartas, 100% Legendary+) | 150 gemas |
| Pack Ultra (5 cartas, garantia de Ultra+) | 350 gemas |
| Pack GOAT (5 cartas, pool GOAT) | 500 gemas |
| Slot extra de squad (base: 3 squads) | 100 gemas por slot |
| Renovação cosmética de carta | 80 gemas |
| Country Pack Premium (garantia Legendary+) | 200 gemas |
| Aceleração de missão semanal (concluir agora) | 50 gemas |

**Meta de equilíbrio:**
- Jogador free: acumula ~400 gemas/mês → 2-3 packs Lendários/mês
- Jogador Toque de Ouro (R$9,90): 560 gemas → 3-4 packs Lendários/mês
- Jogador Cofre das Lendas (R$99,90): 2.500+ gemas → 16+ packs Lendários/mês

---

### 2.4 Fragmentos — Especificações

**Geração:**

| Fonte | Fragmentos |
|-------|-----------|
| Reciclar carta Common | 10 |
| Reciclar carta Rare | 25 |
| Reciclar carta Elite | 60 |
| Reciclar carta Legendary | 150 |
| Reciclar carta Ultra | 400 |
| Reciclar carta WCH | 600 |
| Missão especial de reciclagem | 50-200 |

**Uso:**

| Item | Custo em Fragmentos |
|------|---------------------|
| Craft de carta Common específica | 50 |
| Craft de carta Rare específica | 120 |
| Craft de carta Elite específica | 300 |
| Craft de carta Legendary específica | 750 |
| Craft de carta Ultra específica | 2.000 |
| Craft de carta WCH específica | 3.000 |

**Design intencional dos fragmentos:**
Fragmentos permitem que o jogador com muitas duplicatas converta em cartas específicas que quer. Isso:
1. Reduz a frustração de duplicatas
2. Dá agency ao jogador veterano
3. Não invalida a abertura de packs (packs são sempre mais eficientes por gema/fragmento)

---

## 3. ECONOMIA DE PACKS

### 3.1 Tipos de Pack

**Por tier de acesso:**

```
PACKS FREE (com créditos)
├── Mini Pack        → 3 cartas | 500 créditos
├── Starter Pack     → 5 cartas | 1.200 créditos
├── Standard Pack    → 5 cartas | 2.500 créditos  
└── Country Pack     → 5 cartas específicas | 2.000 créditos

PACKS PREMIUM (com gemas)
├── Lendário Pack    → 5 cartas | 150 gemas
├── Ultra Pack       → 5 cartas | 350 gemas
├── GOAT Pack        → 5 cartas (pool GOAT) | 500 gemas
└── Country Premium  → 5 cartas | 200 gemas

PACKS ESPECIAIS (eventos, tempo limitado)
├── Copa Pack        → tema de Copa específica
├── Década Pack      → tema de era (70s, 80s, 90s...)
├── Rivalidade Pack  → tema Brasil vs Argentina, etc.
└── Aniversário Pack → aniversário do jogo
```

---

### 3.2 Probabilidades de Drop

**Transparência:** Todas as probabilidades são exibidas na tela de detalhes do pack antes de qualquer compra.

**Mini Pack (500 créditos / 3 cartas):**
| Raridade | Probabilidade |
|----------|--------------|
| Common | 60% |
| Rare | 40% |
| Elite | 0% |
| Legendary+ | 0% |
*Garantia: nenhuma*

**Starter Pack (1.200 créditos / 5 cartas):**
| Raridade | Probabilidade por carta |
|----------|------------------------|
| Common | 20% |
| Rare | 45% |
| Elite | 25% |
| Legendary | 9% |
| Ultra+ | 1% |
*Garantia: ao menos 1 Rare+*

**Standard Pack (2.500 créditos / 5 cartas):**
| Raridade | Probabilidade por carta |
|----------|------------------------|
| Rare | 10% |
| Elite | 55% |
| Legendary | 28% |
| Ultra | 5% |
| WCH / GOAT | 2% |
*Garantia: ao menos 1 Legendary+*

**Lendário Pack (150 gemas / 5 cartas):**
| Raridade | Probabilidade por carta |
|----------|------------------------|
| Elite | 20% |
| Legendary | 60% |
| Ultra | 15% |
| WCH / GOAT | 5% |
*Garantia: ao menos 2 Legendary+*

**Ultra Pack (350 gemas / 5 cartas):**
| Raridade | Probabilidade por carta |
|----------|------------------------|
| Legendary | 30% |
| Ultra | 50% |
| WCH | 15% |
| GOAT | 5% |
*Garantia: ao menos 1 Ultra+*

**GOAT Pack (500 gemas / 5 cartas):**
| Raridade | Probabilidade por carta |
|----------|------------------------|
| WCH | 50% |
| GOAT (edition) | 50% |
*Garantia: todas as cartas WCH ou GOAT. Pool especial.*

---

### 3.3 Sistema de Pity (Anti-frustração)

**Pity Tracker global por tipo de pack:**
- **Standard Pack:** Se não saiu Legendary em 10 packs, o 11º garante Legendary.
- **Lendário Pack:** Se não saiu Ultra em 5 packs, o 6º garante Ultra.
- **Ultra Pack:** Se não saiu WCH em 3 packs, o 4º garante WCH.

**Hard Pity:**
- Standard Pack: 20 packs sem Legendary → próximo pack tem 100% Legendary
- Ultra Pack: 5 packs sem WCH/GOAT → próximo pack tem 100% WCH/GOAT

**Soft Pity (aumenta probabilidade progressivamente a partir de 50% do limiar):**
Standard Pack: a partir do pack 5, a probabilidade de Legendary aumenta em 5% por pack.

O Pity Tracker persiste entre sessões, é visível na UI do pack ("5 packs até garantia Legendary"), e nunca reseta exceto quando a garantia é ativada.

---

### 3.4 Founder Pack

Distribuído uma única vez para cada novo usuário. Não retorna.

**Composição garantida:**
- 8 cartas totais
- 1-2 Legendary garantidos
- 0-1 Ultra (20% de chance)
- Representação de ao menos 5 seleções diferentes
- Ao menos 1 jogador brasileiro (para usuários BR)
- Ao menos 1 jogador de épocas distintas (clássico pré-90, moderno 90-10, contemporâneo)

**Por que o Founder Pack é generoso:**
É o único momento em que o jogo pode "comprar" a lealdade do jogador com alto custo. Um jogador que abre o Founder Pack e fica desapontado nunca retorna. Um jogador que abre e fica impressionado conta para amigos.

---

## 4. ECONOMIA DE RECOMPENSAS

### 4.1 Login Diário

**Estrutura do calendário mensal:**

| Dia | Recompensa |
|-----|-----------|
| D1 | 50 créditos |
| D2 | 150 créditos |
| D3 | Mini Pack |
| D4 | 200 créditos |
| D5 | 100 créditos + 10 gemas |
| D6 | 250 créditos |
| D7 | **Starter Pack + 20 gemas** ⭐ |
| D8 | 200 créditos |
| D9 | 300 créditos |
| D10 | Standard Pack |
| D11 | 250 créditos + 15 gemas |
| D12 | 350 créditos |
| D13 | 400 créditos |
| D14 | **Country Pack (seleção aleatória) + 30 gemas** ⭐ |
| D15 | 400 créditos |
| D16 | 500 créditos |
| D17 | Standard Pack |
| D18 | 500 créditos + 20 gemas |
| D19 | 600 créditos |
| D20 | 600 créditos |
| D21 | **Lendário Pack** ⭐⭐ |
| D22 | 600 créditos |
| D23 | 700 créditos |
| D24 | Standard Pack + 25 gemas |
| D25 | 700 créditos |
| D26 | 800 créditos |
| D27 | 800 créditos |
| D28 | **Ultra Pack** ⭐⭐⭐ |
| D29 | 1.000 créditos + 50 gemas |
| D30 | **Carta Legendary garantida (escolha de 3 opções)** 🏆 |

**Regras:**
- Não é sequencial — se perder um dia, o calendário pausa (não perde o dia anterior)
- O D30 reseta no início da próxima temporada
- Recompensas do D7, D14, D21, D28 são os milestones — dificuldade de perder esses dias deve ser comunicada

---

### 4.2 Streak Bônus

**Streak de dias consecutivos (dias seguidos sem falhar):**

| Streak | Bônus |
|--------|-------|
| 3 dias | +10% créditos nas próximas 24h |
| 7 dias | +50 gemas |
| 14 dias | Carta Rare exclusiva da temporada |
| 21 dias | +100 gemas + país escolhido no Country Pack |
| 30 dias | Carta Legendary exclusiva "Veterano" |

**Streak de vitórias consecutivas (em partidas):**

| Streak | Bônus |
|--------|-------|
| 3 vitórias | +20% créditos por vitória nesta sessão |
| 5 vitórias | +50 créditos bônus |
| 10 vitórias | +100 créditos + 10 fragmentos |
| 20 vitórias | Mini Pack |

---

### 4.3 Recompensas de Partida

**Estrutura de recompensa:**

```
Vitória:
  Créditos base: 100-150 (varia por divisão)
  XP: 200-300
  Bônus de missão: se aplicável

Derrota:
  Créditos base: 40-60
  XP: 100-150

Empate:
  Créditos base: 70-90
  XP: 150-200
```

**Multiplicadores:**
- Streak de vitórias ativo: +20% créditos
- First win do dia: +100% créditos (dobra uma vez por dia)
- Partida de evento especial: +50% créditos e XP
- Squad completo de uma seleção (11 jogadores da mesma): +10% créditos

---

## 5. MISSÕES E OBJETIVOS

### 5.1 Estrutura de Missões

**Quatro camadas de missões:**

```
DIÁRIAS (renovam 00:00 UTC-3)
  3 missões por dia
  Duração: 24 horas
  Exemplo: "Vença 3 partidas" / "Jogue 5 partidas" / "Use uma carta Legendary"

SEMANAIS (renovam segunda-feira)
  3 missões por semana
  Duração: 7 dias
  Exemplo: "Colete 2.000 créditos" / "Vença 15 partidas" / "Abra 3 packs"

MENSAIS (renovam início de temporada)
  3 missões por mês
  Duração: 30 dias
  Exemplo: "Suba 2 divisões" / "Colete 1 carta Legendary" / "Complete 20 missões diárias"

PERMANENTES (nunca expiram)
  Conquistas de longo prazo
  Exemplo: "Colete 100 cartas" / "Vença 500 partidas" / "Complete uma seleção"
```

---

### 5.2 Recompensas de Missões

**Diárias:**
| Dificuldade | Recompensa |
|-------------|-----------|
| Fácil | 50-100 créditos |
| Média | 100-200 créditos |
| Difícil | 200-350 créditos |

Completar as 3 do dia: bônus de 100 créditos extra.

**Semanais:**
| Dificuldade | Recompensa |
|-------------|-----------|
| Fácil | 500 créditos |
| Média | 800 créditos + 10 gemas |
| Difícil | Starter Pack + 20 gemas |

Completar as 3 da semana: Standard Pack.

**Mensais:**
| Dificuldade | Recompensa |
|-------------|-----------|
| Fácil | 2.000 créditos |
| Média | 3.000 créditos + 30 gemas |
| Difícil | Lendário Pack |

Completar as 3 do mês: Country Pack + 50 gemas.

**Conquistas Permanentes:**
| Categoria | Exemplo | Recompensa |
|-----------|---------|-----------|
| Coleção | Coletar 50 cartas | 20 gemas |
| Coleção | Completar seleção | 100 gemas |
| Competitivo | Vencer 100 partidas | Carta Legendary exclusiva |
| Descoberta | Abrir 50 packs | 50 gemas |
| Lealdade | 30 dias consecutivos | Carta Ultra exclusiva |

---

### 5.3 Sistema de Missões Especiais

**Missões de Evento:**
Durante eventos temáticos (Copa 1970, Clássicos da Argentina, etc.), missões especiais com tempo limitado entram:

```
Evento: "Brasil 1970 — A Copa dos Deuses"

Missão 1: "Monte um squad com 5 brasileiros da Copa 70" 
→ +500 créditos + Fragmentos

Missão 2: "Vença 3 partidas com o squad da Copa 70" 
→ Carta de evento: Tostão (Rare exclusiva do evento)

Missão 3: "Forme o "ataque" do Brasil 70 (Pelé + Jairzinho + Tostão)"
→ Carta de evento: Rivelino (Elite exclusiva do evento)

Missão Final: "Complete as 3 missões do evento"
→ Carta WCH: Carlos Alberto Torres (garantida)
```

Missões de evento expiram com o evento. As cartas de evento são coletáveis apenas durante a janela.

---

## 6. PASSE DE TEMPORADA

### 6.1 Estrutura

**Uma temporada = 30 dias.**

O Passe tem duas tracks paralelas:
- **Track Gratuita:** Disponível para todos os jogadores
- **Track Premium:** Disponível com a compra do Passe (R$19,90/mês)

**Progressão:**
O jogador progride pelas duas tracks simultaneamente. XP de partidas, missões e login alimentam o contador de progresso.

```
Track Gratuita (30 recompensas em 30 "etapas"):
  Etapas 1-5: Créditos progressivos (100→500)
  Etapas 6-10: Fragmentos + Créditos
  Etapas 11-15: Mini Packs
  Etapas 16-20: Gemas (20 gemas por etapa)
  Etapas 21-25: Starter Packs
  Etapas 26-29: Standard Packs
  Etapa 30: Carta Rare de temporada (exclusiva)

Track Premium (mesmas 30 etapas, recompensas paralelas):
  Etapas 1-5: Country Packs
  Etapas 6-10: Gemas + Fragmentos
  Etapas 11-15: Lendário Packs
  Etapas 16-20: Gemas premium (50 gemas por etapa)
  Etapas 21-25: Ultra Packs
  Etapas 26-29: GOAT Packs
  Etapa 30: Carta Legendary exclusiva da temporada (skin especial)

Bônus do Passe Premium:
  • +20% XP em todas as atividades (progride mais rápido)
  • +10% créditos em todas as partidas
  • Acesso ao Hall of Fame exclusivo da temporada
  • Emblema de Assinante no perfil
```

---

### 6.2 XP e Progressão do Passe

**Ganho de XP:**

| Ação | XP |
|------|----|
| Vitória em partida | 200 XP |
| Derrota em partida | 100 XP |
| Login diário | 50 XP |
| Missão diária concluída | 150 XP |
| Missão semanal concluída | 500 XP |
| Missão de evento concluída | 300 XP |
| Pack aberto | 30 XP |

**Progresso por etapa:** 1.000 XP por etapa.

**Jogador casual (sem pagar):**
~4-6 partidas/dia + login + 1 missão → ~1.200 XP/dia → ~36.000 XP em 30 dias → passa as 30 etapas com folga.

**Jogador ocasional (2-3 partidas/dia):**
~600-900 XP/dia → pode não completar as 30 etapas, mas chega até ~25.

**Passe Premium tem +20% XP**, o que representa ~1-2 etapas extras para o jogador médio — não uma diferença abissal.

---

### 6.3 Carta de Temporada

Cada temporada tem um **tema e uma carta exclusiva de temporada**.

**Exemplos de temas:**
- Temporada 1: "As Raízes" — Copa 1930/1950, Uruguai e Brasil pioneiros
- Temporada 2: "O Despertar" — Copa 1954/1958, Puskás e Pelé jovem
- Temporada 3: "A Copa dos Deuses" — Copa 1970, Brasil
- Temporada 4: "A Era dos Cruyff" — Copa 1974, Holanda e Alemanha
- Temporada 5: "Maradona" — Copa 1986, Argentina

A carta de temporada da track premium tem um **skin especial** (background artwork exclusivo da época representada) e **não sai em packs** — é o único item que existe apenas para assinantes do período específico.

---

## 7. EVENTOS E LIVE OPS

### 7.1 Calendário de Eventos

**Cadência:**

| Tipo | Frequência | Duração |
|------|-----------|---------|
| Evento Semanal | Toda semana | 5 dias |
| Evento Mensal | 1 por temporada | 15 dias |
| Evento de Copa | Histórico — ver abaixo | 21 dias |
| Evento Sazonal | 4 por ano | 7-10 dias |
| Evento Especial | Raramente | 3-5 dias |

---

### 7.2 Eventos de Copa Histórica (Âncora)

São os maiores eventos do calendário. Cada um revive uma Copa do Mundo.

**Estrutura padrão:**

```
Evento: Copa 1970 — Brasil
Duração: 21 dias

Semana 1: "Fase de Grupos"
  Missões: usar cartas do Brasil 1970
  Recompensas: cartas de jogadores da fase de grupos

Semana 2: "As Semifinais"  
  Missões: squads temáticos (Brasil 1970 vs Alemanha?)
  Recompensas: cartas Elite exclusivas do evento

Semana 3: "A Final"
  Missões: disputar a "Copa 1970" contra outros jogadores
  Recompensas: carta WCH Carlos Alberto Torres (exclusiva do evento)
  
Ranking do evento:
  Top 10%: Ultra Pack + Emblema "Copa 1970 Veteran"
  Top 25%: Lendário Pack
  Top 50%: Standard Pack + 50 créditos bônus
```

**Eventos históricos planejados:**
- Copa 1950 (Maracanazo, Uruguai)
- Copa 1958 (Pelé estreia)
- Copa 1966 (Eusébio, Portugal)
- Copa 1970 (Brasil)
- Copa 1974 (Cruyff, Holanda)
- Copa 1978 (Argentina home)
- Copa 1982 (Brasil fantástico, Itália vence)
- Copa 1986 (Maradona)
- Copa 1990 (Schillaci, Itália)
- Copa 1994 (Brasil Tetracampeão)
- Copa 1998 (Zidane, França)
- Copa 2002 (Ronaldo, Brasil Penta)
- Copa 2006 (Zidane despedida)
- Copa 2010 (Espanha, Iniesta)
- Copa 2014 (7-1, Alemanha)
- Copa 2018 (França, Mbappé jovem)
- Copa 2022 (Messi, Argentina)

---

### 7.3 Eventos Sazonais

**Natal / Dezembro:** "Presentes das Lendas"
- Pack temático de Natal com cartas de arte especial (neve, estrelas)
- Missão especial: "Monte o squad dos sonhos de Natal"
- Gifting: jogador pode presentear packs para amigos

**Carnaval / Fevereiro:** "Seleção Canarinha"
- Foco no Brasil, cartas verde-amarelas exclusivas
- Competição de squad Brasil puro
- Arte especial das cartas com cores do carnaval

**Aniversário do Jogo:** mês de lançamento
- Pack de Aniversário exclusivo
- Cartas comemorativas de "1 Ano de World Legends"
- Histórico de todos os eventos passados disponível para ver

**Copa do Mundo Real:** anos de Copa (2026, 2030...)
- Evento paralelo à Copa real
- Cards desbloqueados em tempo real baseado na performance das seleções

---

### 7.4 Eventos de Rivalidade

Duração: 5 dias | Formato: PvP temático

**Exemplos:**
- Brasil vs Argentina: jogadores escolhem um lado, a seleção que acumular mais vitórias no evento ganha bônus coletivo
- Europa vs América do Sul: formato similar
- Clássico das Décadas: 70s vs 80s vs 90s vs 2000s — cada player escolhe uma era

**Recompensas de time vencedor:** bônus de créditos + pack exclusivo com cores do país

---

## 8. ECONOMIA DE CARTAS

### 8.1 Duplicatas

**Política:**
Cartas duplicadas nunca são inúteis. Ao receber uma duplicata:
1. Automaticamente vai para o "Inventário de Duplicatas"
2. Jogador pode convertê-la em Fragmentos (1:1 com tabela da seção 2.4)
3. Jogador pode usá-la no Mercado
4. Jogador pode mantê-la (mas sem benefício adicional de ter 2 iguais)

**Auto-recycle (configurável):**
O jogador pode ativar: "Duplicatas de Common → auto-converter em Fragmentos". Apenas para raridades escolhidas pelo jogador.

---

### 8.2 Hall de Duplicatas

Tela dedicada com:
- Todas as cartas duplicadas
- Valor em Fragmentos de cada
- Opção de reciclar individual ou em lote
- "Reciclar todas as Commons" / "Reciclar todas as Rares" etc.
- Preview de quantos Fragmentos serão gerados

---

### 8.3 Craft de Cartas

**Como funciona:**
- Acumular Fragmentos via reciclagem
- Ir em "Catálogo" → Carta desejada → "Criar com Fragmentos"
- Confirmar custo e craftar

**Custo (ver tabela completa na seção 2.4)**

**Limitações:**
- Cartas de eventos especiais não podem ser craftadas — apenas adquiridas durante o evento
- GOAT cards não podem ser craftadas — apenas em GOAT Packs
- Cada carta pode ser craftada no máximo 1x por temporada (anti-exploração)

---

## 9. MERCADO E TROCAS

### 9.1 Mercado de Jogadores

**Descrição:** Plataforma P2P onde jogadores listam cartas e outros compram com Créditos.

**Mecânica:**
```
Jogador A lista: Carta Elite Ronaldinho
Preço: 800 créditos (livre mercado)

Jogador B vê o mercado, acha a carta
Compra por 800 créditos

Taxa do mercado: 5% (= 40 créditos vai para o "banco do jogo")
Jogador A recebe: 760 créditos
```

**Regras:**
- Apenas cartas do inventário do jogador
- Cartas em squad ativo não podem ser listadas (sem deixar squad vazio por acidente)
- Cartas de eventos com período "trade lock" não podem ser listadas (por 7 dias após recebimento)
- Preço mínimo: 50 créditos. Preço máximo: 50.000 créditos.
- Listagem expira em 7 dias (carta volta para o inventário)

---

### 9.2 Mercado de Fragmentos

Jogadores podem trocar Fragmentos por Créditos e vice-versa, usando uma taxa de câmbio flutuante (mas com floor/ceiling para evitar especulação extrema).

**Taxa base:**
- 10 Fragmentos = 100 Créditos (10:1)
- Pode flutuar entre 8:1 e 15:1 baseado na demanda do servidor

---

### 9.3 Trade Direto (v2 future)

Sistema para negociação direta jogador-a-jogador: "Troco minha Legendary Argentina por sua Legendary Brasil."

*Esta feature é para v2.0 — não implementada no MVP.*

---

## 10. HALL OF FAME ECONOMY

### 10.1 O que é o Hall of Fame

Distinção permanente para os maiores colecionadores e competidores de cada temporada. Não é apenas ranking — é um legado.

**Categorias:**

| Categoria | Critério | Recompensa |
|-----------|---------|-----------|
| Lendário da Temporada | Top 1 no ranking geral | Carta Hall of Fame exclusiva (histórica) |
| Colecionador da Era | Maior Hall of Legends % completado | Emblema permanente no perfil |
| Mestre da Copa | Top 3 no evento de Copa | Carta WCH especial da era do evento |
| Guerreiro Fiel | 3 temporadas com Passe Premium | Carta Ultra "Veterano" exclusiva |

---

### 10.2 Cartas Hall of Fame

Cartas que não existem em packs. Não podem ser compradas. Conquistadas apenas via performance excepcional.

Estética:
- Background metalizado (diferente de todas as outras raridades)
- Badge "HoF" dourado no canto
- Borda única com padrão de troféus
- Serial number (ex: #001/100 — somente 100 cópias existem)

Estas cartas têm o maior valor social do jogo. Tê-las é um sinal de excelência real.

---

## 11. BALANCEAMENTO E SAÚDE ECONÔMICA

### 11.1 Métricas de Saúde

**Monitorar semanalmente:**

| Métrica | Alerta Verde | Alerta Amarelo | Alerta Vermelho |
|---------|-------------|----------------|-----------------|
| Créditos em circulação (todos jogadores) | Estável ±10% | +/-10-25% | >25% mudança |
| Pack open rate (packs abertos/usuário ativo) | 3-7/semana | < 2 ou > 10 | < 1 ou > 15 |
| Reciclagem de duplicatas | 20-40% dos jogadores | < 10% | < 5% |
| % jogadores atingindo D30 de login | > 15% | 8-15% | < 8% |
| Conversão free → passe | 4-8% | 2-4% | < 2% |

---

### 11.2 Alavancas de Ajuste

**Se a economia está deflacionária (créditos escassos):**
- Aumentar créditos de partida em 10-20%
- Adicionar missão diária bônus temporária
- Criar evento de "créditos em dobro" por 48h

**Se a economia está inflacionária (créditos demais, packs perdendo valor):**
- Aumentar custo de packs em créditos em 15-25%
- Adicionar destinos novos para créditos (novos itens, novo pack tier)
- Criar "mega event" que drena créditos da economia

**Se a retenção D+7 cai:**
- Revisar onboarding
- Criar evento de "primeira semana" com recompensas especiais
- Notificação personalizada no D+3

**Se conversão free → passe cai:**
- Adicionar 1 recompensa premium exclusiva que aumente o valor percebido
- Teste A/B de preço (R$14,90 vs R$19,90 vs R$24,90)
- Comunicar mais claramente o valor total do passe vs custo individual

---

### 11.3 Teto de Vantagem Competitiva (Fairness Cap)

**Definição:** Um jogador que gasta qualquer valor nunca tem mais do que X% de vantagem sobre um jogador free de mesmo nível de habilidade.

**Benchmark:**
- Squad de jogador free (6 meses de jogo regular): OVR ~82-85
- Squad de jogador que gastou R$200 total: OVR ~88-92
- Diferença máxima aceitável: ~8-10 OVR

Se um jogador rico consegue OVR 95 enquanto o free tem 75, o jogo está quebrado. Implementamos:
- Cap de OVR por divisão (jogadores em Divisão 3 não encontram squads impossíveis)
- Matchmaking que considera OVR médio do squad
- Progressão de divisão baseada em skill, não apenas em OVR do squad

---

*Documento elaborado em Julho 2026. Próxima revisão: Outubro 2026.*
