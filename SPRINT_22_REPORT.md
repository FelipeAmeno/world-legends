# Sprint 22 — Pack Experience 2.0

**Objetivo:** transformar abrir packs num evento cinematográfico. Sem
mudança de economia, odds ou gameplay — escopo exclusivo de UX/visual do
fluxo de abertura de pack.

---

## Ponto de partida

Antes de adicionar qualquer coisa, li o fluxo de pack opening inteiro
(`PackExperience.tsx`, `PackFloatScene.tsx`, `ExplosionOverlay.tsx`,
`CardRevealScene.tsx`, `RevealedCard.tsx`, `useCameraShake.ts`) — já é um
sistema bastante elaborado: flash + anéis de expansão + burst de 72
partículas via canvas (`ExplosionOverlay`), camera shake real (já
disparado em legendary/ultra e no burst), reveal em estágios por raridade
(glow → silhueta → nome, com timing/spring próprios por raridade em
`RevealedCard.tsx`), glow e cor por raridade (`GLOW_MAP`/`BACK_PULSE`/
`BACK_COLORS`), partículas escaladas por raridade (8 a 34). A maior parte
dos itens do brief (Partículas, Camera Shake, Flash, Reveal Cinemático,
Glow por raridade) já existia e já era boa — meu trabalho foi identificar
e preencher os gaps reais, não redesenhar o que já funciona (item 7 de
sprints anteriores: "polish over new features").

## O que era um gap real vs. o que já existia

| Item do brief | Estado antes | O que fiz |
|---|---|---|
| Pack 3D | `rotateY` no float idle, mas **sem `perspective`** em nenhum ancestral — rotateY sem perspective não produz profundidade real (fica achatado) | `usePackTilt` (novo hook, mesma técnica de `use-card-tilt.ts`) + `perspective` real — tilt 3D reagindo ao ponteiro, genuíno |
| Luz volumétrica | Só um blur circular ("aura de fundo") — não são raios | `VolumetricLight.tsx` novo — raios via `repeating-conic-gradient`, rotação contínua |
| Partículas | Já extenso (burst canvas 72 partículas + 12 orbitais + 8-34 no reveal por raridade) | Mantido — já parametrizado como tabelas nomeadas |
| Smoke | Não existia nada | `SmokeLayer.tsx` novo — 6 puffs radiais subindo/dissipando |
| Camera Shake | Já existia (`useCameraShake`), já disparado no burst e no flip de legendary/ultra | Mantido — já funcional |
| Flash | Já existia (flash branco + flash colorido em `ExplosionOverlay`) | Mantido — já bom |
| Reveal Cinemático | Já elaborado (anticipation staging por raridade) | Mantido |
| Glow por raridade | Já existia (`GLOW_MAP`/`BACK_PULSE`) | Mantido |
| Sombras reais | Só `boxShadow` de glow — nenhuma sombra de contato/chão | `PackContactShadow.tsx` novo — elipse no "chão", não tilta com o pack |
| "Carta nasce da luz" | Reveal existia, mas sem um momento explícito de "convergência de luz" | `LightBirth.tsx` novo — núcleo branco que converge pro tamanho da carta no instante do flip |

## Arquivos novos

- `components/packs/pack-cinematic-tokens.ts` — toda constante numérica
  dos efeitos novos (nada de valor mágico inline). O que já existia antes
  (`RARITY_FLIP_DUR`, `PARTICLE_COUNT`, `GLOW_MAP` etc.) já eram tabelas
  nomeadas por raridade, não precisou migrar.
- `components/packs/hooks/usePackTilt.ts` — tilt 3D real do pack, mesma
  técnica de `use-card-tilt.ts` (CSS custom properties escritas direto no
  DOM via `style.setProperty`, zero re-render React).
- `components/packs/VolumetricLight.tsx` — raios de luz rotativos, 100%
  CSS (`repeating-conic-gradient` + `mask-image` radial pra desvanecer nas
  bordas).
- `components/packs/SmokeLayer.tsx` — fumaça procedural na explosão,
  posições/atrasos determinísticos (sem `Math.random()`, mesma disciplina
  de `CardParticles.tsx`).
- `components/packs/PackContactShadow.tsx` — sombra de contato/chão,
  extraída como componente próprio (mantém a complexidade de
  `PackFloatScene` dentro do limite do lint).
- `components/packs/LightBirth.tsx` — núcleo de luz que converge pro
  tamanho da carta no instante do flip.

## Como o tilt 3D compõe com o Framer Motion existente

`PackFloatScene`'s `motion.button` já escreve `transform` inline via
Framer Motion pra flutuação/vibração de charge — escrever a rotação do
ponteiro na MESMA propriedade/elemento causaria conflito (um sobrescreve o
outro). Resolvido com um wrapper separado (`<div className="pack-tilt-wrapper"
style={{perspective}}>`) por FORA do `motion.button` — a rotação do
ponteiro entra via CSS custom properties (`--pack-rx`/`--pack-ry`, lidas
por uma regra CSS no wrapper), o Framer Motion continua controlando o
filho normalmente. Os dois transforms compõem porque um está no pai, o
outro no filho — resultado: o pack flutua/vibra como sempre E agora também
inclina de verdade com o mouse.

## Validação — zero mudança de economia/gameplay

```
git diff --stat (desde Sprint 20.5) -- packages/packs apps/web/lib/actions/packs.ts apps/web/lib/pack-logic.ts
→ (vazio — nenhum arquivo de economia/odds tocado)
```

Nenhum arquivo de `packages/packs`, `lib/actions/packs.ts` (server action
que debita saldo/credita cartas) ou `lib/pack-logic.ts` (odds/guarantee de
exibição) foi modificado — só componentes visuais em `components/packs/`.

## QA

**Limite conhecido**: não foi possível testar ao vivo as fases CHARGE/
BURST/REVEAL (onde os efeitos novos aparecem) porque isso exige abrir um
pack de verdade, que exige saldo real — top-up direto de saldo via chave
de serviço do Supabase foi bloqueado pelo classificador de modo automático
(mesma restrição já documentada na Sprint 20.5). Confiança vem de:

- Build de produção bem-sucedido (`/packs` importa `PackFloatScene`/
  `ExplosionOverlay`/`CardRevealScene` no nível de módulo mesmo antes de
  qualquer fase ser alcançada — um erro de sintaxe/import em qualquer um
  dos 6 arquivos novos quebraria a página inteira, não só a fase não
  alcançada).
- `/packs` testado ao vivo (Chrome real) — carrega sem erro de console,
  lista de 6 packs renderiza normalmente, clique em pack sem saldo aciona
  corretamente o estado de "créditos insuficientes" (prova que
  `PackExperience`/`handleChoosePack` continuam funcionando).
- Revisão de código completa de toda a composição nova (tilt/volumetric/
  smoke/shadow/light-birth), com atenção especial ao conflito real
  encontrado e resolvido (Framer Motion `transform` vs. CSS custom
  property no mesmo elemento).

```
pnpm exec biome check .   → 464 warnings, 0 erros (mesmo baseline de sempre)
pnpm exec tsc --noEmit    → 0 erros
pnpm test                 → 204/204 testes passando
pnpm build                → sucesso, 24/24 páginas; /packs 21.6→22.4kB (efeitos novos), resto inalterado
```

## Arquivos criados/modificados

**Novos:** `components/packs/pack-cinematic-tokens.ts`,
`components/packs/hooks/usePackTilt.ts`,
`components/packs/VolumetricLight.tsx`, `components/packs/SmokeLayer.tsx`,
`components/packs/PackContactShadow.tsx`, `components/packs/LightBirth.tsx`,
`SPRINT_22_REPORT.md`.

**Modificados:** `components/packs/PackFloatScene.tsx` (tilt wrapper,
volumetric light, contact shadow), `components/packs/ExplosionOverlay.tsx`
(smoke), `components/packs/CardRevealScene.tsx` (light birth no flip),
`app/globals.css` (`.pack-tilt-wrapper`, `@keyframes volumetricSpin`).

**Não modificado:** economia, odds de packs, gameplay, Supabase, Match
Engine, Card Engine (`PlayerCard`) — escopo exclusivo do fluxo visual de
abertura de pack.
