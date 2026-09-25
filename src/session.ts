// Session-scoped UI state for the Cooking page: which steps are checked off and
// which ad-hoc dishes were added. Deliberately NOT in the app store — a fresh cook
// shouldn't inherit last week's checkmarks, so this dies with the browser tab.
// Every accessor is defensive: sessionStorage throws in some privacy modes.

const STEPS_KEY = 'cooking-site:session:steps'
const EXTRA_KEY = 'cooking-site:session:extraDishes'

function read<T>(key: string, fallback: T): T {
  try {
    const raw = sessionStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Ignore — the page still works, progress just isn't remembered.
  }
}

/** Checked steps, keyed "<dishKey>:<stepIndex>". */
export function readCheckedSteps(): string[] {
  return read<string[]>(STEPS_KEY, [])
}

export function writeCheckedSteps(keys: string[]): void {
  write(STEPS_KEY, keys)
}

export function stepKey(dishKey: string, stepIndex: number): string {
  return `${dishKey}:${stepIndex}`
}

/** Recipe ids the user added to today's cooking ad hoc. */
export function readExtraDishes(): string[] {
  return read<string[]>(EXTRA_KEY, [])
}

export function writeExtraDishes(ids: string[]): void {
  write(EXTRA_KEY, ids)
}
