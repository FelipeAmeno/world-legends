# WORLD LEGENDS CARD ENGINE SPECIFICATION

**Version:** 1.0  
**Status:** Released  
**Owner:** Engineering / Art Systems  
**Project Owner:** Felipe Ameno  
**Derived from:**  
- World Legends Design Bible v1.0  
- World Legends Art Style Guide v1.0  
- World Legends Asset Studio Specification v1.0  

**Language:** Portuguese  
**Last updated:** 2026-07-10

---

## 0. Objetivo

Este documento define a arquitetura oficial do **World Legends Card Engine**.

O Card Engine é o renderer responsável por transformar:

- dados do jogador;
- raridade;
- preset visual;
- assets;
- metadata;
- densidade;
- contexto de uso;
- preferências de motion;

em uma carta renderizada de forma consistente em:

- Collection;
- Squad;
- Profile;
- Card Detail;
- Spotlight;
- Match;
- Pack Reveal;
- páginas internas de QA.

O Card Engine não deve tomar decisões de direção de arte. Ele apenas executa regras aprovadas.

---

# 1. Princípios arquiteturais

## 1.1 Uma engine, muitos contextos

Deve existir apenas um motor principal de carta.

Não criar engines independentes para:

- Pack Reveal;
- Collection;
- Squad;
- Profile;
- Card Detail.

Esses contextos devem usar a mesma composição com props diferentes.

---

## 1.2 Assets são opcionais, composição não

A carta deve continuar funcional quando um asset real estiver ausente.

Ordem de resolução:

```text
real asset
→ preset fallback
→ procedural fallback
→ safe minimal fallback
```

A ausência de asset nunca pode quebrar o layout.

---

## 1.3 HUD é código

Nunca rasterizar no asset:

- OVR;
- posição;
- nome;
- país;
- era;
- stats;
- labels;
- traits.

O HUD deve ser renderizado em React.

---

## 1.4 Metadata controla posicionamento

Ajustes específicos não devem ser hardcoded no JSX.

Usar metadata por canal:

```json
{
  "scale": 1.08,
  "offsetX": 2,
  "offsetY": -4,
  "rotation": 0,
  "opacity": 1,
  "blendMode": "normal",
  "intensity": 1,
  "parallaxDepth": 0.5
}
```

---

# 2. Responsabilidades

## 2.1 Card Engine

Responsável por:

- resolver preset;
- resolver assets;
- aplicar metadata;
- montar layers;
- renderizar HUD;
- aplicar density;
- aplicar interaction;
- controlar motion;
- reduzir efeitos;
- pausar fora da viewport;
- fornecer fallback.

---

## 2.2 Asset Studio

Responsável por:

- produzir presets;
- ajustar metadata;
- validar assets;
- testar combinações;
- exportar configurações;
- fornecer IDs.

---

## 2.3 Aplicação

Responsável por:

- fornecer dados do jogador;
- fornecer contexto;
- fornecer rarity;
- fornecer density;
- fornecer estado;
- tratar clique;
- tratar seleção;
- tratar navegação.

---

# 3. Contrato principal

Interface recomendada:

```ts
export type CardDensity = "compact" | "standard" | "showcase";

export type CardContext =
  | "collection"
  | "squad"
  | "profile"
  | "card-detail"
  | "spotlight"
  | "match"
  | "pack-reveal"
  | "dev-gallery";

export interface WorldLegendsCardProps {
  player: CardPlayerData;
  rarity: CardRarity;
  density: CardDensity;
  context: CardContext;
  presetId?: string;
  selected?: boolean;
  disabled?: boolean;
  interactive?: boolean;
  forceReducedMotion?: boolean;
  className?: string;
  onClick?: () => void;
}
```

---

# 4. Modelo de dados do jogador

```ts
export interface CardPlayerData {
  id: string;
  displayName: string;
  shortName: string;
  position: PlayerPosition;
  overall: number;
  countryCode: string;
  era?: string;
  cardVersion?: string;
  traits?: string[];
  isGoalkeeper: boolean;
  stats: OutfieldStats | GoalkeeperStats;
  visualIdentity?: PlayerVisualIdentity;
}
```

---

## 4.1 Stats de linha

```ts
export interface OutfieldStats {
  pac: number;
  sho: number;
  pas: number;
  dri: number;
  def: number;
  phy: number;
}
```

---

## 4.2 Stats de goleiro

```ts
export interface GoalkeeperStats {
  div: number;
  han: number;
  kic: number;
  ref: number;
  spd: number;
  pos: number;
}
```

---

# 5. Raridades

Tipo recomendado:

```ts
export type CardRarity =
  | "common"
  | "rare"
  | "elite"
  | "legendary"
  | "ultra"
  | "world-cup-hero"
  | "goat";
```

Cada raridade deve resolver:

- material;
- frame;
- motion preset;
- particle budget;
- glow intensity;
- audio cue;
- fallback visual;
- reveal profile.

---

# 6. Arquitetura de layers

Ordem oficial:

```text
01 Background
02 Rear Light
03 National Pattern
04 Player Pose
05 Front Particles
06 Frame
07 Reflection
08 Shine
09 HUD
10 Interaction / Glass
```

Componente conceitual:

```tsx
<CardRoot>
  <BackgroundLayer />
  <RearLightLayer />
  <NationalPatternLayer />
  <PlayerPoseLayer />
  <FrontParticlesLayer />
  <FrameLayer />
  <ReflectionLayer />
  <ShineLayer />
  <HudLayer />
  <InteractionLayer />
</CardRoot>
```

---

# 7. Regras de stacking

Cada layer deve possuir z-index fixo.

Exemplo:

```ts
export const CARD_LAYER_Z = {
  background: 10,
  rearLight: 20,
  pattern: 30,
  player: 40,
  particles: 50,
  frame: 60,
  reflection: 70,
  shine: 80,
  hud: 90,
  interaction: 100,
} as const;
```

Nunca alterar a ordem por raridade sem especificação explícita.

---

# 8. Asset resolution

Contrato recomendado:

```ts
export interface ResolveAssetInput {
  channel: CardAssetChannel;
  id?: string;
  rarity: CardRarity;
  playerId?: string;
  countryCode?: string;
}
```

```ts
export interface ResolvedAsset {
  id: string;
  src?: string;
  metadata: CardAssetMetadata;
  source: "real" | "preset-fallback" | "procedural" | "safe";
}
```

---

## 8.1 Resolver

```ts
const asset = resolveCardAsset({
  channel: "background",
  id: preset.background,
  rarity,
  playerId: player.id,
  countryCode: player.countryCode,
});
```

---

## 8.2 Fallback

```ts
function resolveCardAsset(input: ResolveAssetInput): ResolvedAsset {
  return (
    resolveRealAsset(input) ??
    resolvePresetFallback(input) ??
    resolveProceduralAsset(input) ??
    resolveSafeAsset(input)
  );
}
```

---

# 9. Preset resolution

Um preset completo deve conter IDs por canal.

```ts
export interface CardPreset {
  id: string;
  rarity: CardRarity;
  background?: string;
  rearLight?: string;
  pattern?: string;
  player?: string;
  particles?: string;
  frame?: string;
  reflection?: string;
  glass?: string;
  motionPreset?: string;
  version: number;
}
```

Prioridade:

```text
preset explícito
→ preset do jogador
→ preset da raridade
→ preset procedural
```

---

# 10. Metadata

```ts
export interface CardAssetMetadata {
  scale?: number;
  offsetX?: number;
  offsetY?: number;
  rotation?: number;
  opacity?: number;
  blendMode?: CSSProperties["mixBlendMode"];
  blur?: number;
  intensity?: number;
  parallaxDepth?: number;
  anchor?: "center" | "center-bottom" | "top" | "bottom";
}
```

Defaults:

```ts
export const DEFAULT_CARD_ASSET_METADATA = {
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  rotation: 0,
  opacity: 1,
  blendMode: "normal",
  blur: 0,
  intensity: 1,
  parallaxDepth: 0,
  anchor: "center",
};
```

---

# 11. Density system

## 11.1 Compact

Objetivo:

- grids;
- squad;
- performance.

Regras:

- sem stats completos;
- particles reduzidas;
- reflection mínimo;
- sem parallax complexo;
- player art preservada;
- nome curto.

---

## 11.2 Standard

Objetivo:

- collection;
- profile;
- resultados.

Regras:

- stats resumidos;
- motion leve;
- reflection moderado;
- player art completa.

---

## 11.3 Showcase

Objetivo:

- pack reveal;
- spotlight;
- detalhe.

Regras:

- HUD completo;
- motion máximo permitido;
- particles completas;
- reflection;
- glass;
- traits;
- metadata visual.

---

# 12. Density config

```ts
export const CARD_DENSITY_CONFIG = {
  compact: {
    showStats: false,
    particleMultiplier: 0.25,
    enableParallax: false,
    enableReflection: false,
  },
  standard: {
    showStats: true,
    particleMultiplier: 0.6,
    enableParallax: true,
    enableReflection: true,
  },
  showcase: {
    showStats: true,
    particleMultiplier: 1,
    enableParallax: true,
    enableReflection: true,
  },
} as const;
```

---

# 13. HUD renderer

O HUD deve ser dividido em componentes:

```text
CardOverall
CardPosition
CardCountry
CardName
CardEra
CardStats
CardTraits
CardBadges
```

---

## 13.1 Regras

- nunca usar transform que espelhe o HUD;
- nome deve usar truncation controlado;
- stats de goleiro devem ser específicos;
- HUD deve responder à density;
- o OVR deve permanecer legível em Compact;
- o player art nunca deve encobrir completamente o nome.

---

# 14. Motion system

O motion deve ser baseado em presets.

```ts
export interface CardMotionPreset {
  breathing: boolean;
  tilt: boolean;
  shine: boolean;
  particles: boolean;
  glowPulse: boolean;
  parallax: boolean;
  intensity: number;
}
```

---

## 14.1 Reduced motion

Se:

```ts
prefers-reduced-motion: reduce
```

então:

- remover breathing;
- remover parallax;
- reduzir particles;
- manter transições essenciais;
- manter reveal funcional;
- manter feedback de seleção.

---

# 15. Viewport awareness

Cards fora da viewport devem:

- pausar particles;
- pausar breathing;
- pausar shine;
- desativar pointer tracking;
- evitar timers ativos.

Usar:

```text
IntersectionObserver
```

Não criar observer por layer.

---

# 16. Pointer interaction

Para tilt e parallax:

- não usar setState por movimento;
- usar refs;
- usar CSS custom properties;
- usar requestAnimationFrame;
- limitar frequência.

Exemplo:

```ts
cardRef.current?.style.setProperty("--pointer-x", `${x}`);
cardRef.current?.style.setProperty("--pointer-y", `${y}`);
```

---

# 17. Performance budgets

Metas atuais observadas:

```text
1 card: 60 fps
10 cards: próximo de 60 fps
50 cards: degradação controlada
200 cards: modo reduzido obrigatório
```

Regras:

- Compact deve desabilitar efeitos caros;
- grids grandes precisam de virtualization ou windowing;
- imagens devem usar lazy loading;
- evitar múltiplos filtros CSS pesados;
- evitar blur animado;
- evitar box-shadow animado em centenas de cards.

---

# 18. Asset loading

Prioridades:

```text
player
frame
background
rear light
pattern
particles
reflection
```

Pack Reveal pode pré-carregar assets do card revelado.

Collection não deve pré-carregar Showcase completo.

---

# 19. Error handling

A engine deve:

- registrar asset ausente em dev;
- não exibir erro visual ao usuário;
- usar fallback;
- impedir loop de resolução;
- permitir debug mode.

Exemplo:

```ts
if (!asset.src && process.env.NODE_ENV !== "production") {
  console.warn("[CardEngine] Missing asset", asset.id);
}
```

---

# 20. Debug mode

Modo dev recomendado:

```ts
debug?: {
  showLayerBounds?: boolean;
  showAssetIds?: boolean;
  showMetadata?: boolean;
  disableMotion?: boolean;
  forceFallback?: boolean;
}
```

---

# 21. Pack Reveal integration

Pack Reveal deve:

- usar o mesmo `WorldLegendsCard`;
- alterar apenas context e density;
- não duplicar HUD;
- não duplicar layer tree;
- não alterar odds;
- não creditar cards em QA;
- evitar timers conflitantes.

---

# 22. Collection integration

Collection deve:

- usar Compact ou Standard;
- lazy load;
- pausar fora da viewport;
- preservar seleção;
- suportar filtros;
- suportar locked state.

---

# 23. Squad integration

Squad deve:

- usar Compact;
- manter OVR e posição legíveis;
- reduzir motion;
- suportar drag/select;
- não comprimir o campo;
- carregar o time salvo real.

---

# 24. Card Detail integration

Card Detail deve:

- usar Showcase;
- exibir stats completos;
- exibir traits;
- exibir era;
- permitir compare;
- usar o mesmo preset.

---

# 25. SSR e hydration

Evitar inconsistências entre servidor e cliente.

Não depender de:

- window no render inicial;
- random direto no JSX;
- viewport no SSR;
- pointer state antes da hydration.

Valores procedurais precisam ser determinísticos.

---

# 26. Determinismo

Fallback procedural deve usar seed estável.

Exemplo:

```ts
const seed = hash(`${player.id}:${rarity}:${presetId}`);
```

Isso garante que a mesma carta mantenha identidade visual.

---

# 27. Testes unitários

Cobrir:

- rarity resolver;
- density config;
- goalkeeper stats;
- fallback chain;
- metadata merge;
- preset resolution;
- deterministic seed;
- reduced motion.

---

# 28. Testes de integração

Cobrir:

- Collection;
- Squad;
- Pack Reveal;
- Card Detail;
- asset missing;
- preset missing;
- reduced motion;
- viewport pause.

---

# 29. Visual regression

Gerar screenshots de:

- Common;
- Rare;
- Elite;
- Legendary;
- Ultra;
- World Cup Hero;
- GOAT.

Em:

- Compact;
- Standard;
- Showcase.

Total mínimo:

```text
21 snapshots
```

---

# 30. Critérios de aceite

A engine está aprovada quando:

1. Existe uma única composição principal.
2. Todos os contextos usam a mesma engine.
3. HUD é React.
4. Assets são resolvidos por ID.
5. Metadata controla posicionamento.
6. Fallback procedural funciona.
7. Nenhuma JerseyLayer antiga aparece.
8. Nenhum texto é espelhado.
9. Reduced motion funciona.
10. Cards fora da viewport pausam.
11. Pack Reveal não duplica lógica.
12. Testes e build estão limpos.

---

# 31. Estrutura sugerida de código

```text
src/
└── features/
    └── cards/
        ├── components/
        │   ├── WorldLegendsCard.tsx
        │   ├── CardRoot.tsx
        │   ├── layers/
        │   ├── hud/
        │   └── debug/
        ├── engine/
        │   ├── resolveCardPreset.ts
        │   ├── resolveCardAsset.ts
        │   ├── resolveFallback.ts
        │   ├── buildCardComposition.ts
        │   └── cardSeed.ts
        ├── motion/
        │   ├── useCardMotion.ts
        │   ├── useReducedMotion.ts
        │   └── useViewportPause.ts
        ├── types/
        ├── config/
        └── tests/
```

---

# 32. Comandos de qualidade

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

---

# 33. Próxima evolução

Após esta especificação:

1. congelar arquitetura V3;
2. integrar Starter Art Pack;
3. validar 5 cartas;
4. ajustar metadata;
5. medir performance;
6. só então escalar assets.

---

# 34. Conclusão

O Card Engine deve ser simples de consumir, previsível para engenharia e flexível para direção de arte.

A regra final é:

> **O Asset Studio define.  
> O preset combina.  
> O resolver encontra.  
> O Card Engine renderiza.  
> O contexto apenas adapta.**

---

**Fim — World Legends Card Engine Specification v1.0**
