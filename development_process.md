# Development process

How this project was planned and built, the decisions made along the way, and what's deferred.

## Goal

A personal cooking app with five pages — Recipes, Learnings, Schedule, Shopping, Cooking — where Shopping and Cooking are *derived* from the others (Shopping from Schedule + recipe ingredients; Cooking from recipes + learnings, filtered by what's scheduled today).

## Decisions (v1)

| Decision | Choice | Why |
|---|---|---|
| Data location | Browser `localStorage`, no backend | Simplest possible v1. Storage is isolated in `src/storage.ts` so a backend can be swapped in later without touching pages. |
| Users | Single user, no auth | Only Justin uses it for now. |
| Framework | React + TypeScript on Vite | Justin knows React; this app has enough interlinked state (editing a recipe should update Shopping, etc.) that a framework pays off vs. the vanilla-TS approach used in `timekeeper`. |
| Routing | `react-router` | Standard; keeps six pages clean in a single-page app. |
| Styling | Plain CSS with design tokens, light + dark via `prefers-color-scheme` | No new tooling to learn yet — see open questions. |
| Layout | Desktop only | The app stays on the computer for now. Mobile matters once it leaves the house (v2). |
| Ingredients | Structured `{ qty?, unit?, name }` | Required for Shopping to merge duplicates across recipes and scale by servings. Freeform text would make Shopping a dumb concatenation. |
| Shopping merge rule | Merge when `name + unit` match (case-insensitive); otherwise list separately | Avoids guessing unit conversions. |
| Shopping window | Today + 6 days by default, user-adjustable | Matches "what do I buy for the coming week." |
| Checked shopping items | Persist in storage | So you can check off half the list and come back. |
| Cooking step checkboxes | `sessionStorage` (reset when the tab closes) | A fresh cook shouldn't inherit last week's checkmarks. |
| Learnings | Many per recipe, each dated; plus "general" learnings (`recipeId: null`) shown on every Cooking view | General learnings (e.g. knife technique) apply regardless of dish. |
| Schedule | Per meal slot (breakfast / lunch / dinner), multiple dishes per slot, optional servings override | A meal is usually a main + sides. Override scales Shopping quantities. |
| Backup | JSON export / import in Settings, versioned envelope with a `migrate()` hook | `localStorage` can be wiped by the browser; schema version lets old backups be upgraded. |

## Milestones

- [x] **M0 — Scaffold**: Vite/React/TS, nav + routing, shared types, versioned storage + store context, Settings (export / import / reset), docs, first push.
- [ ] **M1 — Recipes**: list + detail, create / edit / delete, dynamic ingredient rows, ordered steps with reorder, tags, source URL, servings.
- [ ] **M2 — Learnings**: dated learnings per recipe or general; Learnings page (filterable) and shown on recipe detail.
- [ ] **M3 — Schedule**: week view (7 days × 3 slots), multiple dishes per slot, servings override, week navigation.
- [ ] **M4 — Shopping**: derived list for a date range, merged + scaled quantities, persistent checkboxes, "needed by" hint, Copy-list button.
- [ ] **M5 — Cooking**: today's dishes by default or pick any recipe; scaled ingredients, step checkboxes, general + recipe learnings.
- [ ] **M6 — Polish**: sample data, empty states, README update.

## Build log

### M0 — Scaffold (2026-09-21)

- `npm create vite@latest -- --template react-ts`, stripped the demo page, added `react-router`.
- `src/types.ts` — full v1 data model up front (even for pages not built yet) so later milestones don't churn the schema.
- `src/storage.ts` — the only `localStorage` access. Wraps data in `{ version, data }`; `migrate()` is a no-op today but is where future schema bumps go. Also `exportJSON` / `importJSON` / `newId` / `todayISO`.
- `src/store.tsx` — `StoreProvider` holds one `AppData` in React state and saves on every change; `useStore()` exposes `data`, `update(fn)`, `replace(next)`. Feature-specific helpers get layered on per milestone.
- Six placeholder pages, `Nav`, `Page` wrapper, base stylesheet with tokens.
- Settings page is fully functional: export downloads a dated JSON file, import validates the envelope and confirms before replacing, reset confirms before wiping.

## v2 ideas

- **Use it at the grocery store**: needs data off the laptop — a backend + sync (small Node/SQLite server on the home network, or a hosted free tier like Supabase) and a mobile-friendly layout.
- **Multiple users**: accounts / auth, each with their own recipes and schedule. Depends on the backend above.
- **Mobile layout** for Shopping and Cooking (phone at the store, tablet at the stove).
- Recipe **photos** and **prep / cook time**.
- **Import a recipe from a URL** (scrape recipe-site structured data).
- **Pantry staples**: mark salt / oil / etc. as always-on-hand so they don't appear on the shopping list.
- **Manual shopping items** not tied to a recipe (milk, paper towels).
- Persist cooking-step progress across tab closes (currently intentionally session-only).

