# Sprint 1 — Hardening Report

**Data de início:** 2026-06-29  
**Data de conclusão:** 2026-07-04  
**Branch:** main  
**Objetivo:** Transformar World Legends em produto utilizável. Sem novas funcionalidades.

---

## Resumo Executivo

Sprint focada em confiabilidade e corretude. Seis problemas críticos/altos corrigidos:
atomicidade de transações, pity system funcional, proteção de rota de debug, observabilidade
de erros, créditos autoritativos no servidor, e feedback de saldo insuficiente.

**Código removido:** 6 arquivos mortos deletados (~900 LOC).  
**Testes adicionados:** 26 novos casos de teste (pity system + atomicidade).  
**Regressões introduzidas:** 0.

---

## P1 — Dashboard exposta em produção

**Severidade:** Crítica  
**Causa raiz:** A rota `/dashboard` não tinha nenhuma proteção de acesso. Qualquer usuário
autenticado podia acessar ferramentas de debug internas.

**Arquivo alterado:** `apps/web/app/dashboard/page.tsx`

**Correção:** `notFound()` condicionado a `process.env.NODE_ENV === 'production'` no topo
do Server Component, antes de qualquer renderização.

**Impacto:** Rota continua acessível em desenvolvimento para debug; em produção retorna 404.

---

## P2 — Abertura de pack sem atomicidade

**Severidade:** Alta  
**Causa raiz:** O fluxo original debitava créditos primeiro, depois criava as cartas. Se
a criação das cartas falhasse, o usuário perdia créditos sem receber cartas — sem rollback.

**Arquivo alterado:** `apps/web/lib/actions/packs.ts` (reescrita completa)

**Correção:** Ordem de operações invertida:
1. Validar saldo (fast-fail, sem mutação)
2. Criar cartas no banco
3. Debitar créditos
4. Se o débito falhar: `Promise.allSettled(cards.map(delete))` — compensação total

**Impacto:** Zero risco de usuário perder créditos sem receber cartas. Em caso de falha de
infra durante o débito, o usuário não é penalizado.

---

## P4 — Pity system nunca lia nem escrevia no banco

**Severidade:** Alta  
**Causa raiz:** `openPack` recebia um `createUserPityState()` zerado em toda abertura.
A tabela `pity_counters` existia no schema mas nunca era consultada ou atualizada.
O pity garantido (40 lendária, 120 ultra) era letra morta.

**Arquivo alterado:** `apps/web/lib/actions/packs.ts`

**Correção:** 
- `loadPityState()`: lê `pity_counters` via `SupabasePackRepository.getPityCounter()` para
  ambos os tipos (`legendary_plus`, `ultra_plus`) em paralelo antes de cada abertura
- `savePityState()`: após abertura, decide por `reset` ou `increment` via comparação de
  `packsSinceLastHit` antigo vs. novo; persiste assincronamente (fire-and-forget com
  captura de erro via Sentry)
- `updatePityAfterOpening()` chamado com a raridade mais alta obtida no pack

**Impacto:** Proteção de sorte documentada agora funciona corretamente. Usuários com
contadores acumulados na tabela verão a garantia acionada no timing correto.

---

## P6 — Erros de background silenciados

**Severidade:** Alta  
**Causa raiz:** Blocos `catch {}` vazios em `packs.ts` e `match.ts` descartavam exceções
de missões, achievements e sets sem nenhum registro. Falhas passavam invisíveis.

**Arquivos alterados:** `apps/web/lib/actions/packs.ts`, `apps/web/lib/actions/match.ts`

**Correção:** Todos os `catch {}` substituídos por `crash.captureError(e, { context, userId,
extras, level: 'warning' })`. O erro é enviado ao Sentry com contexto suficiente para triagem.

**Impacto:** Falhas de background agora aparecem no dashboard do Sentry com contexto completo.
A operação principal (abertura do pack, resultado do match) não é bloqueada.

---

## P7 — Créditos exibidos a partir de localStorage (GameContext)

**Severidade:** Alta  
**Causa raiz:** `PlayerHeader` lia créditos exclusivamente do `GameContext` (localStorage).
O saldo real do usuário (Supabase) nunca era consultado para a exibição na home. Usuários
viam créditos desatualizados ou da sessão anterior.

**Arquivos alterados:**
- `apps/web/app/page.tsx` — busca `getUserProfile()` no Server Component e passa `serverBalance`
- `apps/web/components/home/PremiumHome.tsx` — propaga `serverBalance: number`
- `apps/web/components/home/PlayerHeader.tsx` — aceita `serverBalance?: number`, usa como
  fonte autoritativa; fallback para `GameContext` apenas se prop ausente

**Impacto:** Home page sempre exibe o saldo real do banco. Não há mais discrepância entre
o que o usuário vê na home e o que o servidor valida na abertura de packs.

---

## P9 — Feedback de saldo insuficiente ausente

**Severidade:** Média  
**Causa raiz:** `handleChoosePack` retornava silenciosamente quando `balance < price`. O
usuário tocava no pack e nada acontecia — zero feedback.

**Arquivo alterado:** `apps/web/components/packs/PackExperience.tsx`

**Correção:**
- `const [insufficientFunds, setInsufficientFunds] = useState(false)` + `useEffect` de
  auto-limpeza em 3s
- `handleChoosePack` chama `setInsufficientFunds(true)` + `vibrate('packSelect')` quando
  saldo insuficiente
- Banner animado (`AnimatePresence` + `motion.div`) exibido abaixo do saldo na fase SELECT,
  com estilo vermelho semitransparente e borda

**Impacto:** Usuário recebe feedback visual e haptic imediatos quando tenta abrir um pack
sem créditos suficientes. Banner desaparece automaticamente em 3 segundos.

---

## Remoção de Código Morto

| Arquivo | Motivo |
|---------|--------|
| `components/packs/FlippableCard.tsx` | Substituído por `RevealedCard.tsx` (reescrita completa) |
| `components/packs/PackOpeningScreen.tsx` | Substituído por `PackExperience.tsx` |
| `components/packs/RevealGrid.tsx` | Substituído por `CardRevealScene.tsx` |
| `components/packs/SealedPackView.tsx` | Substituído por `PackFloatScene.tsx` |
| `lib/perf/audit.ts` | Não importado por nenhum módulo ativo |
| `lib/perf/memo.ts` | Não importado por nenhum módulo ativo |

---

## Testes Adicionados

**Arquivo:** `tests/lib/pack-action.test.ts` — 26 casos de teste

| Suite | Casos | Cobertura |
|-------|-------|-----------|
| `createPityCounter` | 4 | Construção, clipping de negativos, tipo preservado |
| `construção de UserPityState (P4)` | 3 | Novo usuário, carregamento de contadores do banco, fallback de erro |
| `savePityState — lógica de decisão (P4)` | 4 | Reset, increment, noop por comparação de contagens |
| `updatePityAfterOpening (P4)` | 7 | Cada raridade + imutabilidade |
| `isForced — limiares (doc 10 §15)` | 4 | Legendary (40) e Ultra (120), limiar exato e limiar-1 |
| `invariantes de atomicidade (P2)` | 4 | Saldo insuficiente, debit bem-sucedido, compensação, zero cartas |

---

## Falhas Pré-existentes (não introduzidas pela Sprint)

| Teste | Motivo |
|-------|--------|
| `weekly_win20` | ID de missão semanal épica ausente nas definições de `lib/mission-system.ts` |
| `achiev_first_goat` | ID de achievement ausente nas definições de `lib/mission-system.ts` |

Ambos os testes referenciavam IDs documentados mas não implementados. São backlog para Sprint 2.

---

## Contratos Preservados

Conforme regras da sprint:
- Nenhuma regra de gameplay alterada
- Nenhuma probabilidade de pack alterada
- Nenhum balanceamento de economia alterado
- Compatibilidade com Supabase e Vercel mantida
- Todos os contratos públicos (`OpenPackResult`, `DrawnCardInfo`, `Phase`) preservados

---

## Backlog para Sprint 2

| ID | Descrição | Severidade |
|----|-----------|-----------|
| P3 | Unificar XP/level entre GameContext e Supabase | Média |
| P5 | Loading states adequados em rotas mock | Baixa |
| P8 | Skeleton screens em Server Components lentos | Baixa |
| MS-01 | Implementar missões semanais épicas e achievements ausentes | Baixa |
