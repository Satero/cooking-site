import { describe, expect, it } from 'vitest'
import { canonicalUnit, isUnit } from './units'

describe('canonicalUnit', () => {
  it('folds plurals, abbreviations, case, and trailing dots', () => {
    expect(canonicalUnit('cups')).toBe('cup')
    expect(canonicalUnit('C')).toBe('cup')
    expect(canonicalUnit('Tablespoons')).toBe('tbsp')
    expect(canonicalUnit('tbsp.')).toBe('tbsp')
    expect(canonicalUnit(' lbs ')).toBe('lb')
  })

  it('lowercases unknown units so they still merge with themselves', () => {
    expect(canonicalUnit('Knob')).toBe('knob')
  })

  it('returns empty string for no unit', () => {
    expect(canonicalUnit(undefined)).toBe('')
    expect(canonicalUnit('')).toBe('')
  })
})

describe('isUnit', () => {
  it('recognizes known units in any form', () => {
    expect(isUnit('cups')).toBe(true)
    expect(isUnit('Tsp.')).toBe(true)
  })

  it('rejects ordinary words', () => {
    expect(isUnit('large')).toBe(false)
    expect(isUnit('onions')).toBe(false)
  })
})
