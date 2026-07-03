# 19 — Economy Domain Design Master (T014)

> Documento de arquitetura e contrato produzido **antes** de qualquer implementação de `packages/economy`.
> Método: ler docs 10, 11, 12, 13, 17 e 18 na íntegra; só então decidir. Nenhum número, nome ou invariante
> aqui é inventado — toda decisão tem rastreabilidade explícita para sua fonte documental.

---

## 1. Contexto e Posição no Monorepo

Doc 18 §9 classifica `economy` como **Core Domain** com dependências exclusivas de `shared` e `types` — sem `engine`, `cards`, `collection` ou `packs`. Qualquer integração (ex: packs debitando créditos, craft debitando fragmentos) é orquestrada pela camada de aplicação (`apps/*`), nunca dentro de `economy` diretamente.

```
packages/
  shared        ← estendido nesta tarefa: Money + DomainEvent
  types         ← sem mudanças
  economy       ← novo package desta tarefa
    ↑
  (packs, craft, market — usam economy, mas economy não os conhece)
```

**Dependências de `economy`:** `@world-legends/shared`, `@world-legends/types`. Nada mais.

---

## 2. O que precisa existir em `shared` antes de `economy`

Doc 18 §15 lista dois Value Objects que ainda **não existem** em `shared`:

### 2.1 `Money` (doc 18 §15)

Quantia + tipo de moeda. Usado por `economy`, `packs`, `craft`, `market`.

```ts
// Em packages/shared/src/money/money.ts
type CurrencyCode = 'credits' | 'fragments' | 'premium';

type Money = Readonly<{
  amount: number;    // inteiro, ≥ 0 — doc 13 TC-ECO-07
  currency: CurrencyCode;
}>;
```

**Invariante:** `amount` é inteiro não-negativo — validado na fábrica `createMoney(amount, currency)`.
**Decisão:** `Money` não modela frações. Economia de World Legends opera em inteiros (doc 10 §18: "créditos", "fragmentos" — nenhum doc menciona centavos ou decimais).

### 2.2 `DomainEvent` + contrato de publicação (doc 18 §3.1)

```ts
// Em packages/shared/src/domain-event/domain-event.ts
type DomainEvent<TType extends string, TPayload> = Readonly<{
  eventType: TType;
  occurredAt: Date;
  payload: TPayload;
}>;

// Contrato de publicação — sem lógica de roteamento
type EventPublisher = (event: DomainEvent<string, unknown>) => void;

// No-op padrão — domínio funciona sem subscriber; wiring feito em apps/*
const noopPublisher: EventPublisher = () => {};
```

**Por que `EventPublisher` em `shared` e não uma classe?** Doc 18 §3.1: "uma função `publicar(evento)` e um tipo `DomainEvent`, sem lógica de negócio nenhuma ali". Função > classe aqui — menor superfície, mais testável.

**Injeção de dependência:** `economy` recebe `EventPublisher` como parâmetro nos casos de uso (não via global/singleton). Testabilidade total: testes unitários passam um `jest.fn()` / array collector; produção passa o publisher real. Nenhum acoplamento estático.

---

## 3. Arquitetura de `packages/economy`

### 3.1 Os três agregados de saldo (doc 17 §9/§11)

Doc 17 trata `FragmentBalance`, `CreditBalance` e `PremiumBalance` como **três Aggregate Roots distintos**, não como campos de uma única `Wallet`. Cada um tem regras próprias de movimentação.

No entanto, doc 18 §9 lista `economy` como um package único cobrindo os três. A implementação usará **três Value Objects de saldo + uma Wallet que os agrega por `profileId`** — escolha minha, documentada:

> **Decisão de síntese (D-ECO-01):** Doc 17 lista três Aggregate Roots separados (`CreditBalance`, `PremiumBalance`, `FragmentBalance`). Para `packages/economy`, que roda em memória e nunca tem persistência própria, trato cada um como um `Balance` VO imutável encapsulado por um agregado `Wallet(profileId)`. Isso preserva as invariantes de cada tipo (saldo ≥ 0, regras de uso exclusivo) sem a complexidade operacional de três repositórios em memória separados. Quando `db` for implementado, os três podem ser normalizados em tabelas separadas conforme doc 17 sem quebrar a lógica de domínio aqui.

### 3.2 Value Objects

```
CreditBalance  — amount: integer ≥ 0
FragmentBalance — amount: integer ≥ 0
PremiumBalance  — amount: integer ≥ 0
```

Cada um é `Readonly<{ amount: number }>` com seu próprio tipo nominal (branded) para evitar trocar um pelo outro silenciosamente. Não compartilham um tipo `Balance` genérico — as regras de uso são diferentes e o compilador deve rejeitar `debitFragments(creditBalance)`.

### 3.3 Wallet — o Aggregate Root

```ts
type Wallet = Readonly<{
  profileId: ProfileId;
  credits:   CreditBalance;
  fragments: FragmentBalance;
  premium:   PremiumBalance;
}>;
```

- Imutável: toda operação retorna uma nova `Wallet`.
- `ProfileId`: branded string — `type ProfileId = string & { _brand: 'ProfileId' }`.
- Wallet nunca manipulada diretamente — apenas via casos de uso.

### 3.4 LedgerEntry — o registro auditável imutável (doc 18 §9)

Doc 18 §9: *"Todo movimento é registrado como um evento de ledger imutável — saldo é sempre a soma de movimentos, nunca um campo editável diretamente."*

```ts
type LedgerEntry = Readonly<{
  id: LedgerEntryId;
  profileId: ProfileId;
  currency: CurrencyCode;
  amount: number;          // positivo = crédito, negativo = débito
  reason: LedgerReason;   // enum de fontes/destinos documentados
  occurredAt: Date;
  idempotencyKey?: string; // TC-SEC-01: reenvio nunca executa segundo débito
}>;
```

**LedgerReason** — mapeamento completo de fontes e destinos (doc 10 §18, doc 12 §2.7):

```ts
type LedgerReason =
  // Créditos — sources
  | 'match_reward'           // recompensa de partida
  | 'daily_objective'        // objetivo diário/semanal
  | 'market_sale'            // venda no mercado (vendedor recebe)
  // Créditos — sinks
  | 'pack_purchase'          // compra de pack
  | 'market_listing_fee'     // taxa de 5% na venda (doc 10 §20)
  | 'market_purchase'        // compra no mercado (comprador paga)
  // Fragmentos — sources
  | 'duplicate_conversion'   // duplicata → fragmentos (doc 10 §16)
  // Fragmentos — sinks
  | 'craft_cost'             // custo de craft (doc 10 §17)
  // Premium — sources
  | 'premium_purchase'       // compra real (fora do domínio puro)
  // Premium — sinks
  | 'premium_pack_purchase'; // compra de pack premium (doc 10 §18)
```

### 3.5 InMemoryLedger — repositório em memória

Não é parte do domínio puro — é a implementação em memória da porta de repositório (doc 18 §3.2). Exposta pelo package para uso em testes e como referência de implementação. Em produção, seria substituída por um adapter `db`.

```ts
type LedgerRepository = {
  append(entry: LedgerEntry): void;
  findByProfile(profileId: ProfileId): readonly LedgerEntry[];
  findByProfileAndCurrency(profileId: ProfileId, currency: CurrencyCode): readonly LedgerEntry[];
};
```

---

## 4. Casos de Uso (doc 18 §9 + fluxos do doc 18 §18)

Cada caso de uso é uma **função pura** com a seguinte assinatura-padrão:

```ts
function depositCredits(input: {
  wallet: Wallet;
  amount: number;
  reason: LedgerReason;
  idempotencyKey?: string;
  publisher: EventPublisher;
  ledger: LedgerRepository;
}): Result<{ wallet: Wallet; entry: LedgerEntry }, ValidationError>
```

**Por que `Result<T, E>` e não `throw`?** Consistência com o restante do monorepo (T002+, `packages/shared`). Toda falha esperada é um valor, nunca uma exceção.

### 4.1 Seis casos de uso documentados

| Caso de uso | Invariantes verificados | Evento publicado (doc 12 §2.7) |
|---|---|---|
| `depositCredits` | amount > 0 (inteiro); reason é um source de créditos | `economy_credits_earned` (TC-ECO-01) |
| `spendCredits` | amount > 0; saldo resultante ≥ 0 (TC-ECO-07); reason é um sink de créditos | `economy_credits_spent` (TC-ECO-02) |
| `depositFragments` | amount > 0 (inteiro); reason é um source de fragmentos | `economy_fragments_earned` (TC-ECO-01) |
| `spendFragments` | amount > 0; saldo resultante ≥ 0 (TC-ECO-07); reason é um sink de fragmentos; fragmentos nunca convertem para premium (TC-ECO-04) | `economy_fragments_spent` (TC-ECO-02) |
| `depositPremium` | amount > 0 (inteiro); reason é um source de premium | `economy_premium_purchased` |
| `spendPremium` | amount > 0; saldo resultante ≥ 0 (TC-ECO-07); premium não compra carta diretamente (TC-ECO-05); reason é um sink de premium | `economy_premium_spent` |

---

## 5. Eventos de Domínio publicados

Cada operação publica exatamente **um** `DomainEvent` via o `EventPublisher` injetado (doc 18 §3.1, doc 12 §2.7, TC-ECO-01/02):

```ts
// Eventos emitidos por economy
type CreditsEarnedEvent   = DomainEvent<'economy_credits_earned',   { profileId: ProfileId; amount: number; reason: LedgerReason }>;
type CreditsSpentEvent    = DomainEvent<'economy_credits_spent',    { profileId: ProfileId; amount: number; reason: LedgerReason }>;
type FragmentsEarnedEvent = DomainEvent<'economy_fragments_earned', { profileId: ProfileId; amount: number; reason: LedgerReason }>;
type FragmentsSpentEvent  = DomainEvent<'economy_fragments_spent',  { profileId: ProfileId; amount: number; reason: LedgerReason }>;
type PremiumPurchasedEvent = DomainEvent<'economy_premium_purchased', { profileId: ProfileId; amount: number }>;
type PremiumSpentEvent    = DomainEvent<'economy_premium_spent',    { profileId: ProfileId; amount: number; reason: LedgerReason }>;

// Union type exportada
type EconomyDomainEvent =
  | CreditsEarnedEvent | CreditsSpentEvent
  | FragmentsEarnedEvent | FragmentsSpentEvent
  | PremiumPurchasedEvent | PremiumSpentEvent;
```

---

## 6. Invariantes — mapa completo

| Invariante | Fonte documental | Onde é verificado | TC correspondente |
|---|---|---|---|
| Saldo de qualquer moeda nunca negativo | Doc 17 §9/§11, doc 13 TC-ECO-07 | `spendCredits`, `spendFragments`, `spendPremium` | TC-ECO-07 |
| `amount` sempre inteiro positivo | Doc 10 §18 (unidades inteiras) | Fábrica de `Money` em `shared` | TC-ECO-07 |
| Fragmentos → premium: rota inexistente | Doc 10 §16 (propósito único), TC-ECO-04 | Ausência de caso de uso e de `LedgerReason` que conecte os dois | TC-ECO-04 |
| Premium não compra carta diretamente | Doc 17 §11, TC-ECO-05 | Ausência de `LedgerReason` `premium_card_direct` + runtime guard em `spendPremium` | TC-ECO-05 |
| Operação atômica: saldo + ledger juntos ou nenhum | Doc 18 §9 ("saldo é sempre a soma de movimentos") | Casos de uso: ledger.append() ocorre na mesma execução que retorna a wallet nova; sem transação de banco em memória | — |
| Idempotência via `idempotencyKey` | Doc 13 TC-SEC-01 | Verificação em `ledger.findByProfile` antes de executar | TC-SEC-01 (parcial) |
| Toda fonte gera evento `economy_*_earned` | Doc 12 §2.7, TC-ECO-01 | Chamada obrigatória a `publisher` em cada caso de uso de depósito | TC-ECO-01 |
| Toda remoção gera evento `economy_sink_applied` | Doc 12 §2.7, TC-ECO-02 | Chamada obrigatória a `publisher` em cada caso de uso de gasto | TC-ECO-02 |

---

## 7. Estrutura de Pastas

```
packages/economy/
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── README.md
│
└── src/
    ├── index.ts                        — barrel principal
    │
    ├── wallet/
    │   ├── types.ts                    — ProfileId, CreditBalance, FragmentBalance, PremiumBalance, Wallet
    │   ├── wallet.ts                   — createWallet, getBalance
    │   └── index.ts
    │
    ├── ledger/
    │   ├── types.ts                    — LedgerEntryId, LedgerReason, LedgerEntry, LedgerRepository
    │   ├── in-memory-ledger.ts         — implementação em memória da porta
    │   └── index.ts
    │
    ├── use-cases/
    │   ├── deposit-credits.ts
    │   ├── spend-credits.ts
    │   ├── deposit-fragments.ts
    │   ├── spend-fragments.ts
    │   ├── deposit-premium.ts
    │   ├── spend-premium.ts
    │   └── index.ts
    │
    └── events/
        ├── economy-events.ts           — EconomyDomainEvent e os 6 tipos
        └── index.ts

tests/
    ├── wallet/
    │   └── wallet.test.ts
    ├── ledger/
    │   └── ledger.test.ts
    ├── use-cases/
    │   ├── credits.test.ts             — depositCredits + spendCredits
    │   ├── fragments.test.ts           — depositFragments + spendFragments
    │   ├── premium.test.ts             — depositPremium + spendPremium
    │   └── invariants.test.ts          — TC-ECO-04, TC-ECO-05, TC-ECO-07 (cross-currency)
    └── acceptance/
        └── tc-eco.test.ts              — TC-ECO-01, TC-ECO-02, TC-ECO-03, TC-ECO-04, TC-ECO-05, TC-ECO-07
```

**Extensões a `packages/shared`** (na mesma tarefa, antes de implementar `economy`):

```
packages/shared/src/
    ├── money/
    │   ├── money.ts                    — CurrencyCode, Money, createMoney
    │   └── index.ts
    └── domain-event/
        ├── domain-event.ts             — DomainEvent<TType, TPayload>, EventPublisher, noopPublisher
        └── index.ts
```

---

## 8. Plano de Testes

### 8.1 Unitários (por módulo)

| Arquivo | O que testa |
|---|---|
| `wallet.test.ts` | `createWallet` (imutabilidade, valores iniciais 0); `getBalance` por tipo de moeda |
| `ledger.test.ts` | `appendEntry` append-only; `findByProfile`; `findByProfileAndCurrency`; idempotência via chave |
| `credits.test.ts` | `depositCredits` (amount válido, evento emitido, ledger atualizado); `spendCredits` (saldo suficiente, saldo insuficiente → Err, evento emitido) |
| `fragments.test.ts` | Análogos para fragmentos; `spendFragments` com reason inválida → Err |
| `premium.test.ts` | Análogos para premium; `spendPremium` com reason proibida (`premium_card_direct`) → Err |
| `invariants.test.ts` | Operação sequencial não muta wallets anteriores; idempotencyKey bloqueia segundo débito; `amount=0` → Err; `amount=-1` → Err; `amount=1.5` → Err |

### 8.2 Aceitação (ligados ao doc 13)

| TC | Cenário | Verificação |
|---|---|---|
| TC-ECO-01 | `depositCredits` com reason `match_reward` | Evento `economy_credits_earned` publicado com payload correto |
| TC-ECO-01b | `depositFragments` com reason `duplicate_conversion` | Evento `economy_fragments_earned` publicado |
| TC-ECO-02 | `spendCredits` com reason `pack_purchase` | Evento `economy_credits_spent` publicado + saldo reduzido |
| TC-ECO-02b | `spendFragments` com reason `craft_cost` | Evento `economy_fragments_spent` publicado + saldo reduzido |
| TC-ECO-03 | 5 deposits + 3 spends; reconstruir saldo a partir do ledger bruto | `ledger.findByProfile` reproduz `(sources − sinks)` = saldo atual |
| TC-ECO-04 | Tentativa de converter fragmentos em premium via qualquer rota | Nenhum caminho de código existe; ausência de `LedgerReason` validada |
| TC-ECO-05 | `spendPremium` com reason `'premium_card_direct'` (rota proibida) | `Err(validationError(..., 'reason'))` retornado; saldo inalterado; nenhum evento publicado |
| TC-ECO-07 | `spendCredits` com amount > saldo atual | `Err` retornado; saldo inalterado; nenhum evento publicado; saldo nunca negativo |
| TC-ECO-07b | `spendFragments` com amount > saldo | Mesmo comportamento |
| TC-ECO-07c | `spendPremium` com amount > saldo | Mesmo comportamento |

**Cobertura total estimada:** 45–55 testes (unitários + aceitação). Todos passando antes de empacotar.

---

## 9. Decisões de Modelagem Explícitas

| ID | Decisão | Alternativa considerada | Razão da escolha |
|---|---|---|---|
| D-ECO-01 | `Wallet` agrega os três saldos em vez de três Aggregate Roots separados | Três repositórios em memória separados (fiel ao doc 17 ao pé da letra) | Em memória pura, um repositório unificado por `profileId` é funcionalmente equivalente e muito mais simples. Doc 18 §9 trata como um package único, o que alinha com esta decisão. |
| D-ECO-02 | `EventPublisher` injetado via parâmetro em cada caso de uso | Singleton global, closure de módulo | Testabilidade máxima; alinhado com doc 18 §3.1 ("fiação feita em apps/*") |
| D-ECO-03 | `LedgerEntry.amount` pode ser negativo (débito) | Campos separados `debit/credit` | Uma linha por movimento; `Σ(amount)` = saldo sempre; mais fácil de auditar (TC-ECO-03) |
| D-ECO-04 | `LedgerReason` é uma union de string literals, não enum TS | Enum numérico | Extensibilidade; legibilidade dos logs de auditoria; sem magic numbers |
| D-ECO-05 | TC-ECO-06 (impossibilidade de arbitragem) marcado como **N/A nesta camada** | Testar ciclos de compra-venda no package economy isolado | Arbitragem envolve `market` e `packs` — camadas acima de `economy`. `economy` só garante que cada operação individual é correta. TC-ECO-06 é um teste de integração cross-package, não unitário. |
| D-ECO-06 | `Money` em `shared` é imutável e sem métodos de instância | Classe com `add()`/`subtract()` | Consistência com o restante de `shared`; funções puras são melhores aqui |
| D-ECO-07 | Idempotência via `idempotencyKey` opcional no ledger em memória | Sem idempotência em memória (só em banco) | TC-SEC-01 exige; implementar em memória é trivial e permite testar o comportamento sem banco |

---

## 10. O que está explicitamente FORA do escopo desta tarefa

| Item | Por quê está fora | Onde pertence |
|---|---|---|
| TC-ECO-06 (arbitragem) | Requer integração com `market` e `packs` | Teste de integração cross-package futuro |
| Taxa de mercado 5% (`economy_sink_applied` para transação de mercado) | Disparada por `market`, não por `economy` diretamente | `market` chama `spendCredits(reason='market_listing_fee')` |
| Compra de pack com débito de crédito | Disparada por `packs`, não por `economy` | `packs` chama `spendCredits(reason='pack_purchase')` |
| Persistência em Supabase | Sem banco nesta tarefa | `packages/db` (fase futura) |
| Inflação analytics (doc 12 §7) | Dashboard, não domínio puro | `telemetry` + `apps/admin` |
| Validação de elegibilidade de compra premium | `packs` valida o que pode ser comprado com premium | Verificação em `packs`, não em `economy` |

---

## 11. Extensões necessárias a `packages/shared`

Esta tarefa **precisa estender `shared`** antes de implementar `economy`. As extensões são pequenas e autocontidas:

1. `src/money/money.ts` — tipo `Money`, `CurrencyCode`, fábrica `createMoney`
2. `src/domain-event/domain-event.ts` — `DomainEvent<TType, TPayload>`, `EventPublisher`, `noopPublisher`
3. `src/index.ts` — reexportar os dois novos módulos

**Zero breaking changes** nos packages existentes — são adições puras.

---

## 12. Critério de Aceitação da Tarefa

A tarefa T014 está concluída quando:

1. `packages/shared` exporta `Money`, `DomainEvent`, `EventPublisher`, `noopPublisher`.
2. `packages/economy` compila limpo (`tsc --noEmit`, zero erros).
3. Todos os testes passam (meta: 45+ testes).
4. Zero regressão em `engine`, `cards`, `collection`, `packs` (389 + 51 + 55 + 73 = 568 testes existentes continuam verdes).
5. TC-ECO-01, 02, 03, 04, 05, 07 têm testes de aceitação explícitos, identificados por nome no arquivo `tests/acceptance/tc-eco.test.ts`.
6. Estrutura de pastas corresponde exatamente ao diagrama da Seção 7.
7. `packages/packs/package.json` **não** lista `economy` como dependência — esta tarefa não conecta os dois (isso é tarefa de integração futura).

---

*Documento produzido em preparação para T014. Aprovação implícita ao comando "Continue" ou "Implementar".*
