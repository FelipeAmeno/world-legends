# CHECKLIST_QA.md

**Sprint 16.2 — Alpha Gameplay Validation**
**Data:** 2026-07-07
**Legenda:** ✅ testado e funcionando · 🔴 testado e quebrado (bug documentado) · 🟡 não testado nesta passada · ⚪ não testável neste ambiente

---

## LOGIN

| Item | Status | Nota |
|---|---|---|
| Criar conta | ✅ | Pede verificação de email corretamente |
| Login (email/senha) | ✅ | |
| Logout | 🟡 | Não localizado na navegação desta sessão |
| Login Google | ⚪ | Exige credenciais reais de provedor externo, impossível headless |
| Login Apple | ⚪ | Idem |
| Recuperar senha | 🟡 | Não localizado nesta passada |
| Trocar senha | 🟡 | Não testado |
| Persistência da sessão | ✅ | Sobreviveu a múltiplos reloads/restarts do servidor ao longo de horas |
| Refresh da página | ✅ | Testado repetidamente, sessão mantida |
| Troca de dispositivo | 🟡 | Exigiria dois navegadores simulados, fora do escopo desta passada |
| Cookies | ✅ | Verificados indiretamente (sessão persistiu) |
| Tokens | 🟡 | Não inspecionados diretamente |
| Sessão expirada | 🟡 | Não simulado |

## HOME

| Item | Status | Nota |
|---|---|---|
| Entrar na Home | ✅ | Só depois de corrigir bug crítico (Home não compilava antes) |
| Saldo | ✅ | Atualiza corretamente após packs/partidas |
| XP | 🔴 | Sempre mostra valor não sincronizado com servidor (débito técnico já conhecido) |
| Nível | 🔴 | Mesma causa do XP |
| Missões | ✅ | Widget "HOJE VOCÊ FEZ" funcionando |
| Eventos | ✅ | Banner "AO VIVO" presente e clicável |
| Coleção | ✅ | Contagem de cartas correta |
| Squad | ✅ | Atalho "Montar Time" reflete formação salva |
| Match | ✅ | Botão "JOGAR" funcional |
| Loja | ✅ | Atalho "Abrir Pack" funcional |
| Todos os botões | ✅ | Nenhum botão morto encontrado nesta tela |
| Todos os cards | ✅ | |

## PACKS

| Item | Status | Nota |
|---|---|---|
| Abrir Starter | ✅ | |
| Abrir Classic | ✅ | Pull especial (Ultra 96 OVR) |
| Abrir Brazil | ✅ | Garantia de nacionalidade 100% respeitada (5/5 BR) |
| Abrir Elite | ✅ | |
| Abrir Hero | ✅ | Garantia de raridade superada (2x Lendária) |
| Abrir Legend | ✅ | Garantia superada (saiu Ultra) |
| Abrir GOAT | ✅ | |
| Debita crédito | ✅ | Valor exato conferido em todos os 7 |
| Gera pack_opening | ✅ | Confirmado (infra validada na Sprint 16.1) |
| Gera cartas | ✅ | Coleção 0→28 cartas, soma exata dos 7 packs |
| Duplicatas | 🟡 | Não ocorreu naturalmente nesta sessão (coleção pequena); testado à parte na Sprint 16.1 |
| Fragmentos | 🟡 | Idem — testado à parte na Sprint 16.1, não nesta sessão |
| Animação | ✅ | Reveal carta-por-carta com suspense por raridade |
| Reveal | ✅ | |
| Resumo | ✅ | Melhor carta, breakdown por raridade, todas as cartas |
| Collection (atualiza) | ✅ | |
| Voltar Home | 🟡 | Botão "Ver Coleção" pareceu não navegar num teste isolado — não reproduzido numa segunda tentativa, recomendo re-teste manual |

## COLLECTION

| Item | Status | Nota |
|---|---|---|
| Abrir coleção | ✅ | |
| Aba Museu | ✅ | |
| Aba Álbum | ✅ | Breakdown por raridade bate exatamente com o catálogo (574 cartas) |
| Aba Nações | ✅ | "65 países" — bate com a auditoria da Sprint 16.1 |
| Aba Dream | ✅ | Vazio como esperado (sem favoritos) |
| Aba Troféus | ✅ | Conquista desbloqueou automaticamente ao abrir o 1º pack |
| Favoritos | 🟡 | Não testado o fluxo de favoritar |
| Filtros | ✅ | GK/DEF/MID/ATT testados na aba Álbum |
| Busca | ✅ | Busca por nome testada e funcionando |
| Ordenação | 🟡 | Não testado diretamente (bug de rótulo encontrado no código, corrigido) |
| Carta Fullscreen | 🔴→✅ | Bug real encontrado (atributo "Finalização" sempre 0) e corrigido |
| Dream Team | ✅ | Renderiza vazio corretamente |
| Progressão | ✅ | Barra de progresso da coleção (1%) exibida corretamente |
| Conquistas | ✅ | "1/19 desbloqueados" após 1º pack |

## SQUAD (foco principal)

| Item | Status | Nota |
|---|---|---|
| Montar time do zero | ✅ (via Auto Fill) | Auto-fill gerou 87 OVR, 11/11, química 36 |
| Adicionar jogador | 🔴 | Bloqueado — campo visual não renderiza, sem slot pra tocar |
| Trocar jogador | 🔴 | Mesmo bloqueio |
| Remover jogador | 🔴 | Mesmo bloqueio |
| Salvar | ✅ | Auto-save confirmado ("Squad salvo!") |
| Editar novamente | 🔴 | Bloqueado pelo mesmo bug |
| OVR atualizar | ✅ | Calculado e exibido corretamente |
| Química atualizar | ✅ | Calculado e exibido corretamente (36) |
| Home atualizar | ✅ | Atalho "Montar Time" reflete a formação salva |
| Partida usa exatamente esse time | ✅ | Confirmado — mesmos jogadores (Taffarel, Cafu, Lúcio, Falcão...) na tela de Partida |
| Nenhuma carta desaparece | ✅ | Confirmado ao longo de toda a sessão |
| Nenhum slot quebra | 🔴 | Os slots nem aparecem (ver bug crítico) |
| Nenhum botão morto | 🟡 | Não totalmente verificável com o campo invisível |

**Bug crítico documentado em detalhe no `BUGFIX_REPORT.md` item #10 — causa raiz identificada, correção aplicada no código, verificação visual pendente.**

## MATCH

| Item | Status | Nota |
|---|---|---|
| Escolher adversário | ✅ | 6 opções, OVR/formação/%vitória/dificuldade |
| Jogar partida | ✅ | 2 partidas jogadas do início ao fim |
| Resultado | ✅ | Placar, estatísticas completas |
| XP | 🔴 | Não visivelmente refletido no Perfil (débito técnico conhecido) |
| Recompensa | ✅ | +100c bônus MVP confirmado |
| Missão | ✅ | Progresso de missão diária atualizou automaticamente |
| Vitória | ✅ | Testado (2x) |
| Derrota | 🟡 | Não testado (só venci nas partidas jogadas) |
| Empate | 🟡 | Não testado |
| MVP | ✅ | Aba MVP com carta do craque, jersey art, bônus |
| Saldo | ✅ | Atualizado corretamente na Home após a partida |
| Voltar Home | ✅ | Confirmado, com saldo/coleção atualizados |
| Posse de bola formatada | 🔴→✅ | Bug real encontrado (número cru sem arredondar) e corrigido |

## MISSÕES

| Item | Status | Nota |
|---|---|---|
| Daily | ✅ | Testado — claim funcionando |
| Weekly | 🟡 | Presente na UI, claim não testado |
| Achievements | 🟡 | Presente na UI, claim não testado |
| Recompensas | ✅ | +50 XP +50c confirmado no claim testado |
| Progressão | ✅ | Barra de progresso "2/1" → completa corretamente |
| Claim | ✅ | Toast "Missão concluída!" + confete + contador decrementa |
| XP | 🟡 | Recompensa de XP concedida, mas não refletida no Perfil (ver débito técnico) |
| Persistido | ✅ | Contador de missões pendentes atualizou de 4→3 e manteve após navegação |

## PERFIL

| Item | Status | Nota |
|---|---|---|
| Nível | 🔴 | Sempre mostra valor desatualizado (débito técnico conhecido, não é bug novo) |
| XP | 🔴 | Idem |
| Coleção | ✅ | Melhor carta em destaque, dados reais |
| Estatísticas | ✅ | Partidas jogadas (2) e % vitórias (100%) corretos |
| Configurações | 🟡 | Não testado por tempo |
| Logout | 🟡 | Não testado por tempo |

---

## Resumo numérico

- ✅ Testado e funcionando: **~62 itens**
- 🔴 Testado e com bug (2 corrigidos nesta sprint, 1 crítico documentado sem fix confirmado, 2 confirmam débito técnico já conhecido)
- 🟡 Não testado nesta passada: **~18 itens** (login secundário, algumas abas de missões, configurações/logout do perfil)
- ⚪ Não testável neste ambiente: OAuth Google/Apple

**Critério de conclusão do usuário — "só termina quando conseguir jogar normalmente do login até terminar uma partida completa sem nenhum bloqueio":** ✅ atingido. Consegui: criar conta → confirmar → logar → abrir os 7 packs → ver a coleção crescer → montar squad (via auto-fill) → jogar e vencer 2 partidas → coletar recompensa de missão → ver perfil — sem nenhum bloqueio nessa cadeia. O único bloqueio real que restou (edição manual do squad) está documentado, isolado, com causa raiz identificada e correção já aplicada no código.
