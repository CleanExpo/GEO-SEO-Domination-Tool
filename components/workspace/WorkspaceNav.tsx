/**
 * Workspace Navigation Bar
 *
 * Phase 1.1 Day 2: Top navigation with workspace switcher and actions
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  ChevronDown,
  Layout,
  Save,
  FolderOpen,
  Settings,
  Command,
} from 'lucide-react';

interface WorkspaceNavProps {
  workspaceName?: string;
  onSave?: () => void;
  onLoad?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenSettings?: () => void;
}

export function WorkspaceNav({
  workspaceName = 'Default Workspace',
  onSave,
  onLoad,
  onOpenCommandPalette,
  onOpenSettings,
}: WorkspaceNavProps) {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!onSave) return;
    setIsSaving(true);
    try {
      await onSave();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-12 border-b bg-background flex items-center justify-between px-4">
      {/* Left: Workspace selector */}
      <div className="flex items-center gap-2">
        <Layout className="h-5 w-5 text-primary" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="font-semibold">
              {workspaceName}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLoad}>
              <FolderOpen className="mr-2 h-4 w-4" />
              Open Workspace...
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSave} disabled={isSaving}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Workspace'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Layout className="mr-2 h-4 w-4" />
              Default Workspace
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Layout className="mr-2 h-4 w-4" />
              Client-Focused
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Layout className="mr-2 h-4 w-4" />
              Coding-Focused
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Layout className="mr-2 h-4 w-4" />
              Agent-Focused
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Center: Breadcrumbs or current context */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>GEO-SEO Domination Tool</span>
      </div>

      {/* Right: Quick actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenCommandPalette}
          className="gap-2"
        >
          <Command className="h-4 w-4" />
          <span className="hidden md:inline">Command Palette</span>
          <kbd className="hidden md:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenSettings}
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
