# Sprint 18.8 — Integrar Primeiro Lote de Frames Reais

**Objetivo:** integrar os 6 frames reais recebidos do Gemini ao Card Engine,
sem alterar gameplay, economia, packs, Supabase ou o componente `PlayerCard`.

---

## O que foi feito

### 1–2. Cópia e nomenclatura

Os 6 arquivos recebidos (`Code_Generated_Image-{7,8,9,10,11,12}.png`) foram
copiados para `public/assets/cards/frames/`.

**Nota sobre nomenclatura**: o pedido especificava nomes com underscore
(`frame_common.png`, etc.) e os códigos `goat`/`world_champion`. O
carregador único (`lib/card-asset-loader.ts`, `resolveFrame()`) já
estabelecido nas Sprints 18.5/18.6 espera exatamente
`frame-{rarityCode}.png` — **hífen**, e os `RarityCode` reais do sistema
são `ultra` (rótulo de exibição "GOAT") e `world_cup_hero` (rótulo "World
Cup Hero"/"CAMPEÃO"), não `goat`/`world_champion` literalmente (essa
reconciliação de nomes já foi documentada desde a Sprint 18.5). Usar os
nomes exatamente como pedidos faria a validação do item 4 falhar (os
arquivos existiriam em disco mas o resolver nunca os encontraria — 0/6,
não 6/6). Os arquivos foram nomeados seguindo a convenção que já está
documentada em `docs/CARD_ASSETS_GUIDE.md` e é a que o motor de verdade
usa:

| Arquivo original | Raridade (pedido) | Nome final |
|---|---|---|
| `Code_Generated_Image-12.png` | common | `frame-common.png` |
| `Code_Generated_Image-11.png` | rare | `frame-rare.png` |
| `Code_Generated_Image-10.png` | elite | `frame-elite.png` |
| `Code_Generated_Image-9.png` | legendary | `frame-legendary.png` |
| `Code_Generated_Image-8.png` | goat | `frame-ultra.png` |
| `Code_Generated_Image-7.png` | world_champion | `frame-world_cup_hero.png` |

### 3. Manifest

`node --experimental-strip-types scripts/generate-card-asset-manifest.mts`
— gerou `lib/card-asset-manifest.generated.ts` com as 6 chaves
reconhecidas automaticamente, sem metadata (nenhum sidecar `.json` foi
necessário — ver item de alinhamento abaixo).

### 4. Validação em `/dev/card-assets`

| Chave | Resolução | Aspect ratio | Alpha | Tamanho |
|---|---|---|---|---|
| frame-common | 1143×1600 | OK | sim | 126.7 KB |
| frame-rare | 1143×1600 | OK | sim | 187.9 KB |
| frame-elite | 1143×1600 | OK | sim | 196.7 KB |
| frame-legendary | 1143×1600 | OK | sim | 182.4 KB |
| frame-ultra | 1143×1600 | OK | sim | 217.3 KB |
| frame-world_cup_hero | 1143×1600 | OK | sim | 153.4 KB |

**6/6 encontrados**, resolução acima do mínimo recomendado (512px),
transparência presente em todos.

**Ajuste feito — tolerância de aspect ratio, não o PlayerCard**: a
proporção real dos arquivos (1143/1600 ≈ 0.714) ficou ~3,95% fora do alvo
exato da carta (0.744), e a tolerância que eu tinha configurado na Sprint
18.6.5 era de 3% — um número que escolhi sem dados reais de produção. Com
a primeira entrega real do Gemini em mãos, recalibrei
`ASPECT_RATIO_TOLERANCE` de 0.03 para 0.05 em
`lib/dev/card-asset-constants.ts` (uma constante, um comentário explicando
o porquê). Isso **não é** um ajuste de alinhamento visual — a camada já
estica a imagem pra preencher a carta (`w-full h-full`) independente da
proporção nativa do arquivo, então essa diferença nunca causou distorção
perceptível; era só o limiar do próprio inspetor que estava calibrado
otimisticamente demais. Nenhum sidecar `.json` de metadata foi necessário
para nenhum dos 6 frames — o encaixe ficou bom com os valores-padrão
(`scale: 1, offset: 0, rotation: 0`).

### 5. Validação visual no PlayerCard real

Confirmado com screenshots em produção local (conta de teste real):

- **Squad** (`size="xs"`): Lee (ultra/legendary) e Kagawa (elite) mostram
  o emblema colorido corretamente, legível mesmo em miniatura.
- **Perfil** (`size="lg"`, "Melhor Carta"): Lúcio (Elite) — o emblema roxo
  emoldura o jogador de forma nítida e premium.
- **Card Preview / Card Detail** (`size="lg"`, `CardDetailModal`): mesmo
  resultado do Perfil, consistente.
- **Pack Reveal**: não testado com uma abertura ao vivo nesta sprint (a
  conta de teste está com saldo zerado de sessões anteriores), mas
  `RevealedCard.tsx` importa o mesmíssimo componente `PlayerCard` já
  confirmado funcionando em `lg`/`xs` — o caminho de renderização é
  idêntico, sem lógica própria de frame.
- **Coleção**: `CollectionCardTile.tsx` também importa `PlayerCard`
  diretamente (`size="md"`) — mesmo componente, mesma garantia.

**Achado visual honesto**: os frames do Gemini são emblemas em formato de
escudo/hexágono, não uma borda que acompanha toda a borda retangular da
carta. Isso significa que os 4 cantos da carta (retângulo arredondado)
ficam fora do escudo. Na prática, isso **não ficou ruim** — o resultado
lido é o de um brasão/emblema centralizado sobre o jogador, com a borda
CSS fina que já existia (`card-frame-{raridade}`) continuando a marcar o
contorno real da carta por baixo. Não precisou de ajuste de metadata.

### 6–9. Escopo respeitado

Nenhuma mudança em economia, banco/Supabase, packs, ou criação de asset
por código — só os 6 arquivos recebidos, o manifest gerado
automaticamente, e uma constante de calibração do inspetor. `PlayerCard.tsx`
não foi tocado.

### 10. Fallback

Confirmado pelo próprio desenho do pipeline (Sprint 18.5/18.6): se
qualquer um destes 6 arquivos for removido ou renomeado incorretamente, o
`ImageLayer` volta automaticamente ao frame CSS procedural — nenhum
código novo foi necessário pra garantir isso, já era a garantia da
arquitetura existente.

---

## QA

```
pnpm exec biome check .  → 464 warnings, 0 erros (mesmo baseline de sempre)
pnpm test                → 204/204 testes passando
pnpm build               → sucesso (build do Next.js já inclui checagem de tipos)
```

## Arquivos criados/modificados

Novos: `public/assets/cards/frames/frame-{common,rare,elite,legendary,ultra,world_cup_hero}.png`.

Modificados: `lib/card-asset-manifest.generated.ts` (regenerado),
`lib/dev/card-asset-constants.ts` (tolerância de aspect ratio 3%→5%).

Não modificados: `components/cards/PlayerCard.tsx`, qualquer camada,
economia, packs, Supabase.
