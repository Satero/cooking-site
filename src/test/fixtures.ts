// Small builders so tests only spell out the fields they care about.

import type { AppData, Learning, Recipe, ScheduleEntry } from '../types'
import { emptyData } from '../storage'

export function recipe(overrides: Partial<Recipe> & Pick<Recipe, 'id'>): Recipe {
  return {
    name: overrides.id,
    servings: 4,
    tags: [],
    ingredients: [],
    steps: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

export function entry(overrides: Partial<ScheduleEntry> & Pick<ScheduleEntry, 'id' | 'recipeId' | 'date'>): ScheduleEntry {
  return { slot: 'dinner', ...overrides }
}

export function learning(overrides: Partial<Learning> & Pick<Learning, 'id'>): Learning {
  return { recipeId: null, date: '2026-01-01', text: overrides.id, ...overrides }
}

export function data(overrides: Partial<AppData> = {}): AppData {
  return { ...emptyData(), ...overrides }
}
