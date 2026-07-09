# Sprint 25 — AAA Pack Store (Featured Pack + Loja Reorganizada)

**Objetivo:** a loja de packs era um dashboard — N cards do mesmo tamanho
numa grade, sem hierarquia visual. Referência explícita: Clash Royale /
Marvel Snap sempre têm um item em destaque com muito impacto visual no
topo, e o resto da loja organiza as outras opções — isso cria uma
sensação de valor muito maior.

## O que mudou

**GOAT Pack em destaque** — sempre o pack de maior valor, sempre no topo,
sozinho, com apresentação cinematográfica completa: luz volumétrica
girando atrás dele, fumaça procedural subindo, partículas orbitais, tilt
3D real reagindo ao ponteiro, flutuação idle, e um botão de CTA explícito
("ABRIR · 75.000c" ou "SALDO INSUFICIENTE · 75.000c") — em vez de depender
só de "toque para abrir" como os cards normais.

**"Mais Packs" abaixo** — os 6 packs restantes (Starter, Classic, Brazil,
Elite, Hero, Legend) em uma grade compacta (2 colunas no mobile, 3 no
desktop), com arte/tipografia reduzidas pra reforçar que são secundários
ao pack em destaque, não competindo por atenção.

Isso muda só a apresentação — nenhum pack novo, nenhum preço novo, nenhuma
mudança de raridade/economia. O GOAT Pack já era o pack mais caro/raro do
catálogo; só ganhou uma vitrine à altura.

## Reaproveitamento — zero reinvenção

Todos os efeitos cinematográficos do pack em destaque já existiam,
construídos na Sprint 22 (Pack Experience 2.0) pra tela de abertura:
`VolumetricLight`, `SmokeLayer`, `PackContactShadow`, `usePackTilt`,
`PackArt`. O novo `FeaturedPackCard.tsx` só monta esses componentes numa
apresentação "em repouso" permanente (idle only, sem a fase CHARGE que só
faz sentido durante a abertura de fato) — nenhum efeito visual novo foi
inventado, é a mesma identidade da tela de abertura, agora também na loja.

`PACK_VISUALS` (gradiente/label por pack) foi extraído de dentro de
`PackFloatScene.tsx` pra `pack-visuals.ts`, já que agora dois lugares
(loja + tela de abertura) precisam da mesma identidade visual por pack —
uma fonte só, evita divergência futura.

## Bug real encontrado e corrigido durante a validação: hydration mismatch

Ao testar a loja num browser real (não só build), o console acusava um
erro de hydration mismatch do React assim que a página carregava. Causa:
`SmokeLayer` e as partículas orbitais usam `motion.div` do Framer Motion
com `width`/`height`/`top`/`left` **numéricos** (`120` em vez de
`"120px"`) — esse padrão já existia desde a Sprint 22, mas nunca tinha
sido server-side-rendered antes, porque só aparecia depois que o usuário
escolhia um pack (fluxo 100% client-side). Agora que o pack em destaque
aparece na primeira renderização da `/packs`, esses componentes passaram
a ser SSR'ds pela primeira vez — e o SSR do Framer Motion serializa esses
valores numéricos de um jeito que diverge do primeiro render client.

Correção em duas partes:
1. Converti os valores numéricos pra string com unidade (`` `${p.size}px` ``)
   em `SmokeLayer.tsx`, `PackContactShadow.tsx` e nas partículas orbitais
   — mais correto de qualquer forma.
2. Isso sozinho não bastou (a divergência de `opacity`/`transform` entre o
   estado inicial do Framer Motion e a primeira renderização é inerente a
   como ele lida com `initial`+`animate`). Como `SmokeLayer` e as
   partículas orbitais são 100% decorativas/idle — não precisam existir no
   HTML inicial — extraí as partículas pra `OrbitParticles.tsx` e importei
   as duas via `next/dynamic({ ssr: false })`. Zero mudança visual (ainda
   aparecem imediatamente após o hydrate), zero erro de console.

Confirmado ao vivo (Chrome real, mobile 390×844 e desktop 1280×900): zero
erros de console/página em `/packs` depois da correção.

## Validação

- Testado ao vivo: pack GOAT em destaque renderiza com todos os efeitos
  (luz, fumaça, partículas, tilt) e CTA correto tanto com saldo
  insuficiente ("SALDO INSUFICIENTE · 75.000c") quanto — por inspeção de
  código, já que a conta de QA está com saldo 0 — com saldo suficiente
  ("ABRIR · preço").
- Grade "Mais Packs" confirmada com os 6 packs restantes, tamanhos e
  preços corretos, clique delega pro mesmo `onOpen` de sempre — nenhuma
  mudança no fluxo de abertura (`PackExperience.tsx` inalterado).
- Seção "Em Breve" (Event Pack / Season Pass) intacta, sem mudanças.
- Zero erros de console/página em mobile e desktop.

## QA

```
pnpm exec biome check .   → 463 warnings, 0 erros (1 warning A MENOS que o
                             baseline de 464 — non-null assertion pré-existente
                             em PackFloatScene.tsx corrigida de passagem)
pnpm exec tsc --noEmit    → 0 erros
pnpm test                 → 204/204 testes passando
pnpm build                → sucesso, 24/24 páginas (/packs: 22.4kB → 27.5kB,
                             esperado — componentes novos)
git diff --stat -- packages/packs apps/web/lib/actions apps/web/lib/pack-logic.ts
  → (vazio — nenhum arquivo de economia/gameplay/Supabase tocado)
```

## Arquivos criados/modificados

**Novos:** `SPRINT_25_AAA_PACK_STORE.md`,
`components/packs/FeaturedPackCard.tsx`,
`components/packs/OrbitParticles.tsx`,
`components/packs/pack-visuals.ts`.

**Modificados:** `components/packs/PackSelector.tsx` (separa GOAT como
destaque, resto vira grade compacta via novo prop `compact` em
`PackCard`), `components/packs/PackFloatScene.tsx` (usa `PACK_VISUALS`
extraído + `resolvePackVisual` em vez de duplicar a tabela),
`components/packs/SmokeLayer.tsx`,
`components/packs/PackContactShadow.tsx` (valores numéricos → string com
unidade, fix de hydration).

**Não modificado:** economia, gameplay, Supabase, engine de packs
(`packages/packs`), fluxo de abertura (`PackExperience.tsx`).
