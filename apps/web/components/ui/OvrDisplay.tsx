/**
 * OvrDisplay — o elemento assinatura do World Legends.
 * OVR exibido como um placar de estádio: condensado, imponente, dourado.
 */
type Props = {
  value: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  colored?: boolean;
};

const SIZE_CLASS = {
  sm: 'text-3xl',
  md: 'text-4xl',
  lg: 'text-5xl',
  xl: 'text-6xl',
};

export function OvrDisplay({ value, size = 'md', colored = true }: Props) {
  return (
    <span
      className={`font-display leading-none ${SIZE_CLASS[size]} ${colored ? 'gold-text' : 'text-parchment'}`}
    >
      {value}
    </span>
  );
}
