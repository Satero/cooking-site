import { describe, expect, it } from 'vitest'
import { parseIngredientLine, parseIngredients, parseSteps } from './parse'

describe('parseSteps', () => {
  it('splits one step per line and strips numbering and bullets', () => {
    expect(parseSteps('1. Chop\n2) Fry\nStep 3: Serve\n- Eat\n* Rest\n• Clean')).toEqual([
      'Chop',
      'Fry',
      'Serve',
      'Eat',
      'Rest',
      'Clean',
    ])
  })

  it('uses blank lines as separators when present, joining wrapped lines', () => {
    const text = '1. Marinate the chicken\nfor 30 minutes.\n\n2. Sear it\nskin-side down.'
    expect(parseSteps(text)).toEqual(['Marinate the chicken for 30 minutes.', 'Sear it skin-side down.'])
  })

  it('ignores extra blank lines and whitespace', () => {
    expect(parseSteps('\n\n  Chop  \n\n\n  Fry \n\n')).toEqual(['Chop', 'Fry'])
    expect(parseSteps('   ')).toEqual([])
  })
})

describe('parseIngredientLine', () => {
  it.each([
    ['2 cups rice', { qty: 2, unit: 'cups', name: 'rice' }],
    ['1 1/2 lb chicken thighs', { qty: 1.5, unit: 'lb', name: 'chicken thighs' }],
    ['½ cup soy sauce', { qty: 0.5, unit: 'cup', name: 'soy sauce' }],
    ['1½ tsp. salt', { qty: 1.5, unit: 'tsp', name: 'salt' }],
    ['6 garlic cloves', { qty: 6, name: 'garlic cloves' }],
    ['- 3 eggs', { qty: 3, name: 'eggs' }],
    ['black pepper', { name: 'black pepper' }],
  ])('parses %j', (line, expected) => {
    expect(parseIngredientLine(line)).toEqual(expected)
  })

  it('only takes a unit if the word is a recognized one', () => {
    expect(parseIngredientLine('2 large onions')).toEqual({ qty: 2, name: 'large onions' })
  })

  it('does not treat the name itself as a unit', () => {
    // "2 cans" alone: "cans" is a unit word but there's nothing left for a name.
    expect(parseIngredientLine('2 cans')).toEqual({ qty: 2, name: 'cans' })
  })

  it('returns null for blank lines', () => {
    expect(parseIngredientLine('   ')).toBeNull()
    expect(parseIngredientLine('-')).toBeNull()
  })
})

describe('parseIngredients', () => {
  it('parses each non-blank line', () => {
    expect(parseIngredients('2 cups rice\n\nsalt\n')).toEqual([{ qty: 2, unit: 'cups', name: 'rice' }, { name: 'salt' }])
  })
})
