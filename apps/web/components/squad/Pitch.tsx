import type { PitchSlot } from '@/lib/mock-data';
import { CARD_MAP, RARITY_COLOR, getCardDisplayName } from '@/lib/mock-data';

type Props = {
  slots: PitchSlot[];
  className?: string;
};

export function Pitch({ slots, className = '' }: Props) {
  return (
    <div
      className={`pitch-bg relative w-full rounded-2xl border border-[#1a4a1a] overflow-hidden ${className}`}
      style={{ paddingBottom: '140%' }}
    >
      {/* Field markings SVG */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 140"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid meet"
      >
        <g stroke="rgba(255,255,255,0.12)" fill="none" strokeWidth="0.5">
          {/* Outer border */}
          <rect x="4" y="4" width="92" height="132" rx="1" />
          {/* Center line */}
          <line x1="4" y1="70" x2="96" y2="70" />
          {/* Center circle */}
          <circle cx="50" cy="70" r="10" />
          <circle cx="50" cy="70" r="0.8" fill="rgba(255,255,255,0.15)" stroke="none" />
          {/* Top penalty area */}
          <rect x="22" y="4" width="56" height="20" />
          {/* Top goal area */}
          <rect x="34" y="4" width="32" height="9" />
          {/* Top penalty spot */}
          <circle cx="50" cy="18" r="0.7" fill="rgba(255,255,255,0.2)" stroke="none" />
          {/* Bottom penalty area */}
          <rect x="22" y="116" width="56" height="20" />
          {/* Bottom goal area */}
          <rect x="34" y="127" width="32" height="9" />
          {/* Bottom penalty spot */}
          <circle cx="50" cy="122" r="0.7" fill="rgba(255,255,255,0.2)" stroke="none" />
          {/* Goals */}
          <rect x="38" y="1.5" width="24" height="3" stroke="rgba(255,255,255,0.2)" />
          <rect x="38" y="135.5" width="24" height="3" stroke="rgba(255,255,255,0.2)" />
        </g>
      </svg>

      {/* Player nodes */}
      {slots.map((slot) => {
        const card = CARD_MAP.get(slot.cardId);
        if (!card) return null;
        const colorClass = RARITY_COLOR[card.rarity].split(' ')[0];
        const displayName = getCardDisplayName(card);

        return (
          <div
            key={slot.slotId}
            className="player-node"
            style={{
              top: `${slot.top}%`,
              left: `${slot.left}%`,
            }}
          >
            {/* Circle with OVR */}
            <div
              className={[
                'w-9 h-9 rounded-full border-2 flex items-center justify-center mx-auto',
                'bg-obsidian/90 backdrop-blur-sm',
                colorClass === 'text-amber-400'
                  ? 'border-amber-500 shadow-[0_0_8px_rgba(201,168,76,0.5)]'
                  : colorClass === 'text-pink-400'
                    ? 'border-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.5)]'
                    : colorClass === 'text-blue-400'
                      ? 'border-blue-600'
                      : colorClass === 'text-purple-400'
                        ? 'border-purple-600'
                        : 'border-gray-600',
              ].join(' ')}
            >
              <span className={`font-display text-sm leading-none ${colorClass}`}>
                {card.overall}
              </span>
            </div>

            {/* Name label */}
            <div className="mt-0.5 px-1.5 py-0.5 rounded bg-obsidian/80 backdrop-blur-sm max-w-[64px] mx-auto">
              <p className="text-parchment text-[8px] font-semibold leading-tight truncate whitespace-nowrap">
                {displayName}
              </p>
              <p className="text-muted text-[7px] text-center">{slot.position}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
