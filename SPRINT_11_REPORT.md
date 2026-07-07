# SPRINT 11 — MATCH EXPERIENCE
**Data:** 2026-07-05  
**Objetivo:** Transformar partidas em espetáculo  
**Foco:** Stadium Intro · Gol cinematográfico · MVP com PlayerCard · Confetti de vitória

---

## Fluxo de Partida — Antes vs Depois

### Antes (6 fases)
```
SELECT → LOADING → PRE → LIVE → HT → RESULT
```

### Depois (7 fases)
```
SELECT → LOADING → INTRO → PRE → LIVE → HT → RESULT
```

**INTRO** = 3.2 segundos de apresentação cinematográfica antes do PRÉ-JOGO.

---

## Arquivos Criados

| Arquivo | Descrição |
|---------|-----------|
| `apps/web/components/match/premium/StadiumIntro.tsx` | Cena de introdução do estádio (3.2s) |

## Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| `apps/web/components/match/premium/MatchExperience.tsx` | +INTRO phase, importa StadiumIntro |
| `apps/web/components/match/premium/LiveMatchView.tsx` | GoalCelebration premium com partículas + flash |
| `apps/web/components/match/premium/MatchResultScreen.tsx` | WinConfetti · MVP via PlayerCard |

---

## StadiumIntro — Sequência

```
0ms    → Tela preta (phase: 'dark')
300ms  → Holofotes acendem (phase: 'lights')
         - Cone de luz esquerdo (top-left diagonal)
         - Cone de luz direito (top-right diagonal)
         - Brilho verde do gramado
         - Linhas do campo (7% opacidade)
         - Logo "World Legends · APRESENTA"
900ms  → Times entram (phase: 'teams')
         - BR Lendas (bandeira 🇧🇷) slide-in da esquerda
         - Adversário (bandeira + OVR) slide-in da direita
         - VS no centro com spring bounce
2000ms → "⚽ BOLA ROLANDO" pulsando (phase: 'ready')
3200ms → onComplete() → fase PRE
```

---

## GoalCelebration Premium

### Antes
```
- Flash verde radial
- "GOOOOL!" em 6xl
```

### Depois
```
- Flash de holofotes (branco → fade, simulando lights flicker)
- Flash verde do gramado (radial na base)
- 18 partículas burst (verde, dourado, branco) com animação easeOut
- "GOOOOL!" em 6xl com glow maior (0 0 50px + 0 0 100px)
- Subtítulo: "⚽ A torcida vai à loucura!" (delay 0.4s)
```

---

## WinConfetti (MatchResultScreen)

- 24 tiras coloradas caindo de cima (`top: 0 → 100vh`)
- Cores: dourado, âmbar, verde, azul, rosa, branco
- Duração: 2.8-3.4s por strip, repeat: 2, repeatDelay: 1.5s
- Rotação 360° durante a queda
- Ativado apenas quando `display.winner === 'home'`
- Posição `fixed` com `pointer-events: none` para não bloquear interação

---

## MVP Tab — PlayerCard

### Antes
```
- Card customizado: 160×208px rounded-3xl
- OVR grande (font-size 64) centralizado
- Gradiente por raridade
- Nome + posição na base
```

### Depois
```
- <PlayerCard card={display.mvp} size="lg" glow />
  = 138×184px com jersey SVG completa
  = OVR badge (top-left)
  = Rarity badge (top-right)
  = Stadium background gradient
  = Jersey art com número histórico + sobrenome
  = Bottom info strip (nome + flag + era)
- Glow rings animados (existentes, mantidos)
- Spring animate de rotateY (existente, mantido)
```

Reutiliza o mesmo `PlayerCard` usado na Coleção e no Pack Reveal — identidade visual consistente.

---

## Integração com MatchExperience

```typescript
// Novo tipo de fase
type Phase = 'SELECT' | 'LOADING' | 'INTRO' | 'PRE' | 'LIVE' | 'HT' | 'RESULT';

// Após LOADING bem-sucedido:
setData(experienceData);
setPhase('INTRO');  // era 'PRE'

// Renderização INTRO:
{phase === 'INTRO' && data && (
  <StadiumIntro data={data} onComplete={() => setPhase('PRE')} />
)}
```

---

## Fluxo Completo da Partida

| Fase | Duração aprox. | O que o usuário vê |
|------|---------------|---------------------|
| SELECT | — | Lista de adversários, botão selecionar |
| LOADING | ~1-2s | Spinner dourado "PREPARANDO" |
| **INTRO** | **3.2s** | **Estádio · Holofotes · Times · BOLA ROLANDO** |
| PRE | 8s (countdown) | PRÉ-JOGO · Escalações · Probabilidades |
| LIVE | ~11s (90 min simulados) | Placar ao vivo · Eventos · Momentum |
| HT | 3.5s | Intervalo automático com placar parcial |
| RESULT | — | VITÓRIA/EMPATE/DERROTA · Stats · MVP · Recompensas |

---

## Pendências Conhecidas

| Item | Prioridade | Notas |
|------|-----------|-------|
| Música de fundo | P1 | Precisaria de arquivo de áudio ou Web Audio |
| Capitão destacado na PRE | P1 | Identificar jogador com OVR máximo → badge "C" |
| Replay de gol | P2 | Mostrar narração do gol com pausa estilizada |
| Ranking atualizado em tempo real | P2 | Precisa de API de leaderboard |
| Clima/estádio visual dinâmico | P2 | Diferentes backgrounds por adversário |

---

*Sprint 11 · 2026-07-05 · World Legends Match Experience*
