/**
 * Bottom Panel
 *
 * Phase 1.1 Day 4: Bottom panel with Tasks, Problems, Output, Git tabs
 */

'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckSquare, AlertCircle, Terminal, GitBranch } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export function BottomPanel() {
  return (
    <div className="h-full flex flex-col">
      <Tabs defaultValue="output" className="h-full flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b">
          <TabsTrigger value="tasks" className="gap-2">
            <CheckSquare className="h-4 w-4" />
            Tasks
          </TabsTrigger>
          <TabsTrigger value="problems" className="gap-2">
            <AlertCircle className="h-4 w-4" />
            Problems
          </TabsTrigger>
          <TabsTrigger value="output" className="gap-2">
            <Terminal className="h-4 w-4" />
            Output
          </TabsTrigger>
          <TabsTrigger value="git" className="gap-2">
            <GitBranch className="h-4 w-4" />
            Git
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="flex-1 overflow-hidden m-0 p-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckSquare className="h-4 w-4 text-green-500" />
                <span>Phase 1.1 Day 1: Complete</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckSquare className="h-4 w-4 text-green-500" />
                <span>Phase 1.1 Day 2: Complete</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-primary">
                <CheckSquare className="h-4 w-4" />
                <span>Phase 1.1 Day 3-4: In Progress...</span>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="problems" className="flex-1 overflow-hidden m-0 p-0">
          <ScrollArea className="h-full">
            <div className="p-4 text-sm text-muted-foreground">
              <p>No problems detected</p>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="output" className="flex-1 overflow-hidden m-0 p-0">
          <ScrollArea className="h-full bg-black/95 text-white font-mono text-xs">
            <div className="p-4 space-y-1">
              <p className="text-green-400">[13:45:00] ✓ Phase 1.1 Day 1 Complete</p>
              <p className="text-green-400">[13:45:30] ✓ Phase 1.1 Day 2 Complete</p>
              <p className="text-blue-400">[13:46:00] → Building panel components...</p>
              <p className="text-gray-400">[13:46:01] Creating UnifiedSidebar.tsx</p>
              <p className="text-gray-400">[13:46:02] Creating MainPanel.tsx</p>
              <p className="text-gray-400">[13:46:03] Creating RightPanel.tsx</p>
              <p className="text-gray-400">[13:46:04] Creating BottomPanel.tsx</p>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="git" className="flex-1 overflow-hidden m-0 p-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <GitBranch className="h-4 w-4" />
                <span className="font-semibold">main</span>
              </div>
              <p className="text-muted-foreground text-xs">
                Full Git integration in Phase 2.2
              </p>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
