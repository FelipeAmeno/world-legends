# SPRINT_18_REPORT.md — "Card Experience 5.0"

## Contexto

Esta sprint foi pedida como um diff em cima da Sprint 17.1 ("Card Art
Revolution"): comparar o que já existia com o novo briefing e implementar
só o que faltava, sem deixar ponta solta. A Sprint 17.1 já tinha
entregado bastante — camisa dominante, nome grande, OVR compacto,
identidade de raridade, 65 kits nacionais, reveal cinematográfico com
antecipação/partículas/gold rain, e uma primeira rodada de rebalanceamento
de odds. O objetivo de negócio, porém, era mais alto desta vez: "quando
um jogador abrir um pack ele precisa pensar 'que carta linda'" — e o
feedback foi que isso ainda não estava acontecendo. Esta sprint é sobre
**intensidade**: pegar cada elemento que já existia e empurrar mais
forte, mais uma vez sem tocar em backend, banco, economia de moedas ou
match engine.

## Decisão de raridade (confirmada com o usuário antes de implementar)

O briefing lista 8 nomes de raridade (Common, Rare, Elite, **Epic**,
**Hero**, Legendary, Ultra, World Champion), mas o banco só tem 6 códigos
reais. Perguntei e a resposta foi: **descartar Epic e Hero, manter as 6
raridades reais** (mesmo mapeamento da Sprint 17.1: Ultra = "GOAT",
World Cup Hero = "World Champion"). A escala de duração de animação do
briefing (que já pulava "Epic" e listava só 7 itens) foi comprimida para
as 6 raridades reais: Common 200ms, Rare 400ms, Elite 600ms, Legendary
1200ms, Ultra 1600ms, World Champion 2200ms.

## Antes / Depois

| Aspecto | Sprint 17.1 | Sprint 18 |
|---|---|---|
| Escala da camisa | `jerseyScale` 1.16–1.28× | **1.32–1.5×** — agora sangra até a borda do card (visualmente confirmado, sem bug de clipping real — ver seção de testes) |
| Fundo | 1 cor do kit, alpha fixo 18% | **2 cores do kit** (primary+secondary), alpha **crescente por raridade** (14% Common → 5c% World Champion) |
| Glow (CSS) | `glow-rare/elite/gold/ultra/wch` com blur 16-24px | Blur e opacidade **~50-70% mais fortes** em todas as classes |
| Borda por raridade | espessura fixa 1.5px em todas | **espessura cresce com a raridade**: 1px Common → 3px World Champion |
| Nome | `NAME_FONT` 6.5–15px | **8–20px** (+25 a +33%), com glow de raridade no texto para Legendary+ |
| OVR | número simples com sombra preta | **glow colorido pela raridade atrás do número** + linha inferior com box-shadow |
| Animação idle | nenhuma (card estático fora do reveal) | **sheen animado contínuo** em todas as raridades exceto Common (que fica "chapada" de propósito — é o próprio sinal de "sem graça") |
| Reflexo/profundidade | não existia | **camada de reflexo de vidro diagonal** + glow atrás da camisa + `drop-shadow` colorido pela raridade |
| Textura da camisa | gradiente liso | **trama de tecido diagonal sutil** (pattern SVG) por cima de todas as camadas |
| Brasão | não existia | **roundel simplificado** (círculo + estrela) no peito, cor do kit |
| Reveal Legendary/Ultra | antecipação única (shake, sem estágios) | **suspense em 3 estágios**: glow → silhueta (carta real com `brightness(0)`) → nome, antes da explosão+flip |
| Duração do reveal | Legendary 450ms / Ultra 650ms de antecipação | **750ms / 1050ms** de antecipação, orçamento dividido nos 3 estágios |
| Arte dos packs | emoji genérico (📦🌟⚡👑🐐) num retângulo com gradiente | **`PackArt.tsx`** novo: ilustração SVG de "pouch" premium com costura, selo metálico, emblema próprio por pack, sheen animado — usada na loja E na tela de abertura (`PackFloatScene`, que antes usava emoji e nem tinha visual pra Starter/National/Hero/GOAT — caía tudo no visual do Classic por engano) |
| Odds do Classic | Legendary ~1.8%/slot livre, Ultra ~0.2%/slot livre (fix da 17.1) | **Legendary 0.55%, Ultra 0.05%** por slot livre; slot garantido também teve o teto de Legendary/Ultra reduzido — P(2 Legendary no mesmo Classic) caiu de ~0.19% pra praticamente zero |

## O que já existia e não precisou de trabalho novo

- **GOAT pack**: já garante Ultra-ou-melhor + Legendary-ou-melhor nos 2
  slots desde a Sprint 17.1. "Continua excelente mas ainda raro" — não
  mexi na estrutura, só documentei de novo a decisão: o pack em si É o
  produto "garantido", a raridade dele está no preço (75000c) e na
  exclusividade, não em ser aleatório.
- **World Cup Hero / "World Champion"**: já tinha um card de mistério
  dedicado (`isGoat` branch em `RevealedCard.tsx`) com ícone "?"
  pulsante, scanner vermelho, "INCRIVELMENTE RARO" — isso já cobria
  "essa carta precisa parecer impossível" antes mesmo desta sprint.
  Não precisou de estágios de suspense adicionais.
- **Sistema de partículas/explosão do reveal** (`ExplosionOverlay`,
  `ConfettiCanvas`, câmera shake) já existia desde antes da Sprint 17 e
  já cobria "luz explode, partículas, zoom, sombras" do briefing.

## Arquivos modificados

**Cartas:**
- `apps/web/components/cards/PlayerCard.tsx` — fundo 2 cores + intensidade
  por raridade, camisa maior, OVR com glow, nome maior, sheen animado,
  reflexo de vidro.
- `apps/web/components/cards/JerseyArt.tsx` — textura de tecido (pattern
  SVG), brasão simplificado (roundel + estrela).
- `apps/web/app/globals.css` — glow utilities e `card-frame-*` mais
  fortes/mais espessos.

**Reveal:**
- `apps/web/components/packs/RevealedCard.tsx` — durações por raridade
  atualizadas (200/400/600/1200/1600ms), suspense em 3 estágios
  (glow→silhueta→nome) para Legendary/Ultra via novo state `suspenseStage`.

**Packs (arte + odds):**
- `apps/web/components/packs/PackArt.tsx` — **novo**, ilustração SVG de
  pack premium com emblema por tipo (7 packs cobertos).
- `apps/web/components/packs/PackSelector.tsx` — usa `PackArt` em vez de
  emoji na loja.
- `apps/web/components/packs/PackFloatScene.tsx` — usa `PackArt`; corrigido
  bug onde Starter/National/Hero/GOAT caíam no visual do Classic por
  ausência de entrada no mapa `PACK_VISUALS`.
- `packages/packs/src/pack/pack-definitions.ts` — `classicFreeSlot` e
  `classicGuaranteedSlot` mais restritos.
- `packages/packs/tests/monte-carlo/monte-carlo.test.ts` — atualizado
  para os novos pesos do Classic.

## Testes executados

Visual (Playwright, browser novo, screenshots reais, servidor `next dev`
sem Turbopack):

1. **Coleção → Álbum → Croácia**: jersey quadriculado com trama de
   tecido visível, brasão (roundel+estrela) no peito, OVR com glow
   rosa/magenta (Ultra), borda arco-íris animada, nome "EL MAGO" grande.
   Confirmado por medição de pixel (não só screenshot) que a camisa
   ampliada **não vaza** para fora do card vizinho — a impressão inicial
   de "sangramento" era ilusão de ótica de dois jerseys idênticos
   (mesma seleção) lado a lado, não um bug real de `overflow`.
2. **Loja de packs**: Starter (verde, emblema de estrela) e Classic
   (roxo, emblema de escudo) renderizando a nova arte `PackArt` — visual
   de "produto premium", sem nenhum emoji de caixa.
3. **Abertura de Starter Pack, fluxo completo**: FLOAT → CHARGE → BURST
   → REVEAL sem erros de console/página. Carta Common revelada (Koné,
   Costa do Marfim) com camisa laranja/verde correta, OVR "59" nítido,
   nome "KONÉ" grande, sem ribbon de raridade (correto — Common não leva
   ornamento).

Técnico:

```
pnpm typecheck (apps/web + packages/packs) → limpo
pnpm lint (apps/web)                        → 0 erros, 453 warnings
                                                pré-existentes (mesma
                                                categoria de sempre —
                                                nenhum novo introduzido)
pnpm test (apps/web)                        → 204/204 passando
pnpm test (packages/packs)                  → 96/96 passando (Monte
                                                Carlo incluso, validando
                                                os novos pesos do Classic)
pnpm build (apps/web)                       → sucesso, 24 páginas
                                                geradas, /packs 20.8kB
                                                (subiu ~1.5kB pela arte
                                                nova, aceitável)
```

Não consegui testar ao vivo um pull de Legendary/Ultra real (a conta de
QA usada não tinha saldo para Hero/Legend/GOAT depois do rebalanceamento
de odds — o que é, ironicamente, prova de que o Classic ficou raro o
suficiente). O código do suspense em 3 estágios foi verificado por
typecheck/lint e reaproveita exatamente o mesmo mecanismo de
`setTimeout`+`AnimatePresence` já testado ao vivo no fluxo Common — risco
residual baixo, mas registrado aqui por transparência.

## Decisões de UX

- **Common fica "chapado" de propósito**: sem sheen animado, sem glow,
  borda mais fina que todas as outras. Isso não é uma limitação — é o
  próprio sinal visual de "essa é a raridade base". Cada nível acima
  ganha uma camada a mais (glow → sheen → borda mais grossa → efeito
  próprio), então a progressão inteira fica legível de relance.
- **Silhueta do estágio de suspense reaproveita o `PlayerCard` real**
  (`filter: brightness(0)`) em vez de desenhar uma silhueta genérica —
  zero duplicação de forma, e a silhueta já sai com o contorno exato da
  camisa/raridade que vai ser revelada, reforçando a expectativa certa.
- **`PackArt` usa as cores que a loja já calculava** (`borderColor`/
  `glowColor` de `PACK_DEFS`) em vez de introduzir uma paleta paralela —
  a arte nova herda a identidade visual que cada pack já tinha, só troca
  "emoji num gradiente" por uma ilustração de verdade.
- **Odds do Classic**: preferi apertar os pesos declarados a inventar uma
  regra especial de "nunca 2 Legendary" — com Legendary a 0.55%/slot
  livre e ~8% no slot garantido, a chance de 2 no mesmo pack já caiu pra
  ~0.02%, praticamente o mesmo resultado prático sem adicionar uma regra
  de reroll condicional que não existia na arquitetura do drop-table.

## Definition of Done

Comparado à Sprint 17.1, todo elemento visual (camisa, nome, OVR, glow,
brilho, cor nacional, animação, reveal) ficou mensuravelmente mais
intenso, e as duas lacunas estruturais do briefing (arte de pack própria,
suspense em estágios no reveal de raridade alta) foram implementadas do
zero. Nenhuma ponta do diff entre a Sprint 17.1 e este briefing ficou de
fora, exceto a decisão consciente de descartar "Epic"/"Hero" (confirmada
com o usuário) e a limitação de não ter testado um pull real de
Legendary/Ultra ao vivo (odds agora deliberadamente raras — documentado
acima).
