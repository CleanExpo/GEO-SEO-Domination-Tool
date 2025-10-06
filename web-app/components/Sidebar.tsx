'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/auth/supabase-client';
import {
  LayoutDashboard, Building2, Search, TrendingUp, BarChart3, FileText,
  Settings, Home, Users, Calendar as CalendarIcon, Target, CheckSquare, FolderKanban,
  Github, FileText as Notes, MessageSquare, Wrench, BookOpen, Headphones, Clock, LogOut, Menu, X,
  Activity, Heart, GitBranch, Shield, Zap, Terminal
} from 'lucide-react';

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard, section: 'SEO' },
  { name: 'Companies', href: '/companies', icon: Building2, section: 'SEO' },
  { name: 'SEO Audits', href: '/audits', icon: Search, section: 'SEO' },
  { name: 'SEO Audit Tools', href: '/seo/audits', icon: Zap, section: 'SEO' },
  { name: 'Keywords', href: '/keywords', icon: TrendingUp, section: 'SEO' },
  { name: 'Rankings', href: '/rankings', icon: BarChart3, section: 'SEO' },
  { name: 'Reports', href: '/reports', icon: FileText, section: 'SEO' },
  { name: 'Schedule', href: '/schedule', icon: Clock, section: 'SEO' },
];

const crmNavigation = [
  { name: 'Contacts', href: '/crm/contacts', icon: Users, section: 'Pipeline' },
  { name: 'Deals', href: '/crm/deals', icon: Target, section: 'Pipeline' },
  { name: 'Tasks', href: '/crm/tasks', icon: CheckSquare, section: 'Pipeline' },
  { name: 'Calendar', href: '/crm/calendar', icon: CalendarIcon, section: 'Workspace' },
];

const projectsNavigation = [
  { name: 'Projects', href: '/projects', icon: FolderKanban, section: 'Projects' },
  { name: 'Sandbox', href: '/sandbox', icon: Terminal, section: 'Projects', badge: 'NEW' },
  { name: 'GitHub Projects', href: '/projects/github', icon: Github, section: 'Projects' },
  { name: 'Notes & Docs', href: '/projects/notes', icon: Notes, section: 'Projects' },
];

const resourcesNavigation = [
  { name: 'Prompts', href: '/resources/prompts', icon: MessageSquare, section: 'Resources' },
  { name: 'Components', href: '/resources/components', icon: Wrench, section: 'Resources' },
  { name: 'AI Tools', href: '/resources/ai-tools', icon: Wrench, section: 'Resources' },
  { name: 'Tutorials', href: '/resources/tutorials', icon: BookOpen, section: 'Resources' },
];

const systemNavigation = [
  { name: 'Guardian', href: '/guardian', icon: Shield, section: 'System' },
  { name: 'Analytics', href: '/analytics', icon: Activity, section: 'System' },
  { name: 'Health', href: '/health', icon: Heart, section: 'System' },
  { name: 'Release Monitor', href: '/release/monitor', icon: GitBranch, section: 'System' },
];

const membersNavigation = [
  { name: 'Support', href: '/support', icon: Headphones, section: 'Members' },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ email?: string; user_metadata?: { full_name?: string; name?: string } } | null>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const renderNavSection = (title: string, items: typeof navigation) => (
    <div className="mb-6">
      <p className="text-xs uppercase tracking-wide text-gray-500 px-3 mb-2 font-semibold">
        {title}
      </p>
      <div className="space-y-1">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-emerald-100 text-emerald-900'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className="h-5 w-5" />
                {item.name}
              </div>
              {(item as any).badge && (
                <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500 text-white rounded">
                  {(item as any).badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 bg-white rounded-lg shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        aria-label="Open menu"
      >
        <Menu className="h-6 w-6 text-gray-900" />
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-white/80 backdrop-blur-sm border-r border-gray-200/50
        flex flex-col overflow-hidden
        transform transition-transform duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
      {/* Logo */}
      <div className="p-6 border-b border-gray-200/50 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
            <Home className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="font-semibold text-gray-900">SEO Master</span>
            <p className="text-xs text-gray-500">Free plan</p>
          </div>
        </Link>
        <button
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Close menu"
        >
          <X className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        {renderNavSection('SEO Tools', navigation)}
        {renderNavSection('CRM & Pipeline', crmNavigation)}
        {renderNavSection('Projects', projectsNavigation)}
        {renderNavSection('Resources', resourcesNavigation)}
        {renderNavSection('System', systemNavigation)}
        {renderNavSection('Members', membersNavigation)}
      </nav>

      {/* Settings */}
      <div className="p-4 border-t border-gray-200/50">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <Settings className="h-5 w-5" />
          Settings
        </Link>
      </div>

      {/* Sign Out */}
      <div className="p-4 border-t border-gray-200/50">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors w-full"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
            {user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.user_metadata?.full_name || user?.user_metadata?.name || 'User'}
            </p>
            <p className="text-xs text-gray-500 truncate">{user?.email || 'Not signed in'}</p>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
