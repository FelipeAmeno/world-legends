import { type ValidationError, validationError } from '@world-legends/shared';

export function validateAmount(amount: number): ValidationError | null {
  if (!Number.isInteger(amount) || amount <= 0) {
    return validationError(`amount deve ser inteiro positivo, recebido: ${amount}`, 'amount');
  }
  return null;
}

let _seq = 0;
export function makeEntryId(prefix: string): string {
  _seq += 1;
  return `${prefix}${Date.now()}-${_seq}`;
}
