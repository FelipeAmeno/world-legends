# Sprint 3 — Game Feel System

**Data:** 2026-07-04  
**Objetivo:** Parar de parecer um CRUD com cartas e começar a parecer um jogo premium.  
**Regra:** Nenhuma mecânica nova. Nenhuma regra alterada. Apenas experiência do jogador.

---

## Arquivos Criados

### 1. `lib/motion-tokens.ts` — Central de tokens de animação

Fonte única de verdade para todos os valores de animação do projeto.

```typescript
import { DURATION, EASE, SPRING, VARIANTS, PRESS, PAGE_TRANSITION } from '@/lib/motion-tokens';
```

| Token | Valores |
|-------|---------|
| `DURATION` | `instant(80ms)` · `fast(120ms)` · `base(200ms)` · `slow(350ms)` · `enter(500ms)` · `exit(220ms)` · `long(800ms)` |
| `EASE` | `spring` · `smooth` · `out` · `in` · `inOut` · `linear` |
| `SPRING` | `snappy` · `smooth` · `bouncy` · `gentle` · `wobbly` |
| `VARIANTS` | `fade` · `slideUp` · `slideRight` · `pop` · `scale` · `toast` · `staggerContainer` · `staggerItem` |
| `PRESS` | `whileHover/Tap` · `heroHover/Tap` · `subtleHover/Tap` |

**Regra de uso:** Nunca escreva durações ou beziers diretamente nos componentes.

---

### 2. `lib/animation-priority.ts` — Sistema de prioridade

Previne conflitos entre animações simultâneas (ex: pack opening vs level up).

```typescript
import { useAnimationPriority, PRIORITY, animPriority } from '@/lib/animation-priority';

// Em um componente
const { lock, unlock, canPlay } = useAnimationPriority();
if (!canPlay(PRIORITY.REWARD)) return;
lock(PRIORITY.REWARD, 'pack-opening');
// ... animação
unlock('pack-opening');
```

| Nível | Valor | Uso |
|-------|-------|-----|
| `AMBIENT` | 0 | loops de fundo, pulsos |
| `MICRO` | 1 | hover, tap, ripple |
| `UI` | 2 | toasts, badges |
| `TRANSITION` | 3 | transições de tela |
| `REWARD` | 4 | recompensas, pack opening |
| `LEVELUP` | 5 | level up (topo absoluto) |

---

### 3. `lib/wl-toast.ts` — Toast system leve

Separado do sistema de notificações. Para feedback imediato de ações.

```typescript
import { toast } from '@/lib/wl-toast';

toast.success('Squad salvo!', '⚽');
toast.error('Créditos insuficientes');
toast.reward('Founder Pack desbloqueado! 🎁', '📦', 4000);
toast.info('Partida encontrada...');
toast.warning('Saldo baixo');
```

Tipos: `success` · `error` · `reward` · `info` · `warning`

---

### 4. `components/ui/WLToast.tsx` — Componente de Toast

Renderizado no root layout (`app/layout.tsx`). Até 4 toasts simultâneos, auto-dismiss.

**Features:**
- Barra de progresso animada (esgota no tempo de duração)
- Shimmer line decorativa no topo
- Spring animation na entrada/saída
- Cores por tipo (verde=sucesso, vermelho=erro, dourado=recompensa, azul=info)
- Dismiss ao clicar

---

### 5. `components/fx/Particles.tsx` — Sistema de partículas

6 presets prontos para uso, baseados em Framer Motion.

```typescript
import { Particles, useBurst } from '@/components/fx/Particles';

// Estático
<Particles preset="gold" count={20} autoPlay burst />

// Com trigger externo
const { trigger, fire } = useBurst();
<button onClick={fire}>Recompensar</button>
<Particles preset="confetti" count={35} trigger={trigger} />
```

| Preset | Aparência | Uso |
|--------|-----------|-----|
| `gold` | Moedas douradas brilhantes | Recompensas de créditos |
| `sparkle` | Brilhos brancos etéreos | Carta rara revelada |
| `smoke` | Círculos acinzentados que sobem | Impacto, fumaça |
| `sparks` | Riscos azuis elétricos | Carta elite/elétrica |
| `confetti` | Retângulos coloridos | Vitória, level up |
| `energy` | Pulsos dourados | Ação especial |

Todos os parâmetros são configuráveis: `count`, `origin`, `autoPlay`, `burst`, `trigger`.

---

### 6. `components/fx/PageTransition.tsx` — Transições de tela

```typescript
import { PageTransition, FadeIn, StaggerList, StaggerItem } from '@/components/fx/PageTransition';

// Aplicado automaticamente pelo AppShell em todas as telas
<PageTransition key={pathname} mode="slide-up">...</PageTransition>

// Animação de entrada para blocos
<FadeIn delay={0.1}>
  <ComponenteQualquer />
</FadeIn>

// Lista com stagger
<StaggerList>
  {items.map(item => <StaggerItem key={item.id}>{...}</StaggerItem>)}
</StaggerList>
```

Modos: `fade` · `slide-up` (padrão) · `slide-left` · `scale`

**Integrado:** `AppShell` usa `PageTransition` em todas as rotas não-fullscreen.

---

### 7. `components/ui/Skeleton.tsx` — Skeletons premium

```typescript
import { Skeleton, SkeletonCard, SkeletonList, SkeletonProfile } from '@/components/ui/Skeleton';

// Polimórfico
<Skeleton variant="card" />
<Skeleton variant="profile" />
<Skeleton variant="grid-2" />
<Skeleton variant="leaderboard" />

// Direto
<SkeletonCard />
<SkeletonCardWide />
<SkeletonProfile />
<SkeletonLeaderboard />
<SkeletonGrid2 count={4} />
<SkeletonList count={5} />
<SkeletonPack />
<SkeletonText lines={3} />
```

Animação: shimmer com `background-position` animado via CSS.

---

### 8. `components/ui/EmptyState.tsx` — Estados vazios premium

```typescript
import { EmptyState } from '@/components/ui/EmptyState';

// Preset automático
<EmptyState variant="collection" />

// Customizado
<EmptyState
  variant="matches"
  title="Nenhuma partida ainda"
  cta={{ label: 'Jogar agora', href: '/match' }}
/>
```

| Variante | Ícone | CTA padrão |
|----------|-------|------------|
| `collection` | 🃏 | Abrir Packs → /packs |
| `squad` | ⚽ | Montar Squad → /squad |
| `matches` | 🏟 | Jogar Agora → /match |
| `leaderboard` | 🏆 | Jogar → /match |
| `missions` | 🎯 | — |
| `notifications` | 🔔 | — |
| `generic` | ✦ | — |

**Integrado:** Página de coleção (`/collection`) usa `EmptyState` quando usuário tem 0 cartas.

---

### 9. `components/ui/LoadingScreen.tsx` — Loading Screen oficial

```typescript
import { LoadingScreen } from '@/components/ui/LoadingScreen';

// Tela inteira (splash screen)
<LoadingScreen variant="full" message="Carregando lendas..." />

// Inline (dentro de container)
<LoadingScreen variant="inline" />

// Overlay sobre conteúdo
<LoadingScreen variant="overlay" visible={isLoading} />
```

**Design:**
- Logo WL animado com float e glow dourado
- Logotipo "WORLD LEGENDS" em ouro com sombra
- Subtítulo "Collectible Football Card Game"
- Barra de progresso dourada (animação de preenchimento)
- 3 pontos pulsantes no rodapé
- Background com blobs animados de glow

---

### 10. `components/ui/MicroFeedback.tsx` — Microinterações

```typescript
import { Tap, Press } from '@/components/ui/MicroFeedback';

// Ripple + scale + haptic + glow
<Tap haptic="tap" glow="gold" variant="hero">
  <button>Abrir Pack</button>
</Tap>

// Apenas scale
<Press scale={0.95}>
  <div>Qualquer elemento</div>
</Press>
```

**Features do `<Tap>`:**
- Efeito ripple no ponto exato do clique
- Scale press via Framer Motion
- Hover glow configurável (`gold` · `green` · `red` · `blue`)
- Haptic feedback via `vibrate()`
- 4 variantes de intensidade: `default` · `hero` · `subtle` · `none`
- Suporte a `disabled`

---

## Arquivos Atualizados

### `lib/haptics.ts` — Biblioteca expandida

**Novos padrões adicionados:**

```typescript
import { UI_HAPTIC } from '@/lib/haptics';

UI_HAPTIC.tap();        // toque leve em botão
UI_HAPTIC.success();    // ação concluída
UI_HAPTIC.error();      // erro
UI_HAPTIC.toggle();     // switch
UI_HAPTIC.navTap();     // navegação
UI_HAPTIC.levelUp();    // level up!
UI_HAPTIC.missionDone();
UI_HAPTIC.reward('large');  // 'small' | 'medium' | 'large'
```

Novos padrões: `tap` · `tapHeavy` · `toggle` · `swipe` · `error` · `success` · `warning` · `goalScored` · `goalConceded` · `matchStart` · `matchEnd` · `foul` · `redCard` · `rewardSmall` · `rewardMedium` · `rewardLarge` · `levelUp` · `missionComplete` · `navTap` · `pageEnter`

---

### `lib/sound-manager.ts` — Catálogo expandido

**Novos objetos:**

```typescript
import { UI_SFX, MATCH_SFX, REWARD_SFX } from '@/lib/sound-manager';

UI_SFX.tap();       // clique seco
UI_SFX.success();   // confirmação positiva (arpejo)
UI_SFX.error();     // buzz negativo
UI_SFX.toggle();    // switch mecânico
UI_SFX.navigate();  // transição suave
UI_SFX.save();      // save confirmado

MATCH_SFX.goal();     // torcida sintética
MATCH_SFX.kickoff();  // apito inicial
MATCH_SFX.fullTime(); // apito triplo final
MATCH_SFX.win();      // fanfare de vitória
MATCH_SFX.lose();     // tom descendente

REWARD_SFX.coins();       // moedas caindo
REWARD_SFX.xp();          // chime ascendente
REWARD_SFX.levelUp();     // fanfare + shimmer peak
REWARD_SFX.missionDone(); // arpejo completo
```

Todos sintéticos (Web Audio API). Para sons reais: adicionar em `/public/sounds/` e substituir `playTone()` por `playBuffer()`.

---

### `app/globals.css` — Novos keyframes (+120 linhas)

| Keyframe | Uso |
|----------|-----|
| `skeleton-shimmer` | Animação dos skeletons |
| `wl-ripple` | Efeito ripple do MicroFeedback |
| `gold-sweep` | Shimmer sweep em botões gold |
| `float-y` | Float vertical para elementos ambientes |
| `pulse-ring` | Anel pulsante expandindo |
| `twinkle` | Piscar de estrelas/brilhos |
| `bounce-in` | Entrada com bounce |
| `slide-up-fade` | Entrada rápida com fade |
| `toast-progress` | Barra de progresso do toast |
| `count-up` | Animação de números contando |
| `glow-green` | Pulso verde (sucesso) |

**Novas classes utilitárias:**
- `.animate-glow-gold` · `.animate-glow-green`
- `.animate-float` · `.animate-ripple` · `.animate-skeleton`
- `.animate-bounce-in` · `.gold-sweep`
- `.tap-highlight` (mobile touch color)
- `.pt-safe` · `.pb-safe` · `.pl-safe` · `.pr-safe`

---

### `tailwind.config.ts` — Tokens adicionados

10 novos valores de `animation` + 10 `keyframes` correspondentes, mapeando todos os novos CSS keyframes para classes Tailwind.

---

### `components/nav/AppShell.tsx`

`PageTransition key={pathname}` aplicado em todas as rotas não-fullscreen (mobile + desktop). Cada mudança de rota agora tem entrada suave com `slide-up`.

---

### `components/home/PremiumBottomNav.tsx`

`UI_HAPTIC.navTap()` disparado em cada item de navegação via `onClick`.

---

### `components/squad/premium/PitchBuilder.tsx`

- `toast.success('Squad salvo!')` após save bem-sucedido
- `toast.error('Erro ao salvar squad')` em caso de falha

---

### `components/home/NewUserWelcome.tsx`

`toast.reward('Founder Pack desbloqueado! 🎁')` após claimStarterPack().

---

### `app/collection/page.tsx`

`<EmptyState variant="collection" />` renderizado quando usuário autenticado tem 0 cartas.

---

## Sistema de Prioridades de Animação

```
LEVELUP  (5) ──── Nada interrompe
REWARD   (4) ──── Pack opening, recompensas
TRANSITION(3)──── Mudança de tela
UI       (2) ──── Toasts, modais
MICRO    (1) ──── Hover, tap, ripple
AMBIENT  (0) ──── Loops de fundo
```

Uma animação de nível N não inicia se houver lock de nível ≥ N ativo.

---

## Checklist de Conformidade

- [x] Nenhuma mecânica nova adicionada
- [x] Nenhuma regra de gameplay alterada
- [x] Nenhum balanceamento modificado
- [x] Match Engine intocado
- [x] Economia intocada (créditos, XP, packs)
- [x] Build passando sem erros
- [x] TypeScript sem erros
- [x] Todos os sistemas são opt-in (backward compatible)

---

## Como Usar em Novos Componentes

```typescript
// 1. Animação consistente
import { VARIANTS, SPRING, DURATION } from '@/lib/motion-tokens';
<motion.div variants={VARIANTS.slideUp} initial="hidden" animate="visible" />

// 2. Feedback de ação
import { toast } from '@/lib/wl-toast';
toast.success('Feito!');

// 3. Press com ripple
import { Tap } from '@/components/ui/MicroFeedback';
<Tap haptic="tap" glow="gold"><button>Ação</button></Tap>

// 4. Particles em eventos especiais
import { Particles, useBurst } from '@/components/fx/Particles';
const { trigger, fire } = useBurst();
<Particles preset="confetti" count={30} trigger={trigger} />

// 5. Loading state
import { LoadingScreen } from '@/components/ui/LoadingScreen';
<LoadingScreen variant="inline" />

// 6. Estado vazio
import { EmptyState } from '@/components/ui/EmptyState';
<EmptyState variant="matches" />

// 7. Haptic
import { UI_HAPTIC } from '@/lib/haptics';
UI_HAPTIC.success();

// 8. Som
import { UI_SFX } from '@/lib/sound-manager';
UI_SFX.success();
```
