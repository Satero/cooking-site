// App-wide state. One AppData object held in React state, persisted on every change.
// Pages call useStore() and get the data plus an `update` function that takes a
// mutator; feature-specific helpers (addRecipe, etc.) will be layered on in later
// milestones so pages don't build patches by hand.

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import type { AppData } from './types'
import { load, save } from './storage'

type Store = {
  data: AppData
  /** Apply a change. The mutator gets the current data and returns the next. */
  update: (fn: (prev: AppData) => AppData) => void
  /** Replace everything (used by import / reset). */
  replace: (next: AppData) => void
}

const StoreContext = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(load)

  useEffect(() => {
    save(data)
  }, [data])

  const update = useCallback((fn: (prev: AppData) => AppData) => setData(fn), [])
  const replace = useCallback((next: AppData) => setData(next), [])

  return <StoreContext.Provider value={{ data, update, replace }}>{children}</StoreContext.Provider>
}

export function useStore(): Store {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>')
  return ctx
}
