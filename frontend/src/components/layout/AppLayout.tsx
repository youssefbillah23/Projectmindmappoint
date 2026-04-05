import { NavLink, Outlet } from 'react-router-dom'
import {
  Home,
  Rss,
  BookMarked,
  PenSquare,
  Settings,
} from 'lucide-react'
import { cn } from '../../lib/utils'

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/feed', icon: Rss, label: 'Feed' },
  { to: '/library', icon: BookMarked, label: 'Library' },
  { to: '/studio', icon: PenSquare, label: 'Studio' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export function AppLayout() {
  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-white/5 bg-[#1E293B]">
        <div className="flex h-16 items-center gap-2 px-6">
          <div className="h-8 w-8 rounded-lg bg-[#0D9488] flex items-center justify-center">
            <span className="text-white font-bold text-sm">PP</span>
          </div>
          <span className="text-lg font-bold text-[#F1F5F9]">PulsePoint</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-[#0D9488]/10 text-[#0D9488]'
                    : 'text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-white/5'
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 pb-20 lg:pb-0 lg:pl-64">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex lg:hidden border-t border-border glass">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-medium transition-colors',
                isActive ? 'text-primary' : 'text-muted'
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
