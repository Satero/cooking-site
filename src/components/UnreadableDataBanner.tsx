import { useState } from 'react'
import { discardUnreadableCopy, isSaveBlocked, unreadableCopies } from '../storage'
import { downloadText } from '../download'

/**
 * Shown when saved data failed to load. The app started empty, but storage.ts
 * kept the original; this lets the user download it before deciding to discard it.
 */
export function UnreadableDataBanner() {
  const [copies, setCopies] = useState(unreadableCopies)
  const blocked = isSaveBlocked()
  if (copies.length === 0 && !blocked) return null

  function discard(key: string) {
    if (!confirm('Discard this copy? Download it first if you might want it — this cannot be undone.')) return
    discardUnreadableCopy(key)
    setCopies(unreadableCopies())
  }

  return (
    <div className="page">
      <section className="card danger" role="alert">
        <h2>Some saved data couldn't be read</h2>
        {blocked && (
          <p>
            <strong>Changes are not being saved right now</strong>, so the unreadable data isn't overwritten, and
            anything you change will be lost when the app closes. Storage is probably full: free some up, then
            close and reopen the app.
          </p>
        )}
        {copies.map((c) => (
          <div key={c.key} className="unreadable-copy">
            <p className="muted">
              On {new Date(c.savedAt).toLocaleString()} the app couldn't load its saved data ({c.error}), so it
              started empty. The original was kept. Download it before discarding it: if it came from a newer
              version, update the app (fully close and reopen it) and import the file in Settings.
            </p>
            <div className="row">
              <button
                className="primary"
                onClick={() => downloadText(`cooking-site-unreadable-${c.savedAt.slice(0, 10)}.json`, c.raw)}
              >
                Download copy
              </button>
              <button className="btn-danger" onClick={() => discard(c.key)}>
                Discard copy
              </button>
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}
