import { useRef, useState } from 'react'
import { Page } from '../components/Page'
import { useStore } from '../useStore'
import { emptyData, exportJSON, importJSON, todayISO } from '../storage'
import { sampleData } from '../data/sample'

export function SettingsPage() {
  const { data, replace } = useStore()
  const fileInput = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<string | null>(null)

  function download() {
    const blob = new Blob([exportJSON(data)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cooking-site-backup-${todayISO()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function onImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const next = importJSON(await file.text())
      if (!confirm('Importing will replace all current data. Continue?')) return
      replace(next)
      setMessage(`Imported ${next.recipes.length} recipes, ${next.learnings.length} learnings, ${next.schedule.length} schedule entries.`)
    } catch (err) {
      setMessage(`Import failed: ${(err as Error).message}`)
    } finally {
      e.target.value = ''
    }
  }

  function resetAll() {
    if (!confirm('Delete ALL recipes, learnings, and schedule? This cannot be undone.')) return
    replace(emptyData())
    setMessage('All data cleared.')
  }

  function loadSample() {
    const hasData = data.recipes.length > 0 || data.learnings.length > 0 || data.schedule.length > 0
    if (hasData && !confirm('Loading sample data replaces everything currently here. Continue?')) return
    replace(sampleData())
    setMessage('Sample data loaded.')
  }

  const counts = `${data.recipes.length} recipes · ${data.learnings.length} learnings · ${data.schedule.length} schedule entries`

  return (
    <Page title="Settings">
      <section className="card">
        <h2>Backup</h2>
        <p className="muted">
          Data lives only in this browser's local storage. Export a backup now and then so a cleared
          browser doesn't take your recipes with it.
        </p>
        <p className="muted">Currently: {counts}</p>
        <div className="row">
          <button onClick={download}>Export JSON</button>
          <button onClick={() => fileInput.current?.click()}>Import JSON…</button>
          <input ref={fileInput} type="file" accept="application/json" hidden onChange={onImportFile} />
        </div>
      </section>

      <section className="card">
        <h2>Sample data</h2>
        <p className="muted">
          Loads four recipes, a few learnings, and a week of meals so you can see how the pages fit together.
          Replaces whatever is here now.
        </p>
        <button onClick={loadSample}>Load sample data</button>
      </section>

      <section className="card danger">
        <h2>Reset</h2>
        <p className="muted">Wipe everything and start from an empty app.</p>
        <button className="btn-danger" onClick={resetAll}>
          Reset all data
        </button>
      </section>

      {message && <p className="message">{message}</p>}
    </Page>
  )
}
