import { useState } from 'react'
import { useStore } from '../useStore'
import { todayISO } from '../storage'
import type { Learning } from '../types'
import type { LearningInput } from '../data/learnings'

type Props = {
  /** Existing learning to edit; omit to create. */
  learning?: Learning
  /** Preselect (and lock) the recipe — used on the recipe detail page. */
  fixedRecipeId?: string
  onSubmit: (input: LearningInput) => void
  onCancel?: () => void
}

/** Inline form for one learning: date, recipe (or General), text. */
export function LearningForm({ learning, fixedRecipeId, onSubmit, onCancel }: Props) {
  const { data } = useStore()
  const [date, setDate] = useState(learning?.date ?? todayISO())
  const [recipeId, setRecipeId] = useState<string>(fixedRecipeId ?? learning?.recipeId ?? '')
  const [text, setText] = useState(learning?.text ?? '')
  const [error, setError] = useState<string | null>(null)

  const recipes = [...data.recipes].sort((a, b) => a.name.localeCompare(b.name))

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) {
      setError('Write something first.')
      return
    }
    if (!date) {
      setError('Date is required.')
      return
    }
    onSubmit({ date, recipeId: recipeId || null, text: text.trim() })
    if (!learning) {
      setText('')
      setError(null)
    }
  }

  return (
    <form onSubmit={submit} className="form learning-form">
      <div className="row">
        <label>
          Date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </label>
        <label className="grow">
          Recipe
          <select value={recipeId} onChange={(e) => setRecipeId(e.target.value)} disabled={Boolean(fixedRecipeId)}>
            <option value="">General (applies to all cooking)</option>
            {recipes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label>
        What did you learn?
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="e.g. Used half the soy sauce — much better balance."
          autoFocus={Boolean(learning)}
        />
      </label>
      {error && <p className="message error">{error}</p>}
      <div className="row">
        <button type="submit" className="primary">
          {learning ? 'Save' : 'Add learning'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
