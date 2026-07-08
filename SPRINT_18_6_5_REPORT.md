# Sprint 18.6.5 — Asset Production Pipeline

**Objetivo:** preparar o projeto para receber assets produzidos externamente
(Gemini), sem criar arte nova, sem SVG novo, sem recriar nada em CSS, e
**sem alterar o PlayerCard visualmente em nada**.

---

## O que foi feito

### `/dev/card-assets` — inspetor interno

Nova página (autenticada, dentro do app shell normal — aparece como "Debug"
numa seção "DEV" da navegação lateral) com três partes:

1. **Preview ao vivo**: renderiza o `PlayerCard` real (import direto do
   componente da Sprint 18.5, zero alteração) com 3 seletores — raridade,
   seleção (kit) e arte do jogador. Constrói um `PlayerCardData` sintético
   a partir da escolha; o resto dos campos (nome/OVR/era) usa valores fixos
   de preview. Mostra, por camada (frame/background/efeito/glow/camisa/arte
   do jogador), se está usando **asset real** ou **fallback procedural**.

2. **Resumo por categoria**: contagem encontrado/esperado por categoria
   (frames, backgrounds, effects, glow, kits, player-art, patterns), com
   barra de progresso.

3. **Diagnóstico por asset**: tabela expansível por categoria — para cada
   asset encontrado, mostra nome do arquivo, resolução, se a proporção
   bate com o padrão da carta (148:199), se tem canal alpha, tamanho em KB,
   e a metadata aplicada (sidecar `.json`, se houver). Assets que faltam
   aparecem numa lista separada, com a chave exata esperada.

### Universo "esperado" — correção real durante o QA

A primeira versão calculava "jogadores esperados" a partir de `PLAYER_SEEDS`
(16 registros, as lendas originais hardcoded em `lib/collection-data.ts`) e
reportava **0/16** artes de jogador faltando. Isso estava errado: o
catálogo real do jogo combina `PLAYER_SEEDS` (16) com `ALL_PLAYER_SEEDS`
(558 jogadores em `lib/catalog-seeds.ts`, adicionados na expansão do
catálogo) — **574 jogadores no total**, o mesmo número já usado nos
relatórios de packs desta sessão. Corrigido para derivar a lista de
jogadores de `getCollection()` (o catálogo já montado, com os 574),
deduplicado por `playerId`. Depois da correção, a página mostra
corretamente **0/574**.

Também descobri, ao investigar isso, que a tabela `cards` no schema do
Supabase já tem uma coluna `artwork_url` não utilizada — um gancho
existente para armazenar arte via Storage, mas fora do escopo desta sprint
(que pediu especificamente o pipeline baseado em `public/assets/cards/`
via sistema de arquivos). Registrado aqui como observação, não alterado.

### Diagnóstico de imagem sem dependência nova

`lib/dev/png-inspect.ts` lê o cabeçalho PNG diretamente (assinatura + chunk
IHDR, os primeiros 33 bytes do arquivo) para extrair largura, altura e se
tem canal alpha (color type 4 ou 6) — sem precisar de nenhuma biblioteca de
imagem (`sharp`, `image-size` etc. não foram adicionados). Formatos
não-PNG são aceitos pelo pipeline mas não recebem diagnóstico completo,
documentado no guia para artistas.

### Documentação para artistas

`apps/web/docs/CARD_ASSETS_GUIDE.md` — convenção de nomes exata por
categoria, prioridade de produção recomendada, especificação técnica
(formato, proporção 0.744, resolução mínima 512px, requisitos de
transparência por camada), e o schema completo de metadata
(`scale`/`offsetX`/`offsetY`/`rotation`/`blendMode`/`intensity`) com
exemplo. Também documenta explicitamente o que nunca vira imagem (nome,
OVR, posição, atributos, bandeira).

---

## Garantia: PlayerCard não mudou

Nenhum arquivo do motor de renderização (`components/cards/PlayerCard.tsx`,
`components/cards/layers/*`, `lib/card-asset-loader.ts`) foi tocado nesta
sprint. As únicas mudanças fora de `app/dev/`, `components/dev/` e
`lib/dev/` foram duas exportações novas e não-destrutivas em arquivos
existentes:

- `lib/kit-data.ts`: `getAllKitNationalities()` (lista as ~65 nacionalidades
  já mapeadas — usado só pelo inspetor).
- `lib/collection-data.ts`: `getFlagEmoji()` (expõe a função `flag()` já
  existente — usado só pelo preview do inspetor).

Confirmado visualmente (Squad, screenshot comparado byte-a-byte com o da
Sprint 20) que o PlayerCard renderiza idêntico em todo o resto do app.

## QA

```
pnpm exec biome check .  → 464 warnings, 0 erros (mesmo baseline de antes da sprint)
pnpm test                → 204/204 testes passando
pnpm build               → sucesso, rota /dev/card-assets gerada (2.87 kB)
```

Manual: `/dev/card-assets` carrega corretamente autenticado, mostra 0/6
frames, 0/6 backgrounds, 0/6+6 effects/glow, 0/390 kits (65 nações × 6
raridades), 0/574 player-art, 0/0 patterns — tudo em fallback, como
esperado (nenhuma arte real existe ainda). Preview ao vivo funcional com
os 3 seletores. Squad/Coleção/Packs confirmados sem nenhuma mudança visual.

## Arquivos criados/modificados

Novos: `app/dev/card-assets/page.tsx`, `components/dev/CardAssetsInspector.tsx`,
`components/dev/CardPreviewPanel.tsx`, `lib/dev/png-inspect.ts`,
`lib/dev/card-asset-expectations.ts`, `lib/dev/card-asset-diagnostics.ts`,
`lib/dev/card-asset-constants.ts`, `docs/CARD_ASSETS_GUIDE.md`.

Modificados (aditivo apenas, sem alterar comportamento existente):
`lib/kit-data.ts`, `lib/collection-data.ts`.

Não modificados (garantia do PlayerCard): `components/cards/PlayerCard.tsx`,
`components/cards/layers/*`, `lib/card-asset-loader.ts`,
`lib/card-asset-manifest.generated.ts`.
