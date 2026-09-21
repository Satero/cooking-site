import type { ReactNode } from 'react'

/** Standard page wrapper: title + content column. */
export function Page({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="page">
      <h1>{title}</h1>
      {children}
    </main>
  )
}
