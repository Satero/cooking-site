// The only localStorage access point. Pages never touch localStorage directly —
// they go through the store (src/store.tsx), which calls load/save here.
// Keeping this isolated is what makes swapping in a backend later a one-file change.

import type { AppData } from './types'

const STORAGE_KEY = 'cooking-site:data'
export const SCHEMA_VERSION = 2

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

/** Upgrade older envelopes in place. Add a case per schema bump. */
function migrate(env: Envelope): AppData {
  const data = env.data
  // v1 → v2: added `settings`. Filling missing top-level keys from emptyData() covers it,
  // so no explicit step is needed; keep this switch for bumps that reshape existing data.
  // switch (env.version) { case 1: ... fallthrough }
  return { ...emptyData(), ...data }
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
