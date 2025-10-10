/**
 * Right Panel
 *
 * Phase 1.1 Day 5-7: Connected to WorkspaceContext for terminal management
 */

'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Terminal, Bot, Bug, Plus, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useWorkspace } from '@/lib/workspace/WorkspaceContext';

export function RightPanel() {
  const { terminals, createTerminal, closeTerminal, setActiveTerminal } = useWorkspace();

  const activeTerminal = terminals.find(t => t.active);

  const handleNewTerminal = () => {
    const terminal = createTerminal();
    console.log('Created new terminal:', terminal.name);
  };

  const handleCloseTerminal = (id: string) => {
    closeTerminal(id);
  };

  const handleSwitchTerminal = (id: string) => {
    setActiveTerminal(id);
  };

  return (
    <div className="h-full flex flex-col">
      <Tabs defaultValue="terminal" className="h-full flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b">
          <TabsTrigger value="terminal" className="gap-2">
            <Terminal className="h-4 w-4" />
            Terminal
            {terminals.length > 0 && (
              <span className="text-xs text-muted-foreground">({terminals.length})</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="ai" className="gap-2">
            <Bot className="h-4 w-4" />
            AI Chat
          </TabsTrigger>
          <TabsTrigger value="debug" className="gap-2">
            <Bug className="h-4 w-4" />
            Debug
          </TabsTrigger>
        </TabsList>

        <TabsContent value="terminal" className="flex-1 overflow-hidden m-0 p-0 flex flex-col">
          {/* Terminal tabs */}
          {terminals.length > 0 && (
            <div className="flex items-center gap-1 border-b bg-muted/20 px-2 py-1">
              {terminals.map((terminal) => (
                <div
                  key={terminal.id}
                  className={`flex items-center gap-2 px-3 py-1 rounded-md cursor-pointer text-xs ${
                    terminal.active ? 'bg-background border' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => handleSwitchTerminal(terminal.id)}
                >
                  <span>{terminal.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-3 w-3 p-0 hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCloseTerminal(terminal.id);
                    }}
                  >
                    <X className="h-2 w-2" />
                  </Button>
                </div>
              ))}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleNewTerminal}
                title="New terminal"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          )}

          <ScrollArea className="flex-1 bg-black/95 text-green-400 font-mono text-sm">
            <div className="p-4">
              {activeTerminal ? (
                <div>
                  <p className="text-blue-400">$ {activeTerminal.name}</p>
                  <p className="text-muted-foreground">Working directory: {activeTerminal.cwd}</p>
                  {activeTerminal.history.length > 0 ? (
                    <div className="mt-2 space-y-1">
                      {activeTerminal.history.map((entry, i) => (
                        <div key={i}>
                          <p className="text-white">$ {entry.command}</p>
                          <p className="text-green-400">{entry.output}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-muted-foreground">No command history</p>
                  )}
                  <p className="text-green-400 mt-2">_</p>
                </div>
              ) : (
                <div>
                  <p>$ Terminal ready</p>
                  <p>$ Click + to create a new terminal</p>
                  <p>$ Will integrate with existing Terminal Pro in Phase 1.2</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={handleNewTerminal}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Terminal
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="ai" className="flex-1 overflow-hidden m-0 p-0">
          <ScrollArea className="h-full">
            <div className="p-4">
              <h3 className="text-sm font-semibold mb-3">AI Assistant</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Chat with AI agents</p>
                <p>Ask questions about your data</p>
                <p>Get recommendations</p>
                <p className="pt-2 text-xs">Phase 3: Full agent chat interface</p>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="debug" className="flex-1 overflow-hidden m-0 p-0">
          <ScrollArea className="h-full">
            <div className="p-4">
              <h3 className="text-sm font-semibold mb-3">Debug Console</h3>
              <div className="space-y-1 text-sm text-muted-foreground font-mono">
                <p>[INFO] Debug console ready</p>
                <p>[INFO] Phase 2: Debug integration</p>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
