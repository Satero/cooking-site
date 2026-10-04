import { describe, expect, it } from 'vitest'
import { buildShoppingList, clearChecked, itemKey, setRange, shoppingWindow, toggleChecked } from './shopping'
import { data, entry, recipe } from '../test/fixtures'

const TODAY = '2026-10-01'

describe('itemKey', () => {
  it('is case-insensitive on name and canonical on unit', () => {
    expect(itemKey(' Rice ', 'cups')).toBe(itemKey('rice', 'cup'))
    expect(itemKey('rice', 'cup')).not.toBe(itemKey('rice', 'tbsp'))
    expect(itemKey('salt', undefined)).toBe('salt|')
  })
})

describe('shoppingWindow', () => {
  it('defaults to today for the configured number of days', () => {
    expect(shoppingWindow(data(), TODAY)).toEqual({ start: TODAY, end: '2026-10-07', days: 7 })
  })

  it('uses a stored start', () => {
    const d = data({ shopping: { rangeStart: '2026-10-05', rangeDays: 3, checked: [] } })
    expect(shoppingWindow(d, TODAY)).toEqual({ start: '2026-10-05', end: '2026-10-07', days: 3 })
  })

  it('never shrinks below one day', () => {
    const d = data({ shopping: { rangeDays: 0, checked: [] } })
    expect(shoppingWindow(d, TODAY).days).toBe(1)
  })
})

describe('buildShoppingList', () => {
  const adobo = recipe({
    id: 'adobo',
    name: 'Adobo',
    servings: 4,
    ingredients: [
      { qty: 2, unit: 'lb', name: 'chicken' },
      { qty: 0.5, unit: 'cup', name: 'soy sauce' },
      { name: 'black pepper' },
    ],
  })
  const rice = recipe({
    id: 'rice',
    name: 'Rice',
    servings: 4,
    ingredients: [{ qty: 2, unit: 'cups', name: 'Rice' }],
  })
  const fried = recipe({
    id: 'fried',
    name: 'Fried Rice',
    servings: 2,
    ingredients: [
      { qty: 1, unit: 'cup', name: 'rice' },
      { qty: 1, unit: 'tbsp', name: 'soy sauce' },
      { qty: 1, name: 'black pepper' },
    ],
  })

  const base = data({ recipes: [adobo, rice, fried], settings: { defaultServings: 4 } })

  function list(schedule: ReturnType<typeof entry>[], overrides = {}) {
    return buildShoppingList({ ...base, schedule, ...overrides }, TODAY)
  }

  const find = (items: ReturnType<typeof list>, name: string, unit?: string) =>
    items.find((i) => i.key === itemKey(name, unit))

  it('merges the same ingredient across recipes when units match canonically', () => {
    const items = list([
      entry({ id: '1', recipeId: 'rice', date: TODAY }),
      entry({ id: '2', recipeId: 'fried', date: TODAY }),
    ])
    // rice: 2 cups at 4/4 + 1 cup at 4/2 = 4
    expect(find(items, 'rice', 'cup')).toMatchObject({ qty: 4, name: 'Rice', unit: 'cups' })
  })

  it('keeps different units on separate lines (no unit conversion, by design)', () => {
    const items = list([
      entry({ id: '1', recipeId: 'adobo', date: TODAY }),
      entry({ id: '2', recipeId: 'fried', date: TODAY }),
    ])
    expect(find(items, 'soy sauce', 'cup')?.qty).toBe(0.5)
    expect(find(items, 'soy sauce', 'tbsp')?.qty).toBe(2)
  })

  it('scales by each entry’s effective servings', () => {
    const items = list([
      entry({ id: '1', recipeId: 'adobo', date: TODAY, servingsOverride: 6 }),
      entry({ id: '2', recipeId: 'adobo', date: '2026-10-02' }),
    ])
    // 2 lb × 6/4 + 2 lb × 4/4
    expect(find(items, 'chicken', 'lb')?.qty).toBe(5)
  })

  it('marks quantity-less ingredients without inventing a number', () => {
    const adoboOnly = list([entry({ id: '1', recipeId: 'adobo', date: TODAY })])
    const pepper = find(adoboOnly, 'black pepper')
    expect(pepper?.qty).toBeUndefined()
    expect(pepper?.hasUnquantified).toBe(true)

    const both = list([
      entry({ id: '1', recipeId: 'adobo', date: TODAY }),
      entry({ id: '2', recipeId: 'fried', date: TODAY }),
    ])
    // Fried rice gives 1 × 4/2 = 2; adobo adds an unquantified "some".
    expect(find(both, 'black pepper')).toMatchObject({ qty: 2, hasUnquantified: true })
  })

  it('records which recipes need each item and how often', () => {
    const items = list([
      entry({ id: '1', recipeId: 'rice', date: TODAY }),
      entry({ id: '2', recipeId: 'rice', date: '2026-10-03' }),
      entry({ id: '3', recipeId: 'fried', date: TODAY }),
    ])
    expect(find(items, 'rice', 'cup')?.neededFor).toEqual([
      { name: 'Fried Rice', times: 1 },
      { name: 'Rice', times: 2 },
    ])
  })

  it('only includes entries inside the window', () => {
    const items = list([
      entry({ id: '1', recipeId: 'rice', date: '2026-09-30' }),
      entry({ id: '2', recipeId: 'rice', date: '2026-10-08' }),
    ])
    expect(items).toEqual([])
  })

  it('skips entries whose recipe no longer exists', () => {
    expect(list([entry({ id: '1', recipeId: 'deleted', date: TODAY })])).toEqual([])
  })

  it('sorts items alphabetically', () => {
    const items = list([entry({ id: '1', recipeId: 'adobo', date: TODAY })])
    expect(items.map((i) => i.name)).toEqual(['black pepper', 'chicken', 'soy sauce'])
  })
})

describe('setRange', () => {
  it('stores an explicit start, or drops it to follow today', () => {
    const withStart = setRange(data(), '2026-10-05', 3)
    expect(withStart.shopping).toMatchObject({ rangeStart: '2026-10-05', rangeDays: 3 })
    const followToday = setRange(withStart, undefined, 7)
    expect('rangeStart' in followToday.shopping).toBe(false)
    expect(followToday.shopping.rangeDays).toBe(7)
  })
})

describe('toggleChecked / clearChecked', () => {
  it('toggles a key on and off', () => {
    const on = toggleChecked(data(), 'rice|cup', ['rice|cup'])
    expect(on.shopping.checked).toEqual(['rice|cup'])
    expect(toggleChecked(on, 'rice|cup', ['rice|cup']).shopping.checked).toEqual([])
  })

  it('prunes checked keys that are no longer on the list', () => {
    const d = data({ shopping: { rangeDays: 7, checked: ['old|', 'rice|cup'] } })
    expect(toggleChecked(d, 'salt|', ['rice|cup', 'salt|']).shopping.checked).toEqual(['rice|cup', 'salt|'])
  })

  it('clears all checks', () => {
    const d = data({ shopping: { rangeDays: 7, checked: ['a', 'b'] } })
    expect(clearChecked(d).shopping.checked).toEqual([])
  })
})
