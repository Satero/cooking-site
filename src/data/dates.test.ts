import { describe, expect, it } from 'vitest'
import { addDays, dateRange, fromISO, rangeLabel, shortDate, startOfWeek, toISO, weekdayName } from './dates'

// vite.config.ts pins TZ to America/Detroit, so these run west of UTC.

describe('fromISO / toISO', () => {
  // Regression: new Date("2026-10-01") is UTC midnight, i.e. Sep 30 in US timezones.
  it('parses as local time, not UTC', () => {
    const d = fromISO('2026-10-01')
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 9, 1])
  })

  it('round-trips', () => {
    expect(toISO(fromISO('2026-02-28'))).toBe('2026-02-28')
  })
})

describe('addDays', () => {
  it('crosses month and year boundaries', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('handles leap years', () => {
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29')
  })

  it('is not thrown off by daylight-saving changes', () => {
    // US DST: 2026-03-08 (spring forward), 2026-11-01 (fall back)
    expect(addDays('2026-03-07', 1)).toBe('2026-03-08')
    expect(addDays('2026-03-08', 1)).toBe('2026-03-09')
    expect(addDays('2026-11-01', 1)).toBe('2026-11-02')
    expect(addDays('2026-10-31', 7)).toBe('2026-11-07')
  })
})

describe('startOfWeek', () => {
  it('returns the Monday of the week', () => {
    expect(startOfWeek('2026-10-01')).toBe('2026-09-28') // Thu → Mon
    expect(startOfWeek('2026-09-28')).toBe('2026-09-28') // Mon → itself
    expect(startOfWeek('2026-10-04')).toBe('2026-09-28') // Sun → previous Mon
  })
})

describe('dateRange', () => {
  it('lists n consecutive days, inclusive of start', () => {
    expect(dateRange('2026-09-29', 3)).toEqual(['2026-09-29', '2026-09-30', '2026-10-01'])
    expect(dateRange('2026-09-29', 0)).toEqual([])
  })
})

describe('labels', () => {
  it('formats weekday, short date, and range', () => {
    expect(weekdayName('2026-10-01')).toBe('Thu')
    expect(shortDate('2026-10-01')).toBe('Oct 1')
    expect(rangeLabel('2026-12-28', '2027-01-03')).toBe('Dec 28 – Jan 3, 2027')
  })
})
