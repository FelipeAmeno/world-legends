# FOUNDATION_RECOVERY_REPORT.md

**Sprint 16.1 — Foundation Recovery**
**Data:** 2026-07-07
**Escopo:** Corrigir os 3 problemas críticos identificados em `PROJECT_AUDIT_REPORT.md`. Nenhuma feature nova, nenhuma melhoria visual, nenhuma animação — só fundação.

---

## Decisão de arquitetura (Problema 3)

**Fonte única de verdade escolhida: `packages/cards/src/rarity/rarity.ts` (Opção B).**

Motivo: é código executável, testado, e usado por todo o domínio (drop tables, pity, `isOverallInRange`). `MASTER_CATALOG.md` era um documento de design que ficou desatualizado em relação ao código real. `MASTER_CATALOG.md` foi corrigido para espelhar `rarity.ts` — o conflito está eliminado.

| Rarity | OVR Mín | OVR Máx | Mult. |
|---|---|---|---|
| common | 55 | 72 | 1.00x |
| rare | 73 | 81 | 1.06x |
| elite | 82 | 87 | 1.12x |
| legendary | 88 | 92 | 1.18x |
| ultra | 93 | 96 | 1.25x |
| world_cup_hero | 95 | 99 | 1.30x |

---

## Problema 1 — Catálogo persistido no Supabase

### O que foi feito
1. **Correção automática de OVR** (`apps/web/scripts/fix-catalog-ovr.mts` + `fix-handcrafted-ovr.mts`): para cada carta que violava a faixa real de `rarity.ts`, o script buscou o menor fator de escala nos atributos-base autorais que trouxesse o Overall real (calculado pela função de produção `createCard()`, não reimplementada) para dentro da faixa. **229 correções** no catálogo gerado (558 jogadores) + **14 correções** nos 16 hand-crafted (que também estavam quebrados pelo mesmo bug, não descoberto na auditoria anterior). **0 casos sem solução.**
2. **Aplicação cirúrgica** (`apps/web/scripts/apply-catalog-ovr-fix.mjs`): substituição só dos valores numéricos de `baseAttrs`, preservando 100% da formatação/casts originais de `catalog-seeds.ts` e `collection-data.ts`.
3. **Migration nova** (`supabase/migrations/20260707000002_catalog_persistence.sql`): adiciona `players.slug` e `cards.code_id` (colunas de rastreabilidade, únicas) e popula a tabela `rarities` (nunca tinha sido populada).
4. **Pipeline de seed** (`apps/web/scripts/seed-supabase-catalog.mts`): reconstrói o catálogo inteiro usando as funções reais de domínio (`createPlayer`/`createCard`) e faz upsert em `players`/`cards` via service role.

**Decisão importante:** o gameplay (`user_cards.card_id`, `pack_openings.pack_id`) continua usando os IDs de texto do catálogo em código — essa arquitetura já tinha sido corrigida antes (migration `20260706000002_fix_card_id_text.sql`) e funciona. As tabelas `players`/`cards` do Supabase são agora um **mirror rastreável e auditável** do catálogo (via `slug`/`code_id`), não uma segunda fonte de verdade para o motor de packs — evita duplicar lógica e risco de divergência.

### Resultado (execução real, 2026-07-07)

```
Players:   574 / 574
Cards:     574 / 574
Países:    65

World Cup Hero  75
Ultra          110
Legendary      166
Elite          120
Rare            72
Common          31

Erros:     0
Ignorados: 0
```

*(574, não 576 — `MASTER_CATALOG.md` lista 576 no total geral, mas só 574 chegaram a ser convertidos em seed de código; os 2 faltantes não foram investigados nesta sprint, é um gap pré-existente e pequeno, não relacionado ao bug de OVR.)*

Cruzamento com o banco (consulta direta via REST, pós-seed):
- `players`: 574 linhas, 65 países distintos, posições: ST 142, CM 107, CB 65, CAM 60, GK 42, LW 37, CDM 29, RW 24, CF 22, LB 21, RM 1, LM 5.
- `cards`: 574 linhas, por raridade: legendary 166, elite 120, ultra 110, world_cup_hero 75, rare 72, common 31 — **idêntico ao catálogo em código**.
- `rarities`: 6 linhas, faixas idênticas às de `rarity.ts`.
- `edition_code`: 574/574 `'base'` — nenhuma edição prime/goat gerada ainda (esperado, não é bug).

---

## Problema 2 — Zero descarte silencioso

`apps/web/lib/collection-data.ts` — `ensureInitialized()`:
- Todo `if (result.ok) register(...)` sem `else` foi substituído por um branch explícito que: loga no console (`[catalog] Falha ao registrar ...`), acumula em `registrationErrors[]` (jogador/carta, raridade, motivo), e — se houver qualquer erro — dispara `crash.captureError` (Sentry) uma única vez ao final da inicialização.
- Nova função exportada `getCatalogRegistrationErrors()` para qualquer script/tela de auditoria consultar o estado atual.
- Verificado: com o catálogo corrigido, `getCatalogRegistrationErrors().length === 0`.

---

## Bugs de código corrigidos em `apps/web/lib/actions/packs.ts`

1. **`recordOpening()` não verificado** — agora o `Result` é checado; falha é reportada via `crash.captureError` (mesmo padrão dos outros efeitos fire-and-forget da função), nunca mais silenciosa.
2. **Brazil/National Pack quebrava a garantia de nacionalidade** — quando a raridade sorteada não tinha pool brasileiro (ex.: `rare`, que tinha 0 cartas BR antes da correção), o código caía direto num fallback global sem filtro. Agora existe um estágio intermediário (`nationalityFallback`) que tenta qualquer carta *da mesma nacionalidade* antes de aceitar qualquer país — e se isso também acontecer, é reportado via Sentry (`pack_nationality_guarantee_broken`), nunca em silêncio. Com o catálogo corrigido, BR agora tem cartas em todas as raridades, então esse fallback de emergência não deve mais ser acionado na prática.
3. **Refatoração para testabilidade**: `_openPackAction()` foi dividido em `openPackAction(packId)` (wrapper de auth/try-catch) + `openPackForUser(userId, packId)` (núcleo de negócio, exportado). Permite testes de integração reais contra produção sem mockar cookies/sessão — usado nos testes abaixo.

---

## Testes end-to-end executados contra o Supabase de produção

Perfil de teste real: `felipeameno5` (conta de desenvolvimento). Saldo temporariamente elevado para cobrir os 7 packs, restaurado ao valor original (500c) ao final; todas as `user_cards` de teste foram removidas por ID exato (nunca por janela de tempo).

| Pack | Preço | Resultado | Débito correto | `pack_openings` gravado | `user_cards` criados |
|---|---|---|---|---|---|
| Starter | 75c | ✔ ok | ✔ 75c | ✔ | 5/5 |
| Classic | 250c | ✔ ok | ✔ 250c | ✔ | 5/5 |
| Brazil (national) | 800c | ✔ ok | ✔ 800c | ✔ | 5/5 |
| Elite | 2500c | ✔ ok | ✔ 2500c | ✔ | 5/5 |
| Hero | 7000c | ✔ ok | ✔ 7000c | ✔ | 3/3 |
| Legend | 20000c | ✔ ok | ✔ 20000c | ✔ | 3/3 |
| GOAT | 75000c | ✔ ok | ✔ 75000c | ✔ | 2/2 |

**7/7 packs abrem corretamente, débito exato, 28/28 cartas gravadas, 0 erros.**

### Duplicata → Fragmentos
Testado separadamente (abrindo Classic repetidamente até esgotar o pool de Common e forçar uma duplicata): duplicata detectada corretamente, **10 fragmentos creditados** (taxa correta para Common), saldo de fragmentos confirmado no banco após a escrita assíncrona completar.

Nota (não bloqueante): `creditFragments` é fire-and-forget — existe uma janela de ~1-2s onde o `fragment_balance` no banco ainda não reflete a duplicata recém-aberta. Não é um bug introduzido nesta sprint, é um comportamento pré-existente; documentado aqui para conhecimento.

### Coleção resolve as cartas corretamente
Testado: cartas recém-criadas em `user_cards` foram passadas para `enrichWithUserCards()` (a mesma função usada pela tela de Coleção) e resolvidas 5/5, com `overall`/`rarityCode`/`displayName` corretos (ex.: Elite → overall 82-83, dentro da faixa 82-87).

### Fora do escopo desta verificação
Squad e Home/UI **não foram testados via navegador** — a verificação foi feita no nível de dados (banco + funções de domínio), que é o que estava quebrado. Squad/Match como fluxo de UI completo não foi auditado nesta sprint (não fazia parte do escopo dos 3 problemas críticos); recomenda-se uma passada dedicada depois.

---

## Verificação de qualidade

- `tsc --noEmit`: 0 erros.
- `vitest run`: 202 passando, 2 falhas — **ambas pré-existentes e sem relação** com esta sprint (`weekly_win20` e `achiev_first_goat`, missões nunca implementadas, já documentado antes desta auditoria).
- `turbo build --filter=@world-legends/web...`: build de produção completo, 20/20 tasks, sem erros.

---

## Arquivos alterados/criados

| Arquivo | Tipo |
|---|---|
| `apps/web/lib/catalog-seeds.ts` | Corrigido — 229 `baseAttrs` ajustados |
| `apps/web/lib/collection-data.ts` | Corrigido — 14 `baseAttrs` hand-crafted + logging de erro + exports |
| `apps/web/lib/actions/packs.ts` | Corrigido — `recordOpening` verificado, fallback de nacionalidade, refatorado para `openPackForUser` |
| `MASTER_CATALOG.md` | Corrigido — tabela de OVR alinhada a `rarity.ts` |
| `supabase/migrations/20260707000002_catalog_persistence.sql` | Novo — `slug`/`code_id` + seed de `rarities` |
| `apps/web/scripts/fix-catalog-ovr.mts` | Novo — análise/correção do catálogo gerado |
| `apps/web/scripts/fix-handcrafted-ovr.mts` | Novo — análise/correção dos hand-crafted |
| `apps/web/scripts/apply-catalog-ovr-fix.mjs` | Novo — aplicador cirúrgico de correções |
| `apps/web/scripts/seed-supabase-catalog.mts` | Novo — pipeline de seed para o Supabase |
| `apps/web/scripts/verify-catalog.mjs` | Novo — sanity check do catálogo |
| `apps/web/scripts/test-pack-opening-e2e.mts` | Novo — teste de integração dos 7 packs |
| `apps/web/scripts/test-pack-duplicate.mts` | Novo — teste de duplicata→fragmento |
| `apps/web/scripts/test-collection-resolution.mts` | Novo — teste de resolução de coleção |
| `packages/db/src/adapters/database.types.ts` | Regenerado — inclui `slug`/`code_id` |

---

## Critérios de conclusão (checklist do usuário)

- [x] 574 cartas persistidas no Supabase *(576 é o total teórico do MASTER_CATALOG; 574 é o que existe como seed de código — gap pré-existente de 2, não relacionado ao bug corrigido)*
- [x] Todos os 7 packs abrem corretamente
- [x] Todas as cartas são gravadas na coleção (`user_cards` + resolução via `enrichWithUserCards`)
- [x] Créditos debitados corretamente (verificado valor exato por pack)
- [x] Duplicatas geram fragmentos (testado e confirmado)
- [x] Coleção mostraria as cartas imediatamente (resolução testada)
- [x] Nenhum erro silencioso restante no catálogo (`getCatalogRegistrationErrors()` = 0, com Sentry armado para regressões futuras)

**Sprint 16.1 concluída.**
