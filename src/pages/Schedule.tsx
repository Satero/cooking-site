import { useState } from 'react'
import { Link } from 'react-router'
import { Page } from '../components/Page'
import { useStore } from '../useStore'
import { todayISO } from '../storage'
import { MEAL_SLOTS, type DateISO, type MealSlot } from '../types'
import { addDays, dateRange, rangeLabel, shortDate, startOfWeek } from '../data/dates'
import { addEntry, entriesFor, removeEntry, setServings } from '../data/schedule'
import { findRecipe } from '../data/recipes'

const SLOT_LABEL: Record<MealSlot, string> = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner' }
const WEEKDAY_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function SchedulePage() {
  const { data } = useStore()
  const today = todayISO()
  const [weekStart, setWeekStart] = useState<DateISO>(() => startOfWeek(today))
  const days = dateRange(weekStart, 7)

  return (
    <Page title="Schedule" wide>
      <div className="row toolbar">
        <button onClick={() => setWeekStart(addDays(weekStart, -7))} aria-label="Previous week">
          ←
        </button>
        <button onClick={() => setWeekStart(startOfWeek(today))}>Today</button>
        <button onClick={() => setWeekStart(addDays(weekStart, 7))} aria-label="Next week">
          →
        </button>
        <strong className="week-label">{rangeLabel(weekStart, days[6])}</strong>
      </div>

      {data.recipes.length === 0 && (
        <p className="message">
          No recipes yet — <Link to="/recipes/new">add one</Link> before scheduling.
        </p>
      )}

      <div className="week-grid">
        <div className="week-corner" />
        {days.map((d) => {
          const dow = new Date(d + 'T00:00').getDay()
          return (
            <div key={d} className={`week-day-head${d === today ? ' today' : ''}`}>
              <div className="small muted">{WEEKDAY_LONG[dow].slice(0, 3)}</div>
              <div>{shortDate(d)}</div>
            </div>
          )
        })}
        {MEAL_SLOTS.map((slot) => (
          <SlotRow key={slot} slot={slot} days={days} today={today} />
        ))}
      </div>
    </Page>
  )
}

function SlotRow({ slot, days, today }: { slot: MealSlot; days: DateISO[]; today: DateISO }) {
  return (
    <>
      <div className="week-slot-head">{SLOT_LABEL[slot]}</div>
      {days.map((d) => (
        <SlotCell key={d} date={d} slot={slot} isToday={d === today} />
      ))}
    </>
  )
}

function SlotCell({ date, slot, isToday }: { date: DateISO; slot: MealSlot; isToday: boolean }) {
  const { data, update } = useStore()
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const entries = entriesFor(data, date, slot)

  return (
    <div className={`week-cell${isToday ? ' today' : ''}`}>
      {entries.map((e) => {
        const recipe = findRecipe(data, e.recipeId)
        if (!recipe) return null
        if (editingId === e.id) {
          return (
            <EntryEditor
              key={e.id}
              recipeId={e.recipeId}
              servings={e.servingsOverride}
              lockRecipe
              onSave={(_, servings) => {
                update((d) => setServings(d, e.id, servings))
                setEditingId(null)
              }}
              onCancel={() => setEditingId(null)}
            />
          )
        }
        return (
          <div key={e.id} className="entry">
            <Link to={`/recipes/${recipe.id}`} className="entry-name" title={recipe.name}>
              {recipe.name}
            </Link>
            <button
              className="entry-servings"
              onClick={() => setEditingId(e.id)}
              title="Change servings"
            >
              {e.servingsOverride ?? recipe.servings}
              {e.servingsOverride !== undefined && '*'}
            </button>
            <button
              className="icon-btn entry-remove"
              onClick={() => update((d) => removeEntry(d, e.id))}
              aria-label={`Remove ${recipe.name}`}
            >
              ✕
            </button>
          </div>
        )
      })}
      {adding ? (
        <EntryEditor
          onSave={(recipeId, servings) => {
            update((d) => addEntry(d, { date, slot, recipeId, ...(servings !== undefined && { servingsOverride: servings }) }))
            setAdding(false)
          }}
          onCancel={() => setAdding(false)}
        />
      ) : (
        data.recipes.length > 0 && (
          <button className="add-entry" onClick={() => setAdding(true)} aria-label={`Add to ${slot} on ${date}`}>
            +
          </button>
        )
      )}
    </div>
  )
}

type EditorProps = {
  recipeId?: string
  servings?: number
  lockRecipe?: boolean
  onSave: (recipeId: string, servingsOverride: number | undefined) => void
  onCancel: () => void
}

/** Inline picker: recipe + optional servings override. Blank servings = use the recipe's default. */
function EntryEditor({ recipeId: initialRecipe, servings: initialServings, lockRecipe, onSave, onCancel }: EditorProps) {
  const { data } = useStore()
  const recipes = [...data.recipes].sort((a, b) => a.name.localeCompare(b.name))
  const [recipeId, setRecipeId] = useState(initialRecipe ?? recipes[0]?.id ?? '')
  const [servings, setServingsText] = useState(initialServings !== undefined ? String(initialServings) : '')
  const recipe = findRecipe(data, recipeId)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!recipeId) return
    const n = servings.trim() === '' ? undefined : Number(servings)
    if (n !== undefined && (!Number.isInteger(n) || n < 1)) return
    // An override equal to the recipe default is just noise — store nothing.
    onSave(recipeId, n === recipe?.servings ? undefined : n)
  }

  return (
    <form onSubmit={submit} className="entry-editor">
      {!lockRecipe && (
        <select value={recipeId} onChange={(e) => setRecipeId(e.target.value)} autoFocus>
          {recipes.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      )}
      <input
        type="number"
        min={1}
        step={1}
        value={servings}
        onChange={(e) => setServingsText(e.target.value)}
        placeholder={recipe ? `${recipe.servings} srv` : 'srv'}
        title="Servings (blank = recipe default)"
        autoFocus={lockRecipe}
      />
      <div className="row">
        <button type="submit" className="primary small-btn">
          {lockRecipe ? 'Save' : 'Add'}
        </button>
        <button type="button" className="small-btn" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}

