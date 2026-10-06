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
      // Keep a list if one is somehow already there rather than overwrite it.
      return { ...rest, sourceUrls: rest.sourceUrls ?? (sourceUrl ? [sourceUrl] : []) }
    })
  }

  return data
}

/** Parse and upgrade stored or imported JSON. Throws on anything we can't safely read. */
function parse(text: string): AppData {
  const env = JSON.parse(text) as Partial<Envelope>
  if (typeof env !== 'object' || env === null || typeof env.version !== 'number' || !env.data) {
    throw new Error('Not a Cooking Site backup file')
  }
  // An older app must not guess at a newer shape — saving its guess back would lose fields.
  if (env.version > SCHEMA_VERSION) {
    throw new Error(`Data is from a newer version of the app (v${env.version}; this one supports up to v${SCHEMA_VERSION})`)
  }
  return migrate(env as Envelope)
}

// When stored data can't be read, the app starts empty and the store immediately
// saves that empty state over the original. So before returning empty, keep a copy
// of the original under its own key (never overwritten) for the user to download.
const UNREADABLE_PREFIX = 'cooking-site:unreadable:'

/** Set when an unreadable copy couldn't be kept (e.g. storage full): saving is then refused. */
let saveBlocked = false

export type UnreadableCopy = { key: string; savedAt: string; raw: string; error: string }

export function load(): AppData {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyData()
    return parse(raw)
  } catch (err) {
    console.error('Failed to load data, starting empty', err)
    if (raw) keepUnreadableCopy(raw, err)
    return emptyData()
  }
}

function keepUnreadableCopy(raw: string, err: unknown): void {
  const copy = { savedAt: new Date().toISOString(), error: err instanceof Error ? err.message : String(err), raw }
  try {
    localStorage.setItem(`${UNREADABLE_PREFIX}${copy.savedAt}`, JSON.stringify(copy))
  } catch (e) {
    // No copy means the original is the only one left; don't let save() overwrite it.
    console.error('Could not keep a copy of unreadable data; saving is disabled', e)
    saveBlocked = true
  }
}

export function isSaveBlocked(): boolean {
  return saveBlocked
}

/** Copies of stored data that failed to load, oldest first. */
export function unreadableCopies(): UnreadableCopy[] {
  const copies: UnreadableCopy[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key?.startsWith(UNREADABLE_PREFIX)) continue
    try {
      copies.push({ key, ...(JSON.parse(localStorage.getItem(key)!) as Omit<UnreadableCopy, 'key'>) })
    } catch {
      // Ignore a damaged copy entry rather than break the app over it.
    }
  }
  return copies.sort((a, b) => a.savedAt.localeCompare(b.savedAt))
}

export function discardUnreadableCopy(key: string): void {
  if (key.startsWith(UNREADABLE_PREFIX)) localStorage.removeItem(key)
}

export function save(data: AppData): void {
  if (saveBlocked) return
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
  return parse(text)
}

export function newId(): string {
  return crypto.randomUUID()
}

export function todayISO(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
