import { NavLink } from 'react-router-dom'
import { cn } from '@/utils/cn'

const navigation = [
  { name: 'Dashboard', path: '/', icon: '📊' },
  { name: 'Company Profile', path: '/profile', icon: '🏢' },
  { name: 'Website Audit', path: '/audit', icon: '🔍' },
  { name: 'Local Rankings', path: '/ranking', icon: '📍' },
  { name: 'Competitors', path: '/competitors', icon: '⚔️' },
  { name: 'Citations', path: '/citations', icon: '📝' },
  { name: 'AI Strategy', path: '/ai-strategy', icon: '🤖' },
  { name: 'Campaigns', path: '/campaigns', icon: '🎯' },
  { name: 'Reports', path: '/reports', icon: '📈' },
]

export default function Sidebar() {
  return (
    <aside className="w-64 bg-card border-r border-border">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-primary">GEO-SEO</h1>
        <p className="text-sm text-muted-foreground">Domination Tool</p>
      </div>

      <nav className="px-4 space-y-1">
        {navigation.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground hover:bg-accent hover:text-accent-foreground'
              )
            }
          >
            <span className="text-xl">{item.icon}</span>
            <span className="font-medium">{item.name}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
