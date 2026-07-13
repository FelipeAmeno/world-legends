# Sprint 38 — Pack Reveal Renderer Integration

## Descoberta (obrigatória antes de codificar)

Trace completo, rota → componente final:

```
app/packs/page.tsx → PackExperience.tsx
  → handleChoosePack → openPackAction (server, commita a recompensa ANTES da animação)
  → CHARGE (1400ms) → BURST → REVEAL → CardRevealScene
  → RevealedCard.tsx (uma carta por vez, raridades comuns→ultra)
  → GoatReveal.tsx (path SEPARADO, só pra world_cup_hero)
  → DONE → RevealSummary.tsx
```

**Achado 1 — `src/app/` e `src/components/` são um scaffold morto** (tRPC, sem `srcDir` configurado, zero imports a partir de `app/`). Não tocado.

**Achado 2 — `app/dev/pack-reveal-qa` é real e reutiliza o `CardRevealScene` de produção**, montando `DrawnCard[]` sintéticos a partir de `getCollection()` em vez de chamar `openPackAction` — nenhuma escrita no Supabase, odds reais nunca tocadas. Esse é o fixture determinístico usado no QA desta sprint (ver seção QA).

**Achado 3 — dois caminhos de reveal completamente diferentes**, confirmado por agente de exploração antes de qualquer edição:
- **Caminho normal** (`common`/`rare`/`elite`/`legendary`/`ultra`): `RevealedCard.tsx` — já usava `<PlayerCard>` (troca direta, baixo risco).
- **Caminho GOAT** (`world_cup_hero`): `GoatReveal.tsx` — 543 linhas de cinemática própria (fases `dark→text→card→burst→hold`) que **nunca** usava `PlayerCard`; o "card" final era markup HTML bespoke (OVR/nome/bandeira em `<p>`s soltos).

**Achado 4 — 8 dos 10 pilotos são `world_cup_hero`**, só 2 são `ultra` (confirmado por leitura direta do catálogo: Pelé, Maradona, Messi, Cristiano, Neymar, Mbappé, Zidane, Beckenbauer = GOAT; Ronaldinho, Ronaldo = ultra). Migrar só `RevealedCard.tsx` deixaria 8 dos 10 jogadores sem a arte nova em produção real. Por isso os dois caminhos foram integrados nesta sprint (decisão tomada explicitamente antes de codificar).

**Achado 5 — a recompensa já está persistida antes da animação começar.** `lib/actions/packs.ts` grava a carta e debita o saldo durante as fases `CHARGE`/`BURST`, antes de `REVEAL` sequer montar. Reveal é 100% visual — nada no reveal component pode "re-rolar" nada.

**Achado 6 — nenhum analytics e nenhum reduced-motion existiam antes desta sprint.** Grep exaustivo em `components/packs/*` não encontrou `posthog`/`trackEvent`/`gtag` nem `prefers-reduced-motion`/`useReducedMotion`. Documentado como limitação herdada, não regressão.

## Arquitetura — antes e depois

**Antes:**
```
RevealedCard.tsx → PlayerCard (fachada) size="md" — full-artwork já funcionava por herança da Sprint 35D.6
GoatReveal.tsx   → markup bespoke (OVR/nome/bandeira em texto puro) — NUNCA usava PlayerCard nem qualquer resolver
```

**Depois:**
```
RevealedCard.tsx → ResolvedWorldLegendsCard size="md" density="standard"
GoatReveal.tsx   → ResolvedWorldLegendsCard size="lg" density="showcase" (dentro do halo cinemático preservado)
                        ↓
              resolvePlayerCardRendererForDensity (mesma função da Sprint 37, zero duplicação)
                        ↓
        FullArtworkWorldLegendsCard (full-artwork)  OU  composição procedural (fallback)
```

## Densidade escolhida e justificativa

- **RevealedCard (caminho normal)**: `density="standard"`. O container é 130×175px — maior que Compact justificaria, mas Showcase seria desnecessariamente pesado pra um card revelado nesse tamanho de tela cheia parcial.
- **GoatReveal (caminho GOAT)**: `density="showcase"`. É genuinely a apresentação hero da cinemática mais rara do jogo — tela cheia, confetti, halo dourado — Showcase é o asset correto.
- **Silhueta de suspense (Legendary/Ultra, dentro de `RevealedCard`)**: também `density="standard"` — a MESMA imagem que será usada na revelação final, então o navegador já tem o asset em cache pelo momento em que a face frontal vira visível (preload natural, sem mecanismo extra).

## Regras de estado do reveal

1. **RevealedCard — silhueta pré-reveal**: a carta resolvida já monta durante os estágios `silhouette`/`name` da antecipação (Legendary/Ultra), com `filter: brightness(0)` (blackout visual). Como full-artwork usa `<Image alt={displayName}>`, um leitor de tela SEM proteção anunciaria o nome antes do estágio "nome" pretendido pelo design. Adicionado `aria-hidden="true"` no wrapper da silhueta — a única mudança de acessibilidade desta sprint, cirúrgica, não relacionada a redesenho.
2. **GoatReveal — card final**: `<ResolvedWorldLegendsCard>` só existe dentro do bloco `{(phase === 'card' || phase === 'burst' || phase === 'hold') && (...)}`, o MESMO gate que já existia (não criei um novo). Durante `dark`/`text` não há absolutamente nenhuma menção a `card.card.*` no JSX — confirmado por teste de código-fonte (não sobrou nenhum `{card.card.overall}`/`{card.card.displayName}`/`{card.card.flagEmoji}` fora do componente resolvido).
3. **Preload**: nenhum preload explícito foi adicionado no caminho GOAT. A recompensa já é conhecida ~2.1s antes da fase `card` (fase `text` roda de 900ms a 2100ms) — tempo suficiente pra um webp de ~300-400KB carregar em condições normais. Documentado como decisão consciente (`loading="eager"` já é o padrão do `FullArtworkWorldLegendsCard` pra densidade showcase — a imagem começa a buscar assim que o componente monta, no início da fase `card`).

## Markup obsoleto removido

Dentro do halo cinemático de `GoatReveal.tsx` (glow/shimmer/rainbow/pulse-ring — **todos preservados**), o antigo "Card content" — `<p>{card.card.overall}</p>`, `<p>{card.card.displayName}</p>` (com animação letra-por-letra na fase `hold`), `<p>{flagEmoji} {position} · {era}</p>` — foi removido por completo e substituído por `<ResolvedWorldLegendsCard>`. A variável `nameLetters` (usada só por esse markup) também foi removida. O label decorativo "LENDA SUPREMA" (abaixo do card, não é identidade do jogador) permanece intocado.

## Preservado

- Todas as fases/timing/choreography de ambos os componentes — nenhum delay, easing ou spring foi alterado.
- Sons e haptics: `SFX.cardGoat`, `vibrate('cardGoat')`, `vibrate('packCharge')` — intocados.
- Skip: `handleTap` em `GoatReveal` continua só transicionando fase/timers, nenhuma chamada de rede/mutação — confirmado por teste de código-fonte.
- `card` (a recompensa) nunca é reatribuído — vem só das props, mesmo objeto do início ao fim.
- Persistência: já acontecia antes de `REVEAL` montar (achado 5) — nenhuma mudança.
- Duplicatas, atualização de inventário, `RevealSummary` — nenhum arquivo tocado.
- Navegação, comportamento mobile — nenhuma branch condicional por viewport existia antes; nenhuma foi criada.

## Arquivos alterados/criados

**Modificados:**
- `components/packs/RevealedCard.tsx` — `PlayerCard` → `ResolvedWorldLegendsCard` (2 usos: silhueta com `aria-hidden`, face frontal com `density="standard"`).
- `components/packs/GoatReveal.tsx` — markup bespoke do card final removido, substituído por `ResolvedWorldLegendsCard` (`density="showcase"`) dentro do halo cinemático preservado; `nameLetters` removido.

**Criados:**
- `tests/lib/pack-reveal-renderer-integration.test.ts` — 23 testes.

## Testes

23 testes cobrindo os 21 pedidos (mais 2 arquiteturais extras):
1. Jogador elegível (caminho normal) resolve full-artwork Standard.
2. Preset ausente cai no procedural.
3. Densidade Standard ausente cai no procedural (não usa Compact).
4-6. `RevealedCard` só pede Standard, não importa manifesto, não duplica resolver.
7. Jogador GOAT elegível resolve full-artwork Showcase.
8. Card resolvido só existe dentro do gate `card`/`burst`/`hold`.
9. Nenhum markup manual de identidade sobrou nas fases `dark`/`text`.
10-11. Skip não rechama nem reordena a recompensa.
12. Reduced motion — ausência documentada (não regressão).
13. Showcase ausente cai no procedural.
14. Fallback não interrompe a cinemática.
15. Persistência confirmada anterior à animação (nenhuma chamada de action no componente de reveal).
16. Analytics — ausência documentada.
17. Sons/haptics preservados.
18-19. `GoatReveal` só pede Showcase, não importa manifesto, não duplica resolver.
20. Markup bespoke removido, não coexiste com o card resolvido.
21. Os 10 pilotos resolvem pra URLs próprias, na densidade do caminho que cada um realmente usa.
- Extra: procedural nunca pede asset full-artwork em nenhum dos dois caminhos; nenhuma whitelist de jogador; nenhuma reimplementação do critério do resolver.

Suite completa: **348/348 passando** (era 325).

## QA gate

- `pnpm lint` — 0 erros, 462 warnings (baseline).
- `pnpm typecheck` — limpo.
- `pnpm test` — 348/348.
- `pnpm build` — 34/34 tasks, `/packs` 16.2kB → 16.3kB (+0.1kB).

## QA ao vivo (Playwright, `/dev/pack-reveal-qa` — fixture determinística, zero escrita em produção)

Como pedido pelo brief quando as odds reais são não-determinísticas: usei o harness de dev já existente (`PackRevealQaHarness.tsx`, Sprint 34) — abre o `CardRevealScene` REAL com `DrawnCard[]` sintéticos filtrados por raridade, sem chamar `openPackAction`. Selecionar "World Cup Hero" pega os primeiros 3 cards dessa raridade no catálogo (Pelé é o primeiro registrado); "Ultra (GOAT)" pega os primeiros de raridade ultra (Ronaldo Fenômeno).

- **Caminho GOAT, jogador piloto (Pelé)**: fases `dark`→`text`→`card` capturadas — nenhuma identidade visível em `dark`/`text` (só "G-O-A-T" letra por letra e "algo único está chegando"); na fase `card`, artwork exclusivo de Pelé (punho erguido, uniforme amarelo, moldura dourada) aparece dentro do halo cinemático com confetti, "PELÉ", "99", stats. Rede: **exatamente 1 requisição de imagem** — `showcase/wl-goat-brazil-001.webp` — nenhum PNG fonte, nenhum compact/standard.
- **Caminho normal, jogador piloto (Ronaldo Fenômeno, ultra)**: artwork exclusivo (pose correndo) revelado com glow rosa/magenta da raridade ultra, "96" OVR — confirmado via `RevealedCard`.
- **Fallback procedural (Common, "ROJO")**: silhueta procedural padrão, zero placeholder quebrado, zero erro.
- **Skip**: múltiplos toques rápidos avançam as fases e chegam no MESMO card final (Pelé), sem reroll.
- **Reduced motion** (`page.emulateMedia({ reducedMotion: 'reduce' })`): reveal completa normalmente e chega no card correto — como nenhum tratamento especial existe (achado 6), o comportamento é idêntico ao modo normal, sem travar nem quebrar.
- **Mobile (390×844)**: card renderiza corretamente, sem overflow, sem quebra de layout.
- Console: zero erros novos em qualquer cenário, além dos 404s pré-existentes do placeholder de chave do PostHog.

## Limitações conhecidas

- **Reduced motion**: o app não tinha (e continua sem ter) nenhum tratamento de `prefers-reduced-motion` antes desta sprint. Não foi adicionado um sistema novo (fora de escopo — "integration sprint", não "redesign"), mas confirmado que a ausência de tratamento não quebra nem trava o reveal sob essa media query.
- **Analytics**: nenhum evento de analytics existia no Pack Reveal antes desta sprint; nada foi adicionado.
- **Preload explícito**: não implementado no caminho GOAT — decisão documentada (ver seção "Regras de estado do reveal", item Preload) em vez de adicionar complexidade não comprovadamente necessária.
- **Conta QA sem pilotos reais**: a verificação usou o fixture determinístico de dev (`/dev/pack-reveal-qa`), não um pack real aberto pela conta QA — documentado honestamente, consistente com a instrução explícita do brief para este cenário.

## Não alterado

Odds, geração de recompensa, economia, distribuição de raridade, artwork, direção visual, identidades de jogador, nicknames, timing/choreography de animação, sons, comportamento de duplicata, atualização de inventário, persistência, navegação.

## URL de produção

**Status: Ready.** https://world-legends.vercel.app (a confirmar após deploy desta sprint).
