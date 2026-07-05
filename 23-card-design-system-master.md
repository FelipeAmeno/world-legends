# World Legends — Card Design System Master
### Documento 23 · Versão 1.0 · Julho 2026

> **Propósito:** Sistema de identidade visual completo das cartas — anatomia, efeitos, animações, raridades.  
> **Escopo:** Cada elemento de cada tipo de carta, regras de design, tokens.  
> **Nota:** Documento de design — não implementação.

---

## ÍNDICE

1. [Filosofia de Design](#1-filosofia-de-design)
2. [Anatomia da Carta](#2-anatomia-da-carta)
3. [Sistema de Raridade — Identidade Visual](#3-sistema-de-raridade--identidade-visual)
4. [Sistema de Edição](#4-sistema-de-edição)
5. [Tipografia e Tokens](#5-tipografia-e-tokens)
6. [Efeitos Visuais](#6-efeitos-visuais)
7. [Animações](#7-animações)
8. [Efeitos Especiais por Raridade](#8-efeitos-especiais-por-raridade)
9. [Variações de Carta (Edições Especiais)](#9-variações-de-carta-edições-especiais)
10. [Mobile vs Desktop](#10-mobile-vs-desktop)
11. [Acessibilidade](#11-acessibilidade)

---

## 1. FILOSOFIA DE DESIGN

### 1.1 A Carta como Artefato

Uma carta do World Legends não é um "item digital". É um **artefato histórico** — um objeto com peso, textura, história e raridade. O design deve comunicar isso em cada detalhe.

**Comparação:**
- Uma cédula de dinheiro tem textura, microimpressão, marca d'água — comunica valor através de detalhes
- Uma foto polaroid tem bordas brancas, grain — comunica memória através de estética
- Um troféu tem peso, dourado, gravação — comunica conquista através de materialidade

Uma carta do World Legends deve comunicar:
- **Raridade** → através de brilho, espessura visual, efeitos de luz
- **Época** → através de paleta de cores, textura de fundo, tratamento da imagem
- **País** → através de cores da bandeira, escudo, elementos culturais sutis
- **Grandiosidade do jogador** → através da posição na hierarquia de raridade

---

### 1.2 Hierarquia de Impressão (Os 3 segundos)

Em 3 segundos de olhar para uma carta, o jogador deve saber:
1. **Quem é** (nome e imagem)
2. **Quão raro é** (cor e brilho da raridade)
3. **De qual país/era** (bandeira e elementos de fundo)

Tudo o mais é detalhe secundário — importante, mas não decisivo na primeira impressão.

---

### 1.3 Peso Visual por Raridade

```
Common   ████░░░░░░░░ 35% peso visual
Rare     ██████░░░░░░ 50% peso visual
Elite    ████████░░░░ 65% peso visual
Legendary████████████ 80% peso visual
Ultra    ████████████ 90% peso visual (+ animações)
WCH      ████████████ 95% peso visual (+ efeitos especiais)
GOAT     ████████████ 100% peso visual (+ tudo)
```

Um GOAT deve parecer 5-10x mais impressionante que um Common ao primeiro olhar.

---

## 2. ANATOMIA DA CARTA

### 2.1 Dimensões Base

```
Proporção: 2.5 : 3.5 (padrão TCG, igual a Pokémon/Magic)
Tamanho na UI:
  Grid pequeno: 72px × 100px
  Grid médio: 100px × 140px  
  Grid grande: 140px × 196px
  Card Detail / Reveal: 280px × 392px
  Full Screen / Modal: 340px × 476px

Border Radius: 8% da largura (relativo) → ~8-12px típico
```

---

### 2.2 Zonas da Carta

```
┌─────────────────────────────┐
│ [BADGE RARIDADE] [EDIÇÃO]   │  ← Zona Superior (10%)
│                             │
│                             │
│        IMAGEM DO            │
│        JOGADOR              │  ← Zona de Imagem (50%)
│                             │
│                             │
├─────────────────────────────┤
│  NOME DO JOGADOR            │  ← Zona de Nome (12%)
│  [POSIÇÃO] [PAÍS] [OVR]     │  ← Zona de Dados (10%)
├─────────────────────────────┤
│  [TRAIT 1] [TRAIT 2] [T3]   │  ← Zona de Traits (10%)
├─────────────────────────────┤
│  [STATS SECUNDÁRIOS]        │  ← Zona de Stats (8%)
└─────────────────────────────┘
```

---

### 2.3 Elementos da Zona Superior

**Badge de Raridade (canto superior esquerdo):**
```
Formato: pill/tag arredondado
Conteúdo: abreviação da raridade ("CMN" / "RAR" / "ELT" / "LND" / "ULT" / "WCH" / "GOAT")
Tamanho: ~14% da largura da carta
```

**Escudo / Bandeira do País (canto superior direito):**
```
Formato: círculo com borda sutil
Conteúdo: bandeira emoji ou ícone do escudo
Tamanho: ~12% da largura
```

**Número de Serial (opcional, cartas raras+):**
```
Posição: topo central, acima da imagem
Formato: "#0042 / 500" — número da cópia / total de cópias
Aparece em: Ultra, WCH, GOAT, e edições especiais limitadas
```

---

### 2.4 Zona de Imagem

**Tratamento da imagem por era:**

| Época | Tratamento |
|-------|-----------|
| 1930-1959 | Preto e branco + grain vintage + vinheta escura |
| 1960-1979 | Cores dessaturadas + grain leve + bordas suavizadas |
| 1980-1999 | Cores vibrantes mas levemente faded |
| 2000-2015 | Cores vivas, contraste moderno |
| 2016+ | Cores hiperesaturadas, ultra-sharp |

**Máscaras de imagem:**
- Common: retangular, sem efeitos
- Rare: leve gradiente inferior
- Elite: gradiente acentuado + brilho sutil nas bordas
- Legendary+: máscara com brilho nas bordas + efeito de "aura" atrás da imagem

---

### 2.5 Zona de Nome

```
Font: Bebas Neue (ou equivalente — condensado, bold, esportivo)
Tamanho: 16-24px dependendo do tamanho da carta
Cor: branca com sombra negra sutil
Tratamento especial:
  - GOATs: dourado metálico com brilho
  - WCH: prata/platinum
  - Ultra: cor da raridade com efeito metálico
  - Legendary: dourado simples
  - Elite e abaixo: branco padrão
```

**Apelido histórico (quando disponível):**
```
Abaixo do nome principal
Font: menor, itálico, sans-serif
Exemplos: "O Rei" / "El Pibe de Oro" / "La Pulga" / "O Anjo das Pernas Tortas"
Aparece em: Legendary+ (apenas quando o apelido é icônico)
```

---

### 2.6 Zona de Dados

```
Layout: horizontal, 3 elementos
[POSIÇÃO] · [BANDEIRA EMOJI] · [OVR em destaque]

Posição:
  Font: monospace, bold
  Texto: "GK" / "CB" / "RB" / "LB" / "CM" / "CDM" / "CAM" / "LM" / "RM" / "ST" / "CF" / "RW" / "LW"

OVR:
  Font: grande, bold
  Cor: branca base → dourada em Legendary+ → brilho em Ultra+
  Tamanho: 20-28px (dominante na zona de dados)
```

---

### 2.7 Zona de Traits

```
Layout: chips horizontais (até 3 chips)
Chip: [ícone] [nome do trait]
Border: 1px solid, opacity 60%
Background: cor da raridade com opacity 20-30%
Font: 8-10px, bold, uppercase

Ordem: primeiro os traits mais impactantes mecanicamente
```

**Ícones de Trait (sistema de ícones SVG):**

| Trait | Ícone Conceitual |
|-------|-----------------|
| Matador | 🎯 (mira) |
| Maestro | 🎼 (nota musical) |
| Capitão | ©️ (C) faixa |
| Muralha | 🧱 (parede) |
| Clutch Player | ⚡ (raio) |
| Big Game Player | 🏆 (troféu) |
| Iron Man | 🛡️ (escudo) |
| Fast Recovery | 🔄 (seta circular) |
| Super Sub | ↕️ (seta dupla) |
| Dead Ball Specialist | ⚽ com target |
| Hero Moment | ⭐ (estrela) |
| Gelo nas Veias | ❄️ (floco) |
| Leader | 👑 (coroa) |

---

### 2.8 Zona de Stats Secundários

```
4 stats visíveis em mini:
[VEL] [DRI] [FIN] [DEF] (para atacantes)
[VEL] [DRI] [PAS] [DEF] (para meias)
[POS] [ACO] [REF] [SAI] (para goleiros)

Valores: 1-99
Apresentação: barra horizontal + número
  Barra: cor da raridade, largura proporcional ao valor
  Número: branco, 8px
```

---

## 3. SISTEMA DE RARIDADE — IDENTIDADE VISUAL

### 3.1 Common

```
Background: cinza escuro (#1a1a2e)
Borda: #4a4a6a, 1px
Brilho: nenhum
Badge color: #6b7280 (cinza)
Tratamento de imagem: padrão
Efeitos: nenhum
Font do nome: branca
Sensação: papel comum, digno mas sem luxo
```

**Paleta:**
- Primary: #6b7280
- Secondary: #9ca3af
- Background: #1a1a2e
- Border: #4a4a6a

---

### 3.2 Rare

```
Background: roxo muito escuro (#0f0624)
Borda: #7c3aed com brilho sutil 2px
Brilho nas bordas: glow roxo suave (box-shadow interno)
Badge color: #a855f7
Tratamento de imagem: leve saturação +10%
Efeitos: brilho de borda pulsando lentamente (2s loop)
Font do nome: branca
Sensação: diferente do common — há algo especial aqui
```

**Paleta:**
- Primary: #a855f7
- Secondary: #c084fc
- Background: #0f0624
- Border: #7c3aed
- Glow: rgba(168, 85, 247, 0.4)

---

### 3.3 Elite

```
Background: azul escuro (#0a1628)
Borda: #3b82f6, 2px com gradiente
Brilho: glow azul médio nas bordas
Badge color: #3b82f6
Tratamento de imagem: contraste +15%, saturação +10%
Efeitos: shimmer horizontal sutil ao hover
Font do nome: branca com shadow azul
Sensação: confiança, profissionalismo, poder
```

**Paleta:**
- Primary: #3b82f6
- Secondary: #60a5fa
- Background: #0a1628
- Border: #2563eb
- Glow: rgba(59, 130, 246, 0.5)

---

### 3.4 Legendary

```
Background: gradiente dourado escuro (#1a1400 → #2a2000)
Borda: gradiente dourado (#b8860b → #ffd700 → #b8860b), 2px
Brilho: glow dourado nas bordas + internal highlight
Badge color: #c9a84c
Tratamento de imagem: warm tone, contraste +20%
Efeitos: borda dourada brilhando, shimmer diagonal suave em loop
Font do nome: dourado metálico (#c9a84c) com glow
Sensação: ouro, prestígio, história
```

**Paleta:**
- Primary: #c9a84c
- Secondary: #ffd700
- Background: #1a1400
- Border: linear-gradient(#b8860b, #ffd700, #b8860b)
- Glow: rgba(201, 168, 76, 0.6)

---

### 3.5 Ultra

```
Background: gradiente rosa-magenta profundo (#1a0020 → #2a0030)
Borda: rosa neon (#ec4899), 2px com glow intenso
Brilho: glow rosa forte + sparkles nos cantos
Badge color: #ec4899
Tratamento de imagem: contraste máximo, vibrância +30%
Efeitos: 
  - Bordas com bloom/glow rosa pulsando
  - Sparkles animados nos 4 cantos (partículas pequenas)
  - Shimmer diagonal em loop (3s)
Font do nome: branca com shadow rosa
Sensação: energia, rarefação, exclusividade
```

**Paleta:**
- Primary: #ec4899
- Secondary: #f472b6
- Background: #1a0020
- Border: #db2777
- Glow: rgba(236, 72, 153, 0.7)
- Sparkle: #fdf4ff

---

### 3.6 World Cup Hero (WCH)

```
Background: gradiente platina/prata (#0a0a0f → #1a1a2a) com textura de troféu
Borda: gradiente prata (#c0c0c0 → #ffffff → #c0c0c0), 3px
Brilho: white glow forte + reflexo de luz diagonal
Badge color: #e2e8f0 (prata brilhante) com texto escuro
Tratamento de imagem: altíssimo contraste, destaque dramático
Efeitos:
  - Borda prata com reflexo de luz que se move lentamente (8s loop)
  - Raios de luz saindo de trás da carta
  - Partículas douradas subindo
  - Ao hover: tremor sutil da carta + flare de luz
Font do nome: branca platinada com shadow forte
Era da Copa: badge colorido (ex: "Copa 1970" em dourado envelhecido)
Sensação: poder máximo, glória eterna, o momento da Copa
```

**Paleta:**
- Primary: #e2e8f0
- Secondary: #ffffff
- Background: #0a0a0f (com texture overlay)
- Border: linear-gradient(#c0c0c0, #ffffff, #c0c0c0)
- Glow: rgba(255, 255, 255, 0.8)
- Rays: rgba(255, 255, 255, 0.15)

---

### 3.7 GOAT

```
Background: gradiente negro-dourado profundo (#07080f → #1a1400) com textura especial
Borda: gradiente tri-color (ouro → prata → ouro), 4px com dupla camada
Brilho: glow dourado extremo + rays de luz saindo
Badge color: #ffd700 com brilho + "GOAT" em destaque especial
Tratamento de imagem: renderização épica — como uma pintura histórica
Efeitos:
  - Background com efeito de "campo de futebol iluminado à noite" visível atrás
  - Partículas douradas constantes (não apenas ao hover)
  - Raios de luz dourada pulsando ao redor da carta
  - Nome do jogador com efeito metálico premium
  - Borda com duplo glow: interno branco, externo dourado
  - Ao revelar: animação especial completa (descrita em seção 8)
Font do nome: dourado metálico premium com shimmer
Subtítulo: "O MAIOR DE TODOS OS TEMPOS" (ou equivalente em inglês para internacionalização)
Sensação: sagrado, único, lendário-do-lendário, não copiável
```

**Paleta:**
- Primary: #ffd700
- Secondary: #ffed4a
- Tertiary: #c9a84c
- Background: #07080f (with texture)
- Border: triple-gradient (white → gold → platinum → gold → white)
- Glow: rgba(255, 215, 0, 0.9)
- Outer Glow: rgba(255, 237, 74, 0.4)

---

## 4. SISTEMA DE EDIÇÃO

### 4.1 Edições e Identificação Visual

**base (edição padrão):**
- Sem badge de edição extra
- Apresentação padrão da raridade

**prime (versão especial histórica):**
- Badge "PRIME" em azul royal no canto
- Background com leve texture adicional
- OVR ligeiramente superior (representa auge da carreira)

**event (edição de evento):**
- Badge da Copa / evento no topo da carta
- Background temático do evento
- Arte alternativa do jogador (momento específico da Copa)
- Exemplo: "Copa 1970" com fundo de estádio do México

**goat (edição máxima):**
- Badge "GOAT" dourado animado
- Todo o visual GOAT da seção 3.7
- Única edição que ativa o protocolo de reveal completo

---

### 4.2 Cartas de Evento Especiais

Cartas lançadas durante eventos têm tratamento visual próprio:
- Background temático do evento (Copa 1986 → azul-azul-branco argentino)
- Bordas com cores da seleção protagonista
- Arte exclusiva do momento (ex: Maradona com o braço levantado em 1986)
- Badge do evento no topo: "Copa 1986 · México"
- Serial limitado visível: "#0347 / 5.000"

---

## 5. TIPOGRAFIA E TOKENS

### 5.1 Fontes do Sistema de Cartas

```css
/* Nome do Jogador */
font-family: 'Bebas Neue', 'Impact', sans-serif;
font-weight: 700;
letter-spacing: 0.05em;
text-transform: uppercase;

/* Posição e OVR */
font-family: 'Orbitron', 'Roboto Mono', monospace;
font-weight: 700;

/* Traits */
font-family: 'Inter', 'Helvetica Neue', sans-serif;
font-weight: 600;
font-size: 9-10px;
text-transform: uppercase;
letter-spacing: 0.08em;

/* Stats */
font-family: 'Roboto Mono', monospace;
font-weight: 500;
font-size: 8px;

/* Apelido histórico */
font-family: 'Inter', sans-serif;
font-style: italic;
font-weight: 400;
```

---

### 5.2 Tokens de Cor por Raridade

```typescript
export const RARITY_TOKENS = {
  common: {
    primary: '#6b7280',
    secondary: '#9ca3af', 
    background: '#1a1a2e',
    border: '#4a4a6a',
    glow: 'rgba(107, 114, 128, 0.0)',
    text: '#ffffff',
  },
  rare: {
    primary: '#a855f7',
    secondary: '#c084fc',
    background: '#0f0624',
    border: '#7c3aed',
    glow: 'rgba(168, 85, 247, 0.4)',
    text: '#ffffff',
  },
  elite: {
    primary: '#3b82f6',
    secondary: '#60a5fa',
    background: '#0a1628',
    border: '#2563eb',
    glow: 'rgba(59, 130, 246, 0.5)',
    text: '#ffffff',
  },
  legendary: {
    primary: '#c9a84c',
    secondary: '#ffd700',
    background: '#1a1400',
    border: '#c9a84c',
    glow: 'rgba(201, 168, 76, 0.6)',
    text: '#c9a84c',
  },
  ultra: {
    primary: '#ec4899',
    secondary: '#f472b6',
    background: '#1a0020',
    border: '#db2777',
    glow: 'rgba(236, 72, 153, 0.7)',
    text: '#ffffff',
  },
  world_cup_hero: {
    primary: '#e2e8f0',
    secondary: '#ffffff',
    background: '#0a0a0f',
    border: '#e2e8f0',
    glow: 'rgba(255, 255, 255, 0.8)',
    text: '#ffffff',
  },
  goat: {
    primary: '#ffd700',
    secondary: '#ffed4a',
    background: '#07080f',
    border: '#ffd700',
    glow: 'rgba(255, 215, 0, 0.9)',
    text: '#ffd700',
  },
} as const;
```

---

## 6. EFEITOS VISUAIS

### 6.1 Box Shadow por Raridade

```css
/* Common — sem glow */
.card-common { box-shadow: 0 2px 8px rgba(0,0,0,0.4); }

/* Rare — glow roxo sutil */
.card-rare { box-shadow: 0 0 12px rgba(168, 85, 247, 0.4), 0 4px 16px rgba(0,0,0,0.5); }

/* Elite — glow azul médio */
.card-elite { box-shadow: 0 0 20px rgba(59, 130, 246, 0.5), 0 4px 20px rgba(0,0,0,0.6); }

/* Legendary — glow dourado forte */
.card-legendary { box-shadow: 0 0 30px rgba(201, 168, 76, 0.6), 0 0 60px rgba(201, 168, 76, 0.2), 0 8px 24px rgba(0,0,0,0.7); }

/* Ultra — glow rosa intenso */
.card-ultra { box-shadow: 0 0 40px rgba(236, 72, 153, 0.7), 0 0 80px rgba(236, 72, 153, 0.3), 0 8px 30px rgba(0,0,0,0.8); }

/* WCH — white bloom */
.card-wch { box-shadow: 0 0 50px rgba(255, 255, 255, 0.6), 0 0 100px rgba(255, 255, 255, 0.2), 0 10px 40px rgba(0,0,0,0.9); }

/* GOAT — golden bloom extremo */
.card-goat { box-shadow: 0 0 60px rgba(255, 215, 0, 0.9), 0 0 120px rgba(255, 215, 0, 0.4), 0 0 200px rgba(255, 215, 0, 0.1), 0 12px 50px rgba(0,0,0,0.9); }
```

---

### 6.2 Gradient Borders

**Legendary:**
```css
border: 2px solid transparent;
background-clip: padding-box;
background-image: linear-gradient(#1a1400, #1a1400), 
                  linear-gradient(135deg, #b8860b, #ffd700, #b8860b);
background-origin: border-box;
```

**GOAT:**
```css
border: 4px solid transparent;
background-image: linear-gradient(#07080f, #07080f),
                  linear-gradient(135deg, #c9a84c, #ffffff, #ffd700, #ffffff, #c9a84c);
background-origin: border-box;
```

---

### 6.3 Texture Overlays

**Background Textures:**
- Common: sem texture
- Rare → Elite: noise grain sutil (opacity 5%)
- Legendary: texture de veludo (opacity 8%)
- Ultra: texture de seda iridescente (opacity 10%)
- WCH: texture de troféu metálico (opacity 12%)
- GOAT: texture de mármore dourado (opacity 15%)

As texturas são SVG patterns ou CSS repeating-gradients — não imagens PNG (performance).

---

## 7. ANIMAÇÕES

### 7.1 Hover State

**Common / Rare:**
```
Transform: translateY(-4px) scale(1.02)
Duration: 150ms ease-out
Shadow: levemente intensificada
```

**Elite / Legendary:**
```
Transform: translateY(-6px) scale(1.03) rotateY(3deg)
Duration: 200ms ease-out
Shadow: muito intensificada
Shimmer: ativa ao hover
```

**Ultra / WCH / GOAT:**
```
Transform: translateY(-8px) scale(1.04) rotateY(5deg)
Duration: 250ms ease-out
Shadow: máxima
Efeitos especiais: ativam ao hover (ver seção 8)
Tilt effect: 3D parallax sutil baseado na posição do mouse
```

---

### 7.2 Flip Animation (Reveal)

**Common:**
```
Duration: 400ms
Easing: ease-in-out
Effect: flip simples em Y
Sound: "card reveal" genérico
```

**Rare / Elite:**
```
Duration: 600ms
Easing: cubic-bezier(0.25, 0.46, 0.45, 0.94)
Effect: flip com pause no meio para mostrar brilho
Sound: "card reveal" com nota mais alta
```

**Legendary:**
```
Duration: 800ms
Easing: spring animation
Effect: flip + zoom in no momento de reveal + golden flash
Sound: som dramático de fanfarra suave
Pause: 200ms de pausa com carta visível antes de continuar
```

**Ultra:**
```
Duration: 1.2s
Effect: flip + bloom rosa explode + sparkles + zoom
Sound: som de power-up dramático
Screen effect: leve flash rosa na tela
```

**WCH:**
```
Duration: 2s
Effect: tela escurece → raios de luz aparecem → carta surge do centro
Sound: fanfarra dramática + roar de estádio sutil
Screen effect: flash branco + vinheta escura ao redor
Particles: douradas subindo em loop por 3s após o reveal
```

**GOAT:**
```
Duration: 3-4s (protocolo completo — ver seção 8)
```

---

### 7.3 Idle Animations (em grid)

**Common / Rare:** nenhuma (estática no grid)

**Elite:** leve pulsação do brilho das bordas (4s loop, opacity 60%→100%→60%)

**Legendary:** shimmer diagonal suave em loop (5s)

**Ultra:** sparkles nos cantos alternando (3s loop)

**WCH:** raios de luz lentamente rotacionando (8s loop)

**GOAT:** partículas douradas subindo + borda com brilho constante (nunca para)

---

## 8. EFEITOS ESPECIAIS POR RARIDADE

### 8.1 Protocolo de Reveal — GOAT

O reveal de uma carta GOAT é o momento mais impactante do jogo. Nunca deve ser trivializado.

**Sequência completa:**

```
[0.0s] Tela escurece completamente (fade to black, 300ms)

[0.3s] Som: silêncio absoluto por 500ms (tensão)

[0.8s] Um único raio de luz dourada corta a tela diagonal

[1.0s] Sons: acordes lentos de fundo, como música épica começando

[1.5s] A carta surge do centro, ainda de costas (verso escuro)
       Partículas douradas começam a cair suavemente

[2.0s] A carta levemente gira, mostrando que é especial
       Bordas com glow dourado aparecem

[2.5s] FLIP — a carta vira
       Neste momento: FLASH dourado cobre toda a tela por 100ms

[2.6s] A carta está revelada
       BOOM de áudio: fanfarra épica
       Partículas explodem em todas as direções
       Raios dourados saem da carta

[3.0s] A carta flutua levemente
       Nome do jogador animado letra por letra (digital style)
       "O MAIOR DE TODOS OS TEMPOS" aparece abaixo

[4.0s] Tudo estabiliza
       Carta continua com idle GOAT (partículas suaves)
       Botões aparecem: [VER CARTA] [PRÓXIMO]
```

**Haptic feedback (mobile):**
- [0.0s] Vibração leve
- [2.5s] Vibração forte (flash do reveal)
- [2.6s] Vibração dupla rápida

---

### 8.2 Protocolo de Reveal — WCH

```
[0.0s] Tela escurece (300ms)
[0.3s] Raios de luz brancos aparecem
[0.8s] Carta surge com bordas platinadas brilhando
[1.2s] FLIP — flash branco cobre a tela por 80ms
[1.3s] Carta revelada — partículas douradas sobem
[1.8s] Nome em letras grandes
[2.5s] Estabiliza — botões aparecem
```

---

### 8.3 Protocolo de Reveal — Ultra

```
[0.0s] Tela escurece
[0.3s] Glow rosa aparece
[0.6s] Carta surge — sparkles rosados
[1.0s] FLIP — flash rosa
[1.1s] Revelada — partículas
[1.5s] Estabiliza
```

---

### 8.4 Completar uma Seleção (CompletionBurst)

Quando o jogador descobre a última carta de uma seleção no Hall of Legends:

```
[0.0s] Última carta revela com animação normal

[0.5s] Pausa

[0.6s] 20 partículas explodem do centro da carta
       Cores da bandeira do país em questão

[0.8s] Banner "✓ [PAÍS] COMPLETO!" com a bandeira

[1.0s] Flash de luz na cor do país

[1.2s] Sons: torcida, fanfarra, alegria

[2.0s] Stars chovem de cima

[3.0s] Estabiliza, banner permanece por 3s mais
```

---

## 9. VARIAÇÕES DE CARTA (EDIÇÕES ESPECIAIS)

### 9.1 Carta "Copa Especial" (Event Edition)

**Artístico exclusivo por evento:**
- Copa 1970: arte de quadrinhos estilo anos 70, cores quentes
- Copa 1986: arte de graffiti, cores da Argentina
- Copa 2002: arte digital, cores do Brasil + Japão/Coreia

**Elementos adicionais:**
- Troféu da Copa no background
- Logo da Copa (estilizado, não reprodução exata)
- Data e local da Copa na borda inferior
- Serial limitado

---

### 9.2 Carta "Momento Histórico" (Hero Moment)

Variante de uma carta que representa um momento específico, não a carreira geral.

**Exemplos:**
- Baggio — O Pênalti: arte do momento exato do chute perdido, 1994
- Maradona — Mão de Deus: arte do braço levantado
- Iniesta — Gol da Final: arte do gol contra a Holanda, 2010
- Carlos Alberto — Gol do Brasil x Itália 1970: arte da corrida

**Visual:**
- OVR elevado para representar aquele momento específico
- Background com o estádio do momento
- Trait "Hero Moment" garantido
- Nome inclui o momento: "BAGGIO · O PÊNALTI · 1994"

---

### 9.3 Carta "Vintage" (Pre-Color Era)

Para jogadores da era 1930-1959, uma variante com tratamento especial:

- Imagem em preto e branco com grain pesado
- Borda com estilo de jornal antigo
- Background: papel amarelado envelhecido
- Tipografia: serifada, estilo de jornal
- Raridade visual mantida mas com paleta monocromática + accent color

---

## 10. MOBILE VS DESKTOP

### 10.1 Diferenças por Plataforma

**Mobile:**
- Cartas menores no grid (72x100px)
- Touch: tap para ver detalhes, long press para ações
- Reveal animation: otimizada para 60fps mobile
- Haptic feedback: ativo por padrão
- GOAT reveal: versão condensada (2.5s em vez de 4s) para mobile

**Desktop:**
- Cartas maiores no grid (140x196px)
- Hover states completos com tilt 3D
- Reveal animation: versão completa com todos os efeitos
- Sem haptic (não aplicável)
- GOAT reveal: versão completa (4s)

---

### 10.2 3D Tilt Effect (Desktop Only)

```typescript
// Aplicar ao hover em cartas Ultra+
const handleMouseMove = (e: MouseEvent, card: HTMLElement) => {
  const rect = card.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;
  
  const rotateX = (y - centerY) / centerY * -8; // max 8deg
  const rotateY = (x - centerX) / centerX * 8;  // max 8deg
  
  card.style.transform = `
    perspective(800px) 
    rotateX(${rotateX}deg) 
    rotateY(${rotateY}deg)
    translateZ(20px)
  `;
};
```

---

## 11. ACESSIBILIDADE

### 11.1 Considerações

**Daltonismo:**
- O sistema de raridade não deve depender apenas de cor
- Cada raridade tem também: badge de texto, nível de brilho diferente, ícone de borda
- Modo "Alto Contraste" disponível nas configurações

**Movimento:**
- Animações pesadas (GOAT reveal, partículas) devem respeitar `prefers-reduced-motion`
- Em modo reduced-motion: revelar carta sem animação mas com feedback visual estático

**Screen Readers:**
- Cada carta tem `aria-label` completo: "Carta de Pelé, GOAT, Brasil, OVR 99, Traits: Matador, Capitão"
- Raridade comunicada por texto, não apenas por cor
- Animations não bloqueiam interação

---

*Documento elaborado em Julho 2026. Próxima revisão: Outubro 2026.*
