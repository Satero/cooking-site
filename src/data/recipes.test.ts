import { describe, expect, it } from 'vitest'
import {
  createRecipe,
  deleteRecipe,
  formatIngredient,
  formatQty,
  formatQtyInput,
  parseQty,
  scaleIngredients,
  searchRecipes,
  updateRecipe,
} from './recipes'
import { data, entry, learning, recipe } from '../test/fixtures'

describe('parseQty', () => {
  it.each([
    ['2', 2],
    ['1.5', 1.5],
    ['1/2', 0.5],
    ['1 1/2', 1.5],
    ['½', 0.5],
    ['1½', 1.5],
    ['  3  ', 3],
  ])('reads %j as %d', (text, expected) => {
    expect(parseQty(text)).toBeCloseTo(expected)
  })

  it('returns undefined for blank input (no quantity)', () => {
    expect(parseQty('')).toBeUndefined()
    expect(parseQty('   ')).toBeUndefined()
  })

  it('returns null for things it cannot read', () => {
    expect(parseQty('a few')).toBeNull()
    expect(parseQty('-2')).toBeNull()
    expect(parseQty('1/0')).toBeNull()
  })
})

describe('formatQty / formatQtyInput', () => {
  it('displays unicode fractions', () => {
    expect(formatQty(0.5)).toBe('½')
    expect(formatQty(1.5)).toBe('1½')
    expect(formatQty(2)).toBe('2')
    expect(formatQty(1 / 3)).toBe('⅓')
    expect(formatQty(1.37)).toBe('1.37')
    expect(formatQty(undefined)).toBe('')
  })

  it('uses ASCII fractions for form inputs', () => {
    expect(formatQtyInput(0.5)).toBe('1/2')
    expect(formatQtyInput(1.5)).toBe('1 1/2')
    expect(formatQtyInput(2)).toBe('2')
  })

  // Regression (M1): the edit form showed "1½", which the parser couldn't read back.
  it.each([0.25, 0.5, 0.75, 1, 1.5, 2.25, 10])('round-trips %d through the edit form', (qty) => {
    expect(parseQty(formatQtyInput(qty))).toBeCloseTo(qty)
  })
})

describe('formatIngredient', () => {
  it('joins the parts that are present', () => {
    expect(formatIngredient({ qty: 1.5, unit: 'cup', name: 'rice' })).toBe('1½ cup rice')
    expect(formatIngredient({ qty: 3, name: 'eggs' })).toBe('3 eggs')
    expect(formatIngredient({ name: 'salt' })).toBe('salt')
  })
})

describe('scaleIngredients', () => {
  const r = recipe({
    id: 'r',
    servings: 4,
    ingredients: [
      { qty: 2, unit: 'cup', name: 'rice' },
      { name: 'black pepper' },
    ],
  })

  it('scales by servings / recipe.servings', () => {
    expect(scaleIngredients(r, 6)[0].qty).toBe(3)
    expect(scaleIngredients(r, 2)[0].qty).toBe(1)
  })

  it('passes quantity-less ingredients through unscaled', () => {
    expect(scaleIngredients(r, 8)[1]).toEqual({ name: 'black pepper' })
  })

  it('does not mutate the recipe', () => {
    scaleIngredients(r, 8)
    expect(r.ingredients[0].qty).toBe(2)
  })

  it('treats a zero-servings recipe as unscaled', () => {
    expect(scaleIngredients({ ...r, servings: 0 }, 6)[0].qty).toBe(2)
  })
})

describe('create / update / delete', () => {
  const input = { name: 'Adobo', servings: 4, tags: [], sourceUrls: [], ingredients: [], steps: [] }

  it('creates a recipe with an id and timestamps', () => {
    const { data: next, id } = createRecipe(data(), input)
    expect(next.recipes).toHaveLength(1)
    expect(next.recipes[0]).toMatchObject({ ...input, id })
    expect(next.recipes[0].createdAt).toBe(next.recipes[0].updatedAt)
  })

  it('updates only the matching recipe', () => {
    const d = data({ recipes: [recipe({ id: 'a' }), recipe({ id: 'b' })] })
    const next = updateRecipe(d, 'a', { ...input, name: 'Renamed' })
    expect(next.recipes.map((r) => r.name)).toEqual(['Renamed', 'b'])
    expect(next.recipes[0].createdAt).toBe(d.recipes[0].createdAt)
  })

  it('cascades a delete to the recipe’s learnings and schedule entries', () => {
    const d = data({
      recipes: [recipe({ id: 'a' }), recipe({ id: 'b' })],
      learnings: [learning({ id: 'la', recipeId: 'a' }), learning({ id: 'lb', recipeId: 'b' }), learning({ id: 'lg' })],
      schedule: [entry({ id: 'sa', recipeId: 'a', date: '2026-10-01' }), entry({ id: 'sb', recipeId: 'b', date: '2026-10-01' })],
    })
    const next = deleteRecipe(d, 'a')
    expect(next.recipes.map((r) => r.id)).toEqual(['b'])
    expect(next.learnings.map((l) => l.id)).toEqual(['lb', 'lg'])
    expect(next.schedule.map((s) => s.id)).toEqual(['sb'])
  })
})

describe('searchRecipes', () => {
  const recipes = [
    recipe({ id: 'adobo', name: 'Chicken Adobo', tags: ['filipino'], ingredients: [{ name: 'soy sauce' }] }),
    recipe({ id: 'rice', name: 'Jasmine Rice', tags: ['staple'], ingredients: [{ name: 'rice' }] }),
  ]

  it('matches name, tag, or ingredient, case-insensitively', () => {
    expect(searchRecipes(recipes, 'ADOBO').map((r) => r.id)).toEqual(['adobo'])
    expect(searchRecipes(recipes, 'staple').map((r) => r.id)).toEqual(['rice'])
    expect(searchRecipes(recipes, 'soy').map((r) => r.id)).toEqual(['adobo'])
  })

  it('returns everything for a blank query', () => {
    expect(searchRecipes(recipes, '  ')).toHaveLength(2)
  })
})
