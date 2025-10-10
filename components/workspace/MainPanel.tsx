/**
 * Main Panel
 *
 * Phase 1.1 Day 5-7: Connected to WorkspaceContext for file management
 */

'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { X, Plus, Save } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useWorkspace } from '@/lib/workspace/WorkspaceContext';

export function MainPanel() {
  const { openFiles, activeFile, setActiveFile, closeFile, saveFile } = useWorkspace();

  const handleCloseFile = (e: React.MouseEvent, fileId: string) => {
    e.stopPropagation();
    closeFile(fileId);
  };

  const handleSaveFile = async (fileId: string) => {
    try {
      await saveFile(fileId);
    } catch (error) {
      console.error('Failed to save file:', error);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {openFiles.length > 0 ? (
        <Tabs
          value={activeFile?.id || openFiles[0].id}
          onValueChange={(id) => {
            const file = openFiles.find(f => f.id === id);
            if (file) setActiveFile(file);
          }}
          className="h-full flex flex-col"
        >
          {/* Tab Bar */}
          <div className="flex items-center border-b bg-muted/20">
            <ScrollArea className="flex-1">
              <TabsList className="h-10 rounded-none bg-transparent">
                {openFiles.map((file) => (
                  <TabsTrigger
                    key={file.id}
                    value={file.id}
                    className="group gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                  >
                    <span>{file.name}</span>
                    {file.dirty && (
                      <span className="text-orange-500 cursor-pointer" onClick={() => handleSaveFile(file.id)}>●</span>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100"
                      onClick={(e) => handleCloseFile(e, file.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </TabsTrigger>
                ))}
              </TabsList>
            </ScrollArea>
            <div className="flex items-center">
              {activeFile?.dirty && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10"
                  onClick={() => activeFile && handleSaveFile(activeFile.id)}
                  title="Save file (Cmd+S)"
                >
                  <Save className="h-4 w-4" />
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-10 w-10" title="New file">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Tab Content */}
          {openFiles.map((file) => (
            <TabsContent key={file.id} value={file.id} className="flex-1 m-0 p-0">
              <div className="h-full flex flex-col">
                {/* File metadata bar */}
                <div className="px-4 py-2 border-b bg-muted/10 text-xs text-muted-foreground">
                  <span>{file.path}</span>
                  {file.dirty && <span className="ml-2 text-orange-500">● Modified</span>}
                </div>

                {/* File content */}
                <ScrollArea className="flex-1">
                  <div className="p-4 font-mono text-sm">
                    <pre>{file.content || '// File content will appear here'}</pre>
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <div className="h-full flex items-center justify-center text-muted-foreground">
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
        </div>
      )}
    </div>
  );
}
