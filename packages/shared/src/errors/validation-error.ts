/**
 * ValidationError — primeira das quatro categorias de erro definidas em
 * `docs/19-implementation-strategy-master.md`, §17. Representa uma
 * entrada malformada na fronteira, antes mesmo de alcançar um agregado de
 * domínio.
 *
 * Não foi pedido explicitamente na Tarefa T002, mas é a peça mínima
 * necessária para que `createPercentage`/`createSeed` tenham um tipo de
 * erro real para devolver via `Result`, em vez de um `string` genérico
 * sem estrutura. `DomainError`, `ApplicationError` e `InfraError` —
 * as outras três categorias da mesma hierarquia — não são criadas aqui:
 * cada uma só faz sentido a partir do package que primeiro precisar dela.
 *
 * Value Object: imutável, sem identidade.
 */
export type ValidationError = Readonly<{
  readonly kind: 'ValidationError';
  readonly message: string;
  readonly field?: string;
}>;

export function validationError(message: string, field?: string): ValidationError {
  if (field === undefined) {
    return Object.freeze({ kind: 'ValidationError', message });
  }
  return Object.freeze({ kind: 'ValidationError', message, field });
}
