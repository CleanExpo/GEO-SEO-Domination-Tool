/**
 * Workspace Page
 *
 * Phase 1.1 Day 5-7: Connected to WorkspaceContext
 *
 * This is the unified IDE workspace where all tools come together
 */

'use client';

import { WorkspaceLayout } from '@/components/workspace/WorkspaceLayout';
import { UnifiedSidebar } from '@/components/workspace/UnifiedSidebar';
import { MainPanel } from '@/components/workspace/MainPanel';
import { RightPanel } from '@/components/workspace/RightPanel';
import { BottomPanel } from '@/components/workspace/BottomPanel';
import { useWorkspace } from '@/lib/workspace/WorkspaceContext';

export default function WorkspacePage() {
  const { saveWorkspace, loadWorkspace } = useWorkspace();

  const handleSaveWorkspace = async () => {
    try {
      await saveWorkspace();
      console.log('Workspace saved successfully');
    } catch (error) {
      console.error('Failed to save workspace:', error);
    }
  };

  const handleLoadWorkspace = () => {
    console.log('Open load workspace dialog');
    // Will show workspace selector dialog in Phase 1.2
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
