import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { StoreProvider } from './store'
import { Nav } from './components/Nav'
import { RecipesPage } from './pages/Recipes'
import { LearningsPage } from './pages/Learnings'
import { SchedulePage } from './pages/Schedule'
import { ShoppingPage } from './pages/Shopping'
import { CookingPage } from './pages/Cooking'
import { SettingsPage } from './pages/Settings'

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <Nav />
        <Routes>
          <Route path="/" element={<Navigate to="/recipes" replace />} />
          <Route path="/recipes" element={<RecipesPage />} />
          <Route path="/learnings" element={<LearningsPage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/shopping" element={<ShoppingPage />} />
          <Route path="/cooking" element={<CookingPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </BrowserRouter>
    </StoreProvider>
  )
}
