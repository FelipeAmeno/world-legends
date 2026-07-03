/**
 * Contrato de tema de raridade — T026.1
 *
 * Cada raridade define um conjunto de tokens visuais que direcionam
 * 100% da aparência da carta. Nenhuma lógica de negócio é tocada.
 */

export type RarityTheme = Readonly<{
  /** Identificador canônico (doc 10 §2). */
  readonly code: string;

  /** Nome exibido ao usuário. */
  readonly label: string;

  /** Abreviação para badge (máx 4 chars). */
  readonly badgeLabel: string;

  // ── Cores ───────────────────────────────────────────────────────────────
  readonly colors: Readonly<{
    /** Cor primária (glow, acento, OVR). */
    readonly primary: string;
    /** Cor secundária (bordas, gradiente). */
    readonly secondary: string;
    /** Cor de texto sobre fundo escuro. */
    readonly text: string;
    /** Fundo do painel de arte. */
    readonly artBg: string;
    /** Fundo do footer da carta. */
    readonly footerBg: string;
  }>;

  // ── Borda ───────────────────────────────────────────────────────────────
  readonly border: Readonly<{
    readonly color: string;
    readonly width: number;           // px
    readonly radius: number;          // px
    /** Gradiente para bordas especiais (CSS gradient string ou null). */
    readonly gradient: string | null;
  }>;

  // ── Glow / sombra ───────────────────────────────────────────────────────
  readonly glow: Readonly<{
    readonly color: string;
    readonly spreadPx: number;
    /** Glow extra ao hover. */
    readonly hoverSpreadPx: number;
    /** true = glow pulsa (animation). */
    readonly pulsating: boolean;
    /** Duração da pulsação em segundos. */
    readonly pulseDurationS: number;
  }>;

  // ── Partículas ───────────────────────────────────────────────────────────
  readonly particles: Readonly<{
    readonly enabled: boolean;
    readonly color: string;
    readonly count: number;
    readonly sizePx: number;
    readonly speedS: number;
  }>;

  // ── Shimmer / efeito de reflexo ──────────────────────────────────────────
  readonly shimmer: Readonly<{
    readonly enabled: boolean;
    /** 'gold' | 'holographic' | 'cyan' | 'none' */
    readonly type: 'gold' | 'holographic' | 'cyan' | 'fire' | 'none';
    readonly opacity: number;
    readonly durationS: number;
  }>;

  // ── Badges extras ────────────────────────────────────────────────────────
  readonly extras: Readonly<{
    /** Exibir badge de numeração (ex: GOAT #001). */
    readonly serialNumber: boolean;
    /** Exibir badge de edição especial (ex: "Final 1958"). */
    readonly editionBadge: boolean;
    /** Estrelas de prestígio (0–5). */
    readonly stars: 0 | 1 | 2 | 3 | 4 | 5;
    /** Decoração de canto (ornato SVG). */
    readonly cornerDecoration: boolean;
    /** Assinatura histórica no rodapé. */
    readonly historicalSignature: boolean;
  }>;
}>;
