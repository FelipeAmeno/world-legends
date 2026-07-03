# 07 — Packs e Colecionismo (item 12)

## 1. Tipos de Pack

| Pack | Custo | Cartas | Garantias |
|---|---|---|---|
| Inicial Gratuito | — (one-time) | 5 | ≥1 Rara garantida |
| Bronze | 300 créditos | 5 | sem garantias especiais |
| Prata | 800 créditos | 5 | ≥1 Rara |
| Ouro | 2.000 créditos | 5 | ≥1 Lendária |
| Copa Especial (sazonal) | moeda premium ou evento | 3 | ≥1 carta de edição `wc_special_<ano>` |

## 2. Drop Table e RNG

Cada pack carrega seu próprio `drop_table` (jsonb em `packs`), sobrescrevendo os pesos-base de `rarities.drop_weight`:

```ts
interface DropTable {
  rarityWeights: Record<RarityCode, number>;  // soma normalizada internamente
  editionWeights?: Record<string, number>;    // chance de a carta sorteada vir em edição especial
  guaranteedMinRarity?: RarityCode;            // força reroll se nenhuma carta atingir o mínimo
}

function openPack(pack: Pack, seed: number): CardId[] {
  const rng = mulberry32(seed);
  const cards: CardId[] = [];
  for (let i = 0; i < pack.cardsPerPack; i++) {
    const rarity = weightedPick(pack.dropTable.rarityWeights, rng);
    const candidates = getActiveCardsByRarity(rarity, pack.dropTable.editionWeights, rng);
    cards.push(pickOne(candidates, rng));
  }
  return enforceGuarantee(cards, pack.dropTable.guaranteedMinRarity, rng);
}
```

- O `seed` de cada abertura é gravado (`pack_openings.rng_seed`) pelos mesmos motivos de auditabilidade do Match Engine.
- **Duplicatas**: ao sortear uma carta que o usuário já possui, oferece-se conversão automática em moeda soft (valor escalado pela raridade) em vez de acumular cópias inúteis — mantém a economia saudável.

## 3. Economia (Soft/Hard Currency)

- **Créditos (soft)**: ganhos jogando partidas (vitória > empate > derrota), completando objetivos diários/semanais, vendendo duplicatas. Único sink relevante: comprar packs e (futuramente) treinar cartas.
- **Moeda premium (hard)**: opcional, exclusiva de packs cosméticos/especiais de alta raridade — **nota de cautela**: monetização em jogos com mecânica de "pack aleatório" se aproxima de mecanismos do tipo loot box, que têm regulação crescente em diversos países (ex.: exigência de divulgar probabilidades, restrição de idade, em alguns lugares classificação como jogo de azar). Recomenda-se: (a) sempre exibir as probabilidades reais de cada raridade na tela da Loja, (b) não vincular hard currency a apostas ou trocas por dinheiro real, (c) revisão jurídica antes do lançamento monetizado, especialmente se o público incluir menores de idade.

## 4. Álbum de Coleção (Collection Sets)

- `collection_sets`: conjuntos temáticos (ex: "Seleção Brasileira Copa 1970", "Os 5 Maiores Artilheiros de Copas") com lista fixa de `card_id`s necessários.
- Progresso por usuário (`collection_progress`) calculado incrementalmente a cada nova `user_card` adquirida (trigger ou verificação no momento da abertura de pack).
- Completar um set concede recompensa configurável (`reward_pack_id` e/ou `reward_soft_currency`) — mecanismo clássico de retenção de longo prazo, dá propósito a duplicatas indesejadas em outros contextos (trocá-las/usá-las para completar sets, se houver mercado).

## 5. Mercado de Trocas (pós-MVP, mencionado no roadmap)

- Modelo simples de "oferta direta" entre amigos (A oferece carta X, B aceita ou recusa) evita os riscos de um mercado aberto tipo leilão (manipulação de preços, bots, lavagem de moeda).
- Toda troca é uma transação atômica via Server Action com `service role`, nunca update direto client-side em `user_cards.profile_id`.
