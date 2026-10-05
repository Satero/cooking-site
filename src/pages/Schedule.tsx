import { useState } from 'react'
import { Link } from 'react-router'
import { Page } from '../components/Page'
import { useStore } from '../useStore'
import { todayISO } from '../storage'
import { MEAL_SLOTS, type DateISO, type MealSlot } from '../types'
import { addDays, dateRange, fromISO, rangeLabel, shortDate, startOfWeek } from '../data/dates'
import { addEntry, effectiveServings, entriesFor, removeEntry, setDefaultServings, setServings } from '../data/schedule'
import { findRecipe } from '../data/recipes'
import { SCHEDULE_LIST_QUERY, useMediaQuery } from '../useMediaQuery'

const SLOT_LABEL: Record<MealSlot, string> = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner' }
const WEEKDAY_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function SchedulePage() {
  const { data, update } = useStore()
  const today = todayISO()
  const [weekStart, setWeekStart] = useState<DateISO>(() => startOfWeek(today))
  const days = dateRange(weekStart, 7)
  const asList = useMediaQuery(SCHEDULE_LIST_QUERY)

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
        <span className="grow" />
        <label className="row people">
          Cooking for
          <input
            type="number"
            min={1}
            step={1}
            value={data.settings.defaultServings}
            onChange={(e) => {
              const n = Number(e.target.value)
              if (Number.isInteger(n) && n >= 1) update((d) => setDefaultServings(d, n))
            }}
            className="narrow"
          />
          people
        </label>
      </div>

      {data.recipes.length === 0 && (
        <p className="message">
          No recipes yet — <Link to="/recipes/new">add one</Link> before scheduling.
        </p>
      )}

      {asList ? (
        <DayList days={days} today={today} />
      ) : (
        <div className="week-grid">
          <div className="week-corner" />
          {days.map((d) => (
            <div key={d} className={`week-day-head${d === today ? ' today' : ''}`}>
              <div className="small muted">{WEEKDAY_LONG[fromISO(d).getDay()].slice(0, 3)}</div>
              <div>{shortDate(d)}</div>
            </div>
          ))}
          {MEAL_SLOTS.map((slot) => (
            <SlotRow key={slot} slot={slot} days={days} today={today} />
          ))}
        </div>
      )}
    </Page>
  )
}

/** Phone/tablet layout: one block per day, meal slots stacked inside it. */
function DayList({ days, today }: { days: DateISO[]; today: DateISO }) {
  return (
    <div className="day-list">
      {days.map((d) => (
        <section key={d} className={`card day${d === today ? ' today' : ''}`}>
          <h2 className="day-head">
            {WEEKDAY_LONG[fromISO(d).getDay()]} <span className="muted">{shortDate(d)}</span>
            {d === today && <span className="tag">Today</span>}
          </h2>
          {MEAL_SLOTS.map((slot) => (
            <div key={slot} className="day-slot">
              <span className="day-slot-head muted small">{SLOT_LABEL[slot]}</span>
              <SlotCell date={d} slot={slot} isToday={false} />
            </div>
          ))}
        </section>
      ))}
    </div>
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
              {effectiveServings(e, data.settings)}
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
  const defaultServings = data.settings.defaultServings

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!recipeId) return
    const n = servings.trim() === '' ? undefined : Number(servings)
    if (n !== undefined && (!Number.isInteger(n) || n < 1)) return
    // An override equal to the household default is just noise — store nothing.
    onSave(recipeId, n === defaultServings ? undefined : n)
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
        placeholder={`${defaultServings} srv`}
        title="Servings (blank = household default)"
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

