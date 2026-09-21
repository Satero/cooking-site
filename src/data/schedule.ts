// Pure helpers for the meal schedule.

import type { AppData, DateISO, MealSlot, ScheduleEntry, Settings } from '../types'
import { newId } from '../storage'
import { dateRange } from './dates'

export function addEntry(
  data: AppData,
  entry: { date: DateISO; slot: MealSlot; recipeId: string; servingsOverride?: number },
): AppData {
  return { ...data, schedule: [...data.schedule, { ...entry, id: newId() }] }
}

export function setServings(data: AppData, id: string, servingsOverride: number | undefined): AppData {
  return {
    ...data,
    schedule: data.schedule.map((e) => {
      if (e.id !== id) return e
      const { servingsOverride: _drop, ...rest } = e
      return servingsOverride === undefined ? rest : { ...rest, servingsOverride }
    }),
  }
}

/** Servings this entry is cooked for: its override, else the household default. */
export function effectiveServings(entry: ScheduleEntry, settings: Settings): number {
  return entry.servingsOverride ?? settings.defaultServings
}

export function setDefaultServings(data: AppData, n: number): AppData {
  return { ...data, settings: { ...data.settings, defaultServings: n } }
}

export function removeEntry(data: AppData, id: string): AppData {
  return { ...data, schedule: data.schedule.filter((e) => e.id !== id) }
}

export function entriesFor(data: AppData, date: DateISO, slot: MealSlot): ScheduleEntry[] {
  return data.schedule.filter((e) => e.date === date && e.slot === slot)
}

/** All entries in `days` consecutive days from `start`, ordered by date then slot. */
export function entriesInRange(data: AppData, start: DateISO, days: number): ScheduleEntry[] {
  const dates = new Set(dateRange(start, days))
  const slotOrder: Record<MealSlot, number> = { breakfast: 0, lunch: 1, dinner: 2 }
  return data.schedule
    .filter((e) => dates.has(e.date))
    .sort((a, b) => a.date.localeCompare(b.date) || slotOrder[a.slot] - slotOrder[b.slot])
}
