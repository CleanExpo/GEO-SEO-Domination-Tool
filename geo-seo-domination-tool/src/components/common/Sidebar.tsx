import { NavLink } from 'react-router-dom'
import { cn } from '@/utils/cn'

interface NavItem {
  label: string
  description?: string
  path: string
  icon: string
}

interface NavSection {
  title: string
  items: NavItem[]
}

const navigation: NavSection[] = [
  {
    title: 'Workspace',
    items: [
      { label: 'Dashboard', path: '/', icon: 'DB' },
      { label: 'Calendar', path: '/calendar', icon: 'CA' },
    ],
  },
  {
    title: 'Pipeline',
    items: [
      { label: 'Contacts', path: '/contacts', icon: 'CT' },
      { label: 'Companies', path: '/companies', icon: 'CO' },
      { label: 'Deals', path: '/deals', icon: 'DL' },
      { label: 'Interactions', path: '/interactions', icon: 'IN' },
      { label: 'Tasks', path: '/tasks', icon: 'TK' },
    ],
  },
  {
    title: 'Projects',
    items: [
      { label: 'Project Board', path: '/projects', icon: 'PJ' },
      { label: 'GitHub Imports', path: '/github-projects', icon: 'GH' },
      { label: 'Notes & Docs', path: '/notes', icon: 'ND' },
    ],
  },
  {
    title: 'Resources',
    items: [
      { label: 'Prompts', path: '/prompts', icon: 'PR' },
      { label: 'Components', path: '/components-library', icon: 'CM' },
      { label: 'AI Tools', path: '/ai-tools', icon: 'AI' },
      { label: 'Tutorials', path: '/tutorials', icon: 'TU' },
    ],
  },
  {
    title: 'Members',
    items: [
      { label: 'Support', path: '/support', icon: 'SP' },
    ],
  },
]

export default function Sidebar() {
  return (
    <aside className="w-72 bg-card border-r border-border flex flex-col h-screen">
      <div className="px-6 pt-8 pb-6 border-b border-border/80">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
            OC
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Omar Choudhry</p>
            <p className="text-xs text-muted-foreground">Personal CRM • Builder HQ</p>
          </div>
        </div>
        <button
          type="button"
          className="mt-4 w-full rounded-md bg-primary text-primary-foreground text-sm font-medium py-2 hover:opacity-90 transition-opacity"
        >
          New CRM Entry
        </button>
      </div>

      <nav className="px-4 py-4 space-y-6 flex-1 overflow-y-auto">
        {navigation.map((section) => (
          <div key={section.title} className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground px-3">{section.title}</p>
            <div className="space-y-1">
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-3 rounded-lg transition-colors border border-transparent',
                      isActive
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'text-foreground hover:bg-muted hover:text-foreground'
                    )
                  }
                >
                  <NavIcon label={item.icon} />
                  <div className="flex-1">
                    <p className="text-sm font-medium leading-tight">{item.label}</p>
                    {item.description ? (
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    ) : null}
                  </div>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-6 py-6 border-t border-border/70 text-xs text-muted-foreground space-y-2">
        <p className="font-medium uppercase tracking-wide">Workflow Score</p>
        <p>Focus mode ready. Pipeline touchpoints synced.</p>
      </div>
    </aside>
  )
}

function NavIcon({ label }: { label: string }) {
  return (
    <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary">
      {label}
    </span>
  )
}
