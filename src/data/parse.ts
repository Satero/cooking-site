// Parsers for pasting a whole block of recipe text at once, instead of typing
// each step or ingredient into its own field. Pure string → structured data.

import type { Ingredient } from '../types'
import { parseQty } from './recipes'
import { isUnit } from './units'

/** Leading bullets and numbering: "1.", "2)", "Step 3:", "-", "*", "•". */
const LEADER = /^\s*(?:step\s*)?(?:\d+\s*[.):-]|[-*•])\s*/i

function stripLeader(s: string): string {
  return s.replace(LEADER, '').trim()
}

/**
 * Split pasted instructions into steps.
 *
 * Blank lines win when present (recipes often wrap a single step across lines);
 * otherwise each non-empty line is its own step. Numbering and bullets are stripped.
 */
export function parseSteps(text: string): string[] {
  const trimmed = text.trim()
  if (!trimmed) return []

  const chunks = /\n\s*\n/.test(trimmed) ? trimmed.split(/\n\s*\n/) : trimmed.split('\n')

  return chunks
    .map((chunk) =>
      chunk
        .split('\n')
        .map((line) => stripLeader(line))
        .filter(Boolean)
        .join(' '),
    )
    .filter(Boolean)
}

/** Leading quantity: "2", "1.5", "1/2", "1 1/2", "½", "1½". */
const QTY_AT_START = /^(\d+\s+\d+\/\d+|\d+\/\d+|\d*[¼⅓½⅔¾]|\d+(?:\.\d+)?)\s*/

/**
 * Parse one ingredient line into { qty, unit, name }.
 *
 * Everything is optional except the name — a line with no recognizable quantity
 * becomes a name-only ingredient rather than being rejected.
 */
export function parseIngredientLine(line: string): Ingredient | null {
  let rest = stripLeader(line)
  if (!rest) return null

  let qty: number | undefined
  const qtyMatch = rest.match(QTY_AT_START)
  if (qtyMatch) {
    const parsed = parseQty(qtyMatch[1])
    if (parsed !== null && parsed !== undefined) {
      qty = parsed
      rest = rest.slice(qtyMatch[0].length).trim()
    }
  }

  let unit: string | undefined
  if (qty !== undefined) {
    const [first, ...others] = rest.split(/\s+/)
    if (first && isUnit(first) && others.length > 0) {
      // Keep the user's spelling ("cups"); shopping compares canonically.
      unit = first.replace(/\.$/, '')
      rest = others.join(' ')
    }
  }

  const name = rest.trim()
  if (!name) return null
  return { name, ...(qty !== undefined && { qty }), ...(unit && { unit }) }
}

export function parseIngredients(text: string): Ingredient[] {
  return text
    .split('\n')
    .map((line) => parseIngredientLine(line))
    .filter((i): i is Ingredient => i !== null)
}
