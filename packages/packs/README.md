# `@world-legends/packs`

**T013 concluída.** Abertura de pacotes em memória — determinística, auditável.

## O que há aqui

- `DropTable` — pesos por raridade/edição, `rollRarity`, `rollRarityWithGuarantee` (guard WCH nunca forçado), `rollEdition` (doc 10 §15, doc 07 §2).
- `ClassicPack`, `ElitePack`, `LegendPack`, `PrimePack`, `CopaHeroPack` — DropTables exatas por tipo (doc 10 §14).
- `PityCounter` — limiares 40 (Legendary+) e 120 (Ultra+); WCH excluído da proteção; imutável (doc 10 §15, doc 17 §8).
- `openPack` — função pura e determinística; mesmo seed → resultado idêntico; `CardResolver` injetado para desacoplar de `@world-legends/cards` (doc 18 §3); `PackResult` imutável com `wasForced` por slot.

## Sem moedas, sem banco, sem endpoints.

## 73 testes passando:
- Unitários: `drop-table`, `pity`, `pack-definitions`
- Integração: `open-pack` (determinismo, garantias TC-PACK-01 a 05/07/08/09)
- Monte Carlo: 100k aberturas × 4 slots livres = 400k sorteios; desvio ≤ 0.5pp da tabela declarada (TC-PACK-06)
