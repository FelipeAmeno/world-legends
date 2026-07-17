# Sprint 43G — Home V2 AppShell Integration

Follow-up to Sprint 43F.2, authorized after owner QA approved Sprint 43F.2's content and visual experience but explicitly declined a direct fullscreen-prototype-to-`/` migration. Directive: fold the approved content into the existing shared AppShell (the same Sidebar/GameTopBar/MobileHeader/PremiumBottomNav that Collection, Album, Achievements, and Squad already use), removing the prototype's own header and its five-tab bar as a second, competing navigation layer — behind a new isolated internal route, live `/` untouched.

## 1. What changed

A new sibling route, `/dev/home-v2-shell`, hosts the AppShell-integrated variant. It is deliberately **not** added to `FULLSCREEN_ROUTES` in `components/nav/AppShell.tsx` — that omission alone is what makes the route render inside the shared shell; zero lines of `AppShell.tsx` were touched this sprint.

| Removed from this variant | Replaced by |
|---|---|
| `HomeV2Header` (own identity/level/XP/currency block) | Nothing — the shared `GameTopBar` (desktop) / `MobileHeader` (mobile) already render this from the same real `headerSummary` object `RootLayout` computes for every authenticated page |
| `PrimaryNav` (5 large tabs, full-width grid, per-area glow box) | `HomeV2AreaSwitcher` — a single-row, slim underline-tab strip; a content-level control, not a second navigation bar |

| Preserved exactly (reused, never reimplemented) |
|---|
| `HeroSection` — exported from `HomeV2Experience.tsx` (was module-private) and imported as-is; same two-tier responsive scale, same `selectHeroPresentation()` over `selectTopCards()` |
| `HomeV2ContextPanel` — the same 5 panels (Jogar/Meu Squad/Coleção/Mercado/Packs), including every Sprint 43F.2 fix (Aproveitamento label, real icon, selective legibility, filled Jogar support zone) |
| `PRIMARY_AREAS` / `NavIcon` — also exported from `HomeV2Experience.tsx` to feed the new switcher without duplicating icon/color/label config |

## 2. Why this satisfies the architectural requirement

The owner's core objection to a direct migration was that the prototype's fullscreen header and 5-tab bar would become a *second* global navigation/status layer competing with the Sidebar/topbar. This sprint doesn't restyle that problem away — it removes the duplicate layer entirely. `/dev/home-v2-shell`'s page component returns only content (hero + area switcher + panel); the identity/currency/XP display and all primary cross-app navigation come exclusively from the AppShell already shared by every other real page.

## 3. Files changed

- `apps/web/components/dev/home-v2/HomeV2Experience.tsx` — two additive exports only (`HeroSection`, `PRIMARY_AREAS`); no behavior change to `/dev/home-v2`
- `apps/web/app/dev/home-v2-shell/page.tsx` — new, isolated route, same auth/data-fetching pattern as `/dev/home-v2/page.tsx` (duplicated deliberately, not factored into a shared helper, to keep each prototype route self-contained per established convention)
- `apps/web/components/dev/home-v2-shell/HomeV2ShellExperience.tsx` — new, composes `HeroSection` + `HomeV2AreaSwitcher` + `HomeV2ContextPanel`
- `apps/web/components/dev/home-v2-shell/HomeV2AreaSwitcher.tsx` — new, slim tab-strip area selector
- `apps/web/tests/lib/home-v2-shell-integration.test.ts` — new, 13 tests (204–216)
- `docs/design/10-home-v2-prototype.md` — version bump to 1.3, new §14
- `SPRINT_43G_APPSHELL_INTEGRATION_REPORT.md` — new

## 4. Tests — 13 new, 711/711 total

- Auth fail-closed on the new route (redirect check precedes the first data fetch)
- No own header rendered (`HomeV2Header`/`<header>` absent from the shell experience component)
- `/dev/home-v2-shell` confirmed absent from `FULLSCREEN_ROUTES`, existing entries (including `/dev/home-v2`) confirmed unchanged
- `HeroSection` proven to be an import, not a reimplementation (source-level check against both files)
- `HomeV2AreaSwitcher` proven to never use the old full-width grid layout, uses `role="tablist"` instead
- `HomeV2ContextPanel` proven to be an unmodified import, not a fork
- `selectTopCards`/`selectHeroPresentation` source files confirmed untouched this sprint
- New route confirmed never referenced by `Sidebar.tsx`/`MobileHeader.tsx`/`PremiumBottomNav.tsx` — isolated, URL-only access like `/dev/home-v2`
- Live `/` reconfirmed unchanged
- No mock data, no Gemini/Asset Studio references in any new file
- Shell component confirmed to never reimplement Sidebar/GameTopBar/MobileHeader/PremiumBottomNav
- One-panel-at-a-time behavior confirmed preserved (single `useState<PrimaryArea>`, single `<HomeV2ContextPanel>` render)

**Full suite: 711/711 passing** (698 prior + 13 new). `pnpm lint`: 0 errors, 462 pre-existing warnings (unchanged baseline). `pnpm typecheck`: clean. `pnpm build`: green, run after stopping `next dev`; both `/dev/home-v2` and `/dev/home-v2-shell` compile — their shared code (`HomeV2Experience`, `HomeV2ContextPanel`) is now deduplicated by Next.js into common chunks rather than duplicated per-route, which is why `/dev/home-v2`'s reported route-specific size dropped sharply (6.87 kB → 347 B) while total First Load JS for both routes stayed effectively flat (~278 kB) — expected code-splitting behavior, not a regression. Post-build `curl` smoke check: `/`, `/dev/home-v2`, and `/dev/home-v2-shell` all return `307` for unauthenticated requests, no crash.

## 5. Scope discipline

No production route was changed. `/` still serves `PremiumHome`, unmodified. `AppShell.tsx` was not edited. Gameplay, economy, card ranking, data contracts, Asset Studio, and Gemini were untouched. The original fullscreen prototype at `/dev/home-v2` remains intact and functional — both variants now coexist behind separate isolated routes pending a final production decision.

## 6. Remaining before any production decision

1. **No authenticated browser session available in this environment** — same standing limitation as every prior sprint. The AppShell-integrated variant's actual rendered appearance (does the slim tab strip read as clearly secondary next to the Sidebar? does the hero still dominate inside the narrower `<main>` content column?) needs the owner's own visual pass at `/dev/home-v2-shell`, the same way Sprint 43F.2's browser QA validated the fullscreen variant.
2. All gaps carried forward from Sprint 43F.1/43F.2 (destination duplication on live `/`, orphaned Home components, `RootLayout`'s redundant fetch, Marketplace panel's stricter-than-spec behavior) remain open — untouched by this integration-only sprint.
3. No go/no-go recommendation is made here for a production cutover — this sprint's scope was explicitly limited to producing the AppShell-integrated variant behind an isolated route, per the owner's instructions. That decision awaits the owner's review of `/dev/home-v2-shell` itself.

## 7. Production deployment

URL: https://world-legends.vercel.app (confirmed aliased to commit `cf61ab0b`, deployment `world-legends-ab1pw7a7x`, id `dpl_CjXTdC7yULk3jpmXWcPTeT5zkjjt`, status ● Ready). The AppShell-integrated variant is at https://world-legends.vercel.app/dev/home-v2-shell (login required); the fullscreen prototype remains at https://world-legends.vercel.app/dev/home-v2.
