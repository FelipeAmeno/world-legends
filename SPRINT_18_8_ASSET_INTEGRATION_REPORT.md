# Sprint 18.8 — Integrar Frames e Backgrounds Reais

**Objetivo:** integrar 6 frames + 6 backgrounds reais do Gemini ao Card
Engine, sem alterar gameplay, economia, Supabase, packs, ou a API pública
do `PlayerCard`.

---

## Achado antes de integrar: mismatch de conteúdo no primeiro lote

O primeiro conjunto de arquivos que apareceu em `Downloads/zipGemini/`
(`Code_Generated_Image-13.png` a `-24.png`, 12 arquivos) **não** era o que
o brief descrevia. Ao invés de molduras hexagonais e fundos opacos, eram
texturas de partículas/glow radial (confete dourado, glow laranja,
confete rosa, glow roxo, glow azul, anel arco-íris) — um encaixe quase
perfeito pros slots `effect-{raridade}.png`/`glow-{raridade}.png` que já
existem no pipeline, mas **não** pra `frames`/`backgrounds`. Em vez de
forçar esses arquivos numa categoria errada (o que geraria confusão
depois — nome de arquivo mentindo sobre o conteúdo), parei e perguntei.
O usuário reenviou os arquivos certos: 6 JPGs (`Code_Generated_Image.jpg`
+ `-2` a `-6`) batendo exatamente com o mapeamento do brief. Os frames já
tinham sido integrados numa sprint anterior (18.8, commit `6bc4a191`) e
continuavam no lugar.

## 1. Frames

Já integrados (Sprint 18.8 anterior) — confirmados intactos em
`public/assets/cards/frames/frame-{common,rare,elite,legendary,ultra,world_cup_hero}.png`.
Nenhuma mudança nesta sprint.

## 2. Backgrounds

Os 6 JPGs foram conferidos visualmente contra o mapeamento do brief antes
de converter (mesmo processo da sprint anterior com os frames):

| Arquivo original | Raridade | Visual conferido |
|---|---|---|
| `Code_Generated_Image-5.jpg` | common | cinza/azul escuro, textura sutil |
| `Code_Generated_Image-4.jpg` | rare | glow azul radial |
| `Code_Generated_Image-3.jpg` | elite | glow roxo com listras verticais |
| `Code_Generated_Image-2.jpg` | legendary | glow dourado/âmbar radial |
| `Code_Generated_Image.jpg` | goat → **ultra** | anel arco-íris sobre preto |
| `Code_Generated_Image-6.jpg` | world_champion → **world_cup_hero** | padrão geométrico claro/dourado |

Convertidos para WEBP qualidade 95 com `sharp` (já presente como
dependência transitiva do projeto — nenhuma dependência nova adicionada
ao `package.json`) e copiados como
`public/assets/cards/backgrounds/bg-{rarityCode}.webp`, mesma convenção
de nomenclatura hífen/`RarityCode` real já estabelecida (não os nomes
literais `bg_common.webp` com underscore do brief, pelo mesmo motivo
documentado na sprint anterior — o resolver não reconheceria).

## 3. Manifest

`node --experimental-strip-types scripts/generate-card-asset-manifest.mts`
— **12 assets reconhecidos** (6 frames + 6 backgrounds).

## 4. Validação em `/dev/card-assets`

| Categoria | Encontrados | Resolução | Aspect ratio | Alpha |
|---|---|---|---|---|
| frames | 6/6 | 1143×1600 (OK) | OK | sim (todos) |
| backgrounds | 6/6 | 1143×1600 (OK) | OK | não (todos, esperado — opacos) |

**Achado durante a validação — WEBP não era suportado pelo inspetor**: o
leitor de cabeçalho de imagem (`lib/dev/png-inspect.ts`, Sprint 18.6.5) só
sabia ler PNG. Os 6 backgrounds apareceriam como resolução `0×0`/formato
desconhecido. Estendido pra ler também o container RIFF/WEBP nos três
sub-formatos (`VP8 ` simples/lossy — o que o `sharp` gera aqui,
confirmado byte a byte; `VP8X` estendido; `VP8L` lossless fica fora do
escopo desse leitor mínimo, degrada graciosamente pra "—" em vez de
quebrar). Sem dependência nova — só leitura de bytes, mesmo espírito do
parser PNG que já existia.

Fallback confirmado funcionando: as outras 5 categorias (effects, kits,
player-art, shine, patterns) continuam 0 encontrados / mostrando "faltando"
normalmente, sem nenhum erro.

## 5. Validação visual do PlayerCard

Confirmado no preview ao vivo de `/dev/card-assets` (badges "Frame: asset
real" e "Background: asset real" simultaneamente) e em telas reais:

- **Squad** (`xs`): sem regressão, jogadores renderizam normalmente com
  frame+fundo reais.
- **Perfil** ("Melhor Carta", `lg`): Lúcio (Elite) — fundo roxo listrado
  visível por trás da camisa, moldura roxa por cima, sem conflito visual.
- **Card Preview** (`CardDetailModal`, `lg`): mesmo resultado.
- **Preview `ultra`** (screenshot dedicado): o anel arco-íris do fundo
  aparece claramente atrás/ao redor do escudo, compondo bem com a moldura
  animada — confirma que fundo + moldura funcionam juntos, não só
  isoladamente.
- **Pack Reveal / Coleção**: mesmo componente `PlayerCard` compartilhado
  já confirmado nas outras telas (`RevealedCard.tsx`/`CollectionCardTile.tsx`
  importam-no diretamente) — mesma garantia, sem lógica própria de
  frame/background nesses arquivos.

Nenhum ajuste de metadata sidecar foi necessário — os 12 assets (6 frames
já validados na sprint anterior + 6 backgrounds novos) encaixaram bem com
os valores-padrão.

## 6. Escopo respeitado

Nenhuma mudança em gameplay, economia, Supabase, ou packs.
`components/cards/PlayerCard.tsx` não foi tocado — só assets, o manifest
gerado, e a extensão do leitor de imagem do inspetor (uma ferramenta
interna, não o motor de renderização).

---

## QA

```
pnpm exec biome check .  → 464 warnings, 0 erros (mesmo baseline de sempre)
pnpm test                → 204/204 testes passando
pnpm build               → sucesso (build do Next.js já inclui checagem de tipos)
```

## Arquivos criados/modificados

Novos: `public/assets/cards/backgrounds/bg-{common,rare,elite,legendary,ultra,world_cup_hero}.webp`.

Modificados: `lib/card-asset-manifest.generated.ts` (regenerado),
`lib/dev/png-inspect.ts` (suporte a leitura de dimensão/alpha WEBP).

Não modificados: `components/cards/PlayerCard.tsx`, qualquer camada,
gameplay, economia, packs, Supabase.
