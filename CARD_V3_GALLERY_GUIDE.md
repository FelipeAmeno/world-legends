# Card V3 Gallery Guide (Sprint 34)

Guia de uso das duas ferramentas internas da Sprint 34. Nenhuma delas é
uma tela de jogo — ambas ficam atrás do mesmo middleware de auth de
qualquer rota não-pública (`middleware.ts`), igual `/dev/card-assets`.

## `/dev/card-v3-gallery`

5 cartas de validação (Common/Rare/Elite/Legendary/World Cup Hero) lado
a lado, cada uma com `v3CompositionId` setado (`common-validation-01`,
etc — ver `CARD_V3_ASSET_SPEC.md`). Hoje, sem arte real em disco, todas
caem no fallback procedural — a página serve pra validar o PIPELINE,
não pra ver arte final ainda.

**Densidade** — 3 botões (Compact/Standard/Showcase), mapeiam pro
`size` do `PlayerCard` (`sm`/`md`/`lg`) — o `mode` interno (Sprint 33)
é derivado automaticamente disso.

**Camadas** — checkboxes ligando/desligando cada uma das 11 camadas do
Card Engine (`hiddenLayers`, mesmo mecanismo do Visual Debug de
`/dev/card-assets`, Sprint 19).

**Background / Pose / Pattern** — botão "🎲 Trocar". Sem asset real v3
ainda, não existe "biblioteca de arte" pra escolher — o botão troca o
seed procedural (recalcula background/luz/partículas/pose
determinísticos com um seed diferente), útil pra comparar variações
antes de decidir qual variação virar arte real definitiva.

**Scale/Offset temporário** — 3 sliders (scale/offsetX/offsetY) que
aplicam um `transform` só na preview, nunca persistido — pra testar
visualmente quanto ajuste um asset real vai precisar antes de escrever
o `metadata/<id>.json` de verdade.

**Referência** — checkbox que mostra `card-reference-v3.png` ao lado
das cartas, pra comparar composição/proporção/hierarquia lado a lado.

## `/dev/pack-reveal-qa`

Abre o **mesmo** `CardRevealScene` de produção (não existe um segundo
componente de reveal) com um seletor de raridade manual — clique numa
raridade e "▶ Testar reveal" pra ver o reveal completo daquela raridade
especificamente, sem depender de sorte no RNG real.

**Como funciona sem tocar odds/economia**: em vez de chamar
`openPack()` (o motor real de sorteio, com pity/RNG determinístico —
ver `packages/packs`), a ferramenta monta `DrawnCard[]` na hora,
escolhendo cartas reais do catálogo (`getCollection()`) que já têm a
raridade selecionada. As cores/efeitos (`glowColor`/`particleColor`)
vêm das mesmas tabelas de produção (`GLOW_MAP`/`PARTICLE_MAP`,
`lib/pack-logic.ts`, exportadas especificamente pra essa ferramenta
reaproveitar sem duplicar paleta).

**Por que nada é creditado**: nenhuma server action é chamada em
nenhum momento — o "reveal" acontece inteiramente client-side com dados
sintéticos. A carta nunca é escrita em `user_cards` no Supabase.

## Quando usar qual

| Preciso de... | Ferramenta |
|---|---|
| Ver as 5 raridades lado a lado, comparar densidade/camada | `/dev/card-v3-gallery` |
| Testar como o reveal ANIMADO se comporta numa raridade específica | `/dev/pack-reveal-qa` |
| Testar um asset real novo antes de ele existir em produção | Solte o arquivo + `metadata/<id>.json` (`CARD_V3_ASSET_SPEC.md`), depois `/dev/card-v3-gallery` |
