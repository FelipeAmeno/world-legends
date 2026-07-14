/**
 * lib/card-static/artwork-schema-v2.ts — Sprint 42B (Artwork Schema V2
 * Contract and Backward Compatibility)
 *
 * Validação pura (sem I/O) do contrato do Artwork Schema V2 — reaproveitada
 * por `scripts/cards/validate-card-assets.mts` (I/O real) E pelos testes
 * (fixtures em memória), mesmo padrão de `full-artwork.ts`
 * (`checkCardAspectRatio`/`checkArtworkResolution`): a regra mora num só
 * lugar, nunca duplicada entre script e teste.
 *
 * V1 (ausência de `artworkSchemaVersion`, ou valor `1` explícito) NUNCA
 * passa por essas checagens — o preset é válido exatamente como sempre
 * foi. Só presets com `artworkSchemaVersion === 2` são validados aqui;
 * qualquer outro valor (`3`, `0`, `"2"` string, etc.) é um erro de
 * versão desconhecida, tratado ANTES de decidir se é V1 ou V2.
 */

import type { Density, HudFieldsLayout } from './hud-layout';
import type { ArtworkSafeZone, ArtworkSafeZones, CardArtworkPreset } from './types';

// Sprint 42B — este módulo é importado tanto pelo app Next quanto por
// `scripts/cards/validate-card-assets.mts` (Node nativo via
// `--experimental-strip-types`, que resolve módulos diferente do
// bundler). Pra permanecer uma "folha" (só `import type`, nunca um
// import de runtime cruzando esse limite — mesmo espírito de
// `scripts/cards/_shared.mts` duplicar o shape do preset de propósito),
// a lógica de `resolveArtworkSchemaVersion` (um one-liner) é repetida
// aqui em vez de importada de `./types`.
function resolveArtworkSchemaVersion(
  preset: Pick<CardArtworkPreset, 'artworkSchemaVersion'> | null | undefined,
): 1 | 2 {
  return preset?.artworkSchemaVersion ?? 1;
}

export type ArtworkSchemaValidationResult = {
  errors: string[];
  warnings: string[];
};

const SIX_ATTRIBUTE_HUD_FIELDS = ['stats', 'statsTop', 'statsBottom'] as const;

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** `0 <= n <= 100` — mesma faixa normalizada de `HudZone`. */
function withinPercentBounds(n: number): boolean {
  return n >= 0 && n <= 100;
}

function validateSafeZone(
  label: string,
  zone: ArtworkSafeZone | undefined,
  errors: string[],
): void {
  if (!zone) {
    errors.push(`safeZones.${label} ausente — obrigatório em artworkSchemaVersion 2`);
    return;
  }
  const fields: Array<[string, unknown]> = [
    ['x', zone.x],
    ['y', zone.y],
    ['width', zone.width],
    ['height', zone.height],
  ];
  for (const [field, value] of fields) {
    if (!isFiniteNumber(value)) {
      errors.push(
        `safeZones.${label}.${field} não é um número finito (recebido: ${String(value)})`,
      );
      return;
    }
  }
  if (!withinPercentBounds(zone.x) || !withinPercentBounds(zone.y)) {
    errors.push(
      `safeZones.${label}: x/y fora dos limites normalizados 0-100 (x=${zone.x}, y=${zone.y})`,
    );
  }
  if (!withinPercentBounds(zone.width) || !withinPercentBounds(zone.height)) {
    errors.push(
      `safeZones.${label}: width/height fora dos limites normalizados 0-100 (width=${zone.width}, height=${zone.height})`,
    );
  }
  if (zone.width <= 0 || zone.height <= 0) {
    errors.push(
      `safeZones.${label}: dimensão zero ou negativa (width=${zone.width}, height=${zone.height})`,
    );
  }
}

function findSixAttributeFieldUsage(
  fields: Partial<HudFieldsLayout> | null | undefined,
): string | null {
  if (!fields) return null;
  for (const key of SIX_ATTRIBUTE_HUD_FIELDS) {
    if (fields[key]) return key;
  }
  return null;
}

/**
 * V2 nunca deve declarar as zonas de atributo legadas (`stats`/
 * `statsTop`/`statsBottom`) — a Sprint 42A já faz o renderer ignorá-las
 * incondicionalmente em qualquer densidade, mas um preset V2 que ainda
 * as declara está descrevendo um contrato que não existe mais; isso é
 * erro de validação, não só um no-op silencioso.
 */
function findLegacyAttributeZoneError(
  preset: Pick<CardArtworkPreset, 'hudLayout' | 'hudLayouts'>,
): string | null {
  const flatHit = findSixAttributeFieldUsage(preset.hudLayout);
  if (flatHit) {
    return `hudLayout.${flatHit} está presente — artworkSchemaVersion 2 não aceita zonas de atributo (6 atributos foram removidos da face da carta na Sprint 42A)`;
  }
  if (preset.hudLayouts) {
    for (const density of Object.keys(preset.hudLayouts) as Density[]) {
      const hit = findSixAttributeFieldUsage(preset.hudLayouts[density]);
      if (hit) {
        return `hudLayouts.${density}.${hit} está presente — artworkSchemaVersion 2 não aceita zonas de atributo (6 atributos foram removidos da face da carta na Sprint 42A)`;
      }
    }
  }
  return null;
}

/**
 * Valida o contrato do Artwork Schema V2 pra um preset. V1 (ausente ou
 * `1`) sempre retorna `{ errors: [], warnings: [] }` — nunca quebra
 * preset existente. Versão desconhecida (nem `1` nem `2`) é erro.
 */
export function validateArtworkSchema(
  preset: Pick<
    CardArtworkPreset,
    'id' | 'sourceType' | 'artworkSchemaVersion' | 'safeZones' | 'hudLayout' | 'hudLayouts'
  >,
): ArtworkSchemaValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const rawVersion = preset.artworkSchemaVersion;
  if (rawVersion !== undefined && rawVersion !== 1 && rawVersion !== 2) {
    errors.push(
      `[${preset.id}] artworkSchemaVersion desconhecido: ${JSON.stringify(rawVersion)} — só 1 ou 2 são suportados (ausente = 1)`,
    );
    return { errors, warnings };
  }

  const version = resolveArtworkSchemaVersion(preset);
  if (version === 1) {
    // V1 nunca passa pelas checagens de V2 — nenhum preset existente pode
    // ser quebrado por regras que só fazem sentido pro contrato novo.
    return { errors, warnings };
  }

  // Daqui pra baixo: artworkSchemaVersion === 2.
  if (preset.sourceType !== 'full-card-artwork') {
    errors.push(
      `[${preset.id}] artworkSchemaVersion 2 exige sourceType "full-card-artwork" (recebido: ${preset.sourceType ?? 'ausente (layered)'})`,
    );
  }

  if (!preset.safeZones) {
    errors.push(`[${preset.id}] artworkSchemaVersion 2 exige "safeZones" — ausente`);
  } else {
    validateSafeZone('upperLeftHudZone', preset.safeZones.upperLeftHudZone, errors);
    validateSafeZone('lowerIdentityZone', preset.safeZones.lowerIdentityZone, errors);
    if (preset.safeZones.countryOrTraitZone) {
      validateSafeZone('countryOrTraitZone', preset.safeZones.countryOrTraitZone, errors);
    }
  }

  const legacyZoneError = findLegacyAttributeZoneError(preset);
  if (legacyZoneError) {
    errors.push(`[${preset.id}] ${legacyZoneError}`);
  }

  return { errors, warnings };
}

export type { ArtworkSafeZone, ArtworkSafeZones };
