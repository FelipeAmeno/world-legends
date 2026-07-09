# Sprint 20.5 — Foundation Stabilization

**Objetivo:** nenhuma feature nova. Estabilizar o Card Engine e a economia
de packs antes da fase cinematográfica (Sprint 21). Este relatório cobre
os 10 itens do brief, na ordem.

---

## 1–2. Bug do "frame novo + card antigo atrás" — causa raiz e correção

**Causa raiz confirmada:** `components/nav/AppShell.tsx` renderizava a
árvore inteira de `{children}` **duas vezes** — uma cópia para mobile
(`<div className="lg:hidden">...<PageTransition key={pathname}>{children}
</PageTransition>...</div>`) e outra para desktop (`<div className="hidden
lg:flex">...<PageTransition key={pathname}>{children}</PageTransition>...
</div>`) — ambas **sempre montadas**, alternadas só por classe CSS
responsiva (`lg:hidden` / `hidden lg:flex`), nunca por renderização
condicional/desmontagem. Isso dobrava toda a árvore de qualquer rota não-
fullscreen (Coleção, Squad, Perfil, Ranking, Missões, Conquistas, Mercado,
Eventos, Social, Configs, Hall of Legends — qualquer coisa fora de
`FULLSCREEN_ROUTES`), incluindo todo `<PlayerCard>` renderizado nelas —
uma cópia sempre visível, outra sempre presente no DOM com `display:none`
(mas nunca desmontada: timers, listeners, partículas, tilt — tudo rodando
em dobro o tempo todo).

Investigação (dois agentes de busca independentes) descartou as outras
duas hipóteses antes de confirmar esta:
- `AnimatePresence`/`PAGE_TRANSITION` (`lib/motion-tokens.ts`,
  `components/fx/PageTransition.tsx`) — não usa `AnimatePresence`, é um
  único `motion.div`; estruturalmente incapaz de deixar uma cópia de saída
  presa.
- Duplicação dentro do próprio Pack Opening — checada e descartada (ver
  item 6).

**Correção:** `AppShell.tsx` reescrito pra montar `{children}` **uma
única vez**, com o "chrome" (sidebar desktop, header mobile/desktop, nav
inferior mobile) alternado via CSS responsiva em elementos que não
carregam conteúdo de página — só nav/header, que não têm timers/estado
pesado. O padding inferior do `<main>` (precisa de espaço extra no mobile
pra não ficar atrás do `PremiumBottomNav` fixo) virou uma classe CSS
(`.app-shell-main`, `app/globals.css`) com `@media (min-width: 1024px)`
resetando o valor — evita o conflito de especificidade que um `style=`
inline teria contra uma classe Tailwind responsiva.

**Validação:** Playwright + Chrome real, contas de teste autenticadas, 3
rotas (`/collection`, `/squad`, `/profile`) × 2 viewports (390px mobile,
1440px desktop):

```
VIEWPORT=390  ROUTE=/collection: <main> total=1 visible=1
VIEWPORT=390  ROUTE=/squad:      <main> total=1 visible=1
VIEWPORT=390  ROUTE=/profile:    <main> total=1 visible=1
VIEWPORT=1440 ROUTE=/collection: <main> total=1 visible=1
VIEWPORT=1440 ROUTE=/squad:      <main> total=1 visible=1
VIEWPORT=1440 ROUTE=/profile:    <main> total=1 visible=1
```

`<main>` sempre 1 — antes da correção seriam 2 em toda rota não-
fullscreen. Screenshots confirmam layout idêntico ao anterior em ambos os
breakpoints (sidebar/topbar desktop, header/bottom-nav mobile), sem
regressão visual.

---

## 3. Simulação de economia — 100.000 packs × 7 tipos

Nova suíte `packages/packs/tests/monte-carlo/monte-carlo-all-packs.test.ts`
— estende o Monte Carlo já existente (que cobria só o Classic) pros 7
packs expostos no app, usando o **mesmo `openPack()` de produção** (não
uma reimplementação), pity zerado a cada abertura (odds puras, sem
contaminação de long-run). 182 testes: 1 tabela agregada + 1 checagem de
"nenhuma violação de garantia" + N checagens estatísticas por
slot×raridade (±0.5pp de tolerância contra a distribuição teórica) por
pack.

**Tabelas agregadas observadas** (todos os slots somados, 100.000 packs
por tipo):

| Rarity | starter | classic | national | elite | hero | legend | goat |
|---|---|---|---|---|---|---|---|
| Common | 52.561% | 52.765% | 32.102% | 34.913% | 6.752% | 5.353% | 0.000% |
| Rare | 36.456% | 34.067% | 27.950% | 14.882% | 20.008% | 20.032% | 0.000% |
| Elite | 10.983% | 11.077% | 28.396% | 32.873% | 28.286% | 27.984% | 0.000% |
| Legendary | **0.000%** | 1.759% | 9.788% | 13.419% | 29.731% | 35.360% | 37.541% |
| Ultra | **0.000%** | 0.332% | 1.764% | 3.914% | 13.555% | 9.661% | 39.937% |
| World Cup Hero | **0.000%** | 0.000% | 0.000% | 0.000% | 1.668% | 1.609% | 22.522% |

(Starter e Classic/National/Elite têm 5 cartas/pack — 500.000 slots
amostrados; Hero/Legend têm 3 — 300.000; GOAT tem 2 — 200.000.)

### Comparação com a "tabela oficial de odds" e divergência corrigida

Não existe um `docs/PACK_ODDS.md` único cobrindo os 7 packs — a única
tabela "oficial" documentada é `docs/10-card-system-master.md` §15, que só
descreve o slot livre do Classic (`58/25/11/4.5/1.3/0.2`), e o próprio
código já documenta (comentários em `pack-definitions.ts`, Sprints 17.1 e
18) que esses números foram **deliberadamente** apertados por serem
generosos demais (~17% de chance de Legendary+ por pack de 250c) — a doc
ficou desatualizada de propósito, o código é a fonte da verdade atual. Não
alterei a doc nesta sprint (fora do escopo "nenhuma feature nova" — é
puramente descritivo, não corrige comportamento).

A real divergência encontrada e corrigida foi no **Starter Pack**: seu
próprio comentário dizia *"Sem WCH — foco nas raridades básicas"*, mas os
pesos reais incluíam `legendary: 4, ultra: 1` no slot garantido e
`legendary: 1` em cada um dos 4 slots livres — ou seja, o pack de entrada
(75c, pra jogadores novos) **podia** sair com Legendary/Ultra. Bug de
implementação: `guaranteedMinRarity: 'rare'` é um **piso** (só rejeita
resultados abaixo de Rare), não um teto — um resultado `legendary`
satisfaz a garantia "Rare+" normalmente. Corrigido zerando
`legendary`/`ultra`/`world_cup_hero` explicitamente em **todos** os 5
slots do Starter (não só confiando na garantia de piso) — agora é
estruturalmente impossível (peso 0, excluído do sorteio, não uma
probabilidade baixa) sair Legendary+ do Starter Pack. Ver item 5.

Nenhuma outra divergência entre pesos declarados e comportamento observado
foi encontrada — todos os 182 testes (incluindo as checagens estatísticas
±0.5pp por slot) passam.

---

## 4. Garantias de raridade — revalidadas

Checagem automática em toda simulação: para cada pack com
`guaranteedMinRarity` num slot, todo resultado observado (500k+300k+300k+
200k+500k+500k+500k = ~2.8M slots no total, somando as 7 simulações de
100k) foi comparado contra o mínimo — **zero violações** em qualquer pack:

- Starter/Classic (garantia Rare+, slot 0)
- National (garantia Elite+, slot 0)
- Elite (garantia Elite+, slots 0-1)
- Hero/Legend (garantia Legendary+, slot 0)
- GOAT (garantia Ultra+ slot 0, Legendary+ slot 1)

Essa suíte agora é permanente (`pnpm test` do pacote `packages/packs`) —
vira regressão automática pra qualquer mudança futura nos pesos.

---

## 5. Starter Pack nunca entrega Legendary+ — validado

Confirmado por dois caminhos independentes na simulação:
1. **Estrutural**: `legendary`/`ultra`/`world_cup_hero` têm peso `0` em
   todos os 5 slots (após a correção do item 3) — `rollRarity()` filtra
   pesos `> 0` antes de sortear, então essas raridades são fisicamente
   excluídas do sorteio, não apenas improváveis.
2. **Empírico**: tabela agregada do item 3 mostra `0.000%` pra Legendary/
   Ultra/World Cup Hero em 500.000 slots amostrados do Starter — e os
   testes automáticos "slot N: legendary/ultra/world_cup_hero nunca ocorre"
   (gerados pra cada um dos 5 slots) confirmam contagem exata `0`.

---

## 6. Inconsistência visual do Pack Opening

Auditoria completa da árvore de componentes do fluxo (`PackExperience`,
`PackSelector`, `CardRevealScene`, `RevealedCard`, `GoatReveal`,
`RevealSummary`, `ExplosionOverlay`, `PackFloatScene`):

- `/packs` está em `FULLSCREEN_ROUTES` — o `AppShell` nunca envolveu essa
  rota, então o bug do item 1 **nunca afetou** o Pack Opening diretamente.
  O card duplicado que motivou este item provavelmente foi visto em outra
  tela (Coleção/Squad/Perfil, todas afetadas) antes ou depois de abrir um
  pack, não durante a abertura em si.
- `RevealedCard.tsx` renderiza `<PlayerCard>` duas vezes (linhas ~707 e
  758) — verificado como design intencional de flip-card 3D (face
  verso/frente com `backfaceVisibility: hidden` e `rotateY(180deg)`,
  nunca as duas visíveis ao mesmo tempo por corte de face traseira) — não
  é um bug.
- Todos os `AnimatePresence` que trocam elementos por `key` (o padrão que
  causaria "elemento antigo atrás do novo" se mal configurado) já usam
  `mode="wait"` corretamente: `CardRevealScene.tsx:322` (`key={currentIdx}`)
  e `PackExperience.tsx:291` (troca de fase). Os demais `AnimatePresence`
  sem `mode="wait"` envolvem condicionais booleanas simples (não trocas de
  `key`), sem risco de sobreposição.

**Conclusão:** nenhuma inconsistência visual adicional, distinta do item
1, foi encontrada no Pack Opening — a correção do `AppShell` resolve o
sintoma relatado em qualquer tela onde ele aparecia.

*(Nota de metodologia: não foi possível testar a abertura de pack ao vivo
— fim a fim, com saldo real — porque isso exigiria uma mutação direta de
saldo via chave de serviço do Supabase num perfil de teste, ação bloqueada
pelo classificador de modo automático por mexer em dado de produção sem
pedido explícito. A validação acima é por auditoria de código completa,
não por execução ao vivo do fluxo de abertura.)*

---

## 7–8. Sem features novas, sem mudança de API pública

- `AppShell`: mesma assinatura de props (`{ children, headerSummary }`),
  nenhum call site precisou mudar.
- `Pack`/`PackId`/`SlotDefinition`/`openPack()`: assinaturas inalteradas —
  só os **valores** de peso do `STARTER_PACK` mudaram, não sua forma.
- Nenhuma tela, rota ou funcionalidade nova — só correção de bugs e uma
  suíte de testes de regressão.

## 9. Build limpo

```
pnpm exec biome check .   → 464 warnings, 0 erros (mesmo baseline de sempre)
pnpm exec tsc --noEmit    → 0 erros (apps/web e packages/packs)
pnpm test (apps/web)      → 204/204 testes passando
pnpm test (packages/packs)→ 278/278 testes passando (96 pré-existentes + 182 novos)
pnpm build                → sucesso, 24/24 páginas, nenhum bundle cresceu
```

## 10. Este relatório

`SPRINT_20_5_FOUNDATION.md`.

---

## Arquivos modificados

- `apps/web/components/nav/AppShell.tsx` — árvore de conteúdo única
  (correção do bug de duplicação).
- `apps/web/app/globals.css` — nova classe `.app-shell-main` (padding
  responsivo do `<main>` compartilhado).
- `packages/packs/src/pack/pack-definitions.ts` — `STARTER_PACK`: pesos
  de `legendary`/`ultra`/`world_cup_hero` zerados em todos os 5 slots.
- `packages/packs/tests/monte-carlo/monte-carlo-all-packs.test.ts` (novo)
  — simulação de 100k packs × 7 tipos, permanente, roda em todo `pnpm test`.

## Não modificado

Gameplay, economia de moeda/preços, Supabase, Card Engine (`PlayerCard` e
camadas), Match Engine — escopo exclusivo de estabilização (bugs +
validação), conforme pedido.
