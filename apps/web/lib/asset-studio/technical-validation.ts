/**
 * lib/asset-studio/technical-validation.ts — Sprint 43C (Asset Candidate
 * Validation and Human Approval)
 *
 * Pipeline de validação TÉCNICA — determinístico, sem IA, sem rede,
 * re-executável a qualquer momento (botão "Rodar validação técnica" na
 * UI, não só no momento da geração). Nunca confia em metadata que o
 * provedor afirma — tudo é derivado dos bytes reais, igual
 * `image-validation.ts` (Sprint 43B), que esta função reusa como
 * primeira camada (MIME/assinatura/tamanho/decodificação) e estende com
 * as checagens específicas desta sprint.
 */

import sharp from 'sharp';
import { validateAndDeriveImageMetadata } from './image-validation';

export const VALIDATOR_VERSION = '2026-07-16.1';

/** 2:3 vertical — mesmo contrato do Artwork Schema V2. */
const ASPECT_RATIO_TARGET = 2 / 3;
const ASPECT_RATIO_TOLERANCE = 0.05;

/** Abaixo disto, a imagem é inutilizável (erro). Entre isto e o recomendado, só aviso. */
const MIN_WIDTH_HARD = 200;
const MIN_HEIGHT_HARD = 300;
/** Alvo de qualidade de produção — o fixture do fake provider (400x600) fica abaixo disto de propósito, gerando aviso (não erro), pra QA poder exercitar o caminho de warning sem precisar de imagem real. */
const RECOMMENDED_MIN_WIDTH = 800;
const RECOMMENDED_MIN_HEIGHT = 1200;

export type TechnicalValidationResult = {
  passed: boolean;
  warnings: string[];
  errors: string[];
  validatedAt: string;
  validatorVersion: string;
};

export type TechnicalValidationOutcome = {
  result: TechnicalValidationResult;
  width: number | null;
  height: number | null;
  fileSize: number | null;
  checksum: string | null;
  perceptualHash: string | null;
};

export type TechnicalValidationOptions = {
  claimedMimeType: string;
  /** Caminho de storage do candidate — validado ANTES de qualquer leitura de bytes (nunca aceita um caminho de produção). */
  storagePath: string;
  artworkSchemaVersion: number;
  /** Snapshot do prompt do attempt — usado só pras checagens mecânicas do Schema V2 (§ abaixo), nunca IA. */
  promptSnapshot: string | null;
  /** Injeção de dependência — nunca esta função consulta o repositório diretamente, mantém puro/testável. */
  isDuplicateChecksum: (checksum: string) => Promise<boolean>;
};

/** Average-hash (aHash) determinístico via `sharp` — real, sem IA, sem rede. Não é robusto contra transformações (crop/rotação), mas detecta duplicatas exatas/quase-exatas o suficiente pra um aviso informativo. */
async function computeAverageHash(bytes: Uint8Array): Promise<string> {
  const { data } = await sharp(Buffer.from(bytes))
    .resize(8, 8, { fit: 'fill' })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let sum = 0;
  for (const value of data) sum += value;
  const mean = sum / data.length;

  let bits = '';
  for (const value of data) bits += value >= mean ? '1' : '0';

  let hex = '';
  for (let i = 0; i < bits.length; i += 4) {
    hex += Number.parseInt(bits.slice(i, i + 4), 2).toString(16);
  }
  return hex;
}

/**
 * Regra 7 do brief: "For Schema V2 candidates, validate the mechanical
 * requirements that can be checked without AI" — menção de safe zone e
 * ausência de vocabulário de stat-box legado no prompt já resolvido são
 * checagens de TEXTO, mecânicas, nunca uma inspeção visual real da
 * imagem (isso é `visual-validation.ts`, ainda manual/fake nesta
 * sprint). Sempre AVISO, nunca erro — um prompt "imperfeito" não torna
 * a imagem gerada inutilizável por si só.
 */
function evaluateSchemaV2PromptHeuristics(promptSnapshot: string): string[] {
  const warnings: string[] = [];
  if (!/safe.?zone/i.test(promptSnapshot)) {
    warnings.push(
      'prompt-missing-safe-zone-mention: o prompt resolvido não menciona safe zone explicitamente',
    );
  }
  if (/attribute box|six.?attribute|stat box/i.test(promptSnapshot)) {
    warnings.push(
      'prompt-legacy-stat-region: o prompt resolvido menciona vocabulário de stat box legado (Schema V1)',
    );
  }
  return warnings;
}

/**
 * Roda a validação técnica completa contra os bytes reais de um
 * candidate. Sempre re-executável (não só no momento da geração) —
 * nunca confia em width/height/mimeType que o provedor afirmou, deriva
 * tudo de novo a cada chamada.
 */
export async function runTechnicalValidation(
  bytes: Uint8Array,
  options: TechnicalValidationOptions,
): Promise<TechnicalValidationOutcome> {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Regra "production path is rejected" — checado ANTES de qualquer decodificação de bytes.
  if (!options.storagePath.startsWith('asset-studio/')) {
    errors.push(
      `storage-path-not-staging: caminho "${options.storagePath}" fora de asset-studio/ — nunca aceito (produção nunca escrita por este pipeline)`,
    );
  }

  const baseline = await validateAndDeriveImageMetadata(bytes, options.claimedMimeType);
  if (!baseline.ok) {
    errors.push(`image-bytes-invalid: ${baseline.reason}`);
    return {
      result: {
        passed: false,
        warnings,
        errors,
        validatedAt: new Date().toISOString(),
        validatorVersion: VALIDATOR_VERSION,
      },
      width: null,
      height: null,
      fileSize: null,
      checksum: null,
      perceptualHash: null,
    };
  }

  const { width, height, fileSize, checksum } = baseline;

  if (height <= width) {
    errors.push(
      `not-vertical: ${width}x${height} — orientação vertical obrigatória (altura deve exceder largura)`,
    );
  } else {
    const ratio = width / height;
    if (Math.abs(ratio - ASPECT_RATIO_TARGET) > ASPECT_RATIO_TOLERANCE) {
      warnings.push(
        `aspect-ratio-off: proporção ${ratio.toFixed(3)} fora da tolerância de 2:3 (esperado ~${ASPECT_RATIO_TARGET.toFixed(3)})`,
      );
    }
  }

  if (width < MIN_WIDTH_HARD || height < MIN_HEIGHT_HARD) {
    errors.push(
      `resolution-too-low: ${width}x${height} abaixo do mínimo absoluto ${MIN_WIDTH_HARD}x${MIN_HEIGHT_HARD}`,
    );
  } else if (width < RECOMMENDED_MIN_WIDTH || height < RECOMMENDED_MIN_HEIGHT) {
    warnings.push(
      `resolution-below-recommended: ${width}x${height} abaixo do recomendado ${RECOMMENDED_MIN_WIDTH}x${RECOMMENDED_MIN_HEIGHT} (aceitável pra staging/QA, não pra produção)`,
    );
  }

  if (options.artworkSchemaVersion !== 2) {
    errors.push(
      `schema-version-unsupported: ${options.artworkSchemaVersion} (só o Schema V2 é suportado)`,
    );
  }

  if (await options.isDuplicateChecksum(checksum)) {
    warnings.push(
      'duplicate-checksum: já existe outro candidate com bytes idênticos (mesmo checksum)',
    );
  }

  if (options.promptSnapshot) {
    warnings.push(...evaluateSchemaV2PromptHeuristics(options.promptSnapshot));
  }

  const perceptualHash = await computeAverageHash(bytes);

  return {
    result: {
      passed: errors.length === 0,
      warnings,
      errors,
      validatedAt: new Date().toISOString(),
      validatorVersion: VALIDATOR_VERSION,
    },
    width,
    height,
    fileSize,
    checksum,
    perceptualHash,
  };
}
