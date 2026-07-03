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
 */
export type TacticalIntensity =
  | 'ultra_defensivo'
  | 'defensivo'
  | 'equilibrado'
  | 'ofensivo'
  | 'ultra_ofensivo';
