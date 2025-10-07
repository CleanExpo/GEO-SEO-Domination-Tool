# Terminal Pro - VS Code-like IDE Enhancement

## Overview

Terminal Pro is a comprehensive upgrade to the AI Terminal that transforms it into a full-featured IDE experience similar to VS Code. Built with React, Next.js, and Monaco Editor, it provides professional-grade code editing and terminal management capabilities.

## Features

### 🗂️ File Browser
- **Tree View Navigation**: Hierarchical display of workspace files and folders
- **Expand/Collapse**: Interactive folder navigation
- **File Type Icons**: Visual indicators for different file types (JS, TS, JSON, images, etc.)
- **Search/Filter**: Quick file search within the workspace
- **Context Menu**: Right-click actions (Open, Delete, Download, New File/Folder)
- **Real-time Refresh**: Automatic updates when files change

**Component**: [`components/terminal/FileBrowser.tsx`](../components/terminal/FileBrowser.tsx)

### ✏️ Monaco Code Editor
- **Syntax Highlighting**: Support for 50+ programming languages
- **IntelliSense**: Smart code completion and suggestions
- **Multi-cursor Editing**: Advanced text manipulation
- **Find & Replace**: Powerful search capabilities
- **Diff View**: Compare file versions
- **Keyboard Shortcuts**:
  - `Ctrl+S`: Save file
  - `Ctrl+Z`: Undo
  - `Ctrl+F`: Find
  - `Ctrl+H`: Replace
- **Theme Support**: Light and dark modes
- **Status Bar**: Line/column position, language, encoding info
- **Minimap**: Code overview for navigation
- **Auto-save**: Tracks unsaved changes

**Component**: [`components/terminal/CodeEditor.tsx`](../components/terminal/CodeEditor.tsx)

### 🖥️ Multiple Terminal Tabs
- **Multi-tab Interface**: Run multiple terminal sessions simultaneously
- **Tab Management**: Create, close, rename, and duplicate terminals
- **Shell Selection**: Support for PowerShell, CMD, and Bash
- **Keyboard Shortcuts**:
  - `Ctrl+T`: New terminal
  - `Ctrl+W`: Close terminal
  - `Ctrl+Tab`: Switch terminals
- **Session Persistence**: Maintains terminal state
- **Context Menu**: Additional options per terminal tab

**Component**: [`components/terminal/TerminalTabs.tsx`](../components/terminal/TerminalTabs.tsx)

### 📤 Drag-and-Drop File Upload
- **Visual Drop Zone**: Overlay appears when dragging files
- **Multiple File Support**: Upload multiple files at once
- **File Validation**: Type and size checking
- **Progress Tracking**: Real-time upload progress bars
- **Upload Queue**: Manage multiple concurrent uploads
- **Error Handling**: Clear feedback for failed uploads
- **Max File Size**: Configurable limit (default 50MB)

**Component**: [`components/terminal/FileUploadZone.tsx`](../components/terminal/FileUploadZone.tsx)

### 📐 Resizable Split Panels
- **Three-Panel Layout**:
  1. **Sidebar**: File browser (15-35% width)
  2. **Editor**: Code editor (20%+ height)
  3. **Terminal**: Terminal tabs (15%+ height)
- **Drag-to-Resize**: Smooth panel resizing with handles
- **Layout Presets**:
  - **IDE (Balanced)**: 20% sidebar, 50% editor, 30% terminal
  - **Editor Focus**: 15% sidebar, 65% editor, 20% terminal
  - **Terminal Focus**: 15% sidebar, 25% editor, 60% terminal
- **Collapsible Sidebar**: Toggle visibility
- **Responsive**: Adapts to window size

**Library**: `react-resizable-panels`

## Architecture

### Page Structure
```typescript
app/sandbox/terminal-pro/page.tsx
├── Top Toolbar
│   ├── Brand Name
│   ├── Workspace Selector
│   └── Layout Controls
├── Resizable Panel Group (Horizontal)
│   ├── File Browser Panel
│   ├── Resize Handle
│   └── Editor/Terminal Panel Group (Vertical)
│       ├── Code Editor Panel
│       │   ├── File Tabs
│       │   └── Monaco Editor
│       ├── Resize Handle
│       └── Terminal Tabs Panel
└── File Upload Zone (Overlay)
```

### API Routes

#### File Operations
**`GET /api/terminal/files`**
- List files and directories in workspace
- Returns tree structure with metadata

**`GET /api/terminal/files/content`**
- Read file content by path
- Returns UTF-8 encoded content

**`PUT /api/terminal/files`**
- Save file content
- Updates existing files

**`POST /api/terminal/files`**
- Create new file or directory
- Supports nested creation

**`DELETE /api/terminal/files`**
- Delete file or directory
- Recursive deletion for directories

#### File Upload
**`POST /api/terminal/upload`**
- Upload files via multipart/form-data
- Saves to workspace directory
- Returns uploaded file path

### File System Structure
```
workspaces/
└── {clientId}/
    └── {workspaceId}/
        ├── file1.js
        ├── folder1/
        │   ├── file2.ts
        │   └── file3.json
        └── folder2/
            └── ...
```

**Base Path**: `D:/GEO_SEO_Domination-Tool/workspaces`

## Installation

### Dependencies
```json
{
  "@monaco-editor/react": "^4.7.0",
  "react-resizable-panels": "^3.0.6",
  "@xterm/xterm": "^5.5.0",
  "@xterm/addon-fit": "^0.10.0"
}
```

Install with:
```bash
npm install @monaco-editor/react react-resizable-panels
```

## Usage

### Basic Setup
1. Navigate to `/sandbox/terminal-pro` in your app
2. Files will load from your workspace automatically
3. Click files to open in editor
4. Use bottom terminal for commands

### Opening Files
- **Click** a file in the file browser to open
- Files open in new tabs
- Switch tabs to view different files
- Close tabs with `×` button

### Editing Files
1. Make changes in Monaco editor
2. Save with `Ctrl+S` or Save button
3. "Unsaved" badge appears when modified
4. Auto-saves on tab close (with confirmation)

### Managing Terminals
- Click `+` to create new terminal
- Use dropdown menu for more options (rename, duplicate, close)
- Switch between terminals with tabs
- Each terminal is independent

### Uploading Files
- Drag files from desktop onto page
- Drop zone overlay appears
- Upload progress shows in bottom-right panel
- Files appear in file browser after upload

### Layout Customization
- Click "Layout" dropdown in toolbar
- Choose preset or resize manually
- Drag panel handles to adjust sizes
- Hide/show sidebar as needed

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+S` | Save current file |
| `Ctrl+T` | New terminal |
| `Ctrl+W` | Close terminal |
| `Ctrl+Tab` | Next terminal |
| `Ctrl+B` | Toggle sidebar |
| `Ctrl+Z` | Undo (in editor) |
| `Ctrl+F` | Find (in editor) |
| `Ctrl+H` | Replace (in editor) |

## Security Features

### Path Traversal Prevention
All file operations validate that paths stay within the workspace:
```typescript
if (!fullPath.startsWith(workspacePath)) {
  return Response.json({ error: 'Invalid path' }, { status: 403 });
}
```

### File Type Validation
Upload component can restrict file types:
```typescript
allowedTypes={['js', 'ts', 'json', 'md']}
```

### File Size Limits
Maximum upload size configurable (default 50MB):
```typescript
maxFileSize={50} // in MB
```

### Client Isolation
Each client has isolated workspace directory:
```
workspaces/{clientId}/{workspaceId}/
```

## Configuration

### Workspace Path
Edit in API routes:
```typescript
const BASE_WORKSPACE_PATH = 'D:/GEO_SEO_Domination-Tool/workspaces';
```

### Editor Settings
Customize Monaco in `CodeEditor.tsx`:
```typescript
editor.updateOptions({
  fontSize: 14,
  fontFamily: '"Fira Code", "Cascadia Code", Consolas, monospace',
  fontLigatures: true,
  minimap: { enabled: true },
  wordWrap: 'on',
  tabSize: 2
});
```

### Terminal Settings
Customize xterm in `TerminalTabs.tsx`:
```typescript
const terminal = new Terminal({
  fontSize: 14,
  fontFamily: '"Cascadia Code", monospace',
  theme: { /* custom colors */ }
});
```

## Performance Optimization

### Monaco Editor
- Lazy loads language definitions
- Virtual scrolling for large files
- Incremental parsing
- Web worker for syntax highlighting

### File Browser
- Recursive tree loading
- Memoized search filtering
- Virtual scrolling (via ScrollArea)

### Terminal
- Efficient rendering with xterm.js
- FitAddon for automatic sizing
- WebLinksAddon for clickable links

## Troubleshooting

### Monaco not loading
- Ensure `@monaco-editor/react` is installed
- Check browser console for errors
- Verify webpack/Next.js config allows workers

### Files not appearing
- Check workspace path exists
- Verify API route permissions
- Check browser network tab for errors

### Upload failing
- Verify file size under limit
- Check disk space
- Verify write permissions on workspace directory

### Terminal not working
- Ensure terminal service is running
- Check WebSocket connection
- Verify PowerShell/CMD is available

## Future Enhancements

### Planned Features
- [ ] Git integration (status, commit, push)
- [ ] Live collaboration (multi-user editing)
- [ ] Extension marketplace
- [ ] Debugger integration
- [ ] Test runner UI
- [ ] Search across files (Ctrl+Shift+F)
- [ ] Terminal history persistence
- [ ] Workspace templates
- [ ] Settings panel
- [ ] Custom themes

### Known Limitations
- No symlink support
- Terminal input limited to REST API (not true PTY)
- No binary file preview
- Max file size 50MB
- Windows-only terminal shells currently

## Contributing

To extend Terminal Pro:

1. **Add new file type support**:
   - Update `getFileIcon()` in `FileBrowser.tsx`
   - Add language mapping in `CodeEditor.tsx`

2. **Add keyboard shortcuts**:
   - Add to window event listener in `page.tsx`
   - Update documentation

3. **Customize theme**:
   - Modify Monaco theme in `CodeEditor.tsx`
   - Update xterm.js theme in `TerminalTabs.tsx`

4. **Add API endpoints**:
   - Create route in `app/api/terminal/`
   - Follow existing security patterns

## Related Components

- **AI Terminal**: Basic terminal interface ([`/sandbox/terminal`](../app/sandbox/terminal/page.tsx))
- **AI Agents**: Autonomous agent dashboard ([`/sandbox/agents`](../app/sandbox/agents/page.tsx))
- **Tactical Coding**: Plan-Build-Ship workflow ([`/tactical`](../app/tactical/page.tsx))

## Support

For issues or questions:
1. Check documentation above
2. Review component source code
3. Check API route implementations
4. Open GitHub issue with reproduction steps

---

**Version**: 1.0.0
**Last Updated**: 2025-01-07
**Maintainer**: GEO-SEO Development Team
