'use client';

/**
 * components/cards/layers/ImageLayer.tsx — Sprint 18.5 (Card Rendering Engine)
 *
 * Primitiva compartilhada por toda camada de carta que pode virar imagem.
 * Tenta carregar `src`; se não existir (404) ou não for passado, renderiza
 * `fallback` (o visual procedural CSS/SVG de hoje) sem nenhuma diferença
 * visual. Isso é o que permite preparar o motor sem ter arte nenhuma ainda:
 * basta colocar um PNG no caminho certo depois que ele passa a aparecer.
 */

import { memo, useState } from 'react';

type Props = {
  src: string | undefined;
  alt: string;
  fallback: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  /** Frames são pré-carregados (poucos arquivos, reusados em toda carta). Todo o resto é lazy. */
  eager?: boolean;
};

export const ImageLayer = memo(function ImageLayer({
  src,
  alt,
  fallback,
  className,
  style,
  eager = false,
}: Props) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return <>{fallback}</>;
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      loading={eager ? 'eager' : 'lazy'}
      fetchPriority={eager ? 'high' : 'low'}
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
});
