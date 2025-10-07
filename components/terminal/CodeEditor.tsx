'use client';

/**
 * Monaco Code Editor Component
 *
 * Full-featured code editor with:
 * - Syntax highlighting for 50+ languages
 * - IntelliSense and autocomplete
 * - Multi-cursor editing
 * - Find and replace
 * - Diff view support
 * - Customizable themes
 */

import { useState, useEffect, useRef } from 'react';
import Editor, { Monaco, OnMount } from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import { useTheme } from 'next-themes';
import {
  Save,
  X,
  RotateCcw,
  Download,
  FileCode,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface CodeEditorProps {
  file?: {
    name: string;
    path: string;
    content: string;
    language?: string;
  };
  onClose?: () => void;
  onSave?: (content: string) => void;
  readOnly?: boolean;
  workspaceId?: string;
  clientId?: string;
}

export function CodeEditor({
  file,
  onClose,
  onSave,
  readOnly = false,
  workspaceId,
  clientId
}: CodeEditorProps) {
  const { theme } = useTheme();
  const { toast } = useToast();
  const [content, setContent] = useState(file?.content || '');
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);

  useEffect(() => {
    if (file?.content !== undefined) {
      setContent(file.content);
      setHasChanges(false);
    }
  }, [file]);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Configure Monaco editor settings
    editor.updateOptions({
      fontSize: 14,
      fontFamily: '"Fira Code", "Cascadia Code", Consolas, monospace',
      fontLigatures: true,
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      tabSize: 2,
      automaticLayout: true,
      suggestOnTriggerCharacters: true,
      quickSuggestions: true,
      formatOnPaste: true,
      formatOnType: true
    });

    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSave();
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyZ, () => {
      editor.trigger('keyboard', 'undo', {});
    });
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setContent(value);
      setHasChanges(value !== file?.content);
    }
  };

  const handleSave = async () => {
    if (!file || !hasChanges) return;

    setSaving(true);
    try {
      // Call parent save handler
      if (onSave) {
        await onSave(content);
      } else {
        // Default: save via API
        const response = await fetch('/api/terminal/files', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workspaceId,
            clientId,
            path: file.path,
            content
          })
        });

        const data = await response.json();

        if (data.success) {
          setHasChanges(false);
          toast({
            title: 'File saved',
            description: `${file.name} has been saved successfully`
          });
        } else {
          throw new Error(data.error || 'Failed to save file');
        }
      }
    } catch (error: any) {
      toast({
        title: 'Save failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUndo = () => {
    editorRef.current?.trigger('keyboard', 'undo', {});
  };

  const handleDownload = () => {
    if (!file) return;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'File downloaded',
      description: `${file.name} has been downloaded`
    });
  };

  const getLanguage = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'go': 'go',
      'rs': 'rust',
      'php': 'php',
      'rb': 'ruby',
      'swift': 'swift',
      'kt': 'kotlin',
      'scala': 'scala',
      'sh': 'shell',
      'bash': 'shell',
      'ps1': 'powershell',
      'sql': 'sql',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'less': 'less',
      'json': 'json',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yaml',
      'md': 'markdown',
      'txt': 'plaintext'
    };

    return languageMap[ext || ''] || 'plaintext';
  };

  if (!file) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-background text-muted-foreground">
        <FileCode className="h-24 w-24 mb-4 opacity-50" />
        <p className="text-lg font-medium">No file open</p>
        <p className="text-sm">Select a file from the explorer to start editing</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Editor Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/50">
        <div className="flex items-center gap-3">
          <FileCode className="h-4 w-4" />
          <span className="text-sm font-medium">{file.name}</span>
          {hasChanges && (
            <Badge variant="secondary" className="text-xs">
              <AlertCircle className="h-3 w-3 mr-1" />
              Unsaved
            </Badge>
          )}
          {readOnly && (
            <Badge variant="outline" className="text-xs">
              Read-only
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUndo}
            disabled={readOnly}
            title="Undo (Ctrl+Z)"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            title="Download file"
          >
            <Download className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || saving || readOnly}
            title="Save (Ctrl+S)"
          >
            <Save className="h-4 w-4" />
          </Button>

          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              title="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 relative">
        <Editor
          height="100%"
          language={file.language || getLanguage(file.name)}
          value={content}
          theme={theme === 'dark' ? 'vs-dark' : 'light'}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          options={{
            readOnly,
            lineNumbers: 'on',
            rulers: [80, 120],
            renderWhitespace: 'selection',
            bracketPairColorization: { enabled: true },
            guides: {
              bracketPairs: true,
              indentation: true
            }
          }}
          loading={
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Loading editor...</p>
              </div>
            </div>
          }
        />
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-1 border-t bg-muted/30 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>
            {getLanguage(file.name).charAt(0).toUpperCase() + getLanguage(file.name).slice(1)}
          </span>
          <span>UTF-8</span>
          <span>LF</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Ln {editorRef.current?.getPosition()?.lineNumber || 1}</span>
          <span>Col {editorRef.current?.getPosition()?.column || 1}</span>
          <span>{content.split('\n').length} lines</span>
        </div>
      </div>
    </div>
  );
}
