# Lendas da Copa — Documentação de Arquitetura

> Jogo web/mobile de futebol histórico: cartas estilo FUT, draft estilo 7x0, simulação textual estilo Brasfoot, multiplayer com amigos, ranking por temporadas, packs e colecionismo.

Este diretório contém a documentação completa de arquitetura, modelagem de dados, fluxos de produto e regras de simulação **antes** de qualquer linha de código de produção. Cada arquivo é independente, mas referencia os demais.

## Sumário

| # | Arquivo | Conteúdo |
|---|---|---|
| 01 | `01-arquitetura-geral.md` | Visão de produto, decisões arquiteturais, infraestrutura, estrutura do monorepo Turborepo, roadmap de MVPs |
| 02 | `02-modelagem-banco-dados.md` | Modelo de dados completo (Postgres/Supabase), DDL, RLS, diagrama ER |
| 03 | `03-fluxos-telas.md` | Mapa de telas, fluxos de navegação, jornadas críticas do usuário |
| 04 | `04-sistema-cartas-raridade.md` | Raridades, cálculo de overall, edições especiais, probabilidades |
| 05 | `05-match-engine-simulacao.md` | Sistema de atributos, Match Engine, simulação minuto a minuto, lesões/cartões/substituições |
| 06 | `06-multiplayer-ranking-temporadas.md` | Draft com amigos, ligas privadas, realtime, ELO, temporadas |
| 07 | `07-packs-colecionismo.md` | Economia de packs, drop tables, álbum de coleção, mercado |
| 08 | `08-apis-seeds-jogadores.md` | Contrato de APIs, estratégia de seed de jogadores históricos, considerações legais |

## Decisões-chave já tomadas (resumo executivo)

1. **Monorepo Turborepo** com apps separados para `web` (Next.js 15, PWA) e pacotes compartilhados (`engine`, `db`, `ui`, `types`) — o Match Engine roda no servidor (Node/Edge) e é 100% determinístico via seed, permitindo replay e fairness em PvP assíncrono.
2. **Supabase** como Postgres + Auth + Realtime + Storage. RLS (Row Level Security) protege dados de coleção e partidas; nenhuma lógica de simulação roda no client além de leitura/exibição.
3. **Simulação assíncrona, não realtime tick-by-tick**: a partida é calculada inteira no servidor em uma chamada e entregue como uma timeline de eventos; o client apenas "reproduz" essa timeline com efeito de texto progressivo (estilo Brasfoot), o que simplifica drasticamente multiplayer e escalabilidade.
4. **Cartas são instâncias imutáveis** (snapshot de atributos no momento da posse), separadas do catálogo de jogadores (que pode evoluir/ser corrigido sem quebrar coleções existentes).
5. **Zustand** para estado de UI efêmero (formação sendo montada, abas ativas) e **TanStack Query** para todo estado de servidor (coleção, partidas, ranking) — sem duplicar fonte de verdade.
6. **Risco legal de direitos de imagem** de jogadores reais é endereçado no documento 08 — recomendamos revisão jurídica antes do lançamento comercial.

Comece pela leitura de `01-arquitetura-geral.md`.
