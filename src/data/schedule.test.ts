import { describe, expect, it } from 'vitest'
import { addEntry, effectiveServings, entriesFor, entriesInRange, removeEntry, setDefaultServings, setServings } from './schedule'
import { data, entry } from '../test/fixtures'

describe('effectiveServings', () => {
  const settings = { defaultServings: 4 }

  it('uses the override when set', () => {
    expect(effectiveServings(entry({ id: 'e', recipeId: 'r', date: '2026-10-01', servingsOverride: 2 }), settings)).toBe(2)
  })

  it('falls back to the household default', () => {
    expect(effectiveServings(entry({ id: 'e', recipeId: 'r', date: '2026-10-01' }), settings)).toBe(4)
  })

  // Intentional (M3.5): entries without an override follow later changes to the default.
  it('follows a changed household default for entries without an override', () => {
    const d = setDefaultServings(data({ schedule: [entry({ id: 'e', recipeId: 'r', date: '2026-10-01' })] }), 6)
    expect(effectiveServings(d.schedule[0], d.settings)).toBe(6)
  })
})

describe('addEntry / setServings / removeEntry', () => {
  it('adds an entry with a fresh id', () => {
    const d = addEntry(data(), { date: '2026-10-01', slot: 'lunch', recipeId: 'r' })
    expect(d.schedule).toHaveLength(1)
    expect(d.schedule[0]).toMatchObject({ date: '2026-10-01', slot: 'lunch', recipeId: 'r' })
    expect(d.schedule[0].id).toBeTruthy()
  })

  it('sets and clears an override', () => {
    const d = data({ schedule: [entry({ id: 'e', recipeId: 'r', date: '2026-10-01' })] })
    const set = setServings(d, 'e', 8)
    expect(set.schedule[0].servingsOverride).toBe(8)
    const cleared = setServings(set, 'e', undefined)
    expect('servingsOverride' in cleared.schedule[0]).toBe(false)
  })

  it('removes only the matching entry', () => {
    const d = data({
      schedule: [entry({ id: 'a', recipeId: 'r', date: '2026-10-01' }), entry({ id: 'b', recipeId: 'r', date: '2026-10-01' })],
    })
    expect(removeEntry(d, 'a').schedule.map((e) => e.id)).toEqual(['b'])
  })
})

describe('entriesFor / entriesInRange', () => {
  const d = data({
    schedule: [
      entry({ id: 'late', recipeId: 'r', date: '2026-10-03', slot: 'breakfast' }),
      entry({ id: 'dinner', recipeId: 'r', date: '2026-10-01', slot: 'dinner' }),
      entry({ id: 'breakfast', recipeId: 'r', date: '2026-10-01', slot: 'breakfast' }),
      entry({ id: 'outside', recipeId: 'r', date: '2026-10-08', slot: 'lunch' }),
    ],
  })

  it('filters by date and slot', () => {
    expect(entriesFor(d, '2026-10-01', 'dinner').map((e) => e.id)).toEqual(['dinner'])
  })

  it('returns entries in the window, ordered by date then meal slot', () => {
    expect(entriesInRange(d, '2026-10-01', 7).map((e) => e.id)).toEqual(['breakfast', 'dinner', 'late'])
  })

  it('treats the window as inclusive of its last day', () => {
    expect(entriesInRange(d, '2026-10-02', 7).map((e) => e.id)).toEqual(['late', 'outside'])
  })
})
