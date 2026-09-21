import { useState } from 'react'
import { Link } from 'react-router'
import { Page } from '../components/Page'
import { useStore } from '../useStore'
import { searchRecipes } from '../data/recipes'

export function RecipesPage() {
  const { data } = useStore()
  const [query, setQuery] = useState('')

  const recipes = searchRecipes(data.recipes, query).sort((a, b) => a.name.localeCompare(b.name))

  return (
    <Page title="Recipes">
      <div className="row toolbar">
        <input
          type="search"
          placeholder="Search name, tag, or ingredient…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="grow"
        />
        <Link to="/recipes/new" className="button primary">
          + New recipe
        </Link>
      </div>

      {data.recipes.length === 0 ? (
        <p className="muted">No recipes yet. Add your first one.</p>
      ) : recipes.length === 0 ? (
        <p className="muted">Nothing matches "{query}".</p>
      ) : (
        <ul className="list">
          {recipes.map((r) => (
            <li key={r.id} className="card list-item">
              <div>
                <Link to={`/recipes/${r.id}`} className="list-title">
                  {r.name}
                </Link>
                <div className="muted small">
                  {r.servings} servings · {r.ingredients.length} ingredients · {r.steps.length} steps
                </div>
              </div>
              {r.tags.length > 0 && (
                <div className="tags">
                  {r.tags.map((t) => (
                    <span key={t} className="tag">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Page>
  )
}
