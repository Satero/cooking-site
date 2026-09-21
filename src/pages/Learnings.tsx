import { useState } from 'react'
import { Page } from '../components/Page'
import { LearningForm } from '../components/LearningForm'
import { LearningList } from '../components/LearningList'
import { useStore } from '../useStore'
import { createLearning, sortLearnings } from '../data/learnings'

const GENERAL = '__general__'

export function LearningsPage() {
  const { data, update } = useStore()
  const [filter, setFilter] = useState<string>('') // '' = all, GENERAL, or a recipe id
  const [showForm, setShowForm] = useState(false)

  const recipes = [...data.recipes].sort((a, b) => a.name.localeCompare(b.name))
  const visible = sortLearnings(
    data.learnings.filter((l) => {
      if (!filter) return true
      if (filter === GENERAL) return l.recipeId === null
      return l.recipeId === filter
    }),
  )

  return (
    <Page title="Learnings">
      <p className="muted">
        Notes from each time you cook. Recipe learnings show up on that recipe's Cooking view; general ones show up
        every time.
      </p>

      <div className="row toolbar">
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All learnings</option>
          <option value={GENERAL}>General only</option>
          {recipes.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        <span className="grow" />
        {!showForm && (
          <button className="primary" onClick={() => setShowForm(true)}>
            + New learning
          </button>
        )}
      </div>

      {showForm && (
        <section className="card">
          <h2>New learning</h2>
          <LearningForm
            onSubmit={(input) => {
              update((d) => createLearning(d, input))
              setShowForm(false)
            }}
            onCancel={() => setShowForm(false)}
          />
        </section>
      )}

      <LearningList
        learnings={visible}
        emptyText={data.learnings.length === 0 ? 'No learnings yet. Add one after your next cook.' : 'Nothing matches this filter.'}
      />
    </Page>
  )
}
