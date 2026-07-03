import { RARITY_VISUAL } from '@/lib/collection-data';
import type { RarityCode } from '@world-legends/types';

type Props = {
  code: RarityCode;
  label: string;
  size?: 'xs' | 'sm' | 'md';
  showDot?: boolean;
};

export function RarityBadge({ code, label, size = 'sm', showDot = false }: Props) {
  const visual = RARITY_VISUAL[code];

  const padding = { xs: 'px-1.5 py-0.5', sm: 'px-2 py-0.5', md: 'px-3 py-1' }[size];
  const fontSize = { xs: 'text-[8px]', sm: 'text-[10px]', md: 'text-xs' }[size];

  return (
    <span
      className={[
        'inline-flex items-center gap-1 rounded-full font-bold uppercase tracking-wider border',
        padding,
        fontSize,
        visual.textClass,
        visual.borderClass,
        'bg-black/40',
      ].join(' ')}
    >
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full ${visual.textClass.replace('text-', 'bg-')}`} />
      )}
      {label}
    </span>
  );
}
