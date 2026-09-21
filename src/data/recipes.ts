// Pure helpers for recipes. No React, no storage — take AppData, return AppData.

import type { AppData, Ingredient, Recipe } from '../types'
import { newId } from '../storage'

export type RecipeInput = Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>

export function createRecipe(data: AppData, input: RecipeInput): { data: AppData; id: string } {
  const now = new Date().toISOString()
  const recipe: Recipe = { ...input, id: newId(), createdAt: now, updatedAt: now }
  return { data: { ...data, recipes: [...data.recipes, recipe] }, id: recipe.id }
}

export function updateRecipe(data: AppData, id: string, input: RecipeInput): AppData {
  const now = new Date().toISOString()
  return {
    ...data,
    recipes: data.recipes.map((r) => (r.id === id ? { ...r, ...input, updatedAt: now } : r)),
  }
}

/** Deletes the recipe and everything that points at it (learnings, schedule entries). */
export function deleteRecipe(data: AppData, id: string): AppData {
  return {
    ...data,
    recipes: data.recipes.filter((r) => r.id !== id),
    learnings: data.learnings.filter((l) => l.recipeId !== id),
    schedule: data.schedule.filter((s) => s.recipeId !== id),
  }
}

export function findRecipe(data: AppData, id: string | undefined): Recipe | undefined {
  return data.recipes.find((r) => r.id === id)
}

/** Case-insensitive match on name, tags, or ingredient names. */
export function searchRecipes(recipes: Recipe[], query: string): Recipe[] {
  const q = query.trim().toLowerCase()
  if (!q) return recipes
  return recipes.filter(
    (r) =>
      r.name.toLowerCase().includes(q) ||
      r.tags.some((t) => t.toLowerCase().includes(q)) ||
      r.ingredients.some((i) => i.name.toLowerCase().includes(q)),
  )
}

const UNICODE_FRACTIONS: Record<string, string> = { '¼': '1/4', '⅓': '1/3', '½': '1/2', '⅔': '2/3', '¾': '3/4' }

/** "1/2" → 0.5, "1 1/2" → 1.5, "1½" → 1.5, "2" → 2, "" → undefined. Returns null if unparseable. */
export function parseQty(text: string): number | undefined | null {
  // Normalize unicode fractions to ASCII so one regex handles both: "1½" → "1 1/2"
  const s = text.trim().replace(/[¼⅓½⅔¾]/g, (ch) => ` ${UNICODE_FRACTIONS[ch]}`).trim()
  if (!s) return undefined
  const m = s.match(/^(\d+)?\s*(?:(\d+)\/(\d+))?$/)
  if (m && (m[1] || m[2])) {
    const whole = m[1] ? Number(m[1]) : 0
    const frac = m[2] ? Number(m[2]) / Number(m[3]) : 0
    return Number.isFinite(frac) ? whole + frac : null
  }
  const n = Number(s)
  return Number.isFinite(n) && n >= 0 ? n : null
}

// [value, display glyph, ASCII form for editing]
const FRACTIONS: [number, string, string][] = [
  [0.25, '¼', '1/4'],
  [0.333, '⅓', '1/3'],
  [0.5, '½', '1/2'],
  [0.667, '⅔', '2/3'],
  [0.75, '¾', '3/4'],
]

function fmt(qty: number | undefined, ascii: boolean): string {
  if (qty === undefined) return ''
  const whole = Math.floor(qty)
  const rest = qty - whole
  if (rest < 0.01) return String(whole)
  const frac = FRACTIONS.find(([v]) => Math.abs(v - rest) < 0.02)
  if (frac) {
    const f = ascii ? frac[2] : frac[1]
    if (!whole) return f
    return ascii ? `${whole} ${f}` : `${whole}${f}`
  }
  return String(Math.round(qty * 100) / 100)
}

/** For display: 0.5 → "½", 1.5 → "1½", 2 → "2", 1.37 → "1.37". */
export const formatQty = (qty: number | undefined) => fmt(qty, false)

/** For form inputs (round-trips through parseQty): 1.5 → "1 1/2". */
export const formatQtyInput = (qty: number | undefined) => fmt(qty, true)

export function formatIngredient(i: Ingredient): string {
  return [formatQty(i.qty), i.unit, i.name].filter(Boolean).join(' ')
}
