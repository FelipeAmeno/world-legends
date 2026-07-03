# 08 — APIs e Seeds de Jogadores Históricos (item 13)

## 1. Contrato de APIs (Route Handlers / Server Actions)

A maioria das operações de jogo deve ser **Server Action** (mutação direta do App Router, sem precisar desenhar REST para tudo). Route Handlers (`app/api/*`) ficam reservados para: webhooks externos, endpoints chamados por Edge Functions/cron, e qualquer integração que precise de URL estável fora do Next.

| Operação | Tipo | Caminho/Nome | Observação |
|---|---|---|---|
| Login/Cadastro | Supabase Auth (SDK) | — | Client SDK + middleware de sessão |
| Abrir pack | Server Action | `openPackAction(packId)` | Transacional: debita moeda + chama `PackEngine` + grava cartas |
| Montar/editar elenco | Server Action | `saveSquadAction(squadId, slots)` | Valida 11 titulares, posições, lesão/suspensão |
| Criar liga | Server Action | `createLeagueAction(input)` | Gera `invite_code` único |
| Entrar em liga | Server Action | `joinLeagueAction(code)` | Valida vagas, idempotente |
| Pick de draft | Server Action + Realtime broadcast | `draftPickAction(leagueId, cardId)` | Valida turno e disponibilidade no pool |
| Buscar partida ranqueada | Server Action | `findRankedMatchAction()` | Matchmaking por ELO |
| Webhook de cron de rodada | Route Handler | `POST /api/internal/process-round` | Chamado só pela Edge Function/cron, protegido por secret |
| Webhook de fechamento de temporada | Route Handler | `POST /api/internal/close-season` | Idem |
| Buscar timeline de partida | Server Component (fetch direto) | — | Leitura simples via `db` repo, sem necessidade de Server Action |

**Padrão de validação:** toda Server Action usa Zod no input, revalida sessão (`auth.uid()`), e delega regra de negócio ao pacote `engine` sempre que possível — a Action é "cola" entre HTTP, banco e engine, não deve conter lógica de jogo.

```ts
'use server';
const OpenPackSchema = z.object({ packId: z.string().uuid() });

export async function openPackAction(input: unknown) {
  const { packId } = OpenPackSchema.parse(input);
  const userId = await requireAuthenticatedUser();
  const pack = await packsRepo.getById(packId);
  await profilesRepo.debitCurrency(userId, pack.priceSoft, pack.priceHard);
  const seed = generateSeed();
  const cardIds = openPack(pack, seed); // packages/engine
  const userCards = await userCardsRepo.bulkCreate(userId, cardIds);
  await packOpeningsRepo.record(userId, packId, seed, userCards);
  return { userCards };
}
```

## 2. Estratégia de Seed de Jogadores Históricos

### 2.1 Estrutura do arquivo de seed

```json
{
  "full_name": "Exemplo da Silva",
  "known_as": "Exemplo",
  "birth_year": 1945,
  "nationality_code": "BR",
  "primary_position": "ST",
  "secondary_positions": ["CF"],
  "preferred_foot": "right",
  "height_cm": 174,
  "era_start": 1962,
  "era_end": 1974,
  "base_attributes": {
    "pace": 88, "finishing": 95, "shooting_power": 90, "passing": 80,
    "vision": 85, "dribbling": 92, "defending": 35, "heading": 84,
    "physical": 78, "mental": 90
  },
  "bio_short": "Atacante histórico com participação em múltiplas Copas do Mundo.",
  "source_notes": "Estatísticas de carreira derivadas de registros públicos da FIFA/confederações."
}
```

- Script de importação (`scripts/seed-players.ts`) lê os JSON/CSV de `data/seeds/`, valida com Zod, faz upsert em `players`, depois gera as `cards` correspondentes para cada raridade configurada (ex: toda Lenda histórica entra automaticamente em Comum/Rara/Lendária; só um subconjunto curado vira Ultra Lendária).
- Atributos-base devem ser calibrados por um processo de "tier list" manual (referência cruzada de prêmios reais — Bola de Ouro de Copa, artilharias, convocações), não inventados arbitrariamente — documentar a metodologia em `data/seeds/METHODOLOGY.md` para consistência entre quem for cadastrando jogadores.

### 2.2 Fontes de dados

Estatísticas históricas factuais (gols, partidas, copas disputadas, convocações) são fatos públicos e podem ser usadas como base objetiva para calibrar atributos de jogo — isso é equivalente ao que qualquer jogo de gestão de futebol já faz há décadas (Brasfoot, Football Manager, etc.) com bancos de dados próprios de scouting.

### 2.3 Atenção importante — direitos de imagem e nome

Este ponto **não é um bloqueio técnico, é um risco de negócio que precisa de validação jurídica antes do lançamento comercial**:

- Nome e estatísticas factuais de uma carreira são, em geral, fatos históricos de domínio público.
- **Imagem/retrato realista, marcas associadas ao nome, ou uso comercial do "likeness"** de um jogador (especialmente jogadores vivos ou cujo espólio/família/clube/confederação detenha direitos registrados) podem exigir licenciamento — é exatamente por isso que jogos como EA FC/PES historicamente pagam licenças a federações, ligas e ex-jogadores, e por isso produtos "não licenciados" (como muitos jogos de gestão) usam nomes genéricos/alterados ou arte estilizada não-fotorrealista para evitar esse risco.
- Recomendação prática para o MVP: usar **arte estilizada (ilustração, não foto/rosto realista)** nas cartas, e, se o produto for monetizado/publicado amplamente, validar com um advogado especializado em propriedade intelectual/direito de imagem no Brasil (e nos países de origem dos jogadores incluídos) antes de escalar comercialmente. Isso não impede de validar e testar internamente com nomes reais durante o desenvolvimento.

### 2.4 Cobertura inicial sugerida (MVP 0)

- 5–8 seleções históricas de grande relevância em Copas (ex: Brasil, Argentina, Alemanha, Itália, França, Inglaterra, Uruguai, Holanda).
- ~20–25 jogadores por seleção cobrindo múltiplas décadas, permitindo combinações "dream team" dentro de cada país e variação de raridade por relevância histórica do jogador.
