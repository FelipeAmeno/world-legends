/**
 * lib/asset-studio/providers/fake-image-provider.ts — Sprint 43B
 * (Gemini Nano Banana Image Provider)
 *
 * Provedor determinístico pra dev local e TODO teste — nunca chama uma
 * API externa, nunca tem custo. Gera PNGs reais e válidos via `sharp`
 * (mesma lib do pipeline de cards) — não bytes falsos/mockados —
 * pra que a validação de imagem (`image-validation.ts`) exercite o
 * caminho REAL de decodificação, não um atalho de teste.
 *
 * Regra da sprint: "Fake output must be visually and technically marked
 * as fixture/test-only" — cada variante é uma cor sólida distinta
 * (nunca confundível com arte de jogador aprovada) e
 * `providerMetadata.fixture` é sempre `true`.
 */

import sharp from 'sharp';
import type {
  GenerateArtworkRequest,
  GeneratedArtworkCandidate,
  ImageGenerationProvider,
} from '../image-provider';

const FIXTURE_WIDTH = 400;
const FIXTURE_HEIGHT = 600; // 2:3, mesma proporção do Artwork Schema V2

type FixtureColor = { r: number; g: number; b: number };
const FIXTURE_DEFAULT_COLOR: FixtureColor = { r: 201, g: 168, b: 76 }; // dourado

// Cores distintas por variante — puramente pra diferenciar visualmente
// no dev tool, nunca confundível com arte real.
const FIXTURE_COLORS: readonly FixtureColor[] = [
  FIXTURE_DEFAULT_COLOR,
  { r: 59, g: 130, b: 246 }, // azul
  { r: 236, g: 72, b: 153 }, // rosa
  { r: 16, g: 185, b: 129 }, // verde
];

function fixtureColorForVariant(variantIndex: number): FixtureColor {
  return FIXTURE_COLORS[variantIndex % FIXTURE_COLORS.length] ?? FIXTURE_DEFAULT_COLOR;
}

export class FakeImageProvider implements ImageGenerationProvider {
  readonly name = 'fake';

  async generate(request: GenerateArtworkRequest): Promise<GeneratedArtworkCandidate[]> {
    const candidates: GeneratedArtworkCandidate[] = [];
    for (let variantIndex = 0; variantIndex < request.requestedVariants; variantIndex++) {
      const color = fixtureColorForVariant(variantIndex);
      const bytes = await sharp({
        create: { width: FIXTURE_WIDTH, height: FIXTURE_HEIGHT, channels: 3, background: color },
      })
        .png()
        .toBuffer();
      candidates.push({
        variantIndex,
        bytes: new Uint8Array(bytes),
        mimeType: 'image/png',
        providerMetadata: { fixture: true, provider: 'fake', color },
      });
    }
    return candidates;
  }
}
