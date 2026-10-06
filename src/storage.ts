// The only localStorage access point. Pages never touch localStorage directly —
// they go through the store (src/store.tsx), which calls load/save here.
// Keeping this isolated is what makes swapping in a backend later a one-file change.

import type { AppData } from './types'

const STORAGE_KEY = 'cooking-site:data'
export const SCHEMA_VERSION = 3

type Envelope = { version: number; data: AppData }

export function emptyData(): AppData {
  return {
    recipes: [],
    learnings: [],
    schedule: [],
    shopping: { rangeDays: 7, checked: [] },
    settings: { defaultServings: 4 },
  }
}

/** Bring data from an older envelope up to the current shape. Add a step per schema bump. */
function migrate(env: Envelope): AppData {
  // v1 → v2: added `settings`. Filling missing top-level keys from emptyData() covers it.
  const data = { ...emptyData(), ...env.data }

  // v2 → v3: a recipe's single optional `sourceUrl` became a `sourceUrls` list.
  if (env.version < 3) {
    data.recipes = data.recipes.map((r) => {
      const { sourceUrl, ...rest } = r as typeof r & { sourceUrl?: string }
      return { ...rest, sourceUrls: sourceUrl ? [sourceUrl] : [] }
    })
  }

  return data
}

export function load(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyData()
    return migrate(JSON.parse(raw) as Envelope)
  } catch (err) {
    console.error('Failed to load data, starting empty', err)
    return emptyData()
  }
}

export function save(data: AppData): void {
  const env: Envelope = { version: SCHEMA_VERSION, data }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(env))
}

export function reset(): void {
  localStorage.removeItem(STORAGE_KEY)
}

/** Serialized backup the user can download and later re-import. */
export function exportJSON(data: AppData): string {
  const env: Envelope = { version: SCHEMA_VERSION, data }
  return JSON.stringify(env, null, 2)
}

/** Parse a backup file. Throws on anything that doesn't look like ours. */
export function importJSON(text: string): AppData {
  const env = JSON.parse(text) as Partial<Envelope>
  if (typeof env !== 'object' || env === null || typeof env.version !== 'number' || !env.data) {
    throw new Error('Not a Cooking Site backup file')
  }
  if (env.version > SCHEMA_VERSION) {
    throw new Error(`Backup is from a newer version (${env.version}); this app supports up to ${SCHEMA_VERSION}`)
  }
  return migrate(env as Envelope)
}

export function newId(): string {
  return crypto.randomUUID()
}

export function todayISO(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
