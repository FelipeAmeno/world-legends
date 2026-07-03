# 🌟 World Legends

> Collectible Football Card Game — colecione as maiores lendas do futebol.

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-green)](https://supabase.com)

---

## ✨ Funcionalidades

| Feature | Descrição | Task |
|---|---|---|
| 🃏 Coleção | Grid virtualizado, filtros, comparação | T053 |
| 📦 Pack Opening | Framer Motion + GOAT reveal épico | T052 |
| ⚽ Partidas | Replay de eventos + narração PT-BR | T055 |
| ⚔️ Squad Builder | Campo SVG + DnD + química real-time | T054 |
| 🏆 Ranking | Global, país, amigos, temporada | T064 |
| 🎯 Missões | Daily/Weekly/Lifetime LiveOps-ready | T059 |
| ⚡ Eventos | Copa do Mundo, Champions, Libertadores | T065 |
| 🔔 Notificações | Toast + gaveta completa | T066 |
| 🏪 Mercado | Estrutura pronta para economia | T063 |
| 🎁 Recompensas | XP + créditos + level up + confetes | T056 |
| 👤 Perfil | 10 seções com conquistas e temporadas | T057 |
| 🔐 Auth | Google, Apple, Email via Supabase | T060 |
| ☁️ Cloud Save | Auto-save + retry + offline queue | T062 |
| 📊 Analytics | PostHog + 5 funnels tipados | T067 |
| 🐛 Crash Reports | Sentry + source maps + breadcrumbs | T068 |

---

## 🏗️ Monorepo

```
world-legends/
├── apps/web/                # Next.js 15 App Router (198 arquivos TS)
├── packages/
│   ├── engine/              # Game engine core
│   ├── cards/               # Card definitions
│   ├── chemistry/           # Chemistry system
│   ├── match-simulator/     # Match simulation
│   ├── persistence/         # Ports & Adapters (Supabase + Memory)
│   ├── squad-rating/        # OVR calculation
│   └── shared/              # Utilities
├── vercel.json
└── README.md
```

---

## 🚀 Setup em 3 passos

```bash
# 1. Instalar
pnpm install

# 2. Configurar (opcional — funciona sem banco)
cp apps/web/.env.local.example apps/web/.env.local

# 3. Rodar
pnpm dev  # → http://localhost:3000
```

---

## 🌐 Variáveis de Ambiente

| Variável | Obrigatório | Descrição |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Opcional | URL do Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Opcional | Anon key do Supabase |
| `NEXT_PUBLIC_POSTHOG_KEY` | Opcional | Analytics |
| `NEXT_PUBLIC_SENTRY_DSN` | Opcional | Crash reports |
| `NEXT_PUBLIC_APP_URL` | Produção | URL do app |

---

## 🧱 Stack

- **Next.js 15** App Router + Server Components
- **TypeScript 5** strict
- **Tailwind CSS** + Framer Motion
- **Supabase** Auth + PostgreSQL + RLS
- **Turborepo** monorepo

## 📦 Scripts

```bash
pnpm dev              # Desenvolvimento
pnpm build            # Build de produção
pnpm lint             # Linting
ANALYZE=true pnpm build  # Análise de bundle
```

---

MIT © 2025 World Legends · *198 arquivos TypeScript · ~1.3MB*
