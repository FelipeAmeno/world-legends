# ALPHA POLISH REPORT — World Legends
**Sprint 6 · Data:** 2026-07-05  
**Escopo:** Auditoria UX completa + polish sem novas mecânicas  
**Referências:** Clash Royale · EA FC Mobile · Pokémon TCG Pocket · Marvel Snap · Brawl Stars  

---

## Resumo Executivo

Foram auditados **todos os 27 arquivos de página** e **~80 componentes** do app. Identificamos e corrigimos 10 problemas concretos, de P0 (bloqueadores críticos) a P2 (polish). Nenhuma nova mecânica foi adicionada — apenas UX.

---

## Problemas Encontrados, Prioridade e Solução Aplicada

### P0 — Blockers Críticos

---

#### P0-01 · Onboarding Guest: destino errado após criar nome
**Arquivo:** `app/enter/page.tsx` (linha 31)  
**Problema:** Após o usuário guest inserir seu nome e clicar "Começar Jornada →", o app redirecionava para `/collection` — que está **vazia** para novos usuários. O primeiro momento no jogo era uma tela em branco de coleção, sem cartas e sem nada para fazer.  
**Referência:** Pokémon TCG Pocket e Marvel Snap sempre levam o novo usuário ao pack opening como primeira ação.  
**Solução Aplicada:**
```diff
- router.push('/collection');
+ router.push('/packs');
```
**Resultado:** Novo usuário vai direto para o Pack Selector onde o Founder Pack está esperando.

---

#### P0-02 · Settings: "Sair da Conta" cria auth loop
**Arquivo:** `components/settings/SettingsPage.tsx` (linhas 457 e 474)  
**Problema:** Ao clicar "Logout" ou "Apagar Tudo", o código fazia `window.location.href = '/enter'`. Para usuários autenticados, `/enter` tem um `useEffect` que detecta `user && router.replace('/')` — ou seja, o usuário era redirecionado de volta para a home sem sair de fato. Loop eterno.  
**Solução Aplicada:**
```diff
- window.location.href = '/enter';
+ window.location.href = '/login';
```
**Resultado:** Logout redireciona para `/login`, que não tem redirect de volta. Supabase clearSession ainda precisa ser chamado (ver Próximos Passos).

---

### P1 — Problemas Maiores de UX

---

#### P1-01 · MobileHeader: back button sempre vai para Home
**Arquivo:** `components/nav/MobileHeader.tsx` (linha 103)  
**Problema:** O botão de voltar em todas as sub-páginas fazia `router.push('/')`. Se o usuário navegasse Profile → Settings, o botão de voltar em Settings levava para Home em vez de Profile. Comportamento não-natural, perda de contexto.  
**Referência:** Todos os apps premium (EA FC, Clash Royale, Marvel Snap) usam back nativo.  
**Solução Aplicada:**
```diff
- onClick={() => router.push('/')}
+ onClick={() => router.back()}
```
**Resultado:** Back button respeita o histórico de navegação. O `router.back()` do Next.js 15 usa o histórico do navegador.

---

#### P1-02 · RetentionPanel: barra de missões hardcoded em 33%
**Arquivo:** `components/home/RetentionPanel.tsx` (linhas 137–143)  
**Problema:** O card "Missões do dia" no painel de retenção da Home exibia uma barra de progresso animada que ia de 0% até **33%** como valor fixo. Para um usuário novo (0 missões completas), isso é um dado falso e confuso.  
**Referência:** Brawl Stars mostra progresso real ou barra vazia até o primeiro completar.  
**Solução Aplicada:** Substituído por div estático com `width: 0` (sem animação de dado falso).
```diff
- <motion.div animate={{ width: '33%' }} ... />
+ <div style={{ width: 0 }} />
```
**Resultado:** Barra honesta. Quando missões reais forem conectadas, este componente pode receber o progress real como prop.

---

#### P1-03 · PreMatchScreen: countdown muito curto + label errado
**Arquivo:** `components/match/premium/PreMatchScreen.tsx` (linhas 120 e 295)  
**Problema 1:** Countdown iniciava em **5 segundos** — tempo insuficiente para o usuário ver os times, a probabilidade de vitória e as escalações. O usuário era "jogado" na partida sem processar nada.  
**Problema 2:** O botão de ação dizia "▶ Pular contagem", que tem conotação negativa (como se o jogo fosse começar contra a vontade do usuário). Clash Royale diz "BATTLE!" com visual de aperto.  
**Referência:** EA FC Mobile mostra 8–10s de pré-jogo. Clash Royale diz "BATTLE!".  
**Soluções Aplicadas:**
```diff
- const [countdown, setCountdown] = useState(5);
+ const [countdown, setCountdown] = useState(8);

- ▶ Pular contagem
+ ▶ JOGAR AGORA
```
**Resultado:** +60% de tempo de leitura. Call-to-action mais natural e positivo.

---

#### P1-04 · Login: botão "sem conta" quase invisível
**Arquivo:** `app/login/page.tsx` (linhas 249–254)  
**Problema:** O botão "Explorar sem conta →" tinha `text-white/20 text-xs` — praticamente invisível em fundo escuro. Era uma opção crítica de conversão (usuários que ainda não querem se cadastrar) e estava escondida.  
**Referência:** Marvel Snap tem "PLAY AS GUEST" visível mas secundário. Pokémon TCG Pocket tem "GUEST START" com borda clara.  
**Solução Aplicada:**
```diff
- className="... text-white/20 text-xs ..."
+ className="... border border-white/8 text-white/45 text-xs hover:text-white/70 ..."
  
- 'Explorar sem conta →'
+ '👤 Continuar sem conta'
```
**Resultado:** Botão tem borda visível e ícone, mantendo hierarquia abaixo dos CTAs principais mas descobrível.

---

#### P1-05 · RewardScreen: `useState` usado como `useEffect` (bug)
**Arquivo:** `components/rewards/RewardScreen.tsx` (função `PacksDisplay`)  
**Problema:** O componente `PacksDisplay` usava `useState(() => { setTimeout(onComplete, 2500); })` para auto-avançar. Isto é:
1. **Anti-pattern React** — `useState` não deve ter side effects
2. **Memory leak** — o `setTimeout` nunca era limpo (sem cleanup)
3. **Comportamento incorreto no React 18 Strict Mode** — o initializer roda duas vezes em dev, gerando dois timeouts
**Solução Aplicada:**
```diff
- useState(() => {
-   setTimeout(onComplete, 2500);
- });
+ useEffect(() => {
+   const t = setTimeout(onComplete, 2500);
+   return () => clearTimeout(t);
+ }, [onComplete]);
```
**Resultado:** Comportamento correto, sem memory leak, sem double-fire.

---

### P2 — Polish

---

#### P2-01 · EventBanner: padding inconsistente
**Arquivo:** `components/home/EventBanner.tsx` (linha 92)  
**Problema:** O EventBanner usava `px-5` enquanto todos os outros componentes da Home (`PlayerHeader`, `GameGrid`, `RetentionPanel`, `ProgressTracker`) usam `px-4`. Resultado: banner ligeiramente mais recuado que o restante, quebrando o ritmo visual vertical.  
**Solução Aplicada:**
```diff
- <div className="px-5 stagger-2">
+ <div className="px-4 stagger-2">
```

---

#### P2-02 · GameGrid: "2 ativos agora" hardcoded
**Arquivos:** `components/home/GameGrid.tsx`, `components/home/PremiumHome.tsx`, `app/page.tsx`  
**Problema:** O card de Eventos na GameGrid sempre exibia "2 ativos agora" e o badge "AO VIVO" — mesmo quando nenhum evento estivesse ativo. Dado falso que corrói a confiança do usuário.  
**Solução Aplicada:**  
- Adicionada prop `activeEventCount?: number` em `GameGrid` e `PremiumHome`
- O page.tsx calcula o count real a partir de `getEvents()` filtrado pela data atual
- Badge "AO VIVO" só aparece se `activeEventCount > 0`
- Sub-texto dinâmico: "N ativo(s) agora" ou "Ver temporada"

```tsx
// app/page.tsx
const now = Date.now();
const activeEventCount = getEvents().filter(
  (e) => now >= new Date(e.startsAt).getTime() && now < new Date(e.endsAt).getTime(),
).length;
```

---

## Arquivos Modificados

| Arquivo | Problema | Linha(s) |
|---|---|---|
| `app/enter/page.tsx` | P0-01: redirect /collection → /packs | 31 |
| `app/page.tsx` | P2-02: calcular activeEventCount real | 10–26 |
| `app/login/page.tsx` | P1-04: guest button visibilidade | 249–254 |
| `components/home/EventBanner.tsx` | P2-01: px-5 → px-4 | 92 |
| `components/home/GameGrid.tsx` | P2-02: activeEventCount prop dinâmica | 8–65 |
| `components/home/PremiumHome.tsx` | P2-02: prop passada para GameGrid | 19–57 |
| `components/home/RetentionPanel.tsx` | P1-02: barra 33% → 0% | 137–146 |
| `components/match/premium/PreMatchScreen.tsx` | P1-03: countdown 5→8, label | 120, 295 |
| `components/nav/MobileHeader.tsx` | P1-01: router.push('/') → router.back() | 103 |
| `components/rewards/RewardScreen.tsx` | P1-05: useState → useEffect + cleanup | 320–322 |
| `components/settings/SettingsPage.tsx` | P0-02: redirect /enter → /login | 457, 474 |

**Total: 11 arquivos modificados · TypeScript: 0 erros**

---

## Próximos Pontos de Melhoria (não implementados)

### Prioritários

#### Settings: Logout não chama Supabase signOut
**Problema:** O botão "Sair da Conta" faz `localStorage.clear()` + redirect para `/login`, mas não chama `supabase.auth.signOut()`. O token de sessão persiste no navegador. Para implementar corretamente, o `SettingsPage` precisa receber uma função `signOut` via `useAuth()`.  
**Ação:** Adicionar `const { signOut } = useAuth()` no SettingsPage e chamar `await signOut()` antes do redirect.

#### QuickStats: dados mock na Home
**Problema:** `QuickStats` lê de `USER_PROFILE` e `SQUAD_RATING` importados de `@/lib/mock-data`. Os valores (OVR, Química, Vitórias, Taxa Win) são sempre os mesmos independente do squad real do usuário.  
**Ação:** O page.tsx da home já faz fetch do squad real. Passar `squadRating` e estatísticas reais como props até o componente.

### Médio Prazo

#### GameGrid "ABRIR PACK" subtexto fixo
**Problema:** O card "ABRIR PACK" sempre mostra "Founder Pack · Grátis" mesmo após o Founder Pack ter sido aberto.  
**Ação:** Passar `founderPackClaimed: boolean` como prop e mostrar "Ver Packs disponíveis" após a primeira abertura.

#### PreMatchScreen: pré-jogo auto-inicia
**Problema:** O pre-match inicia o countdown automaticamente. O padrão Clash Royale é o usuário tocar "BATALHAR!" para iniciar.  
**Ação:** Manter o countdown mas adicionar estado `waitingForUser` que exige um tap antes de iniciar a contagem.

#### MatchResultScreen: 3 botões secundários confusos
**Problema:** Após resultado, há 3 botões de ação secundária de peso visual igual: "Trocar adversário" | "Home" | "Missões". EA FC Mobile coloca apenas 1 primário + 1 secundário.  
**Ação:** Manter "Jogar Novamente" (primário) + "Home" (secundário) e mover "Missões" para um link menor de contexto.

#### Profile: scroll longo sem âncoras
**Problema:** O perfil tem 8 seções empilhadas sem índice ou seção sticky. Em mobile, o usuário não sabe o que vem a seguir.  
**Ação:** Adicionar uma barra de tabs ou um índice flutuante ("Estatísticas · Coleção · Conquistas") que permita navegação rápida entre seções.

#### Collection loading state
**Problema:** `app/collection/loading.tsx` existe mas o conteúdo do skeleton não reflete o layout real (álbum por países + filtros).  
**Ação:** Atualizar o loading state com skeleton que espelhe a estrutura de `HallOfLegendsExperience`.

### Longo Prazo

| Item | Impacto | Complexidade |
|---|---|---|
| Tutorial interativo no 1° login | Alto | Alta |
| Push notifications para missões diárias | Alto | Média |
| Animação de transição entre páginas temática | Médio | Média |
| Widget de "Próxima recompensa" em tempo real | Médio | Baixa |
| Bottom sheet de ações rápidas (Clash Royale style) | Médio | Média |

---

## Análise UX por Referência

### Clash Royale
✅ Já temos: CTA principal gigante (JOGAR), hierarquia visual clara, bottom nav com 5 itens  
⚠️ Falta: usuário iniciar a partida voluntariamente (não auto-countdown), "BATTLE!" button pulsante

### EA FC Mobile
✅ Já temos: pre-match screen com escalações, OVR comparison, MVP reveal  
⚠️ Falta: squad preview no pré-jogo com formação visual, "Compare" instantâneo

### Pokémon TCG Pocket
✅ Já temos: pack opening espetacular (Sprint 5.5), album por categorias (Sprint 5.3)  
⚠️ Falta: contador de tempo até próximo pack gratuito na Home, sortido de raridade visível

### Marvel Snap
✅ Já temos: cards com visual premium, collection filters rápidos  
⚠️ Falta: "on this day" — card sorteada aleatória para engajar o usuário diariamente

### Brawl Stars
✅ Já temos: daily login, progress tracker, retention panel  
⚠️ Falta: "Season end" banner no topo quando temporada expira em < 48h

---

*Gerado em: 2026-07-05 · Sprint 6 Alpha Polish · World Legends v0.1.0-dev*
