# Sprint 13 — Economy 2.0

**Objetivo:** Transformar a economia em algo digno de um jogo competitivo.

---

## 1. Pack Store — 7 packs funcionais

| Pack | Preço | Cartas | Garantia |
|------|-------|--------|----------|
| Starter Pack | 75c | 5 | Mínimo 1 Rara |
| Classic Pack | 150c | 5 | Mínimo 1 Rara |
| Brazil Pack | 250c | 5 | Mínimo 1 Elite (pool: apenas BR) |
| Elite Pack | 400c | 5 | Mínimo 2 Elites |
| Hero Pack | 700c | 3 | Mínimo 1 Lendária + Elite pesado |
| Legend Pack | 1000c | 3 | Mínimo 1 Lendária |
| GOAT Pack | 2500c | 2 | Ultra garantido + Lendária garantida |

Event Pack e Season Pass Pack mantidos como "Em Breve" (requerem Gemas/Pass).

---

## 2. Drop Tables — Probabilidades reais

Todos os packs usam o motor `openPack()` de `@world-legends/packs` com drop tables determinísticos via RNG mulberry32.

**Starter (slots livres):**
- Common 65% / Rare 28% / Elite 6% / Legendary 1%

**Classic (base doc 10 §15):**
- Common 58% / Rare 25% / Elite 11% / Legendary 4.5% / Ultra 1.3% / WCH 0.2%

**Brazil Pack:**
- Slot 0 garantido Elite: Elite 70% / Legendary 25% / Ultra 5%
- Pool restrito a jogadores com nationality `BR`
- Slots livres: Common 40% / Rare 35% / Elite 18% / Legendary 6% / Ultra 1%

**Hero Pack:**
- Slot 0 garantido Legendary: Legendary 60% / Ultra 35% / WCH 5%
- Slot 1: Rare 20% / Elite 55% / Legendary 20% / Ultra 5%
- Slot 2: Common 20% / Rare 40% / Elite 30% / Legendary 9% / Ultra 1%

**GOAT Pack:**
- Slot 0 garantido Ultra: Ultra 60% / WCH 40%
- Slot 1 garantido Legendary: Legendary 75% / Ultra 20% / WCH 5%

Sistema de pity (`legendary_plus`, `ultra_plus`) ativo em todos os packs.

---

## 3. Duplicatas → Fragmentos

Quando o usuário abre um pack e uma carta já pertence à sua coleção:
- A carta **não** é adicionada novamente
- É convertida automaticamente em Fragmentos
- O reveal mostra a carta com badge de duplicata e quantidade de fragmentos

**Taxas de conversão (doc 10 §16):**
| Raridade | Fragmentos |
|----------|-----------|
| Common | 10 |
| Rare | 25 |
| Elite | 75 |
| Legendary | 200 |
| Ultra | 500 |
| World Cup Hero | 1000 |

O sistema prefere cartas que o usuário não possui. Duplicatas só ocorrem quando o catálogo esgota opções novas para aquela raridade.

---

## 4. Moedas

| Moeda | Campo DB | Status |
|-------|----------|--------|
| Créditos (c) | `soft_currency` | Totalmente funcional |
| Gemas | `hard_currency` | No DB, ganho futuro |
| Fragmentos | `fragment_balance` | Totalmente funcional |

Fragmentos exibidos na tela de Packs quando o saldo > 0.

---

## 5. Daily Login

7 dias de recompensas crescentes + milestones de streak:
- **Dia 7:** 2000c + 1 Legend Pack (equivalente em créditos: 1000c)
- **14 dias (streak):** Bônus Elite Pack (400c)
- **30 dias (streak):** Bônus Legend Pack (1000c)

Recompensas de Pack são convertidas ao valor de crédito equivalente enquanto o sistema de inventário de packs não está implementado. Os créditos são creditados imediatamente no claim.

---

## 6. Missões

Sistema completo funcionando:
- **Daily** — reset automático a cada 24h
- **Weekly** — reset toda segunda-feira
- **Lifetime** — missões progressivas multi-estágio (Bronze → Diamante)

Progresso salvo no banco (tabelas `mission_progress`, `achievement_progress`). Incremento automático após match, abertura de pack, etc.

Recompensas de missão: XP, Créditos, Fragmentos, Packs (crédito equivalente).

---

## 7. Reward Engine

Recompensas fluem por uma única lógica:

| Fonte | Recompensa | Mecanismo |
|-------|-----------|-----------|
| Vitória no match | Créditos variáveis | `playMatchAction` → `creditSoftCurrency` |
| Daily Login | Créditos / Pack equiv | `claimDailyLoginAction` |
| Missões | XP / Créditos / Frags | `claimMissionRewardAction` |
| Packs (novos) | Carta adicionada | `openPackAction` → `create user_card` |
| Packs (duplicata) | Fragmentos | `openPackAction` → `creditFragments` |

---

## 8. Bugs corrigidos neste sprint

- **Pack rewards no Daily Login ignorados** — recompensas `kind === 'pack'` não eram creditadas. Corrigido: crédito equivalente ao valor do pack.
- **Duplicatas sem conversão** — `openPackAction` criava user_cards mesmo para cartas já possuídas. Corrigido: duplicatas → fragmentos automáticos.
- **4 packs bloqueados** — Starter, National, Hero, GOAT estavam apenas como display. Agora totalmente funcionais com drop tables reais.
- **Fragmentos sem exibição** — saldo de fragmentos não aparecia na UI. Corrigido: exibido na tela de Packs.

---

## Próximos passos

- **Inventário de packs** — armazenar packs ganhos (daily login, missões) para abertura posterior
- **Event Pack** — requer moeda Gemas + evento ativo
- **Season Pass Pack** — requer sistema de passe de temporada
- **Gemas** — fonte de ganho e gasto de `hard_currency`
- **Craft** — usar Fragmentos para craftar cartas específicas (infra de DB já existe)
- **Marketplace** — compra/venda de cartas com Créditos
