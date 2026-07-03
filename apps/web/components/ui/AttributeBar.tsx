type Props = {
  label: string;
  value: number;
  max?: number;
};

export function AttributeBar({ label, value, max = 99 }: Props) {
  const pct = Math.round((value / max) * 100);

  const color =
    value >= 90
      ? 'from-amber-400 to-amber-600'
      : value >= 80
        ? 'from-emerald-400 to-emerald-600'
        : value >= 65
          ? 'from-blue-400 to-blue-600'
          : value >= 45
            ? 'from-gray-400 to-gray-600'
            : 'from-red-900 to-red-700';

  return (
    <div className="flex items-center gap-2">
      <span className="text-muted text-[10px] w-28 shrink-0 truncate">{label}</span>
      <div className="flex-1 h-1.5 bg-obsidian rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-parchment text-[11px] font-bold w-6 text-right shrink-0">{value}</span>
    </div>
  );
}
