import { describe, expect, it } from 'vitest'
import { linkLabel, safeHref } from './urls'

describe('safeHref', () => {
  it('allows http and https links', () => {
    expect(safeHref('https://example.com/a?b=1')).toBe('https://example.com/a?b=1')
    expect(safeHref(' http://example.com ')).toBe('http://example.com/')
  })

  it.each([
    'javascript:alert(1)',
    'JavaScript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'file:///etc/passwd',
    'not a url',
    '',
  ])('rejects %j', (url) => {
    expect(safeHref(url)).toBeUndefined()
  })
})

describe('linkLabel', () => {
  it('shows the site name without www', () => {
    expect(linkLabel('https://www.seriouseats.com/adobo')).toBe('seriouseats.com')
    expect(linkLabel('https://youtube.com/watch?v=x')).toBe('youtube.com')
  })

  it('falls back to the raw text when it is not a URL', () => {
    expect(linkLabel('grandma’s card')).toBe('grandma’s card')
  })
})
