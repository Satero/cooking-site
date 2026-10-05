// Page-level tests: render the whole app (real router, real store, real
// localStorage via jsdom) and drive it like a user would. These cover the wiring
// between pages that the pure src/data/* tests can't see.

import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { exportJSON, load, save } from './storage'
import { sampleData } from './data/sample'

const TODAY = new Date(2026, 9, 1, 12, 0) // Thu Oct 1 2026, local noon

function renderAt(path: string) {
  window.history.pushState({}, '', `/#${path}`)
  return { user: userEvent.setup(), ...render(<App />) }
}

beforeEach(() => {
  // Fake only Date so "today" is fixed; real timers keep user-event working.
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(TODAY)
})

describe('Recipes', () => {
  it('creates a recipe from pasted ingredients and steps, and lists it', async () => {
    const { user } = renderAt('/recipes/new')

    await user.type(screen.getByLabelText('Name'), 'Garlic Rice')
    await user.click(screen.getByRole('button', { name: 'or paste a list…' }))
    await user.click(screen.getByPlaceholderText(/chicken thighs/))
    await user.paste('2 cups rice\n4 garlic cloves\nsalt')
    await user.click(screen.getByRole('button', { name: 'Add rows' }))

    await user.click(screen.getByRole('button', { name: 'or paste all steps…' }))
    await user.click(screen.getByPlaceholderText(/Marinate the chicken/))
    await user.paste('1. Fry the garlic.\n2. Add the rice.')
    await user.click(screen.getByRole('button', { name: 'Add rows' }))

    await user.click(screen.getByRole('button', { name: 'Create recipe' }))

    // Lands on the detail page with parsed ingredients and steps
    expect(screen.getByRole('heading', { level: 1, name: 'Garlic Rice' })).toBeInTheDocument()
    expect(screen.getByText('2 cups rice')).toBeInTheDocument()
    expect(screen.getByText('4 garlic cloves')).toBeInTheDocument()
    expect(screen.getByText('Add the rice.')).toBeInTheDocument()

    // Persisted to storage
    const [saved] = load().recipes
    expect(saved).toMatchObject({
      name: 'Garlic Rice',
      ingredients: [{ qty: 2, unit: 'cups', name: 'rice' }, { qty: 4, name: 'garlic cloves' }, { name: 'salt' }],
      steps: ['Fry the garlic.', 'Add the rice.'],
    })

    // And shows up on the list
    await user.click(screen.getByRole('link', { name: 'Recipes' }))
    expect(screen.getByRole('link', { name: 'Garlic Rice' })).toBeInTheDocument()
  })

  it('shows a validation error instead of saving bad input', async () => {
    const { user } = renderAt('/recipes/new')

    await user.type(screen.getByLabelText('Name'), 'Mystery')
    await user.type(screen.getAllByPlaceholderText('2')[0], 'a few')
    await user.type(screen.getByPlaceholderText('garlic'), 'eggs')
    await user.click(screen.getByRole('button', { name: 'Create recipe' }))

    expect(screen.getByText(/Can't read quantity "a few" for eggs/)).toBeInTheDocument()
    expect(load().recipes).toEqual([])
  })

  it('deleting a recipe also removes its learnings and schedule entries', async () => {
    save(sampleData())
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const { user } = renderAt('/recipes/sample-adobo')

    // The first Delete is the recipe's toolbar button; the rest belong to learning cards.
    await user.click(screen.getAllByRole('button', { name: 'Delete' })[0])

    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('Delete "Chicken Adobo"?'))
    const d = load()
    expect(d.recipes.some((r) => r.id === 'sample-adobo')).toBe(false)
    expect(d.learnings.some((l) => l.recipeId === 'sample-adobo')).toBe(false)
    expect(d.schedule.some((e) => e.recipeId === 'sample-adobo')).toBe(false)
  })
})

describe('Schedule', () => {
  it('shows a stacked day list instead of the week grid on narrow screens', () => {
    save(sampleData())
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: true,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }))
    const { container } = renderAt('/schedule')

    expect(container.querySelector('.week-grid')).toBeNull()
    const today = screen.getByRole('heading', { name: /Thursday Oct 1/ }).closest('section')!
    expect(within(today).getByText('Today')).toBeInTheDocument()
    expect(within(today).getByRole('link', { name: 'Chicken Adobo' })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(7)
  })
})

describe('Shopping', () => {
  it('lists scaled, merged ingredients from the schedule and remembers checked items', async () => {
    save(sampleData())
    const { user } = renderAt('/shopping')

    // Adobo today (4 servings, ×1) + day after tomorrow (6 servings, ×1.5): 2 lb + 3 lb chicken
    const chicken = screen.getByText('5 lb chicken thighs').closest('li')!
    expect(within(chicken).getByText('Chicken Adobo ×2')).toBeInTheDocument()

    // Soy sauce in cups (adobo) and tsp (cabbage) stays on separate lines
    expect(screen.getByText(/cup soy sauce$/)).toBeInTheDocument()
    expect(screen.getByText(/tsp soy sauce$/)).toBeInTheDocument()

    const before = screen.getByRole('button', { name: /Copy remaining/ }).textContent
    await user.click(within(chicken).getByRole('checkbox'))

    expect(within(chicken).getByRole('checkbox')).toBeChecked()
    expect(screen.getByRole('button', { name: /Copy remaining/ }).textContent).not.toBe(before)
    expect(load().shopping.checked).toEqual(['chicken thighs|lb'])
  })
})

describe('Cooking', () => {
  it("shows today's dishes with general learnings and tracks step progress in the session", async () => {
    save(sampleData())
    const { user } = renderAt('/cooking')

    // Today's dinner from the sample schedule
    expect(screen.getByRole('link', { name: 'Chicken Adobo' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Steamed Jasmine Rice' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Stir-fried Cabbage' })).toBeInTheDocument()

    expect(screen.getByRole('heading', { name: 'General learnings' })).toBeInTheDocument()
    expect(screen.getByText(/Salt in layers/)).toBeInTheDocument()

    // Cabbage recipe serves 2, scheduled for 4: scaled ×2
    const cabbage = screen.getByRole('link', { name: 'Stir-fried Cabbage' }).closest('section')!
    expect(within(cabbage).getByText('4 servings (recipe serves 2)')).toBeInTheDocument()
    expect(within(cabbage).getByText('2 tbsp neutral oil')).toBeInTheDocument()

    expect(within(cabbage).getByText('0/3 steps')).toBeInTheDocument()
    await user.click(within(cabbage).getAllByRole('checkbox')[0])
    expect(within(cabbage).getByText('1/3 steps')).toBeInTheDocument()

    // Kept in sessionStorage, not in the persistent store
    expect(JSON.parse(sessionStorage.getItem('cooking-site:session:steps')!)).toEqual(['entry:sample-s3:0'])
    expect(localStorage.getItem('cooking-site:data')).not.toContain('sample-s3:0')
  })
})

describe('Settings', () => {
  function importFile(contents: string) {
    const input = document.querySelector<HTMLInputElement>('input[type="file"]')!
    return { input, file: new File([contents], 'backup.json', { type: 'application/json' }) }
  }

  it('imports a backup after confirming', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const { user } = renderAt('/settings')

    const { input, file } = importFile(exportJSON(sampleData()))
    await user.upload(input, file)

    expect(await screen.findByText('Imported 4 recipes, 5 learnings, 7 schedule entries.')).toBeInTheDocument()
    expect(load().recipes).toHaveLength(4)
  })

  it('rejects a file that is not a backup and leaves data alone', async () => {
    save(sampleData())
    const { user } = renderAt('/settings')

    const { input, file } = importFile('{"hello":"world"}')
    await user.upload(input, file)

    expect(await screen.findByText('Import failed: Not a Cooking Site backup file')).toBeInTheDocument()
    expect(load().recipes).toHaveLength(4)
  })
})
