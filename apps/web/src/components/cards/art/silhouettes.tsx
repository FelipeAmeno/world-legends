/**
 * Sistema de Silhuetas — T027 Premium Card Art System
 *
 * 12 poses base em SVG puro. Sem fotos, sem direito de imagem.
 * O jogador é reconhecido pela pose, não pelo rosto.
 *
 * Design principles:
 * - Silhueta de cor sólida com fill gradiente suave
 * - Linhas internas mínimas para dimensionalidade
 * - Proporções atléticas corretas
 * - Cada pose é imediatamente identificável pelo movimento
 */

export type SilhouettePose =
  | 'chute'
  | 'cabecio'
  | 'comemoracao'
  | 'cobranca_falta'
  | 'defesa'
  | 'carrinho'
  | 'drible'
  | 'passe'
  | 'voleio'
  | 'bicicleta'
  | 'corrida'
  | 'capitao';

export type SilhouetteProps = {
  pose: SilhouettePose;
  color: string;
  glow?: number;
  width?: number;
  height?: number;
  /** Animação de respiração aplicada via className */
  breathClassName?: string;
};

/** Mapa de silhuetas SVG por pose */
export const SILHOUETTE_SVG: Record<SilhouettePose, (color: string, glow?: number) => string> = {

  comemoracao: (c, g=14) => `<svg viewBox="0 0 120 220" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 0 ${g}px ${c})">
    <defs><linearGradient id="sg-co" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${c}"/><stop offset="100%" stop-color="${c}" stop-opacity=".7"/></linearGradient></defs>
    <ellipse cx="60" cy="216" rx="28" ry="5" fill="${c}" opacity=".18"/>
    <path d="M48 145 Q46 168 44 190 Q44 196 50 196 Q56 196 56 190 Q54 168 54 145Z" fill="url(#sg-co)"/>
    <path d="M68 145 Q72 165 74 182 Q76 188 82 186 Q86 184 84 178 Q80 162 72 145Z" fill="url(#sg-co)"/>
    <path d="M40 90 Q38 110 40 130 Q42 142 50 145 Q60 148 70 145 Q78 142 80 130 Q82 110 80 90 Q78 80 60 78 Q42 80 40 90Z" fill="url(#sg-co)"/>
    <path d="M42 95 Q28 82 16 72 Q10 66 12 60 Q14 54 20 56 Q30 62 44 78 Q46 82 44 90Z" fill="url(#sg-co)"/>
    <ellipse cx="13" cy="58" rx="7" ry="9" fill="url(#sg-co)" transform="rotate(-20,13,58)"/>
    <path d="M78 95 Q92 82 104 72 Q110 66 108 60 Q106 54 100 56 Q90 62 76 78 Q74 82 76 90Z" fill="url(#sg-co)"/>
    <ellipse cx="107" cy="58" rx="7" ry="9" fill="url(#sg-co)" transform="rotate(20,107,58)"/>
    <rect x="53" y="68" width="14" height="14" rx="6" fill="url(#sg-co)"/>
    <ellipse cx="60" cy="52" rx="20" ry="22" fill="url(#sg-co)" transform="rotate(-8,60,52)"/>
  </svg>`,

  cobranca_falta: (c, g=12) => `<svg viewBox="0 0 120 220" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 0 ${g}px ${c})">
    <defs><linearGradient id="sg-cf" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${c}"/><stop offset="100%" stop-color="${c}" stop-opacity=".65"/></linearGradient></defs>
    <ellipse cx="62" cy="216" rx="26" ry="5" fill="${c}" opacity=".15"/>
    <path d="M46 140 Q44 162 42 188 Q42 196 50 196 Q58 196 58 188 Q56 162 56 140Z" fill="url(#sg-cf)"/>
    <path d="M65 145 Q80 130 96 108 Q102 100 98 94 Q94 88 88 92 Q80 100 68 118 Q64 128 64 145Z" fill="url(#sg-cf)"/>
    <path d="M38 82 Q36 100 38 120 Q40 136 50 140 Q62 144 72 138 Q80 132 78 118 Q78 100 76 82 Q72 70 58 68 Q42 68 38 82Z" fill="url(#sg-cf)"/>
    <path d="M40 88 Q26 84 16 80 Q10 78 10 84 Q10 90 18 92 Q30 96 42 100Z" fill="url(#sg-cf)"/>
    <ellipse cx="10" cy="83" rx="6" ry="8" fill="url(#sg-cf)" transform="rotate(15,10,83)"/>
    <path d="M76 92 Q88 106 96 118 Q100 126 96 130 Q92 134 88 128 Q82 116 74 104Z" fill="url(#sg-cf)"/>
    <rect x="52" y="58" width="13" height="12" rx="5" fill="url(#sg-cf)" transform="rotate(-15,60,64)"/>
    <ellipse cx="56" cy="45" rx="19" ry="21" fill="url(#sg-cf)" transform="rotate(-15,56,45)"/>
    <circle cx="26" cy="194" r="14" fill="${c}" opacity=".3"/>
    <circle cx="26" cy="194" r="14" stroke="${c}" stroke-width="2" fill="none" opacity=".5"/>
  </svg>`,

  drible: (c, g=12) => `<svg viewBox="0 0 120 220" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 0 ${g}px ${c})">
    <defs><linearGradient id="sg-dr" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${c}"/><stop offset="100%" stop-color="${c}" stop-opacity=".62"/></linearGradient></defs>
    <ellipse cx="58" cy="216" rx="28" ry="5" fill="${c}" opacity=".12"/>
    <path d="M44 148 Q38 165 34 185 Q33 193 40 194 Q48 195 50 188 Q52 170 54 150Z" fill="url(#sg-dr)"/>
    <path d="M66 148 Q72 165 76 182 Q78 190 84 188 Q90 185 88 178 Q84 162 74 148Z" fill="url(#sg-dr)"/>
    <path d="M34 88 Q30 106 32 128 Q34 144 46 150 Q60 154 72 148 Q82 142 82 126 Q82 106 80 88 Q76 74 58 72 Q38 74 34 88Z" fill="url(#sg-dr)"/>
    <path d="M34 96 Q18 86 8 78 Q2 72 4 66 Q6 60 14 64 Q26 72 38 88Z" fill="url(#sg-dr)"/>
    <ellipse cx="4" cy="65" rx="7" ry="9" fill="url(#sg-dr)" transform="rotate(30,4,65)"/>
    <path d="M80 96 Q90 102 96 110 Q100 116 96 120 Q92 124 88 118 Q84 112 78 106Z" fill="url(#sg-dr)"/>
    <rect x="52" y="62" width="12" height="12" rx="5" fill="url(#sg-dr)" transform="rotate(-25,58,68)"/>
    <ellipse cx="52" cy="50" rx="18" ry="20" fill="url(#sg-dr)" transform="rotate(-25,52,50)"/>
    <circle cx="32" cy="190" r="12" fill="${c}" opacity=".38"/>
    <circle cx="32" cy="190" r="12" stroke="${c}" stroke-width="2" fill="none" opacity=".58"/>
  </svg>`,

  corrida: (c, g=11) => `<svg viewBox="0 0 120 220" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 0 ${g}px ${c})">
    <defs>
      <linearGradient id="sg-cr" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${c}"/><stop offset="100%" stop-color="${c}" stop-opacity=".58"/></linearGradient>
      <linearGradient id="sg-cr2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${c}"/><stop offset="40%" stop-color="#fff" stop-opacity=".08"/><stop offset="100%" stop-color="${c}" stop-opacity=".65"/></linearGradient>
    </defs>
    <ellipse cx="60" cy="216" rx="26" ry="5" fill="${c}" opacity=".12"/>
    <path d="M50 148 Q48 168 46 188 Q46 196 54 196 Q62 196 62 188 Q60 168 60 148Z" fill="url(#sg-cr)"/>
    <path d="M64 152 Q72 160 80 168 Q86 174 84 180 Q82 186 76 184 Q70 180 64 170 Q60 162 60 152Z" fill="url(#sg-cr)"/>
    <path d="M38 84 Q34 104 36 126 Q38 142 52 148 Q62 152 72 146 Q82 140 82 124 Q82 104 80 84 Q76 70 60 68 Q42 70 38 84Z" fill="url(#sg-cr2)"/>
    <path d="M38 92 Q22 82 12 74 Q6 68 8 62 Q10 56 18 60 Q30 68 42 86Z" fill="url(#sg-cr)"/>
    <ellipse cx="8" cy="61" rx="6" ry="8" fill="url(#sg-cr)" transform="rotate(20,8,61)"/>
    <path d="M80 92 Q96 98 106 102 Q112 104 112 110 Q112 116 106 114 Q96 110 80 106Z" fill="url(#sg-cr)"/>
    <rect x="54" y="58" width="12" height="12" rx="5" fill="url(#sg-cr)" transform="rotate(12,60,64)"/>
    <ellipse cx="63" cy="46" rx="19" ry="21" fill="url(#sg-cr)" transform="rotate(12,63,46)"/>
    <circle cx="88" cy="184" r="12" fill="${c}" opacity=".3"/>
    <circle cx="88" cy="184" r="12" stroke="${c}" stroke-width="1.5" fill="none" opacity=".5"/>
  </svg>`,

  capitao: (c, g=10) => `<svg viewBox="0 0 120 220" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 0 ${g}px ${c})">
    <defs><linearGradient id="sg-cap" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${c}"/><stop offset="100%" stop-color="${c}" stop-opacity=".7"/></linearGradient></defs>
    <ellipse cx="60" cy="216" rx="26" ry="5" fill="${c}" opacity=".18"/>
    <path d="M46 148 Q44 168 44 188 Q44 196 52 196 Q60 196 60 188 Q60 168 58 148Z" fill="url(#sg-cap)"/>
    <path d="M64 148 Q66 168 68 188 Q68 196 76 196 Q84 196 84 188 Q82 168 78 148Z" fill="url(#sg-cap)"/>
    <path d="M42 84 Q40 104 42 128 Q44 144 56 148 Q62 150 68 148 Q80 144 82 128 Q84 104 82 84 Q78 70 62 68 Q44 70 42 84Z" fill="url(#sg-cap)"/>
    <path d="M80 90 Q94 74 104 62 Q110 54 108 48 Q106 42 100 46 Q90 56 78 76 Q76 82 78 92Z" fill="url(#sg-cap)"/>
    <path d="M103 46 Q108 42 112 46 Q114 50 110 54 Q107 56 103 52Z" fill="url(#sg-cap)"/>
    <path d="M44 92 Q34 100 28 112 Q26 118 30 122 Q34 126 38 120 Q44 110 48 100Z" fill="url(#sg-cap)"/>
    <ellipse cx="28" cy="120" rx="6" ry="7" fill="url(#sg-cap)"/>
    <rect x="54" y="58" width="14" height="13" rx="6" fill="url(#sg-cap)"/>
    <ellipse cx="62" cy="43" rx="20" ry="22" fill="url(#sg-cap)" transform="rotate(5,62,43)"/>
    <rect x="38" y="104" width="12" height="8" rx="3" fill="${c}" opacity=".5" stroke="${c}" stroke-width="1.5"/>
  </svg>`,

  chute: (c, g=12) => `<svg viewBox="0 0 120 220" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 0 ${g}px ${c})">
    <defs><linearGradient id="sg-ch" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${c}"/><stop offset="100%" stop-color="${c}" stop-opacity=".65"/></linearGradient></defs>
    <ellipse cx="60" cy="215" rx="26" ry="5" fill="${c}" opacity=".16"/>
    <path d="M44 142 Q42 165 40 188 Q40 196 48 196 Q56 196 56 188 Q54 165 52 142Z" fill="url(#sg-ch)"/>
    <path d="M64 148 Q80 118 94 92 Q100 80 94 74 Q88 68 82 76 Q72 94 62 130 Q60 138 60 148Z" fill="url(#sg-ch)"/>
    <path d="M38 86 Q36 106 38 128 Q40 142 52 146 Q62 150 72 144 Q80 138 80 122 Q80 104 78 86 Q74 72 58 70 Q40 72 38 86Z" fill="url(#sg-ch)"/>
    <path d="M40 92 Q26 86 16 80 Q10 76 11 70 Q13 64 20 68 Q32 74 44 96Z" fill="url(#sg-ch)"/>
    <ellipse cx="11" cy="69" rx="6" ry="8" fill="url(#sg-ch)"/>
    <path d="M78 92 Q90 88 100 84 Q106 82 107 88 Q108 94 102 96 Q90 100 78 98Z" fill="url(#sg-ch)"/>
    <rect x="52" y="60" width="13" height="13" rx="6" fill="url(#sg-ch)" transform="rotate(-10,60,66)"/>
    <ellipse cx="56" cy="47" rx="19" ry="22" fill="url(#sg-ch)" transform="rotate(-10,56,47)"/>
  </svg>`,

  cabecio: (c, g=12) => `<svg viewBox="0 0 120 220" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 0 ${g}px ${c})">
    <defs><linearGradient id="sg-cb" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${c}"/><stop offset="100%" stop-color="${c}" stop-opacity=".65"/></linearGradient></defs>
    <ellipse cx="60" cy="215" rx="26" ry="5" fill="${c}" opacity=".15"/>
    <path d="M46 140 Q44 165 42 188 Q42 196 50 196 Q58 196 58 188 Q56 165 56 140Z" fill="url(#sg-cb)"/>
    <path d="M64 142 Q68 165 70 188 Q70 196 78 196 Q86 196 86 188 Q84 165 78 142Z" fill="url(#sg-cb)"/>
    <path d="M38 84 Q36 104 38 126 Q40 140 52 144 Q62 148 72 142 Q82 136 82 120 Q82 100 80 84 Q76 68 60 66 Q40 68 38 84Z" fill="url(#sg-cb)"/>
    <path d="M42 88 Q26 82 14 76 Q8 72 10 66 Q12 60 20 64 Q34 70 46 94Z" fill="url(#sg-cb)"/>
    <ellipse cx="10" cy="65" rx="6" ry="8" fill="url(#sg-cb)"/>
    <path d="M78 92 Q92 86 104 80 Q110 76 110 82 Q110 88 104 90 Q90 96 78 96Z" fill="url(#sg-cb)"/>
    <rect x="53" y="54" width="14" height="14" rx="6" fill="url(#sg-cb)" transform="rotate(15,60,61)"/>
    <ellipse cx="65" cy="42" rx="20" ry="22" fill="url(#sg-cb)" transform="rotate(18,65,42)"/>
    <circle cx="74" cy="22" r="14" fill="${c}" opacity=".22"/>
    <circle cx="74" cy="22" r="14" stroke="${c}" stroke-width="2" fill="none" opacity=".4"/>
  </svg>`,

  bicicleta: (c, g=14) => `<svg viewBox="0 0 120 220" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 0 ${g}px ${c})">
    <defs><linearGradient id="sg-bi" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${c}"/><stop offset="100%" stop-color="${c}" stop-opacity=".6"/></linearGradient></defs>
    <ellipse cx="60" cy="215" rx="24" ry="5" fill="${c}" opacity=".14"/>
    <!-- Jogador de costas, pernas em bicicleta -->
    <path d="M38 130 Q24 100 22 72 Q22 62 30 58 Q38 54 42 64 Q46 88 54 118Z" fill="url(#sg-bi)"/>
    <path d="M78 130 Q90 106 96 78 Q98 64 92 58 Q86 52 80 60 Q76 72 70 104Z" fill="url(#sg-bi)"/>
    <path d="M38 128 Q40 110 44 100 Q48 88 60 84 Q72 88 76 100 Q80 112 82 128 Q80 140 60 142 Q40 140 38 128Z" fill="url(#sg-bi)"/>
    <path d="M44 100 Q30 88 20 78 Q14 72 16 66 Q18 60 25 64 Q36 74 48 92Z" fill="url(#sg-bi)"/>
    <ellipse cx="16" cy="64" rx="6" ry="8" fill="url(#sg-bi)" transform="rotate(20,16,64)"/>
    <path d="M76 100 Q90 90 100 82 Q106 76 104 70 Q102 64 95 68 Q84 78 72 94Z" fill="url(#sg-bi)"/>
    <ellipse cx="104" cy="70" rx="6" ry="8" fill="url(#sg-bi)" transform="rotate(-20,104,70)"/>
    <rect x="54" y="70" width="12" height="16" rx="6" fill="url(#sg-bi)"/>
    <ellipse cx="60" cy="56" rx="20" ry="22" fill="url(#sg-bi)"/>
    <!-- bola no ar -->
    <circle cx="60" cy="22" r="14" fill="${c}" opacity=".28"/>
    <circle cx="60" cy="22" r="14" stroke="${c}" stroke-width="2" fill="none" opacity=".48"/>
  </svg>`,

  passe: (c, g=10) => `<svg viewBox="0 0 120 220" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 0 ${g}px ${c})">
    <defs><linearGradient id="sg-pa" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${c}"/><stop offset="100%" stop-color="${c}" stop-opacity=".68"/></linearGradient></defs>
    <ellipse cx="60" cy="215" rx="26" ry="5" fill="${c}" opacity=".15"/>
    <path d="M46 144 Q44 166 44 188 Q44 196 52 196 Q60 196 60 188 Q58 166 56 144Z" fill="url(#sg-pa)"/>
    <path d="M66 142 Q80 162 88 178 Q90 186 84 188 Q78 190 74 184 Q66 170 60 150Z" fill="url(#sg-pa)"/>
    <path d="M40 86 Q38 106 40 128 Q42 142 54 146 Q64 150 74 144 Q82 138 82 122 Q82 104 80 86 Q76 72 60 70 Q42 72 40 86Z" fill="url(#sg-pa)"/>
    <path d="M42 92 Q28 86 18 80 Q12 76 13 70 Q15 64 22 68 Q34 74 46 96Z" fill="url(#sg-pa)"/>
    <ellipse cx="13" cy="69" rx="6" ry="8" fill="url(#sg-pa)"/>
    <path d="M80 90 Q96 80 108 72 Q114 68 112 62 Q110 56 104 60 Q90 70 78 88Z" fill="url(#sg-pa)"/>
    <ellipse cx="112" cy="62" rx="7" ry="8" fill="url(#sg-pa)" transform="rotate(-20,112,62)"/>
    <rect x="53" y="60" width="14" height="13" rx="6" fill="url(#sg-pa)" transform="rotate(8,60,66)"/>
    <ellipse cx="64" cy="47" rx="19" ry="21" fill="url(#sg-pa)" transform="rotate(8,64,47)"/>
    <circle cx="94" cy="188" r="11" fill="${c}" opacity=".3"/>
    <circle cx="94" cy="188" r="11" stroke="${c}" stroke-width="1.5" fill="none" opacity=".5"/>
  </svg>`,

  voleio: (c, g=13) => `<svg viewBox="0 0 120 220" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 0 ${g}px ${c})">
    <defs><linearGradient id="sg-vo" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${c}"/><stop offset="100%" stop-color="${c}" stop-opacity=".62"/></linearGradient></defs>
    <ellipse cx="60" cy="215" rx="26" ry="5" fill="${c}" opacity=".14"/>
    <path d="M44 144 Q40 166 38 188 Q38 196 46 196 Q54 196 54 188 Q54 168 54 144Z" fill="url(#sg-vo)"/>
    <path d="M62 148 Q78 124 92 98 Q98 84 92 78 Q86 72 80 80 Q70 100 62 132 Q60 140 60 148Z" fill="url(#sg-vo)"/>
    <path d="M38 88 Q36 108 38 128 Q40 142 52 148 Q62 152 72 146 Q82 140 82 124 Q82 106 80 88 Q76 72 58 70 Q38 72 38 88Z" fill="url(#sg-vo)"/>
    <path d="M40 92 Q24 86 14 78 Q8 72 10 66 Q12 60 20 64 Q32 72 44 96Z" fill="url(#sg-vo)"/>
    <ellipse cx="10" cy="65" rx="6" ry="8" fill="url(#sg-vo)"/>
    <path d="M80 92 Q94 84 104 78 Q110 74 110 80 Q110 86 104 90 Q92 96 80 98Z" fill="url(#sg-vo)"/>
    <rect x="52" y="60" width="13" height="13" rx="6" fill="url(#sg-vo)" transform="rotate(-8,60,66)"/>
    <ellipse cx="57" cy="47" rx="19" ry="21" fill="url(#sg-vo)" transform="rotate(-8,57,47)"/>
    <!-- bola no ar -->
    <circle cx="92" cy="80" r="12" fill="${c}" opacity=".25"/>
    <circle cx="92" cy="80" r="12" stroke="${c}" stroke-width="2" fill="none" opacity=".48"/>
  </svg>`,

  defesa: (c, g=12) => `<svg viewBox="0 0 120 220" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 0 ${g}px ${c})">
    <defs><linearGradient id="sg-de" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${c}"/><stop offset="100%" stop-color="${c}" stop-opacity=".65"/></linearGradient></defs>
    <ellipse cx="50" cy="200" rx="40" ry="6" fill="${c}" opacity=".12"/>
    <!-- goleiro se jogando para o lado -->
    <path d="M10 160 Q8 140 20 128 Q32 116 50 118 Q68 118 80 130 Q92 144 90 160Z" fill="url(#sg-de)"/>
    <path d="M10 160 Q8 180 12 196 Q16 204 24 200 Q32 196 30 180 Q28 168 28 158Z" fill="url(#sg-de)"/>
    <path d="M90 162 Q100 174 108 180 Q116 186 116 192 Q116 198 108 198 Q100 198 96 190 Q88 178 88 164Z" fill="url(#sg-de)"/>
    <path d="M18 128 Q18 108 28 94 Q38 80 52 78 Q70 76 80 90 Q90 104 88 120Z" fill="url(#sg-de)"/>
    <path d="M22 128 Q14 116 8 104 Q4 96 8 90 Q12 84 18 88 Q26 98 30 116Z" fill="url(#sg-de)"/>
    <ellipse cx="8" cy="89" rx="6" ry="8" fill="url(#sg-de)"/>
    <path d="M88 122 Q96 112 104 102 Q110 96 112 102 Q114 108 108 116 Q100 124 90 126Z" fill="url(#sg-de)"/>
    <ellipse cx="112" cy="102" rx="7" ry="8" fill="url(#sg-de)"/>
    <rect x="46" y="62" width="14" height="15" rx="6" fill="url(#sg-de)" transform="rotate(-15,53,70)"/>
    <ellipse cx="42" cy="50" rx="20" ry="22" fill="url(#sg-de)" transform="rotate(-12,42,50)"/>
    <!-- bola salva -->
    <circle cx="110" cy="56" r="14" fill="${c}" opacity=".22"/>
    <circle cx="110" cy="56" r="14" stroke="${c}" stroke-width="2" fill="none" opacity=".45"/>
  </svg>`,

  carrinho: (c, g=12) => `<svg viewBox="0 0 120 220" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 0 ${g}px ${c})">
    <defs><linearGradient id="sg-ca" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${c}"/><stop offset="100%" stop-color="${c}" stop-opacity=".62"/></linearGradient></defs>
    <ellipse cx="72" cy="205" rx="42" ry="6" fill="${c}" opacity=".14"/>
    <!-- carrinho — deslizando horizontalmente -->
    <!-- corpo deslizando -->
    <path d="M8 180 Q8 158 26 148 Q44 138 64 142 Q82 146 90 158 Q96 170 88 182 Q80 190 60 192 Q38 192 20 186Z" fill="url(#sg-ca)"/>
    <!-- perna de carrinho estendida -->
    <path d="M76 172 Q92 168 108 166 Q116 165 116 171 Q116 178 108 180 Q90 182 76 180Z" fill="url(#sg-ca)"/>
    <ellipse cx="116" cy="172" rx="6" ry="8" fill="url(#sg-ca)"/>
    <!-- perna dobrada atrás -->
    <path d="M28 180 Q20 192 18 200 Q18 208 26 208 Q34 208 36 200 Q38 190 38 180Z" fill="url(#sg-ca)"/>
    <!-- tronco levantado -->
    <path d="M60 140 Q64 120 68 102 Q70 90 64 84 Q58 78 52 84 Q48 92 50 108 Q54 126 56 140Z" fill="url(#sg-ca)"/>
    <!-- braço de apoio -->
    <path d="M54 108 Q36 110 22 110 Q16 110 16 116 Q16 122 22 122 Q38 122 56 120Z" fill="url(#sg-ca)"/>
    <ellipse cx="16" cy="116" rx="7" ry="8" fill="url(#sg-ca)"/>
    <!-- braço levantado -->
    <path d="M68 104 Q80 92 90 80 Q96 74 94 68 Q92 62 86 66 Q76 76 68 94Z" fill="url(#sg-ca)"/>
    <ellipse cx="94" cy="68" rx="6" ry="7" fill="url(#sg-ca)"/>
    <!-- cabeça -->
    <rect x="52" y="68" width="13" height="13" rx="5" fill="url(#sg-ca)" transform="rotate(10,60,74)"/>
    <ellipse cx="66" cy="56" rx="19" ry="21" fill="url(#sg-ca)" transform="rotate(10,66,56)"/>
    <!-- bola -->
    <circle cx="104" cy="182" r="12" fill="${c}" opacity=".32"/>
    <circle cx="104" cy="182" r="12" stroke="${c}" stroke-width="2" fill="none" opacity=".52"/>
  </svg>`,
};

/** Componente React da silhueta */
export function SilhouettePlayer({ pose, color, glow = 14, width = 160, height = 245, breathClassName }: SilhouetteProps) {
  const svgString = SILHOUETTE_SVG[pose]?.(color, glow) ?? SILHOUETTE_SVG.comemoracao(color, glow);
  return (
    <div
      className={breathClassName}
      style={{ width, height, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      dangerouslySetInnerHTML={{ __html: svgString }}
    />
  );
}
