# World Legends — Art Pipeline

**Sprint 19.** Guia completo pra quem produz arte pro Card Engine —
frame, background, kit, pattern, pose, player-art, shine, effects/glow.
Descreve exatamente como adicionar cada tipo sem tocar em código.
Substitui/atualiza `apps/web/docs/CARD_ASSETS_GUIDE.md` (mantido como
referência histórica da Sprint 18.5, mas este documento é o atual).

---

## Como funciona (resumo pra quem nunca fez isso)

1. Você produz a imagem.
2. Coloca na pasta certa, com o nome certo (ver tabela abaixo).
3. Pronto. Na próxima vez que `pnpm dev`/`pnpm build` rodar, o jogo
   encontra o arquivo sozinho (`predev`/`prebuild` regeneram o manifesto
   automaticamente) e passa a usá-lo.
4. Se o nome estiver errado, a pasta errada, ou o arquivo corrompido: o
   jogo simplesmente continua usando o visual gerado por código — **nada
   quebra**. Você não precisa avisar ninguém nem coordenar deploy.

Confira o resultado em **`/dev/card-assets`** (logado no app) — mostra o
que foi encontrado, o que falta, diagnóstico técnico de cada arquivo, e
um preview ao vivo da carta de verdade com um modo **Visual Debug** que
liga/desliga cada camada individualmente (útil pra ver exatamente onde
seu asset entra na composição).

## As 8 categorias

```
public/assets/cards/
  frames/         — moldura decorativa da carta
  backgrounds/    — fundo atrás de tudo
  effects/        — efeito de acabamento por raridade (+ glow)
  kits/           — camisa da seleção
  patterns/       — textura reutilizável associada à seleção (listras, xadrez)
  poses/          — pose/silhueta completa do jogador (corpo inteiro)
  player-art/     — retrato do jogador
  shine/          — holo/shine especial (reservado — hoje é um efeito de vidro que reage ao mouse, 100% CSS)
```

| Categoria | Nome do arquivo | Exemplo | Status |
|---|---|---|---|
| Frame | `frame-{raridade}.png` | `frame-legendary.png` | **Em uso** — 6/6 já integrados |
| Background | `bg-{raridade}.png` ou `.webp` | `bg-ultra.webp` | **Em uso** — 6/6 já integrados |
| Efeito de raridade | `effect-{raridade}.png` | `effect-common.png` | Preparado, nenhum asset ainda |
| Glow | `glow-{raridade}.png` | `glow-world_cup_hero.png` | Preparado, nenhum asset ainda |
| Kit | `kit-{nacionalidade}-{raridade}.png` | `kit-BR-legendary.png` | Preparado, nenhum asset ainda (fallback: camisa SVG procedural) |
| Pattern | `pattern-{nacionalidade}.png` | `pattern-AR.png` | **Novo (Sprint 19)** — ponto de integração preparado, nenhum asset ainda |
| Pose | `pose-{playerId}.png` | `pose-pelé.png` | **Novo (Sprint 19)** — ponto de integração preparado, nenhum asset ainda |
| Player Art | `{playerId}.png` | `pelé.png` | Preparado, nenhum asset ainda |
| Shine | `shine-{raridade}.png` | `shine-ultra.png` | Preparado, nenhum asset ainda (fallback: reflexo de vidro reagindo ao mouse) |

As 6 raridades do jogo (não criar nenhuma outra): `common`, `rare`,
`elite`, `legendary`, `ultra`, `world_cup_hero`. Os códigos de
nacionalidade e IDs de jogador exatos estão listados em
`/dev/card-assets` — use os seletores da página em vez de adivinhar.

### O que é Pattern, exatamente

Uma textura que fica **por cima do Kit** (listras verticais da
Argentina, xadrez da Croácia etc.) — hoje o `lib/kit-data.ts` já simula
isso via CSS/SVG (`pattern: 'stripes' | 'checker'` em `KitColors`).
Quando existir um PNG real em `patterns/pattern-{nacionalidade}.png`, ele
substitui a simulação CSS por cima da camisa (`mix-blend-mode: overlay`).

### O que é Pose, exatamente

Uma alternativa a Player Art: em vez de um retrato (rosto/torso), uma
pose/corpo inteiro do jogador (ex.: chutando, comemorando). Fica na mesma
posição que Player Art (por cima da camisa). Produza **um ou outro**, não
os dois pro mesmo jogador — se ambos existirem, Player Art tem prioridade
(é a camada anterior na composição).

## Prioridade recomendada de produção

1. ~~**Frames**~~ e ~~**Backgrounds**~~ — já entregues (12/12).
2. **Effects/Glow** (12 arquivos) — completa o conjunto "ambiente" da
   carta.
3. **Kits** — comece pela variante `common` de cada seleção, depois
   raridades altas só pras ~15 seleções mais puxadas em packs (Brasil,
   Argentina, França, Alemanha, Inglaterra, Portugal, Espanha, Itália,
   Holanda, Croácia, Bélgica, Uruguai, Coreia do Sul, Japão).
4. **Player-art ou Pose** — 574 jogadores no catálogo. Priorize quem já
   tem cartas `legendary`/`ultra`/`world_cup_hero`.
5. **Patterns** — opcional, refinamento visual por cima dos Kits.
6. **Shine** — opcional, o fallback (reflexo de vidro) já é premium.

## Especificação técnica

- **Formato**: PNG (com alpha) pra tudo que precisa de transparência
  (frame, effects, glow, kit, pattern, pose, shine). WEBP é aceito e
  recomendado pra **backgrounds** (opacos, sem necessidade de
  transparência — WEBP a qualidade 95 fica bem menor que PNG pro mesmo
  resultado visual). JPG/SVG também são aceitos pelo pipeline mas sem
  checagem completa de resolução/alpha em `/dev/card-assets`.
- **Proporção**: 148:199 (≈ 0.744) — a mesma proporção da carta no jogo.
  Tolerância de ±5% no inspetor (calibrado com dados reais de produção
  na Sprint 18.8 — saídas de IA generativa raramente batem a proporção
  exata, e a camada estica a imagem pra caber de qualquer forma, então
  pequenas diferenças não causam defeito visual).
- **Resolução mínima recomendada**: 512px de largura. Os 12 assets já
  integrados vieram em 1143×1600 — mais que suficiente.
- **Transparência**: frame, effects, glow, kit, pattern, pose e shine
  **precisam** de canal alpha. Background é o único que deve ser opaco
  de propósito (é a camada mais ao fundo).

## Metadados por asset (sidecar JSON)

Se um arquivo não ficar perfeitamente alinhado, ajuste **só o sidecar**
— nunca peça uma mudança de código pra isso. Crie um `.json` com o mesmo
nome do arquivo, na mesma pasta:

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

Na prática (Sprint 18.8): os 12 assets já integrados **não precisaram**
de nenhum ajuste de metadata — os padrões funcionaram bem. Use o sidecar
só quando o preview em `/dev/card-assets` mostrar algo visivelmente
desalinhado.

## O que nunca vai virar imagem

Nome, OVR, posição, atributos e a bandeira do jogador são **sempre**
texto renderizado pelo React, lidos dos dados reais da carta — nunca
fazem parte de nenhuma arte, em nenhuma categoria. Não desenhe esses
elementos em nenhuma imagem.

## Como testar antes de considerar pronto

1. Solte o arquivo na pasta certa.
2. Rode `pnpm dev` (ou `pnpm generate:card-assets` se o servidor já
   estiver rodando).
3. Acesse `/dev/card-assets`, escolha a raridade/seleção/jogador
   correspondente no preview ao vivo.
4. Confirme: contador "encontrados" da categoria subiu, badge da camada
   virou "asset real" (verde), diagnóstico mostra resolução/proporção/
   alpha OK.
5. Use o modo **Visual Debug** (mesma página, seção "ligar/desligar
   camadas") pra isolar sua camada e ver exatamente como ela fica sem as
   outras competindo visualmente.
6. Confira também em pelo menos uma tela real do jogo (Coleção, Squad ou
   Perfil) — o preview isolado às vezes esconde conflitos de escala com
   outras camadas.
