# ALPHA_GAMEPLAY_REPORT.md

**Sprint 16.2 — Alpha Gameplay Validation**
**Data:** 2026-07-07
**Método:** jogo real, em navegador (Chromium headless via Playwright, já que `chromium-cli` não estava disponível neste ambiente — driver mínimo montado na hora), como um jogador de verdade jogaria: login → home → packs → coleção → squad → partida → missões → perfil. Nenhum atalho de "ler o código e assumir que funciona" — cada tela foi navegada, clicada e conferida por screenshot.

---

## Resumo executivo

O app **não conseguia nem subir localmente** no início desta sprint (`pnpm dev` crashava). Depois de corrigir isso, uma cascata de 7 outros arquivos com o mesmo bug de arquitetura ("use server" exportando tipos) impedia praticamente toda página de carregar. Depois de corrigir essa cascata, consegui jogar o loop completo — **login, abrir os 7 packs, ver a coleção crescer, montar squad (via auto-fill), jogar e vencer 2 partidas, coletar recompensa de missão, ver perfil** — com sucesso.

O único bloqueio real que restou é o **campo visual do Squad Builder não renderizar** (a lógica por trás funciona — auto-fill, OVR, química, save, tudo correto — só a visualização dos 11 jogadores no campo não aparece), o que impede editar o time manualmente hoje. Causa raiz identificada e correção aplicada no código, mas não confirmada visualmente por uma limitação de cache desta sessão (documentado em detalhe no `BUGFIX_REPORT.md`).

**Não marco esta sprint como "compilou, então terminou".** Consegui jogar do login até terminar partidas completas sem bloqueio — a única exceção documentada é a edição manual do squad, que fica como pendência clara para a próxima passada.

---

## O que foi jogado, na ordem

### 1. Login / Auth
- **Criar conta** (email/senha): testado, funciona — pede verificação de email corretamente (comportamento esperado do Supabase Auth).
- **Confirmação de email**: simulada via Admin API (não recebo emails reais neste ambiente) para poder testar o login de fato.
- **Login** (email/senha): testado, funciona.
- **Persistência de sessão**: testada implicitamente — a sessão sobreviveu a múltiplos reloads/restarts do servidor ao longo de toda a sessão de testes (várias horas).
- **Login Google / Apple**: **não testável neste ambiente** — exigem OAuth real com credenciais de um provedor externo, impossível de simular num navegador headless sem conta real. Não é um bug, é uma limitação do método de teste.
- **Recuperar senha / trocar senha**: **não testado** — não encontrei um fluxo óbvio de "esqueci minha senha" na tela de login durante a navegação; não investiguei o código para confirmar se existe. Fica como pendência.
- **Logout**: **não testado explicitamente** nesta sessão (não achei o botão durante a navegação do Perfil/Configurações no tempo disponível).
- **Sessão expirada / troca de dispositivo / cookies/tokens**: não testados — exigiriam manipular expiração de JWT ou simular dois navegadores distintos, fora do escopo prático desta passada.

### 2. Home
- Renderiza corretamente: saldo, XP/nível, missões do dia ("HOJE VOCÊ FEZ"), banner de evento ativo ("COPA DAS LENDAS"), atalhos para Packs/Squad/Coleção/Eventos.
- Todos os botões testados nesta tela levaram a algum lugar (nenhum botão morto encontrado).
- **Isso só foi possível depois de corrigir o bug crítico #2/#3** (ver `BUGFIX_REPORT.md`) — antes da correção, a Home nem compilava.

### 3. Packs — testado os 7, um por um
Starter, Classic, Brazil, Elite, Hero, Legend, GOAT — todos abertos de ponta a ponta:
- ✅ Débito de crédito exato (conferido: 500→425 após Starter+Classic, e assim por diante para os outros 5)
- ✅ `pack_openings` gravado (confirmado no relatório da Sprint 16.1, mesma infraestrutura)
- ✅ Cartas geradas e adicionadas à coleção (confirmado: coleção foi de 0→28 cartas, exatamente a soma de 5+5+5+5+3+3+2 dos 7 packs)
- ✅ Animação de reveal carta-por-carta funcionando, com suspense por raridade (mostra o badge "ELITE"/"LENDÁRIO"/"ULTRA RARO" antes de revelar a carta)
- ✅ Resumo pós-abertura ("PACK ABERTO" / "INCRÍVEL!" para pulls especiais) com melhor carta, breakdown por raridade, e todas as cartas listadas
- ✅ Garantias de raridade respeitadas ou superadas em todos os 7 (ex.: Legend Pack garantia "mínimo Lendária", saiu um Ultra — que é superior)
- ✅ Garantia de nacionalidade do Brazil Pack: as 5 cartas saíram todas brasileiras
- ✅ Duplicata → fragmentos: não ocorreu naturalmente nesta sessão (coleção ainda pequena), mas já foi verificado separadamente na Sprint 16.1 com teste dedicado
- ⚠️ Botão "Ver Coleção" no resumo do pack pareceu não navegar num teste isolado (não reproduzi de novo — pode ter sido falha de clique do driver de teste, não necessariamente um bug real; recomendo re-teste manual rápido)

### 4. Coleção
- Todas as 5 abas testadas: Museu, Álbum, Nações, Dream, Troféus — nenhuma quebrou.
- Álbum mostra breakdown por raridade batendo exatamente com o catálogo (574 cartas, mesmos números por raridade confirmados no seed da Sprint 16.1).
- Nações mostra "65 países" — bate exatamente com a auditoria da Sprint 16.1.
- Busca por nome testada e funcionando.
- Tela cheia de carta individual testada — **achei e corrigi um bug real aqui**: atributo "Finalização" sempre mostrava 0 (chave errada no código, `shooting` em vez de `finishing`).
- Troféus: conquista "Primeira Carta" desbloqueou automaticamente ao abrir o primeiro pack — sistema de achievements disparando corretamente.
- Dream Team: vazio como esperado (sem favoritos ainda) — não testei o fluxo de favoritar por falta de tempo.

### 5. Squad — foco principal desta sprint
- Auto-fill funcionou perfeitamente ao entrar na tela pela primeira vez: montou um time 87 OVR, 11/11, formação 4-3-3, química 36.
- Salvamento automático confirmado ("Squad salvo!").
- OVR, ATK/MID/DEF, Química: todos calculados e exibidos corretamente com dados reais (não mock).
- Trocar formação (4-3-3 / 4-4-2 / 4-2-3-1 / 3-5-2 / 5-3-2): botões presentes, não testei a troca em si por causa do bug abaixo.
- **Bug crítico encontrado**: o campo visual (11 jogadores em posição) não renderiza — fica um espaço vazio. Isso bloqueia o fluxo "tocar no slot → escolher jogador" que seria o principal jeito de editar o time manualmente. Diagnóstico completo e correção de código aplicada — ver `BUGFIX_REPORT.md` item #10.
- "Partida usa exatamente esse time": confirmado indiretamente — o Squad usado na tela de Partida (Taffarel, Cafu, Lúcio, Falcão...) bateu exatamente com os jogadores auto-preenchidos no Squad Builder.
- Nenhuma carta "desapareceu" da coleção durante os testes; nenhum crash ao trocar de aba.

### 6. Partida
- Escolha de adversário: 6 opções com OVR, formação, % de vitória e dificuldade — tela limpa, sem botão morto.
- Fluxo PRÉ-JOGO: contador de kickoff, lineups dos dois times, probabilidade de vitória/empate/derrota — tudo com dados reais.
- Joguei e venci 2 partidas (1x0 e 2x1) contra "Estrelas Clássicas".
- Resultado: placar, estatísticas (posse, finalizações, xG, faltas, escanteios, cartões), aba de MVP com a carta do craque da partida (jersey art, nome, bônus de crédito).
- Missão diária progrediu automaticamente ("Jogador Dedicado", "Vitória do Dia").
- Saldo de créditos e contagem de cartas na coleção atualizaram corretamente ao voltar pra Home.
- **Bug pequeno encontrado e corrigido**: posse de bola aparecia sem arredondar (`61.53846153846154%`).

### 7. Missões
- Aba Diárias: testei coletar uma recompensa ("Jogador Dedicado", +50 XP +50c) — animação de confete, toast "Missão concluída!", contador de pendentes decrementou (4→3), missão saiu do topo da lista.
- Abas Semanais e Conquistas: presentes com contadores, não testei coleta nelas por tempo.

### 8. Perfil
- Nome, avatar, nível, contagem de partidas (2, batendo com as 2 partidas jogadas), % de vitórias (100%, correto), melhor carta em destaque — tudo renderizando com dados reais.
- **Achado (não é bug novo)**: XP sempre mostra 0/100, mesmo depois de ganhar +50 XP de missão. Confirma um débito técnico já documentado antes desta sprint (XP só vive em localStorage, nunca foi persistido em `profiles`).
- Configurações/Logout: não cheguei a testar por tempo.

---

## Fluxos que ainda têm problema conhecido

| Fluxo | Status | Bloqueador |
|---|---|---|
| Squad — editar manualmente (trocar/adicionar/remover jogador tocando no campo) | 🔴 Bloqueado | Campo visual não renderiza (bug #10 no BUGFIX_REPORT) |
| Login — recuperar/trocar senha | 🟡 Não testado | Não localizado na navegação desta sessão |
| Login — Google/Apple OAuth | ⚪ Não testável | Exige credenciais reais de provedor externo |
| Login — logout, sessão expirada, troca de dispositivo | 🟡 Não testado | Falta de tempo nesta passada |
| Packs — botão "Ver Coleção" no resumo | 🟡 Suspeito, não confirmado | Um clique não navegou; não reproduzido numa segunda tentativa |
| Missões — Semanais/Conquistas (claim) | 🟡 Não testado | Falta de tempo |
| Perfil — Configurações/Logout | 🟡 Não testado | Falta de tempo |
| Squad — trocar formação, "Sugestões" | 🟡 Não testado | Depende do campo visual funcionando primeiro |

---

## Screenshots

Todos os screenshots tirados durante os testes ficaram salvos em:
`/private/tmp/claude-502/-Users-felipeameno-Projects-world-legends/f619895b-012e-44d8-90af-a6630be1ca53/scratchpad/browser/*.png`

(diretório temporário da sessão — não persiste; se quiser preservar algum como evidência, me avise quais copiar para o repositório.)

---

## Recomendação de prioridade para a próxima sprint

1. **Resolver o campo do Squad Builder** — é o único bloqueador real que sobrou no fluxo core "entrar → montar time → jogar", e a correção já está 90% pronta no código, só falta confirmação visual.
2. **Confirmar visualmente as correções desta sprint** com Chrome DevTools real (hard refresh) — várias correções foram feitas mas não confirmadas 100% ao vivo por uma limitação de cache desta sessão específica (ver nota no BUGFIX_REPORT).
3. **Testar os fluxos de login que ficaram de fora** (recuperar senha, logout, sessão expirada) — não por suspeita de bug, só porque não deu tempo.
4. **Decidir o destino da pasta `apps/web/src/`** (código órfão) antes que alguém edite ela por engano achando que é o app real.
