# Sprint 19 — Game Feel & Immersion

**Objetivo:** "O World Legends já funciona. Agora ele precisa ser divertido."
**Regra vigente:** entre A) mais funcionalidades e B) melhorar o que já existe, sempre B.

---

## Fase 1 — Auditoria (jogar como usuário novo)

Fluxo completo testado com conta nova (Playwright + navegação manual): Criar conta → Login →
Home → Packs (Classic/Brazil/Elite/Hero/Legend/GOAT) → Coleção → Dream Team/Squad → Match →
Missões → Perfil → Settings → Logout → Login novamente.

### Achado principal (crítico)

O app inteiro tinha uma **arquitetura de estado fantasma**: `lib/game-context.tsx`
(`GameProvider`/`useGameState`), montada globalmente em `app/layout.tsx`, é um protótipo
client-only pré-Supabase cuja flag `isOnboarded` nunca é ligada no app real (só a rota órfã
`/enter`, que nada linka, chama `onboard()`). Resultado prático, visto na auditoria:

- **Home** (`PlayerHeader`, `QuickStats`): nome "Jogador", créditos e OVR sempre zerados/travados,
  mesmo com saldo e squad reais no Supabase.
- **Perfil** (`ProfileHero`): mesmo problema — nível, XP, créditos sempre fantasmas.
- **Settings**: perfil exibido nunca era o usuário logado.
- **Nav mobile e desktop** (`MobileHeader`, `GameTopBar`): pill de créditos escondida/zerada.
- Nenhum erro no console — o bug era silencioso, cada tela renderizava "algo", nunca quebrava.

Esse foi o achado mais impactante da sprint: todo usuário real via dados falsos no HUD desde o
primeiro login.

### Achados secundários

- `components/squad/premium/PitchBuilder.tsx`: mensagem "Abrindo seu time…" ficava presa
  indefinidamente para squads vazios (sem pistas se era loading ou "sem cartas ainda").
- `components/profile/premium/BestCardShowcase.tsx`: sem melhor carta, a seção simplesmente
  desaparecia (`return null`) em vez de orientar o jogador.
- `components/match/premium/OpponentPicker.tsx`: probabilidade de vitória calculada com
  `SQUAD_RATING` mockado (`lib/mock-data.ts`) em vez do OVR real do squad do usuário — mesma
  classe de bug do achado principal, isolada durante a Fase QA final.
- 6 das 7 telas de loading (`app/*/loading.tsx`) usavam blocos `animate-pulse` chapados em vez
  do sistema de shimmer já existente em `components/ui/Skeleton.tsx`.

---

## O que foi corrigido/implementado

### 1. Dados reais no HUD (achado principal)

Substituído o contexto fantasma por dados reais buscados no servidor e passados como props,
em 6 pontos de entrada: `app/layout.tsx`, `app/page.tsx`, `app/profile/page.tsx`,
`app/settings/page.tsx`, `app/packs/page.tsx`, `app/match/page.tsx`.

- **Nível/XP**: como `ProfileRow` não tem coluna de XP, criei `deriveAccountProgress()` em
  `lib/rewards-data.ts`, derivando nível/XP a cada carga de página a partir de sinais reais
  (vitórias, empates, tamanho da coleção), reaproveitando a fórmula `xpForLevel`/`applyXp` já
  existente (não criei coluna nova no banco — fora do escopo "não alterar Supabase").
- Componentes migrados de `useGameState()`/`useGame()` para props: `PlayerHeader`,
  `ProfileHero`, `MobileHeader`, `GameTopBar`, `SettingsPage`, `QuickStats`.
- `PostHogProvider` e `ActivityFeed` também leem o contexto fantasma mas foram deixados como
  estão: o primeiro só afeta enriquecimento de analytics (invisível ao usuário), o segundo
  sempre renderiza vazio por falta de um feed de eventos real — construir isso seria uma
  funcionalidade nova, fora do escopo desta sprint.

### 2. Correção do "OVR falso" no Match

`OpponentPicker.tsx` usava `SQUAD_RATING` (mock estático) para calcular `% de vitória` na tela
de seleção de adversário. Agora `app/match/page.tsx` busca squad + coleção reais do usuário
(mesmo padrão de `buildSBStateFromSaved` + `calcSnapshot` já usado na Home) e passa `userOvr`
real via props até o `OpponentPicker`. Confirmado via screenshot: uma conta sem squad montado
agora mostra corretamente 0% de vitória em vez de uma porcentagem fantasma fixa.

### 3. Estados vazios com intenção

- `PitchBuilder`: distingue "Montando seu time…" (squad sendo calculado) de "Abra um pack para
  conseguir jogadores" (coleção vazia).
- `BestCardShowcase`: estado vazio com ícone + call-to-action, em vez de sumir.

### 4. Loading premium em todas as telas (#65)

Exportado `Shimmer` de `components/ui/Skeleton.tsx` e substituído `animate-pulse` chapado por
shimmer com gradiente animado em `app/loading.tsx`, `app/collection/loading.tsx`,
`app/missions/loading.tsx`, `app/match/loading.tsx`, `app/packs/loading.tsx` e
`app/squad/loading.tsx` (o `/profile/loading.tsx` já usava o sistema correto).

### 5. Camadas base de game feel (#55)

- `lib/haptics.ts`: adicionadas `triggerLight/Medium/Heavy/Success` sobre o sistema de
  vibração já existente.
- `lib/sound-manager.ts`: adicionados efeitos `fragment` e `achievement` a `REWARD_SFX`.
- `lib/audio-manager.ts` (novo): façade `AudioManager`/`playAudio()` sobre o sound-manager
  existente, com try/catch silencioso (áudio nunca deve travar a UI).
- `lib/game-feel.ts` (novo): re-exporta os tokens de `motion-tokens.ts` e adiciona
  `centerOf()`/`flightArc()` para animações de "voo" de recompensas.

### 6. Componentes de feedback (#56)

- `components/ui/PremiumToast.tsx`: re-export do sistema de toast já existente (`WLToast.tsx`),
  documentado como tal — não duplica um sistema que já era premium desde a Sprint 3.
- `lib/wl-toast.ts` / `WLToast.tsx`: novos tipos `achievement`, `mission`, `pack`, `level`.
- `components/ui/FlyingRewards.tsx` (novo): partículas que voam de um elemento a outro
  (ex.: contador de moedas), usando `flightArc()`.
- `components/ui/LevelUpModal.tsx` (novo): versão orientada a props do
  `components/flow/LevelUpOverlay.tsx` (que dependia do contexto fantasma) — sequência de 5
  estágios preservada (entrada → XP → burst de partículas → título → dispensa).
- `components/ui/AchievementPopup.tsx` (novo): banner de conquista com auto-dismiss.

### 7. Level Up real no fluxo de packs (#59, #62)

`PackExperience.tsx` agora recebe `initialWins/initialDraws/initialCollectionCount` reais
(via `app/packs/page.tsx`) e, ao final de cada abertura, recalcula o progresso com
`deriveAccountProgress()`. Se o nível sobe, `LevelUpModal` aparece — o primeiro gatilho real
(não decorativo) desses componentes novos.

### 8. Verificações de "já está bom, não duplicar" (#57, #60, #63, #64)

Consistente com a regra de priorizar melhoria sobre criação, verifiquei antes de reescrever:

- **Match** (`StadiumIntro.tsx`, `LiveMatchView.tsx`): já tem introdução cinematográfica em
  fases (escuro → luzes → times → pronto) e celebração de gol com flash de refletores.
  Não recriado.
- **Squad Builder** (`PremiumPitch.tsx`, `SquadOvrPanel.tsx`): já tem linhas de química
  desenhando com `pathLength`, pulso em conexões perfeitas, jogadores entrando no slot com
  spring, e contadores de OVR/química animados via `AnimatePresence`. Não recriado.
- **Home** (`PremiumHome.tsx`): já tem luzes ambiente "respirando" via `motion.div`.
  Não recriado.
- **Microinterações**: `motion-tokens.ts` já centraliza springs/durações/easings com uma regra
  de código explícita para nunca hardcodar valores nos componentes — extensamente usado em
  toda a base.

---

## O que ficou de fora (decisão consciente, não descoberta tardia)

- **#61 Collection — celebração de país/categoria completo**: existe
  `detectNewlyCompletedSets()` em `lib/collection-sets.ts`, usado hoje em
  `lib/actions/collections.ts` para a tela de Álbum (resgate de recompensa). Fazer essa
  detecção aparecer como celebração *no momento* da abertura do pack exigiria plumbing
  adicional (comparar sets possuídos antes/depois da abertura, não só depois). Não implementado
  nesta sprint — registrado aqui como próximo passo natural, não esquecido.
- **#66 Performance**: auditoria leve feita (sem `<img>` cru, bundle sizes do build de produção
  dentro do normal — Home 334kB, Squad 336kB, Packs 329kB de First Load JS). Nenhuma
  profilagem de FPS/re-render foi feita (sem ferramenta de profiling disponível neste ambiente
  headless); nenhuma mudança de performance foi aplicada às cegas.
- **#67 Polimento geral cross-screen**: não foi feita uma auditoria completa de
  sombras/bordas/blur/tipografia padronizados em todas as telas. O único ponto concreto
  encontrado (dados falsos no Match) foi corrigido; um passe visual completo de padronização
  fica para uma sprint dedicada a isso.

---

## QA final (Fase 3)

Rodado com conta de teste dedicada, headless Playwright, em cada tela após as correções:

- Login → Home: HUD mostra saldo/nome/nível reais (antes: sempre fantasma).
- Packs → abertura → reveal → (Level Up quando aplicável).
- Coleção: shimmer real no loading; estado vazio ok.
- Squad: "Abra um pack para conseguir jogadores" (antes: "Abrindo seu time…" preso).
- Match: seleção de adversário agora com % de vitória real (0% para squad vazio, confirmado
  por screenshot).
- Missões: saldo real no header.
- Perfil → Settings → Logout → redireciona para `/login` → Login novamente → volta para `/`.
- Nenhum erro de console (`pageerror`) em nenhuma etapa.

## Validação técnica

```
pnpm build     → sucesso, sem erros de tipo, 24 rotas geradas
pnpm test      → 204/204 testes passando (10 arquivos)
pnpm exec biome check → apenas warnings pré-existentes, não relacionados às mudanças desta sprint
```

## Arquivos modificados/criados (principais)

Novos: `lib/audio-manager.ts`, `lib/game-feel.ts`, `components/ui/PremiumToast.tsx`,
`components/ui/FlyingRewards.tsx`, `components/ui/LevelUpModal.tsx`,
`components/ui/AchievementPopup.tsx`.

Modificados: `app/layout.tsx`, `app/page.tsx`, `app/profile/page.tsx`, `app/settings/page.tsx`,
`app/packs/page.tsx`, `app/match/page.tsx`, `app/loading.tsx`,
`app/{collection,missions,match,packs,squad}/loading.tsx`, `components/home/{QuickStats,
PlayerHeader,PremiumHome}.tsx`, `components/profile/premium/{ProfileHero,
BestCardShowcase}.tsx`, `components/nav/{MobileHeader,AppShell}.tsx`,
`components/flow/GameTopBar.tsx`, `components/settings/SettingsPage.tsx`,
`components/squad/premium/PitchBuilder.tsx`, `components/packs/PackExperience.tsx`,
`components/match/premium/{MatchExperience,OpponentPicker}.tsx`, `components/ui/Skeleton.tsx`,
`lib/rewards-data.ts`, `lib/haptics.ts`, `lib/sound-manager.ts`, `lib/wl-toast.ts`,
`components/ui/WLToast.tsx`.
