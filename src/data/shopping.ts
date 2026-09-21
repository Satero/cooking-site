// Derives the shopping list from the schedule. Pure: AppData in, list out.

import type { AppData, DateISO } from '../types'
import { addDays } from './dates'
import { effectiveServings, entriesInRange } from './schedule'
import { findRecipe } from './recipes'

export type ShoppingItem = {
  /** Stable identity for the checkbox: normalized name + unit. */
  key: string
  name: string
  unit?: string
  /** Sum of scaled quantities across recipes that gave one. Undefined if none did. */
  qty?: number
  /** True if at least one contributing recipe listed this ingredient without a quantity. */
  hasUnquantified: boolean
  /** Recipe names that need this, with how many scheduled times each. */
  neededFor: { name: string; times: number }[]
}

export function itemKey(name: string, unit: string | undefined): string {
  return `${name.trim().toLowerCase()}|${(unit ?? '').trim().toLowerCase()}`
}

/** The window the list covers. Start defaults to today so the list rolls forward on its own. */
export function shoppingWindow(data: AppData, today: DateISO): { start: DateISO; end: DateISO; days: number } {
  const start = data.shopping.rangeStart ?? today
  const days = Math.max(1, data.shopping.rangeDays)
  return { start, end: addDays(start, days - 1), days }
}

export function buildShoppingList(data: AppData, today: DateISO): ShoppingItem[] {
  const { start, days } = shoppingWindow(data, today)
  const merged = new Map<string, ShoppingItem & { _needed: Map<string, number> }>()

  for (const entry of entriesInRange(data, start, days)) {
    const recipe = findRecipe(data, entry.recipeId)
    if (!recipe) continue
    const factor = recipe.servings > 0 ? effectiveServings(entry, data.settings) / recipe.servings : 1

    for (const ing of recipe.ingredients) {
      const key = itemKey(ing.name, ing.unit)
      let item = merged.get(key)
      if (!item) {
        item = { key, name: ing.name.trim(), unit: ing.unit?.trim() || undefined, hasUnquantified: false, neededFor: [], _needed: new Map() }
        merged.set(key, item)
      }
      if (ing.qty === undefined) item.hasUnquantified = true
      else item.qty = (item.qty ?? 0) + ing.qty * factor
      item._needed.set(recipe.name, (item._needed.get(recipe.name) ?? 0) + 1)
    }
  }

  return [...merged.values()]
    .map(({ _needed, ...item }) => ({
      ...item,
      neededFor: [..._needed].map(([name, times]) => ({ name, times })).sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export function setRange(data: AppData, rangeStart: DateISO | undefined, rangeDays: number): AppData {
  const { rangeStart: _drop, ...rest } = data.shopping
  return { ...data, shopping: { ...rest, rangeDays, ...(rangeStart !== undefined && { rangeStart }) } }
}

export function toggleChecked(data: AppData, key: string, visibleKeys: string[]): AppData {
  const visible = new Set(visibleKeys)
  const checked = new Set(data.shopping.checked.filter((k) => visible.has(k))) // prune stale keys
  if (checked.has(key)) checked.delete(key)
  else checked.add(key)
  return { ...data, shopping: { ...data.shopping, checked: [...checked] } }
}

export function clearChecked(data: AppData): AppData {
  return { ...data, shopping: { ...data.shopping, checked: [] } }
}
