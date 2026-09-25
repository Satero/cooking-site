// Sample data, loadable from Settings. Gives a new install something to look at
// on all five pages instead of five empty states. Not loaded automatically —
// nobody wants to delete someone else's recipes before adding their own.

import type { AppData } from '../types'
import { todayISO } from '../storage'
import { addDays } from './dates'

export function sampleData(): AppData {
  const now = new Date().toISOString()
  const today = todayISO()
  const recipe = (
    id: string,
    name: string,
    servings: number,
    tags: string[],
    ingredients: AppData['recipes'][number]['ingredients'],
    steps: string[],
    extra: { sourceUrl?: string; notes?: string } = {},
  ) => ({ id, name, servings, tags, ingredients, steps, createdAt: now, updatedAt: now, ...extra })

  return {
    recipes: [
      recipe(
        'sample-adobo',
        'Chicken Adobo',
        4,
        ['filipino', 'weeknight'],
        [
          { qty: 2, unit: 'lb', name: 'chicken thighs' },
          { qty: 0.5, unit: 'cup', name: 'soy sauce' },
          { qty: 0.5, unit: 'cup', name: 'white vinegar' },
          { qty: 6, name: 'garlic cloves' },
          { qty: 3, name: 'bay leaves' },
          { name: 'black peppercorns' },
        ],
        [
          'Marinate the chicken in soy sauce, vinegar, garlic and bay leaves for at least 30 minutes.',
          'Lift the chicken out, reserving the marinade. Sear skin-side down in a hot pan until browned.',
          'Pour the marinade back in, bring to a boil, then simmer covered for 30 minutes.',
          'Uncover and reduce the sauce until it glazes the chicken.',
        ],
        { notes: 'Better the next day.' },
      ),
      recipe(
        'sample-cabbage',
        'Stir-fried Cabbage',
        2,
        ['side', 'quick'],
        [
          { qty: 1, name: 'small cabbage' },
          { qty: 2, name: 'garlic cloves' },
          { qty: 1, unit: 'tbsp', name: 'neutral oil' },
          { qty: 1, unit: 'tsp', name: 'soy sauce' },
        ],
        ['Slice the cabbage thin and mince the garlic.', 'Fry on high heat 4 minutes, tossing.', 'Finish with soy sauce.'],
      ),
      recipe(
        'sample-rice',
        'Steamed Jasmine Rice',
        4,
        ['staple'],
        [
          { qty: 2, unit: 'cup', name: 'jasmine rice' },
          { qty: 3, unit: 'cup', name: 'water' },
        ],
        ['Rinse the rice until the water runs clear.', 'Bring to a boil, then cover and cook on low 18 minutes.', 'Rest 10 minutes off the heat before fluffing.'],
      ),
      recipe(
        'sample-eggs',
        'Soft Scrambled Eggs',
        1,
        ['breakfast', 'quick'],
        [
          { qty: 3, name: 'eggs' },
          { qty: 1, unit: 'tbsp', name: 'butter' },
          { name: 'salt' },
        ],
        ['Beat the eggs well.', 'Melt butter in a cold pan, add eggs, and stir constantly on low heat.', 'Pull off the heat while still slightly wet.'],
        { sourceUrl: 'https://example.com/scrambled-eggs' },
      ),
    ],
    learnings: [
      { id: 'sample-l1', recipeId: null, date: addDays(today, -21), text: 'Read the whole recipe before starting — twice I have been halfway in before noticing a marinating step.' },
      { id: 'sample-l2', recipeId: null, date: addDays(today, -14), text: 'Salt in layers as you go, not all at the end.' },
      { id: 'sample-l3', recipeId: 'sample-adobo', date: addDays(today, -12), text: 'Half the soy sauce was plenty — the full amount was too salty for us.' },
      { id: 'sample-l4', recipeId: 'sample-adobo', date: addDays(today, -5), text: 'Reducing the sauce an extra 10 minutes made it glossy instead of watery. Worth the wait.' },
      { id: 'sample-l5', recipeId: 'sample-rice', date: addDays(today, -5), text: 'Do not skip the 10 minute rest, the bottom layer stays wet otherwise.' },
    ],
    schedule: [
      { id: 'sample-s1', date: today, slot: 'dinner', recipeId: 'sample-adobo' },
      { id: 'sample-s2', date: today, slot: 'dinner', recipeId: 'sample-rice' },
      { id: 'sample-s3', date: today, slot: 'dinner', recipeId: 'sample-cabbage', servingsOverride: 4 },
      { id: 'sample-s4', date: addDays(today, 1), slot: 'breakfast', recipeId: 'sample-eggs', servingsOverride: 2 },
      { id: 'sample-s5', date: addDays(today, 2), slot: 'dinner', recipeId: 'sample-adobo', servingsOverride: 6 },
      { id: 'sample-s6', date: addDays(today, 2), slot: 'dinner', recipeId: 'sample-rice' },
      { id: 'sample-s7', date: addDays(today, 4), slot: 'lunch', recipeId: 'sample-cabbage' },
    ],
    shopping: { rangeDays: 7, checked: [] },
    settings: { defaultServings: 4 },
  }
}
