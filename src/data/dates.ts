// Date helpers on ISO YYYY-MM-DD strings, all in local time. Avoids Date's
// UTC-parsing trap by building from parts.

import type { DateISO } from '../types'

export function fromISO(iso: DateISO): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function toISO(d: Date): DateISO {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function addDays(iso: DateISO, n: number): DateISO {
  const d = fromISO(iso)
  d.setDate(d.getDate() + n)
  return toISO(d)
}

/** Monday of the week containing `iso`. */
export function startOfWeek(iso: DateISO): DateISO {
  const d = fromISO(iso)
  const dow = (d.getDay() + 6) % 7 // Mon=0 … Sun=6
  return addDays(iso, -dow)
}

/** `n` consecutive days starting at `start`, inclusive. */
export function dateRange(start: DateISO, n: number): DateISO[] {
  return Array.from({ length: n }, (_, i) => addDays(start, i))
}

const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "Mon" */
export function weekdayName(iso: DateISO): string {
  return WEEKDAY[fromISO(iso).getDay()]
}

/** "Sep 21" */
export function shortDate(iso: DateISO): string {
  const d = fromISO(iso)
  return `${MONTH[d.getMonth()]} ${d.getDate()}`
}

/** "Sep 21 – Sep 27, 2026" */
export function rangeLabel(start: DateISO, end: DateISO): string {
  return `${shortDate(start)} – ${shortDate(end)}, ${fromISO(end).getFullYear()}`
}
