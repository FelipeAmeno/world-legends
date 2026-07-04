# Sprint 4 — Gameplay Polish

**Data:** 2026-07-04  
**Objetivo:** Transformar as experiências principais em experiências premium.  
**Regra:** Nenhuma mecânica, regra, economia, raridade, drop, balanceamento ou backend alterado.

---

## 1. Pack Experience V2

**Arquivo modificado:** `apps/web/components/packs/PackFloatScene.tsx`

**Adicionado:**
- Texto "ABRINDO..." animado durante a fase CHARGE — pulsa com gradiente de cor do pack e glow
- O texto anterior ("Toque no pack para abrir") some suavemente ao iniciar o charge
- Container de altura fixa evita layout shift entre os dois estados

**Arquivo modificado:** `apps/web/components/packs/CardRevealScene.tsx`

**Adicionado:**
- **Suspense beat:** 600ms de escuridão com glow radial pulsante antes das cartas entrarem
- Cartas aguardam o suspense antes de iniciar as animações de entrada
- Entrada das cartas mais suave: `y: 90` → `0` com spring `stiffness: 220`
- Botão "Revelar todas" agora mostra quantas faltam: `Revelar todas (7) →`
- Botão estilizado com cor do pack (não mais genérico)
- Estado final: quando todas são reveladas, aparece `✨ PACK REVELADO` com spring animation

**Já existia (mantido intacto):**
- GoatReveal com fases dark → text → card → burst → hold
- ExplosionOverlay com Canvas burst
- ConfettiCanvas para raridades altas
- Haptics + sons por raridade
- Skip com double-tap
- Partículas por raridade no flip

---

## 2. Collection V2

**Arquivo modificado:** `apps/web/components/collection/CollectionExperience.tsx`

**Adicionado:** `CollectionProgressHeader` — header animado no topo da coleção:

- Título "COLEÇÃO" em gold (consistente com demais páginas)
- Contador animado de cartas (animação spring quando muda)
- Quando filtros estão ativos: mostra `X de N cartas`
- **Breakdown por raridade:** pills coloridas com contagem por raridade
  - `WCH` (branco) · `Ultra` (rosa) · `Lendária` (ouro) · `Elite` (azul) · `Rara` (roxo) · `Comum` (cinza)
  - Raridades com 0 cartas são omitidas automaticamente
- Entrada animada com `SPRING.smooth` no mount da página
- Separado por `border-b` do restante da UI

**Já existia (mantido intacto):**
- FilterBar com busca, ordenação, modo grid/list
- FilterPanel com filtros avançados por posição, raridade, era, país
- VirtualCardGrid com lazy loading e IntersectionObserver
- CardDetailModal premium
- CompareModal (2–4 cartas)
- Favoritos via localStorage

---

## 3. Squad Builder V2

**Arquivo modificado:** `apps/web/components/squad/premium/PitchBuilder.tsx`

**Adicionado:**
- **Save Celebration:** quando o squad é salvo com sucesso, `useBurst()` dispara confetti dourado/colorido (`preset="confetti"`, 28 partículas) a partir do topo do campo
- Partículas do `<Particles>` renderizadas dentro do container com `position: relative`
- `fireSaveBurst()` chamado junto com `toast.success()` após save bem-sucedido

**Já existia (mantido intacto):**
- Auto-save com debounce 1.5s
- DnD com @dnd-kit (PointerSensor + TouchSensor)
- FormationSelect com 6 formações
- PremiumPitch com SVG markings e chemistry lines
- BenchStrip
- CardPoolSheet
- AutoFill
- Botão "⚽ Jogar" aparece quando squad está completo e salvo

---

## 4. Match Presentation

**Arquivo modificado:** `apps/web/components/match/premium/PreMatchScreen.tsx`  
**Reescrita completa do componente — mesma interface, nova apresentação.**

**Adicionado:**

### Atmosfera de estádio
- Gradiente de grama no rodapé (verde escuro → transparente)
- Gradiente de atmosfera noturna no topo (azul escuro)
- Glow verde pulsante no centro (campo de futebol)
- Glows laterais nas cores dos times (casa/visitante)

### Escudos animados (`TeamShield`)
- Hexagonal shield com `clipPath: polygon(...)` 
- Cor do time aplicada ao background, borda e texto
- Glow pulsante do shield sincronizado com delay por lado
- OVR com drop-shadow na cor do time, entrada spring `bouncy`
- Nome do time centralizado abaixo

### Countdown cinemático (`CountdownDigit`)
- AnimatePresence `mode="wait"` para troca suave de dígito
- Entrada: `scale: 2.2 → 1` (parece "cair" do alto)
- Saída: `scale: 0.5` (encolhe para sumir)
- Bola ⚽ aparece quando chega a 0
- Gradient dourado no número

### Alinhamentos animados
- Cada linha de jogador entra com `x: -8/+8 → 0` com delay escalonado (0.035s por linha)
- Direção da entrada varia por lado (casa/visitante)

### Barra de probabilidade
- Transição suave de 33%→real em 1.3s com delay

**Já existia (mantido intacto):**
- `computeWinProbability()` do match-data
- `getUserLineup()` para escalação do usuário
- Countdown automático (5s)
- Botão "Pular contagem"

---

## 5. Level Up Experience

**Arquivo reescrito:** `apps/web/components/flow/LevelUpOverlay.tsx`  
**Substituição completa por Framer Motion — mesma interface com GameContext.**

**Fases da animação:**

| Fase | Delay | O que acontece |
|------|-------|----------------|
| `enter` | 0ms | Overlay faz fade in, números dos níveis entram |
| `xp` | 350ms | XP bar aparece e preenche de 0% → 100% |
| `burst` | 1150ms | 36 partículas explodem, anéis se expandem, badge do novo nível pulsa |
| `title` | 2000ms | "Novo título" aparece com spring bouncy |
| `done` | 2800ms | Botão CONTINUAR aparece, overlay vira clickável |

**Detalhes visuais:**
- 36 partículas determinísticas (sem `Math.random()` no render) em 7 cores: ouro, ouro claro, amarelo, branco, verde, azul, roxo
- Anéis de expansão dourados (2 ondas com delay)
- Badge do novo nível: borda 3px dourada, glow pulsante, número com gradiente branco→ouro
- XP bar: gradiente `#8c6f27 → #c9a84c → #e6c85a` com glow, transição `EASE.smooth`
- Novo título: pill com background dourado sutil, texto com gradiente tri-stop
- Botão: `whileHover scale(1.04)` + glow intensificado
- Clique em qualquer lugar funciona apenas na fase `done`
- `backdropFilter: blur(8px)` mais forte que antes

**Antes:** usava CSS animations (`animate-[slideUp_0.5s]`, `animate-[pulseGold_1s]`, classe `.particle`)  
**Agora:** 100% Framer Motion com fases controladas por state machine

---

## Arquivos Criados

Nenhum arquivo novo criado — todos os sistemas da Sprint 4 foram implementados como melhorias nos arquivos existentes, reutilizando os sistemas da Sprint 3 (`Particles`, `SPRING`, `EASE`).

---

## Arquivos Modificados

| Arquivo | Tipo | Sprint 4 |
|---------|------|----------|
| `components/flow/LevelUpOverlay.tsx` | Reescrita | Level Up Experience — state machine Framer Motion |
| `components/collection/CollectionExperience.tsx` | Adição | Progress header + rarity breakdown |
| `components/match/premium/PreMatchScreen.tsx` | Reescrita | Stadium atmosphere + TeamShield + CountdownDigit |
| `components/packs/PackFloatScene.tsx` | Adição | "ABRINDO..." animado no CHARGE |
| `components/packs/CardRevealScene.tsx` | Adição | Suspense beat + reveal melhorado + estado final |
| `components/squad/premium/PitchBuilder.tsx` | Adição | Confetti burst no save |

---

## Checklist de Conformidade

- [x] Nenhuma mecânica de jogo nova adicionada
- [x] Nenhuma regra alterada
- [x] Economia intocada (créditos, XP, packs)
- [x] Match Engine intocado
- [x] Raridades e drops intocados
- [x] Balanceamento intocado
- [x] Backend intocado (zero novas server actions ou queries)
- [x] Build passa sem erros TypeScript
- [x] Todos os sistemas são aditivos (backward compatible)

---

## Bônus: Fix de Deploy (Vercel)

**Arquivo modificado:** `apps/web/vercel.json`

**Problema:** `pnpm --filter @world-legends/web... build` executava packages dependentes em paralelo, então `@world-legends/bench` e `@world-legends/squad` iniciavam o build antes de `@world-legends/types` terminar de gerar o `dist/`.

**Fix:** Trocado para `npx turbo build --filter=@world-legends/web...`

Turbo lê o `turbo.json` que já tem `"build": { "dependsOn": ["^build"] }` — garante ordem topológica: `shared` → `types` → demais packages → `web`.
