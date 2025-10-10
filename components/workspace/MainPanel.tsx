/**
 * Main Panel
 *
 * Phase 1.1 Day 3: Center panel with tabs for open files/views
 */

'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { X, Plus } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface OpenTab {
  id: string;
  title: string;
  type: 'file' | 'dashboard' | 'view';
  dirty?: boolean;
}

export function MainPanel() {
  const [openTabs] = useState<OpenTab[]>([
    { id: 'welcome', title: 'Welcome', type: 'dashboard' },
  ]);
  const [activeTab, setActiveTab] = useState('welcome');

  return (
    <div className="h-full flex flex-col">
      {openTabs.length > 0 ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          {/* Tab Bar */}
          <div className="flex items-center border-b bg-muted/20">
            <ScrollArea className="flex-1">
              <TabsList className="h-10 rounded-none bg-transparent">
                {openTabs.map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="group gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                  >
                    <span>{tab.title}</span>
                    {tab.dirty && <span className="text-orange-500">●</span>}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle close - will implement in Phase 1.2
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </TabsTrigger>
                ))}
              </TabsList>
            </ScrollArea>
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Tab Content */}
          {openTabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="flex-1 m-0 p-0">
              <div className="h-full flex items-center justify-center">
                {tab.id === 'welcome' ? (
                  <div className="text-center space-y-4 p-8">
                    <h1 className="text-3xl font-bold">Welcome to GEO-SEO Workspace</h1>
                    <p className="text-muted-foreground">
                      Unified IDE ecosystem for SEO and marketing operations
                    </p>
                    <div className="flex gap-4 justify-center pt-4">
                      <Button>Open Client</Button>
                      <Button variant="outline">Browse Files</Button>
                      <Button variant="outline">Run Agent</Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-muted-foreground">
                    <p>Content for {tab.title}</p>
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <div className="h-full flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <p className="text-lg mb-2">No files open</p>
            <p className="text-sm">Open a file from the sidebar to get started</p>
          </div>
        </div>
      )}
    </div>
  );
}
