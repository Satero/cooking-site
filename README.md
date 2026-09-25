# Cooking Site

A personal cooking planner. Keep recipes, record what you learned each time you cook, schedule meals for the week, generate a shopping list from that schedule, and follow step-by-step instructions — with your past learnings alongside — while you cook.

Single-user, browser-only. All data lives in this browser's `localStorage`; use **Settings → Export JSON** for backups.

## Pages

| Page | What it does |
|---|---|
| **Recipes** | Add / edit recipes: ingredients (qty / unit / name), ordered steps, servings, tags, source URL. Paste a whole ingredient list or set of steps at once and it splits them into rows. |
| **Learnings** | Dated notes tied to a recipe, or "general" learnings that apply to all cooking |
| **Schedule** | Assign recipes to breakfast / lunch / dinner slots per day, with a household default serving size and per-meal overrides |
| **Shopping** | Checklist of ingredients for the meals scheduled in a date range (default: today + 6 days), quantities merged and scaled, with a copy-to-clipboard button |
| **Cooking** | Today's scheduled dishes (or any recipe, ad hoc) as step-by-step checkboxes, with the relevant learnings |
| **Settings** | Export / import a JSON backup, load sample data, reset |

New here? **Settings → Load sample data** fills every page so you can see how they connect.

## Run

```bash
npm install
npm run dev
```

`npm run build` type-checks (`tsc`) and produces `dist/`. `npm run lint` runs oxlint.

## Stack

Vite + React + TypeScript, `react-router`, plain CSS. No backend, no framework beyond React.

## How the code is organized

- `src/types.ts` — the whole data model in one file
- `src/storage.ts` — the only `localStorage` access point; versioned envelope with a `migrate()` hook
- `src/store.tsx` / `src/useStore.ts` — one `AppData` object in React state, saved on every change
- `src/data/*` — pure helpers over `AppData` (recipes, learnings, schedule, shopping, dates, units, parsing, sample data). No React in here.
- `src/pages/*` — one file per route, thin; they compose the helpers above
- `src/session.ts` — `sessionStorage` state for the Cooking page (step progress resets when the tab closes)

## Status

Feature-complete for v1. See [development_process.md](development_process.md) for the decisions behind it and what's deferred to v2.
