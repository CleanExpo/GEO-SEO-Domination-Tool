'use client'

import { useState, useEffect } from 'react'
import { ExternalLink, RefreshCw, Monitor, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface LivePreviewProps {
  previewUrl: string | null
  sessionId: string
}

interface ConsoleLog {
  type: 'log' | 'warn' | 'error'
  message: string
  timestamp: number
}

interface NetworkRequest {
  method: string
  url: string
  status: number
  duration: number
}

export default function LivePreview({ previewUrl, sessionId }: LivePreviewProps) {
  const [iframeKey, setIframeKey] = useState(0)
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([])
  const [networkRequests, setNetworkRequests] = useState<NetworkRequest[]>([])
  const [loading, setLoading] = useState(false)

  const refreshPreview = () => {
    setLoading(true)
    setIframeKey((prev) => prev + 1)
    setTimeout(() => setLoading(false), 1000)
  }

  const openInNewTab = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank')
    }
  }

  // Simulate console logs (in production, this would come from iframe postMessage)
  useEffect(() => {
    if (!previewUrl) return

    const interval = setInterval(() => {
      // Mock console logs for demonstration
      // In production, capture via iframe communication
    }, 5000)

    return () => clearInterval(interval)
  }, [previewUrl])

  if (!previewUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <Monitor className="h-16 w-16 text-muted-foreground opacity-50 mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Preview Available</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Deploy your code to see a live preview here
        </p>
        <div className="text-xs text-muted-foreground space-y-1">
          <p>✓ Create a task</p>
          <p>✓ Wait for code generation</p>
          <p>✓ Preview will appear automatically</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground truncate max-w-[200px]">
            {previewUrl.replace('https://', '')}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshPreview}
            disabled={loading}
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="ghost" size="sm" onClick={openInNewTab}>
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Tabs: Preview, Console, Network */}
      <Tabs defaultValue="preview" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="console">
            Console
            {consoleLogs.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-primary/20 text-primary text-xs rounded">
                {consoleLogs.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="network">
            Network
            {networkRequests.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-primary/20 text-primary text-xs rounded">
                {networkRequests.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Preview Tab */}
        <TabsContent value="preview" className="flex-1 m-0 data-[state=active]:flex">
          <div className="flex-1 relative bg-white">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
            <iframe
              key={iframeKey}
              src={previewUrl}
              className="w-full h-full border-0"
              title="Live Preview"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
            />
          </div>
        </TabsContent>

        {/* Console Tab */}
        <TabsContent value="console" className="flex-1 m-0 overflow-auto">
          <div className="p-3 font-mono text-xs space-y-1">
            {consoleLogs.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No console logs yet</p>
                </div>
              </div>
            ) : (
              consoleLogs.map((log, index) => (
                <div
                  key={index}
                  className={`p-2 rounded ${
                    log.type === 'error'
                      ? 'bg-destructive/10 text-destructive'
                      : log.type === 'warn'
                      ? 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400'
                      : 'bg-muted'
                  }`}
                >
                  <span className="opacity-60 mr-2">
                    [{new Date(log.timestamp).toLocaleTimeString()}]
                  </span>
                  {log.message}
                </div>
              ))
            )}
          </div>
        </TabsContent>

        {/* Network Tab */}
        <TabsContent value="network" className="flex-1 m-0 overflow-auto">
          <div className="p-3">
            {networkRequests.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <Monitor className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No network requests yet</p>
                </div>
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead className="border-b">
                  <tr>
                    <th className="text-left p-2">Method</th>
                    <th className="text-left p-2">URL</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {networkRequests.map((req, index) => (
                    <tr key={index} className="border-b hover:bg-muted">
                      <td className="p-2 font-semibold">{req.method}</td>
                      <td className="p-2 truncate max-w-xs">{req.url}</td>
                      <td className="p-2">
                        <span
                          className={`px-2 py-0.5 rounded ${
                            req.status >= 200 && req.status < 300
                              ? 'bg-green-500/20 text-green-700 dark:text-green-400'
                              : req.status >= 400
                              ? 'bg-destructive/20 text-destructive'
                              : 'bg-muted'
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>
                      <td className="p-2">{req.duration}ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
