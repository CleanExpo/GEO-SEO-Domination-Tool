'use client'

import { useState } from 'react'
import { File, Folder, FolderOpen, ChevronRight, ChevronDown, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FileTreeProps {
  sessionId: string
  fileTree: Record<string, any>
}

interface FileNode {
  name: string
  type: 'file' | 'folder'
  path: string
  children?: FileNode[]
  content?: string
}

export default function FileTree({ sessionId, fileTree }: FileTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['/']))
  const [selectedFile, setSelectedFile] = useState<string | null>(null)

  // Convert file tree object to hierarchical structure
  const buildTree = (tree: Record<string, any>): FileNode[] => {
    if (!tree || typeof tree !== 'object') return []

    return Object.entries(tree).map(([name, value]) => {
      const isFolder = typeof value === 'object' && value !== null && !value.content
      return {
        name,
        type: isFolder ? 'folder' : 'file',
        path: name,
        children: isFolder ? buildTree(value) : undefined,
        content: value?.content,
      }
    })
  }

  const tree = buildTree(fileTree)

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }

  const handleFileClick = (path: string) => {
    setSelectedFile(path)
    // TODO: Load file content and display in editor
  }

  const renderNode = (node: FileNode, depth: number = 0): React.ReactNode => {
    const isExpanded = expandedFolders.has(node.path)
    const isSelected = selectedFile === node.path

    if (node.type === 'folder') {
      return (
        <div key={node.path}>
          <div
            className={`flex items-center gap-1 px-2 py-1 hover:bg-muted cursor-pointer ${
              isSelected ? 'bg-muted' : ''
            }`}
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
            onClick={() => toggleFolder(node.path)}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            {isExpanded ? (
              <FolderOpen className="h-4 w-4 text-primary" />
            ) : (
              <Folder className="h-4 w-4 text-primary" />
            )}
            <span className="text-sm font-medium">{node.name}</span>
          </div>
          {isExpanded && node.children && (
            <div>{node.children.map((child) => renderNode(child, depth + 1))}</div>
          )}
        </div>
      )
    }

    return (
      <div
        key={node.path}
        className={`flex items-center gap-1 px-2 py-1 hover:bg-muted cursor-pointer ${
          isSelected ? 'bg-primary/10' : ''
        }`}
        style={{ paddingLeft: `${depth * 12 + 32}px` }}
        onClick={() => handleFileClick(node.path)}
      >
        <File className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm">{node.name}</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
        <span className="text-xs font-semibold text-muted-foreground">FILES</span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" disabled>
            <Plus className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="sm" disabled>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto py-2">
        {tree.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
            <Folder className="h-12 w-12 opacity-50 mb-2" />
            <p className="text-sm text-center">No files yet</p>
            <p className="text-xs text-center mt-1">
              Create a task to generate code
            </p>
          </div>
        ) : (
          tree.map((node) => renderNode(node))
        )}
      </div>

      {/* Info */}
      {selectedFile && (
        <div className="border-t px-3 py-2 bg-muted/30">
          <p className="text-xs text-muted-foreground">
            Selected: <code className="bg-muted px-1 py-0.5 rounded">{selectedFile}</code>
          </p>
        </div>
      )}
    </div>
  )
}
