/**
 * Unified Sidebar
 *
 * Phase 1.1 Day 5-7: Connected to WorkspaceContext
 * - Files: File explorer
 * - Clients: Client list with context switching
 * - Agents: Agent management with status display
 * - Git: Source control
 */

'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Files, Users, Bot, GitBranch, Circle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useWorkspace } from '@/lib/workspace/WorkspaceContext';

export function UnifiedSidebar() {
  const { context, agents } = useWorkspace();

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
            {agents.filter(a => a.status === 'running').length > 0 && (
              <Circle className="h-2 w-2 fill-green-500 text-green-500" />
            )}
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
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">Clients</h3>
                <Button variant="ghost" size="sm">+ New</Button>
              </div>

              {context.currentClient ? (
                <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-md">
                  <div className="flex items-center gap-2">
                    <Circle className="h-2 w-2 fill-primary text-primary" />
                    <div>
                      <p className="text-sm font-semibold">{context.currentClient.name}</p>
                      <p className="text-xs text-muted-foreground">{context.currentClient.domain}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-4 p-3 border border-dashed rounded-md text-center text-sm text-muted-foreground">
                  No client selected
                </div>
              )}

              <div className="space-y-1 text-sm text-muted-foreground">
                <p>• Client list will appear here</p>
                <p>• Click to switch context</p>
                <p>• Full data in Phase 1.2</p>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="agents" className="flex-1 overflow-hidden m-0 p-0">
          <ScrollArea className="h-full">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">Autonomous Agents</h3>
                <span className="text-xs text-muted-foreground">
                  {agents.filter(a => a.status === 'running').length}/{agents.length} running
                </span>
              </div>

              {agents.length > 0 ? (
                <div className="space-y-2 mb-4">
                  {agents.map(agent => (
                    <div key={agent.id} className="p-2 border rounded-md">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Circle className={`h-2 w-2 ${
                            agent.status === 'running' ? 'fill-green-500 text-green-500' :
                            agent.status === 'error' ? 'fill-red-500 text-red-500' :
                            'fill-muted-foreground text-muted-foreground'
                          }`} />
                          <span className="text-sm font-medium">{agent.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{agent.status}</span>
                      </div>
                      {agent.progress > 0 && (
                        <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${agent.progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mb-4 p-3 border border-dashed rounded-md text-center text-sm text-muted-foreground">
                  No agents running
                </div>
              )}

              <div className="space-y-1 text-sm text-muted-foreground">
                <p>• Competitive Intelligence</p>
                <p>• Content Generator</p>
                <p>• SEO Optimizer</p>
                <p>• Full control in Phase 3</p>
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
