import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { Page } from '../components/Page'
import { useStore } from '../useStore'
import { deleteRecipe, findRecipe, formatIngredient } from '../data/recipes'
import { createLearning, learningsForRecipe } from '../data/learnings'
import { LearningForm } from '../components/LearningForm'
import { LearningList } from '../components/LearningList'

export function RecipeDetailPage() {
  const { id } = useParams()
  const { data, update } = useStore()
  const navigate = useNavigate()
  const recipe = findRecipe(data, id)
  const [addingLearning, setAddingLearning] = useState(false)

  if (!recipe) {
    return (
      <Page title="Recipe not found">
        <Link to="/recipes">← Back to recipes</Link>
      </Page>
    )
  }

  function onDelete() {
    if (!recipe) return
    const linked = data.learnings.filter((l) => l.recipeId === recipe.id).length
    const scheduled = data.schedule.filter((s) => s.recipeId === recipe.id).length
    const extra =
      linked || scheduled
        ? ` This also removes ${linked} learning(s) and ${scheduled} schedule entr${scheduled === 1 ? 'y' : 'ies'}.`
        : ''
    if (!confirm(`Delete "${recipe.name}"?${extra}`)) return
    update((d) => deleteRecipe(d, recipe.id))
    navigate('/recipes')
  }

  return (
    <Page title={recipe.name}>
      <div className="row toolbar">
        <Link to="/recipes">← All recipes</Link>
        <span className="grow" />
        <Link to={`/recipes/${recipe.id}/edit`} className="button">
          Edit
        </Link>
        <button className="btn-danger" onClick={onDelete}>
          Delete
        </button>
      </div>

      <div className="row meta">
        <span>{recipe.servings} servings</span>
        {recipe.tags.map((t) => (
          <span key={t} className="tag">
            {t}
          </span>
        ))}
        {recipe.sourceUrl && (
          <a href={recipe.sourceUrl} target="_blank" rel="noreferrer">
            Source ↗
          </a>
        )}
      </div>

      <div className="two-col">
        <section className="card">
          <h2>Ingredients</h2>
          {recipe.ingredients.length === 0 ? (
            <p className="muted">None listed.</p>
          ) : (
            <ul>
              {recipe.ingredients.map((i, idx) => (
                <li key={idx}>{formatIngredient(i)}</li>
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <h2>Steps</h2>
          {recipe.steps.length === 0 ? (
            <p className="muted">None listed.</p>
          ) : (
            <ol>
              {recipe.steps.map((s, idx) => (
                <li key={idx}>{s}</li>
              ))}
            </ol>
          )}
        </section>
      </div>

      {recipe.notes && (
        <section className="card">
          <h2>Notes</h2>
          <p className="prewrap">{recipe.notes}</p>
        </section>
      )}

      <section className="section">
        <div className="row toolbar">
          <h2>Learnings</h2>
          <span className="grow" />
          {!addingLearning && <button onClick={() => setAddingLearning(true)}>+ Add learning</button>}
        </div>
        {addingLearning && (
          <div className="card">
            <LearningForm
              fixedRecipeId={recipe.id}
              onSubmit={(input) => {
                update((d) => createLearning(d, input))
                setAddingLearning(false)
              }}
              onCancel={() => setAddingLearning(false)}
            />
          </div>
        )}
        <LearningList
          learnings={learningsForRecipe(data, recipe.id)}
          hideRecipe
          emptyText="No learnings for this recipe yet."
        />
      </section>
    </Page>
  )
}
