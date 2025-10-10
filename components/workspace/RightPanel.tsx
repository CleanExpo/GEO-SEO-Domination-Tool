/**
 * Right Panel
 *
 * Phase 1.1 Day 4: Right panel with Terminal, AI, Debug tabs
 */

'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Terminal, Bot, Bug } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export function RightPanel() {
  return (
    <div className="h-full flex flex-col">
      <Tabs defaultValue="terminal" className="h-full flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b">
          <TabsTrigger value="terminal" className="gap-2">
            <Terminal className="h-4 w-4" />
            Terminal
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

        <TabsContent value="terminal" className="flex-1 overflow-hidden m-0 p-0">
          <ScrollArea className="h-full bg-black/95 text-green-400 font-mono text-sm">
            <div className="p-4">
              <p>$ Terminal ready</p>
              <p>$ Will integrate with existing Terminal Pro in Phase 1.2</p>
              <p className="text-muted-foreground mt-2">_</p>
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
