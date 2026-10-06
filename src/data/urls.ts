// Helpers for user-entered links (recipe source URLs).

/**
 * The URL if it's safe to put in an href (http/https only), else undefined.
 * Blocks `javascript:` and friends, which could arrive via an imported backup.
 */
export function safeHref(url: string): string | undefined {
  try {
    const u = new URL(url.trim())
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.href : undefined
  } catch {
    return undefined
  }
}

/** Short label for a link: "www.seriouseats.com/…" → "seriouseats.com". Falls back to the raw text. */
export function linkLabel(url: string): string {
  try {
    return new URL(url.trim()).hostname.replace(/^www\./, '') || url
  } catch {
    return url
  }
}
