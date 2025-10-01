import { NavLink } from 'react-router-dom'
import { cn } from '@/utils/cn'

const navigation = [
  { name: 'Dashboard', path: '/', icon: '📊', section: 'main' },
  { name: 'Project Hub', path: '/project-hub', icon: '🚀', section: 'hub' },
  { name: 'Company Profile', path: '/profile', icon: '🏢', section: 'main' },
  { name: 'Website Audit', path: '/audit', icon: '🔍', section: 'main' },
  { name: 'Local Rankings', path: '/ranking', icon: '📍', section: 'main' },
  { name: 'Competitors', path: '/competitors', icon: '⚔️', section: 'main' },
  { name: 'Citations', path: '/citations', icon: '📝', section: 'main' },
  { name: 'AI Strategy', path: '/ai-strategy', icon: '🤖', section: 'main' },
  { name: 'Campaigns', path: '/campaigns', icon: '🎯', section: 'main' },
  { name: 'API Keys', path: '/api-keys', icon: '🔑', section: 'settings' },
  { name: 'Configuration', path: '/project-config', icon: '⚙️', section: 'settings' },
  { name: 'Reports', path: '/reports', icon: '📈', section: 'main' },
]

export default function Sidebar() {
  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col h-screen">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-primary">GEO-SEO</h1>
        <p className="text-sm text-muted-foreground">Domination Tool</p>
      </div>

      <nav className="px-4 space-y-1 flex-1 overflow-y-auto">
        <div className="mb-4">
          <p className="text-xs text-muted-foreground px-4 mb-2 uppercase tracking-wider">Project Hub</p>
          {navigation.filter(item => item.section === 'hub').map((item) => (
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
        </div>

        <div className="mb-4">
          <p className="text-xs text-muted-foreground px-4 mb-2 uppercase tracking-wider">SEO Tools</p>
          {navigation.filter(item => item.section === 'main').map((item) => (
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
        </div>

        <div>
          <p className="text-xs text-muted-foreground px-4 mb-2 uppercase tracking-wider">Settings</p>
          {navigation.filter(item => item.section === 'settings').map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
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
        </div>
      </nav>
    </aside>
  )
}
