'use client';

/**
 * Enhanced Terminal Pro - VS Code-like IDE
 *
 * Features:
 * - File browser with tree view
 * - Monaco code editor with syntax highlighting
 * - Multiple terminal tabs
 * - Resizable panels (split-screen)
 * - Drag-and-drop file upload
 * - Keyboard shortcuts
 * - Full workspace management
 */

import { useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { FileBrowser } from '@/components/terminal/FileBrowser';
import { CodeEditor } from '@/components/terminal/CodeEditor';
import { TerminalTabs } from '@/components/terminal/TerminalTabs';
import { FileUploadZone } from '@/components/terminal/FileUploadZone';
import {
  Code,
  Terminal as TerminalIcon,
  Settings,
  Layout,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: string;
  children?: FileNode[];
}

interface OpenFile {
  name: string;
  path: string;
  content: string;
  language?: string;
}

export default function TerminalProPage() {
  const [workspaceId] = useState('default');
  const [clientId] = useState('owner');
  const [brandName] = useState('GEO-SEO Terminal Pro');

  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [activeFile, setActiveFile] = useState<OpenFile | undefined>();
  const [layout, setLayout] = useState<'ide' | 'terminal-focus' | 'editor-focus'>('ide');
  const [showFileBrowser, setShowFileBrowser] = useState(true);

  const handleFileSelect = async (file: FileNode) => {
    if (file.type === 'directory') return;

    // Check if file is already open
    const existingFile = openFiles.find((f) => f.path === file.path);
    if (existingFile) {
      setActiveFile(existingFile);
      return;
    }

    try {
      // Fetch file content
      const response = await fetch(
        `/api/terminal/files/content?workspaceId=${workspaceId}&clientId=${clientId}&path=${encodeURIComponent(
          file.path
        )}`
      );
      const data = await response.json();

      if (data.success) {
        const newFile: OpenFile = {
          name: file.name,
          path: file.path,
          content: data.content
        };

        setOpenFiles((prev) => [...prev, newFile]);
        setActiveFile(newFile);
      }
    } catch (error) {
      console.error('Error loading file:', error);
    }
  };

  const handleFileClose = (filePath: string) => {
    setOpenFiles((prev) => prev.filter((f) => f.path !== filePath));

    if (activeFile?.path === filePath) {
      const remainingFiles = openFiles.filter((f) => f.path !== filePath);
      setActiveFile(remainingFiles[0]);
    }
  };

  const handleFileSave = async (content: string) => {
    if (!activeFile) return;

    try {
      const response = await fetch('/api/terminal/files', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          clientId,
          path: activeFile.path,
          content
        })
      });

      const data = await response.json();

      if (data.success) {
        // Update file content
        setOpenFiles((prev) =>
          prev.map((f) => (f.path === activeFile.path ? { ...f, content } : f))
        );
        setActiveFile({ ...activeFile, content });
      }
    } catch (error) {
      console.error('Error saving file:', error);
    }
  };

  const handleUploadComplete = (paths: string[]) => {
    console.log('Uploaded files:', paths);
    // Optionally refresh file browser
  };

  const getPanelSizes = () => {
    switch (layout) {
      case 'terminal-focus':
        return { sidebar: 15, editor: 25, terminal: 60 };
      case 'editor-focus':
        return { sidebar: 15, editor: 65, terminal: 20 };
      default:
        return { sidebar: 20, editor: 50, terminal: 30 };
    }
  };

  const sizes = getPanelSizes();

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Code className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">{brandName}</h1>
          </div>

          <div className="h-6 w-px bg-border" />

          <Tabs value={workspaceId} className="w-auto">
            <TabsList className="h-8">
              <TabsTrigger value="default" className="text-sm">
                Workspace: {workspaceId}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex items-center gap-2">
          {/* Layout Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <Layout className="h-4 w-4 mr-2" />
                Layout
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Layout Presets</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setLayout('ide')}>
                <Layout className="h-4 w-4 mr-2" />
                IDE (Balanced)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLayout('editor-focus')}>
                <Maximize2 className="h-4 w-4 mr-2" />
                Editor Focus
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLayout('terminal-focus')}>
                <TerminalIcon className="h-4 w-4 mr-2" />
                Terminal Focus
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowFileBrowser(!showFileBrowser)}>
                {showFileBrowser ? (
                  <Minimize2 className="h-4 w-4 mr-2" />
                ) : (
                  <Maximize2 className="h-4 w-4 mr-2" />
                )}
                {showFileBrowser ? 'Hide' : 'Show'} Sidebar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Content - Resizable Panels */}
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          {/* File Browser Sidebar */}
          {showFileBrowser && (
            <>
              <Panel defaultSize={sizes.sidebar} minSize={15} maxSize={35}>
                <FileBrowser
                  workspaceId={workspaceId}
                  clientId={clientId}
                  onFileSelect={handleFileSelect}
                />
              </Panel>
              <PanelResizeHandle className="w-px bg-border hover:bg-primary transition-colors" />
            </>
          )}

          {/* Editor and Terminal */}
          <Panel defaultSize={showFileBrowser ? 100 - sizes.sidebar : 100}>
            <PanelGroup direction="vertical">
              {/* Code Editor */}
              <Panel defaultSize={sizes.editor} minSize={20}>
                <div className="h-full">
                  {openFiles.length > 0 ? (
                    <Tabs value={activeFile?.path} className="h-full flex flex-col">
                      <TabsList className="w-full justify-start rounded-none border-b h-10 bg-muted/50">
                        {openFiles.map((file) => (
                          <TabsTrigger
                            key={file.path}
                            value={file.path}
                            onClick={() => setActiveFile(file)}
                            className="relative data-[state=active]:bg-background"
                          >
                            {file.name}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 ml-2 hover:bg-accent"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFileClose(file.path);
                              }}
                            >
                              ×
                            </Button>
                          </TabsTrigger>
                        ))}
                      </TabsList>

                      {openFiles.map((file) => (
                        <TabsContent
                          key={file.path}
                          value={file.path}
                          className="flex-1 m-0 data-[state=active]:flex"
                        >
                          <CodeEditor
                            file={file}
                            onSave={handleFileSave}
                            workspaceId={workspaceId}
                            clientId={clientId}
                          />
                        </TabsContent>
                      ))}
                    </Tabs>
                  ) : (
                    <CodeEditor />
                  )}
                </div>
              </Panel>

              <PanelResizeHandle className="h-px bg-border hover:bg-primary transition-colors" />

              {/* Terminal */}
              <Panel defaultSize={100 - sizes.editor} minSize={15}>
                <TerminalTabs
                  workspaceId={workspaceId}
                  clientId={clientId}
                  brandName={brandName}
                />
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>

      {/* File Upload Zone (Drag & Drop Overlay) */}
      <FileUploadZone
        workspaceId={workspaceId}
        clientId={clientId}
        targetPath="/"
        onUploadComplete={handleUploadComplete}
      />

      {/* Keyboard Shortcuts Help (Hidden, can be toggled) */}
      <div className="hidden">
        <h3>Keyboard Shortcuts</h3>
        <ul>
          <li>Ctrl+T: New Terminal</li>
          <li>Ctrl+W: Close Terminal</li>
          <li>Ctrl+S: Save File</li>
          <li>Ctrl+Z: Undo</li>
          <li>Ctrl+Tab: Next Terminal</li>
          <li>Ctrl+B: Toggle Sidebar</li>
        </ul>
      </div>
    </div>
  );
}
