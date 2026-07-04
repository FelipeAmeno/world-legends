# Sprint 2.1 — Operation First Five Minutes

**Date:** 2026-07-04  
**Goal:** Make the first 5 minutes feel like a commercial product. Zero new mechanics. Connect and polish existing systems.

---

## Flow Implemented

```
Login → NewUserWelcome → /packs?welcome=1 → RevealSummary (⚽ MONTAR MEU SQUAD →) → /squad → PitchBuilder (⚽ Jogar) → /match → MatchResultScreen (missão diária teaser)
```

---

## Changes by File

### `apps/web/app/page.tsx`
- Fetches `getUserCollection`, `getUserActiveSquad`, `getUserProfile` in parallel
- Computes `isNewUser = collection.length === 0`
- Passes `isNewUser`, `collectionCount`, `squadFormation` to `PremiumHome`

### `apps/web/components/home/PremiumHome.tsx`
- Added `isNewUser`, `collectionCount`, `squadFormation` props
- When `isNewUser=true`, renders `<NewUserWelcome />` instead of normal home
- Passes `collectionCount` + `squadFormation` to `GameGrid`

### `apps/web/components/home/NewUserWelcome.tsx` *(new)*
- Clean welcome screen shown to users with 0 cards
- On mount: calls `claimStarterPack()` (server action, idempotent) silently in background
- Calls `onboard(derivedName)` from GameContext (activates FlowProgress system)
- Name derived from OAuth display name → email prefix → "Treinador"
- CTA: "ABRIR FOUNDER PACK →" disabled while claiming, enabled when ready
- Redirects to `/packs?welcome=1`

### `apps/web/components/home/GameGrid.tsx`
- Now accepts `collectionCount` and `squadFormation` props
- Collection sub-text: real card count ("11 cartas" instead of hardcoded "16 cartas")
- Squad sub-text: real formation ("4-3-3") or "Montar time" if no squad
- Events card href: `/events` (was incorrectly `/match`)

### `apps/web/app/packs/page.tsx`
- Reads `searchParams.welcome` and passes `isWelcome` to `PackExperience`
- Server-side: no Suspense boundary needed

### `apps/web/components/packs/PackExperience.tsx`
- Accepts `isWelcome?: boolean` prop
- Threads `isWelcome` down to `RevealSummary`

### `apps/web/components/packs/RevealSummary.tsx`
- Accepts `isWelcome?: boolean` prop
- When `isWelcome=true`: replaces "← Loja" + "📦 Abrir Outro" with a single gold CTA
  - "⚽ MONTAR MEU SQUAD →" — `<Link href="/squad">`
- When `isWelcome=false`: existing behavior unchanged

### `apps/web/components/squad/premium/PitchBuilder.tsx`
- Empty-state guidance banner: appears when squad is empty but user has cards
  - "Toque em um slot · arraste cartas · ou use auto-fill"
  - Prominent "auto-fill" button inline in the banner
  - Dismisses automatically once first card is placed
- "⚽ Jogar" CTA: appears in top bar when `saveStatus === 'saved'` AND `starterCount >= 11`
  - Spring-animated in/out
  - Links to `/match`

### `apps/web/components/match/premium/MatchResultScreen.tsx`
- Added daily mission teaser strip above action buttons
  - "🎯 Missão Diária · Jogue 3 partidas hoje · +300c"
  - Progress indicator "1/3"
  - Always visible (encourages return visits)

### `apps/web/app/enter/page.tsx`
- Redirects authenticated users to `/` immediately
- Authenticated users now use the `NewUserWelcome` flow via `app/page.tsx`
- `/enter` remains for unauthenticated/local mode (no change to that flow)

---

## What Was NOT Changed

- No new DB tables or migrations
- No new game mechanics or match logic
- `FlowProgress` / `FlowCTA` system unchanged (now activated via `onboard()` in `NewUserWelcome`)
- Pack opening animation/physics unchanged
- Squad builder drag-and-drop unchanged
- `claimStarterPack()` unchanged (already idempotent)

---

## Known Remaining Gaps

| Gap | Priority |
|-----|----------|
| Daily mission teaser shows hardcoded "1/3" — not connected to `mission_progress` table | Medium |
| `onboard()` stores username in localStorage only — not in `profiles` table | Medium (pre-existing debt) |
| Level/XP only in localStorage — not in Supabase `profiles` | Medium (pre-existing debt) |
| Squad OVR not shown in GameGrid (requires full card catalog cross-reference) | Low |
| FlowProgress bar still requires `isOnboarded` to show — now correctly activated via `NewUserWelcome` | Done ✓ |

---

## Test Checklist (manual)

- [ ] New user (0 cards) → sees `NewUserWelcome` on `/`
- [ ] "ABRIR FOUNDER PACK →" disabled while claiming, enabled after
- [ ] After claiming → `claimStarterPack()` idempotent (no duplicates on refresh)
- [ ] `/packs?welcome=1` → after opening → "⚽ MONTAR MEU SQUAD →" CTA visible
- [ ] `/squad` with cards + no squad → guidance banner visible, auto-fill works
- [ ] Squad full (11 starters) + saved → "⚽ Jogar" button appears in top bar
- [ ] After match → daily mission teaser visible
- [ ] Returning user with cards → normal home, real collection count shown
- [ ] GameGrid collection card shows real count
- [ ] GameGrid squad card shows real formation or "Montar time"
- [ ] Events card in GameGrid links to `/events` (not `/match`)
- [ ] Authenticated user visiting `/enter` → redirected to `/`
