/**
 * Unified Sidebar
 *
 * Phase 1.1 Day 3: Left sidebar with multiple views
 * - Files: File explorer
 * - Clients: Client list
 * - Agents: Agent management
 * - Git: Source control
 */

'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Files, Users, Bot, GitBranch } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export function UnifiedSidebar() {
  return (
    <div className="h-full flex flex-col bg-muted/30">
      <Tabs defaultValue="files" className="h-full flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b">
          <TabsTrigger value="files" className="gap-2">
            <Files className="h-4 w-4" />
            <span className="hidden md:inline">Files</span>
          </TabsTrigger>
          <TabsTrigger value="clients" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden md:inline">Clients</span>
          </TabsTrigger>
          <TabsTrigger value="agents" className="gap-2">
            <Bot className="h-4 w-4" />
            <span className="hidden md:inline">Agents</span>
          </TabsTrigger>
          <TabsTrigger value="git" className="gap-2">
            <GitBranch className="h-4 w-4" />
            <span className="hidden md:inline">Git</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="files" className="flex-1 overflow-hidden m-0 p-0">
          <ScrollArea className="h-full">
            <div className="p-4">
              <h3 className="text-sm font-semibold mb-3">File Explorer</h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>• Will show file tree</p>
                <p>• Connected in Phase 1.2</p>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="clients" className="flex-1 overflow-hidden m-0 p-0">
          <ScrollArea className="h-full">
            <div className="p-4">
              <h3 className="text-sm font-semibold mb-3">Clients</h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>• Client list will appear here</p>
                <p>• Click to switch context</p>
                <p>• Connected in Phase 1.2</p>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="agents" className="flex-1 overflow-hidden m-0 p-0">
          <ScrollArea className="h-full">
            <div className="p-4">
              <h3 className="text-sm font-semibold mb-3">Autonomous Agents</h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>• Competitive Intelligence</p>
                <p>• Content Generator</p>
                <p>• SEO Optimizer</p>
                <p>• Full UI in Phase 3</p>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="git" className="flex-1 overflow-hidden m-0 p-0">
          <ScrollArea className="h-full">
            <div className="p-4">
              <h3 className="text-sm font-semibold mb-3">Source Control</h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>• Git status</p>
                <p>• Stage/commit</p>
                <p>• Push/pull</p>
                <p>• Full UI in Phase 2.2</p>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
