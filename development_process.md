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
| Household default servings | `settings.defaultServings`, set on the Schedule page ("Cooking for N people"). Every schedule entry uses it unless it has its own override. | Added after M3: entering the same servings on every entry was tedious. Changing the default retroactively applies to entries without an override — that's the point of a default. |
| Backup | JSON export / import in Settings, versioned envelope with a `migrate()` hook | `localStorage` can be wiped by the browser; schema version lets old backups be upgraded. |

## Milestones

- [x] **M0 — Scaffold**: Vite/React/TS, nav + routing, shared types, versioned storage + store context, Settings (export / import / reset), docs, first push.
- [x] **M1 — Recipes**: list + detail, create / edit / delete, dynamic ingredient rows, ordered steps with reorder, tags, source URL, servings.
- [x] **M2 — Learnings**: dated learnings per recipe or general; Learnings page (filterable) and shown on recipe detail.
- [x] **M3 — Schedule**: week view (7 days × 3 slots), multiple dishes per slot, servings override, week navigation.
- [x] **M4 — Shopping**: derived list for a date range, merged + scaled quantities, persistent checkboxes, "needed by" hint, Copy-list button.
- [x] **M5 — Cooking**: today's dishes by default or pick any recipe; scaled ingredients, step checkboxes, general + recipe learnings.
- [x] **M6 — Polish**: paste-to-rows, sample data, empty states, README update.

## Build log

### M0 — Scaffold (2026-09-21)

- `npm create vite@latest -- --template react-ts`, stripped the demo page, added `react-router`.
- `src/types.ts` — full v1 data model up front (even for pages not built yet) so later milestones don't churn the schema.
- `src/storage.ts` — the only `localStorage` access. Wraps data in `{ version, data }`; `migrate()` is a no-op today but is where future schema bumps go. Also `exportJSON` / `importJSON` / `newId` / `todayISO`.
- `src/store.tsx` — `StoreProvider` holds one `AppData` in React state and saves on every change; `useStore()` exposes `data`, `update(fn)`, `replace(next)`. Feature-specific helpers get layered on per milestone.
- Six placeholder pages, `Nav`, `Page` wrapper, base stylesheet with tokens.
- Settings page is fully functional: export downloads a dated JSON file, import validates the envelope and confirms before replacing, reset confirms before wiping.

### M1 — Recipes (2026-09-21)

- Routes: `/recipes` (list + search), `/recipes/new`, `/recipes/:id` (detail), `/recipes/:id/edit`. One `RecipeForm` component serves both new and edit, keyed by the route param so React doesn't reuse form state between them.
- `src/data/recipes.ts` — pure helpers over `AppData` (`createRecipe`, `updateRecipe`, `deleteRecipe`, `searchRecipes`) plus quantity parsing/formatting. Pages call `update(d => updateRecipe(d, id, input))`. This pattern (pure data helpers in `src/data/`, thin pages) is the convention for every later milestone.
- **Deleting a recipe cascades** to its learnings and schedule entries; the confirm dialog says how many will go.
- **Quantities**: stored as numbers. Form accepts `2`, `1.5`, `1/2`, `1 1/2`, and unicode `½`; display renders `1½`; the edit form renders ASCII `1 1/2` so it round-trips through the parser. Caught a bug during testing where the form showed `1½` but the parser rejected it — now both directions are covered.
- Search matches recipe name, tags, or ingredient names.
- Form state is all strings while editing and parsed/validated on submit; blank ingredient and step rows are dropped, so the "always one empty row" UX doesn't leak into stored data.
- Split `useStore` and `StoreContext` out of `store.tsx` — oxlint's Fast Refresh rule wants component files to export only components.

### M2 — Learnings (2026-09-21)

- `/learnings` page: all learnings newest-first, filter dropdown (All / General only / per recipe), "+ New learning" opens an inline form card. No separate routes — learnings are short notes, so create/edit happen in place.
- Recipe detail page gets a **Learnings** section listing only that recipe's learnings, with an add form where the recipe picker is preselected and locked.
- `src/data/learnings.ts` — `createLearning` / `updateLearning` / `deleteLearning` / `learningsForRecipe` / `generalLearnings`, same pure-helper pattern as recipes.
- Two shared components: `LearningForm` (date defaults to today, recipe select with a "General" option, textarea) and `LearningList` (read view with inline Edit → swaps that card for the form, and Delete behind a confirm). Both are reused by the Learnings page and the recipe detail page.
- General learnings are stored as `recipeId: null`. The Cooking page (M5) will show `generalLearnings()` on every view plus `learningsForRecipe()` for each dish being cooked.

### M3 — Schedule (2026-09-21)

- `/schedule` is a 7-column × 3-row grid (Mon–Sun × breakfast / lunch / dinner). ← / Today / → move by week; the week starts on **Monday**. Today's column is tinted.
- Each cell lists its entries (recipe name → link, servings pill, ✕) and a dashed "+" that opens an inline picker: recipe select + optional servings box (placeholder shows the recipe's default). Clicking the servings pill reopens the picker with the recipe locked to change just the servings.
- **Servings override is only stored when it differs from the recipe default** — entering the default clears it. The pill shows `6*` when overridden so you can see at a glance which dishes are scaled.
- Removing an entry is one click with no confirm; it's trivially re-addable, unlike deleting a recipe.
- `src/data/dates.ts` — ISO-string date math in local time (`addDays`, `startOfWeek`, `dateRange`, labels). Builds `Date` from parts rather than parsing `"YYYY-MM-DD"`, which JS treats as UTC and shifts by a day in US timezones.
- `src/data/schedule.ts` — `addEntry` / `setServings` / `removeEntry` / `entriesFor` / `entriesInRange`. The last one is what Shopping (M4) will use.
- The schedule page uses a wider max-width (`Page wide`) than the others; seven columns didn't fit comfortably in 960px.

### M3.5 — Household default servings (2026-09-21)

- Added `Settings { defaultServings }` to `AppData`, schema bumped to **v2**. `migrate()` already fills missing top-level keys from `emptyData()`, so v1 backups import cleanly.
- `effectiveServings(entry, settings)` = `entry.servingsOverride ?? settings.defaultServings`. The Schedule pill and the Shopping scale factor both go through it.
- The "override equal to default is stored as nothing" rule now compares against the household default, not the recipe's own `servings`. A recipe's `servings` is only used as the denominator when scaling.

### M4 — Shopping (2026-09-21)

- `/shopping` derives its list from `entriesInRange()` over a window. **From** defaults to today and isn't stored unless changed, so the list rolls forward on its own each day; **to** is stored as a day count (`rangeDays`). A "Reset to next 7 days" link appears once you've moved the start.
- `src/data/shopping.ts` — `buildShoppingList()` walks every scheduled entry in the window, scales each ingredient by `effectiveServings / recipe.servings`, and merges by `itemKey` = lowercased `name|unit`. Same name with different units stays separate (cup vs tbsp of soy sauce) — no unit conversion, by design.
- Ingredients without a quantity: the merged line still shows any quantities from other recipes, with a "+" suffix and a footnote. Better than silently dropping or inventing a number.
- Each line shows which recipes need it and how many times (`Chicken Adobo ×2`).
- **Checked items persist** in `shopping.checked` as item keys. Keys not in the current list are pruned on the next toggle so stale checks from old weeks don't pile up. "Uncheck all" resets.
- **Copy remaining** puts the unchecked lines on the clipboard as a `- item` list — the bridge to a phone until v2. Falls back to a `prompt()` if the Clipboard API is unavailable.

### M5 — Cooking (2026-09-25)

- `/cooking` shows **today's** scheduled dishes grouped in slot order (breakfast → lunch → dinner), each as a card: scaled ingredients, step checkboxes, and that recipe's learnings. **General learnings** sit in their own highlighted card at the top, above every dish.
- **"Also cooking" picker** adds any recipe ad hoc, at the household default servings. Ad-hoc dishes have no slot tag and carry a Remove link; scheduled ones can only be removed from the Schedule page, which is where they live.
- A dish is identified by `entry:<scheduleId>` or `recipe:<recipeId>`, so cooking a recipe ad hoc *and* on the schedule tracks two independent sets of checkmarks.
- `scaleIngredients(recipe, servings)` multiplies by `servings / recipe.servings`; quantity-less ingredients ("black pepper") pass through unscaled. The header says `6 servings (recipe serves 4)` so the scaling is visible rather than mysterious.
- `src/session.ts` — step progress and the ad-hoc dish list live in **`sessionStorage`**, not the app store, so they survive navigation between pages but reset when the tab closes. Every accessor is wrapped in try/catch since `sessionStorage` throws in some privacy modes. Per-dish **Reset** clears just that dish's checkmarks.

### M6 — Polish (2026-09-25)

- **Paste a whole list at once** in the recipe form, for both ingredients and steps (the item logged under Future improvements after M1). `src/data/parse.ts`:
  - `parseSteps()` — splits on blank lines when any are present (recipe sites often wrap one step over several lines), otherwise one step per line. Strips `1.` / `2)` / `Step 3:` / `-` / `*` / `•` leaders.
  - `parseIngredients()` — per line, pulls a leading quantity (`2`, `1.5`, `1/2`, `1 1/2`, `½`, `1½`), then a unit **only if the next word is a recognized one**. So "2 large onions" keeps "large onions" as the name instead of inventing a unit, and a line with nothing parseable still becomes a name-only ingredient rather than being dropped.
  - Both append to the existing rows after dropping blank placeholder rows, so pasting into a fresh form reads as "replace" and into a filled one as "add".
- **`src/data/units.ts`** — shared unit vocabulary. Writing the parser surfaced a latent bug: Shopping merged on the unit string, so a pasted "2 cups rice" and a typed "1 cup rice" would have been two separate lines. Units are now stored as the user wrote them but **compared canonically**, which fixes it for typed input too, not just pasted.
- **Sample data** (`src/data/sample.ts`), loadable from Settings: four recipes, five learnings, and a week of meals anchored to today, so every page has something on it. Deliberately not auto-loaded — deleting someone else's recipes is a bad first experience. It confirms before replacing existing data.
- Empty states on Recipes and Learnings now say what the page is *for* and point at the sample data.
- README rewritten to describe the finished app, including a map of how the code is organized.

## Future improvements (v1.x)

Smaller quality-of-life items that don't need the v2 backend work.

- ~~Paste all steps at once~~ — shipped in M6, for both steps and ingredients.
- **Discrete-item rounding on the shopping list.** Scaling can produce "7½ bay leaves". Mathematically right, practically silly — could round up items that have no unit.
- **Unit conversion in the shopping merge.** Currently "1 cup" and "4 tbsp" of the same thing stay on separate lines by design; converting would merge them but needs a real unit graph.

## Where this ended up

All six milestones are done: v1 is feature-complete. Five working pages over one versioned `localStorage` store, ~1,900 lines of TypeScript and CSS, no backend.

The structure that made it go smoothly: **`src/data/*` holds pure functions over `AppData`, `src/pages/*` stay thin and compose them.** Every milestone after M1 followed that split, and the two derived pages (Shopping, Cooking) were the easiest to write because all the real logic was already sitting in testable pure functions.

## v2 ideas

- **Use it at the grocery store**: needs data off the laptop — a backend + sync (small Node/SQLite server on the home network, or a hosted free tier like Supabase) and a mobile-friendly layout.
- **Multiple users**: accounts / auth, each with their own recipes and schedule. Depends on the backend above.
- **Mobile layout** for Shopping and Cooking (phone at the store, tablet at the stove).
- Recipe **photos** and **prep / cook time**.
- **Import a recipe from a URL** (scrape recipe-site structured data).
- **Pantry staples**: mark salt / oil / etc. as always-on-hand so they don't appear on the shopping list.
- **Manual shopping items** not tied to a recipe (milk, paper towels).
- Persist cooking-step progress across tab closes (currently intentionally session-only).

