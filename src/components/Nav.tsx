import { NavLink } from 'react-router'

const links = [
  { to: '/recipes', label: 'Recipes' },
  { to: '/learnings', label: 'Learnings' },
  { to: '/schedule', label: 'Schedule' },
  { to: '/shopping', label: 'Shopping' },
  { to: '/cooking', label: 'Cooking' },
  { to: '/settings', label: 'Settings' },
]

export function Nav() {
  return (
    <nav className="nav">
      <span className="nav-brand">🍳 Cooking Site</span>
      <ul>
        {links.map((l) => (
          <li key={l.to}>
            <NavLink to={l.to} className={({ isActive }) => (isActive ? 'active' : '')}>
              {l.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
