/**
 * Workspace Layout
 *
 * Phase 1.1 Day 2: Main workspace layout with resizable panels
 *
 * VS Code-like layout:
 * - Top: Navigation bar
 * - Left: Sidebar (files, clients, agents, git)
 * - Center: Main panel (editor/dashboard)
 * - Right: Terminal/AI/Debug
 * - Bottom: Tasks/Problems/Output
 */

'use client';

import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { WorkspaceNav } from './WorkspaceNav';
import { PanelContainer } from './PanelContainer';
import { DEFAULT_PANEL_SIZES } from '@/lib/workspace/constants';

interface WorkspaceLayoutProps {
  children?: React.ReactNode;
  sidebar?: React.ReactNode;
  rightPanel?: React.ReactNode;
  bottomPanel?: React.ReactNode;
  onSaveWorkspace?: () => void;
  onLoadWorkspace?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenSettings?: () => void;
}

export function WorkspaceLayout({
  children,
  sidebar,
  rightPanel,
  bottomPanel,
  onSaveWorkspace,
  onLoadWorkspace,
  onOpenCommandPalette,
  onOpenSettings,
}: WorkspaceLayoutProps) {
  return (
    <div className="h-screen flex flex-col">
      {/* Top Navigation Bar */}
      <WorkspaceNav
        onSave={onSaveWorkspace}
        onLoad={onLoadWorkspace}
        onOpenCommandPalette={onOpenCommandPalette}
        onOpenSettings={onOpenSettings}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          {/* Left Sidebar */}
          <Panel
            defaultSize={DEFAULT_PANEL_SIZES.sidebar.width}
            minSize={DEFAULT_PANEL_SIZES.sidebar.minWidth}
            maxSize={DEFAULT_PANEL_SIZES.sidebar.maxWidth}
            collapsible
          >
            <PanelContainer>
              {sidebar || (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p className="text-sm">Sidebar</p>
                </div>
              )}
            </PanelContainer>
          </Panel>

          <PanelResizeHandle className="w-1 bg-border hover:bg-primary transition-colors" />

          {/* Center + Right Area */}
          <Panel>
            <PanelGroup direction="horizontal">
              {/* Main Editor/Dashboard Area */}
              <Panel minSize={40}>
                <PanelGroup direction="vertical">
                  {/* Main Content */}
                  <Panel defaultSize={70} minSize={30}>
                    <PanelContainer>
                      {children || (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          <div className="text-center">
                            <p className="text-lg mb-2">Welcome to GEO-SEO Workspace</p>
                            <p className="text-sm">Open a file or select a client to get started</p>
                          </div>
                        </div>
                      )}
                    </PanelContainer>
                  </Panel>

                  <PanelResizeHandle className="h-1 bg-border hover:bg-primary transition-colors" />

                  {/* Bottom Panel */}
                  <Panel
                    defaultSize={30}
                    minSize={DEFAULT_PANEL_SIZES.bottom.minHeight}
                    maxSize={DEFAULT_PANEL_SIZES.bottom.maxHeight}
                    collapsible
                  >
                    <PanelContainer title="Output">
                      {bottomPanel || (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          <p className="text-sm">Tasks • Problems • Output • Git</p>
                        </div>
                      )}
                    </PanelContainer>
                  </Panel>
                </PanelGroup>
              </Panel>

              <PanelResizeHandle className="w-1 bg-border hover:bg-primary transition-colors" />

              {/* Right Panel (Terminal/AI) */}
              <Panel
                defaultSize={DEFAULT_PANEL_SIZES.right.width}
                minSize={DEFAULT_PANEL_SIZES.right.minWidth}
                maxSize={DEFAULT_PANEL_SIZES.right.maxWidth}
                collapsible
              >
                <PanelContainer title="Terminal">
                  {rightPanel || (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <p className="text-sm">Terminal • AI • Debug</p>
                    </div>
                  )}
                </PanelContainer>
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}
