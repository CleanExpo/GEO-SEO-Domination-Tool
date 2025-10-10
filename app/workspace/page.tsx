/**
 * Workspace Page
 *
 * Phase 1.1 Day 2: Main workspace route
 *
 * This is the unified IDE workspace where all tools come together
 */

'use client';

import { WorkspaceLayout } from '@/components/workspace/WorkspaceLayout';
import { UnifiedSidebar } from '@/components/workspace/UnifiedSidebar';
import { MainPanel } from '@/components/workspace/MainPanel';
import { RightPanel } from '@/components/workspace/RightPanel';
import { BottomPanel } from '@/components/workspace/BottomPanel';

export default function WorkspacePage() {
  const handleSaveWorkspace = () => {
    console.log('Save workspace');
    // Will be implemented in Phase 1.2
  };

  const handleLoadWorkspace = () => {
    console.log('Load workspace');
    // Will be implemented in Phase 1.2
  };

  const handleOpenCommandPalette = () => {
    console.log('Open command palette');
    // Will be implemented in Phase 2.1
  };

  const handleOpenSettings = () => {
    console.log('Open settings');
    // Navigate to settings
  };

  return (
    <WorkspaceLayout
      sidebar={<UnifiedSidebar />}
      rightPanel={<RightPanel />}
      bottomPanel={<BottomPanel />}
      onSaveWorkspace={handleSaveWorkspace}
      onLoadWorkspace={handleLoadWorkspace}
      onOpenCommandPalette={handleOpenCommandPalette}
      onOpenSettings={handleOpenSettings}
    >
      <MainPanel />
    </WorkspaceLayout>
  );
}
