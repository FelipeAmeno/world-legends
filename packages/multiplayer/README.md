# `@world-legends/multiplayer`

**T018 concluída.** Liga privada, amistosos, sala de espera (lobby) e temporada de liga.

## Estrutura

```
src/
  types/types.ts              Todos os tipos do domínio: League, LeagueMember, LeagueRound,
                              LeagueMatch, FriendlyMatch, LobbyRoom, DraftSession, Standings
  private-leagues/league.ts   createLeague, joinLeague, scheduleRoundRobin,
                              generateStandings, calculatePoints, recordMatchResult
  rooms/room.ts               createRoom, joinRoom, setReady, startDraft, leaveRoom
  friendlies/friendly-match.ts createFriendlyMatch, recordFriendlyResult, getFriendlyOutcome
  seasons/season.ts           createLeagueSeason, openSeason, closeSeason
```

## Critérios de classificação (T018)

1. Pontos — V=3, E=1, D=0
2. Saldo de gols
3. Gols marcados
4. Confronto direto (pontos no jogo entre os empatados)
5. Ordem de entrada na liga (tiebreaker final)

## Invariantes documentados (doc 17 §15, doc 06)

- `maxMembers` nunca ultrapassado em `joinLeague`
- Liga privada nunca afeta Elo global (doc 06 §3.1)
- `scheduleRoundRobin` só executa com `status='pending'` e ≥2 membros
- `League` e todas as entidades internas são imutáveis
- `homeAndAway=true` duplica o calendário com home/away invertidos (doc 06 §2.3)

## 56 testes | 0 falhas
