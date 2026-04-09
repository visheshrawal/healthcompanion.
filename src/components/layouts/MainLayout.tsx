import { Outlet } from 'react-router-dom'
import { Navbar } from '../Navbar'

export function MainLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
      <Navbar />
      <main>
        <Outlet />
      </main>
    </div>
  )
}
