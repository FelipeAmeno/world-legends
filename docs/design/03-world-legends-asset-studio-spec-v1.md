# WORLD LEGENDS ASSET STUDIO SPECIFICATION

**Version:** 1.0  
**Status:** Released  
**Owner:** Creative Direction / Art Systems  
**Project Owner:** Felipe Ameno  
**Derived from:** World Legends Design Bible v1.0; World Legends Art Style Guide v1.0  
**Language:** Portuguese  
**Last updated:** 2026-07-10

---

## 0. Objetivo

Este documento define como o **World Legends Asset Studio** deve funcionar.

O Asset Studio é o sistema responsável por organizar assets, combinar layers, testar cartas, ajustar metadata, validar raridades, visualizar Compact, Standard e Showcase, preparar conteúdo para o Card Engine e permitir produção em escala sem editar cartas manualmente.

O Asset Studio não é um editor gráfico completo. Ele é um sistema de composição e QA.

---

# 1. Princípio central

A carta final não deve existir como uma imagem única.

Ela deve ser composta por layers independentes:

```text
Background
Rear Light
National Pattern
Player Pose
Front Particles
Frame
Reflection
Shine
HUD
Interaction
```

O Asset Studio deve permitir trocar cada layer sem alterar as demais.

---

# 2. Objetivos do produto

O Asset Studio deve permitir:

1. visualizar uma carta completa;
2. trocar assets por canal;
3. ajustar scale, offset, opacity e blend mode;
4. salvar metadata;
5. testar raridades;
6. testar densidades;
7. comparar versões;
8. gerar presets;
9. validar performance;
10. preparar conteúdo para integração.

---

# 3. Escopo da V1

A versão 1 deve suportar:

- 5 cartas de validação;
- 6 raridades principais;
- 3 densidades;
- 7 canais visuais;
- metadata por asset;
- fallback procedural;
- export de configuração;
- preview em tempo real;
- QA de pack reveal;
- viewport performance.

Não precisa suportar nesta fase:

- edição de imagem;
- pintura;
- recorte automático;
- IA embutida;
- upload para storage externo;
- geração massiva;
- edição colaborativa.

---

# 4. Estrutura de pastas

```text
public/assets/cards/v3/
├── backgrounds/
├── players/
├── patterns/
├── lights/
├── particles/
├── frames/
├── reflections/
├── materials/
├── glass/
├── presets/
├── metadata/
└── previews/
```

Packs:

```text
public/assets/packs/v3/
├── shells/
├── lights/
├── particles/
├── logos/
├── materials/
└── metadata/
```

Documentação:

```text
docs/design/
docs/assets/
docs/qa/
```

---

# 5. Canais de asset

## 5.1 Background

Responsável por ambiente, profundidade, narrativa, cor principal e perspectiva.

Formato recomendado:

```text
WEBP
```

Tamanho master:

```text
1600 × 2400 px
```

Regras:

- sem texto;
- sem jogador;
- sem frame;
- sem HUD;
- sem logos;
- sem escudos.

## 5.2 Player Pose

Responsável por personagem, gesto, camisa, ação e presença.

Formato recomendado:

```text
PNG ou WEBP com alpha
```

Tamanho master:

```text
1600 × 2400 px
```

Regras:

- fundo transparente;
- sem texto;
- sem frame;
- sem glow embutido pesado;
- sem patrocinador;
- sem escudo oficial.

## 5.3 National Pattern

Responsável por identidade nacional abstrata, ritmo, textura e cor secundária.

Formato recomendado:

```text
PNG ou WEBP com alpha
```

Regras:

- baixa opacidade;
- sem bandeira inteira;
- sem brasão;
- sem texto.

## 5.4 Rear Light

Responsável por separação do jogador, glow traseiro, halo e luz de raridade.

Formato recomendado:

```text
PNG ou WEBP com alpha
```

Regras:

- não incluir jogador;
- não incluir frame;
- não incluir HUD.

## 5.5 Front Particles

Responsável por profundidade, energia, impacto e percepção de raridade.

Formato recomendado:

```text
PNG, WEBP ou procedural
```

Regras:

- transparência;
- densidade proporcional à raridade;
- não cobrir rosto ou nome.

## 5.6 Frame

Responsável por material, raridade, contorno e estrutura.

Formato recomendado:

```text
PNG ou WEBP com alpha
```

Regras:

- sem HUD;
- sem texto;
- sem jogador;
- sem background.

## 5.7 Reflection / Glass

Responsável por acabamento, profundidade, reação ao ponteiro e premium feel.

Formato preferencial:

```text
procedural
```

Pode usar:

- CSS;
- shaders;
- overlays;
- SVG;
- textura leve.

---

# 6. Resoluções

Masters:

```text
Card master: 1600 × 2400
Pack master: 1800 × 2400
Pattern master: 1600 × 2400
Player alpha: 1600 × 2400
```

Runtime:

```text
400 × 600
800 × 1200
1200 × 1800
```

O engine decide a versão conforme o contexto.

---

# 7. Metadata

Cada asset deve possuir metadata sidecar.

```json
{
  "id": "wl-player-bra-legend-pele-001-v1",
  "type": "player",
  "rarity": "legendary",
  "country": "brazil",
  "era": "1970",
  "scale": 1,
  "offsetX": 0,
  "offsetY": 0,
  "rotation": 0,
  "opacity": 1,
  "blendMode": "normal",
  "blur": 0,
  "intensity": 1,
  "parallaxDepth": 0.6,
  "anchor": "center-bottom",
  "safeForCompact": true,
  "safeForStandard": true,
  "safeForShowcase": true,
  "version": 1
}
```

Obrigatórias:

```text
id
type
scale
offsetX
offsetY
opacity
blendMode
version
```

Opcionais:

```text
rotation
blur
intensity
parallaxDepth
anchor
country
era
rarity
safeForCompact
safeForStandard
safeForShowcase
```

---

# 8. Blend modes

Permitidos:

```text
normal
screen
overlay
soft-light
hard-light
multiply
color-dodge
lighten
```

Recomendação:

- background: normal;
- rear light: screen;
- pattern: overlay ou soft-light;
- particles: screen;
- frame: normal;
- reflection: screen;
- glass: soft-light.

---

# 9. Presets

Um preset representa uma composição completa.

```json
{
  "id": "wl-card-preset-legendary-brazil-001",
  "rarity": "legendary",
  "background": "wl-bg-bra-legend-001-v1",
  "rearLight": "wl-light-gold-004-v1",
  "pattern": "wl-pattern-bra-wave-002-v1",
  "player": "wl-player-bra-pele-001-v1",
  "particles": "wl-particles-gold-dust-003-v1",
  "frame": "wl-frame-legendary-gold-001-v1",
  "reflection": "wl-reflection-gold-001-v1",
  "glass": "wl-glass-premium-002-v1"
}
```

---

# 10. Interface do Asset Studio

## 10.1 Layout

```text
┌─────────────────────────────────────────────┐
│ Toolbar                                     │
├───────────────┬─────────────────────────────┤
│ Asset Panel   │ Preview                     │
│               │                             │
├───────────────┴─────────────────────────────┤
│ Metadata / Properties                       │
└─────────────────────────────────────────────┘
```

## 10.2 Toolbar

- card selector;
- rarity selector;
- density selector;
- zoom;
- compare;
- reset;
- save preset;
- export metadata;
- performance mode.

## 10.3 Asset Panel

Seções:

- backgrounds;
- players;
- patterns;
- lights;
- particles;
- frames;
- reflections;
- glass.

Cada item deve mostrar:

- thumbnail;
- ID;
- rarity;
- country;
- status;
- versão.

## 10.4 Properties Panel

Controles:

- scale;
- offset X;
- offset Y;
- rotation;
- opacity;
- blend mode;
- blur;
- intensity;
- parallax depth;
- visible;
- reset channel.

---

# 11. Modos de preview

Compact: squad, grids densos e baixa carga.  
Standard: collection, profile e comparação.  
Showcase: pack reveal, spotlight e máxima qualidade.

---

# 12. Toggle de camadas

O Asset Studio deve permitir ligar e desligar:

- background;
- rear light;
- pattern;
- player;
- particles;
- frame;
- reflection;
- shine;
- HUD;
- interaction.

Isso é obrigatório para QA.

---

# 13. Comparação

Suportar:

- antes/depois;
- v1/v2;
- procedural/real asset;
- rare/legendary;
- compact/showcase;
- pack reveal/card detail.

---

# 14. Fallback procedural

Enquanto não houver asset real, o engine pode usar fallback procedural.

Regras:

- nunca deve parecer erro;
- precisa obedecer raridade;
- não pode usar JerseyLayer antiga;
- precisa manter hierarchy;
- deve ser substituível por ID.

---

# 15. Status de asset

Estados oficiais:

```text
draft
review
approved
deprecated
rejected
```

---

# 16. Validação automática

O sistema deve validar:

- extensão;
- dimensões;
- alpha;
- tamanho do arquivo;
- ID;
- metadata;
- duplicidade;
- rarity;
- path;
- versão.

---

# 17. Limites de peso

```text
Background master: até 1.5 MB
Player alpha: até 2 MB
Pattern: até 500 KB
Light: até 500 KB
Particles: até 700 KB
Frame: até 1 MB
```

Runtime deve usar versões otimizadas.

---

# 18. Performance

Meta:

```text
1 Showcase: 60 fps
10 Standard: 55–60 fps
50 Compact: 45–60 fps
200 Compact: degradar com segurança
```

Regras:

- pause fora da viewport;
- reduced motion;
- lazy load;
- particles limitadas;
- no pointer-driven React rerender;
- CSS variables ou refs para tilt.

---

# 19. Export

O Asset Studio deve exportar:

- preset JSON;
- metadata JSON;
- screenshot;
- report de QA;
- lista de assets;
- warnings.

---

# 20. ID Resolution

O resolver deve funcionar por ID, nunca por nome visual.

```ts
resolveCardAsset({
  channel: "background",
  id: "wl-bg-bra-legend-001-v1"
})
```

Fallback:

```ts
resolveCardAsset(...) ?? proceduralFallback(...)
```

---

# 21. Versionamento

```text
v1
v2
v3
```

Nunca sobrescrever asset aprovado.

```text
wl-frame-legendary-gold-001-v1.webp
wl-frame-legendary-gold-001-v2.webp
```

---

# 22. Integração com Card Engine

O Asset Studio fornece:

- IDs;
- metadata;
- presets;
- ordem;
- preview;
- QA.

O Card Engine executa:

- render;
- density;
- motion;
- HUD;
- interaction;
- performance;
- responsive behavior.

---

# 23. Integração com Pack Reveal

Pack Reveal deve consumir:

- mesma carta;
- mesmo preset;
- mesmo HUD;
- mesma raridade.

Não duplicar engine.

O Asset Studio deve permitir testar todas as raridades oficiais.

---

# 24. QA visual

- [ ] jogador domina;
- [ ] OVR legível;
- [ ] nome legível;
- [ ] raridade reconhecível;
- [ ] material perceptível;
- [ ] frame não cobre;
- [ ] particles na frente;
- [ ] rear light atrás;
- [ ] sem texto espelhado;
- [ ] sem layer duplicada;
- [ ] Compact funciona;
- [ ] Standard funciona;
- [ ] Showcase funciona.

---

# 25. QA técnico

- [ ] lint;
- [ ] typecheck;
- [ ] tests;
- [ ] build;
- [ ] deploy;
- [ ] viewport;
- [ ] reduced motion;
- [ ] lazy load;
- [ ] no console errors;
- [ ] metadata resolvida;
- [ ] fallback validado.

---

# 26. Primeiro Starter Pack

Produzir apenas:

```text
5 backgrounds
5 player poses
5 rear lights
5 patterns
5 particle sets
5 frames
5 presets
```

Validação:

- Common;
- Rare;
- Elite;
- Legendary;
- World Cup Hero ou Ultra.

---

# 27. Não escalar antes de validar

Não produzir:

- 100 poses;
- 300 backgrounds;
- 574 cartas completas.

Antes de validar:

- 5 cartas;
- 3 densidades;
- Collection;
- Squad;
- Reveal;
- performance.

---

# 28. Roadmap do Asset Studio

## V1

- resolver;
- gallery;
- metadata;
- toggles;
- presets;
- export.

## V1.1

- compare;
- batch validation;
- thumbnails;
- warnings.

## V1.2

- bulk import;
- preset cloning;
- performance report.

## V2

- upload;
- tagging;
- search;
- approval workflow;
- storage integration.

## V3

- AI-assisted generation;
- automated background removal;
- batch composition;
- quality scoring.

---

# 29. Critérios de aceite

A V1 é aprovada quando:

1. Um asset pode ser trocado sem alterar código.
2. Metadata controla posicionamento.
3. Presets podem ser salvos.
4. Três densidades funcionam.
5. Fallback procedural funciona.
6. Pack Reveal usa a mesma carta.
7. Asset real pode substituir fallback.
8. Performance é medida.
9. QA visual é reproduzível.
10. O sistema está documentado.

---

# 30. Comandos recomendados

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

---

# 31. Conclusão

O Asset Studio existe para separar produção artística de implementação técnica.

A regra final é:

> **Assets são peças. Presets são composições. O Card Engine é o renderer. O Asset Studio é o laboratório.**

---

**Fim — World Legends Asset Studio Specification v1.0**
