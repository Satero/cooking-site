import { useCallback, useSyncExternalStore } from 'react'

/**
 * Below this the Schedule's 7-column week grid is too cramped to read recipe
 * names, so it switches to a stacked list of days. Wider than the 640px phone
 * breakpoint in index.css on purpose: tablets get the list too.
 */
export const SCHEDULE_LIST_QUERY = '(max-width: 960px)'

const hasMatchMedia = () => typeof window.matchMedia === 'function'

/**
 * True while `query` matches. Reads synchronously on first render, so there's
 * no flash of the wrong layout. False where matchMedia doesn't exist (jsdom).
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!hasMatchMedia()) return () => {}
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    [query],
  )
  return useSyncExternalStore(subscribe, () => hasMatchMedia() && window.matchMedia(query).matches)
}
