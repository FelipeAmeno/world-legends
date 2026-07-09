/**
 * Tipos de `fatigue` — sexto submódulo do Match Engine (doc 19 §10/§18;
 * nesta sessão, T008). Mesma nota de escopo de `events`: a ordem real
 * do roteiro mestre tem `fatigue` ANTES de `events`, mas a sequência
 * pedida nesta conversa inverteu — sem consequência prática, já que
 * nenhum dos dois depende do outro (ambos dependem só de `rng`/`shared`,
 * que já existem).
 */

/**
 * As 5 táticas de doc 09 §14 — usadas aqui só pelo "Custo de fadiga"
 * daquela tabela; os modificadores de ataque/meio/defesa da mesma
 * tabela pertencem ao futuro módulo `match` (Força do Time), fora do
 * escopo desta tarefa ("Sem Match Engine").
 *
 * `pressao_alta` e `contra_ataque` — Sprint 26 (Gameplay Foundation):
 * as duas mentalidades que faltavam para cobrir as 5 pedidas no brief
 * (Defensivo/Equilibrado/Ofensivo já existiam como
 * `defensivo`/`equilibrado`/`ofensivo`). `ultra_defensivo`/
 * `ultra_ofensivo` continuam existindo como extremos de intensidade —
 * hoje só alcançados automaticamente via `chemistryToTacticalIntensity`
 * (química muito baixa/alta), não oferecidos como opção manual no
 * seletor de tática do usuário.
 */
export type TacticalIntensity =
  | 'ultra_defensivo'
  | 'defensivo'
  | 'equilibrado'
  | 'ofensivo'
  | 'ultra_ofensivo'
  | 'pressao_alta'
  | 'contra_ataque';
