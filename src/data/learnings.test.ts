import { describe, expect, it } from 'vitest'
import { createLearning, deleteLearning, generalLearnings, learningsForRecipe, updateLearning } from './learnings'
import { data, learning } from '../test/fixtures'

const d = data({
  learnings: [
    learning({ id: 'old', recipeId: 'r', date: '2026-09-01' }),
    learning({ id: 'general', recipeId: null, date: '2026-09-15' }),
    learning({ id: 'new', recipeId: 'r', date: '2026-09-20' }),
    learning({ id: 'other', recipeId: 'x', date: '2026-09-25' }),
  ],
})

describe('learningsForRecipe / generalLearnings', () => {
  it('returns only that recipe’s learnings, newest first', () => {
    expect(learningsForRecipe(d, 'r').map((l) => l.id)).toEqual(['new', 'old'])
  })

  it('returns learnings with recipeId null as general', () => {
    expect(generalLearnings(d).map((l) => l.id)).toEqual(['general'])
  })
})

describe('create / update / delete', () => {
  it('creates with a fresh id', () => {
    const next = createLearning(data(), { recipeId: null, date: '2026-10-01', text: 'Salt early' })
    expect(next.learnings[0]).toMatchObject({ recipeId: null, text: 'Salt early' })
    expect(next.learnings[0].id).toBeTruthy()
  })

  it('updates and deletes by id', () => {
    const updated = updateLearning(d, 'old', { recipeId: 'r', date: '2026-09-01', text: 'edited' })
    expect(updated.learnings.find((l) => l.id === 'old')?.text).toBe('edited')
    expect(deleteLearning(d, 'old').learnings.map((l) => l.id)).toEqual(['general', 'new', 'other'])
  })
})
