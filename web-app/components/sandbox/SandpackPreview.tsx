'use client'

import { Sandpack } from '@codesandbox/sandpack-react'
import { Monitor } from 'lucide-react'

interface SandpackPreviewProps {
  files: Record<string, string>
  sessionId: string
}

export default function SandpackPreview({ files, sessionId }: SandpackPreviewProps) {
  // Convert file tree to Sandpack format
  const sandpackFiles = Object.keys(files).length > 0
    ? files
    : {
        '/App.js': {
          code: `export default function App() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      flexDirection: 'column',
      gap: '1rem',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <h1>MetaCoder Sandbox</h1>
      <p>Generate code to see live preview here</p>
    </div>
  )
}`,
        },
      }

  if (Object.keys(files).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <Monitor className="h-16 w-16 text-muted-foreground opacity-50 mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Code Generated Yet</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Submit a task to generate code and see live preview
        </p>
        <div className="text-xs text-muted-foreground space-y-1">
          <p>✓ In-browser code execution</p>
          <p>✓ Real-time updates</p>
          <p>✓ No deployment needed</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full w-full">
      <Sandpack
        template="react"
        files={sandpackFiles}
        theme="dark"
        options={{
          showNavigator: true,
          showTabs: true,
          showLineNumbers: true,
          showInlineErrors: true,
          wrapContent: true,
          editorHeight: '100%',
          editorWidthPercentage: 50,
          autorun: true,
          autoReload: true,
          recompileMode: 'immediate',
          recompileDelay: 300,
        }}
        customSetup={{
          dependencies: {
            'react': '^18.0.0',
            'react-dom': '^18.0.0',
          },
        }}
      />
    </div>
  )
}
