/**
 * Contrato de publicação de Eventos de Domínio (doc 18 §3.1/§15).
 *
 * "Uma função `publicar(evento)` e um tipo `DomainEvent`, sem lógica de
 * negócio nenhuma ali." (doc 18 §3.1)
 *
 * Todo package de domínio que emite eventos usa `EventPublisher` injetado
 * como parâmetro — nunca um singleton global. A ligação entre publicador
 * e assinante é feita exclusivamente em `apps/*` (wiring), nunca dentro
 * de um package de domínio (doc 18 §3.1).
 *
 * `noopPublisher` é o default — domínio funciona sem subscriber.
 * Testes injetam um array collector para verificar os eventos emitidos.
 */

export type DomainEvent<TType extends string = string, TPayload = unknown> = Readonly<{
  readonly eventType: TType;
  readonly occurredAt: Date;
  readonly payload: TPayload;
}>;

/** Assinatura de função de publicação — sem lógica de roteamento. */
export type EventPublisher = (event: DomainEvent) => void;

/** Publisher padrão — no-op. Substituído em apps/* via injeção. */
export const noopPublisher: EventPublisher = (_event) => {
  /* intencional — ver doc 18 §3.1 */
};

/** Fábrica que cria um DomainEvent com timestamp de agora. */
export function createDomainEvent<TType extends string, TPayload>(
  eventType: TType,
  payload: TPayload,
): DomainEvent<TType, TPayload> {
  return Object.freeze({
    eventType,
    occurredAt: new Date(),
    payload: Object.freeze(payload) as TPayload,
  });
}

/**
 * Cria um publisher que coleta eventos em um array.
 * Usado em testes para verificar quais eventos foram publicados.
 * @example
 *   const { publisher, events } = createCollectorPublisher();
 *   depositCredits({ ..., publisher });
 *   expect(events[0]?.eventType).toBe('economy_credits_earned');
 */
export function createCollectorPublisher(): {
  publisher: EventPublisher;
  events: DomainEvent[];
} {
  const events: DomainEvent[] = [];
  const publisher: EventPublisher = (event) => {
    events.push(event);
  };
  return { publisher, events };
}
