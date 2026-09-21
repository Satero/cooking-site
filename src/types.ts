// Shared data model. Every page reads/writes through these types via the store.

export type ID = string

/** ISO date, YYYY-MM-DD (local time). */
export type DateISO = string

export type Ingredient = {
  qty?: number
  unit?: string
  name: string
}

export type Recipe = {
  id: ID
  name: string
  servings: number
  tags: string[]
  sourceUrl?: string
  ingredients: Ingredient[]
  /** Ordered cooking steps. */
  steps: string[]
  notes?: string
  createdAt: string
  updatedAt: string
}

export type Learning = {
  id: ID
  /** null = general learning, shown on every Cooking view. */
  recipeId: ID | null
  date: DateISO
  text: string
}

export type MealSlot = 'breakfast' | 'lunch' | 'dinner'
export const MEAL_SLOTS: MealSlot[] = ['breakfast', 'lunch', 'dinner']

export type ScheduleEntry = {
  id: ID
  date: DateISO
  slot: MealSlot
  recipeId: ID
  /** If set, scales ingredient quantities relative to recipe.servings. */
  servingsOverride?: number
}

export type ShoppingState = {
  /** Start of the shopping window; defaults to today when unset. */
  rangeStart?: DateISO
  /** Number of days in the window, inclusive of rangeStart. */
  rangeDays: number
  /** Keys of ingredients the user has checked off (see shopping page for key format). */
  checked: string[]
}

/** Everything persisted to localStorage. Bump SCHEMA_VERSION when this shape changes. */
export type AppData = {
  recipes: Recipe[]
  learnings: Learning[]
  schedule: ScheduleEntry[]
  shopping: ShoppingState
}
