# SPRINT 09 — CARD SYSTEM 4.0
**Data:** 2026-07-05  
**Objetivo:** Criar a identidade definitiva das cartas — algo que não existe em FIFA, eFootball, Topps ou Panini  
**Foco:** Camisa como arte · Estádio como fundo · Raridade como personalidade

---

## Comparação Visual

### Antes — Card System 3.0
```
┌────────────┐
│ CMN    ST  │  ← texto plano
│            │
│     85     │  ← OVR centralizado (único elemento visual)
│            │
│──────────── │
│  Ronaldo   │
│  ST · 🇧🇷  │
└────────────┘
```
**Problema:** Genérico. Qualquer jogo de cartas poderia ter este design. OVR como único elemento visual = sem identidade.

### Depois — Card System 4.0
```
┌────────────┐
│[85]     [9]│  ← OVR badge (canto esq) + Raridade (canto dir)
│   ┌──────┐ │
│   │  9   │ │  ← Camisa histórica: número GRANDE
│   │RONALDO│ │  ← Sobrenome na camisa (estilo kit real)
│   └──────┘ │
│  🏆 1990s  │  ← WCH: troféu + era (raridade especial)
│─────────── │
│  Ronaldo   │  ← Nome completo
│ 🇧🇷 1990s  │  ← Bandeira + era (na cor da raridade)
└────────────┘
Fundo: gradiente de estádio (Maracanã para BR)
```

**Diferencial:** A camisa É a arte. Sem fotos. Sem IA. Sem rostos. Peça de coleção autêntica.

---

## Motivação de Design

**Por que camisa?**
- Camisas históricas têm valor emocional real (a Amarelinha do Brasil em 1970, a camisa listrada da Argentina)
- Não existem direitos autorais sobre uma camisa com número — é estilo artístico
- Cria identidade nacional imediata: ver o amarelo com verde = Brasil
- Funciona perfeitamente sem fotos (problema legal em card games)

**Por que estádio como fundo?**
- Reforça identidade geográfica/cultural
- Maracanã para brasileiros, El Monumental para argentinos
- Cria senso de lugar — o jogador "pertence" àquela arena

**Por que o número grande?**
- O número 10 é universalmente associado a genialidade (Pelé, Zico, Maradona)
- O número é mais reconhecível que qualquer arte genérica
- Players immediately know: 10 = playmaker/trequartista

---

## Arquivos Criados

| Arquivo | Descrição |
|---------|-----------|
| `apps/web/lib/kit-data.ts` | Cores de kit por país, backgrounds de estádio, números históricos por jogador |
| `apps/web/components/cards/JerseyArt.tsx` | SVG da camisa (back view): gola, mangas, punhos, bainha, número, sobrenome |
| `apps/web/components/cards/PlayerCard.tsx` | Card unificado: jersey art + OVR badge + rarity badge + info strip |

## Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| `apps/web/components/collection/CollectionCardTile.tsx` | Modo grid usa `PlayerCard` (substituiu OVR centralizado) |
| `apps/web/components/packs/RevealedCard.tsx` | Face frontal da carta usa `PlayerCard` (substituiu OVR + nome simples) |

---

## Sistema de Kit Colors

### Por País
| País | Primary | Secondary | Número | Estilo |
|------|---------|-----------|--------|--------|
| 🇧🇷 Brasil | Amarelo `#F5D60E` | Verde `#006B3C` | Azul `#003087` | Liso |
| 🇦🇷 Argentina | Azul claro `#74ACE0` | Branco | Azul escuro | Listrado |
| 🇩🇪 Alemanha | Branco | Preto | Vermelho | Liso |
| 🇫🇷 França | Azul `#002F6C` | Vermelho | Branco | Liso |
| 🇮🇹 Itália | Azul `#003399` | Branco | Branco | Liso |
| 🇪🇸 Espanha | Vermelho `#C60B1E` | Dourado | Dourado | Liso |
| 🏴󠁧󠁢󠁥󠁮󠁧󠁿 Inglaterra | Branco | Vermelho | Azul | Liso |
| 🇺🇾 Uruguai | Azul claro | Preto | Preto | Liso |
| 🇵🇹 Portugal | Verde `#006600` | Vermelho | Branco | Liso |
| 🇳🇱 Holanda | Laranja `#FF6600` | Azul | Azul | Liso |

### Por Raridade (sobreposição)
| Raridade | Gola/Punhos/Bainha | Número | Efeito |
|----------|--------------------|--------|--------|
| Common | Kit padrão | Kit padrão | — |
| Rare | Roxo | Kit padrão | Glow roxo |
| Elite | Azul | Azul claro | Glow azul |
| Legendary | **Dourado** | **Dourado** | Overlay dourado |
| Ultra | Rosa/magenta | Branco | Rainbow shimmer |
| WCH | **Dourado** | **Âmbar** | Gold scan + troféu |

---

## Sistema de Números Históricos

```ts
pelé → 10, garrincha → 7, taffarel → 1
cafu → 2, lucio → 3, roberto-carlos → 6
falcao-roberto → 8, socrates → 8
rivaldo → 10, bebeto → 9
ronaldo → 9, zico → 10, romario → 11
maradona → 10
```

Fallback por posição: GK=1, CB=4, LB=3, RB=2, CDM=5, CM=8, CAM=10, ST=9, etc.

---

## JerseyArt — SVG técnico

```
viewBox: "0 0 100 130"

Path:
M 28,10 Q 50,22 72,10    ← gola + ombros
L 88,20 L 100,42          ← manga direita
L 83,47                   ← cava direita
L 83,120                  ← lado direito
L 17,120                  ← bainha
L 17,47                   ← cava esquerda
L 0,42 L 12,20           ← manga esquerda
Z

Elementos:
- Gradiente vertical (tom escuro na base)
- Pattern de listras (para AR)
- Gola: path V-neck
- Punhos: linha horizontal
- Bainha: linha horizontal
- Número: fontSize=38, fontWeight=900, filter=shadow
- Sobrenome: fontSize=8, letterSpacing=1.5
- Overlay de brilho/seda no canto superior
- Shimmer gold para Legendary/WCH
```

---

## Raridades — Personalidade na Carta

| Raridade | Jersey | Efeito Reveal (mantido) | Card Face |
|----------|--------|------------------------|-----------|
| Common | Kit nacional limpo | Simples flip | Jersey limpa |
| Rare | Gola roxa | Shimmer roxo | Jersey + glow roxo |
| Elite | Cuffs azuis | Pulso cristal | Jersey crisp azul |
| Legendary | Trim dourado inteiro | Heartbeat + chuva dourada + antecipação | Jersey com overlay gold |
| Ultra | Trim magenta | Rainbow halo + anticipação | Jersey rainbow shimmer |
| WCH | Trim dourado + ícone 🏆 | GOAT mystery card | Jersey gold + Copa overlay |

---

## Pendências Conhecidas

| Item | Prioridade | Notas |
|------|-----------|-------|
| Back card premium | P1 | Verso melhorado (atualmente "WL" text simples) |
| Hover tilt/parallax (desktop) | P1 | CSS 3D transform no hover |
| Mais países no catálogo | P2 | Apenas BR e AR têm jogadores hoje |
| Variações de kit por era | P2 | Brasil 1970 ≠ Brasil 1994 |
| Holographic overlay animado | P2 | CSS animation na face frontal |
| Touch response mobile | P2 | Ligeiro tilt ao tocar |

---

## Próxima Sprint Sugerida — Sprint 10: SOCIAL

1. **Perfil público** — ver coleção de outros jogadores
2. **Compartilhar carta** — Share API com frame de raridade
3. **Leaderboard** — ranking OVR de squads com dados reais
4. **Back card premium** — verso redesenhado
5. **Hover tilt** — parallax 3D no desktop

---

*Sprint 09 · 2026-07-05 · World Legends Card System 4.0*
