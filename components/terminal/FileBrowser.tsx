'use client';

/**
 * File Browser Component
 *
 * VS Code-style file explorer for workspace navigation:
 * - Tree view of files and folders
 * - Expand/collapse folders
 * - File icons by extension
 * - Right-click context menu
 * - Search/filter files
 */

import { useState, useEffect } from 'react';
import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  FileJson,
  Image as ImageIcon,
  Search,
  RefreshCw,
  MoreVertical,
  Trash2,
  Download,
  FilePlus,
  FolderPlus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator
} from '@/components/ui/context-menu';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: string;
  children?: FileNode[];
}

interface FileBrowserProps {
  workspaceId: string;
  clientId: string;
  onFileSelect: (file: FileNode) => void;
  onFileDelete?: (file: FileNode) => void;
  onFileCreate?: (name: string, type: 'file' | 'directory') => void;
}

export function FileBrowser({
  workspaceId,
  clientId,
  onFileSelect,
  onFileDelete,
  onFileCreate
}: FileBrowserProps) {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadFiles();
  }, [workspaceId, clientId]);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/terminal/files?workspaceId=${workspaceId}&clientId=${clientId}`);
      const data = await response.json();

      if (data.success) {
        setFiles(data.files || []);
      }
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const handleFileClick = (file: FileNode) => {
    setSelectedFile(file.path);
    if (file.type === 'file') {
      onFileSelect(file);
    } else {
      toggleFolder(file.path);
    }
  };

  const getFileIcon = (file: FileNode) => {
    if (file.type === 'directory') {
      return expandedFolders.has(file.path) ? (
        <FolderOpen className="h-4 w-4 text-blue-500" />
      ) : (
        <Folder className="h-4 w-4 text-blue-500" />
      );
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js':
      case 'ts':
      case 'jsx':
      case 'tsx':
      case 'py':
      case 'java':
      case 'cpp':
      case 'c':
      case 'go':
      case 'rs':
        return <FileCode className="h-4 w-4 text-yellow-500" />;
      case 'json':
        return <FileJson className="h-4 w-4 text-green-500" />;
      case 'md':
      case 'txt':
        return <FileText className="h-4 w-4 text-gray-500" />;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
        return <ImageIcon className="h-4 w-4 text-purple-500" />;
      default:
        return <File className="h-4 w-4 text-gray-400" />;
    }
  };

  const filterFiles = (nodes: FileNode[], query: string): FileNode[] => {
    if (!query) return nodes;

    return nodes.reduce((acc: FileNode[], node) => {
      const matches = node.name.toLowerCase().includes(query.toLowerCase());

      if (node.type === 'directory' && node.children) {
        const filteredChildren = filterFiles(node.children, query);
        if (filteredChildren.length > 0 || matches) {
          acc.push({
            ...node,
            children: filteredChildren
          });
        }
      } else if (matches) {
        acc.push(node);
      }

      return acc;
    }, []);
  };

  const renderFileTree = (nodes: FileNode[], level: number = 0) => {
    const filteredNodes = level === 0 ? filterFiles(nodes, searchQuery) : nodes;

    return filteredNodes.map((node) => (
      <div key={node.path}>
        <ContextMenu>
          <ContextMenuTrigger>
            <div
              className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-accent rounded-md transition-colors ${
                selectedFile === node.path ? 'bg-accent' : ''
              }`}
              style={{ paddingLeft: `${level * 16 + 8}px` }}
              onClick={() => handleFileClick(node)}
            >
              {node.type === 'directory' && (
                <span className="flex-shrink-0">
                  {expandedFolders.has(node.path) ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </span>
              )}
              {getFileIcon(node)}
              <span className="text-sm truncate flex-1">{node.name}</span>
            </div>
          </ContextMenuTrigger>

          <ContextMenuContent>
            {node.type === 'file' && (
              <>
                <ContextMenuItem onClick={() => onFileSelect(node)}>
                  <FileCode className="h-4 w-4 mr-2" />
                  Open
                </ContextMenuItem>
                <ContextMenuItem>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </ContextMenuItem>
                <ContextMenuSeparator />
              </>
            )}
            {node.type === 'directory' && (
              <>
                <ContextMenuItem onClick={() => onFileCreate?.('', 'file')}>
                  <FilePlus className="h-4 w-4 mr-2" />
                  New File
                </ContextMenuItem>
                <ContextMenuItem onClick={() => onFileCreate?.('', 'directory')}>
                  <FolderPlus className="h-4 w-4 mr-2" />
                  New Folder
                </ContextMenuItem>
                <ContextMenuSeparator />
              </>
            )}
            <ContextMenuItem
              className="text-destructive"
              onClick={() => onFileDelete?.(node)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>

        {node.type === 'directory' && expandedFolders.has(node.path) && node.children && (
          <div>
            {renderFileTree(node.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="flex flex-col h-full border-r bg-background">
      {/* Header */}
      <div className="p-3 border-b">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide">Explorer</h3>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={loadFiles}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => onFileCreate?.('', 'file')}
            >
              <FilePlus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => onFileCreate?.('', 'directory')}
            >
              <FolderPlus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>

      {/* File Tree */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {loading && files.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              Loading files...
            </div>
          ) : files.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-sm text-muted-foreground">
              <Folder className="h-12 w-12 mb-2 opacity-50" />
              <p>No files in workspace</p>
            </div>
          ) : (
            renderFileTree(files)
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
