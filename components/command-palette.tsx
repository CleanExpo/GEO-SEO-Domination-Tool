'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Command as CommandPrimitive } from 'cmdk';
import {
  HomeIcon,
  BuildingIcon,
  KeyIcon,
  TrendingUpIcon,
  FileTextIcon,
  SearchIcon,
  PlusIcon,
  SettingsIcon,
  Building2Icon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Command {
  id: string;
  name: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  keywords?: string[];
  section: 'navigation' | 'search' | 'actions' | 'settings';
  action: () => void | Promise<void>;
  shortcut?: string;
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [search, setSearch] = React.useState('');
  const [recentCommands, setRecentCommands] = React.useState<string[]>([]);

  // Load recent commands from localStorage
  React.useEffect(() => {
    const recent = localStorage.getItem('recent-commands');
    if (recent) {
      setRecentCommands(JSON.parse(recent));
    }
  }, []);

  // Save recent command
  const addRecentCommand = React.useCallback((commandId: string) => {
    setRecentCommands((prev) => {
      const updated = [commandId, ...prev.filter((id) => id !== commandId)].slice(0, 5);
      localStorage.setItem('recent-commands', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Define all commands
  const commands: Command[] = React.useMemo(() => [
    // Navigation commands
    {
      id: 'nav-dashboard',
      name: 'Go to Dashboard',
      description: 'View your main dashboard',
      icon: HomeIcon,
      keywords: ['home', 'dashboard', 'overview'],
      section: 'navigation',
      action: () => router.push('/dashboard'),
      shortcut: 'g d',
    },
    {
      id: 'nav-companies',
      name: 'Go to Companies',
      description: 'Manage your companies',
      icon: BuildingIcon,
      keywords: ['companies', 'clients', 'businesses'],
      section: 'navigation',
      action: () => router.push('/companies'),
      shortcut: 'g c',
    },
    {
      id: 'nav-keywords',
      name: 'Go to Keywords',
      description: 'View keyword campaigns',
      icon: KeyIcon,
      keywords: ['keywords', 'seo', 'search'],
      section: 'navigation',
      action: () => router.push('/keywords'),
      shortcut: 'g k',
    },
    {
      id: 'nav-rankings',
      name: 'Go to Rankings',
      description: 'Check ranking positions',
      icon: TrendingUpIcon,
      keywords: ['rankings', 'positions', 'serp'],
      section: 'navigation',
      action: () => router.push('/rankings'),
      shortcut: 'g r',
    },
    {
      id: 'nav-reports',
      name: 'Go to Reports',
      description: 'View analytics reports',
      icon: FileTextIcon,
      keywords: ['reports', 'analytics', 'data'],
      section: 'navigation',
      action: () => router.push('/reports'),
      shortcut: 'g p',
    },
    {
      id: 'nav-audits',
      name: 'Go to SEO Audits',
      description: 'View SEO audit results',
      icon: SearchIcon,
      keywords: ['audits', 'seo', 'analysis'],
      section: 'navigation',
      action: () => router.push('/audits'),
      shortcut: 'g a',
    },

    // Search commands (3)
    {
      id: 'search-companies',
      name: 'Search Companies',
      description: 'Find companies by name',
      icon: SearchIcon,
      keywords: ['search', 'find', 'companies'],
      section: 'search',
      action: () => {
        router.push('/companies');
        // Focus search input after navigation
        setTimeout(() => {
          const searchInput = document.querySelector<HTMLInputElement>('[data-search-input]');
          searchInput?.focus();
        }, 100);
      },
    },
    {
      id: 'search-keywords',
      name: 'Search Keywords',
      description: 'Find keywords and campaigns',
      icon: SearchIcon,
      keywords: ['search', 'find', 'keywords'],
      section: 'search',
      action: () => {
        router.push('/keywords');
        setTimeout(() => {
          const searchInput = document.querySelector<HTMLInputElement>('[data-search-input]');
          searchInput?.focus();
        }, 100);
      },
    },
    {
      id: 'search-content',
      name: 'Search Content',
      description: 'Search across all content',
      icon: SearchIcon,
      keywords: ['search', 'find', 'content', 'global'],
      section: 'search',
      action: () => {
        router.push('/search');
      },
    },

    // Action commands (2)
    {
      id: 'new-company',
      name: 'New Company',
      description: 'Create a new company',
      icon: PlusIcon,
      keywords: ['new', 'create', 'add', 'company'],
      section: 'actions',
      action: () => router.push('/companies/new'),
      shortcut: 'n c',
    },
    {
      id: 'new-keyword',
      name: 'New Keyword Campaign',
      description: 'Start a new keyword campaign',
      icon: PlusIcon,
      keywords: ['new', 'create', 'add', 'keyword', 'campaign'],
      section: 'actions',
      action: () => router.push('/keywords/new'),
      shortcut: 'n k',
    },

    // Settings commands (2)
    {
      id: 'switch-organisation',
      name: 'Switch Organisation',
      description: 'Change active organisation',
      icon: Building2Icon,
      keywords: ['switch', 'organisation', 'tenant', 'change'],
      section: 'settings',
      action: () => {
        // Trigger organisation switcher dropdown
        const switcher = document.querySelector<HTMLButtonElement>('[data-organisation-switcher]');
        switcher?.click();
      },
    },
    {
      id: 'open-settings',
      name: 'Open Settings',
      description: 'Configure application settings',
      icon: SettingsIcon,
      keywords: ['settings', 'preferences', 'config'],
      section: 'settings',
      action: () => router.push('/settings'),
      shortcut: ',',
    },
  ], [router]);

  // Filter commands based on search
  const filteredCommands = React.useMemo(() => {
    if (!search) return commands;

    const lowerSearch = search.toLowerCase();
    return commands
      .map((cmd) => {
        let score = 0;

        // Exact name match
        if (cmd.name.toLowerCase() === lowerSearch) score += 10;
        // Name starts with search
        else if (cmd.name.toLowerCase().startsWith(lowerSearch)) score += 5;
        // Name includes search
        else if (cmd.name.toLowerCase().includes(lowerSearch)) score += 3;

        // Keyword match
        if (cmd.keywords?.some((k) => k.toLowerCase().includes(lowerSearch))) score += 2;

        // Description match
        if (cmd.description?.toLowerCase().includes(lowerSearch)) score += 1;

        return { ...cmd, score };
      })
      .filter((cmd) => cmd.score > 0)
      .sort((a, b) => b.score - a.score);
  }, [commands, search]);

  // Group commands by section
  const groupedCommands = React.useMemo(() => {
    const groups: Record<string, Command[]> = {
      navigation: [],
      search: [],
      actions: [],
      settings: [],
    };

    filteredCommands.forEach((cmd) => {
      groups[cmd.section].push(cmd);
    });

    return groups;
  }, [filteredCommands]);

  // Get recent command objects
  const recentCommandObjects = React.useMemo(() => {
    return recentCommands
      .map((id) => commands.find((cmd) => cmd.id === id))
      .filter(Boolean) as Command[];
  }, [recentCommands, commands]);

  const handleCommandSelect = React.useCallback(
    (command: Command) => {
      addRecentCommand(command.id);
      onOpenChange(false);
      command.action();
    },
    [addRecentCommand, onOpenChange]
  );

  // Reset search when closing
  React.useEffect(() => {
    if (!open) {
      setSearch('');
    }
  }, [open]);

  return (
    <CommandPrimitive.Dialog
      open={open}
      onOpenChange={onOpenChange}
      className="fixed inset-0 z-50"
    >
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      <div className="fixed left-1/2 top-[20%] z-50 w-full max-w-2xl -translate-x-1/2">
        <CommandPrimitive
          className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl"
          shouldFilter={false}
        >
          <div className="flex items-center border-b border-slate-200 px-4">
            <SearchIcon className="mr-2 h-5 w-5 text-slate-400" />
            <CommandPrimitive.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Type a command or search..."
              className="flex h-14 w-full border-0 bg-transparent py-3 text-base outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <kbd className="pointer-events-none hidden h-6 select-none items-center gap-1 rounded border border-slate-200 bg-slate-50 px-1.5 font-mono text-xs font-medium text-slate-600 opacity-100 sm:flex">
              Esc
            </kbd>
          </div>

          <CommandPrimitive.List className="max-h-[400px] overflow-y-auto p-2">
            <CommandPrimitive.Empty className="py-6 text-center text-sm text-slate-500">
              No commands found.
            </CommandPrimitive.Empty>

            {!search && recentCommandObjects.length > 0 && (
              <CommandPrimitive.Group heading="Recent" className="mb-2">
                <div className="mb-2 px-2 text-xs font-medium text-slate-500">Recent</div>
                {recentCommandObjects.map((cmd) => (
                  <CommandPrimitive.Item
                    key={cmd.id}
                    value={cmd.id}
                    onSelect={() => handleCommandSelect(cmd)}
                    className="relative flex cursor-pointer select-none items-center rounded-md px-3 py-2 text-sm outline-none data-[selected=true]:bg-slate-100 data-[selected=true]:text-slate-900"
                  >
                    {cmd.icon && <cmd.icon className="mr-3 h-4 w-4" />}
                    <div className="flex-1">
                      <div className="font-medium">{cmd.name}</div>
                      {cmd.description && (
                        <div className="text-xs text-slate-500">{cmd.description}</div>
                      )}
                    </div>
                    {cmd.shortcut && (
                      <kbd className="ml-auto hidden text-xs text-slate-400 sm:inline-block">
                        {cmd.shortcut}
                      </kbd>
                    )}
                  </CommandPrimitive.Item>
                ))}
              </CommandPrimitive.Group>
            )}

            {groupedCommands.navigation.length > 0 && (
              <CommandPrimitive.Group heading="Navigation">
                <div className="mb-2 px-2 text-xs font-medium text-slate-500">Navigation</div>
                {groupedCommands.navigation.map((cmd) => (
                  <CommandPrimitive.Item
                    key={cmd.id}
                    value={cmd.id}
                    onSelect={() => handleCommandSelect(cmd)}
                    className="relative flex cursor-pointer select-none items-center rounded-md px-3 py-2 text-sm outline-none data-[selected=true]:bg-slate-100 data-[selected=true]:text-slate-900"
                  >
                    {cmd.icon && <cmd.icon className="mr-3 h-4 w-4" />}
                    <div className="flex-1">
                      <div className="font-medium">{cmd.name}</div>
                      {cmd.description && (
                        <div className="text-xs text-slate-500">{cmd.description}</div>
                      )}
                    </div>
                    {cmd.shortcut && (
                      <kbd className="ml-auto hidden text-xs text-slate-400 sm:inline-block">
                        {cmd.shortcut}
                      </kbd>
                    )}
                  </CommandPrimitive.Item>
                ))}
              </CommandPrimitive.Group>
            )}

            {groupedCommands.search.length > 0 && (
              <CommandPrimitive.Group heading="Search" className="mt-2">
                <div className="mb-2 px-2 text-xs font-medium text-slate-500">Search</div>
                {groupedCommands.search.map((cmd) => (
                  <CommandPrimitive.Item
                    key={cmd.id}
                    value={cmd.id}
                    onSelect={() => handleCommandSelect(cmd)}
                    className="relative flex cursor-pointer select-none items-center rounded-md px-3 py-2 text-sm outline-none data-[selected=true]:bg-slate-100 data-[selected=true]:text-slate-900"
                  >
                    {cmd.icon && <cmd.icon className="mr-3 h-4 w-4" />}
                    <div className="flex-1">
                      <div className="font-medium">{cmd.name}</div>
                      {cmd.description && (
                        <div className="text-xs text-slate-500">{cmd.description}</div>
                      )}
                    </div>
                  </CommandPrimitive.Item>
                ))}
              </CommandPrimitive.Group>
            )}

            {groupedCommands.actions.length > 0 && (
              <CommandPrimitive.Group heading="Actions" className="mt-2">
                <div className="mb-2 px-2 text-xs font-medium text-slate-500">Actions</div>
                {groupedCommands.actions.map((cmd) => (
                  <CommandPrimitive.Item
                    key={cmd.id}
                    value={cmd.id}
                    onSelect={() => handleCommandSelect(cmd)}
                    className="relative flex cursor-pointer select-none items-center rounded-md px-3 py-2 text-sm outline-none data-[selected=true]:bg-slate-100 data-[selected=true]:text-slate-900"
                  >
                    {cmd.icon && <cmd.icon className="mr-3 h-4 w-4" />}
                    <div className="flex-1">
                      <div className="font-medium">{cmd.name}</div>
                      {cmd.description && (
                        <div className="text-xs text-slate-500">{cmd.description}</div>
                      )}
                    </div>
                    {cmd.shortcut && (
                      <kbd className="ml-auto hidden text-xs text-slate-400 sm:inline-block">
                        {cmd.shortcut}
                      </kbd>
                    )}
                  </CommandPrimitive.Item>
                ))}
              </CommandPrimitive.Group>
            )}

            {groupedCommands.settings.length > 0 && (
              <CommandPrimitive.Group heading="Settings" className="mt-2">
                <div className="mb-2 px-2 text-xs font-medium text-slate-500">Settings</div>
                {groupedCommands.settings.map((cmd) => (
                  <CommandPrimitive.Item
                    key={cmd.id}
                    value={cmd.id}
                    onSelect={() => handleCommandSelect(cmd)}
                    className="relative flex cursor-pointer select-none items-center rounded-md px-3 py-2 text-sm outline-none data-[selected=true]:bg-slate-100 data-[selected=true]:text-slate-900"
                  >
                    {cmd.icon && <cmd.icon className="mr-3 h-4 w-4" />}
                    <div className="flex-1">
                      <div className="font-medium">{cmd.name}</div>
                      {cmd.description && (
                        <div className="text-xs text-slate-500">{cmd.description}</div>
                      )}
                    </div>
                    {cmd.shortcut && (
                      <kbd className="ml-auto hidden text-xs text-slate-400 sm:inline-block">
                        {cmd.shortcut}
                      </kbd>
                    )}
                  </CommandPrimitive.Item>
                ))}
              </CommandPrimitive.Group>
            )}
          </CommandPrimitive.List>

          <div className="border-t border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-slate-300 bg-white px-1.5 py-0.5">↑</kbd>
                  <kbd className="rounded border border-slate-300 bg-white px-1.5 py-0.5">↓</kbd>
                  Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-slate-300 bg-white px-1.5 py-0.5">Enter</kbd>
                  Select
                </span>
              </div>
              <div>
                Press{' '}
                <kbd className="rounded border border-slate-300 bg-white px-1.5 py-0.5">⌘K</kbd> or{' '}
                <kbd className="rounded border border-slate-300 bg-white px-1.5 py-0.5">Ctrl+K</kbd> to open
              </div>
            </div>
          </div>
        </CommandPrimitive>
      </div>
    </CommandPrimitive.Dialog>
  );
}
