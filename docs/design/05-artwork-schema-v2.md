# WORLD LEGENDS ARTWORK SCHEMA V2

**Version:** 1.0
**Status:** Contract defined (Sprint 42B) — not executed
**Owner:** Creative Direction / Art Systems
**Project Owner:** Felipe Ameno
**Derived from:** World Legends Asset Studio Specification v1.0 (`03-world-legends-asset-studio-spec-v1.md`); Sprint 42A HUD Simplification
**Language:** Portuguese
**Last updated:** 2026-07-16

---

## 0. Objetivo

Este documento define o **Artwork Schema V2** — o contrato formal pra toda arte de carta completa (`full-card-artwork`) gerada a partir de agora, e a estratégia de compatibilidade retroativa com o **Artwork Schema V1** (as 10 artes de piloto existentes, aprovadas e em produção).

Esta sprint (42B) define o contrato — tipos, validação, template de prompt, convenção de reference set, manifesto — e não gera, substitui ou altera nenhuma arte real.

---

## 1. Por que um V2

A Sprint 42A removeu os 6 atributos detalhados (Ritmo/Finalização/Passe/Drible/Defesa/Físico) da face visível da carta, em toda densidade. As artes V1 existentes já tinham caixas de stat DESENHADAS na própria imagem (`statsTop`/`statsBottom`) — essas caixas continuam lá, fisicamente, mas o HUD React parou de escrever números/labels em cima delas. Elas ficam visualmente vazias.

O Artwork Schema V2 é o contrato pra artes NOVAS que já nascem sem essas caixas — nem desenhadas, nem esperadas. Uma arte V2 correta não reserva espaço nenhum pra 6 atributos porque esse conceito não existe mais na face da carta.

---

## 2. V1 vs. V2 — comparação

| | **V1** (existente, 10 pilotos) | **V2** (contrato novo) |
|---|---|---|
| `artworkSchemaVersion` | ausente (implícito = 1) | `2` (explícito, obrigatório) |
| Caixas de 6 atributos | podem existir desenhadas na arte (`statsTop`/`statsBottom`), hoje vazias | nunca existem — nem na arte, nem no `hudLayout` do preset |
| Safe zones formais | não existem como campo — só `hudLayout`/`hudLayouts` (zonas de HUD em runtime) | `safeZones.upperLeftHudZone` + `safeZones.lowerIdentityZone` obrigatórios no preset |
| Validação | `cards:validate` confere arquivo, proporção 2:3, resolução, alpha | tudo do V1 + validação de `safeZones` e rejeição de zonas de atributo |
| Precisa editar JSON existente? | **Não** — nenhum preset V1 precisa de qualquer edição | N/A (só presets novos) |
| Renderer (`FullArtworkWorldLegendsCard`) | mesmo componente | mesmo componente — nenhuma mudança de código foi necessária (ver §7) |

---

## 3. Contrato visual do V2

Uma arte V2 aprovada contém **somente**:

- ilustração do jogador;
- moldura de carta completa;
- ambiente cinematográfico de futebol;
- materiais de raridade;
- iluminação;
- efeitos decorativos estáticos;
- zona segura superior-esquerda clara (`upperLeftHudZone`);
- zona segura de identidade inferior limpa (`lowerIdentityZone`);
- seção decorativa inferior contínua;
- composição de carta completa.

Uma arte V2 **nunca** contém:

- as 6 caixas de atributo;
- labels de atributo;
- texto placeholder;
- nome do jogador;
- apelido;
- OVR;
- texto de posição;
- bandeira do país;
- qualquer texto legível;
- logos;
- patrocínios;
- marca d'água;
- qualquer dado dinâmico de gameplay queimado na imagem.

Todo texto dinâmico (OVR, posição, nome, apelido) continua sendo HUD React desenhado por cima, exatamente como no V1 — a arte nunca contém texto.

---

## 4. Contrato de metadata

Campos de um preset V2 (`public/assets/cards/metadata/<id>.json`):

```json
{
  "id": "wl-legendary-example-002",
  "sourceType": "full-card-artwork",
  "rarity": "legendary",
  "artworkSchemaVersion": 2,
  "artwork": "source/artworks/legendary/wl-artwork-example-002-v1.png",
  "productionEligible": false,
  "experimental": true,
  "safeZones": {
    "upperLeftHudZone": { "x": 17, "y": 19, "width": 18, "height": 12 },
    "lowerIdentityZone": { "x": 50, "y": 82, "width": 72, "height": 10 }
  },
  "generated": { "compact": null, "standard": null, "showcase": null },
  "frame": null
}
```

Campos deliberadamente **ausentes** deste contrato: nome do jogador, OVR, posição, apelido, atributos de gameplay, país completo. Esses dados dinâmicos moram só no modelo de jogador/carta (`lib/collection-data.ts`), nunca no preset de arte — o mesmo princípio que já regia o V1.

`version` (metadata livre, número da revisão da imagem) e `artworkSchemaVersion` (versão do CONTRATO) são campos diferentes — não confundir. Uma mesma arte pode ir de `version: 1` pra `version: 2` sem nunca mudar de `artworkSchemaVersion`.

---

## 5. Safe zones

Convenção normalizada (0-100%), mesma semântica de `HudZone` (`lib/card-static/hud-layout.ts`): `x`/`y` são o **centro** da zona, não o canto superior-esquerdo. Diferente de `HudZone`, `width`/`height` são **obrigatórios** numa safe zone (uma zona sem dimensão não é validável).

```ts
type ArtworkSafeZone = { x: number; y: number; width: number; height: number };

type ArtworkSafeZones = {
  upperLeftHudZone: ArtworkSafeZone;   // reservada pro overlay de OVR + posição
  lowerIdentityZone: ArtworkSafeZone;  // reservada pro nome + apelido opcional
  countryOrTraitZone?: ArtworkSafeZone; // só se a UI de produção atual exigir (hoje: não)
};
```

**Importante:** `safeZones` é um contrato de *autoria/validação da arte* — confirma que a imagem-fonte reserva espaço legível onde o HUD vai desenhar. Ele **não alimenta** `hudLayout`/`hudLayouts` (que continuam sendo o que `FullArtworkWorldLegendsCard` lê em runtime pra posicionar o texto). Os dois sistemas descrevem "zonas" com formato parecido mas resolvem problemas diferentes, de propósito — nunca foram unificados num só.

---

## 6. Proibições visuais e validação

`cards:validate` (via `lib/card-static/artwork-schema-v2.ts`) aplica, só pra presets com `artworkSchemaVersion === 2`:

1. `sourceType` deve ser `"full-card-artwork"`.
2. `safeZones` deve existir.
3. `safeZones.upperLeftHudZone` e `safeZones.lowerIdentityZone` devem existir e ser válidas.
4. Coordenadas normalizadas (`x`/`y`/`width`/`height`) devem estar entre 0 e 100.
5. Nenhuma zona pode ter `width`/`height` zero ou negativo.
6. `hudLayout.statsTop`/`statsBottom`/`stats` (ou o equivalente em `hudLayouts.<density>`) **não podem estar presentes** — é erro, não um aviso.
7. Uma `artworkSchemaVersion` fora de `1`/`2` é sempre erro (nunca assumido como V1 nem ignorado).

Presets V1 (ausente ou `1`) **nunca** passam por essas checagens — nenhum preset existente pode quebrar por regras que só existem pro contrato novo.

OCR/detecção de texto/logo na imagem **não é um gate obrigatório** nesta sprint — fica pra uma futura camada de validação do Asset Studio.

---

## 7. Compatibilidade retroativa e o renderer

Nenhuma mudança foi necessária em `FullArtworkWorldLegendsCard.tsx` ou em `ResolvedWorldLegendsCard.tsx`. Isso não foi uma omissão — é uma consequência direta de duas decisões já tomadas:

1. A Sprint 42A já fez `showStatsTop`/`showStatsBottom`/`showStats` serem `false` incondicionalmente, em qualquer densidade, pra qualquer preset. Um preset V2 (que nunca declara essas zonas) e um preset V1 (que pode declarar, mas é ignorado) passam pelo MESMO código, com o MESMO resultado visual.
2. O resolver (`resolvePlayerCardRenderer`/`resolvePlayerCardRendererForDensity`) nunca leu `artworkSchemaVersion` — a decisão full-artwork vs. procedural continua baseada só em `generated`/`productionEligible`, exatamente como sempre foi.

`artworkSchemaVersion` é passthrough informativo no manifesto gerado (útil pra ferramentas/QA saberem qual contrato uma arte segue) — não é um input de decisão de renderização.

Nenhum componente `FullArtworkWorldLegendsCardV2` foi criado. Nenhum resolver V2 separado foi criado. Nenhum sistema de manifesto duplicado foi criado.

---

## 8. Contrato de prompt (fundação pro Asset Studio)

`lib/asset-studio/prompt-template.ts` define `buildV2ArtworkPrompt(input)` — função pura e determinística que monta o texto de prompt V2 a partir de um input tipado (`PromptTemplateInput`): `displayName`, `country`, `era`, `position`, `archetype`, `rarity`, `identityNotes`, `referenceSet`.

- Nenhum provedor de geração de imagem é chamado.
- Nenhum prompt de jogador real específico é preenchido/commitado nesta sprint.
- Input incompleto retorna `{ ok: false, error, missingFields }` em vez de lançar exceção.
- A saída sempre contém as proibições do V2 (nome, OVR, posição, apelido, bandeira, logos, patrocínios, marca d'água, 6 caixas de atributo, dado dinâmico de gameplay) e os requisitos de output (2:3 vertical, PNG de alta resolução, sem mockup, sem fundo de apresentação externo).

Esta é a fundação — o Asset Studio real (interface, chamada de geração, aprovação) é trabalho de uma sprint futura.

---

## 9. Convenção de reference set

`lib/asset-studio/reference-set.ts` define 6 reference sets, um por raridade: `common-v2`, `rare-v2`, `elite-v2`, `legendary-v2`, `goat-v2`, `world-cup-hero-v2`.

```ts
type ReferenceSet = {
  id: string;
  rarity: ReferenceSetRarity;
  schemaVersion: 2;
  description: string;
  files: string[];   // pode estar vazio — nenhuma referência final existe ainda
  active: boolean;    // false até aprovação humana explícita
  version: number;
};
```

Hoje, todos os 6 têm `active: false` e `files: []` — nenhuma imagem de referência real existe ainda; isso é esperado e correto nesta sprint. `getActiveReferenceSet(rarity)` retorna `null` pra qualquer raridade até que um humano aprove referências reais e mude `active` pra `true` manualmente. Ver `lib/asset-studio/reference-sets/README.md` pra estrutura de pastas esperada.

---

## 10. Estratégia de migração (não executada nesta sprint)

Ordem sugerida quando a migração real começar (sprint futura, após aprovação humana das referências V2):

**Prioridade 1:**
- Messi
- Zidane
- Beckenbauer

**Prioridade 2:**
- demais artes de piloto atuais (Pelé, Ronaldinho, Ronaldo, Maradona, Cristiano Ronaldo, Neymar, Mbappé)

Regras:

1. Nenhuma substituição em massa.
2. V1 continua suportado — nenhuma arte existente é apagada ou invalidada.
3. Arte V2 só substitui a V1 depois de aprovação humana explícita (nunca automático).
4. O `id` do preset pode continuar o mesmo — só o `artwork`/`version` avançam.
5. `cards:validate` e `cards:build` rodam depois da aprovação, nunca antes.
6. Nenhuma publicação automática em produção.

---

## 11. Exemplos

### Metadata V1 válida (sem alteração, continua assim pra sempre)

```json
{
  "id": "wl-goat-brazil-001",
  "sourceType": "full-card-artwork",
  "rarity": "goat",
  "artwork": "source/artworks/goat/wl-artwork-goat-brazil-001-v1.png",
  "productionEligible": true,
  "hudLayout": { "statsTop": { "x": 50, "y": 78, "width": 72, "height": 7 } }
}
```

Válida porque `artworkSchemaVersion` está ausente (= 1) e V1 nunca é checado contra as regras de safe zone/atributo do V2.

### Metadata V2 válida

Ver §4 acima.

### Metadata V2 **inválida** (exemplos)

```json
{ "artworkSchemaVersion": 2, "sourceType": "layered", "safeZones": { "upperLeftHudZone": {...}, "lowerIdentityZone": {...} } }
```
→ erro: `sourceType` deve ser `"full-card-artwork"` quando `artworkSchemaVersion` é 2.

```json
{ "artworkSchemaVersion": 2, "sourceType": "full-card-artwork", "safeZones": null }
```
→ erro: `safeZones` ausente.

```json
{ "artworkSchemaVersion": 2, "sourceType": "full-card-artwork", "safeZones": { "upperLeftHudZone": { "x": 17, "y": 19, "width": 0, "height": 12 }, "lowerIdentityZone": {...} } }
```
→ erro: `upperLeftHudZone` com dimensão zero.

```json
{ "artworkSchemaVersion": 2, "sourceType": "full-card-artwork", "safeZones": {...válido...}, "hudLayout": { "statsTop": {...} } }
```
→ erro: `hudLayout.statsTop` presente — V2 não aceita zonas de atributo.

```json
{ "artworkSchemaVersion": 5 }
```
→ erro: versão de schema desconhecida.

---

## 12. Integração esperada com o Asset Studio (futuro)

Quando o Asset Studio real for construído (fora do escopo desta sprint):

- deve consumir `ArtworkSchemaVersion`/`ArtworkSafeZones`/`ReferenceSet` diretamente de `lib/card-static/` e `lib/asset-studio/` — nunca duplicar esses tipos numa camada de UI separada;
- deve usar `buildV2ArtworkPrompt` como a única fonte do texto de prompt — nunca reimplementar o template numa tela;
- deve expor `artworkSchemaVersion` e `safeZones` como campos editáveis/visualizáveis, mas a validação real continua vivendo em `lib/card-static/artwork-schema-v2.ts`, nunca duplicada na UI;
- deve reaproveitar `REFERENCE_SETS`/`getActiveReferenceSet` como a fonte de verdade de qual conjunto de referência está ativo por raridade.

---

## 13. Declaração explícita

**Nenhum dado dinâmico de gameplay (nome, OVR, posição, apelido, atributos, país) deve jamais ser queimado numa imagem de arte de carta — nem V1, nem V2, nem qualquer versão futura.** Todo esse dado é sempre HUD React, resolvido em runtime a partir do modelo de jogador/carta. A arte descreve só a cena, o material, a moldura e a luz.

---

**Fim — World Legends Artwork Schema V2 (Sprint 42B)**
