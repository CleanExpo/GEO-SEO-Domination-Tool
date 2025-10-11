'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/auth/supabase-client';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  LayoutDashboard, Building2, Search, TrendingUp, BarChart3, FileText,
  Settings, Home, FolderKanban, MessageSquare,
  Headphones, Clock, LogOut, Menu, X, Activity, Zap, Terminal, Bot, Code, UserPlus, Lightbulb, Inbox, Shield, ClipboardCheck
} from 'lucide-react';

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard, section: 'SEO' },
  { name: 'New Client', href: '/onboarding/new', icon: UserPlus, section: 'SEO', badge: 'AUTO' },
  { name: 'Companies', href: '/companies', icon: Building2, section: 'SEO' },
  { name: 'Content Opportunities', href: '/content-opportunities', icon: Lightbulb, section: 'SEO', badge: 'NEW' },
  { name: 'SEO Audits', href: '/audits', icon: Search, section: 'SEO' },
  { name: 'SEO Audit Tools', href: '/seo/audits', icon: Zap, section: 'SEO' },
  { name: 'Layout Audit', href: '/layout-audit', icon: ClipboardCheck, section: 'SEO', badge: 'NEW' },
  { name: 'Keywords', href: '/keywords', icon: TrendingUp, section: 'SEO' },
  { name: 'Rankings', href: '/rankings', icon: BarChart3, section: 'SEO' },
  { name: 'Reports', href: '/reports', icon: FileText, section: 'SEO' },
  { name: 'Schedule', href: '/schedule', icon: Clock, section: 'SEO' },
];

const automationNavigation = [
  { name: 'Post-Audit System', href: '/post-audit', icon: Shield, section: 'Automation', badge: 'NEW' },
  { name: 'Task Inbox', href: '/task-inbox', icon: Inbox, section: 'Automation', badge: 'AUTONOMOUS' },
  { name: 'AI Agents', href: '/sandbox/agents', icon: Bot, section: 'Automation', badge: 'NEW' },
  { name: 'SEO Monitor', href: '/sandbox/seo-monitor', icon: Activity, section: 'Automation', badge: 'NEW' },
  { name: 'Terminal Pro', href: '/sandbox/terminal-pro', icon: Code, section: 'Automation', badge: 'PRO' },
  { name: 'Tactical Coding', href: '/tactical', icon: Zap, section: 'Automation', badge: 'NEW' },
];

const resourcesNavigation = [
  { name: 'Prompts Library', href: '/resources/prompts', icon: MessageSquare, section: 'Resources' },
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
      <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 px-3 mb-2 font-semibold">
        {title}
      </p>
      <div className="space-y-1">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-900 dark:text-emerald-100 shadow-sm'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
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
        w-64 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-r border-gray-200/50 dark:border-gray-700/50
        flex flex-col overflow-hidden
        transform transition-all duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
      {/* Logo */}
      <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow-lg">
            <Home className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="font-semibold text-gray-900 dark:text-gray-100">SEO Master</span>
            <p className="text-xs text-gray-500 dark:text-gray-400">Free plan</p>
          </div>
        </Link>
        <button
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          aria-label="Close menu"
        >
          <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        {renderNavSection('SEO Tools', navigation)}
        {renderNavSection('Automation', automationNavigation)}
        {renderNavSection('Resources', resourcesNavigation)}
        {renderNavSection('Support', membersNavigation)}
      </nav>

      {/* Settings & Theme Toggle */}
      <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center justify-between gap-2 mb-2">
          <Link
            href="/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-1"
          >
            <Settings className="h-5 w-5" />
            Settings
          </Link>
          <ThemeToggle />
        </div>
      </div>

      {/* Sign In/Out */}
      <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50">
        {user ? (
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors w-full"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        ) : (
          <Link
            href="/auth/signin"
            className="flex items-center justify-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/30 w-full"
          >
            <UserPlus className="h-5 w-5" />
            Sign In / Sign Up
          </Link>
        )}
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold shadow-lg">
            {user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {user?.user_metadata?.full_name || user?.user_metadata?.name || 'User'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email || 'Not signed in'}</p>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
