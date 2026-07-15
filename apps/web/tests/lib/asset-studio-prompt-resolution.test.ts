import { resolvePromptTemplateContent } from '@/lib/asset-studio/prompt-template';
import { describe, expect, it } from 'vitest';

describe('Sprint 43B — resolvePromptTemplateContent (nunca aceita prompt bruto do cliente)', () => {
  it('43. substitui todos os placeholders conhecidos de forma determinística', () => {
    const result = resolvePromptTemplateContent(
      'Player: {{DISPLAY_NAME}}, rarity: {{RARITY}}',
      ['DISPLAY_NAME', 'RARITY'],
      { DISPLAY_NAME: 'fixture-player', RARITY: 'legendary' },
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.text).toBe('Player: fixture-player, rarity: legendary');
  });

  it('44. placeholder obrigatório ausente/vazio falha e reporta quais faltam', () => {
    const result = resolvePromptTemplateContent('Player: {{DISPLAY_NAME}}', ['DISPLAY_NAME'], {
      DISPLAY_NAME: '   ',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.missingPlaceholders).toEqual(['DISPLAY_NAME']);
  });

  it('45. mesmo template + mesmos valores produz sempre o mesmo texto (determinístico, sem timestamp/random)', () => {
    const args = ['Card: {{ARTWORK_PRESET_ID}}', ['ARTWORK_PRESET_ID'], { ARTWORK_PRESET_ID: 'wl-001' }] as const;
    const r1 = resolvePromptTemplateContent(...args);
    const r2 = resolvePromptTemplateContent(...args);
    expect(r1).toEqual(r2);
  });

  it('placeholder não requerido e sem valor correspondente é deixado intacto no texto final', () => {
    const result = resolvePromptTemplateContent('{{DISPLAY_NAME}} — {{UNKNOWN_TOKEN}}', ['DISPLAY_NAME'], {
      DISPLAY_NAME: 'fixture-player',
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.text).toBe('fixture-player — {{UNKNOWN_TOKEN}}');
  });
});
