'use client';

import type { FormationKey } from '@/lib/squad-data';

type Props = {
  current: FormationKey;
  options: FormationKey[];
  labels: Record<FormationKey, string>;
  onChange: (f: FormationKey) => void;
};

export function FormationPicker({ current, options, labels, onChange }: Props) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="text-muted text-[10px] uppercase tracking-wider mr-1">Formação</span>
      {options.map((f) => (
        <button
          key={f}
          onClick={() => onChange(f)}
          className={[
            'px-3 py-1.5 rounded-lg text-xs font-bold transition-all border',
            current === f
              ? 'bg-gold-dim border-gold text-obsidian shadow-gold'
              : 'bg-surface border-border text-muted hover:text-parchment hover:border-gold-dim',
          ].join(' ')}
        >
          {labels[f]}
        </button>
      ))}
    </div>
  );
}
