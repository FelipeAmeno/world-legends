# SPRINT_17_1_REPORT.md — "Card Art Revolution"

## Resumo

Objetivo: transformar cada carta em um item premium de coleção — sem tocar
backend, Supabase, banco ou economia de moedas. Trabalho puramente de
UX/UI das cartas, mais uma revisão pontual das probabilidades de raridade
dos packs (pedida explicitamente numa seção separada do briefing).

O componente `PlayerCard` foi completamente reconstruído e passou a ser a
**única** fonte visual de carta do app — Coleção, Reveal de packs, Squad,
Dream Team/Álbum e Perfil usam exatamente o mesmo componente agora,
satisfazendo o requisito de consistência visual entre telas.

## Decisão de raridade (confirmada com o usuário antes de implementar)

O banco tem 6 raridades reais (`common/rare/elite/legendary/ultra/
world_cup_hero`). O briefing citava 7 nomes (incluindo "GOAT" e "World
Champion" como se fossem raridades separadas de Ultra e World Cup Hero).
Perguntei e a resposta foi: **Ultra = GOAT, World Cup Hero = World
Champion** — são rótulos de exibição para as mesmas 6 raridades do banco,
zero mudança de schema. Implementado dessa forma.

## O que foi feito

### 1. `PlayerCard.tsx` — reconstrução completa

- **Camisa dominante**: a `JerseyArt` agora é renderizada com um scale
  1.16–1.28× (maior nos tamanhos menores, onde precisa de mais presença)
  e ocupa a faixa central da carta, do topo até a faixa do nome —
  visualmente domina a carta.
- **Nome muito mais destacado**: banner inferior reformulado — fonte
  `font-display` (Bebas Neue) em tamanho quase dobrado em relação à
  versão anterior, com faixa de contraste maior por trás para legibilidade
  garantida em qualquer camisa/fundo.
- **OVR pequeno e elegante**: trocado o badge retangular grande por um
  número compacto no canto superior esquerdo com uma linha fina
  (underline) na cor da raridade em vez de uma caixa cheia — visualmente
  mais "cartão premium", menos "contador de pontos".
- **Fundo com identidade nacional real**: em vez de uma lista fixa de
  "estádios" (só 10 seleções tinham), o fundo agora é um gradiente radial
  derivado diretamente da cor primária do kit de cada seleção
  (`lib/kit-data.ts`) — funciona para as 65 nacionalidades do catálogo,
  não só as 10 mais comuns.
- **Textura e acabamento premium**: reaproveitada a classe `.noise`
  (já existente em `globals.css`, com um filtro SVG `feTurbulence`) para
  dar granulação sutil a toda carta, mais vinheta de profundidade radial.

### 2. Identidade de raridade reconhecível sem ler texto

Cada raridade combina 4 sinais independentes — reaproveitando classes CSS
que já existiam em `globals.css` mas não estavam conectadas ao
`PlayerCard` (`.card-frame-*`, `.glow-*`, `.card-frame-ultra` com borda
arco-íris animada via `::before`, `.legendary-aura`, `.goat-shimmer-overlay`,
`.ultra-rainbow-overlay`, `.card-holo`):

| Raridade | Borda/moldura | Ícone | Acabamento |
|---|---|---|---|
| Common | cinza fina, chapada | nenhum (deliberadamente "plana") | nenhum |
| Rare | roxa | ◆ | glow roxo |
| Elite | azul | ▲ | glow azul |
| Legendary | dourada | ★ | shimmer + pulso dourado (`legendary-aura`) |
| Ultra ("GOAT") | **borda arco-íris animada** | ⚡ | véu arco-íris + holo |
| World Cup Hero ("Campeão") | platina | 🏆 | chuva de brilho branca (`goat-shimmer-overlay`) |

Common é a única sem ribbon de raridade — a ausência de ornamento *é* o
sinal, junto com a moldura chapada e zero glow.

### 3. Kit oficial de 65 seleções (`lib/kit-data.ts`)

Antes: 10 seleções com cor própria, as outras 55 caíam num azul-marinho
genérico. Agora: as 65 nacionalidades presentes no catálogo têm cores
reais/plausíveis do kit principal. Casos especiais implementados via um
novo campo `pattern` (generaliza o antigo `stripes` booleano):

- **Argentina**: listras verticais celeste/branco (`pattern: 'stripes'`).
- **Paraguai**: listras vermelho/branco.
- **Croácia**: padrão quadriculado vermelho/branco (`pattern: 'checker'`,
  novo — testado visualmente, ver screenshot na seção de testes).
- **Portugal**: corrigido — o kit anterior tinha as cores invertidas
  (verde como cor principal); a seleção joga de vermelho com detalhes
  verdes, agora corrigido.

### 4. Reveal de packs — já estava pronto, herdou a atualização de graça

`components/packs/RevealedCard.tsx` não precisou de nenhuma mudança: ele
já implementava exatamente o que o briefing pediu — jogador só aparece no
momento do flip 3D, glow/partículas escaladas por raridade (8 partículas
no Common, 34 no Ultra), chuva dourada e "heartbeat" de brilho no
Legendary, halo cromático cíclico no Ultra, e um estado de mistério
dedicado para World Cup Hero (ícone "?" pulsante, "INCRIVELMENTE RARO",
scanner vermelho piscando) antes do flip. Como esse componente já usa
`<PlayerCard>` para a face frontal, a reconstrução do card se propagou
automaticamente — confirmado visualmente abrindo um Starter Pack em
produção local (ver seção de testes).

### 5. Unificação — mesma carta em todo o app

Antes desta sprint, existiam **7 implementações bespoke** de carta
espalhadas pelo código, cada uma reinventando OVR/nome/raridade do zero
sem camisa nenhuma na maioria dos casos:

- `PremiumPitch.tsx` (`PitchCard`, Squad) — tinha camisa, mas duplicava
  toda a lógica de raridade.
- `BenchStrip.tsx` (`BenchCard`, banco do Squad) — **sem camisa alguma**,
  só um número grande.
- `CardPoolSheet.tsx` (`PoolCard`, sheet "Coleção" do Squad) — sem camisa.
- `PlayerSelectModal.tsx` (`CardCell` + `MiniCard` do painel de
  comparação) — sem camisa.
- `PitchBuilder.tsx` (`DragPreviewCard`, ghost do drag-and-drop) — sem
  camisa.
- `BestCardShowcase.tsx` (Perfil, "Melhor Carta") — sem camisa.
- `FavoriteCards.tsx` (Perfil, "Favoritas") — sem camisa.

Todas as 7 foram migradas para `<PlayerCard size="xs|sm|md|lg" glow />`,
mantendo os overlays específicos de cada contexto (dots de compatibilidade/
química no Squad, ícone de coração nos Favoritos, anéis de pulso na
Showcase) como elementos posicionados por cima. Em alguns casos os
overlays precisaram ser reposicionados para não colidir com o nome maior
e o ribbon de raridade novos (ex.: `HallOfLegendsExperience.tsx` movia os
botões de favoritar/Dream Team de baixo-direita para meio-direita).

`CollectionCardTile.tsx`, `RevealedCard.tsx`, `MatchResultScreen.tsx` e
`HallOfLegendsExperience.tsx` já usavam `PlayerCard` antes desta sprint e
não precisaram de migração — só herdaram a atualização visual.

### 6. Economia dos packs — revisão pontual das probabilidades

O briefing tem uma seção "Economia" separada e explícita pedindo revisão
das probabilidades — interpretado como: ajustar as *taxas de drop*
(config de código em `packages/packs`), não a economia monetária (preços,
moedas, IAP) que a instrução geral pedia para não tocar. Zero mudança em
Supabase/schema — só constantes em `pack-definitions.ts`.

**Problema encontrado**: os slots livres do Pacote Clássico (250c, pack de
entrada) usavam os pesos-base compartilhados (`legendary: 4.5%, ultra:
1.3%` por slot) — com 4 slots livres por abertura, isso dava **~17% de
chance de sair pelo menos 1 Legendary** por pacote de 250 moedas. Batia
exatamente com a reclamação do briefing ("Classic não pode distribuir
Legendary com facilidade").

**Correção**: slots livres do Clássico ganharam pesos próprios
(`common 62 / rare 28 / elite 8 / legendary 1.8 / ultra 0.2`), reduzindo a
chance de Legendary+ por abertura para ~7% e de Ultra para <1% — um degrau
acima do Starter (75c) sem repetir a generosidade antiga.

**Segundo problema encontrado durante a revisão**: o Pacote Lenda (20000c)
tinha slots livres usando os MESMOS pesos-base do Clássico (250c) — ou
seja, pagando 80× mais, os 2 slots não-garantidos do Lenda não eram
melhores que os do pack mais barato do jogo. Comparado ao Pacote Herói
(7000c, 3.5× mais barato), que já elevava seus slots livres, o Lenda
ficava *pior* proporcionalmente. Corrigido elevando os slots livres do
Lenda (`common 8 / rare 30 / elite 42 / legendary 18 / ultra 2`) para
ficarem claramente acima dos do Herói, coerente com custar quase 3× mais.

**Pacote GOAT (75000c)** não foi alterado — já garante 2 cartas
Legendary-ou-melhor (uma delas Ultra-ou-melhor), o que é coerente com ser
de longe o pack mais caro e exclusivo do jogo. "GOAT deve continuar sendo
extremamente raro" refere-se à raridade Ultra aparecer por acaso nos
*outros* packs, não a nerfar o pack dedicado cujo propósito é justamente
garantir uma carta desse nível.

Testes de estrutura (`pack-definitions.test.ts`) continuaram passando sem
alteração — só verificam contagem de slots e garantias, não pesos
numéricos. O teste estatístico Monte Carlo (`monte-carlo.test.ts`, 100k
aberturas) foi atualizado para validar contra os novos pesos do Clássico
em vez do `BASE_RARITY_WEIGHTS` compartilhado — os pesos-base em si não
mudaram (ainda usados por Elite/National/etc. via `freeSlot()` default),
só o Clássico e o Lenda passaram a ter pesos próprios.

## Testes executados

Visual (Playwright, browser novo, screenshots reais):

1. Coleção → Álbum → Croácia expandida: camisa quadriculada vermelho/
   branco renderizando corretamente, OVR "95" compacto, ribbon "⚡ GOAT",
   nome "EL MAGO" totalmente visível, ícones de ação (estrela Dream Team +
   coração favorito) reposicionados sem colidir com nome/OVR.
2. Squad (campo + banco): 6 jogadores com camisas de nações diferentes
   (amarelo, verde, azul, vermelho, quadriculado) todas corretas e
   legíveis em tamanho `xs` (62×84px).
3. Perfil → "Melhor Carta": mesma carta Croácia em tamanho `lg`, com anéis
   de pulso ao redor, dados da carta ao lado batendo com o card.
4. Abertura de Starter Pack → flip revelou uma carta Common (Chucho,
   Colômbia): sem ribbon de raridade (correto — Common não tem ornamento),
   camisa amarelo/azul limpa, nome grande, zero bugs de texto
   invertido/quebrado.

Técnico:

```
pnpm typecheck (apps/web)     → limpo
pnpm typecheck (packages/packs) → limpo
pnpm lint (apps/web)          → 0 erros, 451 warnings pré-existentes
                                  (1 a menos que antes — limpei um
                                  biome-ignore órfão durante a migração)
pnpm test (apps/web)          → 204/204 passando
pnpm test (packages/packs)    → 96/96 passando (Monte Carlo incluso)
pnpm build (apps/web)         → sucesso, 24 páginas geradas
                                  /squad: 39.9kB → 36.4kB (bundle menor —
                                  código bespoke duplicado foi removido)
```

## Definition of Done

> "Quero olhar uma carta e sentir vontade de colecioná-la, mesmo sem
> existir foto do jogador."

A camisa oficial estilizada + identidade de raridade em 4 camadas (cor,
ícone, moldura, acabamento animado) + tipografia com nome protagonista
substituem completamente a necessidade de uma foto — confirmado
visualmente nas 4 superfícies testadas acima.
