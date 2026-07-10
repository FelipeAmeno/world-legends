# Sprint 33 — World Legends Card Engine V3 (relatório final)

Sprint de reconstrução visual do Card Engine, guiada pela referência
`docs/references/card-reference-v3.png` (usada só como referência de
proporção/composição/hierarquia — nunca recortada ou transformada em
asset). Ver `SPRINT_33_AUDIT.md` (auditoria + fix do timer do Pack
Reveal) e `SPRINT_33_2_RECONSTRUCTION.md` (reconstrução visual) para o
detalhamento técnico de cada etapa.

## O que foi feito

1. **Auditoria completa antes de qualquer código** (`SPRINT_33_AUDIT.md`)
   — respondeu as 4 perguntas do brief com evidência de teste ao vivo,
   não só leitura de código. Achado principal: o "espelhamento" relatado
   era na verdade um bug real de timer no Pack Reveal (`CardRevealScene.tsx`
   usava um único `timerRef` compartilhado entre 3 timers, cancelando o
   avanço automático depois da primeira carta).
2. **Fix do timer** — `phaseTimerRef`/`advanceTimerRef` separados.
   Verificado ao vivo: pacote real avança sozinho por todas as cartas,
   zero toque do usuário.
3. **Reconstrução do PlayerCard**: arte (pose+scene procedural) de ~60%
   pra ~88% da largura da carta; piso de intensidade levantado pra
   Common/Rare (estavam apagadas); atributos reposicionados pra tira
   horizontal sob o nome, dentro do rodapé do HUD.
4. **Três modos internos** (Compact/Standard/Showcase) derivados de
   `size`, zero prop nova — API pública do `PlayerCard` intacta.
5. **5 cartas de validação** (Common/Rare/Elite/Legendary/World Cup
   Hero) renderizadas e capturadas via `/dev/card-assets` — progressão
   de intensidade clara, pose muito mais presente em todas as raridades.
6. **Pack Reveal revalidado ao vivo pós-reconstrução** — mesmo teste
   passivo, zero espelhamento, zero layer duplicada, zero conteúdo atrás
   do frame.
7. **PackArt com exclusividade escalonada por tier** — Starter→GOAT
   ganham camadas visuais progressivas (facetas, anel de luz, raios,
   aura pulsante no GOAT), mesma silhueta de pouch premium nos 7 packs.
8. **QA sweep completo** — Squad (compact), Profile "Melhor Carta"
   (showcase), Pack Store, Pack Reveal, Museu/Coleção (cartas possuídas
   reais). Confirmado: Card Detail e Álbum usam componentes leves
   separados (não `PlayerCard`), fora de escopo, não afetados.
9. **Monte Carlo revalidado** — 190/190 testes (100k+ packs simulados
   por tipo) confirmam odds idênticas às de antes; nenhum arquivo de
   economia (`packages/packs`, `lib/pack-logic.ts`'s pity/raridade) foi
   tocado nesta sprint.

## Critérios de sucesso (do brief original)

| Critério | Status |
|---|---|
| Nenhuma camada antiga (jersey) | ✅ já removida nas Sprints 26-28, confirmado na auditoria |
| Nenhum texto invertido | ✅ confirmado — bug real era o timer, não espelhamento |
| Nenhuma carta quebrada | ✅ pack real testado ao vivo, 5/5 cartas OK |
| Screenshots antes/depois | ✅ capturados em `/private/tmp/.../scratchpad/sprint18_9/s33_*.png` |
| Deploy Ready | ✅ ver abaixo |
| Commit | ✅ 3 commits (`d5ef48f4` timer fix, `a3bd0ea6` reconstrução, `569f3c4a` PackArt) |

## QA final

```
pnpm exec tsc --noEmit -p .   → 0 erros
pnpm exec biome check .       → 457 warnings, 0 erros (baseline inalterado)
pnpm test (apps/web)          → 220/220
pnpm test (packages/packs)    → 190/190 (Monte Carlo, 100k+ packs/tipo)
pnpm build                    → sucesso, 24/24 páginas
```

Nenhuma mudança em economia, preços, odds, Supabase (schema/RLS), ou
gameplay/match engine.
