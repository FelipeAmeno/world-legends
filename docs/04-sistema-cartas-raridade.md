# 04 — Sistema de Cartas e Raridade

## 1. Raridades

| Raridade | Faixa de Overall | Multiplicador de atributo | Peso em pack (base) | Identidade visual |
|---|---|---|---|---|
| Comum | 55–74 | 1.00x | 70% | Borda cinza/bronze, fundo liso |
| Rara | 75–84 | 1.08x | 22% | Borda azul/prata, leve brilho |
| Lendária | 85–92 | 1.16x | 7% | Borda dourada, textura, animação sutil de brilho |
| Ultra Lendária | 93–99 | 1.25x | 1% | Borda animada (gradiente), efeito de partícula, nome em destaque |

A raridade **não é apenas estética**: ela é o multiplicador aplicado sobre os atributos-base do jogador (`players.base_attributes`) no momento em que a `card` é criada no catálogo. Isso significa que um mesmo jogador pode existir em múltiplas raridades simultaneamente como produtos de coleção diferentes (ex: Pelé "Comum" histórico de baixo perfil de carreira vs. Pelé "Ultra Lendária" edição Copa 1970) — útil para progressão e variedade de pack sem inventar jogadores fictícios.

## 2. Cálculo de Overall

O overall exibido na carta é uma média ponderada por posição dos atributos finais (ver lista completa de atributos no doc 05), não uma média simples:

```ts
// packages/engine/src/cards/overall.ts
type PositionWeights = Record<AttributeKey, number>; // soma = 1.0

const WEIGHTS_BY_POSITION: Record<Position, PositionWeights> = {
  ST: { finishing: 0.30, pace: 0.20, shooting_power: 0.15, dribbling: 0.10,
        heading: 0.10, physical: 0.10, passing: 0.05 },
  CAM:{ passing: 0.25, dribbling: 0.25, vision: 0.20, finishing: 0.15,
        pace: 0.10, physical: 0.05 },
  CB: { defending: 0.35, physical: 0.25, heading: 0.15, passing: 0.10,
        pace: 0.10, mental: 0.05 },
  GK: { gk_reflexes: 0.35, gk_positioning: 0.25, gk_handling: 0.20,
        gk_kicking: 0.10, mental: 0.10 },
  // ... demais posições seguem o mesmo padrão (ver doc 05 para atributos completos)
};

function calculateOverall(attrs: AttributeSet, position: Position): number {
  const weights = WEIGHTS_BY_POSITION[position];
  const weighted = Object.entries(weights).reduce(
    (sum, [key, w]) => sum + attrs[key as AttributeKey] * w, 0
  );
  return Math.round(clamp(weighted, 40, 99));
}
```

Esse cálculo roda **uma única vez** ao gerar a `card` no catálogo (admin/seed), e o resultado é congelado em `cards.overall` — em runtime de partida, o Match Engine usa os atributos brutos (não o overall), o overall é só uma etiqueta de UI/coleção.

## 3. Edições Especiais

Além da raridade base, uma carta pertence a uma `edition_code`:

- `base`: edição padrão, sempre disponível.
- `wc_special_<ano>`: edição temática de uma Copa específica (ex: "Copa 1970 Especial"), com pequeno bônus de atributo (+2 a +4 nos atributos centrais da posição) e arte exclusiva — drop limitado a evento sazonal.
- `icon`: 1 por jogador, o "topo" absoluto (apenas Ultra Lendária), usado como ímã de retenção/colecionismo, droprate extremamente baixo e/ou conquistável via álbum de coleção em vez de pack puro.

## 4. Química do Time (Chemistry)

Inspirado no FUT, mas simplificado para não exigir "links" manuais complexos — calculado automaticamente a partir de:

```ts
interface ChemistryInput {
  sameNationalityPairs: number;     // jogadores adjacentes na formação da mesma seleção
  sameEraOverlap: number;           // jogadores cujas eras (era_start..era_end) se cruzam
  positionFitScore: number;         // 0-1: jogador está na posição natural ou fora dela
}

function calculateChemistry(squad: SquadSlot[]): number {
  // pontuação 0-100, exibida como estrelas (0-5) na tela de elenco
  // afeta diretamente o Match Engine como modificador de consistência (ver doc 05)
}
```

- Jogadores fora de posição (`secondary_positions` não contempla o slot) recebem penalidade de química e leve penalidade direta de atributo em partida (representa "desconforto tático").
- Misturar muitas nacionalidades/eras incompatíveis reduz química — incentiva mas não obriga montar "seleções reais", criando espaço para times "dream team" híbridos com trade-off.

## 5. Probabilidade de Pack (resumo — detalhado no doc 07)

A raridade sorteada usa pesos de `rarities.drop_weight`, ajustáveis por tipo de pack (`packs.drop_table` sobrescreve os pesos-base para aquele pack específico, ex: um "Pack Lendário" garante zero Comuns).

## 6. Progressão de Carta (opcional, pós-MVP)

- `user_cards.level`: treino consome moeda soft e XP de partidas, incrementa atributos em pequenas frações (cap de +3 overall em relação à carta base) — evita que cartas "infladas" ultrapassem o teto de balanceamento da raridade.
- `user_cards.form`: -2 a +2, oscila com performance recente em partidas (gols/assistências/cartões) e decai com o tempo — efeito visível mas de impacto limitado no Match Engine (ver doc 05, seção de modificadores).
