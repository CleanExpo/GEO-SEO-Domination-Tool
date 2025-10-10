/**
 * Workspace Layout Wrapper
 *
 * Phase 1.1 Day 5-7: Wrapped with WorkspaceProvider for global state
 */

import { WorkspaceProvider } from '@/lib/workspace/WorkspaceContext';

export const metadata = {
  title: 'Workspace - GEO-SEO Domination Tool',
  description: 'Unified IDE workspace for SEO and marketing operations',
};

export default function WorkspaceRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WorkspaceProvider>
      {children}
    </WorkspaceProvider>
  );
}
