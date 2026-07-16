import {
  FakeVisualValidator,
  HUMAN_ISSUE_CODES,
  isValidHumanIssueCode,
} from '@/lib/asset-studio/visual-validation';
import { describe, expect, it } from 'vitest';

describe('Sprint 43C — visual-validation (contrato futuro + validador fake determinístico, nunca Gemini Vision)', () => {
  it('117. o vocabulário de issue codes é fechado e inclui exatamente os 13 códigos do brief', () => {
    expect(HUMAN_ISSUE_CODES).toEqual([
      'readable-text',
      'stat-boxes',
      'logo-or-sponsor',
      'watermark',
      'incomplete-frame',
      'player-identity-problem',
      'upper-left-zone-blocked',
      'lower-identity-zone-blocked',
      'incorrect-aspect-ratio',
      'low-resolution',
      'malformed-image',
      'duplicate-artwork',
      'other',
    ]);
  });

  it('118. isValidHumanIssueCode aceita só códigos do vocabulário fechado', () => {
    expect(isValidHumanIssueCode('watermark')).toBe(true);
    expect(isValidHumanIssueCode('not-a-real-code')).toBe(false);
    expect(isValidHumanIssueCode('')).toBe(false);
  });

  it('119. FakeVisualValidator é determinístico, sempre passa, nunca chama rede/IA, e deixa claro que é fixture', async () => {
    const validator = new FakeVisualValidator();
    const result1 = await validator.validate();
    const result2 = await validator.validate();
    expect(result1.passed).toBe(true);
    expect(result2.passed).toBe(true);
    expect(result1.validatorName).toBe('fake-visual-validator');
    expect(result1.notes).toContain('fixture');
  });

  it('nenhuma chamada de rede real existe neste arquivo (só a palavra "Gemini" em comentário explicando o que NÃO é chamado)', async () => {
    const { readFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    const src = readFileSync(join(process.cwd(), 'lib/asset-studio/visual-validation.ts'), 'utf-8');
    expect(src).not.toMatch(/fetch\(|generativelanguage\.googleapis\.com/);
  });
});
