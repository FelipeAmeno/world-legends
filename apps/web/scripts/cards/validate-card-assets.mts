/**
 * scripts/cards/validate-card-assets.mts — Sprint 35B (Static Card Pipeline
 * Foundation)
 *
 * Lê todo preset em `public/assets/cards/metadata/*.json`, confere que
 * cada asset de canal referenciado existe em `source/<canal>/`, valida
 * dimensões (não corrompido, não vazio) e alpha (player precisa de
 * transparência — sem isso a composição vaza fundo opaco sobre o
 * background). Nunca falha o processo por warning — só por erro real
 * (asset referenciado que não existe em disco).
 *
 * Uso: node --experimental-strip-types scripts/cards/validate-card-assets.mts
 */
import { existsSync } from 'node:fs';
import sharp from 'sharp';
import { CHANNEL_DIR, loadPresets, sourcePath } from './_shared.mts';

/**
 * Ter um 4º canal não garante transparência de verdade — alguns exports
 * (ex.: preview de "transparência" de gerador de imagem) têm alpha=255
 * uniforme, com o padrão de xadrez QUEIMADO nos pixels RGB em vez de
 * recortado de verdade. Extraído à parte só pra manter `validatePreset`
 * simples o bastante pro limite de complexidade do linter.
 */
async function checkPlayerAlpha(
  preset: ReturnType<typeof loadPresets>[number],
  path: string,
  hasAlpha: boolean | undefined,
): Promise<string | null> {
  if (!hasAlpha) {
    return `[${preset.id}] player: sem canal alpha — a composição vai colar um retângulo opaco sobre o background em vez de recortar o jogador`;
  }
  const alphaStats = (await sharp(path).stats()).channels[3];
  if (alphaStats && alphaStats.min === 255 && alphaStats.max === 255) {
    return `[${preset.id}] player: canal alpha existe mas é uniformemente opaco (min=max=255) — provavelmente o "xadrez de transparência" está QUEIMADO nos pixels RGB, não é transparência de verdade. A composição vai mostrar o xadrez em vez de recortar o jogador. Precisa de um novo export com alpha real antes de ir pra produção.`;
  }
  return null;
}

async function validateChannel(
  preset: ReturnType<typeof loadPresets>[number],
  channel: keyof typeof CHANNEL_DIR,
  filename: string,
): Promise<{ errors: string[]; warnings: string[] }> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const dir = CHANNEL_DIR[channel];
  const path = sourcePath(dir, filename);

  if (!existsSync(path)) {
    errors.push(`[${preset.id}] ${channel}: arquivo não encontrado em source/${dir}/${filename}`);
    return { errors, warnings };
  }

  try {
    const meta = await sharp(path).metadata();
    if (!meta.width || !meta.height) {
      errors.push(`[${preset.id}] ${channel}: imagem sem dimensões válidas (${path})`);
      return { errors, warnings };
    }
    if (meta.width < 200 || meta.height < 200) {
      warnings.push(
        `[${preset.id}] ${channel}: resolução baixa (${meta.width}x${meta.height}) — pode ficar borrada no showcase (1200x1800)`,
      );
    }
    if (channel === 'player') {
      const alphaWarning = await checkPlayerAlpha(preset, path, meta.hasAlpha);
      if (alphaWarning) warnings.push(alphaWarning);
    }
  } catch (err) {
    errors.push(`[${preset.id}] ${channel}: falha ao ler imagem (${(err as Error).message})`);
  }

  return { errors, warnings };
}

async function validatePreset(preset: ReturnType<typeof loadPresets>[number]): Promise<{
  errors: string[];
  warnings: string[];
}> {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const [channel, filename] of Object.entries(preset.source) as Array<
    [keyof typeof CHANNEL_DIR, string | null]
  >) {
    if (!filename) continue; // canal ausente é válido — cai no fallback procedural
    const result = await validateChannel(preset, channel, filename);
    errors.push(...result.errors);
    warnings.push(...result.warnings);
  }

  if (!preset.source.background && !preset.source.player) {
    warnings.push(
      `[${preset.id}] nenhum canal real definido — build vai gerar só a partir de fallback (nada a compor)`,
    );
  }

  return { errors, warnings };
}

async function main() {
  const presets = loadPresets();
  if (presets.length === 0) {
    console.log('[cards:validate] nenhum preset encontrado em public/assets/cards/metadata/');
    return;
  }

  let totalErrors = 0;
  let totalWarnings = 0;

  for (const preset of presets) {
    const { errors, warnings } = await validatePreset(preset);
    for (const e of errors) console.error(`✗ ${e}`);
    for (const w of warnings) console.warn(`⚠ ${w}`);
    totalErrors += errors.length;
    totalWarnings += warnings.length;
  }

  console.log(
    `[cards:validate] ${presets.length} preset(s) verificado(s) — ${totalErrors} erro(s), ${totalWarnings} warning(s)`,
  );

  if (totalErrors > 0) process.exitCode = 1;
}

main();
