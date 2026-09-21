import { useState } from 'react'
import { Link } from 'react-router'
import { Page } from '../components/Page'
import { useStore } from '../useStore'
import { todayISO } from '../storage'
import { fromISO, rangeLabel } from '../data/dates'
import { formatQty } from '../data/recipes'
import { buildShoppingList, clearChecked, setRange, shoppingWindow, toggleChecked, type ShoppingItem } from '../data/shopping'

function itemText(i: ShoppingItem): string {
  const qty = formatQty(i.qty)
  const q = i.hasUnquantified && qty ? `${qty}+` : qty
  return [q, i.unit, i.name].filter(Boolean).join(' ')
}

export function ShoppingPage() {
  const { data, update } = useStore()
  const today = todayISO()
  const { start, end } = shoppingWindow(data, today)
  const items = buildShoppingList(data, today)
  const checked = new Set(data.shopping.checked)
  const visibleKeys = items.map((i) => i.key)
  const remaining = items.filter((i) => !checked.has(i.key))
  const [copied, setCopied] = useState(false)

  function onStartChange(v: string) {
    if (!v) return
    // Keep the same number of days; store start explicitly (undefined = follow today)
    update((d) => setRange(d, v === today ? undefined : v, d.shopping.rangeDays))
  }

  function onEndChange(v: string) {
    if (!v) return
    const days = Math.round((fromISO(v).getTime() - fromISO(start).getTime()) / 86_400_000) + 1
    if (days < 1) return
    update((d) => setRange(d, d.shopping.rangeStart, days))
  }

  async function copy() {
    const text = remaining.map((i) => `- ${itemText(i)}`).join('\n')
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      prompt('Copy this list:', text)
    }
  }

  return (
    <Page title="Shopping">
      <div className="row toolbar">
        <label className="row people">
          From
          <input type="date" value={start} onChange={(e) => onStartChange(e.target.value)} />
        </label>
        <label className="row people">
          to
          <input type="date" value={end} min={start} onChange={(e) => onEndChange(e.target.value)} />
        </label>
        {data.shopping.rangeStart && (
          <button className="link-btn" onClick={() => update((d) => setRange(d, undefined, 7))}>
            Reset to next 7 days
          </button>
        )}
        <span className="grow" />
        <button onClick={() => update(clearChecked)} disabled={checked.size === 0}>
          Uncheck all
        </button>
        <button className="primary" onClick={copy} disabled={remaining.length === 0}>
          {copied ? 'Copied!' : `Copy remaining (${remaining.length})`}
        </button>
      </div>

      <p className="muted">
        {rangeLabel(start, end)} · {items.length} item{items.length === 1 ? '' : 's'}
        {items.length > 0 && ` · ${remaining.length} left to buy`}
      </p>

      {items.length === 0 ? (
        <p className="muted">
          Nothing scheduled in this range. <Link to="/schedule">Plan some meals</Link> and the list fills in here.
        </p>
      ) : (
        <ul className="list shopping-list">
          {items.map((i) => {
            const isChecked = checked.has(i.key)
            return (
              <li key={i.key} className={`card shopping-item${isChecked ? ' checked' : ''}`}>
                <label className="row">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => update((d) => toggleChecked(d, i.key, visibleKeys))}
                  />
                  <span className="shopping-text">{itemText(i)}</span>
                  <span className="grow" />
                  <span className="muted small shopping-for">
                    {i.neededFor.map((n) => (n.times > 1 ? `${n.name} ×${n.times}` : n.name)).join(', ')}
                  </span>
                </label>
              </li>
            )
          })}
        </ul>
      )}

      {items.some((i) => i.hasUnquantified) && (
        <p className="muted small">
          A "+" after a quantity means at least one recipe lists that ingredient without an amount.
        </p>
      )}
    </Page>
  )
}

