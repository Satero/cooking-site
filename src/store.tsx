// App-wide state. One AppData object held in React state, persisted on every change.
// Pages call useStore() (src/useStore.ts) and get the data plus an `update` function
// that takes a mutator. Feature helpers in src/data/* are pure functions over AppData
// so pages compose them: update(d => upsertRecipe(d, recipe)).

import { useCallback, useEffect, useState, type ReactNode } from 'react'
import type { AppData } from './types'
import { load, save } from './storage'
import { StoreContext } from './storeContext'

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(load)

  useEffect(() => {
    save(data)
  }, [data])

  const update = useCallback((fn: (prev: AppData) => AppData) => setData(fn), [])
  const replace = useCallback((next: AppData) => setData(next), [])

  return <StoreContext.Provider value={{ data, update, replace }}>{children}</StoreContext.Provider>
}
