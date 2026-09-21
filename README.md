# Cooking Site

A personal cooking planner: keep recipes, record what you learned each time you cook, schedule meals for the week, generate a shopping list from that schedule, and follow step-by-step instructions (with your past learnings alongside) while cooking.

Single-user, browser-only. All data lives in this browser's `localStorage` — use **Settings → Export JSON** for backups.

## Pages

| Page | What it does |
|---|---|
| **Recipes** | Add / edit recipes: ingredients (qty / unit / name), ordered steps, servings, tags, source URL |
| **Learnings** | Dated notes tied to a recipe, or general learnings that apply to all cooking |
| **Schedule** | Assign recipes to breakfast / lunch / dinner slots per day, with optional servings override |
| **Shopping** | Checklist of ingredients for the scheduled meals in a date range (default: next 7 days), quantities merged and scaled |
| **Cooking** | Today's scheduled dishes (or any recipe) as step-by-step checkboxes, with relevant learnings |
| **Settings** | Export / import JSON backup, reset |

## Run

```bash
npm install
npm run dev
```

`npm run build` type-checks and produces `dist/`.

## Stack

Vite + React + TypeScript, `react-router`, plain CSS. No backend.

## Status

See [development_process.md](development_process.md) for milestones, decisions, and v2 ideas.
