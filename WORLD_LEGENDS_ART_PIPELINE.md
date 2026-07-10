# World Legends — Art Pipeline

**Atualizado pela Sprint 26 (Card Engine 2.0 — Legacy Removal) + Sprint 27
(Procedural Scene Engine) + Sprint 28 (Pose System).** Guia completo pra
quem produz arte pro Card Engine — frame, background, pose, scene, shine,
effects/glow/reflection/ambient/partícula. Descreve exatamente como
adicionar cada tipo sem tocar em código. Substitui/atualiza
`apps/web/docs/CARD_ASSETS_GUIDE.md` (mantido como referência histórica da
Sprint 18.5, mas este documento é o atual).

**Kit/Pattern/Player Art — removidos na Sprint 26.** As 3 categorias
existiam desde o início do Card Engine mas NUNCA receberam nenhum asset
real (só pastas vazias com `.gitkeep`) — o sistema que elas alimentavam
(a "camisa" genérica atrás do frame) foi banido de vez do jogo. O centro
da carta nunca mais é uma camiseta: é sempre uma Scene (real ou
procedural — ver Sprint 27/28 abaixo). Se você tem arte de camisa/textura
de seleção/retrato pronta, ela **não tem mais onde entrar** neste
pipeline — produza Scene ou Pose (asset real) no lugar.

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

## As 6 categorias

```
public/assets/cards/
  frames/         — moldura decorativa da carta
  backgrounds/    — fundo atrás de tudo
  effects/        — efeito de acabamento por raridade (+ glow, reflection, ambient, partículas)
  poses/          — pose/silhueta FOTOGRÁFICA completa do jogador (opcional — ver Pose Engine abaixo)
  scenes/         — cenário cinematográfico completo por jogador (Sprint 21)
  shine/          — holo/shine especial (reservado — hoje é um efeito de vidro que reage ao mouse, 100% CSS)
```

| Categoria | Nome do arquivo | Exemplo | Status |
|---|---|---|---|
| Frame | `frame-{raridade}.png` | `frame-legendary.png` | **Em uso** — 6/6 já integrados |
| Background | `bg-{raridade}.png` ou `.webp` | `bg-ultra.webp` | **Em uso** — 6/6 já integrados |
| Efeito de raridade | `effect-{raridade}.png` | `effect-common.png` | Preparado, nenhum asset ainda |
| Glow | `glow-{raridade}.png` | `glow-world_cup_hero.png` | Preparado, nenhum asset ainda |
| Reflection | `reflection-{raridade}.png` | `reflection-ultra.png` | **Novo (Sprint 18.9)** — preparado, nenhum asset ainda |
| Ambient | `ambient-{raridade}.png` | `ambient-legendary.png` | **Novo (Sprint 18.9)** — preparado, nenhum asset ainda |
| Partícula | `particle-{raridade}.png` | `particle-world_cup_hero.png` | **Novo (Sprint 18.9)** — preparado, nenhum asset ainda |
| Pose | `pose-{playerId}.png` | `pose-pelé.png` | Opcional — sem asset, o Pose Engine (Sprint 28) gera uma pose articulada determinística |
| Scene | `scene-{playerId}.webp` | `scene-pelé.webp` | **Sprint 21** — 3 entregues (Pelé, Messi, Cristiano Ronaldo); sem asset, a Scene Procedural (Sprint 27) assume |
| Shine | `shine-{raridade}.png` | `shine-ultra.png` | Preparado, nenhum asset ainda (fallback: reflexo de vidro reagindo ao mouse) |

As 6 raridades do jogo (não criar nenhuma outra): `common`, `rare`,
`elite`, `legendary`, `ultra`, `world_cup_hero`. Os códigos de
nacionalidade e IDs de jogador exatos estão listados em
`/dev/card-assets` — use os seletores da página em vez de adivinhar.

### O que é Pose, exatamente

Um asset FOTOGRÁFICO opcional de corpo inteiro do jogador (ex.: chutando,
comemorando) — usado só se você tiver uma foto/ilustração real pronta.
Sem ele (o caso de praticamente todo o catálogo), o **Pose Engine**
(Sprint 28, `apps/web/lib/pose-engine/`) gera uma pose articulada
determinística — 14 poses catalogadas (correndo/chutando/comemorando/
voleio/bicicleta pra atacantes, dominando/girando/passando pra meias,
carrinho/interceptação/disputa aérea pra zagueiros,
defesa/salto/espalmando pra goleiros), escolhida pela posição real do
jogador + raridade (poses mais espetaculares reservadas pra Elite+/
Legendary+) + o mesmo seed determinístico da Scene — nunca aleatório,
nunca hardcoded por jogador. Ver `/dev/card-assets` → "Pose Gallery" pra
navegar todas as poses candidatas de uma posição.

### O que é Scene, exatamente (Sprint 21, consolidado nas Sprints 26/27)

Um cenário cinematográfico completo — estádio, luz, partículas — que
ocupa a área central inteira da carta. **Não existe mais nenhum
fallback de camisa** (removido na Sprint 26): sem um asset de Scene
real, o **Scene Generator procedural** (Sprint 27,
`apps/web/lib/procedural-scene/`) monta uma cena inteira sozinho —
Background (paleta de estádio da seleção), Lighting (raios volumétricos
por raridade), Particles (campo determinístico), Country Pattern
(listras/xadrez reais da seleção, 100% CSS) e a Pose resolvida (Sprint
28) — tudo a partir de um seed determinístico
(`playerId+nacionalidade+raridade+posição`): a mesma carta sempre produz
a mesma cena. Formato WEBP pro asset real (paisagem/ambiente, sem
necessidade de transparência — mesma lógica de Background).

## Prioridade recomendada de produção

1. ~~**Frames**~~ e ~~**Backgrounds**~~ — já entregues (12/12).
2. **Effects/Glow** (12 arquivos) — completa o conjunto "ambiente" da
   carta.
3. **Scene** (Sprint 21/27) — o maior impacto visual por arquivo: uma
   Scene real sempre tem prioridade sobre a Scene procedural. Priorize
   `legendary`/`ultra`/`world_cup_hero` primeiro.
4. **Reflection/Ambient/Partícula** (Sprint 18.9) — opcional, refina o
   comportamento de luz já presente via CSS.
5. **Pose** (asset fotográfico, opcional) — só faz sentido produzir se
   for substituir a pose procedural por uma foto/ilustração real
   específica; o Pose Engine já cobre o catálogo inteiro sem isso.
6. **Shine** — opcional, o fallback (reflexo de vidro) já é premium.

## Especificação técnica

- **Formato**: PNG (com alpha) pra tudo que precisa de transparência
  (frame, effects, glow, pose, shine). WEBP é aceito e recomendado pra
  **backgrounds** e **scenes** (opacos, sem necessidade de transparência
  — WEBP a qualidade 95 fica bem menor que PNG pro mesmo resultado
  visual). JPG/SVG também são aceitos pelo pipeline mas sem checagem
  completa de resolução/alpha em `/dev/card-assets`.
- **Proporção**: 148:199 (≈ 0.744) — a mesma proporção da carta no jogo.
  Tolerância de ±5% no inspetor (calibrado com dados reais de produção
  na Sprint 18.8 — saídas de IA generativa raramente batem a proporção
  exata, e a camada estica a imagem pra caber de qualquer forma, então
  pequenas diferenças não causam defeito visual).
- **Resolução mínima recomendada**: 512px de largura. Os 12 assets já
  integrados vieram em 1143×1600 — mais que suficiente.
- **Transparência**: frame, effects, glow, pose e shine **precisam** de
  canal alpha. Background e Scene são opacos de propósito (ambos ficam
  por trás de tudo — Scene ocupa toda a área central, não precisa deixar
  nada transparecer).

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
  "intensity": 1,
  "blur": 0,
  "animationSpeed": 1
}
```

Todos os campos são opcionais — omita o que não precisa ajustar.

| Campo | O que faz | Padrão |
|---|---|---|
| `scale` | zoom da imagem (1 = tamanho original) | `1` |
| `offsetX` / `offsetY` | desloca em pixels (positivo = direita/baixo) | `0` |
| `rotation` | rotação em graus | `0` |
| `blendMode` | modo de mesclagem CSS (`normal`, `multiply`, `screen`, `overlay`, `soft-light`, `hard-light`, `color-dodge`, `color-burn`, `lighten`, `darken`, `plus-lighter`) | `normal` |
| `intensity` (= "opacidade") | opacidade do asset (0 a 1) — é o mesmo conceito, um só campo, desde a Sprint 18.6 | `1` |
| `blur` (Sprint 18.9) | desfoque em px aplicado ao asset | `0` |
| `animationSpeed` (Sprint 18.9) | multiplicador de velocidade pra camadas que animam (Reflection, Partículas) — <1 mais rápido, >1 mais lento | `1` |

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
