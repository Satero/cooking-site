import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { Page } from '../components/Page'
import { useStore } from '../useStore'
import { createRecipe, findRecipe, formatQtyInput, parseQty, updateRecipe, type RecipeInput } from '../data/recipes'
import { parseIngredients, parseSteps } from '../data/parse'
import { PasteBox } from '../components/PasteBox'
import type { Recipe } from '../types'

// Form-local shapes: everything is a string while editing, parsed on save.
type IngRow = { qty: string; unit: string; name: string }

type FormState = {
  name: string
  servings: string
  tags: string
  sourceUrl: string
  ingredients: IngRow[]
  steps: string[]
  notes: string
}

const emptyRow = (): IngRow => ({ qty: '', unit: '', name: '' })

function fromRecipe(r: Recipe | undefined): FormState {
  if (!r) {
    return { name: '', servings: '4', tags: '', sourceUrl: '', ingredients: [emptyRow()], steps: [''], notes: '' }
  }
  return {
    name: r.name,
    servings: String(r.servings),
    tags: r.tags.join(', '),
    sourceUrl: r.sourceUrl ?? '',
    ingredients: r.ingredients.length
      ? r.ingredients.map((i) => ({ qty: formatQtyInput(i.qty), unit: i.unit ?? '', name: i.name }))
      : [emptyRow()],
    steps: r.steps.length ? [...r.steps] : [''],
    notes: r.notes ?? '',
  }
}

/** Returns a RecipeInput, or an error message. Drops blank ingredient/step rows. */
function toInput(f: FormState): RecipeInput | string {
  const name = f.name.trim()
  if (!name) return 'Name is required.'
  const servings = Number(f.servings)
  if (!Number.isInteger(servings) || servings < 1) return 'Servings must be a whole number of at least 1.'

  const ingredients = []
  for (const row of f.ingredients) {
    const iname = row.name.trim()
    if (!iname) continue
    const qty = parseQty(row.qty)
    if (qty === null) return `Can't read quantity "${row.qty}" for ${iname}. Use numbers like 2, 1.5, or 1/2.`
    ingredients.push({ name: iname, ...(qty !== undefined && { qty }), ...(row.unit.trim() && { unit: row.unit.trim() }) })
  }

  const sourceUrl = f.sourceUrl.trim()
  const notes = f.notes.trim()
  return {
    name,
    servings,
    tags: f.tags.split(',').map((t) => t.trim()).filter(Boolean),
    ingredients,
    steps: f.steps.map((s) => s.trim()).filter(Boolean),
    ...(sourceUrl && { sourceUrl }),
    ...(notes && { notes }),
  }
}

// Keyed by route param so navigating between /new and /:id/edit resets form state
// instead of React reusing the same component instance.
export function RecipeFormPage() {
  const { id } = useParams()
  return <RecipeForm key={id ?? 'new'} id={id} />
}

function RecipeForm({ id }: { id: string | undefined }) {
  const { data, update } = useStore()
  const navigate = useNavigate()
  const existing = findRecipe(data, id)
  const isEdit = Boolean(id)

  const [form, setForm] = useState<FormState>(() => fromRecipe(existing))
  const [error, setError] = useState<string | null>(null)

  if (isEdit && !existing) {
    return (
      <Page title="Recipe not found">
        <Link to="/recipes">← Back to recipes</Link>
      </Page>
    )
  }

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }))

  // Ingredient row helpers
  const setIng = (idx: number, patch: Partial<IngRow>) =>
    set('ingredients', form.ingredients.map((r, i) => (i === idx ? { ...r, ...patch } : r)))
  const addIng = () => set('ingredients', [...form.ingredients, emptyRow()])
  const removeIng = (idx: number) =>
    set('ingredients', form.ingredients.length === 1 ? [emptyRow()] : form.ingredients.filter((_, i) => i !== idx))

  // Step helpers
  const setStep = (idx: number, value: string) => set('steps', form.steps.map((s, i) => (i === idx ? value : s)))
  const addStep = () => set('steps', [...form.steps, ''])
  const removeStep = (idx: number) =>
    set('steps', form.steps.length === 1 ? [''] : form.steps.filter((_, i) => i !== idx))
  const moveStep = (idx: number, dir: -1 | 1) => {
    const j = idx + dir
    if (j < 0 || j >= form.steps.length) return
    const next = [...form.steps]
    ;[next[idx], next[j]] = [next[j], next[idx]]
    set('steps', next)
  }

  // Paste helpers: append parsed rows, dropping the blank placeholder rows first
  // so pasting into a fresh form reads as "replace" and into a filled one as "add".
  function pasteIngredients(text: string): number {
    const parsed = parseIngredients(text)
    if (parsed.length === 0) return 0
    const kept = form.ingredients.filter((r) => r.name.trim())
    set('ingredients', [
      ...kept,
      ...parsed.map((i) => ({ qty: formatQtyInput(i.qty), unit: i.unit ?? '', name: i.name })),
    ])
    return parsed.length
  }

  function pasteSteps(text: string): number {
    const parsed = parseSteps(text)
    if (parsed.length === 0) return 0
    set('steps', [...form.steps.filter((s) => s.trim()), ...parsed])
    return parsed.length
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const input = toInput(form)
    if (typeof input === 'string') {
      setError(input)
      return
    }
    if (isEdit && existing) {
      update((d) => updateRecipe(d, existing.id, input))
      navigate(`/recipes/${existing.id}`)
    } else {
      let newId = ''
      update((d) => {
        const res = createRecipe(d, input)
        newId = res.id
        return res.data
      })
      navigate(`/recipes/${newId}`)
    }
  }

  return (
    <Page title={isEdit ? `Edit: ${existing!.name}` : 'New recipe'}>
      <form onSubmit={onSubmit} className="form">
        <label>
          Name
          <input value={form.name} onChange={(e) => set('name', e.target.value)} required autoFocus />
        </label>

        <div className="row">
          <label>
            Servings
            <input
              type="number"
              min={1}
              step={1}
              value={form.servings}
              onChange={(e) => set('servings', e.target.value)}
              className="narrow"
            />
          </label>
          <label className="grow">
            Tags <span className="muted small">(comma-separated)</span>
            <input value={form.tags} onChange={(e) => set('tags', e.target.value)} placeholder="filipino, weeknight" />
          </label>
        </div>

        <label>
          Source URL
          <input type="url" value={form.sourceUrl} onChange={(e) => set('sourceUrl', e.target.value)} placeholder="https://" />
        </label>

        <fieldset>
          <legend>Ingredients</legend>
          <div className="ing-grid ing-head muted small">
            <span>Qty</span>
            <span>Unit</span>
            <span>Ingredient</span>
            <span />
          </div>
          {form.ingredients.map((row, idx) => (
            <div key={idx} className="ing-grid">
              <input value={row.qty} onChange={(e) => setIng(idx, { qty: e.target.value })} placeholder="2" />
              <input value={row.unit} onChange={(e) => setIng(idx, { unit: e.target.value })} placeholder="cloves" />
              <input value={row.name} onChange={(e) => setIng(idx, { name: e.target.value })} placeholder="garlic" />
              <button type="button" onClick={() => removeIng(idx)} aria-label="Remove ingredient" className="icon-btn">
                ✕
              </button>
            </div>
          ))}
          <div className="row">
            <button type="button" onClick={addIng}>
              + Add ingredient
            </button>
            <PasteBox
              label="or paste a list…"
              placeholder={'1 1/2 lb chicken thighs\n6 garlic cloves\n1/2 cup soy sauce\nblack pepper'}
              hint="One ingredient per line. Quantities and units are split out automatically; anything it can't read stays in the name."
              onPaste={pasteIngredients}
            />
          </div>
        </fieldset>

        <fieldset>
          <legend>Steps</legend>
          {form.steps.map((step, idx) => (
            <div key={idx} className="step-row">
              <span className="step-num">{idx + 1}.</span>
              <textarea value={step} onChange={(e) => setStep(idx, e.target.value)} rows={2} />
              <div className="step-btns">
                <button type="button" onClick={() => moveStep(idx, -1)} disabled={idx === 0} aria-label="Move up" className="icon-btn">
                  ↑
                </button>
                <button type="button" onClick={() => moveStep(idx, 1)} disabled={idx === form.steps.length - 1} aria-label="Move down" className="icon-btn">
                  ↓
                </button>
                <button type="button" onClick={() => removeStep(idx)} aria-label="Remove step" className="icon-btn">
                  ✕
                </button>
              </div>
            </div>
          ))}
          <div className="row">
            <button type="button" onClick={addStep}>
              + Add step
            </button>
            <PasteBox
              label="or paste all steps…"
              placeholder={'1. Marinate the chicken for 30 min.\n2. Sear skin-side down until browned.\n3. Simmer covered 30 min.'}
              hint="Numbering and bullets are stripped. Blank lines separate steps if present, otherwise each line is one step."
              onPaste={pasteSteps}
            />
          </div>
        </fieldset>

        <label>
          Notes
          <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={3} />
        </label>

        {error && <p className="message error">{error}</p>}

        <div className="row">
          <button type="submit" className="primary">
            {isEdit ? 'Save changes' : 'Create recipe'}
          </button>
          <Link to={isEdit ? `/recipes/${id}` : '/recipes'} className="button">
            Cancel
          </Link>
        </div>
      </form>
    </Page>
  )
}
