'use client';

/**
 * components/cards/layers/ImageLayer.tsx — Sprint 18.5/18.6 (Card Rendering Engine)
 *
 * Primitiva compartilhada por toda camada de carta que pode virar imagem.
 * Recebe um `ResolvedCardAsset` já resolvido pelo carregador único
 * (`lib/card-asset-loader.ts`) — se `asset` for `null` (chave não existe no
 * manifesto) ou o carregamento falhar (404 em runtime, defesa extra),
 * renderiza `fallback` (o visual procedural CSS/SVG de sempre) sem nenhuma
 * diferença visual. Quando `asset` existir, aplica scale/offset/rotation/
 * blendMode/intensity/blur vindos dos metadados do asset, e expõe a
 * velocidade (`animationSpeed`) como `--asset-speed` — camadas que animam
 * (Reflection/Particle) leem essa variável pra ajustar a duração do CSS
 * `@keyframes` que já usam (Sprint 18.9).
 */

import type { ResolvedCardAsset } from '@/lib/card-asset-loader';
import { memo, useState } from 'react';

type Props = {
  asset: ResolvedCardAsset | null;
  alt: string;
  fallback: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  /** Frames são pré-carregados (poucos arquivos, reusados em toda carta). Todo o resto é lazy. */
  eager?: boolean;
};

export const ImageLayer = memo(function ImageLayer({
  asset,
  alt,
  fallback,
  className,
  style,
  eager = false,
}: Props) {
  const [failed, setFailed] = useState(false);

  if (!asset || failed) {
    return <>{fallback}</>;
  }

  const transform = [
    asset.scale !== 1 ? `scale(${asset.scale})` : '',
    asset.offsetX !== 0 || asset.offsetY !== 0
      ? `translate(${asset.offsetX}px, ${asset.offsetY}px)`
      : '',
    asset.rotation !== 0 ? `rotate(${asset.rotation}deg)` : '',
  ]
    .filter(Boolean)
    .join(' ');

  const filter = [style?.filter, asset.blur > 0 ? `blur(${asset.blur}px)` : '']
    .filter(Boolean)
    .join(' ');

  return (
    <img
      src={asset.src}
      alt={alt}
      className={className}
      style={{
        ...style,
        ...(transform ? { transform } : {}),
        ...(asset.blendMode !== 'normal' ? { mixBlendMode: asset.blendMode } : {}),
        ...(asset.intensity !== 1 ? { opacity: asset.intensity } : {}),
        ...(filter ? { filter } : {}),
        ...({ '--asset-speed': asset.animationSpeed } as React.CSSProperties),
      }}
      loading={eager ? 'eager' : 'lazy'}
      fetchPriority={eager ? 'high' : 'low'}
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
});
