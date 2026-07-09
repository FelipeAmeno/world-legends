> **Atualizado pela Sprint 21** — o guia atual e completo (frame,
> background, kit, pattern, pose, player-art, scene, shine,
> effects/glow/reflection/ambient/partícula) é
> `WORLD_LEGENDS_ART_PIPELINE.md` na raiz do repositório. Este arquivo
> fica como referência histórica da Sprint 18.5.

# Guia de assets de carta — World Legends

Este documento é para quem produz arte para as cartas (hoje: geração via
Gemini). Ele descreve exatamente onde colocar cada arquivo, como nomeá-lo,
e como conferir se ele foi reconhecido corretamente pelo jogo — sem
precisar ler código.

## Como funciona

Você não precisa avisar ninguém nem rodar nenhum comando. Basta colocar o
arquivo na pasta certa com o nome certo — na próxima vez que alguém rodar
`pnpm dev` ou o site for atualizado, o jogo encontra o arquivo sozinho e
passa a usá-lo. Se o nome estiver errado ou a pasta errada, o jogo
simplesmente continua usando o visual atual (gerado por código) — nada
quebra.

## Onde conferir o que já existe / o que falta

Acesse **`/dev/card-assets`** no app (logado). Essa página mostra:

- quantos arquivos já existem por categoria, e quais estão faltando;
- para cada arquivo encontrado: resolução, proporção, se tem transparência,
  tamanho em KB, e a metadata aplicada;
- um preview ao vivo da carta de verdade — escolha qualquer raridade,
  seleção e jogador e veja exatamente como vai ficar.

## Estrutura de pastas

```
public/assets/cards/
  frames/         — moldura decorativa da carta
  backgrounds/    — fundo atrás de tudo
  effects/        — efeito de acabamento por raridade + glow
  kits/           — camisa da seleção
  player-art/     — retrato/arte do jogador
  patterns/       — padrões reutilizáveis (listras, xadrez — opcional)
```

## Nomenclatura por categoria

As 6 raridades do jogo (não criar nenhuma outra): `common`, `rare`,
`elite`, `legendary`, `ultra`, `world_cup_hero`.

| Categoria | Nome do arquivo | Exemplo |
|---|---|---|
| Frame | `frame-{raridade}.png` | `frame-legendary.png` |
| Background | `bg-{raridade}.png` | `bg-ultra.png` |
| Efeito de raridade | `effect-{raridade}.png` | `effect-common.png` |
| Glow | `glow-{raridade}.png` | `glow-world_cup_hero.png` |
| Camisa (kit) | `kit-{nacionalidade}-{raridade}.png` | `kit-BR-legendary.png` |
| Arte do jogador | `{playerId}.png` | `pelé.png` |
| Pattern (opcional) | `{nome-livre}.png` | `stripes-vertical.png` |

Os códigos de nacionalidade (`BR`, `AR`, `DE`, ...) e os IDs de jogador
exatos estão listados em `/dev/card-assets` — use os seletores da página
pra achar o valor certo em vez de adivinhar.

### Prioridade recomendada de produção

1. **Frames** (6 arquivos) — maior impacto visual por arquivo, reusado em
   toda carta do jogo.
2. **Backgrounds** e **effects/glow** (6 + 12 arquivos).
3. **Kits** — comece pela variante `common` de cada seleção (uma por
   nacionalidade), depois as raridades altas (`legendary`/`ultra`/
   `world_cup_hero`) só para as ~15 seleções mais puxadas em packs
   (Brasil, Argentina, França, Alemanha, Inglaterra, Portugal, Espanha,
   Itália, Holanda, Croácia, Bélgica, Uruguai, Coreia do Sul, Japão).
4. **Player-art** — 574 jogadores no catálogo. Priorize quem já tem
   cartas `legendary`/`ultra`/`world_cup_hero`.

## Especificação técnica

- **Formato**: PNG. Outros formatos (JPG/WEBP/SVG) são aceitos pelo
  pipeline mas não recebem checagem de resolução/transparência em
  `/dev/card-assets` — prefira PNG.
- **Proporção**: 148:199 (≈ 0.744) — a mesma proporção da carta no jogo.
  Um frame/background/kit/arte fora dessa proporção aparece esticado.
- **Resolução mínima recomendada**: 512px de largura (proporcionalmente,
  ≈ 512×688). Menor que isso funciona, mas fica borrado em telas grandes.
- **Transparência**: frames, effects, glow e kits **precisam** de canal
  alpha (fundo transparente) — sem isso, a camada vira um retângulo opaco
  cobrindo tudo por baixo. Player-art pode ou não ter transparência,
  dependendo se o retrato deve mostrar o fundo da carta por trás.

## Metadados por asset (opcional)

Se um arquivo não estiver perfeitamente enquadrado/alinhado, você pode
ajustar sem precisar reexportar a imagem: crie um arquivo `.json` com o
**mesmo nome** ao lado do PNG.

Exemplo — `frame-legendary.png` + `frame-legendary.json`:

```json
{
  "scale": 1.05,
  "offsetX": 0,
  "offsetY": -3,
  "rotation": 0,
  "blendMode": "normal",
  "intensity": 1
}
```

Todos os campos são opcionais — omita o que não precisa ajustar.

| Campo | O que faz | Padrão |
|---|---|---|
| `scale` | zoom da imagem (1 = tamanho original) | `1` |
| `offsetX` / `offsetY` | desloca em pixels (positivo = direita/baixo) | `0` |
| `rotation` | rotação em graus | `0` |
| `blendMode` | modo de mesclagem CSS (`normal`, `multiply`, `screen`, `overlay`, `soft-light`, `hard-light`, `color-dodge`, `color-burn`, `lighten`, `darken`) | `normal` |
| `intensity` | opacidade do asset (0 a 1) | `1` |

## O que nunca vai virar imagem

Nome, OVR, posição, atributos e a bandeira do jogador são **sempre**
texto renderizado pelo React, lidos dos dados reais da carta — nunca
fazem parte da arte. Não desenhe esses elementos na imagem.
