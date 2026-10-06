import { describe, expect, it, vi } from 'vitest'
import { SCHEMA_VERSION, emptyData, exportJSON, importJSON, load, save, todayISO } from './storage'
import { sampleData } from './data/sample'

const KEY = 'cooking-site:data'

describe('load / save', () => {
  it('returns empty data when nothing is stored', () => {
    expect(load()).toEqual(emptyData())
  })

  it('round-trips through localStorage in a versioned envelope', () => {
    const d = sampleData()
    save(d)
    expect(JSON.parse(localStorage.getItem(KEY)!).version).toBe(SCHEMA_VERSION)
    expect(load()).toEqual(d)
  })

  it('falls back to empty data on corrupt storage', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    localStorage.setItem(KEY, '{not json')
    expect(load()).toEqual(emptyData())
  })
})

describe('migrate (via load and importJSON)', () => {
  // v1 had no `settings` object.
  const v1 = {
    version: 1,
    data: { recipes: [], learnings: [], schedule: [], shopping: { rangeDays: 7, checked: ['rice|cup'] } },
  }

  it('upgrades a v1 envelope by filling in default settings', () => {
    localStorage.setItem(KEY, JSON.stringify(v1))
    const d = load()
    expect(d.settings).toEqual({ defaultServings: 4 })
    expect(d.shopping.checked).toEqual(['rice|cup'])
  })

  it('upgrades a v1 backup file the same way', () => {
    expect(importJSON(JSON.stringify(v1)).settings).toEqual({ defaultServings: 4 })
  })

  // v2 recipes had one optional `sourceUrl`; v3 has a `sourceUrls` list.
  const v2Recipe = (extra: object) => ({
    id: 'r',
    name: 'Adobo',
    servings: 4,
    tags: [],
    ingredients: [],
    steps: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...extra,
  })
  const v2 = {
    version: 2,
    data: {
      ...emptyData(),
      recipes: [v2Recipe({ id: 'with', sourceUrl: 'https://example.com/adobo' }), v2Recipe({ id: 'without' })],
    },
  }

  it('turns a v2 sourceUrl into a one-item sourceUrls list', () => {
    const [withUrl, withoutUrl] = importJSON(JSON.stringify(v2)).recipes
    expect(withUrl.sourceUrls).toEqual(['https://example.com/adobo'])
    expect('sourceUrl' in withUrl).toBe(false)
    expect(withoutUrl.sourceUrls).toEqual([])
  })

  it('migrates v2 data already in localStorage on load', () => {
    localStorage.setItem(KEY, JSON.stringify(v2))
    expect(load().recipes[0].sourceUrls).toEqual(['https://example.com/adobo'])
  })

  it('gives v1 recipes an empty sourceUrls list too', () => {
    const old = { version: 1, data: { recipes: [v2Recipe({})], learnings: [], schedule: [], shopping: { rangeDays: 7, checked: [] } } }
    expect(importJSON(JSON.stringify(old)).recipes[0].sourceUrls).toEqual([])
  })

  it('leaves current-version data alone', () => {
    const d = sampleData()
    save(d)
    expect(load().recipes.find((r) => r.id === 'sample-eggs')?.sourceUrls).toHaveLength(2)
  })
})

describe('exportJSON / importJSON', () => {
  it('round-trips', () => {
    const d = sampleData()
    expect(importJSON(exportJSON(d))).toEqual(d)
  })

  it.each([
    ['a JSON array', '[]'],
    ['null', 'null'],
    ['an object without a version', '{"data":{}}'],
    ['an object without data', '{"version":2}'],
  ])('rejects %s', (_label, text) => {
    expect(() => importJSON(text)).toThrow('Not a Cooking Site backup file')
  })

  it('rejects invalid JSON', () => {
    expect(() => importJSON('nope')).toThrow()
  })

  it('rejects backups from a newer schema version', () => {
    expect(() => importJSON(JSON.stringify({ version: SCHEMA_VERSION + 1, data: emptyData() }))).toThrow(/newer version/)
  })
})

describe('todayISO', () => {
  it('uses the local date, not UTC', () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    // 9pm Oct 1 in Detroit is already Oct 2 in UTC.
    vi.setSystemTime(new Date(2026, 9, 1, 21, 0))
    expect(todayISO()).toBe('2026-10-01')
  })
})
