# Sprint 33.2-33.5 — Reconstrução do PlayerCard

Continuação de `SPRINT_33_AUDIT.md` (fix do timer do Pack Reveal). Este
relatório cobre a reconstrução visual propriamente dita, sempre usando a
referência (`docs/references/card-reference-v3.png`) como guia de
proporção/hierarquia — nunca como asset a recortar.

## 33.2 — Arte maior, mais brilhante, HUD reorganizado

- **Pose/Scene**: área do jogador subiu de ~60% pra ~88% da largura da
  carta (`ProceduralSceneLayer.tsx`), com drop-shadow mais forte —
  ocupação muito mais próxima da referência ("quase a carta inteira"),
  sem vazar do frame em nenhum tamanho testado (xs/sm/md/lg).
- **Piso de intensidade Common/Rare**: `BackgroundGenerator`,
  `LightingGenerator`, `ParticleGenerator` tinham raridades baixas quase
  apagadas (opacidade/contagem mínimas). Levantado o piso mínimo pra
  todas as raridades terem presença visual forte, mantendo a progressão
  (Common < Rare < Elite < Legendary < Ultra < World Cup Hero).
- **HUD**: atributos (`CardAttributesLayer`) saíram de um grid 2-colunas
  flutuando no meio da carta pra uma tira horizontal de linha única,
  renderizada DENTRO do rodapé do HUD, logo abaixo do nome —
  bate com o layout da referência (PAC/SHO/PAS/DRI/DEF/PHY numa linha só
  sob o nome). OVR/Posição/País(bandeira)/Nome já eram 100% React desde
  sprints anteriores — confirmado, nenhuma mudança necessária ali.

## 33.3 — Três modos internos (Compact/Standard/Showcase)

Zero prop nova em `PlayerCard` — o modo é derivado do `size` já
existente (`SIZE_TO_MODE`, `card-tokens.ts`): `xs`/`sm` → Compact,
`md` → Standard, `lg` → Showcase. Todo call site (Squad grid, Coleção,
Perfil, Pack Reveal, Spotlight) ganha o modo certo automaticamente, sem
nenhuma mudança de assinatura. Efeito real (não só plumbing): a barra
de destaque sob OVR/posição escala com o modo (mais fina em Compact,
mais grossa/brilhante em Showcase).

## 33.4 — 5 cartas de validação

Geradas via `/dev/card-assets` com um jogador sem Scene real (Ronaldo
Fenômeno — usa 100% o pipeline procedural, o que estava sendo
reconstruído): Common, Rare, Elite, Legendary, World Cup Hero.
Screenshots confirmam progressão clara de intensidade (luz/partículas/
brilho do frame) e pose muito mais presente que antes em todas as
raridades. Regressão confirmada em `/squad` (grade xs) e `/profile`
("Melhor Carta", lg/Showcase) com dados reais de produção — pose visível
e proporcional em qualquer tamanho, sem vazar do frame.

## 33.5 — Pack Reveal revalidado ao vivo pós-reconstrução

Teste 100% passivo (um único toque pra abrir o pack, zero toques
depois): Starter Pack abriu e avançou sozinho por todas as 5 cartas
(1/5 → 5/5), cada carta com a pose nova, nome legível, sem espelhamento,
sem conteúdo atrás do frame, zero erro de console. O fix do timer
(Sprint 33.1) continua correto com o novo visual.

## QA

```
pnpm exec tsc --noEmit -p .   → 0 erros
pnpm exec biome check .       → 457 warnings, 0 erros (baseline inalterado)
pnpm test                     → 220/220
```

Testado ao vivo (Playwright, conta de QA): `/dev/card-assets` (5
raridades), `/squad`, `/profile`, `/packs` (abertura real, observação
passiva de 14s). Nenhuma mudança em economia, packs, Supabase, ou
gameplay/match engine.
