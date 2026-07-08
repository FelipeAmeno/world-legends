/**
 * lib/dev/card-screenshot.ts — Sprint 18.9 (Premium Card Engine — Final Assembly)
 *
 * Export Screenshot do Dev Tool, via `html-to-image` (única dependência nova
 * desta sprint, ~30KB, só importada por este arquivo — nenhum call site de
 * jogo importa isso, então não entra no bundle de nenhuma tela real).
 *
 * Por que não dependency-free: a abordagem inicial (serializar o DOM real
 * dentro de um `<foreignObject>` de SVG, rasterizar via `<canvas>`) é a
 * técnica padrão sem biblioteca, mas esbarra numa limitação de segurança do
 * Chrome sem solução: `drawImage()` de qualquer SVG cujo `<foreignObject>`
 * contenha um `<img>` marca o canvas como "tainted" e bloqueia
 * `toBlob()`/`toDataURL()` — mesmo com o `<img>` sendo uma `data:` URI 100%
 * local, sem nenhuma referência externa. Confirmado testando manualmente:
 * corrigir well-formedness XML (XMLSerializer), inlinear toda imagem como
 * data URI, e remover todo `url()` do CSS embutido (fontes) — o canvas
 * continua tainted. É uma decisão de segurança deliberada do Chromium (não
 * uma checagem de CORS de verdade), sem workaround conhecido sem biblioteca.
 * `html-to-image` evita o problema renderizando via uma abordagem diferente
 * internamente — não usa `<foreignObject>` pra essa etapa final.
 */

import { toPng } from 'html-to-image';

export async function exportCardScreenshot(cardEl: HTMLElement, filename: string): Promise<void> {
  const dataUrl = await toPng(cardEl, { pixelRatio: 2, cacheBust: true });
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.click();
}
