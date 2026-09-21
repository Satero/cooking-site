import { useState } from 'react'
import { Link } from 'react-router'
import { useStore } from '../useStore'
import { deleteLearning, updateLearning } from '../data/learnings'
import { findRecipe } from '../data/recipes'
import type { Learning } from '../types'
import { LearningForm } from './LearningForm'

type Props = {
  learnings: Learning[]
  /** Hide the recipe name / General badge (when the list is already scoped to one recipe). */
  hideRecipe?: boolean
  emptyText?: string
}

/** Read-only list of learnings with inline edit and delete. */
export function LearningList({ learnings, hideRecipe, emptyText = 'No learnings yet.' }: Props) {
  const { data, update } = useStore()
  const [editingId, setEditingId] = useState<string | null>(null)

  if (learnings.length === 0) return <p className="muted">{emptyText}</p>

  function onDelete(l: Learning) {
    if (!confirm('Delete this learning?')) return
    update((d) => deleteLearning(d, l.id))
  }

  return (
    <ul className="list">
      {learnings.map((l) => {
        if (editingId === l.id) {
          return (
            <li key={l.id} className="card">
              <LearningForm
                learning={l}
                onSubmit={(input) => {
                  update((d) => updateLearning(d, l.id, input))
                  setEditingId(null)
                }}
                onCancel={() => setEditingId(null)}
              />
            </li>
          )
        }
        const recipe = l.recipeId ? findRecipe(data, l.recipeId) : undefined
        return (
          <li key={l.id} className="card learning">
            <div className="learning-head muted small">
              <span>{l.date}</span>
              {!hideRecipe &&
                (l.recipeId === null ? (
                  <span className="tag">General</span>
                ) : recipe ? (
                  <Link to={`/recipes/${recipe.id}`}>{recipe.name}</Link>
                ) : (
                  <span>Unknown recipe</span>
                ))}
              <span className="grow" />
              <button className="link-btn" onClick={() => setEditingId(l.id)}>
                Edit
              </button>
              <button className="link-btn danger" onClick={() => onDelete(l)}>
                Delete
              </button>
            </div>
            <p className="prewrap learning-text">{l.text}</p>
          </li>
        )
      })}
    </ul>
  )
}
