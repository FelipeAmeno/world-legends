/**
 * components/cards/CardParticles.tsx — Sprint 18.7 (Premium Card Engine)
 *
 * Partículas procedurais, 100% CSS (sem canvas, sem biblioteca) — item 6
 * do brief. Renderizada como fallback do `CardParticleLayer`
 * (asset-capable desde a Sprint 18.9) pra legendary/ultra(GOAT)/
 * world_cup_hero (mesmo critério de `isLegendaryPlus` já usado pra
 * respiração e holo), pra não pesar em telas com muitos cards comuns
 * (Coleção).
 *
 * Posições/atrasos são determinísticos (derivados do cardId, não de
 * Math.random) — evita hydration mismatch entre server e client e mantém
 * o resultado estável entre renders do mesmo card.
 *
 * Sprint 18.9: `speedMultiplier` (preset de animação por raridade, ver
 * `card-animation-presets.ts`) escala a duração de flutuação/brilho.
 * `confetti` (só world_cup_hero, "Confetti Sparkle") troca a cor única de
 * raridade por uma paleta multicolorida.
 */

const CONFETTI_PALETTE = ['#FFD700', '#FF6B6B', '#4ECDC4', '#A78BFA', '#F472B6', '#60A5FA'];

type Props = {
  cardId: string;
  accent: string;
  count?: number;
  speedMultiplier?: number;
  confetti?: boolean;
};

function seededFraction(seed: string, salt: number): number {
  let h = salt * 2654435761;
  for (let i = 0; i < seed.length; i++) {
    h = (h ^ seed.charCodeAt(i)) * 16777619;
    h >>>= 0;
  }
  return (h % 1000) / 1000;
}

export function CardParticles({
  cardId,
  accent,
  count = 7,
  speedMultiplier = 1,
  confetti = false,
}: Props) {
  const particles = Array.from({ length: count }, (_, i) => {
    const left = 10 + seededFraction(cardId, i * 3 + 1) * 80;
    const top = 15 + seededFraction(cardId, i * 3 + 2) * 70;
    const size = 1.5 + seededFraction(cardId, i * 3 + 3) * 2;
    const floatDelay = seededFraction(cardId, i * 5 + 1) * 3.5;
    const twinkleDelay = seededFraction(cardId, i * 5 + 2) * 2.2;
    const floatDuration = (2.8 + seededFraction(cardId, i * 5 + 3) * 2) * speedMultiplier;
    const color = confetti
      ? CONFETTI_PALETTE[Math.floor(seededFraction(cardId, i * 7 + 1) * CONFETTI_PALETTE.length)]
      : accent;

    return (
      <span
        key={`${cardId}-${left.toFixed(2)}-${top.toFixed(2)}`}
        className="card-particle"
        style={{
          left: `${left}%`,
          top: `${top}%`,
          width: size,
          height: size,
          color,
          opacity: 0.7,
          animationDelay: `${floatDelay}s, ${twinkleDelay}s`,
          animationDuration: `${floatDuration}s, ${2.2 * speedMultiplier}s`,
        }}
      />
    );
  });

  return <div className="card-particle-field">{particles}</div>;
}
