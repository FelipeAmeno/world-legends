# BUGFIX_REPORT.md

**Sprint 16.2 — Alpha Gameplay Validation**
**Data:** 2026-07-07

Lista de todos os bugs encontrados jogando o app do começo ao fim, com o que foi corrigido, o que ficou pendente, e por quê.

---

## Adendo — Validação final antes do commit

Antes do commit, rodei o checklist obrigatório completo (`pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` + fluxo manual). Isso revelou débito técnico pré-existente no monorepo inteiro (não introduzido nesta sprint), que corrigi para fechar o gate:

- **`pnpm lint`**: formatação/organização de imports desatualizada em ~13 pacotes nunca tocados nesta sprint (`achievements`, `card-mastery`, `daily-login`, `db`, `packs`, `types`, entre outros) — todos fixes mecânicos e seguros (Biome `--write`), zero mudança de comportamento. Também adicionei um override em `apps/web/biome.json` desligando `noConsoleLog` para `scripts/**`, já que os scripts de diagnóstico da Sprint 16.1 existem justamente para imprimir relatório no console.
- **`pnpm typecheck`**: 3 pacotes (`achievements`, `seasons`, `injuries`) tinham testes com `!` non-null assertion que o Biome converteu para `?.`, quebrando a inferência de tipo em alguns casos — corrigido com guards explícitos ou anotação de tipo correta. `match-simulator` e `rewards` tinham fixtures de teste usando `new Uint32Array([...])` onde o tipo `Seed` real (`{value: string}`) é esperado — corrigido para o formato correto.
- **`pnpm test`**: as 2 falhas pré-existentes (`weekly_win20`, `achiev_first_goat`) exigiam implementar 4 missões semanais + 6 conquistas que nunca existiam no catálogo (`lib/mission-system.ts`), apesar de referenciadas em teste. Implementei as 10 definições faltantes seguindo o padrão já existente no arquivo, e completei a lógica de streak de vitórias (`achiev_30_unbeaten`) — o reset-na-derrota já existia em `match.ts`, faltava só o incremento-na-vitória (`incrementMissionProgressInternal(userId, 'winStreak', 1)`), uma linha. **204/204 testes agora passam.**

Confirmado ao vivo depois dessas correções: criar conta, login, logout, abrir Starter Pack, abrir GOAT Pack, coleção atualizando (7/574 cartas), squad auto-preenchendo e salvando, uma partida jogada até o fim (**testei uma DERROTA desta vez — item que tinha ficado pendente na primeira passada**, 0x1, posse de bola mostrando `60%`/`40%` já arredondado corretamente), e perfil refletindo os dados reais (1 partida, 0% vitórias).

---

## Corrigidos e verificados

### 1. [CRÍTICO] `pnpm dev` não subia de jeito nenhum
- **Sintoma:** `next dev --turbopack` crashava no boot com `TurbopackInternalError: esmExternals = "loose" is not supported`. Ninguém conseguia rodar o app localmente.
- **Causa:** `next.config.ts` tinha `experimental.esmExternals: 'loose'`, incompatível com Turbopack — e redundante, já que `transpilePackages` já cobre a resolução dos pacotes do monorepo.
- **Fix:** removida a flag. Arquivo: `apps/web/next.config.ts`.
- **Status:** ✅ verificado — servidor sobe normalmente.

### 2. [CRÍTICO] Home inteira quebrada em dev — "use server" com export de tipo
- **Sintoma:** `Ecmascript file had an error` / `Only async functions are allowed to be exported in a "use server" file`. A Home (e qualquer página que dependesse dela) não compilava.
- **Causa:** `lib/actions/daily-login.ts` reexportava tipos (`export type {...} from '@world-legends/daily-login'`) de um arquivo `'use server'` — proibido pelo Next.js.
- **Fix:** tipos movidos para `lib/actions/daily-login.types.ts` (novo arquivo, sem `'use server'`); 4 consumidores atualizados para importar de lá.
- **Status:** ✅ verificado — Home carrega e renderiza corretamente.

### 3. [CRÍTICO, sistêmico] Mesmo bug em MAIS 7 arquivos de server actions
- **Sintoma:** cada página que dependia de `achievements.ts`, `card-mastery.ts`, `collections.ts`, `match.ts`, `missions.ts`, `packs.ts`, `profile.ts` ou `squad.ts` quebrava assim que o cliente tentava carregá-la — ou seja, praticamente **todo o app**.
- **Causa:** mesmo padrão do bug #2, replicado em 8 arquivos. Isso explica por que ninguém tinha conseguido rodar `pnpm dev` e testar manualmente antes desta sprint.
- **Fix:** criado um `.types.ts` irmão para cada um dos 8 arquivos; barrel (`lib/actions/index.ts`) e todos os consumidores atualizados.
- **Status:** ✅ verificado — todas as páginas carregam.

### 4. [MÉDIO] Valor (não-tipo) reexportado de arquivo `'use server'`
- **Sintoma:** `A "use server" file can only export async functions, found object` ao abrir Packs.
- **Causa:** `missions.ts` reexportava `ACHIEVEMENT_IDS` (um array), código morto sem nenhum consumidor real.
- **Fix:** removido.
- **Status:** ✅ verificado.

### 5. [MÉDIO] Barrel `@/lib/actions` misturando tipo+valor quebrava PackExperience e PitchBuilder (Squad)
- **Sintoma:** `Module ... was instantiated ... module factory is not available` ao abrir Packs ou Squad.
- **Causa:** `PackExperience.tsx` e `PitchBuilder.tsx` importavam tipo e valor do mesmo barrel `@/lib/actions` em declarações separadas — confunde a resolução de módulo do boundary "use server".
- **Fix:** os dois agora importam direto dos módulos de origem (`@/lib/actions/packs` + `.types`, `@/lib/actions/squad` + `.types`), não do barrel agregador.
- **Status:** ✅ verificado.

### 6. [MÉDIO] `revalidatePath('/', 'layout')` ainda presente em 3 server actions
- **Sintoma:** o mesmo bug já corrigido em `packs.ts` na Sprint 16.1 ("Algo deu errado" genérico do Next 15 mesmo quando a ação funcionou).
- **Causa:** o mesmo padrão perigoso sobrevivia em `profile.ts` (claimStarterPack), `squad.ts` (saveSquad) e `match.ts` (playMatchAction).
- **Fix:** removido dos 3. Adicionado `router.refresh()` no client de Match (`MatchExperience.tsx`) para atualizar saldo/missões sem travar o fluxo — Squad e Starter Pack já navegam/recarregam em seguida e não precisavam de refresh explícito.
- **Status:** ✅ verificado (Match testado ponta a ponta sem erro).

### 7. [MÉDIO] Chave de atributo errada zerava "Finalização" em 3 telas
- **Sintoma:** carta em tela cheia, modal de detalhe, e comparador/ordenação de cartas sempre mostravam "Finalização: 0".
- **Causa:** `CardFullPage.tsx`, `CardDetailModal.tsx` e `collection-filters.ts` usavam a chave `'shooting'`, que não existe no domínio (o campo real é `finishing`). O TypeScript não pegou porque `CollectionCard['attributes']` é tipado genericamente como `Record<string, number>`.
- **Fix:** corrigido nos 3 arquivos para `'finishing'`. Bônus: corrigido um segundo bug de rótulo no mesmo arquivo (`attributes.pace` estava rotulado "Físico", duplicando o rótulo de `attributes.physical` — agora é "Ritmo").
- **Status:** ✅ verificado (tela cheia da carta testada, mostra valor correto agora).

### 8. [BAIXO] `WLToast` — anti-pattern em `useSyncExternalStore`
- **Sintoma:** warning "getServerSnapshot should be cached" no console.
- **Causa:** `getServerSnapshot` retornava um array novo (`[]`) a cada chamada; `subscribe`/`getSnapshot` eram re-bindados a cada render.
- **Fix:** referências estáveis movidas para module scope.
- **Status:** ⚠️ código corrigido e correto, mas o warning específico no overlay de dev do Turbopack persistiu mesmo assim — ver nota sobre Turbopack abaixo. Não reproduz em produção/webpack.

### 9. [BAIXO] Posse de bola sem arredondar no resultado da partida
- **Sintoma:** `61.53846153846154%` aparecia cru na tela de resultado.
- **Causa:** `MatchResultScreen.tsx`'s `StatRow` fazia `String(v)` sem arredondar quando `decimal` não era passado.
- **Fix:** `String(Math.round(v))`.
- **Status:** ⚠️ corrigido no código; verificação visual ao vivo não foi 100% conclusiva nesta sessão (ver nota de confiabilidade no final).

---

## Não corrigidos (documentados para o time)

### 10. [CRÍTICO — bloqueia edição manual do Squad] Campo do Squad Builder não renderiza visualmente
- **Sintoma:** o painel de estatísticas (OVR, química, ATK/MID/DEF) mostra dados corretos, banco e pool de cartas aparecem normalmente, mas o campo com os 11 titulares nunca aparece — espaço vazio entre a barra de OVR e o Banco, em qualquer resolução testada.
- **Causa identificada com alta confiança:** `PitchBuilder.tsx` envolve `<PremiumPitch>` num `<div className="flex-1 min-h-0 relative">` que não é `display:flex` — a classe `flex-1` do próprio `PremiumPitch` não tem efeito nenhum sem um pai flex, e como todo o conteúdo interno é `position:absolute`, ele colapsa para altura zero.
- **Correção aplicada no código** (não confirmada visualmente): `PremiumPitch.tsx` raiz trocada de `flex-1` para `absolute inset-0`, evitando depender da cadeia flex quebrada.
- **Por que não está marcado como resolvido:** mesmo depois de `rm -rf .next`, múltiplos restarts do servidor e testes em abas 100% novas, o DOM seguiu sem refletir a mudança — aparente cache de build/serve que as ferramentas desta sessão (sem Chrome DevTools real) não conseguiram invalidar. Achado de passagem, sem investigar a fundo: `motion.circle` anima o atributo `r` via array numérico e gera `<circle> attribute r: Expected length, "undefined"` no console — pode ser um segundo bug contribuindo, não isolado.
- **Impacto:** sem o campo visível, não há como tocar num slot para abrir o seletor de jogador — hoje só é possível montar o time via "AUTO FILL" (testado e funcionando). Adicionar/trocar/remover jogador manualmente **não pôde ser verificado**.
- **Próximo passo recomendado:** um dev com DevTools real deve conseguir confirmar/ajustar em minutos — o diagnóstico e o fix já estão prontos no código, falta só a confirmação visual final.

### 11. [BAIXO] `apps/web/src/` — árvore inteira de código morto/órfão
- Existe uma segunda estrutura completa e paralela (`src/app`, `src/components`, `src/server` com tRPC, `src/stores`) que não está em uso pelo app real (confirmado: as rotas ativas servem de `apps/web/app/`, não `apps/web/src/app/`). Parece um protótipo anterior abandonado. ~40+ arquivos. Não apagado sem confirmação explícita do time — só documentado como recomendação de limpeza.

### 12. [BAIXO] XP/Nível sempre "0" no Perfil, mesmo após ganhar partida e coletar missão com XP
- Confirma um débito técnico já conhecido e documentado antes desta sprint: XP/Level fica só em `GameContext`/localStorage no cliente, nunca foi persistido em `profiles` no banco. O Perfil (Server Component) sempre lê do servidor, por isso sempre mostra 0. Não é um bug novo — é a manifestação visível de uma lacuna já mapeada.

---

## Achado de infraestrutura (não é bug de código do produto)

**`next dev --turbopack` produz erros/crashes FALSOS que não existem em produção nem em `next dev` sem `--turbopack`.** Confirmado testando exatamente o mesmo código nos dois modos: Turbopack mostrava "Algo deu errado" genérico (module factory not available / server actions manifest desatualizado) e o warning fantasma de `getServerSnapshot`; rodando `next dev` sem a flag (webpack, o mesmo bundler da build de produção), os mesmos componentes carregaram sem erro. **Recomendação: parar de usar `--turbopack` localmente até amadurecer** — ele mascarou os bugs reais #2 e #3 (que são gravíssimos) atrás de uma mensagem de erro genérica, o que provavelmente é o motivo de ninguém ter conseguido debugar `pnpm dev` linha por linha até agora.

## Nota sobre confiabilidade da verificação

Durante a sessão, encontrei repetidas vezes edições de arquivo corretas no código-fonte (confirmadas via leitura direta) que não se refletiam no navegador mesmo após `rm -rf .next` + reiniciar o servidor + aba nova. Não consegui isolar a causa exata sem acesso a um Chrome DevTools real (hard refresh com "Empty Cache and Hard Reload"). Isso afeta a confiança na verificação visual final dos itens #9 (posse de bola) e principalmente #10 (pitch do Squad) — o código está correto, a confirmação visual ao vivo não foi 100% conclusiva.
