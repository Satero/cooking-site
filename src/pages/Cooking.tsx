import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Page } from '../components/Page'
import { useStore } from '../useStore'
import { todayISO } from '../storage'
import { MEAL_SLOTS, type MealSlot, type Recipe } from '../types'
import { effectiveServings } from '../data/schedule'
import { findRecipe, formatIngredient, scaleIngredients } from '../data/recipes'
import { generalLearnings, learningsForRecipe } from '../data/learnings'
import { shortDate } from '../data/dates'
import { readCheckedSteps, readExtraDishes, stepKey, writeCheckedSteps, writeExtraDishes } from '../session'

const SLOT_LABEL: Record<MealSlot, string> = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner' }

/** One thing being cooked: either a scheduled entry or an ad-hoc pick. */
type Dish = {
  /** Stable per-dish id used to key step progress. */
  key: string
  recipe: Recipe
  servings: number
  slot?: MealSlot
}

export function CookingPage() {
  const { data } = useStore()
  const today = todayISO()

  // Session state: checked steps and ad-hoc dishes both reset when the tab closes.
  const [checked, setChecked] = useState<Set<string>>(() => new Set(readCheckedSteps()))
  const [extraIds, setExtraIds] = useState<string[]>(readExtraDishes)
  const [picker, setPicker] = useState('')

  useEffect(() => writeCheckedSteps([...checked]), [checked])
  useEffect(() => writeExtraDishes(extraIds), [extraIds])

  const scheduled: Dish[] = MEAL_SLOTS.flatMap((slot) =>
    data.schedule
      .filter((e) => e.date === today && e.slot === slot)
      .flatMap((e) => {
        const recipe = findRecipe(data, e.recipeId)
        return recipe ? [{ key: `entry:${e.id}`, recipe, servings: effectiveServings(e, data.settings), slot }] : []
      }),
  )

  const scheduledRecipeIds = new Set(scheduled.map((d) => d.recipe.id))
  const extras: Dish[] = extraIds.flatMap((id) => {
    const recipe = findRecipe(data, id)
    return recipe ? [{ key: `recipe:${id}`, recipe, servings: data.settings.defaultServings }] : []
  })

  const dishes = [...scheduled, ...extras]
  const general = generalLearnings(data)

  const pickable = [...data.recipes]
    .filter((r) => !extraIds.includes(r.id))
    .sort((a, b) => a.name.localeCompare(b.name))

  function toggleStep(key: string) {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function clearDish(dishKey: string) {
    setChecked((prev) => new Set([...prev].filter((k) => !k.startsWith(`${dishKey}:`))))
  }

  return (
    <Page title="Cooking">
      <div className="row toolbar">
        <span className="muted">Today, {shortDate(today)}</span>
        <span className="grow" />
        {pickable.length > 0 && (
          <label className="row people">
            Also cooking
            <select
              value={picker}
              onChange={(e) => {
                if (!e.target.value) return
                setExtraIds((ids) => [...ids, e.target.value])
                setPicker('')
              }}
            >
              <option value="">Pick a recipe…</option>
              {pickable.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                  {scheduledRecipeIds.has(r.id) ? ' (already scheduled)' : ''}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {general.length > 0 && (
        <section className="card general-learnings">
          <h2>General learnings</h2>
          <ul>
            {general.map((l) => (
              <li key={l.id}>
                {l.text} <span className="muted small">({l.date})</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {dishes.length === 0 ? (
        <p className="muted">
          Nothing scheduled for today. <Link to="/schedule">Plan a meal</Link>, or pick a recipe above to cook
          something now.
        </p>
      ) : (
        dishes.map((dish) => (
          <DishCard
            key={dish.key}
            dish={dish}
            learnings={learningsForRecipe(data, dish.recipe.id)}
            checked={checked}
            onToggleStep={toggleStep}
            onResetSteps={() => clearDish(dish.key)}
            onRemove={dish.slot ? undefined : () => {
              clearDish(dish.key)
              setExtraIds((ids) => ids.filter((id) => id !== dish.recipe.id))
            }}
          />
        ))
      )}

      {dishes.length > 0 && (
        <p className="muted small">Step progress is kept until you close this tab, then it resets.</p>
      )}
    </Page>
  )
}

type DishCardProps = {
  dish: Dish
  learnings: ReturnType<typeof learningsForRecipe>
  checked: Set<string>
  onToggleStep: (key: string) => void
  onResetSteps: () => void
  /** Only ad-hoc dishes can be removed; scheduled ones come off the Schedule page. */
  onRemove?: () => void
}

function DishCard({ dish, learnings, checked, onToggleStep, onResetSteps, onRemove }: DishCardProps) {
  const { recipe, servings, slot } = dish
  const ingredients = scaleIngredients(recipe, servings)
  const done = recipe.steps.filter((_, i) => checked.has(stepKey(dish.key, i))).length
  const scaled = servings !== recipe.servings

  return (
    <section className="card dish">
      <div className="row dish-head">
        <h2>
          <Link to={`/recipes/${recipe.id}`}>{recipe.name}</Link>
        </h2>
        {slot && <span className="tag">{SLOT_LABEL[slot]}</span>}
        <span className="muted small">
          {servings} servings{scaled && ` (recipe serves ${recipe.servings})`}
        </span>
        <span className="grow" />
        {recipe.steps.length > 0 && (
          <span className="muted small">
            {done}/{recipe.steps.length} steps
          </span>
        )}
        {done > 0 && (
          <button className="link-btn" onClick={onResetSteps}>
            Reset
          </button>
        )}
        {onRemove && (
          <button className="link-btn danger" onClick={onRemove}>
            Remove
          </button>
        )}
      </div>

      <div className="two-col dish-body">
        <div>
          <h3>Ingredients</h3>
          {ingredients.length === 0 ? (
            <p className="muted">None listed.</p>
          ) : (
            <ul>
              {ingredients.map((i, idx) => (
                <li key={idx}>{formatIngredient(i)}</li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h3>Steps</h3>
          {recipe.steps.length === 0 ? (
            <p className="muted">
              No steps yet. <Link to={`/recipes/${recipe.id}/edit`}>Add some</Link>.
            </p>
          ) : (
            <ol className="steps">
              {recipe.steps.map((step, idx) => {
                const key = stepKey(dish.key, idx)
                const isDone = checked.has(key)
                return (
                  <li key={idx} className={isDone ? 'done' : ''}>
                    <label className="row step-label">
                      <input type="checkbox" checked={isDone} onChange={() => onToggleStep(key)} />
                      <span>{step}</span>
                    </label>
                  </li>
                )
              })}
            </ol>
          )}
        </div>
      </div>

      <div className="dish-learnings">
        <h3>Learnings for this dish</h3>
        {learnings.length === 0 ? (
          <p className="muted">
            None yet. <Link to={`/recipes/${recipe.id}`}>Add one</Link> after you cook.
          </p>
        ) : (
          <ul>
            {learnings.map((l) => (
              <li key={l.id}>
                {l.text} <span className="muted small">({l.date})</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
