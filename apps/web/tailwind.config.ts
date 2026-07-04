import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}','./components/**/*.{ts,tsx}','./lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        obsidian:  '#07080f',
        midnight:  '#0f1117',
        surface:   '#161a26',
        border:    '#1e2338',
        gold:      '#c9a84c',
        'gold-dim':'#8c6f27',
        steel:     '#3a6ea5',
        parchment: '#e2ddd4',
        muted:     '#7a8099',
        rarity: {
          common:    '#6b7280',
          rare:      '#9333ea',
          elite:     '#2563eb',
          legendary: '#c9a84c',
          ultra:     '#ec4899',
          wch:       '#f0f4ff',
        },
      },
      fontFamily: {
        display:['"Bebas Neue"','"Impact"','system-ui','sans-serif'],
        body:   ['"Inter"','system-ui','sans-serif'],
      },
      backgroundImage: {
        'card-legendary':'linear-gradient(135deg, #1a1000 0%, #2a1c00 50%, #1a1000 100%)',
        'card-ultra':    'linear-gradient(135deg, #1a0020 0%, #0d0030 50%, #001a30 100%)',
        'card-elite':    'linear-gradient(135deg, #000d1a 0%, #001a2e 50%, #000d1a 100%)',
        'card-rare':     'linear-gradient(135deg, #0d0021 0%, #1a0038 50%, #0d0021 100%)',
        'card-common':   'linear-gradient(135deg, #0f1017 0%, #1a1b24 50%, #0f1017 100%)',
      },
      boxShadow: {
        gold:'0 0 20px rgba(201,168,76,0.3)',
        card:'0 4px 24px rgba(0,0,0,0.6)',
      },
      animation: {
        shimmer:         'shimmer 2.5s infinite',
        'fade-in':       'fadeIn 0.4s ease-out',
        'slide-up':      'slideUp 0.4s ease-out',
        'pulse-gold':    'pulseGold 2s ease-in-out infinite',
        // Sprint 3
        'skeleton':      'skeleton-shimmer 1.8s ease-in-out infinite',
        'ripple':        'wl-ripple 0.65s ease-out forwards',
        'float':         'float-y 3s ease-in-out infinite',
        'pulse-ring':    'pulse-ring 1.5s ease-out infinite',
        'bounce-in':     'bounce-in 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards',
        'slide-up-fade': 'slide-up-fade 0.35s cubic-bezier(0.16,1,0.3,1) forwards',
        'gold-sweep':    'gold-sweep 0.7s ease-out forwards',
        'twinkle':       'twinkle 2s ease-in-out infinite',
        'count-up':      'count-up 0.4s cubic-bezier(0.16,1,0.3,1) forwards',
      },
      keyframes: {
        shimmer:           {'0%':{backgroundPosition:'-200% 0'},'100%':{backgroundPosition:'200% 0'}},
        fadeIn:            {'0%':{opacity:'0'},'100%':{opacity:'1'}},
        slideUp:           {'0%':{opacity:'0',transform:'translateY(16px)'},'100%':{opacity:'1',transform:'translateY(0)'}},
        pulseGold:         {'0%,100%':{boxShadow:'0 0 8px rgba(201,168,76,0.3)'},'50%':{boxShadow:'0 0 24px rgba(201,168,76,0.7)'}},
        // Sprint 3
        'skeleton-shimmer':{'0%':{backgroundPosition:'-200% 0'},'100%':{backgroundPosition:'200% 0'}},
        'wl-ripple':       {'0%':{transform:'scale(0)',opacity:'0.5'},'100%':{transform:'scale(1)',opacity:'0'}},
        'float-y':         {'0%,100%':{transform:'translateY(0)'},'50%':{transform:'translateY(-6px)'}},
        'pulse-ring':      {'0%':{transform:'scale(1)',opacity:'0.6'},'100%':{transform:'scale(1.5)',opacity:'0'}},
        'bounce-in':       {'0%':{transform:'scale(0.5)',opacity:'0'},'60%':{transform:'scale(1.1)',opacity:'1'},'80%':{transform:'scale(0.95)'},'100%':{transform:'scale(1)'}},
        'slide-up-fade':   {'from':{transform:'translateY(12px)',opacity:'0'},'to':{transform:'translateY(0)',opacity:'1'}},
        'gold-sweep':      {'0%':{transform:'translateX(-100%) skewX(-20deg)',opacity:'0'},'20%':{opacity:'0.6'},'80%':{opacity:'0.4'},'100%':{transform:'translateX(200%) skewX(-20deg)',opacity:'0'}},
        'twinkle':         {'0%,100%':{opacity:'1',transform:'scale(1)'},'50%':{opacity:'0.3',transform:'scale(0.7)'}},
        'count-up':        {'from':{opacity:'0',transform:'translateY(8px) scale(0.9)'},'to':{opacity:'1',transform:'translateY(0) scale(1)'}},
      },
    },
  },
  plugins: [],
};

export default config;
