'use client';

import type { FormationKey } from '@/lib/squad-builder';

type Props = {
  current: FormationKey;
  options: FormationKey[];
  labels: Record<FormationKey, string>;
  onChange: (f: FormationKey) => void;
};

export function FormationSelect({ current, options, labels, onChange }: Props) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-[9px] text-white/25 uppercase tracking-widest mr-1">FORM</span>
      <div className="flex gap-0.5">
        {options.map((f) => (
          <button
            key={f}
            onClick={() => onChange(f)}
            className={[
              'px-2 py-1 rounded-lg text-[10px] font-bold transition-all border',
              current === f
                ? 'bg-gold/15 border-gold-dim text-gold'
                : 'bg-transparent border-white/10 text-white/30 hover:text-white/60 hover:border-white/20',
            ].join(' ')}
          >
            {labels[f]}
          </button>
        ))}
      </div>
    </div>
  );
}
