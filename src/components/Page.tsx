import type { ReactNode } from 'react'

/** Standard page wrapper: title + content column. */
export function Page({ title, wide, children }: { title: string; wide?: boolean; children: ReactNode }) {
  return (
    <main className={wide ? 'page wide' : 'page'}>
      <h1>{title}</h1>
      {children}
    </main>
  )
}
