import { createContext } from 'react'
import type { AppData } from './types'

export type Store = {
  data: AppData
  /** Apply a change. The mutator gets the current data and returns the next. */
  update: (fn: (prev: AppData) => AppData) => void
  /** Replace everything (used by import / reset). */
  replace: (next: AppData) => void
}

export const StoreContext = createContext<Store | null>(null)
