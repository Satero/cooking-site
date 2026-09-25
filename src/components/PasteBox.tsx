import { useState } from 'react'

type Props = {
  label: string
  placeholder: string
  hint: string
  /** Parses and applies the text; returns how many rows were added. */
  onPaste: (text: string) => number
}

/**
 * Collapsed "Paste…" button that opens a textarea. Lets the user drop a whole
 * block of recipe text in at once instead of filling one field at a time.
 */
export function PasteBox({ label, placeholder, hint, onPaste }: Props) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [result, setResult] = useState<string | null>(null)

  if (!open) {
    return (
      <button type="button" className="link-btn paste-open" onClick={() => setOpen(true)}>
        {label}
      </button>
    )
  }

  function apply() {
    const n = onPaste(text)
    if (n === 0) {
      setResult("Couldn't find anything to add in that text.")
      return
    }
    setText('')
    setResult(null)
    setOpen(false)
  }

  return (
    <div className="paste-box">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        placeholder={placeholder}
        autoFocus
      />
      <p className="muted small">{hint}</p>
      {result && <p className="message error">{result}</p>}
      <div className="row">
        <button type="button" className="primary" onClick={apply} disabled={!text.trim()}>
          Add rows
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false)
            setText('')
            setResult(null)
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
