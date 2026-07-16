/**
 * lib/asset-studio/visual-validation.ts — Sprint 43C (Asset Candidate
 * Validation and Human Approval)
 *
 * Contrato de validação VISUAL — a parte que exigiria uma IA de visão
 * (composição, texto legível, logos, identidade do jogador) e que
 * NENHUMA sprint até agora implementa de verdade. Isso não é um
 * placeholder vazio: é a interface que uma futura sprint vai
 * implementar contra um provedor real (nunca Gemini Vision nesta
 * sprint — não-objetivo explícito), mais um validador FAKE
 * determinístico usado por todo teste, mais o vocabulário fechado de
 * issue codes que um humano pode atribuir manualmente na revisão.
 *
 * Revisão humana (`service.ts::rejectCandidate`/`requestRevision`)
 * continua sendo o único mecanismo real de julgamento visual nesta
 * sprint — este arquivo só formaliza o contrato e o vocabulário.
 */

export const HUMAN_ISSUE_CODES = [
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
] as const;

export type HumanIssueCode = (typeof HUMAN_ISSUE_CODES)[number];

export function isValidHumanIssueCode(value: string): value is HumanIssueCode {
  return (HUMAN_ISSUE_CODES as readonly string[]).includes(value);
}

export type VisualValidationResult = {
  validatorName: string;
  checkedAt: string;
  passed: boolean;
  notes?: string;
};

/**
 * Contrato pra uma futura validação visual automatizada. Nenhuma
 * implementação real existe nesta sprint — só o fake (abaixo), usado
 * pra dev/teste, e a revisão humana manual (o mecanismo real hoje).
 */
export interface VisualValidator {
  readonly name: string;
  validate(candidateBytes: Uint8Array): Promise<VisualValidationResult>;
}

/**
 * Determinístico, sem IA, sem rede — sempre "passed: true" com uma nota
 * deixando claro que nada foi realmente inspecionado visualmente. Único
 * validador visual usado nesta sprint (e em todo teste).
 */
export class FakeVisualValidator implements VisualValidator {
  readonly name = 'fake-visual-validator';

  async validate(): Promise<VisualValidationResult> {
    return {
      validatorName: this.name,
      checkedAt: new Date().toISOString(),
      passed: true,
      notes:
        'fixture — nenhuma inspeção visual real foi realizada; aprovação depende de revisão humana',
    };
  }
}
