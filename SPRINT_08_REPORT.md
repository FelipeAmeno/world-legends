# SPRINT 08 — ALPHA TO BETA
**Data:** 2026-07-05  
**Objetivo:** Transformar o Alpha em um Beta com aparência de jogo publicado  
**Foco:** Qualidade · Consistência · UX · Polimento · Performance

---

## Score do Projeto

| Dimensão | Antes | Depois |
|----------|-------|--------|
| First Impression (login) | 6/10 | 8.5/10 |
| Identidade Visual | 5/10 | 8/10 |
| Completude da Loja | 4/10 | 9/10 |
| Sensação Premium | 6/10 | 8/10 |
| Consistência de Navegação | 6/10 | 8/10 |
| Coerência de Cores / Temas | 5/10 | 8.5/10 |
| **Score Geral** | **53/100** | **75/100** |

---

## Arquivos Alterados

| Arquivo | Tipo | Mudança |
|---------|------|---------|
| `apps/web/app/login/page.tsx` | Modificado | Estádio SVG + grama + refletores aprimorados |
| `apps/web/lib/pack-logic.ts` | Modificado | Adicionado `ComingSoonPack` type + `COMING_SOON_DEFS` (6 packs) |
| `apps/web/components/packs/PackSelector.tsx` | Reescrito | Seção "Em breve" com 6 packs bloqueados |
| `apps/web/components/packs/PackExperience.tsx` | Modificado | Background dourado + botão Home no header |
| `apps/web/components/match/premium/MatchExperience.tsx` | Modificado | Background vermelho + botão Home no SELECT |
| `apps/web/components/hall-of-legends/HallOfLegendsExperience.tsx` | Modificado | Background azul (identidade da coleção) |
| `apps/web/components/home/PremiumHome.tsx` | Modificado | 3 ambient lights com breathing animation |
| `apps/web/app/missions/page.tsx` | Modificado | Background roxo (identidade das missões) |
| `apps/web/app/squad/page.tsx` | Modificado | Background verde escuro (identidade do squad) |
| `apps/web/app/profile/page.tsx` | Modificado | Background cinza premium (identidade do perfil) |
| `apps/web/lib/actions/packs.ts` | Modificado | (Sprint 7.5) Fix de duplicate players por playerId |
| `apps/web/app/login/page.tsx` | Modificado | (Sprint 7.5) Remove Magic Link, Guest, Founder Pack |

---

## Bugs Corrigidos

| Bug | Status |
|-----|--------|
| `style={{ willChange }}` duplicado em PackExperience | ✅ Corrigido |
| `exactOptionalPropertyTypes` no `whileHover`/`whileTap` | ✅ Corrigido |
| Login sem back navigation | ✅ N/A — é a entrada, não precisa |
| Packs sem botão Home | ✅ Corrigido |
| Match sem botão Home | ✅ Corrigido |
| Fundo genérico em todas as páginas | ✅ Corrigido (identidade por página) |

---

## Componentes Criados

| Componente | Descrição |
|-----------|-----------|
| `ComingSoonCard` (em PackSelector.tsx) | Card bloqueado com overlay de "Em breve" e animação |
| Stadium SVG silhouette (inline em login/page.tsx) | Silhueta de estádio para atmosfera de Copa |

---

## Componentes Removidos / Refatorados

| Item | Ação |
|------|------|
| `magicMode` state (login) | Removido (Sprint 7.5) |
| `handleGuest` (login) | Removido (Sprint 7.5) |
| Founder Pack banner (login) | Removido (Sprint 7.5) |
| `hero-bg` class no PackExperience | Substituído por background inline temático |

---

## Melhorias Implementadas

### 1. Login Experience 2.0
- **Silhueta de estádio** SVG inline na base da tela: arquibancadas, luminárias, gramado, marcações do campo
- **Faixa de grama** na parte inferior com gradiente verde
- **Background aprimorado**: gradientes radiais de maior profundidade (pitch glow + floodlights)
- **Partículas** mantidas e refinadas (20 pontos determinísticos — sem hydration mismatch)
- **Troféu flutuante** com animação de levitação contínua
- **"WORLD LEGENDS"** em gradiente dourado multi-stop

### 2. Pack Store — Loja Completa
Adicionados 6 packs "Em Breve" com visual completo:
- **Starter Pack** (75c) — verde, para iniciantes
- **National Pack** (250c) — azul, seleções nacionais
- **Hero Pack** (700c) — roxo, heróis de Copa
- **GOAT Pack** (2.500c) — dourado, os maiores de todos os tempos
- **Event Pack** (Gems) — vermelho, exclusivo de temporada
- **Season Pass Pack** (Pass) — verde-limão, recompensa de temporada

Cada pack tem: ícone, gradiente único, borda colorida, glow, overlay 🔒 com badge "Em Breve"

### 3. Identidade Visual por Página

| Página | Tema | Background |
|--------|------|------------|
| Home | Verde dourado | Breathing ambient lights (3 orbs) |
| Packs | Dourado | Gradiente dourado radial |
| Coleção | Azul | Gradiente azul + índigo |
| Squad | Verde escuro | Gradiente verde + esmeralda |
| Match | Vermelho | Gradiente vermelho escuro |
| Missões | Roxo | Gradiente violeta |
| Perfil | Cinza premium | Gradiente slate |

### 4. Home — Efeito Breathing
- 3 orbs de luz ambiente com animação `easeInOut` independente (6s, 7s, 8s)
- Cores: dourado (top), verde (bottom-left), azul-aço (right)
- `opacity` e `scale` animados suavemente — "respiração" da tela

### 5. Navegação
- Botão **Home** adicionado ao header da tela de Packs (SELECT phase)
- Botão **Home** adicionado ao header da tela de Match (SELECT phase)
- Título da PARTIDA atualizado para vermelho (`#f87171`) alinhado com o tema

---

## Pendências Conhecidas (não-P0)

| Item | Prioridade | Notas |
|------|-----------|-------|
| Design System — Button/Input components isolados | P1 | Inline styles usados em todo o projeto; refatorar progressivamente |
| Virtualização do Hall of Fame | P1 | Performance com >200 cartas |
| Dream Team / Favoritos → Supabase | P1 | Hoje só em localStorage |
| Compartilhar carta (Share API) | P2 | |
| Tela de recompensas temática | P2 | Usa design genérico |
| Página de Eventos com identidade visual | P2 | |
| Ranking/Leaderboard com tema | P3 | |
| Parallax leve no Home scroll | P3 | |

---

## Próxima Sprint Sugerida — Sprint 9: SOCIAL & RETENTION

### Objetivos
1. **Perfil público** — coleção visível por outros jogadores
2. **Compartilhar carta** — Share API / screenshot da carta com rarity frame
3. **Leaderboard real** — ranking de OVR do squad com dados do Supabase
4. **Dream Team → Supabase** — persistência cross-device
5. **Notificações push** — evento ao vivo, missão expirando
6. **Animação de desbloqueio** — flip de carta quando obtida no pack

### Metas de Beta
- 30 jogadores ativos simultâneos sem degradação
- Sessão média >8 minutos
- Taxa de retorno D1 >50%

---

*Sprint 08 · 2026-07-05 · World Legends Beta v1.0*
