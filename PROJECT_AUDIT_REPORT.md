# PROJECT_AUDIT_REPORT.md

**Data:** 2026-07-07
**Escopo:** Auditoria read-only do backend de packs (nenhuma feature nova, nenhuma correção aplicada nesta etapa). Todas as evidências abaixo vêm de leitura de código, migrations, e consultas diretas ao Supabase de produção (`hrrlsggssnjrsjbgwkda`) e ao Vercel — não são suposições.

---

## Resumo executivo (causa raiz)

Packs "não funcionam" não é um único bug — é uma cadeia de 3 problemas independentes, todos confirmados:

1. **O catálogo de jogadores/cartas nunca existiu no banco.** As tabelas `players`, `cards`, `rarities` do Supabase estão com **0 linhas**. O jogo usa um catálogo 100% em código (`apps/web/lib/collection-data.ts` + `catalog-seeds.ts`) — as tabelas do Postgres são vestígio de um design antigo e nenhum código do app as consulta.
2. **Bug de geração: 243 de 574 cartas do catálogo em código são descartadas silenciosamente.** `MASTER_CATALOG.md` documenta faixas de OVR por raridade diferentes das faixas realmente validadas em `packages/cards/src/rarity/rarity.ts`. Toda vez que uma carta gerada cai fora da faixa real, `createCard()` retorna erro e o loop de registro (`collection-data.ts:860`) descarta silenciosamente (`if (result.ok) cardCatalog.register(...)`, sem `else`, sem log). Resultado: só **331 de 574 cartas (57,7%)** ficam realmente disponíveis no jogo. A raridade **Rara é a mais afetada: sobrevivem só 6 de 72 (8%)**.
3. **Nenhuma abertura de pack jamais foi concluída em produção.** As tabelas `user_cards`, `pack_openings`, `squads`, `matches`, `mission_progress`, `pity_counters` estão todas com **0 linhas**, mesmo havendo 5 perfis reais cadastrados. Ou seja: ninguém nunca completou uma abertura de pack com sucesso no ambiente atual — não há evidência de erro travando no meio, há evidência de que **nunca terminou**.

Bônus (achado não pedido, mas crítico): existe um **segundo projeto Vercel órfão** ("web", ligado por `apps/web/.vercel/`) com build quebrado há 4 dias (`No Next.js version detected`). Ele **não é** o domínio de produção real — o projeto correto é `world-legends` (`world-legends.vercel.app`), que está `Ready` e no ar, deployado 9h atrás com o commit `d7407ac8` (inclui todos os fixes de pack de 06/07 + a expansão de catálogo). Isso pode confundir qualquer debug futuro via `vercel ls` se rodado de dentro de `apps/web/`.

---

## Respostas às 12 perguntas

### 1. Quantos jogadores existem realmente na tabela `players`?
**0.** Confirmado via Supabase REST (`Content-Range: */0`). A tabela existe (criada em `20260101000001_initial_schema.sql:41`) mas está vazia e nenhum código do app grava ou lê dela (`grep` por `.from('players')` em todo `apps/web` e `packages`: zero ocorrências).

### 2. Quantos `CreatePlayerInput` existem no código?
O tipo/padrão `CreatePlayerInput` aparece em 2 arquivos (`packages/cards/fixtures/historical-players.ts`, `packages/cards/src/player/player.ts`), mas o que importa é quantos **seeds de jogador** existem: **574** — 16 hand-crafted em `collection-data.ts` (`PLAYER_SEEDS`) + 558 gerados em `catalog-seeds.ts` (`ALL_PLAYER_SEEDS`). `MASTER_CATALOG.md` (linha 18) declara **576** como total pretendido — faltam 2 jogadores que nunca foram convertidos em seed (gap pequeno, não investigado a fundo).

Desses 574, **os 574 registram como `Player` com sucesso** (nenhuma falha de validação de jogador). O problema está inteiramente na etapa de `createCard()` (ver item 6).

### 3. A seed foi executada?
Depende do que se entende por "seed":
- **Seed no banco (SQL):** nunca foi executada — não existe. Ver item 4.
- **Seed em código (`catalog-seeds.ts`):** é executada **em runtime, a cada processo**, via `ensureInitialized()` (`collection-data.ts:791`). Mas só 331/574 cartas sobrevivem à validação (item 6).

### 4. Existe `seed.sql`?
**Não.** Busquei por `seed.sql` em todo o repositório — zero resultados. O que existe com "seed" no nome:
- `supabase/migrations/20260629000001_collection_sets_seed.sql` — seed de **sets de coleção/badges**, não de jogadores/cartas.
- `packages/shared/src/seed/seed.ts` — é um Value Object de **seed de RNG** (determinismo de `mulberry32`), não relacionado a dados de jogador.
- `apps/web/lib/catalog-seeds.ts` — é o catálogo de jogadores em **TypeScript**, não SQL.

### 5. O Supabase possui as 576 cartas?
**Não — zero.** `cards` e `players` no Supabase têm 0 linhas (mesma consulta REST do item 1). As "576" (na prática 574, e 331 funcionais) só existem em código, nunca foram escritas no Postgres.

### 6. Os packs conseguem montar pools para todas as raridades?
Globalmente sim, mas de forma desigual e frágil:

| Raridade | Cartas no catálogo funcional |
|---|---|
| common | 31 |
| rare | **6** |
| elite | 46 |
| legendary | 101 |
| ultra | 72 |
| world_cup_hero | 75 |

Nenhuma raridade está **globalmente** zerada. Mas com filtro de nacionalidade (Brazil/National Pack, `nationalityFilter: 'BR'`), **rare = 0 jogadores brasileiros**. Nesse caso, `openPackAction` (`packs.ts:182-190`) cai no `globalFallback`, que **não respeita o filtro de nacionalidade** — ou seja, o Brazil Pack pode entregar carta de jogador não-brasileiro sempre que a raridade sorteada for "rare", quebrando a promessa do pack silenciosamente (sem erro visível).

Causa raiz do pool de "rare" ser tão fino: ver item 8 abaixo (mesma causa do item 2).

### 7. Existe alguma raridade sem jogadores?
Sim, no recorte por nacionalidade: **rare + BR = 0**. Nenhuma raridade está zerada no catálogo global.

### 8. Existe algum erro nas server actions de `openPackAction`?
Sim, um defeito concreto encontrado por leitura de código (`apps/web/lib/actions/packs.ts`):

- **`recordOpening()` (linha ~282-287) não verifica o `Result` retornado e não tem `.catch()`** — diferente dos outros dois efeitos "fire-and-forget" na mesma função (`creditFragments` linha 253-260 e `savePityState` linha 271-278), que reportam falha via `crash.captureError`. Se `recordOpening` falhar (RLS, constraint, etc.), a linha em `pack_openings` simplesmente nunca é gravada — sem log, sem Sentry, sem sinal nenhum.
- O `try/catch` externo (`packs.ts:110-117`, adicionado no commit `e36a9f69`) está correto e devolve `{ok:false, error}` para exceções — isso já foi corrigido em 06/07 e funciona.
- **Causa raiz de "rare" ter só 6 cartas disponíveis:** `MASTER_CATALOG.md` (linhas 736-747) documenta faixa de OVR "rare: 68-78", mas `packages/cards/src/rarity/rarity.ts:34-84` define a faixa real como **73-81** (mais estreita e mais alta). As cartas geradas em `catalog-seeds.ts` foram calibradas para a faixa do documento, não para a faixa real do código — então a maioria fica abaixo do piso real e `createCard()` rejeita (`card.ts:142-149`, invariante de `isOverallInRange`). Reproduzi a fórmula exata (`calculateOverall` × `attributeMultiplier` de cada raridade) e os números batem exatamente com o que sobra em runtime (31/31 common, 6/70 rare, 46/116 elite, 101/160 legendary, 72/108 ultra, 73/73 WCH).

### 9. O banco possui `user_cards`?
A **tabela existe** e está com o schema correto (`card_id` é `text` desde a migration `20260706000002_fix_card_id_text.sql`, compatível com os IDs de string do catálogo em código). Mas está **vazia — 0 linhas** em produção.

### 10. As cartas abertas realmente são gravadas?
**Não há evidência de que sim, nem de que não** — porque **nenhuma abertura de pack jamais foi registrada em produção** (0 em `user_cards`, 0 em `pack_openings`). O caminho de código (`cardRepo.create` → insert real no Postgres com tipos corretos) parece estruturalmente correto na leitura, mas isso nunca foi exercitado com sucesso no ambiente atual. As 2 contas com saldo diferente do padrão (500) — `felipeameno3` com 650 e `felipe4` com 1700 — têm saldo **maior**, não menor, o que é inconsistente com "comprou pack e não recebeu carta" (que debitaria) e mais consistente com créditos de teste/missão/login anteriores a este deploy.

### 11. Existe algum erro no `revalidatePath`?
**Não, já foi corrigido.** Commit `14cd95e3` (06/07) removeu `revalidatePath('/', 'layout')` de dentro da server action (causava erro genérico de render de Server Components no Next 15 quando o re-render pós-revalidate falhava) e moveu a atualização de dados para um `router.refresh()` no cliente, depois do reveal. Confirmei que `packs.ts` atual não tem nenhuma chamada a `revalidatePath`.

### 12. Este relatório.
Este arquivo.

---

## O que existe, o que falta, o que precisa ser executado

### Existe e funciona
- Schema do Supabase para `profiles`, `user_cards`, `pack_openings`, `squads`, `squad_slots`, `matches`, `mission_progress`, `pity_counters`, `card_favorites` (recém-criada) — todos corretos e alinhados com os tipos usados em código.
- Motor de pacotes (`@world-legends/packs`, `openPack()`, pity, fragmentos) — lógica determinística, parece correta.
- `openPackAction`: verificação de saldo antes de mutar, criação de `user_cards`, débito de créditos, compensação se débito falhar, captura de erro com try/catch externo, telemetria de missão em background.
- Deploy de produção real (`world-legends.vercel.app`) está no ar, `Ready`, rodando o commit mais recente antes desta sessão (`d7407ac8`).

### Falta / está quebrado
1. **Descompasso de faixas de OVR entre `MASTER_CATALOG.md` e `packages/cards/src/rarity/rarity.ts`** — causa a perda silenciosa de 243 cartas (43% do catálogo), sendo `rare` a raridade mais destruída (92% de perda).
2. **Registro de catálogo silencioso demais** — `if (result.ok) register(...)` sem `else`/log em `collection-data.ts:813` e `:860` esconde qualquer falha futura do mesmo tipo. Não há telemetria nem teste que detecte regressão nesse número.
3. **`recordOpening()` sem verificação de erro** em `packs.ts` — ponto cego de observabilidade.
4. **Brazil/National Pack quebra sua própria garantia de nacionalidade** quando a raridade sorteada não tem pool BR (hoje: `rare`), caindo num fallback global sem filtro.
5. **Nenhuma abertura de pack, squad, ou partida foi concluída em produção** — não há confirmação empírica de que o fluxo funciona ponta a ponta neste ambiente/deploy específico; só há evidência de código lido, não de execução real bem-sucedida.
6. **Squad e Match não foram auditados nesta passada** (fora do escopo das 12 perguntas, que eram só sobre packs) — as tabelas existem e estão vazias, mas isso pode ser só porque nada foi testado ainda, não necessariamente porque há bug lá. Recomendo uma auditoria dedicada depois que packs estiver confirmado funcionando.
7. **Projeto Vercel "web" órfão e quebrado** (`apps/web/.vercel/`) — não afeta produção real, mas é ruído/risco de confusão em debug futuro.

### O que precisa ser executado (nenhuma ação abaixo foi tomada — apenas diagnosticada)
- **Código:** recalibrar `catalog-seeds.ts` (558 cartas geradas) contra as faixas reais de `rarity.ts`, ou alinhar `rarity.ts`/`MASTER_CATALOG.md` para a mesma fonte de verdade — decisão de produto, não só técnica (qual conjunto de faixas é o "certo"?).
- **Código:** adicionar log/telemetria no branch `else` de `collection-data.ts:813`/`:860` para nunca mais esse tipo de perda ser silenciosa.
- **Código:** tratar o retorno de `recordOpening()` em `packs.ts` como os outros dois fire-and-forget (`crash.captureError` em caso de erro).
- **Código:** decidir o comportamento do National Pack quando o pool nacional-filtrado de uma raridade está vazio (bloquear a raridade, redistribuir peso, ou aceitar fallback global mas avisar/logar).
- **Nenhuma migration SQL pendente para as tabelas de gameplay** — o schema já está correto; o problema é 100% em código de aplicação e dados de seed, não em DDL.
- **Teste manual end-to-end**: abrir 1 pack de cada tipo logado como usuário real em produção, e confirmar que aparece linha em `user_cards` e `pack_openings` — isso hoje nunca foi confirmado.
- **Limpeza (não urgente):** desvincular ou apagar o projeto Vercel "web" órfão para não confundir futuras investigações.
